import { describe, it, expect, beforeEach, vi } from 'vitest';
import Tristogram from '../Tristogram.ts';

describe('Tristogram', () => {
  let mockImage: HTMLImageElement;
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let mockPixelData: { data: Uint8ClampedArray; width: number; height: number };

  beforeEach(() => {
    mockPixelData = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray([
        255, 0, 0, 255,    // Red pixel
        0, 255, 0, 255,    // Green pixel
        0, 0, 255, 255,    // Blue pixel
        255, 255, 255, 255 // White pixel
      ]),
    };

    mockImage = {
      width: 2,
      height: 2,
    } as HTMLImageElement;

    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => mockPixelData),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
    } as HTMLCanvasElement;

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
  });

  describe('constructor', () => {
    it('should initialize tristogram with correct dimensions (legacy algorithm)', () => {
      const tristogram = new Tristogram(mockPixelData, { algorithm: 'legacy' });
      
      expect(tristogram.tristogram).toBeDefined();
      expect(tristogram.tristogram!.length).toBe(256);
      expect(tristogram.tristogram![0].length).toBe(256);
      expect(tristogram.tristogram![0][0].length).toBe(256);
    });

    it('should analyze image data and populate histogram', () => {
      const tristogram = new Tristogram(mockPixelData);
      
      expect(tristogram.nonZeroCount).toBe(4);
      expect(tristogram.totalCount).toBe(256 * 256 * 256);
      expect(tristogram.maxValue).toBe(1);
      expect(tristogram.positions.length).toBe(12); // 4 colors * 3 coordinates
      expect(tristogram.values.length).toBe(4);
      expect(tristogram.pixelSources.length).toBe(4); // 4 color groups
    });

    it('should create color array with correct alpha values', () => {
      const tristogram = new Tristogram(mockPixelData);
      
      expect(tristogram.colors.length).toBe(16); // 4 colors * 4 components
      
      // All colors should have RGB = 1 and alpha = 1 (since maxValue = 1)
      for (let i = 0; i < 4; i++) {
        expect(tristogram.colors[4 * i]).toBe(1);     // R
        expect(tristogram.colors[4 * i + 1]).toBe(1); // G
        expect(tristogram.colors[4 * i + 2]).toBe(1); // B
        expect(tristogram.colors[4 * i + 3]).toBe(1); // A
      }
    });

    it('should handle single pixel data', () => {
      const singlePixelData = {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      };

      const tristogram = new Tristogram(singlePixelData);
      
      expect(tristogram.nonZeroCount).toBe(1);
      expect(tristogram.positions).toEqual(new Float32Array([0, 0, 0]));
      expect(tristogram.values).toEqual([1]);
      expect(tristogram.pixelSources[0]).toEqual([{x: 0, y: 0}]);
    });
  });

  describe('factory methods', () => {
    describe('fromImageData', () => {
      it('should create tristogram from ImageData', () => {
        const imageData = mockPixelData as ImageData;
        const tristogram = Tristogram.fromImageData(imageData);
        
        expect(tristogram).toBeInstanceOf(Tristogram);
        expect(tristogram.nonZeroCount).toBe(4);
      });
    });

    describe('fromHTMLImage', () => {
      it('should create tristogram from HTMLImageElement', () => {
        const tristogram = Tristogram.fromHTMLImage(mockImage);
        
        expect(tristogram).toBeInstanceOf(Tristogram);
        expect(tristogram.nonZeroCount).toBe(4);
        expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
      });
    });

    describe('fromFile', () => {
      it('should throw error in browser environment', async () => {
        await expect(Tristogram.fromFile('/path/to/image.jpg')).rejects.toThrow('fromFile is only available in Node.js environment');
      });
    });
  });

  describe('getImageData', () => {
    it('should create canvas with correct dimensions', () => {
      Tristogram.getImageData(mockImage);
      
      expect(mockCanvas.width).toBe(2);
      expect(mockCanvas.height).toBe(2);
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 2, 2);
    });

    it('should return ImageData object', () => {
      const result = Tristogram.getImageData(mockImage);
      
      expect(result).toBeDefined();
      expect(result.width).toBe(2);
      expect(result.height).toBe(2);
      expect(result.data).toBeInstanceOf(Uint8ClampedArray);
    });
  });

  describe('getPixel', () => {
    it('should extract correct pixel values', () => {
      const pixelData = {
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([
          255, 0, 0, 255,    // Red pixel at (0,0)
          0, 255, 0, 255,    // Green pixel at (1,0)
          0, 0, 255, 255,    // Blue pixel at (0,1)
          255, 255, 255, 255 // White pixel at (1,1)
        ]),
      };

      const redPixel = Tristogram.getPixel(pixelData, 0, 0);
      expect(redPixel).toEqual({ r: 255, g: 0, b: 0, a: 255 });

      const greenPixel = Tristogram.getPixel(pixelData, 1, 0);
      expect(greenPixel).toEqual({ r: 0, g: 255, b: 0, a: 255 });

      const bluePixel = Tristogram.getPixel(pixelData, 0, 1);
      expect(bluePixel).toEqual({ r: 0, g: 0, b: 255, a: 255 });

      const whitePixel = Tristogram.getPixel(pixelData, 1, 1);
      expect(whitePixel).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    });

    it('should handle edge cases', () => {
      const pixelData = {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray([128, 64, 32, 16]),
      };

      const pixel = Tristogram.getPixel(pixelData, 0, 0);
      expect(pixel).toEqual({ r: 128, g: 64, b: 32, a: 16 });
    });
  });

  describe('algorithm comparison', () => {
    it('should produce equivalent results between legacy and single-pass algorithms', () => {
      const legacyTristogram = new Tristogram(mockPixelData, { algorithm: 'legacy' });
      const singlePassTristogram = new Tristogram(mockPixelData, { algorithm: 'single-pass' });

      // Basic properties should match
      expect(singlePassTristogram.nonZeroCount).toBe(legacyTristogram.nonZeroCount);
      expect(singlePassTristogram.maxValue).toBe(legacyTristogram.maxValue);
      expect(singlePassTristogram.totalCount).toBe(legacyTristogram.totalCount);

      // Arrays should have same length
      expect(singlePassTristogram.positions.length).toBe(legacyTristogram.positions.length);
      expect(singlePassTristogram.values.length).toBe(legacyTristogram.values.length);
      expect(singlePassTristogram.colors.length).toBe(legacyTristogram.colors.length);
      expect(singlePassTristogram.pixelSources.length).toBe(legacyTristogram.pixelSources.length);

      // Convert to sorted arrays for comparison (since order might differ)
      const legacyData = [];
      const singlePassData = [];

      for (let i = 0; i < legacyTristogram.values.length; i++) {
        legacyData.push({
          r: legacyTristogram.positions[i * 3],
          g: legacyTristogram.positions[i * 3 + 1], 
          b: legacyTristogram.positions[i * 3 + 2],
          value: legacyTristogram.values[i],
          alpha: legacyTristogram.colors[i * 4 + 3],
          pixelCount: legacyTristogram.pixelSources[i].length
        });
      }

      for (let i = 0; i < singlePassTristogram.values.length; i++) {
        singlePassData.push({
          r: singlePassTristogram.positions[i * 3],
          g: singlePassTristogram.positions[i * 3 + 1],
          b: singlePassTristogram.positions[i * 3 + 2], 
          value: singlePassTristogram.values[i],
          alpha: singlePassTristogram.colors[i * 4 + 3],
          pixelCount: singlePassTristogram.pixelSources[i].length
        });
      }

      // Sort both arrays by RGB values for comparison
      const sortFn = (a: any, b: any) => {
        if (a.r !== b.r) return a.r - b.r;
        if (a.g !== b.g) return a.g - b.g;
        return a.b - b.b;
      };

      legacyData.sort(sortFn);
      singlePassData.sort(sortFn);

      // Compare each entry
      expect(singlePassData).toEqual(legacyData);
    });

    it('should default to single-pass algorithm when no option specified', () => {
      const defaultTristogram = new Tristogram(mockPixelData);
      const explicitSinglePass = new Tristogram(mockPixelData, { algorithm: 'single-pass' });

      expect(defaultTristogram.nonZeroCount).toBe(explicitSinglePass.nonZeroCount);
      expect(defaultTristogram.maxValue).toBe(explicitSinglePass.maxValue);
      expect(defaultTristogram.positions.length).toBe(explicitSinglePass.positions.length);
    });

    it('should only create tristogram 3D array for legacy algorithm', () => {
      const legacyTristogram = new Tristogram(mockPixelData, { algorithm: 'legacy' });
      const singlePassTristogram = new Tristogram(mockPixelData, { algorithm: 'single-pass' });

      expect(legacyTristogram.tristogram).toBeDefined();
      expect(singlePassTristogram.tristogram).toBeUndefined();
    });
  });

  describe('pixelSources functionality', () => {
    it('should track pixel coordinates for each color in legacy algorithm', () => {
      const tristogram = new Tristogram(mockPixelData, { algorithm: 'legacy' });
      
      expect(tristogram.pixelSources).toBeDefined();
      expect(tristogram.pixelSources.length).toBe(4);
      
      // Each color should have exactly one pixel
      for (let i = 0; i < tristogram.pixelSources.length; i++) {
        expect(tristogram.pixelSources[i].length).toBe(1);
        expect(tristogram.pixelSources[i][0]).toHaveProperty('x');
        expect(tristogram.pixelSources[i][0]).toHaveProperty('y');
        expect(typeof tristogram.pixelSources[i][0].x).toBe('number');
        expect(typeof tristogram.pixelSources[i][0].y).toBe('number');
      }
    });

    it('should track pixel coordinates for each color in single-pass algorithm', () => {
      const tristogram = new Tristogram(mockPixelData, { algorithm: 'single-pass' });
      
      expect(tristogram.pixelSources).toBeDefined();
      expect(tristogram.pixelSources.length).toBe(4);
      
      // Each color should have exactly one pixel
      for (let i = 0; i < tristogram.pixelSources.length; i++) {
        expect(tristogram.pixelSources[i].length).toBe(1);
        expect(tristogram.pixelSources[i][0]).toHaveProperty('x');
        expect(tristogram.pixelSources[i][0]).toHaveProperty('y');
      }
    });

    it('should handle duplicate colors correctly', () => {
      const duplicatePixelData = {
        width: 2,
        height: 1,
        data: new Uint8ClampedArray([
          255, 0, 0, 255,    // Red pixel at (0,0)
          255, 0, 0, 255,    // Same red pixel at (1,0)
        ]),
      };

      const tristogram = new Tristogram(duplicatePixelData);
      
      expect(tristogram.nonZeroCount).toBe(1); // Only one unique color
      expect(tristogram.values[0]).toBe(2);    // But count is 2
      expect(tristogram.pixelSources[0].length).toBe(2); // Two source pixels
      expect(tristogram.pixelSources[0]).toEqual([
        {x: 0, y: 0},
        {x: 1, y: 0}
      ]);
    });

    it('should maintain pixel count consistency between values and pixelSources', () => {
      const tristogram = new Tristogram(mockPixelData);
      
      for (let i = 0; i < tristogram.values.length; i++) {
        expect(tristogram.values[i]).toBe(tristogram.pixelSources[i].length);
      }
    });

    it('should produce identical pixelSources between algorithms', () => {
      const legacyTristogram = new Tristogram(mockPixelData, { algorithm: 'legacy' });
      const singlePassTristogram = new Tristogram(mockPixelData, { algorithm: 'single-pass' });

      // Create sorted maps for comparison
      const legacyMap = new Map();
      const singlePassMap = new Map();

      for (let i = 0; i < legacyTristogram.values.length; i++) {
        const key = `${legacyTristogram.positions[i * 3]},${legacyTristogram.positions[i * 3 + 1]},${legacyTristogram.positions[i * 3 + 2]}`;
        legacyMap.set(key, legacyTristogram.pixelSources[i].sort((a, b) => a.x - b.x || a.y - b.y));
      }

      for (let i = 0; i < singlePassTristogram.values.length; i++) {
        const key = `${singlePassTristogram.positions[i * 3]},${singlePassTristogram.positions[i * 3 + 1]},${singlePassTristogram.positions[i * 3 + 2]}`;
        singlePassMap.set(key, singlePassTristogram.pixelSources[i].sort((a, b) => a.x - b.x || a.y - b.y));
      }

      // Compare each entry
      for (const [key, legacyPixels] of legacyMap) {
        expect(singlePassMap.has(key)).toBe(true);
        expect(singlePassMap.get(key)).toEqual(legacyPixels);
      }
    });
  });
});