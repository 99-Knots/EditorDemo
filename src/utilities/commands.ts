import { Matrix, Quaternion } from "@babylonjs/core/Maths";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh"
import { Scene } from "@babylonjs/core/scene";

import { TransformOrient } from "../components/GizmoManager";

const handleObjectInScene = (obj: any, scene: Scene, remove?: boolean) => {
    if (obj.getClassName() == 'TransformNode')
    {
        if (remove){
            scene.removeTransformNode(obj as TransformNode);
        }
        else {
            if (!scene.transformNodes.find(n => n==obj))
                scene.addTransformNode(obj as TransformNode);
        }
        obj.getChildren().forEach(c => {
            handleObjectInScene(c, scene, remove);
        });
    }
    else if (obj.getClassName() == 'Mesh' || obj.getClassName() == 'AbstractMesh') {
        if (remove) {
            scene.removeMesh(obj as AbstractMesh, true);
        }
        else {
            if (!scene.meshes.find(m => m==obj)) //avoid adding mesh twice
                scene.addMesh(obj as AbstractMesh, true);
        }
    }
}


interface Command {
    name: string;
    execute(): void;
    undo(): void;
}

class CommandStack {
    private activeStack: Command[];
    private redoStack: Command[];

    constructor() {
        this.activeStack = [];
        this.redoStack = [];
    }

    execute(command: Command) {
        command.execute();
        this.activeStack.push(command);
        this.redoStack.length = 0;
    }

    undo() {
        const command = this.activeStack.pop();
        if (command) {
            command.undo();
            this.redoStack.push(command);
        }
    }

    redo() {
        const command = this.redoStack.pop();
        if (command) {
            command.execute();
            this.activeStack.push(command);
        }
    }

    isEmpty() {
        return !this.activeStack.length;
    }

    isRedoEmpty() {
        return !this.redoStack.length;
    }
}

/**
 * Command for geometric transformations
 */
export class TransformCommand implements Command{
    name: string;
    node: TransformNode;
    oldMat: Matrix;
    newMat: Matrix;
    oldOrient: Quaternion;
    newOrient: Quaternion;

    /**
     * Creates a Command for the transformation of a node
     * @param nodeObj the node in the new transformation
     * @param oldTransform world matrix and orientation of the node before the transformation
     */
    constructor(nodeObj: TransformNode, oldTransform: TransformOrient) {
        this.name = 'Move Object';
        this.node = nodeObj;
        this.newMat = this.node.getWorldMatrix().clone();
        this.oldMat = oldTransform.matrix.clone();
        this.newOrient = this.node.rotationQuaternion.clone();
        this.oldOrient = oldTransform.orientation.clone();
    }

    execute(): void {
        this.node.rotationQuaternion = this.newOrient.clone();  // must be done before freezeWorldMatrix, otherwise world matrix get's overwritten 
        this.node.freezeWorldMatrix(this.newMat.clone());
    }

    undo(): void {
        this.node.rotationQuaternion = this.oldOrient.clone();
        this.node.freezeWorldMatrix(this.oldMat.clone());
    }
}

export class CreateObjectCommand implements Command {
    name: string;
    obj: TransformNode;
    scene: Scene

    /**
     * Creates a Command for handling a created object
     * @param obj object that was newly created
     */
    constructor(obj: TransformNode) {
        this.name = 'Create Object ' + obj.name;
        this.obj = obj;
        this.scene = obj.getScene();
    }

    execute(): void {
        handleObjectInScene(this.obj, this.scene);
    }

    undo(): void {
        handleObjectInScene(this.obj, this.scene, true);
    }
}

/**
 * Command for deleting objects from a scene
 */
export class DeleteObjectCommand implements Command {
    name: string;
    obj: TransformNode;
    scene: Scene;

    /**
     * Creates a command for handling the deletion of objects from a scene
     * @param obj object that is to be deleted
     */
    constructor(obj: TransformNode) {
        this.name = 'Delete Object ' + obj.name;
        this.obj = obj;
        this.scene = obj.getScene();
    }

    execute(): void {
        handleObjectInScene(this.obj, this.scene, true);
    }

    undo(): void {
        handleObjectInScene(this.obj, this.scene);
    }
}

/**
 * Command for handling multiple Commands as one unit
 */
export class GroupCommand implements Command {
    name: string;
    commandList: Command[];

    /**
     * Create a Command for treating multiple Commands as a single unit on the Command Stack
     * @param commandList list of simultanious Commands
     */
    constructor(commandList: Command[]) {
        this.name = 'group action';
        this.commandList = commandList;
    }

    execute(): void {
        this.commandList.forEach( c => { c.execute(); });
    }

    undo(): void {
        this.commandList.forEach( c => { c.undo(); })
    }
}

let _commandStack: CommandStack | null = null;

export const Commands = () => {
    if (_commandStack === null) {
        _commandStack = new CommandStack();
    }
    return _commandStack;
}
