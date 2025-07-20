interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface BenchmarkResult {
  imageSize: string;
  imageType: string;
  totalTime: number;
  phases: {
    pixelIteration: number;
    resultProcessing: number;
  };
  iterations: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
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
   * Benchmark the core phases of Tristogram construction
   */
  static benchmarkConstructorPhases(pixelData: PixelData): {
    pixelIteration: number;
    resultProcessing: number;
    totalTime: number;
  } {
    const startTotal = performance.now();
    
    // Initialize data structures (minimal overhead)
    const tristogram = Array(256).fill(null).map(
      () => Array(256).fill(null).map(
        () => Array(256).fill(0),
      ),
    );
    
    // Phase 1: Pixel iteration and histogram population (lines 46-51)
    const startPixelIteration = performance.now();
    
    for (let x = 0; x < pixelData.width; x++) {
      for (let y = 0; y < pixelData.height; y++) {
        const p = this.getPixel(pixelData, x, y);
        tristogram[p.r][p.g][p.b] += 1;
      }
    }
    
    const endPixelIteration = performance.now();
    const pixelIterationTime = endPixelIteration - startPixelIteration;
    
    // Phase 2: Result processing (lines 53-67)
    const startResultProcessing = performance.now();
    
    let maxValue = 0;
    const positions: number[] = [];
    const values: number[] = [];
    
    for (let r = 0; r < tristogram.length; r++) {
      for (let g = 0; g < tristogram[r].length; g++) {
        for (let b = 0; b < tristogram[r][g].length; b++) {
          if (tristogram[r][g][b] !== 0) {
            if (tristogram[r][g][b] > maxValue) {
              maxValue = tristogram[r][g][b];
            }
            positions.push(r, g, b);
            values.push(tristogram[r][g][b]);
          }
        }
      }
    }
    
    // Convert to typed arrays (part of result processing)
    const colors = new Float32Array(values.length * 4);
    for (let i = 0; i < values.length; i += 1) {
      const t = values[i] / maxValue;
      colors[4 * i] = 1;
      colors[4 * i + 1] = 1;
      colors[4 * i + 2] = 1;
      colors[4 * i + 3] = t;
    }
    
    const endResultProcessing = performance.now();
    const resultProcessingTime = endResultProcessing - startResultProcessing;
    
    const endTotal = performance.now();
    const totalTime = endTotal - startTotal;
    
    return {
      pixelIteration: pixelIterationTime,
      resultProcessing: resultProcessingTime,
      totalTime,
    };
  }

  /**
   * Run multiple iterations of benchmark for statistical reliability
   */
  static runBenchmarkIterations(
    pixelData: PixelData,
    iterations: number,
    warmupRuns: number = 3
  ): BenchmarkResult {
    const imageSize = `${pixelData.width}x${pixelData.height}`;
    const results: Array<{
      pixelIteration: number;
      resultProcessing: number;
      totalTime: number;
    }> = [];
    
    // Warmup runs to eliminate JIT compilation effects
    for (let i = 0; i < warmupRuns; i++) {
      this.benchmarkConstructorPhases(pixelData);
    }
    
    // Actual benchmark runs
    for (let i = 0; i < iterations; i++) {
      const result = this.benchmarkConstructorPhases(pixelData);
      results.push(result);
    }
    
    // Calculate statistics
    const totalTimes = results.map(r => r.totalTime);
    const pixelIterationTimes = results.map(r => r.pixelIteration);
    const resultProcessingTimes = results.map(r => r.resultProcessing);
    
    const avgTotal = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
    const avgPixelIteration = pixelIterationTimes.reduce((a, b) => a + b, 0) / pixelIterationTimes.length;
    const avgResultProcessing = resultProcessingTimes.reduce((a, b) => a + b, 0) / resultProcessingTimes.length;
    
    return {
      imageSize,
      imageType: 'synthetic', // Will be set by caller
      totalTime: avgTotal,
      phases: {
        pixelIteration: avgPixelIteration,
        resultProcessing: avgResultProcessing,
      },
      iterations,
      avgTime: avgTotal,
      minTime: Math.min(...totalTimes),
      maxTime: Math.max(...totalTimes),
    };
  }

  /**
   * Helper method to get pixel color (matches Tristogram.getPixel)
   */
  private static getPixel(imageData: PixelData, x: number, y: number): PixelColor {
    const position = (x + imageData.width * y) * 4;
    const { data } = imageData;
    return {
      r: data[position],
      g: data[position + 1],
      b: data[position + 2],
      a: data[position + 3],
    };
  }
}