# Lando Hero Architecture & Construction

**Version:** 1.1 (Refined) 
**Status:** Definitive Blueprint  
**Reference:** [landonorris.com](https://landonorris.com)

This document serves as the **architectural blueprint** for the Lando Norris hero background. It explains **HOW** the system is constructed, detailing the data flow, rendering pipeline, and component responsibilities.

---

## 1. High-Level System Overview

The Lando hero background is a **multi-pass WebGL system** built on Three.js. It does not simply render a shader to a plane; it orchestrates a pipeline of texture generation and composition to achieve the "organic" gel effect.

### Core Components
1.  **Fluid Simulation (GPGPU Pass)**: Simulates liquid physics based on mouse movement.
2.  **Noise Generation (Texture Pass)**: Generates the raw, uncolored blob shapes using Simplex noise.
3.  **Composition (Screen Pass)**: Performs fluid distortion, edge detection, coloring, and final rendering to the screen.

### Architecture Diagram
```mermaid
graph TD
    User[User Input] -->|Mouse Coords| Fluid[Pass 1: Fluid Sim]
    State[Global State] -->|uTime| Noise[Pass 2: Noise Gen]
    
    Fluid -->|tFluid (Velocity)| Comp[Pass 3: Composition]
    Noise -->|tBackgroundNoise (Raw)| Comp
    
    Comp -->|Displace UVs + Edge Detect| Screen[User Screen]
```

### Rendering Strategy
**Multi-Pass Pipeline (FBOs):**
1.  **Pass 1 (Fluid)**: Renders to `tFluid` (RGBA Float Texture).
2.  **Pass 2 (Noise)**: Renders to `tBackgroundNoise` (RGB Texture).
3.  **Pass 3 (Screen)**: Renders to the Canvas (Screen).

---

## 2. Rendering Pipeline Deep-Dive

### Pass 1: Fluid Simulation
**Purpose:** Create a velocity field from cursor movement.
**Shader:** `FluidSimulationMaterial` (Custom GPGPU shader)
**Renders To:** `tFluid` (RenderTarget)
-   **Structure:** Ping-Pong Buffers (Read/Write) to allow history/decay.
-   **Format:** `THREE.HalfFloatType` (essential for negative velocity values).
-   **Resolution:** Low res (e.g., 256x256) suffices for soft displacement.

**Inputs:**
-   `uMouse`: Current normalized mouse position.
-   `uDelta`: Time delta.
-   `uDissipation`: Rate at which velocity fades (creates the "calm down" effect).

**Outputs:**
-   **R/G**: Velocity vector (X/Y direction).
-   **B**: Density/Pressure (optional).

---

### Pass 2: Noise Generation
**Purpose:** Generate the pure, undistorted organic noise field.
**Shader:** `SimplexNoiseMaterial`
**Renders To:** `tBackgroundNoise` (RenderTarget)

**Inputs:**
-   `uTime`: Drives the evolution (z-axis of Simplex).
-   `uScale`: Noise frequency.
-   `uSpeed`: Animation speed (0.1).

**Shader Logic:**
1.  **Coordinates**: Use standard UVs (aspect corrected).
2.  **Generate**: Calculate 3D Simplex noise `snoise(vec3(uv * scale, time))`.
3.  **Output**:
    -   **R Channel**: Noise Value [0-1].
    -   **G/B/A**: Unused.

**Code Reference (Concept):**
```glsl
float n = snoise(vec3(vUv * uScale, uTime * uSpeed));
gl_FragColor = vec4(vec3(n), 1.0);
```

---

### Pass 3: Final Composition
**Purpose:** Combine fluid displacement, noise sampling, edge detection, and color.
**Shader:** `BackgroundMaterial` (The "Gel" Shader)
**Renders To:** Screen
**Samples From:** `tBackgroundNoise`, `tFluid`

**Composition Logic:**
1.  **Sample Fluid**: `vec2 velocity = texture2D(tFluid, vUv).xy;`
2.  **Displace UVs**: `vec2 displacedUV = vUv + velocity * uDistortIntensity;`
3.  **Edge Detection**: Sample `tBackgroundNoise` at 4 offsets using `displacedUV`.
4.  **Color Mixing**: Mix colors based on the sampled noise value.

**Code Reference (Fragment):**
```glsl
vec2 disp = texture2D(tFluid, vUv).xy * uDistortIntensity;
vec2 centerUV = vUv + disp;

// 4-Tap Edge Detection on Distorted Field
float edge = 0.0;
for(int i=0; i<4; i++) {
  // Sample noise at Distorted Center + Offset
  if (texture2D(tBackgroundNoise, centerUV + offsets[i]).r != center) edge = 1.0;
}
```

---

## 3. Component Architecture

### `GLBackground.tsx` (Orchestrator)
**Responsibility:** Initializes the Three.js scene, camera, and the FBO pipeline.
**State:**
-   Manages `useFrame` loop to sequence the renders: `Fluid -> Noise -> Viewport`.
-   Holds refs to `tFluid` and `tBackgroundNoise` render targets.

### `SimplexNoiseMaterial.tsx`
**Responsibility:** Encapsulates the noise generation shader.
**Props:** `speed`, `scale`.
**Uniforms:** `uTime`.

### `BackgroundMaterial.tsx`
**Responsibility:** The presentational shader.
**Props:** All colors, `distortIntensity`.
**Uniforms:** `tBackgroundNoise`, `tFluid`, `uReveal`.

---

## 4. Data Flow Analysis

### Mouse Position Journey
1.  **Input**: Browser `mousemove` event in `GLBackground`.
2.  **Normalization**: Converted to UV space [0, 1] relative to the canvas.
3.  **Injection**: Passed to **Pass 1 (Fluid)** via uniform `uMouse`.
4.  **Physics**: Fluid shader adds velocity at that coordinate and advects it.
5.  **Propagation**:
    -   **Pass 1**: Velocity field evolves (fluid sim).
    -   **Pass 3**: Composition shader samples `tFluid` to distort UVs.
    -   **Result**: The coordinates used to look up the noise are warped, stretching the blobs.

### Scroll Position Journey
1.  **Input**: `GSAP ScrollTrigger` monitors page scroll.
2.  **Logic**: Maps scroll position to a `0-1` progress value (or discrete theme states).
3.  **Injection**: Updates uniforms on **Pass 3 (Composition)**:
    -   `COLOR_BACKGROUND` interpolates from Light -> Dark.
    -   `COLOR_FOREGROUND` interpolates from Lime -> Dark Green.
4.  **Result**: The animation seamlessly shifts themes while preserving the fluid motion.

---

## 5. Construction Decision Rationale

### Why separate Noise and Composition?
**Efficiency & Quality.**
-   **Sobel/Edge Detection** requires sampling neighboring pixels.
-   If we generated noise *inside* the final shader, we'd have to calculate expensive Simplex noise 5 times per pixel (1 center + 4 neighbors).
-   **By baking noise to a texture first**, the final pass only does cheap texture lookups. This improves performance by a factor of 5x.

### Why Distortion at Composition?
**Crisp Edges.**
-   If we distorted the *noise generation* itself, the noise texture would contain stretched pixels.
-   By generating clean noise and distorting the *lookup coordinates* in the final pass, we ensure that the "edge detection" logic runs on the final visual result, keeping the edges sharp even when the blob is heavily skewed.

---

## 6. Critical Implementation Details

### 1. Texture Filtering
-   **Noise Texture**: Must use `LinearFilter` for the displacement lookup to be smooth.
-   **Edge Detection**: However, for the "crisp" lines, we rely on the specific `THICKNESS` offset.

### 2. Coordinate Systems
-   **Fluid Sim**: Works in UV space [0,1].
-   **Aspect Ratio**: The noise generation must account for aspect ratio (`uv.x *= aspect`) to prevent stretched blobs on wide screens.

### 3. The "Golden" Constants
Extracted from the live site, these are non-negotiable for the "Lando" feel:
-   `SPEED`: **0.1** (Slow, viscous evolution).
-   `DISTORT_INTENSITY`: **0.5** (Enough to warp, not enough to break).
-   `THICKNESS`: **0.000005** (Extremely fine edge detection).

---

## 7. Verification Architecture

### Testing Pass 1 (Fluid)
-   Visualize `tFluid` directly on a screen-aligned quad.
-   **Expectation**: Black screen that erupts in color (velocity) when mouse moves.

### Testing Pass 2 (Noise)
-   Visualize `tBackgroundNoise` directly.
-   **Expectation**: Smooth, grayscale cloud pattern moving slowly.
-   **Interaction**: Mouse should have NO effect (since distortion happens in Pass 3).

### Testing Pass 3 (Full System)
-   Feed standard inputs.
-   **Expectation**: Blobs should "liquify" near mouse cursor but maintain sharp edges.

---


