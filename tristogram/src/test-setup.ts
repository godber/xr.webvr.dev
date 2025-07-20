import '@testing-library/jest-dom';

global.HTMLCanvasElement.prototype.getContext = vi.fn(function() {
  const canvas = this as HTMLCanvasElement;
  
  return {
    drawImage: vi.fn((img: HTMLImageElement) => {
      // When an image is drawn, update canvas size and prepare imageData
      if (img.width && img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        const data = new Uint8ClampedArray(img.width * img.height * 4);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.floor(Math.random() * 256);     // R
          data[i + 1] = Math.floor(Math.random() * 256); // G
          data[i + 2] = Math.floor(Math.random() * 256); // B
          data[i + 3] = 255; // A
        }
      }
    }),
    getImageData: vi.fn((x, y, width, height) => {
      // Use the requested width/height if provided, otherwise use canvas dimensions
      const w = width || canvas.width;
      const h = height || canvas.height;
      
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(Math.random() * 256);     // R
        data[i + 1] = Math.floor(Math.random() * 256); // G
        data[i + 2] = Math.floor(Math.random() * 256); // B
        data[i + 3] = 255; // A
      }
      
      return { data, width: w, height: h } as ImageData;
    }),
    fillRect: vi.fn(),
    fillStyle: '',
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createImageData: vi.fn((width, height) => {
      const data = new Uint8ClampedArray(width * height * 4);
      return { data, width, height } as ImageData;
    }),
    putImageData: vi.fn(),
  };
});

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock-base64-data');

global.Image = class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 100;
  height = 100;
  
  set src(value: string) {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
} as typeof Image;

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-object-url'),
    revokeObjectURL: vi.fn(),
  },
});