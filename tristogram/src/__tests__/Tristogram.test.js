import { describe, it, expect, beforeEach, vi } from 'vitest';
import Tristogram from '../Tristogram.js';

describe('Tristogram', () => {
  let mockImage;
  let mockCanvas;
  let mockContext;

  beforeEach(() => {
    mockImage = {
      width: 2,
      height: 2,
    };

    mockContext = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([
          255, 0, 0, 255,    // Red pixel
          0, 255, 0, 255,    // Green pixel
          0, 0, 255, 255,    // Blue pixel
          255, 255, 255, 255 // White pixel
        ]),
      })),
    };

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
  });

  describe('constructor', () => {
    it('should initialize tristogram with correct dimensions', () => {
      const tristogram = new Tristogram(mockImage);
      
      expect(tristogram.tristogram).toBeDefined();
      expect(tristogram.tristogram.length).toBe(256);
      expect(tristogram.tristogram[0].length).toBe(256);
      expect(tristogram.tristogram[0][0].length).toBe(256);
    });

    it('should analyze image data and populate histogram', () => {
      const tristogram = new Tristogram(mockImage);
      
      expect(tristogram.nonZeroCount).toBe(4);
      expect(tristogram.totalCount).toBe(256 * 256 * 256);
      expect(tristogram.maxValue).toBe(1);
      expect(tristogram.positions.length).toBe(12); // 4 colors * 3 coordinates
      expect(tristogram.values.length).toBe(4);
    });

    it('should create color array with correct alpha values', () => {
      const tristogram = new Tristogram(mockImage);
      
      expect(tristogram.colors.length).toBe(16); // 4 colors * 4 components
      
      // All colors should have RGB = 1 and alpha = 1 (since maxValue = 1)
      for (let i = 0; i < 4; i++) {
        expect(tristogram.colors[4 * i]).toBe(1);     // R
        expect(tristogram.colors[4 * i + 1]).toBe(1); // G
        expect(tristogram.colors[4 * i + 2]).toBe(1); // B
        expect(tristogram.colors[4 * i + 3]).toBe(1); // A
      }
    });

    it('should handle empty image data', () => {
      mockContext.getImageData.mockReturnValue({
        width: 1,
        height: 1,
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      });

      const tristogram = new Tristogram(mockImage);
      
      expect(tristogram.nonZeroCount).toBe(1);
      expect(tristogram.positions).toEqual([0, 0, 0]);
      expect(tristogram.values).toEqual([1]);
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
      const imageData = {
        width: 2,
        height: 2,
        data: new Uint8ClampedArray([
          255, 0, 0, 255,    // Red pixel at (0,0)
          0, 255, 0, 255,    // Green pixel at (1,0)
          0, 0, 255, 255,    // Blue pixel at (0,1)
          255, 255, 255, 255 // White pixel at (1,1)
        ]),
      };

      const redPixel = Tristogram.getPixel(imageData, 0, 0);
      expect(redPixel).toEqual({ r: 255, g: 0, b: 0, a: 255 });

      const greenPixel = Tristogram.getPixel(imageData, 1, 0);
      expect(greenPixel).toEqual({ r: 0, g: 255, b: 0, a: 255 });

      const bluePixel = Tristogram.getPixel(imageData, 0, 1);
      expect(bluePixel).toEqual({ r: 0, g: 0, b: 255, a: 255 });

      const whitePixel = Tristogram.getPixel(imageData, 1, 1);
      expect(whitePixel).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    });

    it('should handle edge cases', () => {
      const imageData = {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray([128, 64, 32, 16]),
      };

      const pixel = Tristogram.getPixel(imageData, 0, 0);
      expect(pixel).toEqual({ r: 128, g: 64, b: 32, a: 16 });
    });
  });
});