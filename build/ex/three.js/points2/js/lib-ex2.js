class Tristogram {
  constructor(image) {
    this.nonZeroCount = 0;
    this.totalCount = 0;
    this.vertices = [];

    // create a 256x256x256 array full of zeros
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
        for (let b = 0; b < this.tristogram[g].length; b++) {
          if (this.tristogram[r][g][b] !== 0) {
            this.nonZeroCount++;
            this.vertices.push(r, g, b);
            // TODO: use the value at this point to do something ... set grayscale
          }
          this.totalCount++;
        }
      }
    }
  }

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
