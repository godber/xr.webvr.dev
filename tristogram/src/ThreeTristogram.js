import * as THREE from 'three';
import Tristogram from './Tristogram.js';

/**
 * ThreeTristogram class manages Three.js objects for displaying tristogram data.
 * Note: This class is from the original Three.js implementation and is no longer
 * used in the React Three Fiber version. Kept for reference.
 * @deprecated Use the React Three Fiber components in App.jsx instead
 */
class ThreeTristogram {
  /**
   * Creates a new ThreeTristogram instance
   * @param {THREE.Scene} scene - The Three.js scene to add objects to
   * @param {Object} settings - Configuration settings object
   */
  constructor(scene, settings) {
    this.scene = scene;
    this.settings = settings;
  }

  /**
   * Disposes of all Three.js objects and removes them from the scene
   */
  dispose() {
    if (this.pointsGeometry) {
      this.pointsGeometry.dispose();
    }
    if (this.pointsMaterial) {
      this.pointsMaterial.dispose();
    }
    if (this.pointsMesh) {
      this.scene.remove(this.pointsMesh);
    }

    if (this.imageGeometry) {
      this.imageGeometry.dispose();
    }
    if (this.imageMaterial) {
      this.imageMaterial.dispose();
    }
    if (this.imageMesh) {
      this.scene.remove(this.imageMesh);
    }
  }

  /**
   * Loads an image and creates the tristogram visualization
   * @param {string} imageUrl - URL of the image to load and analyze
   */
  async load(imageUrl) {
    let sourceImageTexture;
    const loader = new THREE.TextureLoader();

    try {
      sourceImageTexture = await loader.loadAsync(imageUrl);
    } catch (error) {
      console.error(error);
      return;
    }
    
    const tristogram = new Tristogram(sourceImageTexture.image);

    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tristogram.positions, 3));
    this.pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(tristogram.colors, 4));
    this.pointsMaterial = new THREE.PointsMaterial({
      size: this.settings.pointSize,
      vertexColors: true,
      transparent: true,
      sizeAttenuation: true,
    });
    this.pointsMesh = new THREE.Points(this.pointsGeometry, this.pointsMaterial);
    this.scene.add(this.pointsMesh);

    const imgDisplayHeight = 256;
    const imgDisplayWidth = imgDisplayHeight
      * (sourceImageTexture.image.width / sourceImageTexture.image.height);
    this.imageGeometry = new THREE.PlaneGeometry(imgDisplayWidth, imgDisplayHeight);
    this.imageMaterial = new THREE.MeshBasicMaterial({ map: sourceImageTexture });
    this.imageMesh = new THREE.Mesh(this.imageGeometry, this.imageMaterial);
    this.imageMesh.position.x = -imgDisplayWidth / 2 - 50;
    this.imageMesh.position.y = imgDisplayHeight / 2;
    this.scene.add(this.imageMesh);
  }
}

export default ThreeTristogram;