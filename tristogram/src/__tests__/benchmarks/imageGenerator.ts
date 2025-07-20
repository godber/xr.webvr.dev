/**
 * Utility functions for generating test images with controlled properties
 */

export interface ImageSize {
  width: number;
  height: number;
}

export enum ImageType {
  SOLID_COLOR = 'solid',
  GRADIENT = 'gradient',
  RANDOM_NOISE = 'noise',
  CHECKERBOARD = 'checkerboard'
}

/**
 * Creates a canvas and returns both canvas and context
 */
function createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

/**
 * Converts canvas to HTMLImageElement
 */
function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL();
  });
}

/**
 * Generates a solid color image
 */
export async function generateSolidColorImage(size: ImageSize, r = 128, g = 128, b = 128): Promise<HTMLImageElement> {
  const { canvas, ctx } = createCanvas(size.width, size.height);
  
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, size.width, size.height);
  
  return canvasToImage(canvas);
}

/**
 * Generates a linear gradient image (red to blue horizontally)
 */
export async function generateGradientImage(size: ImageSize): Promise<HTMLImageElement> {
  const { canvas, ctx } = createCanvas(size.width, size.height);
  
  const gradient = ctx.createLinearGradient(0, 0, size.width, 0);
  gradient.addColorStop(0, 'rgb(255, 0, 0)');
  gradient.addColorStop(0.5, 'rgb(0, 255, 0)');
  gradient.addColorStop(1, 'rgb(0, 0, 255)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size.width, size.height);
  
  return canvasToImage(canvas);
}

/**
 * Generates a random noise image with maximum color variety
 */
export async function generateRandomNoiseImage(size: ImageSize): Promise<HTMLImageElement> {
  const { canvas, ctx } = createCanvas(size.width, size.height);
  
  const imageData = ctx.createImageData(size.width, size.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(Math.random() * 256);     // R
    data[i + 1] = Math.floor(Math.random() * 256); // G
    data[i + 2] = Math.floor(Math.random() * 256); // B
    data[i + 3] = 255; // A
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvasToImage(canvas);
}

/**
 * Generates a checkerboard pattern with alternating colors
 */
export async function generateCheckerboardImage(size: ImageSize, squareSize = 20): Promise<HTMLImageElement> {
  const { canvas, ctx } = createCanvas(size.width, size.height);
  
  for (let x = 0; x < size.width; x += squareSize) {
    for (let y = 0; y < size.height; y += squareSize) {
      const isEven = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0;
      ctx.fillStyle = isEven ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
      ctx.fillRect(x, y, squareSize, squareSize);
    }
  }
  
  return canvasToImage(canvas);
}

/**
 * Generates a test image based on type and size
 */
export async function generateTestImage(type: ImageType, size: ImageSize): Promise<HTMLImageElement> {
  switch (type) {
    case ImageType.SOLID_COLOR:
      return generateSolidColorImage(size);
    case ImageType.GRADIENT:
      return generateGradientImage(size);
    case ImageType.RANDOM_NOISE:
      return generateRandomNoiseImage(size);
    case ImageType.CHECKERBOARD:
      return generateCheckerboardImage(size);
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}