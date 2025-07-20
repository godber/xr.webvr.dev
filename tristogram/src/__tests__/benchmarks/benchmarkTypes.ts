/**
 * Type definitions for the Tristogram benchmark utility
 */

import { ImageSize, ImageType } from './imageGenerator';

export interface BenchmarkConfig {
  /** Array of image sizes to test */
  imageSizes: ImageSize[];
  /** Number of iterations per test for statistical reliability */
  iterations: number;
  /** Number of warmup runs to eliminate JIT compilation effects */
  warmupRuns: number;
  /** Types of test images to generate */
  imageTypes: ImageType[];
  /** Whether to enable memory monitoring (if available) */
  enableMemoryMonitoring: boolean;
  /** Whether to enable detailed phase timing */
  enablePhaseTimings: boolean;
}

export interface PhaseTimings {
  /** Time spent extracting image data from HTMLImageElement */
  imageDataExtraction: number;
  /** Time spent building the 3D histogram */
  histogramBuilding: number;
  /** Time spent processing results (finding non-zero values, creating arrays) */
  resultProcessing: number;
}

export interface BenchmarkResult {
  /** Description of the test case (e.g., "1000x1000 gradient") */
  testCase: string;
  /** Image size information */
  imageSize: ImageSize;
  /** Type of test image */
  imageType: ImageType;
  /** Average time across all iterations (ms) */
  avgTime: number;
  /** Minimum time observed (ms) */
  minTime: number;
  /** Maximum time observed (ms) */
  maxTime: number;
  /** Standard deviation of timing measurements */
  standardDeviation: number;
  /** Memory usage if monitoring is enabled (bytes) */
  memoryUsage?: number;
  /** Detailed phase timings if enabled */
  phaseTimings?: PhaseTimings;
  /** Raw timing data for all iterations */
  rawTimings: number[];
  /** Number of iterations performed */
  iterations: number;
  /** Histogram statistics */
  histogramStats: {
    /** Number of non-zero histogram bins */
    nonZeroCount: number;
    /** Maximum value in any histogram bin */
    maxValue: number;
    /** Total number of pixels processed */
    totalPixels: number;
  };
}

export interface BenchmarkSuite {
  /** Configuration used for this benchmark suite */
  config: BenchmarkConfig;
  /** Array of all benchmark results */
  results: BenchmarkResult[];
  /** Total time for the entire benchmark suite */
  totalTime: number;
  /** Timestamp when benchmark was run */
  timestamp: string;
  /** Browser/environment information */
  environment: {
    userAgent: string;
    platform: string;
    memorySupported: boolean;
  };
}

export interface StatisticalSummary {
  /** Mean of the values */
  mean: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** 95th percentile */
  p95: number;
  /** Coefficient of variation (std dev / mean) */
  coefficientOfVariation: number;
}