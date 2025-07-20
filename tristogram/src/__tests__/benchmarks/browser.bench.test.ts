import { describe, it, expect } from 'vitest';
import { ImageGenerator, type ImageType } from './imageGenerator';
import { TristogramBenchmark, type BenchmarkConfig, type BenchmarkResult } from './benchmarkUtils';

describe('Tristogram Constructor Benchmarks - Browser Environment', () => {
  const benchmarkConfig: BenchmarkConfig = {
    imageSizes: [
      { width: 50, height: 50 },    // 2.5K pixels
      { width: 100, height: 100 },  // 10K pixels
      { width: 200, height: 200 },  // 40K pixels
      { width: 500, height: 500 },  // 250K pixels
    ],
    imageTypes: ['solid', 'gradient', 'noise'] as ImageType[],
    iterations: 5,
    warmupRuns: 2,
  };

  // Test for each image type and size combination
  benchmarkConfig.imageTypes.forEach((imageType) => {
    describe(`Image Type: ${imageType}`, () => {
      benchmarkConfig.imageSizes.forEach(({ width, height }) => {
        it(`should benchmark ${width}x${height} ${imageType} image`, () => {
          // Generate test image
          const pixelData = ImageGenerator.generateSyntheticImage(width, height, imageType);
          
          // Run benchmark
          const result = TristogramBenchmark.runBenchmarkIterations(
            pixelData,
            benchmarkConfig.iterations,
            benchmarkConfig.warmupRuns
          );
          
          // Update result with image type
          result.imageType = imageType;
          
          // Assertions
          expect(result.totalTime).toBeGreaterThan(0);
          expect(result.phases.pixelIteration).toBeGreaterThan(0);
          expect(result.phases.resultProcessing).toBeGreaterThan(0);
          expect(result.avgTime).toBeGreaterThan(0);
          expect(result.minTime).toBeLessThanOrEqual(result.maxTime);
          expect(result.iterations).toBe(benchmarkConfig.iterations);
          
          // Log results for analysis
          console.log(`\n📊 Browser Benchmark Results - ${imageType} ${width}x${height}:`);
          console.log(`   Total Time: ${result.totalTime.toFixed(3)}ms (avg)`);
          console.log(`   Pixel Iteration: ${result.phases.pixelIteration.toFixed(3)}ms`);
          console.log(`   Result Processing: ${result.phases.resultProcessing.toFixed(3)}ms`);
          console.log(`   Range: ${result.minTime.toFixed(3)}ms - ${result.maxTime.toFixed(3)}ms`);
          console.log(`   Iterations: ${result.iterations}`);
          
          // Performance sanity checks
          const pixelCount = width * height;
          const timePerPixel = result.phases.pixelIteration / pixelCount;
          
          // Should process at least 1000 pixels per ms (very conservative check)
          if (pixelCount > 1000) {
            expect(timePerPixel).toBeLessThan(0.001); // Less than 1μs per pixel
          }
        });
      });
    });
  });

  it('should show performance scaling with image size', () => {
    const imageType: ImageType = 'gradient';
    const results: BenchmarkResult[] = [];
    
    // Run benchmarks for different sizes
    benchmarkConfig.imageSizes.forEach(({ width, height }) => {
      const pixelData = ImageGenerator.generateSyntheticImage(width, height, imageType);
      const result = TristogramBenchmark.runBenchmarkIterations(
        pixelData,
        3, // Fewer iterations for scaling test
        1  // Fewer warmup runs
      );
      result.imageType = imageType;
      results.push(result);
    });
    
    // Log scaling analysis
    console.log('\n📈 Browser Performance Scaling Analysis:');
    console.log('Size\t\tPixels\t\tTotal(ms)\tPixel Iter(ms)\tResult Proc(ms)');
    console.log('─'.repeat(80));
    
    results.forEach((result) => {
      const [width, height] = result.imageSize.split('x').map(Number);
      const pixels = width * height;
      console.log(
        `${result.imageSize}\t\t${pixels.toLocaleString()}\t\t` +
        `${result.totalTime.toFixed(2)}\t\t${result.phases.pixelIteration.toFixed(2)}\t\t` +
        `${result.phases.resultProcessing.toFixed(2)}`
      );
    });
    
    // Verify that larger images take more time (generally)
    for (let i = 1; i < results.length; i++) {
      const prevSize = results[i - 1].imageSize.split('x').map(Number);
      const currSize = results[i].imageSize.split('x').map(Number);
      const prevPixels = prevSize[0] * prevSize[1];
      const currPixels = currSize[0] * currSize[1];
      
      if (currPixels > prevPixels * 2) { // Only compare significantly larger images
        expect(results[i].phases.pixelIteration).toBeGreaterThan(
          results[i - 1].phases.pixelIteration * 0.5 // Allow some variance
        );
      }
    }
  });
});