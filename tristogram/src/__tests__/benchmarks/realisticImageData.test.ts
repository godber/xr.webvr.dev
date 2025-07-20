/**
 * Test suite to validate the realistic image data generation
 */

import { describe, it, expect } from 'vitest';
import { 
  generateRealisticImageData, 
  analyzeImageData, 
  validateImageCharacteristics,
  generateSolidColorData,
  generateGradientData,
  generateRandomNoiseData,
  generateCheckerboardData
} from './realisticImageDataGenerator';
import { ImageType } from './imageGenerator';

describe('Realistic Image Data Generation', () => {
  it('should generate solid color data with exactly 1 unique color', () => {
    const imageData = generateSolidColorData(100, 100, 255, 0, 0);
    const analysis = analyzeImageData(imageData);
    
    expect(analysis.uniqueColors).toBe(1);
    expect(analysis.totalPixels).toBe(10000);
    expect(analysis.colorHistogram.get('255,0,0')).toBe(10000);
    
    console.log('✓ Solid color: 1 unique color (red)');
  });

  it('should generate gradient data with moderate number of colors', () => {
    const imageData = generateGradientData(200, 100);
    const analysis = analyzeImageData(imageData);
    
    expect(analysis.uniqueColors).toBeGreaterThan(50);
    expect(analysis.uniqueColors).toBeLessThan(500);
    expect(analysis.totalPixels).toBe(20000);
    
    console.log(`✓ Gradient: ${analysis.uniqueColors} unique colors`);
  });

  it('should generate random noise with many unique colors', () => {
    const imageData = generateRandomNoiseData(100, 100, 12345); // Seeded for reproducibility
    const analysis = analyzeImageData(imageData);
    
    expect(analysis.uniqueColors).toBeGreaterThan(5000);
    expect(analysis.totalPixels).toBe(10000);
    
    console.log(`✓ Random noise: ${analysis.uniqueColors} unique colors`);
  });

  it('should generate checkerboard with exactly 2 colors', () => {
    const imageData = generateCheckerboardData(100, 100, 10);
    const analysis = analyzeImageData(imageData);
    
    expect(analysis.uniqueColors).toBe(2);
    expect(analysis.totalPixels).toBe(10000);
    expect(analysis.colorHistogram.get('0,0,0')).toBeGreaterThan(0); // Black
    expect(analysis.colorHistogram.get('255,255,255')).toBeGreaterThan(0); // White
    
    console.log('✓ Checkerboard: 2 unique colors (black and white)');
  });

  it('should validate all image types have expected characteristics', () => {
    const testSize = { width: 100, height: 100 };
    const imageTypes = [
      ImageType.SOLID_COLOR,
      ImageType.GRADIENT, 
      ImageType.RANDOM_NOISE,
      ImageType.CHECKERBOARD
    ];

    console.log('\n=== Image Characteristic Validation ===');
    
    imageTypes.forEach(type => {
      const imageData = generateRealisticImageData(type, testSize.width, testSize.height);
      const validation = validateImageCharacteristics(type, imageData);
      
      console.log(validation.message);
      expect(validation.isValid).toBe(true);
    });
  });

  it('should generate different patterns for different image types', () => {
    const size = { width: 50, height: 50 };
    
    const solid = generateRealisticImageData(ImageType.SOLID_COLOR, size.width, size.height);
    const gradient = generateRealisticImageData(ImageType.GRADIENT, size.width, size.height);
    const noise = generateRealisticImageData(ImageType.RANDOM_NOISE, size.width, size.height);
    const checkerboard = generateRealisticImageData(ImageType.CHECKERBOARD, size.width, size.height);
    
    // Verify they're all different
    expect(solid.data).not.toEqual(gradient.data);
    expect(gradient.data).not.toEqual(noise.data);
    expect(noise.data).not.toEqual(checkerboard.data);
    
    // Verify they have different color characteristics
    const solidAnalysis = analyzeImageData(solid);
    const gradientAnalysis = analyzeImageData(gradient);
    const noiseAnalysis = analyzeImageData(noise);
    const checkerboardAnalysis = analyzeImageData(checkerboard);
    
    expect(solidAnalysis.uniqueColors).toBe(1);
    expect(gradientAnalysis.uniqueColors).toBeGreaterThan(solidAnalysis.uniqueColors);
    expect(noiseAnalysis.uniqueColors).toBeGreaterThan(gradientAnalysis.uniqueColors);
    expect(checkerboardAnalysis.uniqueColors).toBe(2);
    
    console.log('\n=== Color Count Comparison ===');
    console.log(`Solid: ${solidAnalysis.uniqueColors} colors`);
    console.log(`Gradient: ${gradientAnalysis.uniqueColors} colors`);
    console.log(`Noise: ${noiseAnalysis.uniqueColors} colors`);
    console.log(`Checkerboard: ${checkerboardAnalysis.uniqueColors} colors`);
  });

  it('should generate correct dimensions', () => {
    const testSizes = [
      { width: 50, height: 50 },
      { width: 100, height: 200 },
      { width: 300, height: 100 }
    ];
    
    testSizes.forEach(size => {
      const imageData = generateRealisticImageData(ImageType.SOLID_COLOR, size.width, size.height);
      
      expect(imageData.width).toBe(size.width);
      expect(imageData.height).toBe(size.height);
      expect(imageData.data.length).toBe(size.width * size.height * 4); // RGBA
    });
  });

  it('should handle edge cases', () => {
    // Very small images
    const tiny = generateRealisticImageData(ImageType.SOLID_COLOR, 1, 1);
    expect(tiny.data.length).toBe(4); // 1 pixel = 4 bytes (RGBA)
    
    const tinyAnalysis = analyzeImageData(tiny);
    expect(tinyAnalysis.uniqueColors).toBe(1);
    expect(tinyAnalysis.totalPixels).toBe(1);
    
    // Asymmetric images
    const tall = generateRealisticImageData(ImageType.CHECKERBOARD, 10, 100);
    expect(tall.width).toBe(10);
    expect(tall.height).toBe(100);
    
    const wide = generateRealisticImageData(ImageType.GRADIENT, 200, 5);
    expect(wide.width).toBe(200);
    expect(wide.height).toBe(5);
    
    console.log('✓ Edge cases handled correctly');
  });
});