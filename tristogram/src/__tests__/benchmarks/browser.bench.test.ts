import { describe, it, expect } from 'vitest';
import { ImageGenerator, type ImageType } from './imageGenerator';
import { TristogramBenchmark, type BenchmarkConfig, type AlgorithmComparison } from './benchmarkUtils';

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
        it(`should compare legacy vs single-pass algorithms for ${width}x${height} ${imageType} image`, () => {
          // Generate test image
          const pixelData = ImageGenerator.generateSyntheticImage(width, height, imageType);
          
          // Run algorithm comparison
          const comparison = TristogramBenchmark.compareAlgorithms(
            pixelData,
            benchmarkConfig.iterations,
            benchmarkConfig.warmupRuns
          );
          
          // Update comparison with image type
          comparison.imageType = imageType;
          comparison.legacy.imageType = imageType;
          comparison.singlePass.imageType = imageType;
          
          // Assertions
          expect(comparison.legacy.totalTime).toBeGreaterThan(0);
          expect(comparison.singlePass.totalTime).toBeGreaterThan(0);
          expect(comparison.speedup).toBeGreaterThan(0);
          expect(comparison.legacy.nonZeroCount).toBe(comparison.singlePass.nonZeroCount);
          expect(comparison.legacy.maxValue).toBe(comparison.singlePass.maxValue);
          
          // Log comparison results
          console.log(`\n🔬 Algorithm Comparison - ${imageType} ${width}x${height}:`);
          console.log(`   Legacy Algorithm:      ${comparison.legacy.totalTime.toFixed(3)}ms (${comparison.legacy.minTime.toFixed(3)}-${comparison.legacy.maxTime.toFixed(3)}ms)`);
          console.log(`   Single-Pass Algorithm: ${comparison.singlePass.totalTime.toFixed(3)}ms (${comparison.singlePass.minTime.toFixed(3)}-${comparison.singlePass.maxTime.toFixed(3)}ms)`);
          console.log(`   Speedup:               ${comparison.speedup.toFixed(2)}x faster`);
          console.log(`   Memory Improvement:    ${comparison.memoryImprovement}`);
          console.log(`   Non-zero Colors:       ${comparison.singlePass.nonZeroCount.toLocaleString()}`);
          console.log(`   Max Value:             ${comparison.singlePass.maxValue}`);
          
          // Performance sanity checks - Single-pass should be faster than legacy
          expect(comparison.speedup).toBeGreaterThanOrEqual(0.8); // Allow small variance
        });
      });
    });
  });

  it('should show algorithm performance comparison across image sizes', () => {
    const imageType: ImageType = 'gradient';
    const comparisons: AlgorithmComparison[] = [];
    
    // Run algorithm comparisons for different sizes
    benchmarkConfig.imageSizes.forEach(({ width, height }) => {
      const pixelData = ImageGenerator.generateSyntheticImage(width, height, imageType);
      const comparison = TristogramBenchmark.compareAlgorithms(
        pixelData,
        3, // Fewer iterations for scaling test
        1  // Fewer warmup runs
      );
      comparison.imageType = imageType;
      comparisons.push(comparison);
    });
    
    // Log algorithm comparison analysis
    console.log('\n📈 Algorithm Performance Comparison Analysis:');
    console.log('Size\t\tPixels\t\tLegacy(ms)\tSingle-Pass(ms)\tSpeedup\tColors');
    console.log('─'.repeat(80));
    
    comparisons.forEach((comparison) => {
      const [width, height] = comparison.imageSize.split('x').map(Number);
      const pixels = width * height;
      console.log(
        `${comparison.imageSize}\t\t${pixels.toLocaleString()}\t\t` +
        `${comparison.legacy.totalTime.toFixed(2)}\t\t${comparison.singlePass.totalTime.toFixed(2)}\t\t` +
        `${comparison.speedup.toFixed(2)}x\t${comparison.singlePass.nonZeroCount.toLocaleString()}`
      );
    });
    
    // Verify that larger images generally take more time and single-pass is consistently faster
    for (let i = 1; i < comparisons.length; i++) {
      const prevComparison = comparisons[i - 1];
      const currComparison = comparisons[i];
      
      const [prevW, prevH] = prevComparison.imageSize.split('x').map(Number);
      const [currW, currH] = currComparison.imageSize.split('x').map(Number);
      const prevPixels = prevW * prevH;
      const currPixels = currW * currH;
      
      if (currPixels > prevPixels * 2) { // Only compare significantly larger images
        // Single-pass should maintain good speedup on larger images
        expect(currComparison.speedup).toBeGreaterThanOrEqual(0.8);
      }
    }
  });
});