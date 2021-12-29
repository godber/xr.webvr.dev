/* TODO
 *  - Select Image from list
 *  - Provide Image (drag and drop, or URL box)
 *  - LUT https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_colors_lookuptable.html
 *
 */

import * as THREE from './js/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';
import { ThreeTristogram } from './js/lib-ex5.js';

let camera;
let scene;
let renderer;
let tristogram;

const guiSettings = {
  displayImage: true,
  image: '/images/wallaby_746_600x450.jpg',
  background: 0x111111,
  pointSize: 1,
};

try {
  await init();
} catch (error) {
  console.error(`Error running init(): ${error}`);
}
animate();

function guiInit() {
  const gui = new GUI();
  gui.add(guiSettings, 'displayImage');
  // TODO: fix image selection (requires refactoring)
  gui.add(guiSettings, 'image', {
    rainbow: '/images/rainbow.png',
    gray: '/images/grayscale.png',
    wallaby: '/images/wallaby_746_600x450.jpg',
  });
  gui.add(guiSettings, 'pointSize', 0, 20, 1);
  gui.addColor(guiSettings, 'background');
}

async function init() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(guiSettings.background);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(-200, 200, 450);
  camera.layers.enable(0);
  camera.layers.enable(1);
  scene.add(camera);

  const axesHelper = new THREE.AxesHelper(256);
  scene.add(axesHelper);

  // eslint-disable-next-line no-new
  new OrbitControls(camera, renderer.domElement);
  window.addEventListener('resize', onWindowResize);

  guiInit();

  // populate the tristogram
  tristogram = new ThreeTristogram(scene, guiSettings);
  await tristogram.load(guiSettings.image);
}

function render() {
  // Change Point Sizes
  tristogram.pointsMaterial.size = guiSettings.pointSize;

  // Change the Background Color
  scene.background = new THREE.Color(guiSettings.background);

  // Toggle the Image Display
  if (guiSettings.displayImage === true) {
    camera.layers.enable(1);
  } else if (guiSettings.displayImage === false) {
    camera.layers.disable(1);
  }
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
