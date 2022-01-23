/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
import * as THREE from './three.module.js';
import { FontLoader } from '../jsm/loaders/FontLoader.js';
import { TextGeometry } from '../jsm/geometries/TextGeometry.js';

class Wordle {
  constructor(s) {
    this.darkMode = true;
    // TODO: This should validate the '\n\n' used below
    const re = /Wordle.*/;
    const valid = re.test(s);
    if (!valid) throw new Error(`invalid Wordle string: ${s}`);
    const stringParts = s.split('\n\n');
    let t;
    [this.text, t] = stringParts;
    // Array.from() preserves the Unicode Emoji
    this.boxes = Array.from(t.replaceAll('\n', ''));
    this.darkModeCheck();
    this.boxArray = new BoxArray(this.boxes);
    this.textMesh = this.createText();
  }

  // NOTE: This doesn't handle the case where there are no black/white boxes
  // so it's important that this.darkMode be set by default
  darkModeCheck() {
    for (const c of this.boxes) {
      if (c === '⬛') this.darkMode = true;
      if (c === '⬜') this.darkMode = false;
    }
  }

  createText() {
    const { text } = this;
    const geometry = new TextGeometry(text, {
      font: Wordle.font,
      size: 0.75,
      height: 0.75,
    });
    geometry.computeBoundingBox();
    const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

    const material = new THREE.MeshPhongMaterial({ color: 'rgb(212,214,218)', flatShading: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(centerOffset, 3.5, -0.75 / 2);
    return mesh;
  }

  static font;

  static async load() {
    const loader = new FontLoader();
    Wordle.font = await loader.loadAsync('/fonts/helvetiker_regular.typeface.json');
  }
}

//
class BoxArray {
  constructor(boxes) {
    const rows = Array.from('012345').map(Number);
    const columns = Array.from('01234').map(Number);
    const w = columns.length;
    this.boxArrayGroup = new THREE.Group();
    const l = 0.75;

    for (const row of rows) {
      for (const column of columns) {
        let color = new THREE.Color('rgb(212,214,218)');
        const pos = row * w + column;
        if (pos < boxes.length) {
          const char = boxes[pos];

          switch (char) {
            case '🟩':
              color = new THREE.Color('rgb(97,140,85)');
              break;
            case '🟨':
              color = new THREE.Color('rgb(177,160,76)');
              break;
            case '⬛':
              color = new THREE.Color('rgb(58,58,60)');
              break;
            case '⬜':
              color = new THREE.Color('rgb(122,124,126)');
              break;
            default:
              console.log(`Unexpected character: ${char}`);
          }
        }

        const geometry = new THREE.BoxGeometry(l, l, l);
        const material = new THREE.MeshPhongMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.y = row;
        cube.position.x = column;
        this.boxArrayGroup.add(cube);
      }
    }
    // center on origin
    const bbox = new THREE.Box3().setFromObject(this.boxArrayGroup);
    const centerOffset = -0.5 * (bbox.max.x - bbox.min.x);
    this.boxArrayGroup.rotation.x = Math.PI * 1.0;
    this.boxArrayGroup.position.set(centerOffset, 2.5, 0);
  }
}

// eslint-disable-next-line import/prefer-default-export
export { Wordle, BoxArray };
