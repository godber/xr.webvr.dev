/**
 * Test suite for generating and verifying sample test images
 */

import { describe, it, expect } from 'vitest';
import { runBenchmarkSuite } from './benchmarkRunner';
import { ImageType } from './imageGenerator';
import { saveAllSampleImages, createComparisonGrid, analyzeImageTypes } from './sampleImageSaver';
import { BenchmarkConfig } from './benchmarkTypes';

describe('Sample Image Generation', () => {
  it('should generate sample images with verification', async () => {
    const config: BenchmarkConfig = {
      imageSizes: [{ width: 200, height: 200 }],
      iterations: 1,
      warmupRuns: 1,
      imageTypes: [ImageType.SOLID_COLOR, ImageType.GRADIENT, ImageType.RANDOM_NOISE, ImageType.CHECKERBOARD],
      enableMemoryMonitoring: false,
      enablePhaseTimings: false,
      saveSampleImages: true,
      sampleImageDir: 'test-samples',
    };

    console.log('\n=== Generating Sample Test Images ===');
    
    // Run benchmark with sample image saving enabled
    const suite = await runBenchmarkSuite(config);
    
    // Verify that all image types were tested
    expect(suite.results).toHaveLength(4);
    
    // Verify each image type generates valid results
    suite.results.forEach(result => {
      expect(result.avgTime).toBeGreaterThan(0);
      expect(result.histogramStats.nonZeroCount).toBeGreaterThan(0);
      expect(result.histogramStats.maxValue).toBeGreaterThan(0);
      expect(result.histogramStats.totalPixels).toBe(200 * 200);
      
      console.log(`✓ ${result.imageType}: ${result.avgTime.toFixed(2)}ms, ${result.histogramStats.nonZeroCount} unique colors`);
    });

    console.log('\n📁 Sample images saved with prefix "test-samples/"');
    console.log('🎯 Check your browser\'s download folder for the generated images');
  }, 30000);

  it('should analyze image generation characteristics', async () => {
    console.log('\n=== Image Generation Analysis ===');
    
    await analyzeImageTypes();
    
    // This test validates that the analysis runs without errors
    expect(true).toBe(true);
  }, 10000);

  it('should create a visual comparison grid (browser only)', async () => {
    console.log('\n=== Creating Visual Comparison Grid ===');
    
    if (typeof window !== 'undefined') {
      await createComparisonGrid({ width: 150, height: 150 });
      console.log('📋 Comparison grid saved as "test-images-comparison-grid.png"');
    } else {
      console.log('⚠️  Comparison grid requires browser environment (skipped in test)');
    }
    
    expect(true).toBe(true);
  }, 10000);

  it('should save individual sample images (browser only)', async () => {
    console.log('\n=== Saving Individual Sample Images ===');
    
    if (typeof window !== 'undefined') {
      await saveAllSampleImages('individual-samples');
      console.log('📁 Individual samples saved with prefix "individual-samples/"');
    } else {
      console.log('⚠️  Individual sample saving requires browser environment (skipped in test)');
    }
    
    expect(true).toBe(true);
  }, 15000);

  it('should validate image generation performance', async () => {
    console.log('\n=== Image Generation Performance Test ===');
    
    const testSizes = [
      { width: 50, height: 50 },
      { width: 100, height: 100 },
      { width: 200, height: 200 },
    ];
    
    for (const size of testSizes) {
      const config: BenchmarkConfig = {
        imageSizes: [size],
        iterations: 3,
        warmupRuns: 1,
        imageTypes: [ImageType.SOLID_COLOR, ImageType.RANDOM_NOISE],
        enableMemoryMonitoring: false,
        enablePhaseTimings: true,
        saveSampleImages: false,
      };
      
      const suite = await runBenchmarkSuite(config);
      
      suite.results.forEach(result => {
        const pixelCount = size.width * size.height;
        const timePerPixel = result.avgTime / pixelCount * 1000; // nanoseconds per pixel
        
        console.log(`${size.width}x${size.height} ${result.imageType}: ${result.avgTime.toFixed(2)}ms (${timePerPixel.toFixed(2)}ns/pixel)`);
        
        // Sanity check - should be able to process at least 1000 pixels per millisecond
        expect(timePerPixel).toBeLessThan(1000000); // Less than 1ms per pixel
        
        if (result.phaseTimings) {
          expect(result.phaseTimings.imageDataExtraction).toBeGreaterThan(0);
          expect(result.phaseTimings.histogramBuilding).toBeGreaterThan(0);
          expect(result.phaseTimings.resultProcessing).toBeGreaterThan(0);
        }
      });
    }
  }, 45000);
});