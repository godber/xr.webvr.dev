import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useThree, extend, ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import Tristogram from './Tristogram.ts';

interface TristogramVisualizationProps {
  droppedImageUrl: string | null;
  onClusterResult?: (result: ClusterResult | null) => void;
  onSelectedCluster?: (clusterId: number | null) => void;
  onTristogramInstance?: (instance: Tristogram | null) => void;
  onFilteredDataInfo?: (info: { totalColors: number, filteredColors: number } | null) => void;
  runClustering?: boolean;
  onClusteringProgress?: (progress: string) => void;
  onClusteringComplete?: () => void;
}

interface ImageData {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  filteredIndices: number[];
}

interface ClusterInfo {
  id: number;
  points: number[];
  centroid: [number, number, number];
  totalFrequency: number;
  averageColor: [number, number, number];
}

interface ClusterResult {
  clusters: ClusterInfo[];
  noise: number[];
  labels: number[];
}

extend({ OrbitControls });

/**
 * TristogramVisualization component renders a 3D color histogram visualization
 * using React Three Fiber. It displays both a point cloud representation of the
 * color distribution and a 2D preview of the source image.
 */
function TristogramVisualization({ droppedImageUrl, onClusterResult, onSelectedCluster, onTristogramInstance, onFilteredDataInfo, runClustering, onClusteringProgress, onClusteringComplete }: TristogramVisualizationProps): JSX.Element {
  const pointsRef = useRef<THREE.Points | null>(null);
  const imageRef = useRef<THREE.Mesh | null>(null);
  const { scene } = useThree();
  
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null);
  const [tristogramInstance, setTristogramInstance] = useState<Tristogram | null>(null);
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);


  const { 
    image, 
    pointSize, 
    background,
    visualizationMode,
    minThreshold,
    maxThreshold,
    epsilon,
    minPoints,
    showClusterCentroids,
    colorByClusters
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
    minThreshold: { 
      value: 0.0, 
      min: 0.0, 
      max: 1.0, 
      step: 0.01, 
      label: 'Min Frequency'
    },
    maxThreshold: { 
      value: 1.0, 
      min: 0.0, 
      max: 1.0, 
      step: 0.01, 
      label: 'Max Frequency'
    },
    background: '#111111',
    epsilon: { value: 20, min: 5, max: 50, step: 1, label: 'DBSCAN Epsilon' },
    minPoints: { value: 3, min: 2, max: 10, step: 1, label: 'DBSCAN Min Points' },
    showClusterCentroids: { value: true, label: 'Show Centroids' },
    colorByClusters: { value: false, label: 'Color by Clusters' }
  });

  // Debug: Log actual threshold values from useControls
  React.useEffect(() => {
    console.log(`🔍 Current threshold values: minThreshold=${minThreshold}, maxThreshold=${maxThreshold}`);
  }, [minThreshold, maxThreshold]);


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
        onTristogramInstance?.(tristogram);
      },
      undefined,
      (error) => {
        console.error('Error loading image:', error);
      }
    );
  }, [currentImageUrl, visualizationMode, onTristogramInstance]);

  // Run clustering when manually triggered
  React.useEffect(() => {
    if (runClustering && tristogramInstance && imageData) {
      const effectiveColorCount = imageData.positions.length / 3;
      
      console.log(`🎯 Image processed: ${tristogramInstance.scaledDimensions.width}×${tristogramInstance.scaledDimensions.height} pixels`);
      console.log(`🎨 Colors after filtering: ${effectiveColorCount} (total: ${tristogramInstance.nonZeroCount})`);
      console.log(`📊 Expected DBSCAN complexity: ~${(effectiveColorCount ** 2).toLocaleString()} distance calculations`);
      
      onClusteringProgress?.('Starting clustering...');
      
      // Warn about very large datasets
      if (effectiveColorCount > 10000) {
        const estimatedTime = Math.round(effectiveColorCount / 1000);
        console.warn(`⚠️  Large dataset detected! This may take ${estimatedTime}+ seconds to cluster.`);
        console.warn(`💡 Consider using frequency filtering (Min/Max Frequency sliders) to reduce dataset size first.`);
      }
      
      // Safety check - prevent browser freeze on massive datasets
      if (effectiveColorCount > 20000) {
        console.error(`🛑 Dataset too large (${effectiveColorCount} colors) - clustering skipped to prevent browser freeze.`);
        console.error(`💡 Try increasing Min Frequency threshold to reduce dataset size, or use a simpler image.`);
        onClusteringProgress?.('Dataset too large');
        onClusteringComplete?.();
        return;
      }
      
      // Use setTimeout to make clustering non-blocking
      setTimeout(() => {
        try {
          onClusteringProgress?.('Running DBSCAN...');
          console.log(`🎯 Clustering ${effectiveColorCount} pre-filtered colors`);
          const clusters = tristogramInstance.dbscanClusteringWithIndices(epsilon, minPoints, imageData.filteredIndices);
          setClusterResult(clusters);
          onClusterResult?.(clusters);
          onClusteringProgress?.('Clustering complete');
          onClusteringComplete?.();
        } catch (error) {
          console.error('Clustering failed:', error);
          onClusteringProgress?.('Clustering failed');
          onClusteringComplete?.();
        }
      }, 100);
    }
  }, [runClustering, tristogramInstance, imageData, epsilon, minPoints, onClusterResult, onClusteringProgress, onClusteringComplete]);

  // Update filtered data when thresholds change
  React.useEffect(() => {
    console.log(`🔄 useEffect triggered: minThreshold=${minThreshold}, maxThreshold=${maxThreshold}, tristogramInstance=${!!tristogramInstance}`);
    if (tristogramInstance) {
      // Ensure min <= max and handle NaN values
      const minVal = isNaN(minThreshold) ? 0.0 : minThreshold;
      const maxVal = isNaN(maxThreshold) ? 1.0 : maxThreshold;
      const min = Math.min(minVal, maxVal);
      const max = Math.max(minVal, maxVal);
      console.log(`🔄 About to call getFilteredData with min=${min}, max=${max}`);
      const filteredData = tristogramInstance.getFilteredData(min, max);
      console.log(`🔍 Filtering: min=${min}, max=${max}, total=${tristogramInstance.nonZeroCount}, filtered=${filteredData.count}`);
      console.log(`📊 Original positions length: ${tristogramInstance.positions.length}, filtered: ${filteredData.positions.length}`);
      console.log(`🎯 Setting imageData with ${filteredData.count} points`);
      setImageData(filteredData);
      
      // Send filtered data info to parent
      onFilteredDataInfo?.({
        totalColors: tristogramInstance.nonZeroCount,
        filteredColors: filteredData.count
      });
    }
  }, [tristogramInstance, minThreshold, maxThreshold, onFilteredDataInfo]);

  // HSL to RGB conversion utility
  const hslToRgb = useCallback((h: number, s: number, l: number): number[] => {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
      r = c; g = 0; b = x;
    }
    
    return [r + m, g + m, b + m];
  }, []);

  // Generate cluster-based colors
  const generateClusterColors = useCallback((imageData: ImageData, clusterResult: ClusterResult, tristogram: Tristogram): Float32Array => {
    const colors = new Float32Array(imageData.colors.length);
    const numPoints = imageData.positions.length / 3;
    
    // Generate distinct colors for each cluster
    const clusterColors = clusterResult.clusters.map((_, index) => {
      const hue = (index * 137.5) % 360; // Golden angle for good separation
      return hslToRgb(hue / 360, 0.7, 0.6);
    });
    
    const noiseColor = [0.3, 0.3, 0.3]; // Gray for noise points
    
    for (let i = 0; i < numPoints; i++) {
      const clusterId = clusterResult.labels[i];
      let color: number[];
      
      if (clusterId === -2) {
        // Noise point
        color = noiseColor;
      } else if (clusterId >= 0 && clusterId < clusterColors.length) {
        // Cluster point
        color = clusterColors[clusterId];
      } else {
        // Fallback
        color = [1, 1, 1];
      }
      
      colors[i * 4] = color[0];
      colors[i * 4 + 1] = color[1];
      colors[i * 4 + 2] = color[2];
      colors[i * 4 + 3] = visualizationMode === 'opacity' ? (tristogram.values[i] / tristogram.maxValue) : 1;
    }
    
    return colors;
  }, [visualizationMode, hslToRgb]);

  // Generate colors highlighting selected cluster
  const generateSelectedClusterColors = useCallback((imageData: ImageData, clusterResult: ClusterResult, _tristogram: Tristogram): Float32Array => {
    const colors = new Float32Array(imageData.colors.length);
    const numPoints = imageData.positions.length / 3;
    
    for (let i = 0; i < numPoints; i++) {
      const clusterId = clusterResult.labels[i];
      
      if (clusterId === selectedCluster) {
        // Highlight selected cluster in bright color
        colors[i * 4] = 1.0;     // r
        colors[i * 4 + 1] = 0.2; // g
        colors[i * 4 + 2] = 0.2; // b
        colors[i * 4 + 3] = 1.0; // a
      } else {
        // Dim other points
        colors[i * 4] = 0.3;     // r
        colors[i * 4 + 1] = 0.3; // g
        colors[i * 4 + 2] = 0.3; // b
        colors[i * 4 + 3] = 0.3; // a
      }
    }
    
    return colors;
  }, [selectedCluster]);

  const pointsGeometry = useMemo((): THREE.BufferGeometry | null => {
    console.log(`🎨 pointsGeometry useMemo triggered`);
    if (!imageData) {
      console.log(`❌ No imageData available`);
      return null;
    }
    
    const pointCount = imageData.positions.length / 3;
    console.log(`✅ Creating geometry with ${pointCount} points (filtered from ${tristogramInstance?.nonZeroCount || 'unknown'} total)`);
    console.log(`📐 Position array length: ${imageData.positions.length}, Color array length: ${imageData.colors.length}`);
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(imageData.positions, 3));
    
    // Use cluster colors if clustering results exist and colorByClusters is true
    let colors = imageData.colors;
    if (colorByClusters && clusterResult && tristogramInstance) {
      colors = generateClusterColors(imageData, clusterResult, tristogramInstance);
    } else if (selectedCluster !== null && clusterResult && tristogramInstance) {
      // Highlight selected cluster even without colorByClusters
      colors = generateSelectedClusterColors(imageData, clusterResult, tristogramInstance);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    
    // Add size attribute for variable point sizes
    if (visualizationMode === 'size') {
      geometry.setAttribute('size', new THREE.Float32BufferAttribute(imageData.sizes, 1));
    }
    
    console.log(`🎨 Geometry created successfully with ${pointCount} points`);
    return geometry;
  }, [imageData, visualizationMode, colorByClusters, clusterResult, tristogramInstance, selectedCluster, generateClusterColors, generateSelectedClusterColors, minThreshold, maxThreshold]);

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

  const clusterCentroidsGeometry = useMemo((): THREE.BufferGeometry | null => {
    if (!showClusterCentroids || !clusterResult) return null;
    
    const positions = new Float32Array(clusterResult.clusters.length * 3);
    const colors = new Float32Array(clusterResult.clusters.length * 4);
    
    clusterResult.clusters.forEach((cluster, index) => {
      positions[index * 3] = cluster.centroid[0];
      positions[index * 3 + 1] = cluster.centroid[1];
      positions[index * 3 + 2] = cluster.centroid[2];
      
      // Use bright colors for centroids
      const hue = (index * 137.5) % 360;
      const color = hslToRgb(hue / 360, 1.0, 0.8);
      colors[index * 4] = color[0];
      colors[index * 4 + 1] = color[1];
      colors[index * 4 + 2] = color[2];
      colors[index * 4 + 3] = 1.0;
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    
    return geometry;
  }, [showClusterCentroids, clusterResult, hslToRgb]);

  const centroidsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      sizeAttenuation: true,
    });
  }, []);

  // Handle cluster centroid clicks
  const handleCentroidClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    if (!clusterResult) return;
    
    event.stopPropagation();
    
    // Find the closest centroid to the click point
    const clickPoint = event.point;
    let closestClusterId = -1;
    let minDistance = Infinity;
    
    clusterResult.clusters.forEach((cluster) => {
      const distance = clickPoint.distanceTo(new THREE.Vector3(
        cluster.centroid[0],
        cluster.centroid[1], 
        cluster.centroid[2]
      ));
      
      if (distance < minDistance) {
        minDistance = distance;
        closestClusterId = cluster.id;
      }
    });
    
    const newSelection = closestClusterId === selectedCluster ? null : closestClusterId;
    setSelectedCluster(newSelection);
    onSelectedCluster?.(newSelection);
  }, [clusterResult, selectedCluster, onSelectedCluster]);

  return (
    <>
      <axesHelper args={[256]} />
      
      {pointsGeometry && pointsMaterial && (
        <points ref={pointsRef} geometry={pointsGeometry} material={pointsMaterial} />
      )}
      
      {clusterCentroidsGeometry && centroidsMaterial && (
        <points 
          geometry={clusterCentroidsGeometry} 
          material={centroidsMaterial}
          onClick={handleCentroidClick}
        />
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
  const [clusterResult, setClusterResult] = useState<ClusterResult | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [tristogramInstance, setTristogramInstance] = useState<Tristogram | null>(null);
  const [filteredDataInfo, setFilteredDataInfo] = useState<{ totalColors: number, filteredColors: number } | null>(null);
  const [isClusteringRunning, setIsClusteringRunning] = useState<boolean>(false);
  const [clusteringProgress, setClusteringProgress] = useState<string>('');

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

  // Handle clustering button click
  const handleClusteringClick = useCallback(() => {
    console.log(`🔘 Clustering button clicked! isClusteringRunning=${isClusteringRunning}, clusterResult=${!!clusterResult}`);
    
    if (isClusteringRunning) {
      console.log(`🔘 Clustering already running, ignoring click`);
      return; // Prevent double-clicks during clustering
    }
    
    if (clusterResult) {
      // Clear existing clusters
      console.log(`🔘 Clearing existing clusters`);
      setClusterResult(null);
      setSelectedCluster(null);
      setClusteringProgress('');
    } else {
      // Start clustering
      console.log(`🔘 Starting clustering...`);
      setIsClusteringRunning(true);
      setClusteringProgress('Preparing...');
    }
  }, [isClusteringRunning, clusterResult]);

  // Determine button text and state using filtered data info
  const getButtonState = useCallback(() => {
    console.log(`🔘 Getting button state: filteredDataInfo=${!!filteredDataInfo}, isClusteringRunning=${isClusteringRunning}, clusterResult=${!!clusterResult}`);
    
    if (!filteredDataInfo) {
      return { text: 'Load Image First', disabled: true, color: '#666' };
    }
    
    // Use filtered data info (which is updated by the same filtering logic)
    const effectiveCount = filteredDataInfo.filteredColors;
    console.log(`🔘 Effective count: ${effectiveCount}`);
    
    if (effectiveCount > 20000) {
      return { text: '🛑 Too Many Colors', disabled: true, color: '#ff4444' };
    }
    
    if (isClusteringRunning) {
      return { text: `Clustering... ${clusteringProgress}`, disabled: true, color: '#ffa500' };
    }
    
    if (clusterResult) {
      return { text: 'Clear Clusters', disabled: false, color: '#ff6666' };
    }
    
    if (effectiveCount > 10000) {
      return { text: `⚠️ Run Clustering (${Math.round(effectiveCount / 1000)}+ sec)`, disabled: false, color: '#ffa500' };
    }
    
    return { text: `Run Clustering (${effectiveCount.toLocaleString()} colors)`, disabled: false, color: '#44ff44' };
  }, [filteredDataInfo, isClusteringRunning, clusteringProgress, clusterResult]);

  const buttonState = getButtonState();
  console.log(`🔘 Button state:`, buttonState);

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
        <TristogramVisualization 
          droppedImageUrl={droppedImageUrl}
          onClusterResult={setClusterResult}
          onSelectedCluster={setSelectedCluster}
          onTristogramInstance={setTristogramInstance}
          onFilteredDataInfo={setFilteredDataInfo}
          runClustering={isClusteringRunning}
          onClusteringProgress={setClusteringProgress}
          onClusteringComplete={() => setIsClusteringRunning(false)}
        />
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
        <div>Drag and drop an image to analyze its color histogram</div>
        {tristogramInstance && tristogramInstance.originalDimensions && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <div>Image: {tristogramInstance.originalDimensions.width}×{tristogramInstance.originalDimensions.height}</div>
            {(tristogramInstance.originalDimensions.width > 256 || tristogramInstance.originalDimensions.height > 256) && (
              <div style={{ color: '#ffa500', marginTop: '2px' }}>
                ⚠️ Scaled to {tristogramInstance.scaledDimensions.width}×{tristogramInstance.scaledDimensions.height} for clustering performance
              </div>
            )}
          </div>
        )}
        {filteredDataInfo && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <div>
              Unique colors: {filteredDataInfo.totalColors.toLocaleString()}
              {(filteredDataInfo.filteredColors !== filteredDataInfo.totalColors) && (
                <span> → {filteredDataInfo.filteredColors.toLocaleString()} filtered</span>
              )}
            </div>
            {(() => {
              const effectiveCount = filteredDataInfo.filteredColors;
              
              if (effectiveCount > 20000) {
                return (
                  <div style={{ color: '#ff4444', marginTop: '2px' }}>
                    🛑 Too many colors for clustering ({effectiveCount.toLocaleString()})
                  </div>
                );
              }
              
              if (effectiveCount > 10000 && effectiveCount <= 20000) {
                return (
                  <div style={{ color: '#ffa500', marginTop: '2px' }}>
                    ⚠️ Large dataset - clustering may be slow ({Math.round(effectiveCount / 1000)}+ seconds)
                  </div>
                );
              }
              
              if (effectiveCount <= 5000 && filteredDataInfo.totalColors > 5000) {
                return (
                  <div style={{ color: '#44ff44', marginTop: '2px' }}>
                    ✅ Good size for clustering ({effectiveCount.toLocaleString()} colors)
                  </div>
                );
              }
              
              return null;
            })()}
          </div>
        )}
        
        {/* Clustering Button */}
        {filteredDataInfo && (
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={handleClusteringClick}
              disabled={buttonState.disabled}
              style={{
                padding: '10px 15px',
                fontSize: '14px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '5px',
                backgroundColor: buttonState.disabled ? '#333' : buttonState.color,
                color: buttonState.disabled ? '#666' : '#000',
                cursor: buttonState.disabled ? 'not-allowed' : 'pointer',
                opacity: buttonState.disabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                minWidth: '200px',
                pointerEvents: 'auto'
              }}
            >
              {buttonState.text}
            </button>
          </div>
        )}
        
        {clusterResult && (
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            <div>Clusters found: {clusterResult.clusters.length}</div>
            <div>Noise points: {clusterResult.noise.length}</div>
            {selectedCluster !== null && clusterResult.clusters[selectedCluster] && (
              <div style={{ marginTop: '5px', padding: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }}>
                <div><strong>Selected Cluster {selectedCluster}:</strong></div>
                <div>Points: {clusterResult.clusters[selectedCluster].points.length}</div>
                <div>Frequency: {clusterResult.clusters[selectedCluster].totalFrequency}</div>
                <div>RGB: ({Math.round(clusterResult.clusters[selectedCluster].averageColor[0])}, {Math.round(clusterResult.clusters[selectedCluster].averageColor[1])}, {Math.round(clusterResult.clusters[selectedCluster].averageColor[2])})</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;