/* TODO
 *  - LUT https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_colors_lookuptable.html
 *  - add an adjustable opacity scaling factor
 *  - add min/max thresholding on data and display values
 */

import * as THREE from './js/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { TransformControls } from './jsm/controls/TransformControls.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js';
import { ThreeTristogram } from './js/lib-ex9.js';

let camera;
let cameraGroup;
let scene;
let renderer;
let tristogram;
let oldImage;
const canvas = document.querySelector('canvas.webgl');
canvas.ondrop = dropHandler;
canvas.ondragover = dragOverHandler;

const guiSettings = {
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
  gui.add(guiSettings, 'image', {
    glitchGray: '/images/glitch-art-phone-gray.jpg',
    glitchRed: '/images/glitch-art-phone-r.jpg',
    glitchRB: '/images/glitch-art-phone-rb.jpg',
    glitchRGB: '/images/glitch-art-phone-rbg.jpg',
    glitchR: '/images/glitch-art-phone-red.jpg',
    godberGlitch: '/images/godber-glitch.jpg',
    godber: '/images/godber.jpg',
    rainbow: '/images/rainbow.png',
    gray: '/images/grayscale.png',
    blue: '/images/blue-black-gradient.png',
    green: '/images/green-black-gradient.png',
    red: '/images/red-black-gradient.png',
    wallaby: '/images/wallaby_746_600x450.jpg',
  });
  gui.add(guiSettings, 'pointSize', 1, 20, 1);
  gui.addColor(guiSettings, 'background');
}

async function init() {
  cameraGroup = new THREE.Group();
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(VRButton.createButton(renderer));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(guiSettings.background);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

  // Swap this with the camera group code below to enable VR positioning
  camera.position.set(-200, 200, 450);
  scene.add(camera);
  // cameraGroup.add(camera);
  // cameraGroup.position.set(-200, 200, 450);
  // scene.add(cameraGroup);

  // eslint-disable-next-line no-new
  const orbit = new OrbitControls(camera, renderer.domElement);
  window.addEventListener('resize', onWindowResize);

  // Selector Object
  const selectorGeometry = new THREE.BoxGeometry(50, 50, 50);
  const selectorMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
  });
  const selectorMesh = new THREE.Mesh(selectorGeometry, selectorMaterial);
  selectorMesh.position.set(128, 128, 128);
  scene.add(selectorMesh);

  const control = new TransformControls(
    camera,
    renderer.domElement,
  );

  control.addEventListener('dragging-changed', (event) => {
    orbit.enabled = !event.value;
  });
  control.attach(selectorMesh);
  scene.add(control);

  guiInit();
  control.addEventListener('change', render);

  // populate the tristogram
  tristogram = new ThreeTristogram(
    {
      camera,
      renderer,
      scene,
      render,
    },
    guiSettings,
  );

  oldImage = guiSettings.image;
  await tristogram.load(guiSettings.image);
}

async function render() {
  // Change Point Sizes
  tristogram.pointsMaterial.size = guiSettings.pointSize;

  // Change the Background Color
  scene.background = new THREE.Color(guiSettings.background);

  // FIXME: Kind of works, the old things need deleting.
  if (guiSettings.image !== oldImage) {
    console.log(`image changed to ${guiSettings.image}`);
    oldImage = guiSettings.image;
    tristogram.dispose();
    await tristogram.load(guiSettings.image);
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

function dropHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (ev.dataTransfer.items[i].kind === 'file') {
        const file = ev.dataTransfer.items[i].getAsFile();
        guiSettings.image = URL.createObjectURL(file);
      }
    }
  } else {
    // Use DataTransfer interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log(`... file[${i}].name = ${ev.dataTransfer.files[i].name}`);
    }
  }
}

function dragOverHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}
