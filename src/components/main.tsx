
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

import floor_tex from '../../assets/floortiles.png';
import floor_norm from '../../assets/floortiles_normal.png';

const canvas = document.createElement('canvas');
canvas.id = 'render-canvas';
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

export function setupEngine() {

	const engine = new Engine(canvas, true);
	const scene = new Scene(engine);

	const setupCamera = async () => {
		const arcRotCamera = new ArcRotateCamera('camera1arc', Tools.ToRadians(-90), Tools.ToRadians(60), 10, Vector3.Zero(), scene);
		arcRotCamera.lowerRadiusLimit = 2;
		arcRotCamera.upperRadiusLimit = 45;
		arcRotCamera.upperBetaLimit = Tools.ToRadians(89.9); // todo: Adjust to mouse wheel ? like in unreal
		arcRotCamera.wheelDeltaPercentage = 0.01;
		arcRotCamera.speed = 1;
		arcRotCamera.attachControl(canvas, true);
	}

	const setupSky = async () => {
		const sunPosition = new Vector3(50, 120, -100);

		const skyMaterial = new SkyMaterial('skyMat', scene);
		skyMaterial.backFaceCulling = false;
		skyMaterial.useSunPosition = true;
		skyMaterial.sunPosition = sunPosition;

		const skybox = MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, scene);
		skybox.material = skyMaterial;

		const light = new HemisphericLight('hemisphereLight', sunPosition, scene);
	}

	const setupFloor = async () => {
		const ground = MeshBuilder.CreateGround('ground', {width:15, height:15}, scene);
		const groundMat = new StandardMaterial('groundMat', scene);
		const tileTex = new Texture(floor_tex, scene);
		tileTex.uScale = ground._width;
		tileTex.vScale = ground._height;
		const tileNormal = new Texture(floor_norm, scene);
		tileNormal.uScale = ground._width;
		tileNormal.vScale = ground._height;
		groundMat.diffuseTexture = tileTex;
		groundMat.bumpTexture = tileNormal;
		groundMat.specularColor = new Color3(0.4, 0.4, 0.4);
		groundMat.backFaceCulling = false;
		ground.material = groundMat;
		
	}

	setupCamera();
	setupSky();
	setupFloor();

	const cube = MeshBuilder.CreateBox('box', {size: 1}, scene);
	cube.translate(new Vector3(0, 1, 0), 0.5001);   // avoid clipping with ground

	engine.runRenderLoop(() => {
			scene.render();
		});

		window.addEventListener('resize', () => {
			engine.resize();
		});
	
}

//setupEngine();