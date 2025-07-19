import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'lil-gui';
import ThreeTristogram from './ThreeTristogram.js';

let camera;
let scene;
let renderer;
let tristogram;
let oldImage;
let controls;

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
  }).name('Image');
  gui.add(guiSettings, 'pointSize', 1, 20, 1).name('Point Size');
  gui.addColor(guiSettings, 'background').name('Background');
}

async function init() {
  renderer = new THREE.WebGLRenderer({ 
    canvas,
    antialias: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(guiSettings.background);
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.set(-200, 200, 450);
  scene.add(camera);

  const axesHelper = new THREE.AxesHelper(256);
  scene.add(axesHelper);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  
  window.addEventListener('resize', onWindowResize);

  guiInit();

  tristogram = new ThreeTristogram(scene, guiSettings);
  oldImage = guiSettings.image;
  await tristogram.load(guiSettings.image);
}

async function render() {
  controls.update();

  if (tristogram.pointsMaterial) {
    tristogram.pointsMaterial.size = guiSettings.pointSize;
  }

  scene.background = new THREE.Color(guiSettings.background);

  if (guiSettings.image !== oldImage) {
    console.log(`Image changed to ${guiSettings.image}`);
    oldImage = guiSettings.image;
    tristogram.dispose();
    await tristogram.load(guiSettings.image);
  }

  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function dropHandler(ev) {
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      if (ev.dataTransfer.items[i].kind === 'file') {
        const file = ev.dataTransfer.items[i].getAsFile();
        if (file.type.startsWith('image/')) {
          guiSettings.image = URL.createObjectURL(file);
        }
      }
    }
  }
}

function dragOverHandler(ev) {
  ev.preventDefault();
}