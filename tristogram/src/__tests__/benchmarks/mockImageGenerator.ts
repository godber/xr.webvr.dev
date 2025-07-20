/**
 * Mock image generator for test environments
 * Bypasses Canvas API limitations in jsdom
 */

import { ImageSize, ImageType } from './imageGenerator';

/**
 * Creates a mock HTMLImageElement with realistic dimensions and mock data
 */
function createMockImage(width: number, height: number): HTMLImageElement {
  const img = new Image();
  Object.defineProperty(img, 'width', { value: width, writable: false, configurable: true });
  Object.defineProperty(img, 'height', { value: height, writable: false, configurable: true });
  return img;
}

/**
 * Generates test images for benchmark testing in mock environments
 */
export async function generateMockTestImage(type: ImageType, size: ImageSize): Promise<HTMLImageElement> {
  const img = createMockImage(size.width, size.height);
  
  // Set a deterministic seed based on image type for consistent test results
  const seed = type === ImageType.SOLID_COLOR ? 1 : 
               type === ImageType.GRADIENT ? 2 :
               type === ImageType.CHECKERBOARD ? 3 : 4;
  
  // Store type information for potential use in test validation
  (img as any).__mockImageType = type;
  (img as any).__mockSeed = seed;
  
  return Promise.resolve(img);
}

/**
 * Overrides the global Image mock to provide size-aware instances
 */
export function setupMockImageEnvironment() {
  global.Image = class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    width = 100;
    height = 100;
    
    constructor() {
      // Default size, will be overridden by createMockImage
    }
    
    set src(value: string) {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  } as any;
}