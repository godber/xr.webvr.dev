interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export type ImageType = 'solid' | 'gradient' | 'noise';

/**
 * Generates synthetic test images for benchmarking
 */
export class ImageGenerator {
  /**
   * Generate synthetic image data for both browser and Node.js environments
   */
  static generateSyntheticImage(
    width: number,
    height: number,
    type: ImageType
  ): PixelData {
    const data = new Uint8ClampedArray(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const pixel = this.getPixelColor(x, y, width, height, type);
        
        data[index] = pixel.r;     // Red
        data[index + 1] = pixel.g; // Green
        data[index + 2] = pixel.b; // Blue
        data[index + 3] = 255;     // Alpha (fully opaque)
      }
    }
    
    return {
      data,
      width,
      height,
    };
  }

  /**
   * Generate pixel color based on position and image type
   */
  private static getPixelColor(
    x: number,
    y: number,
    width: number,
    height: number,
    type: ImageType
  ): { r: number; g: number; b: number } {
    switch (type) {
      case 'solid':
        // Solid red color - minimal color variety
        return { r: 255, g: 0, b: 0 };
        
      case 'gradient': {
        // RGB gradient - moderate color variety
        const r = Math.floor((x / width) * 255);
        const g = Math.floor((y / height) * 255);
        const b = Math.floor(((x + y) / (width + height)) * 255);
        return { r, g, b };
      }
        
      case 'noise':
        // Random noise - maximum color variety
        return {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
        };
        
      default:
        throw new Error(`Unknown image type: ${type}`);
    }
  }

  /**
   * Generate ImageData for browser environment (when available)
   */
  static generateImageData(
    width: number,
    height: number,
    type: ImageType
  ): ImageData {
    if (typeof ImageData === 'undefined') {
      throw new Error('ImageData not available in this environment');
    }
    
    const pixelData = this.generateSyntheticImage(width, height, type);
    return new ImageData(pixelData.data, width, height);
  }
}