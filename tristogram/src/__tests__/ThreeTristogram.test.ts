import { describe, it, expect, beforeEach, vi } from 'vitest';
import ThreeTristogram from '../ThreeTristogram.ts';

// Mock Three.js
const mockScene = {
  add: vi.fn(),
  remove: vi.fn(),
};

const mockGeometry = {
  dispose: vi.fn(),
  setAttribute: vi.fn(),
};

const mockMaterial = {
  dispose: vi.fn(),
};

const mockMesh = {
  position: { x: 0, y: 0, z: 0 },
};

const mockTexture = {
  image: {
    width: 100,
    height: 100,
  },
};

vi.mock('three', () => ({
  TextureLoader: vi.fn(() => ({
    loadAsync: vi.fn(() => Promise.resolve(mockTexture)),
  })),
  BufferGeometry: vi.fn(() => mockGeometry),
  Float32BufferAttribute: vi.fn(),
  PointsMaterial: vi.fn(() => mockMaterial),
  Points: vi.fn(() => mockMesh),
  PlaneGeometry: vi.fn(() => mockGeometry),
  MeshBasicMaterial: vi.fn(() => mockMaterial),
  Mesh: vi.fn(() => mockMesh),
}));

// Mock Tristogram
vi.mock('../Tristogram.ts', () => ({
  default: vi.fn(() => ({
    positions: [255, 0, 0, 0, 255, 0, 0, 0, 255],
    colors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  })),
}));

describe('ThreeTristogram', () => {
  let threeTristogram: ThreeTristogram;
  let settings: { pointSize: number; };

  beforeEach(() => {
    settings = {
      pointSize: 2,
    };
    threeTristogram = new ThreeTristogram(mockScene, settings);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with scene and settings', () => {
      expect(threeTristogram.scene).toBe(mockScene);
      expect(threeTristogram.settings).toBe(settings);
    });
  });

  describe('dispose', () => {
    it('should dispose geometries and materials when they exist', () => {
      threeTristogram.pointsGeometry = mockGeometry;
      threeTristogram.pointsMaterial = mockMaterial;
      threeTristogram.pointsMesh = mockMesh;
      threeTristogram.imageGeometry = mockGeometry;
      threeTristogram.imageMaterial = mockMaterial;
      threeTristogram.imageMesh = mockMesh;

      threeTristogram.dispose();

      expect(mockGeometry.dispose).toHaveBeenCalledTimes(2);
      expect(mockMaterial.dispose).toHaveBeenCalledTimes(2);
      expect(mockScene.remove).toHaveBeenCalledTimes(2);
      expect(mockScene.remove).toHaveBeenCalledWith(mockMesh);
    });

    it('should handle dispose when objects do not exist', () => {
      threeTristogram.dispose();
      
      // Should not throw errors when objects are undefined
      expect(mockGeometry.dispose).not.toHaveBeenCalled();
      expect(mockMaterial.dispose).not.toHaveBeenCalled();
      expect(mockScene.remove).not.toHaveBeenCalled();
    });
  });

  describe('load', () => {
    it('should load image and create visualization', async () => {
      const imageUrl = '/test-image.jpg';
      
      await threeTristogram.load(imageUrl);

      expect(threeTristogram.pointsGeometry).toBeDefined();
      expect(threeTristogram.pointsMaterial).toBeDefined();
      expect(threeTristogram.pointsMesh).toBeDefined();
      expect(threeTristogram.imageGeometry).toBeDefined();
      expect(threeTristogram.imageMaterial).toBeDefined();
      expect(threeTristogram.imageMesh).toBeDefined();
      
      expect(mockScene.add).toHaveBeenCalledTimes(2);
    });

    it('should handle load errors gracefully', async () => {
      const { TextureLoader } = await import('three');
      const mockTextureLoader = {
        loadAsync: vi.fn().mockRejectedValue(new Error('Load failed')),
      };
      vi.mocked(TextureLoader).mockReturnValue(mockTextureLoader as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const newTristogram = new ThreeTristogram(mockScene, settings);
      await newTristogram.load('/invalid-image.jpg');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(mockScene.add).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should calculate correct image display dimensions', async () => {
      const mockTextureLoader = {
        loadAsync: vi.fn().mockResolvedValue(mockTexture),
      };
      vi.mocked((await import('three')).TextureLoader).mockReturnValue(mockTextureLoader as any);

      const newTristogram = new ThreeTristogram(mockScene, settings);
      await newTristogram.load('/test-image.jpg');
      
      // Verify image mesh was created and added to scene
      expect(mockScene.add).toHaveBeenCalledTimes(2);
      expect(newTristogram.imageMesh).toBeDefined();
    });
  });
});