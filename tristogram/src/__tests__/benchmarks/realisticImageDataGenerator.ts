/**
 * Realistic image data generator for test environments
 * Generates actual pixel patterns without relying on Canvas APIs
 */

import { ImageType } from './imageGenerator';

export interface ImageDataResult {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Generates solid color image data - single uniform color
 */
export function generateSolidColorData(width: number, height: number, r = 128, g = 128, b = 128, a = 255): ImageDataResult {
  const totalPixels = width * height;
  const data = new Uint8ClampedArray(totalPixels * 4);
  
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    data[offset] = r;     // Red
    data[offset + 1] = g; // Green
    data[offset + 2] = b; // Blue
    data[offset + 3] = a; // Alpha
  }
  
  return { data, width, height };
}

/**
 * Generates gradient image data - smooth transition from red to green to blue
 */
export function generateGradientData(width: number, height: number): ImageDataResult {
  const totalPixels = width * height;
  const data = new Uint8ClampedArray(totalPixels * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // Create horizontal gradient from red to green to blue
      const progress = x / (width - 1); // 0 to 1
      
      let r, g, b;
      if (progress < 0.5) {
        // First half: red to green
        const t = progress * 2; // 0 to 1
        r = Math.round(255 * (1 - t));
        g = Math.round(255 * t);
        b = 0;
      } else {
        // Second half: green to blue
        const t = (progress - 0.5) * 2; // 0 to 1
        r = 0;
        g = Math.round(255 * (1 - t));
        b = Math.round(255 * t);
      }
      
      data[pixelIndex] = r;
      data[pixelIndex + 1] = g;
      data[pixelIndex + 2] = b;
      data[pixelIndex + 3] = 255; // Alpha
    }
  }
  
  return { data, width, height };
}

/**
 * Generates random noise image data - maximum color variety
 */
export function generateRandomNoiseData(width: number, height: number, seed?: number): ImageDataResult {
  const totalPixels = width * height;
  const data = new Uint8ClampedArray(totalPixels * 4);
  
  // Use seeded random if provided for reproducible results
  const rng = seed ? createSeededRNG(seed) : Math.random;
  
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    data[offset] = Math.floor(rng() * 256);     // Red
    data[offset + 1] = Math.floor(rng() * 256); // Green
    data[offset + 2] = Math.floor(rng() * 256); // Blue
    data[offset + 3] = 255; // Alpha
  }
  
  return { data, width, height };
}

/**
 * Generates checkerboard image data - alternating black and white squares
 */
export function generateCheckerboardData(width: number, height: number, squareSize = 20): ImageDataResult {
  const totalPixels = width * height;
  const data = new Uint8ClampedArray(totalPixels * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      // Determine if this pixel should be black or white
      const squareX = Math.floor(x / squareSize);
      const squareY = Math.floor(y / squareSize);
      const isEven = (squareX + squareY) % 2 === 0;
      const color = isEven ? 255 : 0; // White or black
      
      data[pixelIndex] = color;     // Red
      data[pixelIndex + 1] = color; // Green
      data[pixelIndex + 2] = color; // Blue
      data[pixelIndex + 3] = 255;   // Alpha
    }
  }
  
  return { data, width, height };
}

/**
 * Generates realistic image data based on type
 */
export function generateRealisticImageData(type: ImageType, width: number, height: number): ImageDataResult {
  switch (type) {
    case ImageType.SOLID_COLOR:
      return generateSolidColorData(width, height);
    case ImageType.GRADIENT:
      return generateGradientData(width, height);
    case ImageType.RANDOM_NOISE:
      return generateRandomNoiseData(width, height);
    case ImageType.CHECKERBOARD:
      return generateCheckerboardData(width, height);
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}

/**
 * Simple seeded random number generator for reproducible noise
 */
function createSeededRNG(seed: number): () => number {
  let currentSeed = seed;
  return function() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

/**
 * Analyzes image data and returns color statistics
 */
export function analyzeImageData(imageData: ImageDataResult): {
  uniqueColors: number;
  totalPixels: number;
  colorHistogram: Map<string, number>;
} {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const colorHistogram = new Map<string, number>();
  
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const colorKey = `${r},${g},${b}`;
    
    colorHistogram.set(colorKey, (colorHistogram.get(colorKey) || 0) + 1);
  }
  
  return {
    uniqueColors: colorHistogram.size,
    totalPixels,
    colorHistogram,
  };
}

/**
 * Validates that image data has expected characteristics
 */
export function validateImageCharacteristics(type: ImageType, imageData: ImageDataResult): {
  isValid: boolean;
  actualColors: number;
  expectedRange: string;
  message: string;
} {
  const analysis = analyzeImageData(imageData);
  const actualColors = analysis.uniqueColors;
  
  let expectedRange: string;
  let isValid: boolean;
  
  switch (type) {
    case ImageType.SOLID_COLOR:
      expectedRange = '1';
      isValid = actualColors === 1;
      break;
    case ImageType.GRADIENT:
      expectedRange = '50-500';
      isValid = actualColors >= 50 && actualColors <= 500;
      break;
    case ImageType.RANDOM_NOISE:
      expectedRange = '5000-16777216';
      isValid = actualColors >= 5000;
      break;
    case ImageType.CHECKERBOARD:
      expectedRange = '2';
      isValid = actualColors === 2;
      break;
    default:
      expectedRange = 'unknown';
      isValid = false;
  }
  
  const message = isValid 
    ? `✓ ${type} has ${actualColors} colors (expected ${expectedRange})`
    : `✗ ${type} has ${actualColors} colors (expected ${expectedRange})`;
  
  return {
    isValid,
    actualColors,
    expectedRange,
    message,
  };
}