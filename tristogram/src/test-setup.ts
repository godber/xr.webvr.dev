import '@testing-library/jest-dom';
import { generateRealisticImageData } from './__tests__/benchmarks/realisticImageDataGenerator';
import { ImageType } from './__tests__/benchmarks/imageGenerator';

global.HTMLCanvasElement.prototype.getContext = vi.fn(function() {
  const canvas = this as HTMLCanvasElement;
  let storedImageData: ImageData | null = null;
  
  return {
    drawImage: vi.fn((img: HTMLImageElement) => {
      // When an image is drawn, update canvas size and generate realistic data
      if (img.width && img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Check if this is a mock image with type metadata
        const mockType = (img as unknown as { __mockImageType?: ImageType }).__mockImageType;
        if (mockType && Object.values(ImageType).includes(mockType)) {
          // Generate realistic image data based on the image type
          const realisticData = generateRealisticImageData(mockType, img.width, img.height);
          storedImageData = {
            data: realisticData.data,
            width: realisticData.width,
            height: realisticData.height,
            colorSpace: 'srgb'
          } as ImageData;
        } else {
          // Fallback to random data for non-mock images
          const data = new Uint8ClampedArray(img.width * img.height * 4);
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.floor(Math.random() * 256);     // R
            data[i + 1] = Math.floor(Math.random() * 256); // G
            data[i + 2] = Math.floor(Math.random() * 256); // B
            data[i + 3] = 255; // A
          }
          storedImageData = {
            data,
            width: img.width,
            height: img.height,
            colorSpace: 'srgb'
          } as ImageData;
        }
      }
    }),
    getImageData: vi.fn((x, y, width, height) => {
      // Return stored realistic data if available
      if (storedImageData) {
        return storedImageData;
      }
      
      // Fallback: generate data based on requested dimensions
      const w = width || canvas.width || 100;
      const h = height || canvas.height || 100;
      
      // Default to random noise if no stored data
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.floor(Math.random() * 256);     // R
        data[i + 1] = Math.floor(Math.random() * 256); // G
        data[i + 2] = Math.floor(Math.random() * 256); // B
        data[i + 3] = 255; // A
      }
      
      return { 
        data, 
        width: w, 
        height: h,
        colorSpace: 'srgb'
      } as ImageData;
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