import * as BABYLON from '@babylonjs/core'; 
import { SkyMaterial } from '@babylonjs/materials';
import img from '../assets/floortiles.png';
import norm from '../assets/floortiles_normal.png';

const canvas = document.createElement('canvas');
canvas.id = "render-canvas";
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

const camera = new BABYLON.ArcRotateCamera('camera1', 0.5, 0.9, 10, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);

const skyMaterial = new SkyMaterial("skyMaterial", scene);
skyMaterial.backFaceCulling = false;
skyMaterial.inclination = 0.3;

const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
skybox.material = skyMaterial;

const light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);

const cube = BABYLON.MeshBuilder.CreateBox('box', {size: 1}, scene);
cube.translate(new BABYLON.Vector3(0, 1, 0), 0.5001);

const ground = BABYLON.MeshBuilder.CreateGround('ground', {width:15, height:15}, scene);
const groundMat = new BABYLON.StandardMaterial('groundMaterial', scene);
const woodTex = new BABYLON.Texture(img, scene);
woodTex.uScale = ground._width;
woodTex.vScale = ground._height;
const normal = new BABYLON.Texture(norm, scene);
normal.uScale = ground._width;
normal.vScale = ground._height;
groundMat.diffuseTexture = woodTex;
groundMat.bumpTexture = normal;
groundMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
groundMat.backFaceCulling = false;
ground.material = groundMat;

engine.runRenderLoop(() => {
    scene.render();
  });
  
  window.addEventListener('resize', () => {
    engine.resize();
  });
  