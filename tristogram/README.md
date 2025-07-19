# Tristogram

A 3D color histogram visualization tool that creates interactive point clouds representing color distribution in images.

## Features

- **3D Color Space Visualization**: Displays colors as points in a 3D RGB cube (256x256x256)
- **Interactive Controls**: Rotate, zoom, and pan around the color histogram
- **Multiple Image Support**: Built-in gallery of test images plus drag-and-drop support
- **Real-time Adjustments**: Modify point size and background color on the fly
- **Source Image Display**: Shows the original image alongside the 3D histogram

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

- **Mouse**: Orbit around the visualization
- **Scroll**: Zoom in/out
- **GUI Panel**: Change images, adjust point size, and background color
- **Drag & Drop**: Drop image files directly onto the canvas

## Dependencies

- **Three.js**: 3D graphics rendering
- **lil-gui**: GUI controls
- **Vite**: Build tool and development server

## Original Source

Extracted and refactored from the xr.webvr.dev examples (ex7) with modern tooling and improved code organization.