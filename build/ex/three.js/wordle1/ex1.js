import * as THREE from './js/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

import { Wordle } from './js/lib-ex1.js';

let camera;
let scene;
let renderer;

try {
  await init();
} catch (error) {
  console.error(`Error running init(): ${error}`);
}
animate();

async function init() {
  await Wordle.load();
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  const s1 = `Wordle 217 5/6

⬛🟨⬛⬛⬛
⬛⬛🟨⬛⬛
⬛⬛⬛🟨⬛
🟩⬛🟨🟨🟩
🟩🟩🟩🟩🟩`;

  const s2 = `Wordle 217 5/6

⬜🟨⬜⬜⬜
⬜⬜🟨⬜⬜
⬜⬜⬜🟨⬜
🟩⬜🟨🟨🟩
🟩🟩🟩🟩🟩`;

  const w = new Wordle(s1);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 4);
  scene.add(directionalLight);
  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);

  scene.add(w.boxArray.boxArrayGroup);
  scene.add(w.textMesh);

  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));
  // eslint-disable-next-line no-new
  new OrbitControls(camera, renderer.domElement);
  window.addEventListener('resize', onWindowResize);
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  renderer.setAnimationLoop(render);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
