import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3, Quaternion, Color3 } from "@babylonjs/core/Maths/math";
import { Scene } from "@babylonjs/core/scene";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering";
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { Gizmo, PositionGizmo, RotationGizmo, BoundingBoxGizmo } from "@babylonjs/core/Gizmos";


export type Transformation = {
    position: Vector3,
    rotation: Quaternion,
    scaling: Vector3
}

export enum GizmoMode {
    Translate,
    Rotate,
    Scale
}

export enum GizmoSpace {
    World,
    Local
}


export class GizmoManager {

    private root: TransformNode;                            // actual attached node of the gizmo; serves to transfer changes to the meshes
    private initialTransform: Transformation;               // transformation of the root before an axis gets dragged; to calculate the difference between start and end of drag
    private inWorldSpace: boolean;                          // indicates if the gizmo is currently using world orientation
    private nodes: [TransformNode, Transformation][];       // list of meshes and their transformatin currently attached to the gizmo
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
            position: this.root.position.clone(),
            rotation: this.root.rotationQuaternion.clone(),
            scaling: this.root.scaling.clone(),
        }

        this.inWorldSpace = false;
        this.nodes = [];

        this.positionGizmo = new PositionGizmo(this.layer, thickness ?? 1);
        this.positionGizmo.scaleRatio = scale ?? 1;
        //this.initPositionGizmo();

        this.rotationGizmo = new RotationGizmo(this.layer, undefined, undefined, thickness ?? 1);
        this.rotationGizmo.scaleRatio = scale ?? 1;
        //this.initRotationGizmo();

        //this.boundingBoxGizmo = new CustomBoundingBoxGizmo(bjs.Color3.Gray(), utilLayer, this);
        //this.boundingBoxGizmo.attachedNode = this.root;

        this.changeMode(GizmoMode.Translate);


        console.log('Gizmo created')
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
            this.root.rotationQuaternion = this.nodes[0][1].rotation.clone()
        }
        else {
            this.root.rotationQuaternion.set(0, 0, 0, 1);
        }
    }

    public addNode(node: TransformNode) {
        if (!this.nodes.find(n => n[0].name == node.name)) {    // only add node if it wasn't already attached
            node.computeWorldMatrix(true);
            // add the node to the list of attached nodes, together with its world matrix
            if (node.rotationQuaternion == null) {
                node.rotationQuaternion = Quaternion.Identity();
            }
            this.nodes.push([node, {
                position: node.position.clone(),
                rotation: node.rotationQuaternion.clone(),
                scaling: node.scaling.clone()
            }]);
            this.hlLayer.addMesh(node as Mesh, new Color3(1, 0.7, 0));
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
    
}