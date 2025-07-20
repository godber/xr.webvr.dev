/**
 * Mock image generator for test environments
 * Bypasses Canvas API limitations in jsdom
 */

import { ImageSize, ImageType } from './imageGenerator';

/**
 * Creates a mock HTMLImageElement with realistic dimensions and type metadata
 */
function createMockImage(width: number, height: number, type: ImageType): HTMLImageElement {
  const img = new Image();
  Object.defineProperty(img, 'width', { value: width, writable: false, configurable: true });
  Object.defineProperty(img, 'height', { value: height, writable: false, configurable: true });
  
  // Store metadata that the Canvas mock can use to generate realistic data
  (img as any).__mockImageType = type;
  (img as any).__mockWidth = width;
  (img as any).__mockHeight = height;
  
  return img;
}

/**
 * Generates test images for benchmark testing in mock environments
 */
export async function generateMockTestImage(type: ImageType, size: ImageSize): Promise<HTMLImageElement> {
  const img = createMockImage(size.width, size.height, type);
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