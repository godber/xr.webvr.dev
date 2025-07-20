/**
 * Core benchmark runner for Tristogram constructor performance testing
 */

import Tristogram from '../../Tristogram';
import { generateTestImage, ImageSize, ImageType } from './imageGenerator';
import { generateMockTestImage } from './mockImageGenerator';
import { saveSampleImage } from './sampleImageSaver';
import {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkSuite,
  PhaseTimings,
  StatisticalSummary,
} from './benchmarkTypes';

/**
 * Calculates statistical summary from an array of numbers
 */
function calculateStatistics(values: number[]): StatisticalSummary {
  const sorted = [...values].sort((a, b) => a - b);
  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  
  const p95Index = Math.floor(0.95 * n);
  const p95 = sorted[p95Index] || sorted[n - 1];
  
  return {
    mean,
    standardDeviation,
    min: sorted[0],
    max: sorted[n - 1],
    p95,
    coefficientOfVariation: standardDeviation / mean,
  };
}

/**
 * Attempts to measure memory usage (experimental)
 */
async function measureMemory(): Promise<number | undefined> {
  try {
    // @ts-expect-error - experimental API not in TypeScript definitions
    if ('measureUserAgentSpecificMemory' in performance) {
      // @ts-expect-error - experimental API not in TypeScript definitions
      const memInfo = await performance.measureUserAgentSpecificMemory();
      return memInfo.bytes;
    }
  } catch {
    // Memory measurement not available or failed
  }
  return undefined;
}

/**
 * Performs warmup runs to eliminate JIT compilation effects
 */
async function performWarmup(image: HTMLImageElement, warmupRuns: number): Promise<void> {
  for (let i = 0; i < warmupRuns; i++) {
    new Tristogram(image);
  }
}

/**
 * Runs a single benchmark test case
 */
async function runSingleBenchmark(
  imageSize: ImageSize,
  imageType: ImageType,
  config: BenchmarkConfig,
): Promise<BenchmarkResult> {
  const testCase = `${imageSize.width}x${imageSize.height} ${imageType}`;
  console.log(`Running benchmark: ${testCase}`);
  
  // Generate test image (use mock version in test environment)
  const image = typeof window === 'undefined' || typeof document === 'undefined' 
    ? await generateMockTestImage(imageType, imageSize)
    : await generateTestImage(imageType, imageSize);
  
  // Perform warmup
  await performWarmup(image, config.warmupRuns);
  
  const timings: number[] = [];
  const phaseTimings: PhaseTimings[] = [];
  let histogramStats: any;
  
  // Run benchmark iterations
  for (let i = 0; i < config.iterations; i++) {
    let currentPhaseTimings: PhaseTimings | undefined;
    
    const startTime = performance.now();
    
    if (config.enablePhaseTimings) {
      // Detailed timing measurement
      const imageDataStart = performance.now();
      const imageData = Tristogram.getImageData(image);
      const imageDataEnd = performance.now();
      
      const histogramStart = performance.now();
      const tristogram = Array(256).fill().map(
        () => Array(256).fill().map(
          () => Array(256).fill(0),
        ),
      );
      
      for (let x = 0; x < imageData.width; x++) {
        for (let y = 0; y < imageData.height; y++) {
          const p = Tristogram.getPixel(imageData, x, y);
          tristogram[p.r][p.g][p.b] += 1;
        }
      }
      const histogramEnd = performance.now();
      
      const processingStart = performance.now();
      let nonZeroCount = 0;
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
              nonZeroCount++;
              positions.push(r, g, b);
              values.push(tristogram[r][g][b]);
            }
          }
        }
      }
      
      new Float32Array(positions); // Convert positions to Float32Array
      const colors = new Float32Array(values.length * 4);
      for (let j = 0; j < values.length; j += 1) {
        const t = values[j] / maxValue;
        colors[4 * j] = 1;
        colors[4 * j + 1] = 1;
        colors[4 * j + 2] = 1;
        colors[4 * j + 3] = t;
      }
      const processingEnd = performance.now();
      
      currentPhaseTimings = {
        imageDataExtraction: imageDataEnd - imageDataStart,
        histogramBuilding: histogramEnd - histogramStart,
        resultProcessing: processingEnd - processingStart,
      };
      
      histogramStats = {
        nonZeroCount,
        maxValue,
        totalPixels: image.width * image.height,
      };
    } else {
      // Simple timing measurement
      const tristogram = new Tristogram(image);
      histogramStats = {
        nonZeroCount: tristogram.nonZeroCount,
        maxValue: tristogram.maxValue,
        totalPixels: image.width * image.height,
      };
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    timings.push(duration);
    if (currentPhaseTimings) {
      phaseTimings.push(currentPhaseTimings);
    }
  }
  
  // Calculate statistics
  const stats = calculateStatistics(timings);
  
  // Measure memory if enabled
  let memoryUsage: number | undefined;
  if (config.enableMemoryMonitoring) {
    memoryUsage = await measureMemory();
  }
  
  // Calculate average phase timings if enabled
  let avgPhaseTimings: PhaseTimings | undefined;
  if (config.enablePhaseTimings && phaseTimings.length > 0) {
    avgPhaseTimings = {
      imageDataExtraction: phaseTimings.reduce((sum, pt) => sum + pt.imageDataExtraction, 0) / phaseTimings.length,
      histogramBuilding: phaseTimings.reduce((sum, pt) => sum + pt.histogramBuilding, 0) / phaseTimings.length,
      resultProcessing: phaseTimings.reduce((sum, pt) => sum + pt.resultProcessing, 0) / phaseTimings.length,
    };
  }
  
  return {
    testCase,
    imageSize,
    imageType,
    avgTime: stats.mean,
    minTime: stats.min,
    maxTime: stats.max,
    standardDeviation: stats.standardDeviation,
    memoryUsage,
    phaseTimings: avgPhaseTimings,
    rawTimings: timings,
    iterations: config.iterations,
    histogramStats,
  };
}

/**
 * Runs the complete benchmark suite
 */
export async function runBenchmarkSuite(config: BenchmarkConfig): Promise<BenchmarkSuite> {
  const startTime = performance.now();
  const results: BenchmarkResult[] = [];
  
  console.log('Starting Tristogram constructor benchmark suite...');
  console.log(`Configuration: ${config.iterations} iterations, ${config.warmupRuns} warmup runs`);
  
  // Save sample images if requested (only in browser environment)
  if (config.saveSampleImages && typeof window !== 'undefined') {
    console.log('Saving sample images for verification...');
    const sampleSize = { width: 200, height: 200 };
    const savedTypes = new Set<ImageType>();
    
    for (const imageType of config.imageTypes) {
      if (!savedTypes.has(imageType)) {
        try {
          await saveSampleImage(imageType, sampleSize, config.sampleImageDir);
          savedTypes.add(imageType);
        } catch (error) {
          console.warn(`Failed to save sample image for ${imageType}:`, error);
        }
      }
    }
  }
  
  // Run benchmarks for all combinations of sizes and types
  for (const imageSize of config.imageSizes) {
    for (const imageType of config.imageTypes) {
      const result = await runSingleBenchmark(imageSize, imageType, config);
      results.push(result);
    }
  }
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  // Gather environment information
  const environment = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    memorySupported: 'measureUserAgentSpecificMemory' in performance,
  };
  
  const suite: BenchmarkSuite = {
    config,
    results,
    totalTime,
    timestamp: new Date().toISOString(),
    environment,
  };
  
  console.log(`Benchmark suite completed in ${totalTime.toFixed(2)}ms`);
  return suite;
}

/**
 * Default benchmark configuration
 */
export const DEFAULT_BENCHMARK_CONFIG: BenchmarkConfig = {
  imageSizes: [
    { width: 100, height: 100 },
    { width: 500, height: 500 },
    { width: 1000, height: 1000 },
    { width: 2000, height: 2000 },
  ],
  iterations: 10,
  warmupRuns: 3,
  imageTypes: [ImageType.SOLID_COLOR, ImageType.GRADIENT, ImageType.RANDOM_NOISE, ImageType.CHECKERBOARD],
  enableMemoryMonitoring: true,
  enablePhaseTimings: true,
  saveSampleImages: false,
  sampleImageDir: 'tristogram-samples',
};