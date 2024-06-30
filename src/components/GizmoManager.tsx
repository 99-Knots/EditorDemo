import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Vector3, Quaternion, Color3, Matrix, Vector4 } from "@babylonjs/core/Maths/math";
import { Ray } from '@babylonjs/core/Culling/ray'
import { RayHelper } from "@babylonjs/core";
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
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

export type TransformOrient = {
    matrix: Matrix,
    orientation: Quaternion,
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

const projectToScreen = (p: Vector3, scene: Scene) => {
    
    const engine = scene.getEngine();
    const camera = scene.activeCamera;
    return Vector3.Project(p, Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()))
}


export class GizmoManager {

    private root: TransformNode;                            // actual attached node of the gizmo; serves to transfer changes to the meshes
    private initialTransform: Transformation;               // transformation of the root before an axis gets dragged; to calculate the difference between start and end of drag
    private inWorldSpace: boolean;                          // indicates if the gizmo is currently using world orientation
    private nodes: [TransformNode, TransformOrient][];      // list of meshes and their transformatin currently attached to the gizmo
    private positionGizmo: PositionGizmo;                   // gizmo for translation
    private rotationGizmo: RotationGizmo;                   // gizmo for rotation
    private boundingBoxGizmo: CustomBoundingBoxGizmo;       // gizmo for scaling
    private currentGizmo: Gizmo;                            // the gizmo currently active
    private layer: UtilityLayerRenderer;
    private hlLayer: HighlightLayer;
    private dragging: (b: boolean) => void;
    private rootScreenPos: (v: Vector3) => void;
    private setMultiSelect: (b: boolean) => void;
    private _inMultiselectMode: boolean;

    public set inMultiSelectMode(b: boolean) {
        this._inMultiselectMode = b;
        this.setMultiSelect(this.inMultiSelectMode);
    }

    public get inMultiSelectMode() {
        return this._inMultiselectMode;
    }

    constructor(setDragging: (b: boolean)=>void, setRootScreenPos: (v: Vector3)=>void, setMultiselect: (b: boolean)=>void, scene: Scene, thickness?: number, scale?: number) {
        this.root = new TransformNode('GizmoRoot', scene);
        this.layer = new UtilityLayerRenderer(scene);
        this.hlLayer = new HighlightLayer('SelectionHLLayer', scene);
        this.dragging = setDragging
        this.rootScreenPos = setRootScreenPos;
        this.setMultiSelect = setMultiselect;

        this.inMultiSelectMode = false;

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

        this.boundingBoxGizmo = new CustomBoundingBoxGizmo(setDragging, Color3.Gray(), this.layer, this, thickness);
        this.boundingBoxGizmo.attachedNode = this.root;

        this.changeMode(GizmoMode.Translate);
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

    public changeSpace(space: GizmoSpace) {
        switch (space) {
            case (GizmoSpace.World): 
                this.inWorldSpace = true;
                break;
            case (GizmoSpace.Local): 
                this.inWorldSpace = false;
                break;
        }
        this.setRootPosition();
        this.setRootRotation();
        this.positionGizmo.updateGizmoRotationToMatchAttachedMesh = !this.inWorldSpace;
        this.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = !this.inWorldSpace;
        this.boundingBoxGizmo.updateGizmoRotationToMatchAttachedMesh = !this.inWorldSpace;
        this.boundingBoxGizmo.updateGizmo();
    }

    public setTranslationSnap(distance: number) {
        this.positionGizmo.snapDistance = distance;
    }

    public setRotationSnap(angle: number) {
        this.rotationGizmo.snapDistance = angle*Math.PI/180;
    }

    public setToCentralScaling(val: boolean) {
        this.boundingBoxGizmo.scaleFromCenter = val;
    }

    public isActive() {
        return !!this.currentGizmo.attachedNode
    }

    public getRootScreenPosition() {
        return projectToScreen(this.root.position, this.root.getScene());
    }

    public getSingleAxisScreenAngle(axis: 'x'|'y'|'z') {
        let v = Vector3.Right();
        switch (axis) {
            case 'x': 
                Vector3.Right().rotateByQuaternionToRef(this.root.rotationQuaternion, v);
                break;
            case 'y': 
                Vector3.Up().rotateByQuaternionToRef(this.root.rotationQuaternion, v);
                break;
            case 'z': 
                Vector3.Forward().rotateByQuaternionToRef(this.root.rotationQuaternion, v);
                break;
        }
        // vector from root along x-axis on screen
        let p = projectToScreen(v.add(this.root.position), this.root.getScene()).subtract(this.getRootScreenPosition());
        return -Math.atan2(-p.x, -p.y) * 180/Math.PI;   // swap x and y and negate for angle along negative y-axis
    };

    public getAxesScreenAngles() {
        return new Vector3(this.getSingleAxisScreenAngle('x'), this.getSingleAxisScreenAngle('y'), this.getSingleAxisScreenAngle('z'));
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
            this.rootScreenPos(this.getRootScreenPosition());
        }
    }

    public setRootRotation() {
        if (this.nodes.length >= 1 && !this.inWorldSpace) {
            this.root.rotationQuaternion = this.nodes[0][0].rotationQuaternion.clone();
        }
        else {
            this.root.rotationQuaternion.set(0, 0, 0, 1);
        }
    }

    public addNode(node: TransformNode) {
        if (!this.nodes.find(n => n[0].uniqueId == node.uniqueId)) {    // only add node if it wasn't already attached
            node.computeWorldMatrix(true);
            if (!node.rotationQuaternion)   // use nodes rotation Quaternion to store orientation
                node.rotationQuaternion = Quaternion.FromRotationMatrix(node.getWorldMatrix().getRotationMatrix());
            // add the node to the list of attached nodes, together with its world matrix
            this.nodes.push([node, {matrix: node.getWorldMatrix().clone(), orientation: node.rotationQuaternion}]);
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
        let i = this.nodes.indexOf(this.nodes.find(n => n[0].uniqueId == node.uniqueId));
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

    public getOrientationMatrix() {
        let Rmat = Matrix.Identity();
        Matrix.FromQuaternionToRef(this.root.rotationQuaternion, Rmat);
        return Rmat;
    }

    public getBoundingMinMax(rotationMatrix?: Matrix) {
        let Rmat = rotationMatrix ?? this.getOrientationMatrix();
        let minmax = {min: Vector3.Zero(), max: Vector3.Zero()};
        const [first, ...rest] = this.nodes;
        if (first) {
            let nodeMinMax = {min: Vector3.Zero(), max: Vector3.Zero()};
            //let Rmat = this.getOrientationMatrix();
            let RmatInv = Rmat.clone().invert();

            first[0].freezeWorldMatrix(first[0].getWorldMatrix().multiply(RmatInv));
            minmax = first[0].getHierarchyBoundingVectors(true);
            first[0].freezeWorldMatrix(first[0].getWorldMatrix().multiply(Rmat));

            if (rest) {
                rest.forEach(n => {
                    n[0].freezeWorldMatrix(n[0].getWorldMatrix().multiply(RmatInv));
                    nodeMinMax = n[0].getHierarchyBoundingVectors(true);
                    minmax.min.minimizeInPlace(nodeMinMax.min);
                    minmax.max.maximizeInPlace(nodeMinMax.max);
                    n[0].freezeWorldMatrix(n[0].getWorldMatrix().multiply(Rmat));
                    nodeMinMax = n[0].getHierarchyBoundingVectors(true);
                });
            }
        }
        return minmax;
    }

    /**
     * Approximation for moving the selected objects in a direction until one collides with another mesh.
     * Cast a number of rays from the objects' Bounding Box's face into a direction and find the one that collides first.
     * @param moveOppositeDirection Determines wether the objects shall be moved in the direction the gizmo's arrow is pointing or the opposite one. False by default.
     * @param rayLength How long the rays for collision detection should be in meters. 50 by default.
     * @param numberOfRays The number of rays, that shall be used for approximating when an object would hit something. 100 by default.
     * @param numberOfRetries The number of times the program should try to generate a valid ray before moving to the next one. 5 by default.
     */
    snapAlongAxis(axis: 'x' | 'y' | 'z', moveOppositeDirection?: boolean, rayLength?: number, numberOfRays?: number, numberOfRetries?: number) {
        // does not work with placing things on the narrow side of planes

        const scene = this.layer.originalScene;

        //let axis = 'y';
        let moveForward = !moveOppositeDirection;
        let direction = Vector3.Up();

        const quat = this.root.rotationQuaternion;
        const qinv = quat.invert();
        const rotAxis = new Vector3(qinv.x, qinv.y, qinv.z).normalize();
        const rotAngle = Math.acos(qinv.w) * 2;

        if (!axis) return;
        if (axis == 'x') {
            direction = Vector3.Right();
        }
        else if (axis == 'y') {
            direction = Vector3.Up();
        }
        else if (axis == 'z') {
            direction = Vector3.Forward();
        }
        direction.rotateByQuaternionToRef(quat, direction);

        let nrRays = numberOfRays ?? 100;  // might need some trial and error to find what works for performance
        let nrRetries = numberOfRetries ?? 3;
        let offset = direction.scale(0.0001);



        if (this.nodes.length>0) {
            let meshes: AbstractMesh[] = [];
            let BBIsFlat = false;
            let Rmat = Matrix.Identity();
            Rmat = quat.toRotationMatrix(Rmat);
            let minmax = this.getBoundingMinMax(Rmat);
            this.nodes.forEach( n => {
                meshes = meshes.concat(n[0] as Mesh)
            })
            let a: Vector3;
            let b: Vector3;
            let c: Vector3;
            let dist: Vector3;

            let shortestRay: Ray;

            if (axis == 'x') {
                a = new Vector3(0, minmax.max.y - minmax.min.y, 0);
                b = new Vector3(0, 0, minmax.max.z - minmax.min.z);
                c = new Vector3(minmax.max.x - minmax.min.x, 0, 0);
            }
            else if (axis == 'y') {
                a = new Vector3(minmax.max.x - minmax.min.x, 0, 0);
                b = new Vector3(0, 0, minmax.max.z - minmax.min.z);
                c = new Vector3(0, minmax.max.y - minmax.min.y, 0);
            }
            else {
                a = new Vector3(minmax.max.x - minmax.min.x, 0, 0);
                b = new Vector3(0, minmax.max.y - minmax.min.y, 0);
                c = new Vector3(0, 0, minmax.max.z - minmax.min.z);
            }
            //minmax.min.rotateByQuaternionAroundPointToRef(quat, this.root.position, minmax.min);
            //minmax.max.rotateByQuaternionAroundPointToRef(quat, this.root.position, minmax.max);
            minmax.min.rotateByQuaternionToRef(quat, minmax.min);
            minmax.max.rotateByQuaternionToRef(quat, minmax.max);
            a.rotateByQuaternionToRef(quat, a);
            b.rotateByQuaternionToRef(quat, b);
            c.rotateByQuaternionToRef(quat, c);
            
            if (a.length() == 0 || b.length() == 0) {   // determine if the Bounding Box's face towards the movementaxis has an area greater than 0, if not do not do backcheck. It won't work
                BBIsFlat = true;
            }
            // this only kinda fixes the problem with planes. Determining a number of rays per selected node might be better suited for this, but would either reduce the accuracy if the given amount is split between them 
            // or if every node gets assigned the same base amount of rays it might cause some performance issues with larger number of selected nodes.

            for (let i = 0; i<nrRays; i++) {
                let inObject = false;
                let rayOrigin: Vector3;
                let counter = 0;
                // to approximate the contours of the selected objects, cast the random rays backwards and check, if they collide with one of the selected meshes
                // maybe in the future do this separately for selected objects to avoid many needless re-tries for the empty space between
                while (!inObject) {
                    counter++;
                    rayOrigin = minmax.min.add(a.scale(Math.random())).add(b.scale(Math.random()));
                    rayOrigin.addInPlace(moveForward ? c.add(offset) : offset.negate());

                    // draw generated rays on bounding box face
                    //const rayhelper = new RayHelper(new Ray(rayOrigin, moveForward ? direction : direction.negate(), 50));
                    //rayhelper.show(scene, Color3.Red());

                    const backcheckRay = new Ray(rayOrigin, moveForward ? direction.negate() : direction, rayLength ?? 50);
                    const hit = scene.pickWithRay(backcheckRay, mesh =>!! meshes.find(m => m==mesh));
                    if (BBIsFlat) 
                        break;
                    if (hit.pickedMesh) {
                        inObject = true;
                        rayOrigin = hit.pickedPoint.clone();  // cast the collision ray from the object
                        rayOrigin.addInPlace(moveForward ? offset : offset.negate());
                    }
                    else {
                        if (counter > nrRetries)  // if the maximum number of retries was reached, stop generating new rays
                            break;
                    }

                }
                
                if (inObject) { // if a valid ray was found, use it for determining the distance to move
                    const ray = new Ray(rayOrigin, moveForward ? direction : direction.negate(), rayLength ?? 50);
                    const hit = scene.pickWithRay(ray, mesh => !meshes.find(m => m==mesh));
                    if (hit.pickedPoint) {
                        const newDist = hit.pickedPoint.subtract(rayOrigin);
                        if (!dist || (newDist.length() < dist.length())) {
                            dist = newDist;
                            shortestRay = new Ray(rayOrigin, moveForward ? direction : direction.negate(), newDist.length());
                        }
                        // draw the valid rays from the object face
                        //const rayhelper = new RayHelper(new Ray(rayOrigin, moveForward ? direction : direction.negate(), newDist.length()));
                        //rayhelper.show(scene);
                    }
                }
            }
             if (dist) {
                // draw the ray that is used as a base for the movement
                //const rayhelper = new RayHelper(shortestRay);
                //rayhelper.show(scene, Color3.Red());

                this.dragging(true);
                const cList = [];
                const Tmat = toTranslationMatrix(dist);
                this.nodes.forEach(n => {
                    n[0].freezeWorldMatrix(n[0].getWorldMatrix().multiply(Tmat))
                    //n[0].position = n[1].position.add(dist);
                    cList.push(new TransformCommand(n[0], n[1])); 
                    n[1].matrix = n[0].getWorldMatrix().clone();
                    //n[0].getChildren().forEach( c => {c.computeWorldMatrix(true)});
                });
                Commands().execute(new GroupCommand(cList));
                this.setRootPosition();
                this.dragging(false);
                
             }
        
            // draw the bounding box for the ray generation
            //let l = MeshBuilder.CreateLines('lines', {points:
            //    [minmax.min, minmax.min.add(a), minmax.min.add(a).add(b), minmax.min.add(b), minmax.min,
            //    minmax.min.add(c), minmax.max.subtract(a), minmax.max.subtract(a).subtract(c), minmax.max.subtract(a), minmax.max, minmax.max.subtract(c), minmax.max, minmax.max.subtract(b), minmax.max.subtract(b).subtract(c), minmax.max.subtract(b), minmax.min.add(c)]
            //}, this.layer.utilityLayerScene)
        }
    }


    private initPositionGizmo() {
        this.positionGizmo.planarGizmoEnabled = true;
        this.positionGizmo.xPlaneGizmo.scaleRatio*= 1.5;
        this.positionGizmo.yPlaneGizmo.scaleRatio*= 1.5;
        this.positionGizmo.zPlaneGizmo.scaleRatio*= 1.5;
        this.positionGizmo.onDragStartObservable.add(() => {
            this.initialTransform.position = this.root.position.clone();
            this.dragging(true);
        });

        this.positionGizmo.onDragObservable.add(() => {
            const dist = this.root.position.subtract(this.initialTransform.position)
            const Tmat = toTranslationMatrix(dist);
            this.nodes.forEach(n => {
                n[0].freezeWorldMatrix(n[1].matrix.multiply(Tmat))
            });
        });

        this.positionGizmo.onDragEndObservable.add(() => {
            const cList = [];
            this.nodes.forEach( n => { 
                cList.push(new TransformCommand(n[0], n[1])); 
                n[1].matrix = n[0].getWorldMatrix().clone();
            });
            Commands().execute(new GroupCommand(cList));
            this.dragging(false)
        });
    }

    private initRotationGizmo() {
        this.rotationGizmo.onDragStartObservable.add(() => {
            this.initialTransform.rotation = this.root.rotationQuaternion.clone();
            this.dragging(true);
        });

        this.rotationGizmo.onDragObservable.add(() => {
            const qinv = this.initialTransform.rotation.invert();
            const quat = this.root.rotationQuaternion.multiply(qinv);   // quaternion for the rotation of the root since drag start

            this.nodes.forEach(n => {   // reset to state before rotation and then do entire rotation anew
                const dist = n[1].matrix.getTranslation().add(this.root.position.subtract(n[1].matrix.getTranslation()));
                let Rmat = Matrix.Identity();
                quat.toRotationMatrix(Rmat);

                let mat = n[1].matrix.multiply(toTranslationMatrix(dist.negate()));    // move to Origin
                mat = mat.multiply(Rmat);                                       // rotate
                mat = mat.multiply(toTranslationMatrix(dist))                   // undo previous translation
                n[0].rotationQuaternion = quat.multiply(n[1].orientation);     // store the orientation of the node
                n[0].freezeWorldMatrix(mat);
            });
        });

        this.rotationGizmo.onDragEndObservable.add(() => {
            const cList = [];
            this.nodes.forEach( n => { 
                cList.push(new TransformCommand(n[0], n[1]));
                n[1].matrix = n[0].getWorldMatrix().clone();
                n[1].orientation = n[0].rotationQuaternion;
            });
            Commands().execute(new GroupCommand(cList));
            this.setRootRotation();     // reset the root to a neutral orientation
            this.dragging(false);
        });
    }
}


class CustomBoundingBoxGizmo extends BoundingBoxGizmo {
    protected currentMinMax: MinMax;    // minimum and maximum vectors for the bounding box
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
    constructor(setDragging: (b: boolean)=>void, color: Color3, utilLayer: UtilityLayerRenderer, gizmoManager: GizmoManager, thickness?: number) {
        super(color, utilLayer)
        this._hoverColoredMaterial.emissiveColor = new Color3(1, 0.7, 0);
        this.gizmoManager = gizmoManager;
        this._scaleFromCenter = true;
        this._scaleDragSpeed *= 2;
        this.scaleBoxSize = 0.1 * (thickness??3)/3;

        // 'disable' rotation spheres by removing them from scene, since this is a scale-only gizmo!
        this._rootMesh.removeChild(this._rotateSpheresParent);
        this._rotateSpheresParent.getChildMeshes().forEach( s => {
            this.gizmoLayer.utilityLayerScene.removeMesh(s)
        });

        this.currentMinMax = { min: Vector3.Zero(), max: Vector3.Zero() };

        this.initDragBehaviour(setDragging);
    }

    /**
     * Set custom drag behaviours for the selectable boxes of the gizmo
     */
    protected initDragBehaviour(setDragging: (b: boolean)=>void) {
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


            dragBehavior.onDragStartObservable.add( eventData => {
                setDragging(true);
                this._lineBoundingBox.computeWorldMatrix(true);

                center = this._lineBoundingBox.getAbsolutePivotPoint().clone();
                initialDist = eventData.dragPlanePoint.subtract(center);
                d = boxes[i].absolutePosition.subtract(center);
                dragFactor = 0;
                nodes = this.gizmoManager.getNodes();
            });

            dragBehavior.onDragObservable.add( eventData => {
                if (!this.attachedNode) {
                    dragBehavior.releaseDrag();     // fix for stuck drag mode when another key is pressed during drag
                    return
                }
                if (this._scaleFromCenter) 
                    dragFactor += eventData.dragDistance;
                else 
                    dragFactor += eventData.dragDistance*0.5
                const center_boxDirection = initialDist.normalizeToNew();   

                const scaleAmount = axis.scale(dragFactor);                                     // how much the object's scale changes along x,y,z directions
                const newDist = initialDist.add(center_boxDirection.multiply(scaleAmount));     // projected distance between the center and the dragged box afterwards
                const ratio = newDist.divide(initialDist);    
                const Smat = new Matrix();
                Smat.setRowFromFloats(0, Math.abs(ratio.x), 0, 0, 0);
                Smat.setRowFromFloats(1, 0, Math.abs(ratio.y), 0, 0);
                Smat.setRowFromFloats(2, 0, 0, Math.abs(ratio.z), 0);
                Smat.setRowFromFloats(3, 0,   0,   0,   1);                                  // scale ratio relative to the previous scale

                nodes.forEach( n => {
                    const Rmat = this.gizmoManager.getOrientationMatrix();
                    const offset = n[1].matrix.getTranslation().add(center.subtract(n[1].matrix.getTranslation()));

                    let mat = n[1].matrix.multiply(toTranslationMatrix(offset.negate()));    // move to Origin
                    if (!this._scaleFromCenter) 
                        mat = mat.multiply(toTranslationMatrix(d));
                    mat = mat.multiply(Rmat.clone().invert());                      // revert the bounding box's rotation
                    mat = mat.multiply(Smat);                                       // scale
                    mat = mat.multiply(Rmat);                                       // undo previous rotation
                    if (!this._scaleFromCenter) 
                        mat = mat.multiply(toTranslationMatrix(d.negate()));
                    mat = mat.multiply(toTranslationMatrix(offset))                   // undo previous translation

                    n[0].freezeWorldMatrix(mat);
                });
                boxes[i].material = this.hoverMaterial;
                this.updateGizmo();
            });

            dragBehavior.onDragEndObservable.add(eventData => {
                const cList = [];
                nodes.forEach( n => { 
                    cList.push(new TransformCommand(n[0], n[1])); 
                    n[1].matrix = n[0].getWorldMatrix().clone();
                });
                Commands().execute(new GroupCommand(cList));
                boxes[i].material = this.coloredMaterial;
                setDragging(false)
            });

            boxes[i].addBehavior(dragBehavior);
        }

    }

    /**
     * updates the bounding box and its children to fit all attached nodes
     * @param position optional, allows for repositioning the bounding box at another place
     * @param space indicates in which space the position is given. BONE is treated as LOCAL (LOCAL as default)
     */
    updateGizmo(position?: Vector3) {
        if (this.attachedNode) {    // only update anything if the gizmo is attached to something
            this.currentMinMax = this.gizmoManager.getBoundingMinMax();

            this._boundingDimensions = this.currentMinMax.max.subtract(this.currentMinMax.min);
            this._lineBoundingBox.scaling.copyFrom(this._boundingDimensions);

            if(position) {
                if (this.updateGizmoRotationToMatchAttachedMesh)
                    this._lineBoundingBox.position = position;
                else 
                    this._lineBoundingBox.setAbsolutePosition(position);
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