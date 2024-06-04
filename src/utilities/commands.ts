import { Vector3, Matrix } from "@babylonjs/core/Maths";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

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
