import { vi } from 'vitest';

// Mock sharp module for tests since it's a Node.js-only dependency
vi.mock('sharp', () => ({
  default: vi.fn(),
}));