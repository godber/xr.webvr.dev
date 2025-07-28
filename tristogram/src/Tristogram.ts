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
  pixelSources: {x: number, y: number}[][];
  tristogram?: {x: number, y: number}[][][];
  imageData: PixelData;

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
    for (let i = 0; i < this.values.length; i += 1) {
      const t = this.values[i] / this.maxValue;
      this.colors[4 * i] = 1;
      this.colors[4 * i + 1] = 1;
      this.colors[4 * i + 2] = 1;
      this.colors[4 * i + 3] = t;
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
      
      // Colors (alpha based on frequency)
      const alpha = entry.count / this.maxValue;
      this.colors[i * 4] = 1;     // r
      this.colors[i * 4 + 1] = 1; // g  
      this.colors[i * 4 + 2] = 1; // b
      this.colors[i * 4 + 3] = alpha; // a
      
      i++;
    }
  }

  /**
   * Extracts ImageData from an HTMLImageElement using canvas
   */
  static getImageData(image: HTMLImageElement): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height);
    return data;
  }

  /**
   * Factory method to create Tristogram from ImageData (browser)
   */
  static fromImageData(imageData: ImageData): Tristogram {
    return new Tristogram(imageData);
  }

  /**
   * Factory method to create Tristogram from HTMLImageElement (browser)
   */
  static fromHTMLImage(image: HTMLImageElement): Tristogram {
    const imageData = Tristogram.getImageData(image);
    return new Tristogram(imageData);
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
