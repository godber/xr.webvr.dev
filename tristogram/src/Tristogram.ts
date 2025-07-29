interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface TristogramOptions {
  algorithm?: 'legacy' | 'single-pass';
  visualizationMode?: 'opacity' | 'size';
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

/**
 * Tristogram class for analyzing color distribution in images.
 * Creates a 3D histogram representing the RGB color space distribution
 * of pixels in the provided image.
 */
class Tristogram {
  nonZeroCount: number;
  totalCount: number;
  maxValue: number;
  positions: Float32Array;
  values: number[];
  colors: Float32Array;
  sizes: Float32Array;
  pixelSources: {x: number, y: number}[][];
  tristogram?: {x: number, y: number}[][][];
  imageData: PixelData;
  visualizationMode: 'opacity' | 'size';
  originalDimensions?: { width: number, height: number };
  scaledDimensions: { width: number, height: number };

  /**
   * Creates a new Tristogram instance and analyzes the provided pixel data
   */
  constructor(pixelData: PixelData, options: TristogramOptions = {}) {
    this.imageData = pixelData;
    this.nonZeroCount = 0;
    this.totalCount = 0;
    this.maxValue = 0;
    this.values = [];
    this.pixelSources = [];
    this.visualizationMode = options.visualizationMode || 'opacity';
    this.scaledDimensions = { width: pixelData.width, height: pixelData.height };
    
    const algorithm = options.algorithm || 'single-pass';
    
    if (algorithm === 'single-pass') {
      this.buildSinglePass(pixelData);
    } else {
      this.buildLegacy(pixelData);
    }
  }

  /**
   * Legacy algorithm - maintains exact same behavior as original implementation
   */
  private buildLegacy(pixelData: PixelData): void {
    const positions: number[] = [];
    this.values = [];
    this.pixelSources = [];

    this.tristogram = Array(256).fill().map(
      () => Array(256).fill().map(
        () => Array(256).fill().map(() => []),
      ),
    );

    for (let x = 0; x < pixelData.width; x++) {
      for (let y = 0; y < pixelData.height; y++) {
        const p = Tristogram.getPixel(pixelData, x, y);
        this.tristogram[p.r][p.g][p.b].push({x, y});
      }
    }

    for (let r = 0; r < this.tristogram.length; r++) {
      for (let g = 0; g < this.tristogram[r].length; g++) {
        for (let b = 0; b < this.tristogram[r][g].length; b++) {
          if (this.tristogram[r][g][b].length > 0) {
            const count = this.tristogram[r][g][b].length;
            if (count > this.maxValue) {
              this.maxValue = count;
            }
            this.nonZeroCount++;
            positions.push(r, g, b);
            this.values.push(count);
            this.pixelSources.push(this.tristogram[r][g][b]);
          }
          this.totalCount++;
        }
      }
    }

    this.positions = new Float32Array(positions);
    this.colors = new Float32Array(this.values.length * 4);
    this.sizes = new Float32Array(this.values.length);
    
    for (let i = 0; i < this.values.length; i += 1) {
      const t = this.values[i] / this.maxValue;
      
      if (this.visualizationMode === 'size') {
        this.colors[4 * i] = 1;
        this.colors[4 * i + 1] = 1;
        this.colors[4 * i + 2] = 1;
        this.colors[4 * i + 3] = 1;
        this.sizes[i] = 1 + t * 19; // Size range 1-20
      } else {
        this.colors[4 * i] = 1;
        this.colors[4 * i + 1] = 1;
        this.colors[4 * i + 2] = 1;
        this.colors[4 * i + 3] = t;
        this.sizes[i] = 1;
      }
    }
  }

  /**
   * Single-pass algorithm - optimized version using Map-based sparse storage
   */
  private buildSinglePass(pixelData: PixelData): void {
    const colorMap = new Map<number, {count: number, pixels: {x: number, y: number}[]}>();
    this.maxValue = 0;

    // Single pass: process each pixel once
    for (let x = 0; x < pixelData.width; x++) {
      for (let y = 0; y < pixelData.height; y++) {
        const pixel = Tristogram.getPixel(pixelData, x, y);
        const key = this.encodeRGB(pixel.r, pixel.g, pixel.b);
        
        const entry = colorMap.get(key) || {count: 0, pixels: []};
        entry.count += 1;
        entry.pixels.push({x, y});
        colorMap.set(key, entry);
        
        if (entry.count > this.maxValue) {
          this.maxValue = entry.count;
        }
      }
    }

    // Build arrays directly from map
    this.buildArraysFromMap(colorMap);
  }

  /**
   * Encodes RGB values into a single 32-bit integer for use as Map key
   */
  private encodeRGB(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Decodes a 32-bit integer back into RGB values
   */
  private decodeRGB(encoded: number): [number, number, number] {
    return [
      (encoded >> 16) & 0xFF,  // r
      (encoded >> 8) & 0xFF,   // g
      encoded & 0xFF           // b
    ];
  }

  /**
   * Builds final arrays directly from color map entries
   */
  private buildArraysFromMap(colorMap: Map<number, {count: number, pixels: {x: number, y: number}[]}>): void {
    const size = colorMap.size;
    
    this.positions = new Float32Array(size * 3);
    this.values = new Array(size);
    this.colors = new Float32Array(size * 4);
    this.sizes = new Float32Array(size);
    this.pixelSources = new Array(size);
    
    this.nonZeroCount = size;
    this.totalCount = 256 * 256 * 256;
    
    let i = 0;
    for (const [encoded, entry] of colorMap) {
      const [r, g, b] = this.decodeRGB(encoded);
      
      // Positions
      this.positions[i * 3] = r;
      this.positions[i * 3 + 1] = g;
      this.positions[i * 3 + 2] = b;
      
      // Values
      this.values[i] = entry.count;
      
      // Pixel sources
      this.pixelSources[i] = entry.pixels;
      
      // Colors and sizes based on visualization mode
      const t = entry.count / this.maxValue;
      if (this.visualizationMode === 'size') {
        this.colors[i * 4] = 1;     // r
        this.colors[i * 4 + 1] = 1; // g  
        this.colors[i * 4 + 2] = 1; // b
        this.colors[i * 4 + 3] = 1; // a - full opacity
        this.sizes[i] = 1 + t * 19; // Size range 1-20
      } else {
        this.colors[i * 4] = 1;     // r
        this.colors[i * 4 + 1] = 1; // g  
        this.colors[i * 4 + 2] = 1; // b
        this.colors[i * 4 + 3] = t; // a - opacity based on frequency
        this.sizes[i] = 1;
      }
      
      i++;
    }
  }

  /**
   * Extracts ImageData from an HTMLImageElement using canvas with optional scaling
   */
  static getImageData(image: HTMLImageElement, maxDimension: number = 0): ImageData {
    const canvas = document.createElement('canvas');
    let targetWidth = image.width;
    let targetHeight = image.height;
    
    // Auto-scale if maxDimension is specified and image is larger
    if (maxDimension > 0 && (image.width > maxDimension || image.height > maxDimension)) {
      const scale = maxDimension / Math.max(image.width, image.height);
      targetWidth = Math.round(image.width * scale);
      targetHeight = Math.round(image.height * scale);
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d')!;
    
    if (targetWidth !== image.width || targetHeight !== image.height) {
      // Use high-quality scaling for better averaging
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
    
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const data = context.getImageData(0, 0, targetWidth, targetHeight);
    return data;
  }

  /**
   * Factory method to create Tristogram from ImageData (browser)
   */
  static fromImageData(imageData: ImageData, options?: TristogramOptions): Tristogram {
    return new Tristogram(imageData, options);
  }

  /**
   * Factory method to create Tristogram from HTMLImageElement (browser)
   */
  static fromHTMLImage(image: HTMLImageElement, options?: TristogramOptions): Tristogram {
    // Auto-scale to 256px max dimension for clustering performance
    let maxDimension = 256;
    
    // For clustering, use even smaller dimensions if image would have too many unique colors
    // Estimate: typical photos have ~50-70% unique colors after scaling
    const estimatedColors = (256 * (256 * (image.height / Math.max(image.width, image.height)))) * 0.6;
    if (estimatedColors > 5000) {
      maxDimension = 128; // Much more aggressive scaling for complex images
      console.log(`🔧 Using aggressive scaling (128px) for clustering performance`);
    }
    
    const imageData = Tristogram.getImageData(image, maxDimension);
    const tristogram = new Tristogram(imageData, options);
    
    // Store original dimensions for user information
    tristogram.originalDimensions = { width: image.width, height: image.height };
    
    return tristogram;
  }

  /**
   * Factory method to create Tristogram from file path (Node.js)
   */
  static async fromFile(imagePath: string): Promise<Tristogram> {
    if (typeof window !== 'undefined') {
      throw new Error('fromFile is only available in Node.js environment. Use fromHTMLImage or fromImageData in the browser.');
    }
    
    try {
      // Use eval to prevent Vite from trying to resolve the import at build time
      const sharpModule = await eval('import("sharp")');
      const { data, info } = await sharpModule.default(imagePath)
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true });
      
      return new Tristogram({
        data: new Uint8ClampedArray(data),
        width: info.width,
        height: info.height
      });
    } catch (error) {
      throw new Error(`Failed to load image from file: ${(error as Error).message}. Make sure 'sharp' is installed for Node.js usage.`);
    }
  }

  /**
   * Creates filtered arrays based on frequency threshold range (0-1 range)
   */
  getFilteredData(minThreshold: number, maxThreshold: number = 1.0): {
    positions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    count: number;
    filteredIndices: number[]; // Add this to track which original indices were kept
  } {
    const minCount = Math.floor(minThreshold * this.maxValue);
    const maxCount = Math.floor(maxThreshold * this.maxValue);
    console.log(`🔧 Filtering logic: minThreshold=${minThreshold}, maxThreshold=${maxThreshold}, maxValue=${this.maxValue}`);
    console.log(`🔧 Computed counts: minCount=${minCount}, maxCount=${maxCount}`);
    const filteredIndices: number[] = [];
    
    // Find indices that meet the threshold range
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] >= minCount && this.values[i] <= maxCount) {
        filteredIndices.push(i);
      }
    }
    
    const count = filteredIndices.length;
    const filterPercent = ((count / this.values.length) * 100).toFixed(1);
    console.log(`🔧 Filtering result: ${count}/${this.values.length} points (${filterPercent}%) passed filter`);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 4);
    const sizes = new Float32Array(count);
    
    // Copy data for points that meet the threshold
    for (let i = 0; i < count; i++) {
      const originalIndex = filteredIndices[i];
      
      // Positions
      positions[i * 3] = this.positions[originalIndex * 3];
      positions[i * 3 + 1] = this.positions[originalIndex * 3 + 1];
      positions[i * 3 + 2] = this.positions[originalIndex * 3 + 2];
      
      // Colors
      colors[i * 4] = this.colors[originalIndex * 4];
      colors[i * 4 + 1] = this.colors[originalIndex * 4 + 1];
      colors[i * 4 + 2] = this.colors[originalIndex * 4 + 2];
      colors[i * 4 + 3] = this.colors[originalIndex * 4 + 3];
      
      // Sizes
      sizes[i] = this.sizes[originalIndex];
    }
    
    return { positions, colors, sizes, count, filteredIndices };
  }

  /**
   * Performs DBSCAN clustering using pre-filtered indices
   */
  dbscanClusteringWithIndices(epsilon: number = 20, minPoints: number = 3, filteredIndices: number[]): ClusterResult {
    const n = filteredIndices.length;
    const labels = new Array(n).fill(-1);
    let clusterId = 0;
    
    console.log(`🔍 Starting DBSCAN clustering on ${n} pre-filtered colors`);
    console.log(`📐 Parameters: epsilon=${epsilon}, minPoints=${minPoints}`);
    const startTime = performance.now();
    
    for (let i = 0; i < n; i++) {
      // Progress logging every 10% or every 100 points, whichever is more frequent
      if (i % Math.max(1, Math.floor(n / 10)) === 0 || i % 100 === 0) {
        const progress = ((i / n) * 100).toFixed(1);
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        console.log(`⏳ DBSCAN progress: ${progress}% (${i}/${n}) - ${elapsed}s elapsed, ${clusterId} clusters found`);
      }
      
      if (labels[i] !== -1) continue;
      
      const neighbors = this.getFilteredNeighbors(i, epsilon, filteredIndices);
      if (neighbors.length < minPoints) {
        labels[i] = -2; // Mark as noise
        continue;
      }
      
      // Start new cluster
      labels[i] = clusterId;
      const queue = [...neighbors];
      
      console.log(`🆕 Starting cluster ${clusterId} from point ${i} with ${neighbors.length} neighbors`);
      
      while (queue.length > 0) {
        const q = queue.shift()!;
        
        if (labels[q] === -2) {
          labels[q] = clusterId; // Change noise to border point
        }
        
        if (labels[q] !== -1) continue;
        labels[q] = clusterId;
        
        const qNeighbors = this.getFilteredNeighbors(q, epsilon, filteredIndices);
        if (qNeighbors.length >= minPoints) {
          queue.push(...qNeighbors);
        }
      }
      
      clusterId++;
    }
    
    const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ DBSCAN completed in ${totalTime}s: ${clusterId} clusters found`);
    
    return this.buildFilteredClusterResult(labels, clusterId, filteredIndices);
  }

  /**
   * Performs DBSCAN clustering on filtered color data (DEPRECATED - use dbscanClusteringWithIndices)
   */
  dbscanClusteringFiltered(epsilon: number = 20, minPoints: number = 3, minThreshold: number = 0, maxThreshold: number = 1): ClusterResult {
    const minCount = Math.floor(minThreshold * this.maxValue);
    const maxCount = Math.floor(maxThreshold * this.maxValue);
    const filteredIndices: number[] = [];
    
    // Find indices that meet the threshold range
    for (let i = 0; i < this.values.length; i++) {
      if (this.values[i] >= minCount && this.values[i] <= maxCount) {
        filteredIndices.push(i);
      }
    }
    
    const n = filteredIndices.length;
    const labels = new Array(n).fill(-1);
    let clusterId = 0;
    
    console.log(`🔍 Starting DBSCAN clustering on ${n} filtered colors (from ${this.values.length} total)`);
    console.log(`📐 Parameters: epsilon=${epsilon}, minPoints=${minPoints}, filter=${minThreshold}-${maxThreshold}`);
    const startTime = performance.now();
    
    for (let i = 0; i < n; i++) {
      // Progress logging every 10% or every 100 points, whichever is more frequent
      if (i % Math.max(1, Math.floor(n / 10)) === 0 || i % 100 === 0) {
        const progress = ((i / n) * 100).toFixed(1);
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        console.log(`⏳ DBSCAN progress: ${progress}% (${i}/${n}) - ${elapsed}s elapsed, ${clusterId} clusters found`);
      }
      
      if (labels[i] !== -1) continue;
      
      const neighbors = this.getFilteredNeighbors(i, epsilon, filteredIndices);
      if (neighbors.length < minPoints) {
        labels[i] = -2; // Mark as noise
        continue;
      }
      
      // Start new cluster
      labels[i] = clusterId;
      const queue = [...neighbors];
      
      console.log(`🆕 Starting cluster ${clusterId} from point ${i} with ${neighbors.length} neighbors`);
      
      while (queue.length > 0) {
        const q = queue.shift()!;
        
        if (labels[q] === -2) {
          labels[q] = clusterId; // Change noise to border point
        }
        
        if (labels[q] !== -1) continue;
        labels[q] = clusterId;
        
        const qNeighbors = this.getFilteredNeighbors(q, epsilon, filteredIndices);
        if (qNeighbors.length >= minPoints) {
          queue.push(...qNeighbors);
        }
      }
      
      clusterId++;
    }
    
    const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ DBSCAN completed in ${totalTime}s: ${clusterId} clusters found`);
    
    return this.buildFilteredClusterResult(labels, clusterId, filteredIndices);
  }

  /**
   * Performs DBSCAN clustering on the color data
   */
  dbscanClustering(epsilon: number = 20, minPoints: number = 3): ClusterResult {
    const n = this.values.length;
    const labels = new Array(n).fill(-1);
    let clusterId = 0;
    
    console.log(`🔍 Starting DBSCAN clustering on ${n} unique colors`);
    console.log(`📐 Parameters: epsilon=${epsilon}, minPoints=${minPoints}`);
    const startTime = performance.now();
    
    for (let i = 0; i < n; i++) {
      // Progress logging every 10% or every 100 points, whichever is more frequent
      if (i % Math.max(1, Math.floor(n / 10)) === 0 || i % 100 === 0) {
        const progress = ((i / n) * 100).toFixed(1);
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        console.log(`⏳ DBSCAN progress: ${progress}% (${i}/${n}) - ${elapsed}s elapsed, ${clusterId} clusters found`);
      }
      
      if (labels[i] !== -1) continue;
      
      const neighbors = this.getNeighbors(i, epsilon);
      if (neighbors.length < minPoints) {
        labels[i] = -2; // Mark as noise
        continue;
      }
      
      // Start new cluster
      labels[i] = clusterId;
      const queue = [...neighbors];
      
      console.log(`🆕 Starting cluster ${clusterId} from point ${i} with ${neighbors.length} neighbors`);
      
      while (queue.length > 0) {
        const q = queue.shift()!;
        
        if (labels[q] === -2) {
          labels[q] = clusterId; // Change noise to border point
        }
        
        if (labels[q] !== -1) continue;
        labels[q] = clusterId;
        
        const qNeighbors = this.getNeighbors(q, epsilon);
        if (qNeighbors.length >= minPoints) {
          queue.push(...qNeighbors);
        }
      }
      
      clusterId++;
    }
    
    const totalTime = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ DBSCAN completed in ${totalTime}s: ${clusterId} clusters found`);
    
    return this.buildClusterResult(labels, clusterId);
  }

  /**
   * Finds neighbors within epsilon distance in RGB space
   */
  private getNeighbors(pointIndex: number, epsilon: number): number[] {
    const neighbors: number[] = [];
    const px = this.positions[pointIndex * 3];
    const py = this.positions[pointIndex * 3 + 1];
    const pz = this.positions[pointIndex * 3 + 2];
    
    // Track expensive neighbor searches
    const n = this.values.length;
    if (n > 1000 && pointIndex % 100 === 0) {
      console.log(`🔄 Finding neighbors for point ${pointIndex}/${n} (${((pointIndex/n)*100).toFixed(1)}%)`);
    }
    
    for (let i = 0; i < this.values.length; i++) {
      if (i === pointIndex) continue;
      
      const qx = this.positions[i * 3];
      const qy = this.positions[i * 3 + 1];
      const qz = this.positions[i * 3 + 2];
      
      const distance = Math.sqrt(
        (px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2
      );
      
      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  /**
   * Finds neighbors within epsilon distance in RGB space for filtered data
   */
  private getFilteredNeighbors(pointIndex: number, epsilon: number, filteredIndices: number[]): number[] {
    const neighbors: number[] = [];
    const originalIndex = filteredIndices[pointIndex];
    const px = this.positions[originalIndex * 3];
    const py = this.positions[originalIndex * 3 + 1];
    const pz = this.positions[originalIndex * 3 + 2];
    
    // Track expensive neighbor searches
    const n = filteredIndices.length;
    if (n > 1000 && pointIndex % 100 === 0) {
      console.log(`🔄 Finding neighbors for filtered point ${pointIndex}/${n} (${((pointIndex/n)*100).toFixed(1)}%)`);
    }
    
    for (let i = 0; i < filteredIndices.length; i++) {
      if (i === pointIndex) continue;
      
      const otherOriginalIndex = filteredIndices[i];
      const qx = this.positions[otherOriginalIndex * 3];
      const qy = this.positions[otherOriginalIndex * 3 + 1];
      const qz = this.positions[otherOriginalIndex * 3 + 2];
      
      const distance = Math.sqrt(
        (px - qx) ** 2 + (py - qy) ** 2 + (pz - qz) ** 2
      );
      
      if (distance <= epsilon) {
        neighbors.push(i);
      }
    }
    
    return neighbors;
  }

  /**
   * Builds cluster result from DBSCAN labels for filtered data
   */
  private buildFilteredClusterResult(labels: number[], numClusters: number, filteredIndices: number[]): ClusterResult {
    const clusters: ClusterInfo[] = [];
    const noise: number[] = [];
    
    // Group points by cluster
    for (let clusterId = 0; clusterId < numClusters; clusterId++) {
      const points = labels
        .map((label, index) => ({ label, index }))
        .filter(item => item.label === clusterId)
        .map(item => filteredIndices[item.index]); // Map back to original indices
      
      if (points.length === 0) continue;
      
      // Calculate centroid and total frequency
      let totalR = 0, totalG = 0, totalB = 0, totalFreq = 0;
      
      for (const pointIndex of points) {
        const r = this.positions[pointIndex * 3];
        const g = this.positions[pointIndex * 3 + 1];
        const b = this.positions[pointIndex * 3 + 2];
        const freq = this.values[pointIndex];
        
        totalR += r * freq;
        totalG += g * freq;
        totalB += b * freq;
        totalFreq += freq;
      }
      
      const centroid: [number, number, number] = [
        totalR / totalFreq,
        totalG / totalFreq,
        totalB / totalFreq
      ];
      
      clusters.push({
        id: clusterId,
        points,
        centroid,
        totalFrequency: totalFreq,
        averageColor: centroid
      });
    }
    
    // Collect noise points (mapped back to original indices)
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === -2) {
        noise.push(filteredIndices[i]);
      }
    }
    
    // Create labels array that matches original data structure
    const fullLabels = new Array(this.values.length).fill(-3); // -3 = filtered out
    for (let i = 0; i < labels.length; i++) {
      fullLabels[filteredIndices[i]] = labels[i];
    }
    
    return { clusters, noise, labels: fullLabels };
  }

  /**
   * Builds cluster result from DBSCAN labels
   */
  private buildClusterResult(labels: number[], numClusters: number): ClusterResult {
    const clusters: ClusterInfo[] = [];
    const noise: number[] = [];
    
    // Group points by cluster
    for (let clusterId = 0; clusterId < numClusters; clusterId++) {
      const points = labels
        .map((label, index) => ({ label, index }))
        .filter(item => item.label === clusterId)
        .map(item => item.index);
      
      if (points.length === 0) continue;
      
      // Calculate centroid and total frequency
      let totalR = 0, totalG = 0, totalB = 0, totalFreq = 0;
      
      for (const pointIndex of points) {
        const r = this.positions[pointIndex * 3];
        const g = this.positions[pointIndex * 3 + 1];
        const b = this.positions[pointIndex * 3 + 2];
        const freq = this.values[pointIndex];
        
        totalR += r * freq;
        totalG += g * freq;
        totalB += b * freq;
        totalFreq += freq;
      }
      
      const centroid: [number, number, number] = [
        totalR / totalFreq,
        totalG / totalFreq,
        totalB / totalFreq
      ];
      
      clusters.push({
        id: clusterId,
        points,
        centroid,
        totalFrequency: totalFreq,
        averageColor: centroid
      });
    }
    
    // Collect noise points
    for (let i = 0; i < labels.length; i++) {
      if (labels[i] === -2) {
        noise.push(i);
      }
    }
    
    return { clusters, noise, labels };
  }

  /**
   * Gets pixel color values at specific coordinates
   */
  static getPixel(imageData: PixelData, x: number, y: number): PixelColor {
    const position = (x + imageData.width * y) * 4;
    const { data } = imageData;
    const pixel: PixelColor = {
      r: data[position],
      g: data[position + 1],
      b: data[position + 2],
      a: data[position + 3],
    };
    return pixel;
  }
}

export default Tristogram;
