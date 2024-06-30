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

import { SideMenu, MenuOption } from '../ui/sideMenu'
import { MovingButton, RadialButton, ExpandableRadialButton, AxisMover, RadButton, ButtonContainer, Button, Label, Icon } from "../ui/multiSwitch";
import { dialogHandle, CreateDialog } from "../ui/dialogues";

import { GizmoManager, GizmoMode, GizmoSpace } from "./GizmoManager";
import { Commands, CreateObjectCommand, DeleteObjectCommand, GroupCommand } from "../utilities/commands";

import floor_tex from '../../assets/floortiles.png';
import floor_norm from '../../assets/floortiles_normal.png';


type CanvasProps = {
    //setSelectedNodes: (_: TransformNode[]) => void,
    //propertiesSidebarHandle: React.RefObject<PropertiesSidebarHandle>,
    //loadingState: [boolean, (_: boolean) => void],
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
    const createHandle = React.useRef<dialogHandle>();
    
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

    // todo: maybe also use z-index to represent axis overlap in correct order?
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
                    <Button onClick={() => {
                        const mesh = MeshBuilder.CreateSphere('new_sphere', {diameter: 1}, scene.current);
                        Commands().execute(new CreateObjectCommand(mesh));
                    }}><Icon bootstrap="circle"/></Button>
                    <Button onClick={() =>{
                        const mesh = MeshBuilder.CreateBox('new_box', {size: 1}, scene.current);
                        Commands().execute(new CreateObjectCommand(mesh));
                    }}><Icon bootstrap="square"/></Button>
                </ButtonContainer>
                <ButtonContainer>
                    <Button isSelectedLink={inMultiselect} onClick={()=>{gizmo.current.inMultiSelectMode = !gizmo.current.inMultiSelectMode;}}>
                        <Icon bootstrap="plus-square-dotted"/>
                    </Button>
                </ButtonContainer>
                {/*<MenuOption isInactive={emptyCmdStack} onClick={()=>{Commands().undo(); setHiddenSelection(true); gizmo.current.removeAllNodes(); updateCommandStackVal()}} icon="arrow-90deg-left"></MenuOption>
                <MenuOption isInactive={emptyRedoStack} onClick={()=>{Commands().redo(); setHiddenSelection(true), gizmo.current.removeAllNodes(); updateCommandStackVal()}} icon="arrow-90deg-right"></MenuOption>
                <MenuOption id="create-btn" onClick={createHandle.current?.open} icon="plus-lg"/>
                <MenuOption isSelected={inMultiselect} onClick={()=>{gizmo.current.inMultiSelectMode = !gizmo.current.inMultiSelectMode;}} icon="plus-square-dotted"></MenuOption>
            */}</SideMenu>
            <MovingButton x={rootPos.x} y={rootPos.y} hidden={hiddenSelection} buttonSize={4}>
                {(gizmoMode == GizmoMode.Translate )? 
                    <>
                        <RadButton angle={axesAngles.z + 180} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('z', true)}}>
                                <Icon angle={axesAngles.z + 180}><AxisMover color="dodgerblue" dashed={true}></AxisMover></Icon>
                            </Button>
                        </RadButton>
                        <RadButton angle={axesAngles.y + 180} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('y', true)}}>
                                <Icon angle={axesAngles.y + 180}><AxisMover color="lime" dashed={true}></AxisMover></Icon>
                            </Button>
                        </RadButton>
                        <RadButton angle={axesAngles.x + 180} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('x', true)}}>
                                <Icon angle={axesAngles.x + 180}><AxisMover color="crimson" dashed={true}></AxisMover></Icon>
                            </Button>
                        </RadButton>

                        <RadButton angle={axesAngles.z} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('z')}}>
                                <Icon angle={axesAngles.z}><AxisMover color="dodgerblue"></AxisMover></Icon>
                            </Button>
                        </RadButton>
                        <RadButton angle={axesAngles.y} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('y')}}>
                                <Icon angle={axesAngles.y}><AxisMover color="lime"></AxisMover></Icon>
                            </Button>
                        </RadButton>
                        <RadButton angle={axesAngles.x} radius={rInner}>
                            <Button onClick={()=>{gizmo.current.snapAlongAxis('x')}}>
                                <Icon angle={axesAngles.x}><AxisMover color="crimson"></AxisMover></Icon>
                            </Button>
                        </RadButton>
                    </>
                    : 
                    <></>
                }

                <RadButton angle={baseAngle + sectionAngle*2} radius={r}>
                    <Button onClick={() => {setGizmoMode(GizmoMode.Translate)}} isSelectedLink={gizmoMode==GizmoMode.Translate}>
                        <Icon bootstrap="arrows-move"></Icon>
                    </Button>
                </RadButton>
                <RadButton angle={baseAngle + sectionAngle*3} radius={r}>
                    <Button onClick={() => {setGizmoMode(GizmoMode.Rotate)}} isSelectedLink={gizmoMode==GizmoMode.Rotate}>
                        <Icon bootstrap="arrow-repeat"></Icon>
                    </Button>
                </RadButton>
                <RadButton angle={baseAngle + sectionAngle*4} radius={r}>
                    <Button onClick={() => {setGizmoMode(GizmoMode.Scale)}} isSelectedLink={gizmoMode==GizmoMode.Scale}>
                        <Icon bootstrap="bounding-box-circles"></Icon>
                    </Button>
                </RadButton>

                {/* gizmo mode specific buttons */}
                <RadButton angle={baseAngle + sectionAngle*6} radius={r} invisible={gizmoMode !== GizmoMode.Translate}>
                    <Button onClick={()=>{setSnapDist(0)}} selectable={true}><Label>free</Label></Button>
                    <Button onClick={()=>{setSnapDist(0.1)}} selectable={true}><Label>0.1m</Label></Button>
                    <Button onClick={()=>{setSnapDist(0.2)}} selectable={true}><Label>0.2m</Label></Button>
                    <Button onClick={()=>{setSnapDist(0.5)}} selectable={true}><Label>0.5m</Label></Button>
                    <Button onClick={()=>{setSnapDist(1)}} selectable={true}><Label>1m</Label></Button>
                    <Button onClick={()=>{setSnapDist(2)}} selectable={true}><Label>2m</Label></Button>
                </RadButton>
                <RadButton angle={baseAngle + sectionAngle*6} radius={r} invisible={gizmoMode !== GizmoMode.Rotate}>
                    <Button onClick={()=>{setSnapAngle(0)}} selectable={true}><Label>free</Label></Button>
                    <Button onClick={()=>{setSnapAngle(15)}} selectable={true}><Label>15°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(30)}} selectable={true}><Label>30°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(45)}} selectable={true}><Label>45°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(60)}} selectable={true}><Label>60°</Label></Button>
                    <Button onClick={()=>{setSnapAngle(90)}} selectable={true}><Label>90°</Label></Button>
                </RadButton>
                <RadButton angle={baseAngle + sectionAngle*6} radius={r} invisible={gizmoMode !== GizmoMode.Scale}>
                    <Button onClick={()=>{setGizmoScaling(true)}} isSelectedLink={gizmoScaling}><Icon bootstrap="align-center"/></Button>
                    <Button onClick={()=>{setGizmoScaling(false)}} isSelectedLink={!gizmoScaling}><Icon bootstrap="align-start"/></Button>
                </RadButton>

                <RadButton angle={baseAngle + sectionAngle*7} radius={r}>
                    <Button onClick={()=>{setGizmoSpace(GizmoSpace.Local)}} isSelectedLink={gizmoSpace === GizmoSpace.Local}><Icon bootstrap="box"/></Button>
                    <Button onClick={()=>{setGizmoSpace(GizmoSpace.World)}} isSelectedLink={gizmoSpace === GizmoSpace.World}><Icon bootstrap="globe2"/></Button>
                </RadButton>
                <RadButton angle={baseAngle + sectionAngle*9} radius={r}>
                    <Button onClick={()=>{duplicateNode()}}><Icon bootstrap="copy"/></Button>
                </RadButton>
                <RadButton angle={baseAngle + sectionAngle*10} radius={r}>
                    <Button onClick={()=>{deleteNode()}}><Icon bootstrap="trash3"/></Button>
                </RadButton>
            </MovingButton>
            <CreateDialog dialogHandle={createHandle} scene={scene.current} linkedBtnId="create-btn"/>
        </div>
    )
}

export const Canvas = React.forwardRef(CanvasRenderer);