import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3, Quaternion, Color3, Matrix } from "@babylonjs/core/Maths/math";
import { Scene } from "@babylonjs/core/scene";
import { UtilityLayerRenderer } from "@babylonjs/core/Rendering";
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { Gizmo, PositionGizmo, RotationGizmo, BoundingBoxGizmo } from "@babylonjs/core/Gizmos";
import { PointerDragBehavior } from "@babylonjs/core/Behaviors/Meshes/pointerDragBehavior";

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

type MinMax = {
    min: Vector3,
    max: Vector3,
}

const toTranslationMatrix = (v: Vector3) => {
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
    private boundingBoxGizmo: CustomBoundingBoxGizmo;       // gizmo for scaling
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

        this.boundingBoxGizmo = new CustomBoundingBoxGizmo(Color3.Gray(), this.layer, this);
        this.boundingBoxGizmo.attachedNode = this.root;

        this.changeMode(GizmoMode.Scale);
    }

    public changeMode(mode: GizmoMode) {
        this.rotationGizmo.attachedNode = null;
        this.positionGizmo.attachedNode = null;
        this.boundingBoxGizmo.attachedNode = null;
        this.root.scaling = Vector3.One();

        switch (mode) {     // select the relevant gizmo
            case GizmoMode.Rotate:
                this.currentGizmo = this.rotationGizmo;
                break;
            case GizmoMode.Translate:
                this.currentGizmo = this.positionGizmo;
                break;
            case GizmoMode.Scale:
                this.currentGizmo = this.boundingBoxGizmo;
                break;
        }
        if (this.nodes.length > 0) {
            this.currentGizmo.attachedNode = this.root;
            this.boundingBoxGizmo.updateGizmo();
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
        if (this.currentGizmo == this.boundingBoxGizmo) {   // if scaling is selected update the bounding box
            this.boundingBoxGizmo.updateGizmo();
        }
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

    public getNodes() {
        return this.nodes;
    }

    private initPositionGizmo() {
        const startTranslateAxisDrag = () => {
            this.initialTransform.position = this.root.position.clone();
        }

        const onTranslateAxisDrag = () => {
            const dist = this.root.position.subtract(this.initialTransform.position)
            
            const Tmat = toTranslationMatrix(dist);
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

                let mat = n[1].multiply(toTranslationMatrix(dist.negate()));  // move to Origin
                mat = mat.multiply(Rmat);                                   // rotate
                mat = mat.multiply(toTranslationMatrix(dist))                 // undo previous translation
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


class CustomBoundingBoxGizmo extends BoundingBoxGizmo {
    protected currentMinMaxFree: MinMax;    // minimum and maximum vectors for an object aligned bounding box
    protected currentMinMaxAA: MinMax;      // minimum and maximum vectors for an axis aligned bounding box
    protected gizmoManager: GizmoManager;
    protected _scaleFromCenter: boolean;

    public get updateGizmoRotationToMatchAttachedMesh() {
        return this._updateGizmoRotationToMatchAttachedMesh;
    }
    public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
        this._updateGizmoRotationToMatchAttachedMesh = value;
        this.updateGizmo();
    }

    public get scaleFromCenter() {
        return this._scaleFromCenter;
    }
    public set scaleFromCenter(value: boolean) {
        this._scaleFromCenter = value;
    }

    /**
     * Creates a new custom Bounding Box Gizmo
     * @param color Color of the Bounding Box and the Drag Boxes
     * @param utilLayer Utility Layer that the gizmo will be added to
     * @param gizmoManager Gizmo Manager that will handle the gizmo
     */
    constructor(color: Color3, utilLayer: UtilityLayerRenderer, gizmoManager: GizmoManager) {
        super(color, utilLayer)
        this._hoverColoredMaterial.emissiveColor = new Color3(193 / 255, 0, 42 / 255);
        this.gizmoManager = gizmoManager;
        this._scaleFromCenter = true;
        this._scaleDragSpeed *= 2;
        this.scaleBoxSize = 0.05;

        // 'disable' rotation spheres by removing them from scene, since this is a scale-only gizmo!
        this._rootMesh.removeChild(this._rotateSpheresParent);
        this._rotateSpheresParent.getChildMeshes().forEach(s => {
            this.gizmoLayer.utilityLayerScene.removeMesh(s)
        });

        this.currentMinMaxFree = { min: Vector3.Zero(), max: Vector3.Zero() };
        this.currentMinMaxAA = { min: Vector3.Zero(), max: Vector3.Zero() };

        this.initDragBehaviour();

    }

    /**
     * Set custom drag behaviours for the selectable boxes of the gizmo
     */
    protected initDragBehaviour() {
        const axisToProp = (a: Vector3) => {
            let max = Math.max(Math.abs(a.x), Math.abs(a.y), Math.abs(a.z));
            return max ? new Vector3(Math.abs(a.x / max), Math.abs(a.y / max), Math.abs(a.z / max)) : a;
        }
        const boxes = this._scaleBoxesParent.getChildMeshes();
        let nodes = this.gizmoManager.getNodes();

        for (let i = 0; i < boxes.length; i++) {
            // get the box's axis from the old behaviour and then delete it
            const ogBehaviour = boxes[i].getBehaviorByName('PointerDrag')
            const dragaxis = (ogBehaviour as PointerDragBehavior).options.dragAxis    // axis along which the box can be dragged
            const axis = axisToProp(dragaxis); // scale proportions
            boxes[i].removeBehavior(ogBehaviour);

            let dragFactor: number;         // total distance dragged by the mouse; positive if outward's, negative if inwards
            let initialDist: Vector3;   // distance between the center and were the dragging started (with slight 'wobble' from Mouse to avoid division through zero)
            let center: Vector3;        // center of the bounding box in world coordinates
            let d: Vector3;             // same as initialDist but without wobble; distance between center and selected box

            const dragBehavior = new PointerDragBehavior({ dragAxis: dragaxis });
            dragBehavior.dragButtons = [0]  // only drag on left mouse button
            dragBehavior.updateDragPlane = false;
            dragBehavior.moveAttached = false;


            dragBehavior.onDragStartObservable.add(eventData => {
                this._lineBoundingBox.computeWorldMatrix(true);

                center = this._lineBoundingBox.getAbsolutePivotPoint().clone();
                initialDist = eventData.dragPlanePoint.subtract(center);
                d = boxes[i].absolutePosition.subtract(center);
                dragFactor = 0;
                nodes = this.gizmoManager.getNodes();
            });

            dragBehavior.onDragObservable.add(eventData => {

                dragFactor += eventData.dragDistance;
                const center_boxDirection = initialDist.normalizeToNew();   

                const scaleAmount = axis.scale(dragFactor);                                     // how much the object's scale changes along x,y,z directions
                const newDist = initialDist.add(center_boxDirection.multiply(scaleAmount));     // projected distance between the center and the dragged box afterwards
                const ratio = newDist.divide(initialDist);                                      // scale ratio relative to the previous scale

                nodes.forEach( n => {
                    const Smat = new Matrix();
                    Smat.setRowFromFloats(0, ratio.x, 0, 0, 0);
                    Smat.setRowFromFloats(1, 0, ratio.y, 0, 0);
                    Smat.setRowFromFloats(2, 0, 0, ratio.z, 0);
                    Smat.setRowFromFloats(3, 0,   0,   0,   1);

                    const Rmat = this.attachedNode.getWorldMatrix().getRotationMatrix()
                    const dist = n[1].getTranslation().add(center.subtract(n[1].getTranslation()));

                    let mat = n[1].multiply(toTranslationMatrix(dist.negate()));    // move to Origin
                    mat = mat.multiply(Rmat.clone().invert());                      // revert the bounding box's rotation
                    mat = mat.multiply(Smat);                                       // scale
                    mat = mat.multiply(Rmat);                                       // undo previous rotation
                    mat = mat.multiply(toTranslationMatrix(dist));                  // undo previous translation

                    console.log(n[0].getWorldMatrix());
                    n[0].freezeWorldMatrix(mat);
                    console.log(n[0].getWorldMatrix());
                });

                this.updateGizmo();

            });

            dragBehavior.onDragEndObservable.add(eventData => {
                const cList = [];
                nodes.forEach( n => { 
                    cList.push(new TransformCommand(n[0], n[1])); 
                    n[1] = n[0].getWorldMatrix().clone();
                });
                Commands().execute(new GroupCommand(cList));
            });

            boxes[i].addBehavior(dragBehavior);
        }

    }

    /**
     * Calculate the minimum and maximum vectors of the attached nodes
     */
    protected setMinMax() {
        const nodes = this.gizmoManager.getNodes();
        if (nodes.length > 0) {
            let NodeMinMax: MinMax;

            nodes[0][0].computeWorldMatrix(true);

            let Rmat: Matrix;
            Rmat = nodes[0][0].getWorldMatrix().getRotationMatrix();
            nodes[0][0].freezeWorldMatrix(nodes[0][0].getWorldMatrix().multiply(Rmat.clone().invert()))     // reset the nodes rotation
            this.currentMinMaxFree = nodes[0][0].getHierarchyBoundingVectors(true);

            nodes[0][0].freezeWorldMatrix(nodes[0][0].getWorldMatrix().multiply(Rmat));         // return to original rotation
            this.currentMinMaxAA = nodes[0][0].getHierarchyBoundingVectors(true);

            nodes[0][0].unfreezeWorldMatrix();

            if (nodes.length > 1) {     // for more then one object the bounding box will always be axis aligned
                nodes.forEach(n => {
                    NodeMinMax = n[0].getHierarchyBoundingVectors(true);
                    this.currentMinMaxFree.min = this.currentMinMaxAA.min.minimizeInPlace(NodeMinMax.min);
                    this.currentMinMaxFree.max = this.currentMinMaxAA.max.maximizeInPlace(NodeMinMax.max);
                });
            }
        }
    }

    /**
     * updates the bounding box and its children to fit all attached nodes
     * @param position optional, allows for repositioning the bounding box at another place
     * @param space indicates in which space the position is given. BONE is treated as LOCAL (LOCAL as default)
     */
    updateGizmo(position?: Vector3, space: GizmoSpace = GizmoSpace.Local) {
        if (this.attachedNode) {    // only update anything if the gizmo is attached to something
            this.setMinMax();

            if (this.updateGizmoRotationToMatchAttachedMesh) {      // if in local space use object aligned bounding box
                this._boundingDimensions = this.currentMinMaxFree.max.subtract(this.currentMinMaxFree.min);
            }
            else {      // otherwise use axis aligned bounding box
                this._boundingDimensions = this.currentMinMaxAA.max.subtract(this.currentMinMaxAA.min);
            }
            this._lineBoundingBox.scaling.copyFrom(this._boundingDimensions);

            if (position) {
                if (space == GizmoSpace.World)
                    this._lineBoundingBox.setAbsolutePosition(position);
                else
                    this._lineBoundingBox.position = position;
            }
            else {
                this._lineBoundingBox.position = Vector3.Zero();
            }


            this._scaleBoxesParent.position.copyFrom(this._lineBoundingBox.position);
            this._lineBoundingBox.computeWorldMatrix();

            this._updateRotationSpheres();
            this._updateScaleBoxes();
            this.gizmoManager.setRootPosition();
            this.gizmoManager.setRootRotation();
        }

    }
}