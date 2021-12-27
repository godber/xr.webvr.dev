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
import { Tristogram } from './js/lib-ex2.js';

let camera;
let scene;
let renderer;
let points;
let material;

// const imageUrls = {
//   rainbow: '/images/rainbow.png',
//   grayscale: '/images/grayscale.png',
//   wallaby: '/images/wallaby_746_600x450.jpg',
// };

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
  gui.add(guiSettings, 'displayImage')
  gui.add(guiSettings, 'image', [
    '/images/rainbow.png',
    '/images/grayscale.png',
    '/images/wallaby_746_600x450.jpg',
  ]);
  gui.add(guiSettings, 'pointSize', 0, 20, 1);
  gui.addColor(guiSettings, 'background');
}

async function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(guiSettings.background);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  camera.position.x = -200;
  camera.position.y = 200;
  camera.position.z = 450;
  camera.layers.enable(0);
  camera.layers.enable(1);
  scene.add(camera);
  const axesHelper = new THREE.AxesHelper(256);
  scene.add(axesHelper);

  guiInit();

  // populate the tristogram
  const loader = new THREE.TextureLoader();
  // const imgUrl = '/images/grayscale.png';
  // const imgUrl = '/images/rainbow.png';
  const imgUrl = '/images/wallaby_746_600x450.jpg';

  let texture;
  try {
    texture = await loader.loadAsync(imgUrl);
  } catch (error) {
    console.error(error);
  }

  const tristogram = new Tristogram(texture.image);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(tristogram.positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(tristogram.colors, 3));

  material = new THREE.PointsMaterial(
    { size: guiSettings.pointSize, vertexColors: true },
  );
  points = new THREE.Points(geometry, material);
  points.layers.set(0);
  scene.add(points);

  const imgDisplayHeight = 256;
  const imgDisplayWidth = imgDisplayHeight * texture.image.width/texture.image.height
  const imgGeometry = new THREE.PlaneGeometry( imgDisplayWidth, imgDisplayHeight );
  const imgMaterial = new THREE.MeshBasicMaterial( { map: texture } );
  const imgMesh = new THREE.Mesh( imgGeometry, imgMaterial );
  imgMesh.layers.set(1);
  imgMesh.position.x = - imgDisplayWidth/2 - 50;
  imgMesh.position.y = imgDisplayHeight/2;
  scene.add( imgMesh );

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
  material.size = guiSettings.pointSize;
  scene.background = new THREE.Color(guiSettings.background);
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
