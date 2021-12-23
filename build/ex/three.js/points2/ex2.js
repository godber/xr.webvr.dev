import * as THREE from './js/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { Tristogram } from './js/lib-ex2.js';

let camera;
let scene;
let renderer;
let points;

try {
  await init();
} catch (error) {
  console.error(`Error running init(): ${error}`);
}
animate();

async function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

  // populate the tristogram
  const loader = new THREE.TextureLoader();
  const imgUrl = 'https://raw.githubusercontent.com/desertpy/presentations/master/exploring-numpy-godber/wallaby_746_600x450.jpg';

  let texture;
  try {
    texture = await loader.loadAsync(imgUrl);
  } catch (error) {
    console.error(error);
  }

  const tristogram = new Tristogram(texture.image);

  console.log(`totalCount: ${tristogram.totalCount}, nonZeroCount: ${tristogram.nonZeroCount}`);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(tristogram.vertices, 3));

  const material = new THREE.PointsMaterial(
    { color: 0xffffff, size: 5 },
  );
  points = new THREE.Points(geometry, material);

  scene.add(points);

  camera.position.z = 2500;

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
  const time = Date.now() * 0.0001;

  points.rotation.x = time * 0.25;
  points.rotation.y = time * 0.5;
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
