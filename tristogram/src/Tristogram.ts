interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
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
  imageData: ImageData;

  /**
   * Creates a new Tristogram instance and analyzes the provided image
   */
  constructor(image: HTMLImageElement) {
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

    this.imageData = Tristogram.getImageData(image);
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
   * Gets pixel color values at specific coordinates
   */
  static getPixel(imageData: ImageData, x: number, y: number): PixelColor {
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