import React from "react";
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Vector3, Color3, Vector4 } from '@babylonjs/core/Maths/math';
import { SkyMaterial } from '@babylonjs/materials/sky';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Tools } from '@babylonjs/core/Misc/tools'
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { Ray } from "@babylonjs/core/Culling/ray";

import { Label, Button, ButtonContainer, RadialButton, Anchor, SideMenu } from "../ui/buttons";
import { Icon, AxisMover, SoccerBall } from "../ui/icons";

import { GizmoManager, GizmoMode, GizmoSpace } from "./GizmoManager";
import { Commands, CreateObjectCommand, DeleteObjectCommand, GroupCommand } from "../utilities/commands";

import floor_tex from '../../assets/floortiles.png';
import floor_norm from '../../assets/floortiles_normal.png';


type CanvasProps = {
}

export type CanvasHandle = {
    getScene(): Scene
    
    loadScene(): Promise<void>
}

const CanvasRenderer: React.ForwardRefRenderFunction<CanvasHandle, CanvasProps> = (props, env) => {

    const canvas = React.useRef<HTMLCanvasElement>(null);
    const engine = React.useRef<Engine>(null);
    const scene = React.useRef<Scene>(null);
    const gizmo = React.useRef<GizmoManager>(null);
    
    const [gizmoMode, setGizmoMode] = React.useState(GizmoMode.Translate);
    const [gizmoSpace, setGizmoSpace] = React.useState(GizmoSpace.Local);
    const [gizmoScaling, setGizmoScaling] = React.useState(true);
    const [snapDist, setSnapDist] = React.useState(0);
    const [snapAngle, setSnapAngle] = React.useState(0);
    const [rootPos, setRootPos] = React.useState(Vector3.Zero());
    const [hiddenSelection, setHiddenSelection] = React.useState(true);
    const [cameraChange, setCameraChange] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    const [axesAngles, setAxesAngles] = React.useState(Vector3.ZeroReadOnly);
    const [isVertical, setIsVertical] = React.useState(window.innerHeight > window.innerWidth);
    const [inMultiselect, setInMultiselect] = React.useState(false);
    const [emptyCmdStack, setEmptyCmdStack] = React.useState(true);
    const [emptyRedoStack, setEmptyRedoStack] = React.useState(true);

    let isMoving = false;
    let wasMoving = false;
    let gizmoScale = 0.9;


    React.useEffect(() => {
        if (gizmo.current) {
            setRootPos(gizmo.current.getRootScreenPosition());
            setAxesAngles(gizmo.current.getAxesScreenAngles());
        }
        setHiddenSelection(dragging || cameraChange || !gizmo.current?.isActive())
    }, [dragging, cameraChange, gizmo.current?.isActive()]);

    React.useEffect(() => {
        gizmo.current?.changeMode(gizmoMode);
    }, [gizmoMode]);

    React.useEffect(() => {
        gizmo.current?.changeSpace(gizmoSpace);
    }, [gizmoSpace]);

    React.useEffect(() => {
        gizmo.current?.setToCentralScaling(gizmoScaling);
    }, [gizmoScaling]);

    React.useEffect(() => {
        gizmo.current?.setTranslationSnap(snapDist);
    }, [snapDist])

    React.useEffect(() => {
        gizmo.current?.setRotationSnap(snapAngle);
    }, [snapAngle])

    React.useEffect(() => {
        if (gizmo.current) {
            setAxesAngles(gizmo.current.getAxesScreenAngles());
        }
    }, [gizmoSpace]);

    React.useEffect(() => {
        updateCommandStackVal();
    })

    const setupCamera = async () => {
		const arcRotCamera = new ArcRotateCamera(
            'cameraArc', 
            Tools.ToRadians(-90), 
            Tools.ToRadians(60), 
            10, 
            Vector3.Zero(), 
            scene.current);
		arcRotCamera.lowerRadiusLimit = 2;
		arcRotCamera.upperRadiusLimit = 45;
		arcRotCamera.upperBetaLimit = Tools.ToRadians(89.9); // todo: Adjust to mouse wheel ? like in unreal
		arcRotCamera.wheelDeltaPercentage = 0.01;
		arcRotCamera.speed = 1;
		arcRotCamera.attachControl(canvas, true);
        arcRotCamera.onViewMatrixChangedObservable.add(() => {isMoving = true})
	}

	const setupSky = async () => {
		const sunPosition = new Vector3(50, 120, -100);

		const skyMaterial = new SkyMaterial('skyMat', scene.current);
		skyMaterial.backFaceCulling = false;
		skyMaterial.useSunPosition = true;
		skyMaterial.sunPosition = sunPosition;

		const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, scene.current);
		skybox.material = skyMaterial;
        skybox.metadata = {immovable: true}

		const light = new HemisphericLight('hemisphereLight', sunPosition, scene.current);
	}

	const setupFloor = async () => {
        let d = 15; // diameter
        const faceUVs = [new Vector4(0, 0, d, d), new Vector4(0, 0, d, 0.5), new Vector4(0, 0, d, d)];
		const ground = MeshBuilder.CreateCylinder('ground', {height: 0.5, tessellation:d*2, diameter: d, faceUV: faceUVs}, scene.current);
        ground.position = new Vector3(0, -0.7501, 0)
		const groundMat = new StandardMaterial('groundMat', scene.current);
		const tileTex = new Texture(floor_tex, scene.current);
		const tileNormal = new Texture(floor_norm, scene.current);
		groundMat.diffuseTexture = tileTex;
		groundMat.bumpTexture = tileNormal;
		groundMat.specularColor = new Color3(0.4, 0.4, 0.4);
		groundMat.backFaceCulling = false;
		ground.material = groundMat;
        ground.metadata = {immovable: true};
	}

    const addTestObject = async () => {
        const cube = MeshBuilder.CreateBox('box', {size: 1}, scene.current);
        cube.metadata = {immovable: false};
        const sphere = MeshBuilder.CreateSphere('sphere', {diameter: 1}, scene.current);
        sphere.translate(new Vector3(2, 0, 0), 1);
        sphere.metadata = {immovable: false};
    }

    const setupEngine = async () => {
        engine.current = new Engine(canvas.current, true);
    };

    const setupScene = async () => {
        scene.current = new Scene(engine.current);
        await setupCamera();
        await setupSky();
        await setupFloor();
        await addTestObject();
    }

    const setupGizmo = async () => {
        gizmo.current =  new GizmoManager(setDragging, setRootPos, setInMultiselect, scene.current, 4.5, gizmoScale);
        let inMultiselectMode = false;
        gizmo.current.inMultiSelectMode = inMultiselect;
        let pressedTimestamp = 0;
        const ray = new Ray(Vector3.Zero(), Vector3.Zero()) // necessary to ensure import of Ray
        scene.current.onPointerObservable.add((pointerinfo) => {
            if (pointerinfo.type == PointerEventTypes.POINTERDOWN && pointerinfo.event.button == 0) {
                pressedTimestamp = Date.now();
            }

            if (pointerinfo.type == PointerEventTypes.POINTERUP && pointerinfo.event.button == 0) {
                let elapsedSincePressed = Date.now() - pressedTimestamp;
                if (elapsedSincePressed < 200) {
                    let node = pointerinfo.pickInfo.pickedMesh;
                    if (!gizmo.current.inMultiSelectMode) {
                        gizmo.current.removeAllNodes();
                    }
                    if (!node.metadata?.immovable) {
                        gizmo.current.addNode(node);
                    }
                    setRootPos(gizmo.current.getRootScreenPosition());
                };
            }
        });
        scene.current.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case 'Shift':
                            inMultiselectMode = true;
                            gizmo.current.inMultiSelectMode = true;
                            break;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case 'Shift':
                            inMultiselectMode = false;
                            gizmo.current.inMultiSelectMode = false;
                            break;
                    }
                    break;
            }
        });
    }

    const duplicateNode = () => {
        gizmo.current.getNodes().forEach( n => {
            const newNode = n[0].clone(n[0].name + "(copy)", null, false);
            Commands().execute(new CreateObjectCommand(newNode));
            newNode.freezeWorldMatrix(n[0].getWorldMatrix());
        });
    }

    const createNode = (shape: 'cube' | 'sphere' | 'ball' | 'knot' | 'torus') => {
        let mesh;
        switch(shape) {
            case "cube": 
                mesh = MeshBuilder.CreateBox('cube', {size: 1}, scene.current);
                break;
            case "sphere":
                mesh = MeshBuilder.CreateSphere('sphere', {diameter: 1}, scene.current);
                break;
            case "ball":
                mesh = MeshBuilder.CreateGoldberg('ball', {m: 1, n: 1, size: 0.5}, scene.current);
                break;
            case "knot":
                mesh = MeshBuilder.CreateTorusKnot('knot', {tube: 0.1, radius: 0.3, radialSegments: 64, p:5, q: 1}, scene.current);
                break;
            case "torus":
                mesh = MeshBuilder.CreateTorus('torus', {diameter: 0.8, thickness: 0.2, tessellation: 32}, scene.current)
        }
        const ray =scene.current.activeCamera.getForwardRay(length=50);
        ray.direction.normalize();
        const hit = scene.current.pickWithRay(ray);

        // move the mesh to where the ray first hits something. If nothing is hit, move it to the point along the ray that is closest to the origin
        mesh.position = mesh.position.add(hit.pickedPoint ?? ray.origin.add(ray.direction.scale(Vector3.Dot(ray.origin.negate(), ray.direction))));

        // place object *on* the hit point to ensure it's visible in the scene
        const yOffset = mesh.position.y-mesh.getHierarchyBoundingVectors(true).min.y;
        if (Math.abs(yOffset) > 0) {
            mesh.position = mesh.position.add(new Vector3(0, yOffset, 0));
        }
        Commands().execute(new CreateObjectCommand(mesh));
    }

    const deleteNode = () => {
        const clist = [];
        gizmo.current.getNodes().forEach( n => {
            clist.push(new DeleteObjectCommand(n[0]));
        });
        if (clist.length > 0) {
            Commands().execute(new GroupCommand(clist))
        }
        gizmo.current.removeAllNodes();
        setHiddenSelection(true);
    }

    const updateCommandStackVal = () => {
        setEmptyCmdStack(Commands().isEmpty());
        setEmptyRedoStack(Commands().isRedoEmpty());
    }

    const runLoop = async () => {
        engine.current.runRenderLoop(() => {
            scene.current.render();
            if (isMoving) {
                if (!wasMoving) {
                    setCameraChange(true);
                }
                wasMoving = true;
                isMoving = false;
            }
            else {
                if (wasMoving) {
                    setCameraChange(false)
                }
                wasMoving = false;
            }
        })
        window.addEventListener("resize", () => {
            engine.current.resize();
            if (gizmo.current){
                scene.current.updateTransformMatrix(true);
                setRootPos(gizmo.current.getRootScreenPosition());
                setIsVertical(window.innerHeight> window.innerWidth);
            }
        })
    }

    const handle = {
        getScene() {
            return scene.current!;
        },

        async loadScene() {
            await setupEngine();
            await setupScene();
            await setupGizmo();
            await runLoop();
        }
    }
    React.useImperativeHandle(env, () => handle);

    const rInner = 15 * gizmoScale;
    const r = (rInner + 6);
    const sectionAngle = 90/6 * (isVertical? -1 : 1);
    const baseAngle = isVertical ? -45 : 0

    return (
        <div className="main"> 
            <canvas className='babylon-canvas' ref={canvas}/>
            <SideMenu buttonSize={5 + (isVertical? 1: 0 *2)}>
                <ButtonContainer>
                    <Button isInactive={emptyCmdStack} onClick={()=>{Commands().undo(); setHiddenSelection(true); gizmo.current.removeAllNodes(); updateCommandStackVal()}}><Icon bootstrap="arrow-90deg-left"/></Button>
                </ButtonContainer>
                <ButtonContainer>
                    <Button isInactive={emptyRedoStack} onClick={()=>{Commands().redo(); setHiddenSelection(true); gizmo.current.removeAllNodes(); updateCommandStackVal()}}><Icon bootstrap="arrow-90deg-right"/></Button>
                </ButtonContainer>
                <ButtonContainer fixedIndex={0}>
                    <Button onClick={()=>{}}>
                        <Icon bootstrap="plus-lg"/>
                    </Button>
                    <Button onClick={() => {createNode('sphere')}}><Icon bootstrap="circle"/></Button>
                    <Button onClick={() => {createNode('cube')}}><Icon bootstrap="square"/></Button>
                    <Button onClick={() => {createNode('ball')}}><SoccerBall/></Button>
                    <Button onClick={() => {createNode('knot')}}><Icon bootstrap="hypnotize"/></Button>
                    <Button onClick={() => {createNode('torus')}}><Icon bootstrap="stop-circle"/></Button>
                </ButtonContainer>
                <ButtonContainer>
                    <Button isSelectedLink={inMultiselect} onClick={()=>{gizmo.current.inMultiSelectMode = !gizmo.current.inMultiSelectMode;}}>
                        <Icon bootstrap="plus-square-dotted"/>
                    </Button>
                </ButtonContainer>
            </SideMenu>

            <Anchor x={rootPos.x} y={rootPos.y} hidden={hiddenSelection} buttonSize={4}>
                {(gizmoMode == GizmoMode.Translate )? 
                    <>
                        <RadialButton angle={axesAngles.z + 180} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('z', true)}}>
                                <AxisMover angle={axesAngles.z + 180} color="dodgerblue" dashed={true}></AxisMover>
                            </Button>
                        </RadialButton>
                        <RadialButton angle={axesAngles.y + 180} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('y', true)}}>
                                <AxisMover angle={axesAngles.y + 180} color="lime" dashed={true}></AxisMover>
                            </Button>
                        </RadialButton>
                        <RadialButton angle={axesAngles.x + 180} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('x', true)}}>
                                <AxisMover angle={axesAngles.x + 180} color="crimson" dashed={true}></AxisMover>
                            </Button>
                        </RadialButton>

                        <RadialButton angle={axesAngles.z} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('z')}}>
                                <AxisMover angle={axesAngles.z} color="dodgerblue"></AxisMover>
                            </Button>
                        </RadialButton>
                        <RadialButton angle={axesAngles.y} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('y')}}>
                                <AxisMover angle={axesAngles.y} color="lime"></AxisMover>
                            </Button>
                        </RadialButton>
                        <RadialButton angle={axesAngles.x} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('x')}}>
                                <AxisMover angle={axesAngles.x} color="crimson"></AxisMover>
                            </Button>
                        </RadialButton>
                    </>
                    : 
                    <></>
                }

                <RadialButton angle={baseAngle + sectionAngle*2} radius={r}>
                    <Button onClick={() => {setGizmoMode(GizmoMode.Translate)}} isSelectedLink={gizmoMode==GizmoMode.Translate}>
                        <Icon bootstrap="arrows-move"></Icon>
                    </Button>
                </RadialButton>
                <RadialButton angle={baseAngle + sectionAngle*3} radius={r}>
                    <Button onClick={() => {setGizmoMode(GizmoMode.Rotate)}} isSelectedLink={gizmoMode==GizmoMode.Rotate}>
                        <Icon bootstrap="arrow-repeat"></Icon>
                    </Button>
                </RadialButton>
                <RadialButton angle={baseAngle + sectionAngle*4} radius={r}>
                    <Button onClick={() => {setGizmoMode(GizmoMode.Scale)}} isSelectedLink={gizmoMode==GizmoMode.Scale}>
                        <Icon bootstrap="bounding-box-circles"></Icon>
                    </Button>
                </RadialButton>

                {/* gizmo mode specific buttons */}
                <RadialButton angle={baseAngle + sectionAngle*6} radius={r} invisible={gizmoMode !== GizmoMode.Translate}>
                    <Button onClick={()=>{setSnapDist(0)}} selectable={true}><Label>free</Label></Button>
                    <Button onClick={()=>{setSnapDist(0.1)}} selectable={true}><Label>0.1m</Label></Button>
                    <Button onClick={()=>{setSnapDist(0.2)}} selectable={true}><Label>0.2m</Label></Button>
                    <Button onClick={()=>{setSnapDist(0.5)}} selectable={true}><Label>0.5m</Label></Button>
                    <Button onClick={()=>{setSnapDist(1)}} selectable={true}><Label>1m</Label></Button>
                    <Button onClick={()=>{setSnapDist(2)}} selectable={true}><Label>2m</Label></Button>
                </RadialButton>
                <RadialButton angle={baseAngle + sectionAngle*6} radius={r} invisible={gizmoMode !== GizmoMode.Rotate}>
                    <Button onClick={()=>{setSnapAngle(0)}} selectable={true}><Label>free</Label></Button>
                    <Button onClick={()=>{setSnapAngle(15)}} selectable={true}><Label>15°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(30)}} selectable={true}><Label>30°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(45)}} selectable={true}><Label>45°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(60)}} selectable={true}><Label>60°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(90)}} selectable={true}><Label>90°</Label></Button>
                </RadialButton>
                <RadialButton angle={baseAngle + sectionAngle*6} radius={r} invisible={gizmoMode !== GizmoMode.Scale}>
                    <Button onClick={()=>{setGizmoScaling(true)}} isSelectedLink={gizmoScaling}><Icon bootstrap="align-center"/></Button>
                    <Button onClick={()=>{setGizmoScaling(false)}} isSelectedLink={!gizmoScaling}><Icon bootstrap="align-start"/></Button>
                </RadialButton>

                <RadialButton angle={baseAngle + sectionAngle*7} radius={r}>
                    <Button onClick={()=>{setGizmoSpace(GizmoSpace.Local)}} isSelectedLink={gizmoSpace === GizmoSpace.Local}><Icon bootstrap="box"/></Button>
                    <Button onClick={()=>{setGizmoSpace(GizmoSpace.World)}} isSelectedLink={gizmoSpace === GizmoSpace.World}><Icon bootstrap="globe2"/></Button>
                </RadialButton>
                <RadialButton angle={baseAngle + sectionAngle*9} radius={r}>
                    <Button onClick={()=>{duplicateNode()}}><Icon bootstrap="copy"/></Button>
                </RadialButton>
                <RadialButton angle={baseAngle + sectionAngle*10} radius={r}>
                    <Button onClick={()=>{deleteNode()}}><Icon bootstrap="trash3"/></Button>
                </RadialButton>
            </Anchor>
        </div>
    )
}

export const Canvas = React.forwardRef(CanvasRenderer);