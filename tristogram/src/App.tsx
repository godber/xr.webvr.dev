import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import Tristogram from './Tristogram.ts';

interface TristogramVisualizationProps {
  droppedImageUrl: string | null;
}

interface ImageData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
}

extend({ OrbitControls });

/**
 * TristogramVisualization component renders a 3D color histogram visualization
 * using React Three Fiber. It displays both a point cloud representation of the
 * color distribution and a 2D preview of the source image.
 */
function TristogramVisualization({ droppedImageUrl }: TristogramVisualizationProps): JSX.Element {
  const pointsRef = useRef<THREE.Points | null>(null);
  const imageRef = useRef<THREE.Mesh | null>(null);
  const { scene } = useThree();
  
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const [tristogramInstance, setTristogramInstance] = useState<Tristogram | null>(null);

  const { 
    image, 
    pointSize, 
    background,
    visualizationMode,
    minThreshold,
    maxThreshold
  } = useControls({
    image: {
      value: './images/wallaby_746_600x450.jpg',
      options: {
        glitchGray: './images/glitch-art-phone-gray.jpg',
        glitchRed: './images/glitch-art-phone-r.jpg',
        glitchRB: './images/glitch-art-phone-rb.jpg',
        glitchRGB: './images/glitch-art-phone-rbg.jpg',
        glitchR: './images/glitch-art-phone-red.jpg',
        godberGlitch: './images/godber-glitch.jpg',
        godber: './images/godber.jpg',
        rainbow: './images/rainbow.png',
        gray: './images/grayscale.png',
        blue: './images/blue-black-gradient.png',
        green: './images/green-black-gradient.png',
        red: './images/red-black-gradient.png',
        wallaby: './images/wallaby_746_600x450.jpg',
      }
    },
    visualizationMode: {
      value: 'opacity',
      options: {
        'Opacity': 'opacity',
        'Point Size': 'size'
      }
    },
    pointSize: { value: 1, min: 1, max: 20, step: 1 },
    minThreshold: { value: 0.0, min: 0.0, max: 1.0, step: 0.01, label: 'Min Frequency' },
    maxThreshold: { value: 1.0, min: 0.0, max: 1.0, step: 0.01, label: 'Max Frequency' },
    background: '#111111'
  });

  React.useEffect(() => {
    scene.background = new THREE.Color(background);
  }, [background, scene]);

  // Update shader uniform when pointSize changes
  React.useEffect(() => {
    if (pointsRef.current && pointsRef.current.material instanceof THREE.ShaderMaterial) {
      pointsRef.current.material.uniforms.sizeScale.value = pointSize;
    }
  }, [pointSize]);

  const currentImageUrl = droppedImageUrl || image;

  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      currentImageUrl,
      (texture) => {
        const tristogram = Tristogram.fromHTMLImage(texture.image, { 
          visualizationMode: visualizationMode as 'opacity' | 'size' 
        });
        setTristogramInstance(tristogram);
        setImageTexture(texture);
      },
      undefined,
      (error) => {
        console.error('Error loading image:', error);
      }
    );
  }, [currentImageUrl, visualizationMode]);

  // Update filtered data when thresholds change
  React.useEffect(() => {
    if (tristogramInstance) {
      // Ensure min <= max
      const min = Math.min(minThreshold, maxThreshold);
      const max = Math.max(minThreshold, maxThreshold);
      const filteredData = tristogramInstance.getFilteredData(min, max);
      setImageData(filteredData);
    }
  }, [tristogramInstance, minThreshold, maxThreshold]);

  const pointsGeometry = useMemo((): THREE.BufferGeometry | null => {
    if (!imageData) return null;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(imageData.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(imageData.colors, 4));
    
    // Add size attribute for variable point sizes
    if (visualizationMode === 'size') {
      geometry.setAttribute('size', new THREE.Float32BufferAttribute(imageData.sizes, 1));
    }
    
    return geometry;
  }, [imageData, visualizationMode]);

  const pointsMaterial = useMemo((): THREE.PointsMaterial | THREE.ShaderMaterial => {
    if (visualizationMode === 'size') {
      // Custom shader material for variable point sizes
      return new THREE.ShaderMaterial({
        uniforms: {
          sizeScale: { value: pointSize }
        },
        vertexShader: `
          uniform float sizeScale;
          attribute float size;
          attribute vec4 color;
          varying vec4 vColor;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * sizeScale;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec4 vColor;
          
          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            if (length(center) > 0.5) discard;
            gl_FragColor = vColor;
          }
        `,
        transparent: true,
      });
    } else {
      return new THREE.PointsMaterial({
        size: pointSize,
        vertexColors: true,
        transparent: true,
        sizeAttenuation: true,
      });
    }
  }, [pointSize, visualizationMode]);

  const imageGeometry = useMemo((): THREE.PlaneGeometry | null => {
    if (!imageTexture) return null;
    
    const imgDisplayHeight = 256;
    const imgDisplayWidth = imgDisplayHeight * (imageTexture.image.width / imageTexture.image.height);
    return new THREE.PlaneGeometry(imgDisplayWidth, imgDisplayHeight);
  }, [imageTexture]);

  const imageMaterial = useMemo((): THREE.MeshBasicMaterial | null => {
    if (!imageTexture) return null;
    return new THREE.MeshBasicMaterial({ map: imageTexture });
  }, [imageTexture]);

  const imagePosition = useMemo((): [number, number, number] => {
    if (!imageTexture) return [0, 0, 0];
    
    const imgDisplayHeight = 256;
    const imgDisplayWidth = imgDisplayHeight * (imageTexture.image.width / imageTexture.image.height);
    return [-imgDisplayWidth / 2 - 50, imgDisplayHeight / 2, 0];
  }, [imageTexture]);

  return (
    <>
      <axesHelper args={[256]} />
      
      {pointsGeometry && pointsMaterial && (
        <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
      )}
      
      {imageGeometry && imageMaterial && (
        <mesh ref={imageRef} geometry={imageGeometry} material={imageMaterial} position={imagePosition} />
      )}
      
      <OrbitControls enableDamping dampingFactor={0.25} />
    </>
  );
}

/**
 * Main App component that provides the React Three Fiber canvas and handles
 * drag-and-drop functionality for image files. Creates a full-screen 3D
 * visualization with interactive controls.
 */
function App(): JSX.Element {
  const [droppedImageUrl, setDroppedImageUrl] = useState<string | null>(null);

  /**
   * Prevents default drag behavior to enable drop functionality
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  }, []);

  /**
   * Handles dropped image files by creating object URLs and updating state
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    
    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        if (event.dataTransfer.items[i].kind === 'file') {
          const file = event.dataTransfer.items[i].getAsFile();
          if (file && file.type.startsWith('image/')) {
            console.log('Dropped image file:', file.name);
            const imageUrl = URL.createObjectURL(file);
            setDroppedImageUrl(imageUrl);
          }
        }
      }
    }
  }, []);

  return (
    <div 
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Canvas
        camera={{ 
          position: [-200, 200, 450], 
          fov: 75, 
          near: 0.1, 
          far: 5000 
        }}
        gl={{ antialias: true }}
      >
        <TristogramVisualization droppedImageUrl={droppedImageUrl} />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '14px',
        pointerEvents: 'none',
        zIndex: 100
      }}>
        Drag and drop an image to analyze its color histogram
      </div>
    </div>
  );
}

export default App;