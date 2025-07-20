import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface PixelData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export class ImageSaver {
  private static tempDir: string | null = null;

  /**
   * Get or create the temp directory for benchmark images
   */
  static getTempDir(): string {
    if (this.tempDir) {
      return this.tempDir;
    }

    // Use temp directory under tristogram project
    this.tempDir = join(process.cwd(), 'temp', 'benchmark-images');
    
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
    
    console.log(`📁 Benchmark images will be saved to: ${this.tempDir}`);
    return this.tempDir;
  }

  /**
   * Save pixel data as PNG image using Sharp (Node.js only)
   */
  static async saveImage(
    pixelData: PixelData,
    filename: string,
    imageType: string
  ): Promise<string> {
    // Only save in Node.js environment
    if (typeof window !== 'undefined') {
      return '';
    }

    try {
      // Import sharp directly since we're in Node.js test environment
      const sharp = (await import('sharp')).default;

      const tempDir = this.getTempDir();
      const fullFilename = `${filename}_${imageType}_${pixelData.width}x${pixelData.height}.png`;
      const filepath = join(tempDir, fullFilename);

      // Convert RGBA data to RGB (Sharp expects RGB for PNG)
      const rgbData = new Uint8Array(pixelData.width * pixelData.height * 3);
      for (let i = 0; i < pixelData.width * pixelData.height; i++) {
        rgbData[i * 3] = pixelData.data[i * 4];     // R
        rgbData[i * 3 + 1] = pixelData.data[i * 4 + 1]; // G
        rgbData[i * 3 + 2] = pixelData.data[i * 4 + 2]; // B
        // Skip alpha channel
      }

      await sharp(rgbData, {
        raw: {
          width: pixelData.width,
          height: pixelData.height,
          channels: 3
        }
      })
      .png()
      .toFile(filepath);

      console.log(`💾 Saved: ${fullFilename}`);
      return filepath;
    } catch (error) {
      console.warn(`⚠️ Failed to save image ${filename}: ${(error as Error).message}`);
      return '';
    }
  }

  /**
   * Generate and save all benchmark test images
   */
  static async saveAllBenchmarkImages(): Promise<string[]> {
    if (typeof window !== 'undefined') {
      return [];
    }

    const { ImageGenerator } = await import('./imageGenerator');
    const savedPaths: string[] = [];

    const imageSizes = [
      { width: 50, height: 50 },
      { width: 100, height: 100 },
      { width: 200, height: 200 },
      { width: 500, height: 500 },
    ];

    const imageTypes = ['solid', 'gradient', 'noise'] as const;

    console.log('🎨 Generating and saving benchmark test images...');

    for (const imageType of imageTypes) {
      for (const { width, height } of imageSizes) {
        const pixelData = ImageGenerator.generateSyntheticImage(width, height, imageType);
        const savedPath = await this.saveImage(pixelData, 'benchmark', imageType);
        if (savedPath) {
          savedPaths.push(savedPath);
        }
      }
    }

    console.log(`✅ Generated ${savedPaths.length} benchmark images`);
    return savedPaths;
  }
}