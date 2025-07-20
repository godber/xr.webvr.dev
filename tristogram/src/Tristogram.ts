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
  tristogram: number[][][];
  imageData: PixelData;

  /**
   * Creates a new Tristogram instance and analyzes the provided pixel data
   */
  constructor(pixelData: PixelData) {
    this.nonZeroCount = 0;
    this.totalCount = 0;
    this.maxValue = 0;
    const positions: number[] = [];
    this.values = [];

    this.tristogram = Array(256).fill().map(
      () => Array(256).fill().map(
        () => Array(256).fill(0),
      ),
    );

    this.imageData = pixelData;
    for (let x = 0; x < this.imageData.width; x++) {
      for (let y = 0; y < this.imageData.height; y++) {
        const p = Tristogram.getPixel(this.imageData, x, y);
        this.tristogram[p.r][p.g][p.b] += 1;
      }
    }

    for (let r = 0; r < this.tristogram.length; r++) {
      for (let g = 0; g < this.tristogram[r].length; g++) {
        for (let b = 0; b < this.tristogram[r][g].length; b++) {
          if (this.tristogram[r][g][b] !== 0) {
            if (this.tristogram[r][g][b] > this.maxValue) {
              this.maxValue = this.tristogram[r][g][b];
            }
            this.nonZeroCount++;
            positions.push(r, g, b);
            this.values.push(this.tristogram[r][g][b]);
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