/**
 * Tristogram Benchmark Utility - Main Entry Point
 * 
 * This module provides utilities for benchmarking the Tristogram constructor performance.
 * It can be used both in test suites and as a standalone utility for performance analysis.
 */

export { runBenchmarkSuite, DEFAULT_BENCHMARK_CONFIG } from './benchmarkRunner';
export { generateTestImage, ImageType } from './imageGenerator';
export { 
  saveSampleImage, 
  saveAllSampleImages, 
  createComparisonGrid, 
  analyzeImageTypes 
} from './sampleImageSaver';
export type {
  BenchmarkConfig,
  BenchmarkResult,
  BenchmarkSuite,
  PhaseTimings,
  StatisticalSummary,
} from './benchmarkTypes';
export type { ImageSize } from './imageGenerator';

/**
 * Convenience function to run a quick benchmark with default settings
 */
export async function runQuickBenchmark() {
  const { runBenchmarkSuite } = await import('./benchmarkRunner');
  
  const quickConfig = {
    imageSizes: [
      { width: 100, height: 100 },
      { width: 500, height: 500 },
    ],
    iterations: 5,
    warmupRuns: 2,
    imageTypes: [
      await import('./imageGenerator').then(m => m.ImageType.SOLID_COLOR),
      await import('./imageGenerator').then(m => m.ImageType.RANDOM_NOISE),
    ],
    enableMemoryMonitoring: false,
    enablePhaseTimings: true,
  };
  
  return runBenchmarkSuite(quickConfig);
}

/**
 * Exports benchmark results to JSON file (for Node.js environments)
 */
export function exportToJson(suite: any, filename = 'tristogram-benchmark-results.json'): string {
  const jsonString = JSON.stringify(suite, null, 2);
  
  // In browser environment, create downloadable blob
  if (typeof window !== 'undefined') {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  return jsonString;
}

/**
 * Formats benchmark results for console output
 */
export function formatResults(suite: any): string {
  let output = '\n=== Tristogram Constructor Benchmark Results ===\n';
  output += `Total execution time: ${suite.totalTime.toFixed(2)}ms\n`;
  output += `Test environment: ${suite.environment.platform}\n`;
  output += `Timestamp: ${suite.timestamp}\n\n`;

  // Group results by image size
  const resultsBySize = suite.results.reduce((acc: any, result: any) => {
    const sizeKey = `${result.imageSize.width}x${result.imageSize.height}`;
    if (!acc[sizeKey]) acc[sizeKey] = [];
    acc[sizeKey].push(result);
    return acc;
  }, {});

  Object.entries(resultsBySize).forEach(([size, results]: [string, any]) => {
    output += `\n--- ${size} Images ---\n`;
    
    results.forEach((result: any) => {
      output += `\n${result.imageType.toUpperCase()} (${result.iterations} iterations):\n`;
      output += `  Average: ${result.avgTime.toFixed(2)}ms\n`;
      output += `  Range: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms\n`;
      output += `  Std Dev: ${result.standardDeviation.toFixed(2)}ms\n`;
      
      if (result.phaseTimings) {
        output += `  Phase breakdown:\n`;
        output += `    Image extraction: ${result.phaseTimings.imageDataExtraction.toFixed(2)}ms\n`;
        output += `    Histogram building: ${result.phaseTimings.histogramBuilding.toFixed(2)}ms\n`;
        output += `    Result processing: ${result.phaseTimings.resultProcessing.toFixed(2)}ms\n`;
      }
    });
  });
  
  return output;
}