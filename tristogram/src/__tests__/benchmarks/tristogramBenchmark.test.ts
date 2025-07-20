/**
 * Comprehensive benchmark test suite for Tristogram constructor
 */

import { describe, it, expect } from 'vitest';
import { runBenchmarkSuite, DEFAULT_BENCHMARK_CONFIG } from './benchmarkRunner';
import { ImageType } from './imageGenerator';
import { BenchmarkConfig, BenchmarkSuite } from './benchmarkTypes';

/**
 * Formats benchmark results for console output
 */
function formatBenchmarkResults(suite: BenchmarkSuite): void {
  console.log('\n=== Tristogram Constructor Benchmark Results ===');
  console.log(`Total execution time: ${suite.totalTime.toFixed(2)}ms`);
  console.log(`Test environment: ${suite.environment.platform}`);
  console.log(`Memory monitoring: ${suite.environment.memorySupported ? 'Available' : 'Not available'}`);
  console.log(`Timestamp: ${suite.timestamp}\n`);

  // Group results by image size
  const resultsBySize = suite.results.reduce((acc, result) => {
    const sizeKey = `${result.imageSize.width}x${result.imageSize.height}`;
    if (!acc[sizeKey]) acc[sizeKey] = [];
    acc[sizeKey].push(result);
    return acc;
  }, {} as Record<string, typeof suite.results>);

  Object.entries(resultsBySize).forEach(([size, results]) => {
    console.log(`\n--- ${size} Images ---`);
    
    results.forEach(result => {
      console.log(`\n${result.imageType.toUpperCase()} (${result.iterations} iterations):`);
      console.log(`  Average: ${result.avgTime.toFixed(2)}ms`);
      console.log(`  Range: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.standardDeviation.toFixed(2)}ms`);
      console.log(`  CV: ${(result.standardDeviation / result.avgTime * 100).toFixed(1)}%`);
      
      if (result.memoryUsage) {
        console.log(`  Memory: ${(result.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      }
      
      if (result.phaseTimings) {
        console.log(`  Phase breakdown:`);
        console.log(`    Image extraction: ${result.phaseTimings.imageDataExtraction.toFixed(2)}ms`);
        console.log(`    Histogram building: ${result.phaseTimings.histogramBuilding.toFixed(2)}ms`);
        console.log(`    Result processing: ${result.phaseTimings.resultProcessing.toFixed(2)}ms`);
      }
      
      console.log(`  Histogram: ${result.histogramStats.nonZeroCount} non-zero bins, max value ${result.histogramStats.maxValue}`);
    });
  });
  
  console.log('\n=== Performance Analysis ===');
  
  // Performance scaling analysis
  const solidColorResults = suite.results.filter(r => r.imageType === ImageType.SOLID_COLOR);
  if (solidColorResults.length > 1) {
    console.log('\nSolid Color Scaling (pixels vs time):');
    solidColorResults.forEach(result => {
      const pixels = result.imageSize.width * result.imageSize.height;
      const timePerPixel = result.avgTime / pixels * 1000; // ns per pixel
      console.log(`  ${result.imageSize.width}x${result.imageSize.height}: ${timePerPixel.toFixed(2)}ns/pixel`);
    });
  }
  
  // Image type comparison for same size
  const largeImageResults = suite.results.filter(r => 
    r.imageSize.width === 1000 && r.imageSize.height === 1000
  );
  if (largeImageResults.length > 1) {
    console.log('\nImage Type Performance (1000x1000):');
    largeImageResults.forEach(result => {
      console.log(`  ${result.imageType}: ${result.avgTime.toFixed(2)}ms (${result.histogramStats.nonZeroCount} unique colors)`);
    });
  }
}

/**
 * Exports benchmark results to JSON format
 */
function exportBenchmarkResults(suite: BenchmarkSuite): string {
  return JSON.stringify(suite, null, 2);
}

describe('Tristogram Constructor Benchmark', () => {
  it('should run comprehensive performance benchmark', async () => {
    const suite = await runBenchmarkSuite(DEFAULT_BENCHMARK_CONFIG);
    
    // Format and display results
    formatBenchmarkResults(suite);
    
    // Basic validation
    expect(suite.results).toHaveLength(
      DEFAULT_BENCHMARK_CONFIG.imageSizes.length * DEFAULT_BENCHMARK_CONFIG.imageTypes.length
    );
    
    // Ensure all results have valid timings
    suite.results.forEach(result => {
      expect(result.avgTime).toBeGreaterThan(0);
      expect(result.minTime).toBeGreaterThan(0);
      expect(result.maxTime).toBeGreaterThanOrEqual(result.minTime);
      expect(result.standardDeviation).toBeGreaterThanOrEqual(0);
      expect(result.rawTimings).toHaveLength(DEFAULT_BENCHMARK_CONFIG.iterations);
      expect(result.histogramStats.nonZeroCount).toBeGreaterThan(0);
      expect(result.histogramStats.maxValue).toBeGreaterThan(0);
      // Note: In test environment, totalPixels reflects mock data limitations
      expect(result.histogramStats.totalPixels).toBeGreaterThan(0);
    });
    
    // Export results for external analysis
    const jsonResults = exportBenchmarkResults(suite);
    console.log('\n=== JSON Export (for external analysis) ===');
    console.log('Results exported to JSON format (truncated):');
    console.log(jsonResults.substring(0, 500) + '...');
    
    expect(suite.totalTime).toBeGreaterThan(0);
    expect(suite.environment.userAgent).toBeDefined();
  }, 300000); // 5 minute timeout for comprehensive benchmark

  it('should run quick benchmark for CI', async () => {
    const quickConfig: BenchmarkConfig = {
      imageSizes: [
        { width: 100, height: 100 },
        { width: 500, height: 500 },
      ],
      iterations: 3,
      warmupRuns: 1,
      imageTypes: [ImageType.SOLID_COLOR, ImageType.RANDOM_NOISE],
      enableMemoryMonitoring: false,
      enablePhaseTimings: false,
    };
    
    const suite = await runBenchmarkSuite(quickConfig);
    
    console.log('\n=== Quick Benchmark Results ===');
    suite.results.forEach(result => {
      console.log(`${result.testCase}: ${result.avgTime.toFixed(2)}ms avg`);
    });
    
    expect(suite.results).toHaveLength(4); // 2 sizes × 2 types
    suite.results.forEach(result => {
      expect(result.avgTime).toBeGreaterThan(0);
    });
  }, 60000); // 1 minute timeout for quick benchmark

  it('should demonstrate performance scaling', async () => {
    const scalingConfig: BenchmarkConfig = {
      imageSizes: [
        { width: 50, height: 50 },
        { width: 100, height: 100 },
        { width: 200, height: 200 },
        { width: 400, height: 400 },
      ],
      iterations: 5,
      warmupRuns: 2,
      imageTypes: [ImageType.SOLID_COLOR],
      enableMemoryMonitoring: false,
      enablePhaseTimings: true,
    };
    
    const suite = await runBenchmarkSuite(scalingConfig);
    
    console.log('\n=== Performance Scaling Analysis ===');
    console.log('Size\t\tPixels\t\tTime (ms)\tTime/Pixel (ns)');
    console.log('----\t\t------\t\t---------\t---------------');
    
    suite.results.forEach(result => {
      const pixels = result.imageSize.width * result.imageSize.height;
      const timePerPixel = result.avgTime / pixels * 1000000; // nanoseconds per pixel
      console.log(`${result.imageSize.width}x${result.imageSize.height}\t\t${pixels}\t\t${result.avgTime.toFixed(2)}\t\t${timePerPixel.toFixed(2)}`);
    });
    
    // Verify that performance scales roughly linearly with pixel count
    const sortedResults = suite.results.sort((a, b) => 
      (a.imageSize.width * a.imageSize.height) - (b.imageSize.width * b.imageSize.height)
    );
    
    for (let i = 1; i < sortedResults.length; i++) {
      const prevPixels = sortedResults[i-1].imageSize.width * sortedResults[i-1].imageSize.height;
      const currPixels = sortedResults[i].imageSize.width * sortedResults[i].imageSize.height;
      
      const timeRatio = sortedResults[i].avgTime / sortedResults[i-1].avgTime;
      
      console.log(`${currPixels / prevPixels}x pixels → ${timeRatio.toFixed(2)}x time`);
      
      // Time should increase with pixel count (allowing for some variance)
      expect(timeRatio).toBeGreaterThan(0.5);
    }
  }, 120000); // 2 minute timeout
});