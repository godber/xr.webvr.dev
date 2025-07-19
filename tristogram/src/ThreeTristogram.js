import * as THREE from 'three';
import Tristogram from './Tristogram.js';

class ThreeTristogram {
  constructor(scene, settings) {
    this.scene = scene;
    this.settings = settings;
  }

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