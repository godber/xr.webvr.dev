// Simple Node.js benchmark runner
// Run with: node src/__tests__/benchmarks/runNodeBenchmark.js

import { ImageGenerator } from './imageGenerator.js';
import { TristogramBenchmark } from './benchmarkUtils.js';

console.log('🚀 Running Tristogram Constructor Benchmarks - Node.js Environment');
console.log('');

const benchmarkConfig = {
  imageSizes: [
    { width: 50, height: 50 },    // 2.5K pixels
    { width: 100, height: 100 },  // 10K pixels
    { width: 200, height: 200 },  // 40K pixels
    { width: 500, height: 500 },  // 250K pixels
  ],
  imageTypes: ['solid', 'gradient', 'noise'],
  iterations: 5,
  warmupRuns: 2,
};

async function runBenchmarks() {
  console.log('Environment check:');
  console.log(`- typeof window: ${typeof window}`);
  console.log(`- Node.js version: ${process.version}`);
  console.log('');

  const results = [];

  for (const imageType of benchmarkConfig.imageTypes) {
    console.log(`📊 Testing ${imageType} images:`);
    console.log('');

    for (const { width, height } of benchmarkConfig.imageSizes) {
      // Generate test image
      const pixelData = ImageGenerator.generateSyntheticImage(width, height, imageType);
      
      // Run benchmark
      const result = TristogramBenchmark.runBenchmarkIterations(
        pixelData,
        benchmarkConfig.iterations,
        benchmarkConfig.warmupRuns
      );
      
      result.imageType = imageType;
      results.push(result);
      
      // Log results
      console.log(`   ${width}x${height} ${imageType}:`);
      console.log(`     Total Time: ${result.totalTime.toFixed(3)}ms (avg)`);
      console.log(`     Pixel Iteration: ${result.phases.pixelIteration.toFixed(3)}ms`);
      console.log(`     Result Processing: ${result.phases.resultProcessing.toFixed(3)}ms`);
      console.log(`     Range: ${result.minTime.toFixed(3)}ms - ${result.maxTime.toFixed(3)}ms`);
      console.log('');
    }
  }

  // Performance scaling analysis
  console.log('📈 Node.js Performance Scaling Analysis (gradient images):');
  console.log('Size\t\tPixels\t\tTotal(ms)\tPixel Iter(ms)\tResult Proc(ms)');
  console.log('─'.repeat(80));

  const gradientResults = results.filter(r => r.imageType === 'gradient');
  gradientResults.forEach((result) => {
    const [width, height] = result.imageSize.split('x').map(Number);
    const pixels = width * height;
    console.log(
      `${result.imageSize}\t\t${pixels.toLocaleString()}\t\t` +
      `${result.totalTime.toFixed(2)}\t\t${result.phases.pixelIteration.toFixed(2)}\t\t` +
      `${result.phases.resultProcessing.toFixed(2)}`
    );
  });

  console.log('');
  console.log('✅ Node.js benchmarks completed successfully!');
}

// Check if running in Node.js
if (typeof window === 'undefined') {
  runBenchmarks().catch(console.error);
} else {
  console.log('This script is designed to run in Node.js environment');
}