import * as THREE from './three.module.js';

class Tristogram {
  constructor(image) {
    this.nonZeroCount = 0;
    this.totalCount = 0;
    this.maxValue = 0;
    this.positions = []; // r, g, b locations of values (3x values)
    this.values = []; // values from tristogram

    // create a 256x256x256 array full of zeros
    this.tristogram = Array(256).fill().map(
      () => Array(256).fill().map(
        () => Array(256).fill(0),
      ),
    );

    // Iterate through the image to generate the Tristogram

    this.imageData = Tristogram.getImageData(image);
    for (let x = 0; x < this.imageData.width; x++) {
      for (let y = 0; y < this.imageData.height; y++) {
        const p = Tristogram.getPixel(this.imageData, x, y);
        this.tristogram[p.r][p.g][p.b] += 1;
      }
    }

    // Iterate through the Tristogram to populate:
    // * values
    // * positions
    // * totalCount
    // * nonZeroCount
    // * maxValue
    for (let r = 0; r < this.tristogram.length; r++) {
      for (let g = 0; g < this.tristogram[r].length; g++) {
        for (let b = 0; b < this.tristogram[r][g].length; b++) {
          if (this.tristogram[r][g][b] !== 0) {
            if (this.tristogram[r][g][b] > this.maxValue) {
              this.maxValue = this.tristogram[r][g][b];
            }
            this.nonZeroCount++;
            this.positions.push(r, g, b);
            this.values.push(this.tristogram[r][g][b]);
          }
          this.totalCount++;
        }
      }
    }

    this.colors = new Float32Array(this.values.length * 3);
    for (let i = 0; i < this.values.length; i += 1) {
      const t = this.values[i] / this.maxValue;
      this.colors[3 * i] = t;
      this.colors[3 * i + 1] = t;
      this.colors[3 * i + 2] = t;
    }
  }

  // draw image to canvas so we can access ImageData
  // TODO: track down the source for getImageData and getPixel so I can do
  // proper attribution
  static getImageData(image) {
    // TODO: Does this canvas need cleaning up?
    // TODO: Can this canvas conflict with other elements of the same name?
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height);
    return data;
  }

  // call with image.data from getImageData
  static getPixel(imageData, x, y) {
    const position = (x + imageData.width * y) * 4;
    const { data } = imageData;
    const pixel = {
      r: data[position],
      g: data[position + 1],
      b: data[position + 2],
      a: data[position + 3],
    };
    return pixel;
  }
}

// eslint-disable-next-line import/prefer-default-export
export { Tristogram };
