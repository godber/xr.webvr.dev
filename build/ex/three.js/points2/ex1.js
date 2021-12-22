import * as THREE from './js/three.module.js';
import { VRButton } from './jsm/webxr/VRButton.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

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
  let tristogram;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

  // create a 256x256x256 array full of zeros
  tristogram = Array(256).fill().map(
    () => Array(256).fill().map(
      () => Array(256).fill(0),
    ),
  );

  // populate the tristogram
  const loader = new THREE.TextureLoader();
  const imgUrl = 'https://raw.githubusercontent.com/desertpy/presentations/master/exploring-numpy-godber/wallaby_746_600x450.jpg';
  let totalCount = 0;
  let nonZeroCount = 0;

  let texture;
  try {
    texture = await loader.loadAsync(imgUrl);
  } catch (error) {
    console.error(error);
  }

  const image = getImageData(texture.image);
  for (let x = 0; x < image.width; x++) {
    for (let y = 0; y < image.height; y++) {
      const p = getPixel(image, x, y);
      tristogram[p.r][p.g][p.b] += 1;
    }
  }

  const vertices = [];

  for (let i = 0; i < tristogram.length; i++) {
    for (let j = 0; j < tristogram[i].length; j++) {
      for (let k = 0; k < tristogram[j].length; k++) {
        if (tristogram[i][j][k] !== 0) {
          nonZeroCount++;
          vertices.push(i, j, k);
          // TODO: use the value at this point to do something ... set grayscale
        }
        totalCount++;
      }
    }
  }

  console.log(`totalCount: ${totalCount}, nonZeroCount: ${nonZeroCount}`);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

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

function getImageData(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
}

// call with image.data from getImageData
function getPixel(imageData, x, y) {
  const position = (x + imageData.width * y) * 4;
  const { data } = imageData;
  const pixel = {
    r: data[position],
    g: data[position + 1],
    b: data[position + 2],
    a: data[position + 3],
  };
  return pixel;
}
