import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3, Quaternion, Color3, Matrix } from "@babylonjs/core/Maths/math";
import { Scene } from "@babylonjs/core/scene";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering";
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { Gizmo, PositionGizmo, RotationGizmo, BoundingBoxGizmo } from "@babylonjs/core/Gizmos";

import { Commands, TransformCommand, GroupCommand } from '../utilities/commands';

export enum GizmoMode {
    Translate,
    Rotate,
    Scale
}

export enum GizmoSpace {
    World,
    Local
}

export type Transformation = {
    position: Vector3,
    rotation: Quaternion,
    scale: Vector3,
}


const TranslationMatrix = (v: Vector3) => {
    const m = Matrix.Identity();
    m.setRowFromFloats(3, v.x, v.y, v.z, 1);
    return m;
}


export class GizmoManager {

    private root: TransformNode;                            // actual attached node of the gizmo; serves to transfer changes to the meshes
    private initialTransform: Transformation;               // transformation of the root before an axis gets dragged; to calculate the difference between start and end of drag
    private inWorldSpace: boolean;                          // indicates if the gizmo is currently using world orientation
    private nodes: [TransformNode, Matrix][];               // list of meshes and their transformatin currently attached to the gizmo
    private positionGizmo: PositionGizmo;                   // gizmo for translation
    private rotationGizmo: RotationGizmo;                   // gizmo for rotation
    //private boundingBoxGizmo: CustomBoundingBoxGizmo;     // gizmo for scaling
    private currentGizmo: Gizmo;                            // the gizmo currently active
    private layer: UtilityLayerRenderer;
    private hlLayer: HighlightLayer;


    constructor(scene: Scene, thickness?: number, scale?: number) {
        this.root = new TransformNode('GizmoRoot', scene);
        this.layer = new UtilityLayerRenderer(scene);
        this.hlLayer = new HighlightLayer('SelectionHLLayer', scene);

        this.root.rotationQuaternion = new Quaternion(0, 0, 0, 1);

        this.initialTransform = {
            position:   this.root.position.clone(),
            rotation:   this.root.rotationQuaternion.clone(),
            scale:      this.root.scaling.clone(),
        }


        this.inWorldSpace = false;
        this.nodes = [];

        this.positionGizmo = new PositionGizmo(this.layer, thickness ?? 1);
        this.positionGizmo.scaleRatio = scale ?? 1;
        this.initPositionGizmo();

        this.rotationGizmo = new RotationGizmo(this.layer, undefined, undefined, thickness ?? 1);
        this.rotationGizmo.scaleRatio = scale ?? 1;
        this.initRotationGizmo();

        //this.boundingBoxGizmo = new CustomBoundingBoxGizmo(bjs.Color3.Gray(), utilLayer, this);
        //this.boundingBoxGizmo.attachedNode = this.root;

        this.changeMode(GizmoMode.Translate);
    }

    public changeMode(mode: GizmoMode) {
        this.rotationGizmo.attachedNode = null;
        this.positionGizmo.attachedNode = null;
        //this.boundingBoxGizmo.attachedNode = null;
        this.root.scaling = Vector3.One();

        switch (mode) {     // select the relevant gizmo
            case GizmoMode.Rotate:
                this.currentGizmo = this.rotationGizmo;
                break;
            case GizmoMode.Translate:
                this.currentGizmo = this.positionGizmo;
                break;
            case GizmoMode.Scale:
                //this.currentGizmo = this.boundingBoxGizmo;
                break;
        }
        if (this.nodes.length > 0) {
            this.currentGizmo.attachedNode = this.root;
            //this.boundingBoxGizmo.updateGizmo();
        }
    }

    public setRootPosition() {
        if (this.nodes.length > 0) {
            let minmax = this.nodes[0][0].getHierarchyBoundingVectors(true);
            let min = minmax.min;
            let max = minmax.max

            this.nodes.forEach(n => {
                minmax = n[0].getHierarchyBoundingVectors(true);
                min.minimizeInPlace(minmax.min);
                max.maximizeInPlace(minmax.max);
            });
            this.root.position = min.add(max).scale(0.5);
        }
    }

    public setRootRotation() {
        if (this.nodes.length == 1 && !this.inWorldSpace) {
            this.root.rotationQuaternion = Quaternion.FromRotationMatrix(this.nodes[0][1].getRotationMatrix())
        }
        else {
            this.root.rotationQuaternion.set(0, 0, 0, 1);
        }
    }

    public addNode(node: TransformNode) {
        if (!this.nodes.find(n => n[0].id == node.id)) {    // only add node if it wasn't already attached
            node.computeWorldMatrix(true);
            // add the node to the list of attached nodes, together with its world matrix
            if (node.rotationQuaternion == null) {
                node.rotationQuaternion = Quaternion.Identity();
            }
            this.nodes.push([node, node.getWorldMatrix().clone()]);
            this.hlLayer.addMesh(node as Mesh, new Color3(1, 0.9, 0));
            this.setRootPosition();
            this.setRootRotation();
            this.currentGizmo.attachedNode = this.root;
        }
        //if (this.currentGizmo == this.boundingBoxGizmo) {   // if scaling is selected update the bounding box
        //    this.boundingBoxGizmo.updateGizmo();
        //}
    }

    public removeNode(node: TransformNode) {
        let i = this.nodes.indexOf(this.nodes.find(n => n[0].name == node.name));
        this.hlLayer.removeMesh(node as Mesh);
        this.nodes.splice(i, 1);
        if (this.nodes.length < 1) {
            this.currentGizmo.attachedNode = null;
        }

        this.setRootPosition();
        this.setRootRotation();
    }

    public removeAllNodes() {
        this.nodes = [];
        this.hlLayer.removeAllMeshes();
        this.currentGizmo.attachedNode = null;
    }

    private initPositionGizmo() {
        const startTranslateAxisDrag = () => {
            this.initialTransform.position = this.root.position.clone();
        }

        const onTranslateAxisDrag = () => {
            const dist = this.root.position.subtract(this.initialTransform.position)
            
            const Tmat = TranslationMatrix(dist);
            this.nodes.forEach(n => {
                n[0].freezeWorldMatrix(n[1].multiply(Tmat))
            });
        }

        const endTranslateAxisDrag = () => {
            const cList = [];
            this.nodes.forEach( n => { 
                cList.push(new TransformCommand(n[0], n[1])); 
                n[1] = n[0].getWorldMatrix().clone();
            });
            Commands().execute(new GroupCommand(cList));
        }

        this.positionGizmo.planarGizmoEnabled = true;

        this.positionGizmo.onDragStartObservable.add(startTranslateAxisDrag);
        this.positionGizmo.onDragObservable.add(onTranslateAxisDrag);
        this.positionGizmo.onDragEndObservable.add(endTranslateAxisDrag);
    }

    private initRotationGizmo() {

        const startRotationAxisDrag = () => {
            this.initialTransform.rotation = this.root.rotationQuaternion.clone();
        }

        const onRotationAxisDrag = () => {
            const qinv = this.initialTransform.rotation.invert();
            const quat = this.root.rotationQuaternion.multiply(qinv);   // quaternion for the rotation of the root since drag start

            //const axis = new BabylonJS.Vector3(quat.x, quat.y, quat.z).normalize();
            //const angle = Math.acos(quat.w) * 2;

            this.nodes.forEach(n => {   // reset to state before rotation and then do entire rotation anew
                const dist = n[1].getTranslation().add(this.root.position.subtract(n[1].getTranslation()));
                let Rmat = Matrix.Identity();
                quat.toRotationMatrix(Rmat);

                let mat = n[1].multiply(TranslationMatrix(dist.negate()));  // move to Origin
                mat = mat.multiply(Rmat);                                   // rotate
                mat = mat.multiply(TranslationMatrix(dist))                 // undo previous translation
                n[0].freezeWorldMatrix(mat);
            });
        }

        const endRotationAxisDrag = () => {
            const cList = [];
            this.nodes.forEach( n => { 
                cList.push(new TransformCommand(n[0], n[1])); 
                n[1] = n[0].getWorldMatrix().clone();
            });
            Commands().execute(new GroupCommand(cList));
            this.setRootRotation();     // reset the root to a neutral orientation
        }

        this.rotationGizmo.onDragStartObservable.add(startRotationAxisDrag);
        this.rotationGizmo.onDragObservable.add(onRotationAxisDrag);
        this.rotationGizmo.onDragEndObservable.add(endRotationAxisDrag);
    }

    
}