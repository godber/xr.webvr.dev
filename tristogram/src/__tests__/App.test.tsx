import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.tsx';

// Mock Three.js modules
vi.mock('three', () => ({
  TextureLoader: vi.fn(() => ({
    load: vi.fn(),
    loadAsync: vi.fn(),
  })),
  Color: vi.fn(),
  BufferGeometry: vi.fn(() => ({
    setAttribute: vi.fn(),
  })),
  Float32BufferAttribute: vi.fn(),
  PointsMaterial: vi.fn(),
  Points: vi.fn(),
  PlaneGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn(),
  Mesh: vi.fn(),
}));

// Mock React Three Fiber Canvas
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: () => ({
    scene: {
      background: null,
      add: vi.fn(),
      remove: vi.fn(),
    },
  }),
  extend: vi.fn(),
}));

// Mock React Three Drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
}));

// Mock Leva
vi.mock('leva', () => ({
  useControls: () => ({
    image: '/images/wallaby_746_600x450.jpg',
    pointSize: 1,
    background: '#111111',
  }),
}));

// Mock Tristogram
vi.mock('../Tristogram.ts', () => ({
  default: vi.fn(() => ({
    positions: [255, 0, 0, 0, 255, 0, 0, 0, 255],
    colors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    nonZeroCount: 3,
    maxValue: 1,
  })),
}));

describe('App', () => {
  it('should render the main application interface', () => {
    render(<App />);
    
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop an image to analyze its color histogram')).toBeInTheDocument();
  });

  it('should have correct styling for the container', () => {
    render(<App />);
    
    const container = screen.getByTestId('canvas').parentElement;
    expect(container).toHaveStyle({
      width: '100vw',
      height: '100vh',
      margin: '0',
      padding: '0',
    });
  });

  it('should display instruction text', () => {
    render(<App />);
    
    const instructionText = screen.getByText('Drag and drop an image to analyze its color histogram');
    expect(instructionText).toBeInTheDocument();
  });
});