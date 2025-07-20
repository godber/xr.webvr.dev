import Tristogram from '../../Tristogram';

interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}


export interface BenchmarkResult {
  imageSize: string;
  imageType: string;
  algorithm: string;
  totalTime: number;
  phases: {
    pixelIteration: number;
    resultProcessing: number;
  };
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  nonZeroCount: number;
  maxValue: number;
}

export interface AlgorithmComparison {
  imageSize: string;
  imageType: string;
  legacy: BenchmarkResult;
  singlePass: BenchmarkResult;
  speedup: number;
  memoryImprovement: string;
}

export interface BenchmarkConfig {
  imageSizes: Array<{ width: number; height: number }>;
  imageTypes: Array<'solid' | 'gradient' | 'noise'>;
  iterations: number;
  warmupRuns: number;
}

/**
 * Benchmark utility for measuring Tristogram constructor performance
 */
export class TristogramBenchmark {
  /**
   * Benchmark a specific algorithm implementation
   */
  static benchmarkAlgorithm(
    pixelData: PixelData,
    algorithm: 'legacy' | 'single-pass'
  ): {
    totalTime: number;
    tristogram: Tristogram;
  } {
    const start = performance.now();
    const tristogram = new Tristogram(pixelData, { algorithm });
    const end = performance.now();
    
    return {
      totalTime: end - start,
      tristogram
    };
  }

  /**
   * Run multiple iterations of benchmark for statistical reliability
   */
  static runBenchmarkIterations(
    pixelData: PixelData,
    algorithm: 'legacy' | 'single-pass',
    iterations: number,
    warmupRuns: number = 3
  ): BenchmarkResult {
    const imageSize = `${pixelData.width}x${pixelData.height}`;
    const results: Array<{
      totalTime: number;
      tristogram: Tristogram;
    }> = [];
    
    // Warmup runs to eliminate JIT compilation effects
    for (let i = 0; i < warmupRuns; i++) {
      this.benchmarkAlgorithm(pixelData, algorithm);
    }
    
    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const result = this.benchmarkAlgorithm(pixelData, algorithm);
      results.push(result);
    }
    
    // Calculate statistics from the last result (they should all be identical)
    const lastTristogram = results[results.length - 1].tristogram;
    const totalTimes = results.map(r => r.totalTime);
    
    const avgTotal = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
    
    return {
      imageSize,
      imageType: 'synthetic', // Will be set by caller
      algorithm,
      totalTime: avgTotal,
      phases: {
        pixelIteration: 0, // Not measured separately anymore
        resultProcessing: 0, // Not measured separately anymore
      },
      iterations,
      avgTime: avgTotal,
      minTime: Math.min(...totalTimes),
      maxTime: Math.max(...totalTimes),
      nonZeroCount: lastTristogram.nonZeroCount,
      maxValue: lastTristogram.maxValue,
    };
  }

  /**
   * Compare both algorithms on the same data
   */
  static compareAlgorithms(
    pixelData: PixelData,
    iterations: number = 5,
    warmupRuns: number = 3
  ): AlgorithmComparison {
    const imageSize = `${pixelData.width}x${pixelData.height}`;
    
    const legacyResult = this.runBenchmarkIterations(pixelData, 'legacy', iterations, warmupRuns);
    const singlePassResult = this.runBenchmarkIterations(pixelData, 'single-pass', iterations, warmupRuns);
    
    const speedup = legacyResult.totalTime / singlePassResult.totalTime;
    
    // Calculate memory improvement (legacy always uses 256^3 array, single-pass only uses actual colors)
    const legacyMemoryCells = 256 * 256 * 256;
    const singlePassMemoryCells = singlePassResult.nonZeroCount;
    const memoryReduction = ((legacyMemoryCells - singlePassMemoryCells) / legacyMemoryCells * 100).toFixed(1);
    
    return {
      imageSize,
      imageType: legacyResult.imageType,
      legacy: legacyResult,
      singlePass: singlePassResult,
      speedup,
      memoryImprovement: `${memoryReduction}% less memory usage`,
    };
  }

}