import * as THREE from './js/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

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
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(5, 5, 5);

  const light = new THREE.PointLight(0xffffff, 1);
  light.position.set(-5, 5, 10);
  scene.add(light);
  // TODO: add revolving light

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  const planeGeometry = new THREE.PlaneGeometry(10, 12, 100, 120);
  const material = new THREE.MeshPhongMaterial();
  const texture = new THREE.TextureLoader().load('/images/gothic.jpeg');
  material.map = texture;
  // TODO: add GUI to set this
  // material.wireframe = true;

  const displacementMap = new THREE.TextureLoader().load('/images/gothic-depth.jpeg');
  material.displacementMap = displacementMap;
  // TODO: add GUI to adjust this
  // material.displacementScale = 2;
  // material.displacementBias = 2;

  const plane = new THREE.Mesh(planeGeometry, material);
  scene.add(plane);

  // eslint-disable-next-line no-new
  new OrbitControls(camera, renderer.domElement);
  window.addEventListener('resize', onWindowResize);
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  // TODO: animate camera position to show depth
  renderer.setAnimationLoop(render);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
