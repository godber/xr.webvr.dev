/**
 * Utility for saving sample test images to verify visual correctness
 */

import { generateTestImage, ImageSize, ImageType } from './imageGenerator';

/**
 * Downloads an image as a file in the browser
 */
function downloadImage(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts HTMLImageElement to canvas for saving
 */
function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  
  return canvas;
}

/**
 * Saves a single test image sample
 */
export async function saveSampleImage(
  imageType: ImageType, 
  size: ImageSize, 
  outputDir = 'sample-images'
): Promise<void> {
  try {
    const image = await generateTestImage(imageType, size);
    const canvas = imageToCanvas(image);
    
    const filename = `${outputDir}/sample-${imageType}-${size.width}x${size.height}.png`;
    
    // In browser environment, trigger download
    if (typeof window !== 'undefined') {
      downloadImage(canvas, filename);
      console.log(`Sample image saved: ${filename}`);
    } else {
      console.log(`Sample image would be saved as: ${filename} (browser environment required)`);
    }
  } catch (error) {
    console.error(`Failed to save sample image for ${imageType} ${size.width}x${size.height}:`, error);
  }
}

/**
 * Saves all sample test images for verification
 */
export async function saveAllSampleImages(outputDir = 'sample-images'): Promise<void> {
  console.log('Generating sample test images for verification...');
  
  const sampleSize: ImageSize = { width: 200, height: 200 };
  const imageTypes = [
    ImageType.SOLID_COLOR,
    ImageType.GRADIENT,
    ImageType.RANDOM_NOISE,
    ImageType.CHECKERBOARD
  ];
  
  for (const imageType of imageTypes) {
    await saveSampleImage(imageType, sampleSize, outputDir);
    // Small delay between saves to avoid overwhelming the browser
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('Sample image generation complete!');
}

/**
 * Creates a visual comparison grid of all image types
 */
export async function createComparisonGrid(size: ImageSize = { width: 150, height: 150 }): Promise<void> {
  console.log('Creating comparison grid of test images...');
  
  const imageTypes = [
    ImageType.SOLID_COLOR,
    ImageType.GRADIENT, 
    ImageType.RANDOM_NOISE,
    ImageType.CHECKERBOARD
  ];
  
  // Create a large canvas to hold all images
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = size.width * 2; // 2x2 grid
  gridCanvas.height = size.height * 2;
  const gridCtx = gridCanvas.getContext('2d')!;
  
  // Add labels and borders
  gridCtx.fillStyle = '#f0f0f0';
  gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
  
  gridCtx.strokeStyle = '#000000';
  gridCtx.lineWidth = 2;
  
  const positions = [
    { x: 0, y: 0, label: 'Solid Color' },
    { x: size.width, y: 0, label: 'Gradient' },
    { x: 0, y: size.height, label: 'Random Noise' },
    { x: size.width, y: size.height, label: 'Checkerboard' }
  ];
  
  for (let i = 0; i < imageTypes.length; i++) {
    const imageType = imageTypes[i];
    const pos = positions[i];
    
    try {
      const image = await generateTestImage(imageType, size);
      const canvas = imageToCanvas(image);
      
      // Draw the image onto the grid
      gridCtx.drawImage(canvas, pos.x, pos.y);
      
      // Add border
      gridCtx.strokeRect(pos.x, pos.y, size.width, size.height);
      
      // Add label
      gridCtx.fillStyle = '#000000';
      gridCtx.font = '14px Arial';
      gridCtx.fillText(pos.label, pos.x + 5, pos.y + 20);
      
    } catch (error) {
      console.error(`Failed to generate ${imageType} for grid:`, error);
      
      // Draw error indicator
      gridCtx.fillStyle = '#ff0000';
      gridCtx.fillRect(pos.x, pos.y, size.width, size.height);
      gridCtx.fillStyle = '#ffffff';
      gridCtx.fillText('ERROR', pos.x + size.width/2 - 20, pos.y + size.height/2);
    }
  }
  
  // Download the comparison grid
  if (typeof window !== 'undefined') {
    downloadImage(gridCanvas, 'test-images-comparison-grid.png');
    console.log('Comparison grid saved as: test-images-comparison-grid.png');
  }
}

/**
 * Displays image generation statistics
 */
export async function analyzeImageTypes(): Promise<void> {
  console.log('\n=== Test Image Analysis ===');
  
  const testSize: ImageSize = { width: 100, height: 100 };
  const imageTypes = [ImageType.SOLID_COLOR, ImageType.GRADIENT, ImageType.RANDOM_NOISE, ImageType.CHECKERBOARD];
  
  for (const imageType of imageTypes) {
    try {
      const startTime = performance.now();
      const image = await generateTestImage(imageType, testSize);
      const endTime = performance.now();
      
      console.log(`${imageType.toUpperCase()}:`);
      console.log(`  Generation time: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`  Dimensions: ${image.width}x${image.height}`);
      console.log(`  Expected unique colors: ${getExpectedColorCount(imageType, testSize)}`);
      
    } catch (error) {
      console.error(`Failed to analyze ${imageType}:`, error);
    }
  }
}

/**
 * Estimates expected number of unique colors for each image type
 */
function getExpectedColorCount(imageType: ImageType, size: ImageSize): string {
  const totalPixels = size.width * size.height;
  
  switch (imageType) {
    case ImageType.SOLID_COLOR:
      return '1 (single color)';
    case ImageType.GRADIENT:
      return `~${Math.min(size.width, 256)} (gradient steps)`;
    case ImageType.RANDOM_NOISE:
      return `~${Math.min(totalPixels, 16777216)} (up to 24-bit color space)`;
    case ImageType.CHECKERBOARD:
      return '2 (black and white)';
    default:
      return 'Unknown';
  }
}