import React from "react";
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { SkyMaterial } from '@babylonjs/materials/sky';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Tools } from '@babylonjs/core/Misc/tools'
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import { Ray } from "@babylonjs/core/Culling/ray";
import { MovingButton, RadialButton } from "../ui/multiSwitch";

import { GizmoManager, GizmoMode } from "./GizmoManager";

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

    //deleteNode(node: TransformNode): void

    //duplicateNode(node: TransformNode): void

    //getGizmo(): GizmoManager

    //resetGizmo(): void

    //getGizmoHandle(): SwitchHandle
}

const CanvasRenderer: React.ForwardRefRenderFunction<CanvasHandle, CanvasProps> = (props, env) => {

    const canvas = React.useRef<HTMLCanvasElement>(null);
    const engine = React.useRef<Engine>(null);
    const scene = React.useRef<Scene>(null);
    const gizmo = React.useRef<GizmoManager>(null);
    
    const [gizmoMode, setGizmoMode] = React.useState(GizmoMode.Translate);
    const [rootPos, setRootPos] = React.useState(Vector3.Zero());
    const [hiddenSelection, setHiddenSelection] = React.useState(undefined);
    const [cameraChange, setCameraChange] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);

    let isMoving = false;
    let wasMoving = false;

    React.useEffect(() => {
        if(gizmo.current)
            setRootPos(gizmo.current.getRootScreenPosition())
    }, [hiddenSelection])

    React.useEffect(() => {
        setHiddenSelection(dragging || cameraChange || !gizmo.current?.isActive())
    }, [dragging, cameraChange, gizmo.current?.isActive()])

    React.useEffect(() => {
        gizmo.current?.changeMode(gizmoMode)
    }, [gizmoMode]);

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
		const ground = MeshBuilder.CreateGround('ground', {width:15, height:15}, scene.current);
		const groundMat = new StandardMaterial('groundMat', scene.current);
		const tileTex = new Texture(floor_tex, scene.current);
		tileTex.uScale = ground._width;
		tileTex.vScale = ground._height;
		const tileNormal = new Texture(floor_norm, scene.current);
		tileNormal.uScale = ground._width;
		tileNormal.vScale = ground._height;
		groundMat.diffuseTexture = tileTex;
		groundMat.bumpTexture = tileNormal;
		groundMat.specularColor = new Color3(0.4, 0.4, 0.4);
		groundMat.backFaceCulling = false;
		ground.material = groundMat;
        ground.metadata = {immovable: true};
	}

    const addTestObject = async () => {
        const cube = MeshBuilder.CreateBox('box', {size: 1}, scene.current);
        cube.translate(new Vector3(0, 1, 0), 0.5001);   // avoid clipping with ground
        cube.metadata = {immovable: false};
        const sphere = MeshBuilder.CreateSphere('sphere', {diameter: 1}, scene.current);
        sphere.translate(new Vector3(2, 0.5001, 0), 1);
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
        gizmo.current =  new GizmoManager(setDragging, scene.current, 3.5, 1);
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
                    gizmo.current.removeAllNodes();
                    if (!node.metadata?.immovable) {
                        gizmo.current.addNode(node);
                    }
                    setRootPos(gizmo.current.getRootScreenPosition());
                };
            }
        });
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

    const r = 70;

    return (
        <div className="main"> 
            <canvas className='babylon-canvas' ref={canvas} />
            <MovingButton x={rootPos.x} y={rootPos.y} hidden={hiddenSelection}>
                <RadialButton angle={0} radius={r} onClick={() => {setGizmoMode(GizmoMode.Translate)}}>T</RadialButton>
                <RadialButton angle={45} radius={r} onClick={() => {setGizmoMode(GizmoMode.Rotate)}}>R</RadialButton>
                <RadialButton angle={90} radius={r} onClick={() => {setGizmoMode(GizmoMode.Scale)}}>S</RadialButton>
                <RadialButton angle={180} radius={r} onClick={() => {}}>0</RadialButton>
                <RadialButton angle={210} radius={r} onClick={() => {}}>0</RadialButton>
            </MovingButton>
        </div>
    )
}

export const Canvas = React.forwardRef(CanvasRenderer);