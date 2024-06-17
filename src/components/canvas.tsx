import React from "react";
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Vector3, Color3, Vector4 } from '@babylonjs/core/Maths/math';
import { SkyMaterial } from '@babylonjs/materials/sky';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Tools } from '@babylonjs/core/Misc/tools'
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import { Ray } from "@babylonjs/core/Culling/ray";

import { SideMenu, MenuOption } from '../ui/sideMenu'
import { MovingButton, RadialButton, ExpandableRadialButton, AxisMover } from "../ui/multiSwitch";

import { GizmoManager, GizmoMode, GizmoSpace } from "./GizmoManager";
import { Commands, CreateObjectCommand, DeleteObjectCommand } from "../utilities/commands";

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
    
    const [gizmoMode, setGizmoMode] = React.useState(GizmoMode.Translate);
    const [gizmoSpace, setGizmoSpace] = React.useState(GizmoSpace.Local);
    const [gizmoScaling, setGizmoScaling] = React.useState(true);
    const [rootPos, setRootPos] = React.useState(Vector3.Zero());
    const [hiddenSelection, setHiddenSelection] = React.useState(true);
    const [cameraChange, setCameraChange] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    const [axesAngles, setAxesAngles] = React.useState(Vector3.ZeroReadOnly);

    let isMoving = false;
    let wasMoving = false;


    React.useEffect(() => {
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

    React.useEffect(() => {     // has to be declared after gizmoSpace effect or gizmo won't be updated yet
        if(gizmo.current){
            setRootPos(gizmo.current.getRootScreenPosition());
        }
    }, [hiddenSelection]);

    React.useEffect(() => {
        if (gizmo.current) {
            setAxesAngles(gizmo.current.getAxesScreenAngles());
        }
    }, [rootPos, gizmoSpace]);

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
        gizmo.current =  new GizmoManager(setDragging, setRootPos, scene.current, 3.5, 1);
        let inMultiselectMode = false;
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
                    if (!inMultiselectMode) {
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
                            break;
                    }
                    break;
                case KeyboardEventTypes.KEYUP:
                    switch (kbInfo.event.key) {
                        case 'Shift':
                            inMultiselectMode = false;
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
        gizmo.current.getNodes().forEach( n => {
            Commands().execute(new DeleteObjectCommand(n[0]));
        });
        gizmo.current.removeAllNodes();
        setHiddenSelection(true);
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
            if (gizmo.current)
                setRootPos(gizmo.current.getRootScreenPosition());
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

    const r = 15;
    const sectionAngle = 90/6;
    const d = 15

    // todo: maybe also use z-index to represent axis overlap in correct order?
    return (
        <div className="main"> 
            <canvas className='babylon-canvas' ref={canvas} />
            <SideMenu>
                <MenuOption onClick={()=>{Commands().undo(); setHiddenSelection(true), gizmo.current.removeAllNodes()}} icon="arrow-90deg-left"></MenuOption>
            </SideMenu>
            <MovingButton x={rootPos.x} y={rootPos.y} hidden={hiddenSelection} buttonSize={24}>
                <RadialButton angle={sectionAngle*2} radius={r} onClick={() => {setGizmoMode(GizmoMode.Translate)}} icon="arrows-move">
                </RadialButton>
                <RadialButton angle={sectionAngle*3} radius={r} onClick={() => {setGizmoMode(GizmoMode.Rotate)}} icon="arrow-repeat">
                </RadialButton>
                <RadialButton angle={sectionAngle*4} radius={r} onClick={() => {setGizmoMode(GizmoMode.Scale)}} icon="bounding-box-circles">
                </RadialButton>
                <ExpandableRadialButton angle={sectionAngle*6} radius={r} onClick={() => {}} text="0.1m" options={[{text: '0.1m', value: 0.1}]}>
                </ExpandableRadialButton>
                {(gizmoSpace == GizmoSpace.World) ? 
                    <RadialButton angle={sectionAngle*7} radius={r} onClick={()=>{setGizmoSpace(GizmoSpace.Local)}} icon="box">
                    </RadialButton>
                    :
                    <RadialButton angle={sectionAngle*7} radius={r} onClick={()=>{setGizmoSpace(GizmoSpace.World)}} icon="globe2">
                    </RadialButton>
                }
                {(gizmoMode == GizmoMode.Scale)?
                    (gizmoScaling == true) ? 
                        <RadialButton angle={sectionAngle*8} radius={r} onClick={()=>{setGizmoScaling(false)}} icon="align-start"></RadialButton>
                        :
                        <RadialButton angle={sectionAngle*8} radius={r} onClick={()=>{setGizmoScaling(true)}} icon="align-center"></RadialButton>
                    :
                    <></>
                }
                <RadialButton angle={sectionAngle*9.5} radius={r} onClick={()=>{duplicateNode()}} icon="copy">
                </RadialButton>
                <RadialButton angle={sectionAngle*10.5} radius={r} onClick={()=>{deleteNode()}} icon="trash3">
                </RadialButton>
                {(gizmoMode == GizmoMode.Translate )? 
                    <>
                        <RadialButton angle={axesAngles.z + 180} color={'cyan'} radius={10} rotation={axesAngles.z + 180} onClick={()=>{gizmo.current.snapAlongAxis('z', true)}}>
                            <AxisMover dashed={true}/>
                        </RadialButton>
                        <RadialButton angle={axesAngles.y +180} color={'lime'} radius={10} rotation={axesAngles.y + 180} onClick={()=>{gizmo.current.snapAlongAxis('y', true)}}>
                            <AxisMover dashed={true}/>
                        </RadialButton>
                        <RadialButton angle={axesAngles.x + 180} color={'#ff8080'} radius={10} rotation={axesAngles.x + 180} onClick={()=>{gizmo.current.snapAlongAxis('x', true)}}>
                            <AxisMover dashed={true}/>
                        </RadialButton>
                        <RadialButton angle={axesAngles.z} color={'cyan'} radius={10} rotation={axesAngles.z} onClick={()=>{gizmo.current.snapAlongAxis('z')}}>
                            <AxisMover/>
                        </RadialButton>
                        <RadialButton angle={axesAngles.y} color={'lime'} radius={10} rotation={axesAngles.y} onClick={()=>{gizmo.current.snapAlongAxis('y')}}>
                            <AxisMover/>
                        </RadialButton>
                        <RadialButton angle={axesAngles.x} color={'#ff8080'} radius={10} rotation={axesAngles.x} onClick={()=>{gizmo.current.snapAlongAxis('x')}}>
                            <AxisMover/>
                        </RadialButton>
                    </>
                    : 
                    <></>
                 }
            </MovingButton>
        </div>
    )
}

export const Canvas = React.forwardRef(CanvasRenderer);