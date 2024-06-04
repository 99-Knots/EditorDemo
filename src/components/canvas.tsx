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

import { GizmoManager } from "./gizmoManager";

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
	}

	const setupSky = async () => {
		const sunPosition = new Vector3(50, 120, -100);

		const skyMaterial = new SkyMaterial('skyMat', scene.current);
		skyMaterial.backFaceCulling = false;
		skyMaterial.useSunPosition = true;
		skyMaterial.sunPosition = sunPosition;

		const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, scene.current);
		skybox.material = skyMaterial;

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
	}

    const addTestObject = async () => {
        const cube = MeshBuilder.CreateBox('box', {size: 1}, scene.current);
        cube.translate(new Vector3(0, 1, 0), 0.5001);   // avoid clipping with ground
        cube.metadata = {selectable: true}
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
        gizmo.current =  new GizmoManager(scene.current, 3.5, 1);
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
                    if (node.metadata?.selectable) {
                        gizmo.current.addNode(node);
                    }
                };
            }
        });
    }

    const runLoop = async () => {
        engine.current.runRenderLoop(() => {
            scene.current.render();
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

    return (
        <canvas className='babylon-canvas' ref={canvas} ></canvas>
    )
}

export const Canvas = React.forwardRef(CanvasRenderer);