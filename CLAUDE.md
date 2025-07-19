# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebXR experiments repository hosting various interactive examples using Three.js and A-Frame. The project contains hand-written example files demonstrating WebXR capabilities including VR support, 3D graphics, point cloud visualizations, and depth mapping.

## Architecture

- **build/**: Output directory containing all generated content and examples
  - **build/ex/**: Contains hand-written examples organized by framework
    - **a-frame/**: A-Frame WebXR examples
    - **three.js/**: Three.js examples including cube demos, point cloud visualizations (points1, points2), depth mapping (depthbot), and 3D text (wordle1)
  - **fonts/**: Three.js font assets (helvetiker_regular.typeface.json)
  - **images/**: Image assets for examples including depth maps and textures
- **tristogram/**: Standalone npm package extracted from points2/ex7, featuring 3D color histogram visualization with modern Vite tooling
- **Root files**: package.json, yarn.lock, README.md, .eslintrc.js

### Key Example Categories

- **cube1/**: Basic Three.js cube examples with VR support
- **points1/ & points2/**: Point cloud visualizations and color space analysis
- **depthbot/**: Depth mapping and image processing examples
- **wordle1/**: 3D text rendering with Three.js typography
- **a-frame/basic1/**: Basic A-Frame WebXR scenes

Each example directory typically contains:

- HTML files (ex1.html, ex2.html, etc.)
- JavaScript modules (ex1.js, ex2.js, etc.)
- Three.js library files and modules in js/ and jsm/ subdirectories
- Supporting libraries like OrbitControls, VRButton, lil-gui

## Development Commands

**Package management:**

```bash
yarn install    # Install dependencies
```

**Linting:**

```bash
yarn run lint   # Run ESLint with Airbnb configuration
# Or directly: npx eslint <file>
```

**Deployment:**

```bash
yarn run sync   # Deploy build directory to configured path
# Requires npm_config_xr_deploy_path environment variable
```

**Development:**

- Examples are typically developed directly in the build/ex/ directories
- Use a local web server to serve files (required for module imports and CORS)
- Examples use ES6 modules with relative imports

**Tristogram package:**

```bash
cd tristogram
npm install         # Install dependencies
npm run dev         # Start development server on port 3000
npm run build       # Build for production
npm run preview     # Preview production build
```

## Code Conventions

- ESLint configuration uses Airbnb base rules
- ES2021 features enabled
- Module imports without extensions allowed
- Examples follow pattern of import statements, init functions, and animation loops
- VR support implemented via WebXR with VRButton helper
- Three.js examples commonly use OrbitControls for camera manipulation

## Important Notes

- **Do not overwrite build/ex/ directory** - contains hand-written examples
- Examples require a web server to run properly due to ES6 module imports
- Many examples load external image assets via HTTPS URLs
- WebXR features require HTTPS in production environments
