import * as BABYLON from '@babylonjs/core'; 
import { SkyMaterial } from '@babylonjs/materials'

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

const cube = BABYLON.MeshBuilder.CreateBox('box', {}, scene);

engine.runRenderLoop(() => {
    scene.render();
  });
  
  window.addEventListener('resize', () => {
    engine.resize();
  });
  