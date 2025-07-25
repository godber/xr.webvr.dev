# Tristogram

A 3D color histogram visualization tool built with React Three Fiber that creates interactive point clouds representing color distribution in images.

## Features

- **3D Color Space Visualization**: Displays colors as points in a 3D RGB cube (256x256x256)
- **React Three Fiber Integration**: Modern React declarative 3D scene composition
- **Interactive Controls**: Rotate, zoom, and pan around the color histogram using OrbitControls
- **Multiple Image Support**: Built-in gallery of test images plus drag-and-drop support
- **Real-time Adjustments**: Modify point size and background color using Leva GUI controls
- **Source Image Display**: Shows the original image alongside the 3D histogram
- **Component-based Architecture**: Clean React components with proper state management

## How It Works

The tristogram analyzes each pixel in an image and maps it to a 3D coordinate system where:

- X-axis represents Red values (0-255)
- Y-axis represents Green values (0-255) 
- Z-axis represents Blue values (0-255)

Each point's opacity corresponds to how frequently that color appears in the image.

## Usage

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Build for production**:

   ```bash
   npm run build
   ```

## Testing & Benchmarks

The project includes comprehensive test suites and performance benchmarks:

### **Running Tests**

```bash
npm run test          # Run all tests
npm run test:coverage # Run tests with coverage report
npm run test:ui       # Run tests with interactive UI
```

### **Performance Benchmarks**

The Tristogram constructor has detailed performance benchmarks that measure the core computation phases:

- **Pixel Iteration Phase**: Measures time to process image pixels and build 3D histogram
- **Result Processing Phase**: Measures time to process the 256³ color space and generate output arrays

#### **Browser Environment Benchmarks**

```bash
npm run test:bench:browser
```

Runs benchmarks in browser environment (jsdom) testing different image types and sizes:

- **Image Types**: solid, gradient, noise (varying color complexity)
- **Image Sizes**: 50×50, 100×100, 200×200, 500×500 pixels
- **Output**: Detailed timing for each phase with scaling analysis

#### **Node.js Environment Benchmarks**

```bash
npm run test:bench:node
```

Runs benchmarks in genuine Node.js environment (not browser simulation) with the same test scenarios. Uses a separate vitest configuration that runs in Node.js environment without browser-specific setup.

**Image Generation**: Node.js benchmarks automatically generate and save all test images to `tristogram/temp/benchmark-images/` directory for visual inspection. Images include:

- `benchmark_[type]_[size].png` - Generated during test setup
- `test_[size]_[type]_[size].png` - Generated during individual tests

The temp directory is excluded from git via `.gitignore`.

#### **Benchmark Results**

Example browser benchmark output:

```text
📊 Browser Benchmark Results - gradient 500x500:
   Total Time: 65.163ms (avg)
   Pixel Iteration: 3.991ms
   Result Processing: 35.829ms
   Range: 57.370ms - 77.141ms
   Iterations: 5

📈 Browser Performance Scaling Analysis:
Size        Pixels      Total(ms)   Pixel Iter(ms)  Result Proc(ms)
────────────────────────────────────────────────────────────────────
50x50       2,500       54.82       0.11            29.84
100x100     10,000      52.38       0.35            30.30
200x200     40,000      55.67       1.27            31.85
500x500     250,000     62.86       3.62            33.42
```

Example Node.js benchmark output:

```text
📊 Node.js Benchmark Results - gradient 500x500:
   Total Time: 63.954ms (avg)
   Pixel Iteration: 3.880ms
   Result Processing: 37.664ms
   Range: 57.345ms - 72.710ms
   Iterations: 5

📈 Node.js Performance Scaling Analysis:
Size        Pixels      Total(ms)   Pixel Iter(ms)  Result Proc(ms)
────────────────────────────────────────────────────────────────────
50x50       2,500       55.47       0.11            30.39
100x100     10,000      55.97       0.33            30.29
200x200     40,000      58.54       1.25            32.17
500x500     250,000     62.25       3.35            33.46
```

The benchmarks show that:

- **Pixel iteration** scales linearly with image size in both environments
- **Result processing** remains relatively constant (~30-35ms) since it processes the fixed 256³ color space
- **Node.js vs Browser** performance is very similar, with Node.js being slightly faster in some cases
- **Noise images** take longer than gradients due to higher color variety

## Controls

- **Mouse**: Orbit around the visualization (via OrbitControls)
- **Scroll**: Zoom in/out
- **Leva GUI Panel**: Change images, adjust point size, and background color
- **Drag & Drop**: Drop image files directly onto the canvas to analyze new images

## Dependencies

- **React**: UI library for component-based architecture
- **React Three Fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers for React Three Fiber (OrbitControls)
- **Three.js**: 3D graphics rendering engine
- **Leva**: Modern React-based GUI controls
- **Vite**: Build tool and development server with React support

## Architecture

The application consists of several key components:

- **App.jsx**: Main React component with Canvas setup and drag-and-drop handling
- **TristogramVisualization**: React Three Fiber component managing the 3D scene
- **Tristogram.js**: Core color analysis class (unchanged from original)
- **ThreeTristogram.js**: Legacy Three.js class (deprecated, kept for reference)

## Original Source

Extracted and refactored from the xr.webvr.dev examples (ex7) and converted from vanilla Three.js to React Three Fiber with modern React patterns, improved state management, and comprehensive JSDoc documentation.
