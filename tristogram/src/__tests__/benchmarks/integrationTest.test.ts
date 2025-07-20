/**
 * Integration test to verify the realistic image data flows through the entire benchmark system
 */

import { describe, it, expect } from 'vitest';
import { generateMockTestImage } from './mockImageGenerator';
import { ImageType } from './imageGenerator';
import Tristogram from '../../Tristogram';

describe('Realistic Image Data Integration', () => {
  it('should flow realistic data through the complete pipeline', async () => {
    console.log('\n=== Integration Test: Mock Image → Canvas → Tristogram ===');
    
    const imageTypes = [
      { type: ImageType.SOLID_COLOR, expectedColors: 1 },
      { type: ImageType.GRADIENT, expectedRange: [50, 500] },
      { type: ImageType.RANDOM_NOISE, expectedRange: [5000, 16777216] },
      { type: ImageType.CHECKERBOARD, expectedColors: 2 }
    ];
    
    for (const { type, expectedColors, expectedRange } of imageTypes) {
      console.log(`\nTesting ${type}:`);
      
      // Step 1: Generate mock image with metadata
      const mockImage = await generateMockTestImage(type, { width: 100, height: 100 });
      console.log(`  ✓ Mock image created with type: ${(mockImage as any).__mockImageType}`);
      
      // Step 2: Process through Tristogram (this should trigger Canvas mock with realistic data)
      const tristogram = new Tristogram(mockImage);
      console.log(`  ✓ Tristogram processed`);
      console.log(`  → Unique colors: ${tristogram.nonZeroCount}`);
      console.log(`  → Max frequency: ${tristogram.maxValue}`);
      console.log(`  → Total pixels: ${mockImage.width * mockImage.height}`);
      
      // Step 3: Validate results
      if (expectedColors) {
        expect(tristogram.nonZeroCount).toBe(expectedColors);
        console.log(`  ✓ Expected exactly ${expectedColors} colors`);
      } else if (expectedRange) {
        expect(tristogram.nonZeroCount).toBeGreaterThanOrEqual(expectedRange[0]);
        expect(tristogram.nonZeroCount).toBeLessThanOrEqual(expectedRange[1]);
        console.log(`  ✓ Within expected range ${expectedRange[0]}-${expectedRange[1]}`);
      }
      
      expect(tristogram.maxValue).toBeGreaterThan(0);
    }
    
    console.log('\n✅ All integration tests passed!');
  });

  it('should debug the Canvas mock flow', async () => {
    console.log('\n=== Debug: Canvas Mock Flow ===');
    
    // Create a mock image with solid color type
    const mockImage = await generateMockTestImage(ImageType.SOLID_COLOR, { width: 10, height: 10 });
    
    console.log('Mock image properties:');
    console.log(`  width: ${mockImage.width}`);
    console.log(`  height: ${mockImage.height}`);
    console.log(`  __mockImageType: ${(mockImage as any).__mockImageType}`);
    console.log(`  __mockWidth: ${(mockImage as any).__mockWidth}`);
    console.log(`  __mockHeight: ${(mockImage as any).__mockHeight}`);
    
    // Test Canvas operations directly
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    console.log('\nBefore drawImage:');
    console.log(`  canvas.width: ${canvas.width}`);
    console.log(`  canvas.height: ${canvas.height}`);
    
    // This should trigger our mock and store realistic data
    ctx.drawImage(mockImage, 0, 0);
    
    console.log('\nAfter drawImage:');
    console.log(`  canvas.width: ${canvas.width}`);
    console.log(`  canvas.height: ${canvas.height}`);
    
    // Get the image data - this should be realistic solid color data
    const imageData = ctx.getImageData(0, 0, mockImage.width, mockImage.height);
    
    console.log('\nImageData received:');
    console.log(`  width: ${imageData.width}`);
    console.log(`  height: ${imageData.height}`);
    console.log(`  data length: ${imageData.data.length}`);
    
    // Check first few pixels to see if they're solid color
    const firstPixel = {
      r: imageData.data[0],
      g: imageData.data[1], 
      b: imageData.data[2],
      a: imageData.data[3]
    };
    
    const secondPixel = {
      r: imageData.data[4],
      g: imageData.data[5],
      b: imageData.data[6], 
      a: imageData.data[7]
    };
    
    console.log(`  First pixel: R=${firstPixel.r}, G=${firstPixel.g}, B=${firstPixel.b}, A=${firstPixel.a}`);
    console.log(`  Second pixel: R=${secondPixel.r}, G=${secondPixel.g}, B=${secondPixel.b}, A=${secondPixel.a}`);
    
    // For solid color, all pixels should be the same
    const shouldBeSolid = firstPixel.r === secondPixel.r && 
                         firstPixel.g === secondPixel.g && 
                         firstPixel.b === secondPixel.b;
    
    console.log(`  Are first two pixels identical? ${shouldBeSolid}`);
    
    // Now test the full Tristogram flow
    console.log('\nTesting full Tristogram flow:');
    const tristogram = new Tristogram(mockImage);
    console.log(`  Unique colors from Tristogram: ${tristogram.nonZeroCount}`);
    
    expect(imageData.width).toBe(10);
    expect(imageData.height).toBe(10);
  });
});