import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import { Vector3, Color3 } from '@babylonjs/core/Maths/math';
import { SkyMaterial } from '@babylonjs/materials/sky';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';

import img from '../assets/floortiles.png';
import norm from '../assets/floortiles_normal.png';


const canvas = document.createElement('canvas');
canvas.id = "render-canvas";
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

const engine = new Engine(canvas, true);
const scene = new Scene(engine);

const camera = new ArcRotateCamera('camera1', 0.5, 0.9, 10, Vector3.Zero(), scene);
camera.attachControl(canvas, true);

const skyMaterial = new SkyMaterial("skyMaterial", scene);
skyMaterial.backFaceCulling = false;
skyMaterial.inclination = 0.3;

const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
skybox.material = skyMaterial;

const light = new HemisphericLight('light1', new Vector3(0, 1, 1), scene);

const cube = MeshBuilder.CreateBox('box', {size: 1}, scene);
cube.translate(new Vector3(0, 1, 0), 0.5001);

const ground = MeshBuilder.CreateGround('ground', {width:15, height:15}, scene);
const groundMat = new StandardMaterial('groundMaterial', scene);
const woodTex = new Texture(img, scene);
woodTex.uScale = ground._width;
woodTex.vScale = ground._height;
const normal = new Texture(norm, scene);
normal.uScale = ground._width;
normal.vScale = ground._height;
groundMat.diffuseTexture = woodTex;
groundMat.bumpTexture = normal;
groundMat.specularColor = new Color3(0.4, 0.4, 0.4);
groundMat.backFaceCulling = false;
ground.material = groundMat;

engine.runRenderLoop(() => {
    scene.render();
  });
  
  window.addEventListener('resize', () => {
    engine.resize();
  });
  