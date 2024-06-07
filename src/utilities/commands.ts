import { Vector3, Matrix } from "@babylonjs/core/Maths";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh"
import { Scene } from "@babylonjs/core/scene";

interface Command {
    name: string;
    execute(): void;
    undo(): void;
}

class CommandStack {
    private stack: Command[];

    constructor() {
        this.stack = [];
    }

    execute(command: Command) {
        command.execute();
        this.stack.push(command);
    }

    undo() {
        const command = this.stack.pop();
        if (command) {
            command.undo();
        }
    }
}

/**
 * Command for geometric transformations
 */
export class TransformCommand implements Command{
    name: string;
    node: TransformNode;
    matrix: Matrix;   // probably useless because it does not work as reference
    oldMat: Matrix;
    newMat: Matrix;

    /**
     * Creates a Command for the transformation of a node
     * @param nodeObj the node in the new transformation
     * @param oldWorldMatrix world matrix of the node before the transformation
     */
    constructor(nodeObj: TransformNode, oldWorldMatrix: Matrix) {
        this.name = 'Move Object';
        this.node = nodeObj;
        this.newMat = this.node.getWorldMatrix().clone();
        this.matrix = oldWorldMatrix;
        this.oldMat = this.matrix.clone();
    }

    execute(): void {
        this.node.freezeWorldMatrix(this.newMat.clone());
        this.matrix = this.newMat.clone();
    }

    undo(): void {
        this.node.freezeWorldMatrix(this.oldMat.clone());
        this.matrix = this.oldMat.clone();
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
        const hit = this.scene.pickWithRay(this.scene.activeCamera.getForwardRay());    //spawn
        this.obj.position = this.obj.position.add(hit.pickedPoint);
        if (this.obj.getHierarchyBoundingVectors(true).min.y < 0) {
            this.obj.position = this.obj.position.add(new Vector3(0, -this.obj.getHierarchyBoundingVectors(true).min.y, 0));
        }
    }

    undo(): void {
        
        const removeFromScene = (obj: any) => {
            if (obj.getClassName() == 'TransformNode') {
                this.scene.removeTransformNode(obj as TransformNode);
                obj.getChildren().forEach( c => {
                    removeFromScene(c);
                });
            }
            else if (obj.getClassName() == 'Mesh' || obj.getClassName() == 'AbstractMesh') {
                this.scene.removeMesh(obj as AbstractMesh, true);
            }
        }
        //this.obj.getScene().removeTransformNode(this.obj);
        //this.obj.getScene().removeMesh(this.obj as AbstractMesh, true);
        removeFromScene(this.obj);
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
        this.obj.getScene().removeTransformNode(this.obj);
        this.obj.getScene().removeMesh(this.obj as AbstractMesh, true);
    }

    undo(): void {
        const addToScene = (obj: any) => {
            if (obj.getClassName() == 'TransformNode')
            {
                this.scene.addTransformNode(obj as TransformNode);
                obj.getChildren().forEach(c => {
                    addToScene(c)
                });
            }
            else if (obj.getClassName() == 'Mesh' || obj.getClassName() == 'AbstractMesh') {
                this.scene.addMesh(obj as AbstractMesh, true)
            }
        }
        addToScene(this.obj)
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
