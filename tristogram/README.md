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