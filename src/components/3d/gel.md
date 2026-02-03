# Lando Norris Gel Animation: Definitive Technical Analysis

This document provides a comprehensive, A-Z teardown of the background gel animation on [landonorris.com](https://landonorris.com). It is designed to serve as the definitive source of truth for exact visual replication.

---

## 1. Visual Architecture & Live Site Behavior

The "Gel" is a full-screen Three.js WebGL plane (`.gl` canvas) that responds to scroll position and mouse interaction.

### 1.1 Visual Truth Table (Scroll States)

| State | Typical Y Offset | Visual Appearance | Color Mode | Primary Background | Blob Foreground | Edge Detection (Outline) | Screenshot Proof |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial (Hero)** | 0px - 400px | **Light Theme** | Filled | `#F4F4ED` | `#D4D7CA` | Disabled (Visual) | ![initial_state](/Users/bikashmarandi/.gemini/antigravity/brain/709f883b-9ad9-4cdf-81e0-75e04f81ea57/initial_state_1769979657399.png) |
| **Dark (Bio)** | 600px - 4000px | **Dark Theme** | Filled | `#282C20` | `#363B25` | Active (Subtle) | ![scrolled_dark](/Users/bikashmarandi/.gemini/antigravity/brain/709f883b-9ad9-4cdf-81e0-75e04f81ea57/scrolled_dark_1769979726253.png) |
| **Carousel Hub** | 4500px+ | **Light Theme** | Filled | `#F4F4ED` | `#D4D7CA` | Active (Subtle) | ![scrolled_light](/Users/bikashmarandi/.gemini/antigravity/brain/709f883b-9ad9-4cdf-81e0-75e04f81ea57/scrolled_light_1769979864338.png) |

> [!NOTE]
> **The Blue Glow**: A vibrant blue vignette frames the viewport at all times. This is implemented via the **Fragment Shader**, not CSS gradients.

---

## 2. Technical Truth: Source Code Extraction

### 2.1 Definitive Color Palette (`A` object in source)
Extracted from `lando.OFF+BRAND.js`. These hex codes are the foundation for all theme transitions.

```javascript
const PALETTE = {
  black: "#111112",
  "dark-green": "#282C20",           // Background (Dark)
  "dark-green-tint-1": "#363B25",    // Foreground/Blob (Dark)
  "dark-green-tint-1-low": "#D4D7CA",// Foreground/Blob (Light)
  white: "#f4f4ed",                  // Background (Light)
  lime: "#D2FF00"                    // Primary Accent / Logo
};
```

### 2.2 Vertex Shader
Simple pass-through to set UV coordinates.

```glsl
varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vUv = uv;
}
```

### 2.3 Fragment Shader Core Logic
The fragment shader handles noise sampling, edge detection (the "Gel" feel), and color mixing.

#### A. Edge Detection (4-Tap Mechanism)
This logic creates the characteristic "liquid" edge by comparing neighboring noise samples.

```glsl
if (OUTLINE) {
  float edge = 0.0;
  vec2 offsets[4] = vec2[](
    vec2( THICKNESS,  0.0), // Right
    vec2(-THICKNESS,  0.0), // Left
    vec2(0.0,  THICKNESS),  // Up
    vec2(0.0, -THICKNESS)   // Down
  );

  for (int i = 0; i < 4; i++) {
    vec2 offsetUV = vUv + offsets[i];
    vec4 sampledNoise = texture2D(tBackgroundNoise, offsetUV);
    if (sampledNoise.r != textureBackgroundNoise.r) {
      edge = 1.0; // Mark the boundary
    }
  }

  // Final Background Selection
  background = mix(
    COLOR_BACKGROUND, 
    mix(COLOR_BACKGROUND, COLOR_OUTLINE, uReveal),
    edge 
  );
}
```

#### B. The "ERASE" Mechanism
When `OUTLINE` is true and `edge` is found, the shader "erases" the blob interior by only coloring the `edge` boundary, effectively turning blobs into lines.

---

## 3. Interaction State Machine

### 3.1 Cursor Displacement
- **Displacement Map**: `tFluid` (Generated from a separate fluid simulation pass).
- **Hotspot**: A ~200px radius around the cursor creates high-velocity displacement in the blobs.
- **Visual Interaction**: ![cursor_interaction](/Users/bikashmarandi/.gemini/antigravity/brain/709f883b-9ad9-4cdf-81e0-75e04f81ea57/cursor_interaction_1769979923914.png)

### 3.2 Hover States
Triggered via `mouseenter` on `[data-gl-hover]` and `[data-gl-helmet]` elements.
- **uHover**: Transition from 0 to 1 over 500ms (Expo).
- **uCursorIntensity**: Controls the visibility of the "cursor hotspot" (blobs inside the cursor circle).

---

## 4. Implementation Checklist for Replication

To perfectly replicate this effect in a React/Three.js environment:

1.  [x] **Color Space**: Ensure `THREE.SRGBColorSpace` is set. All hex codes MUST be converted using `.convertLinearToSRGB()` before passing to uniforms.
2.  [x] **Initial State**: Start with `COLOR_BACKGROUND: #F8F8F3` and `COLOR_FOREGROUND: #D2FF00`.
3.  [x] **Scroll Triggers**: Use `ScrollTrigger` (GSAP) to interpolate between the Light and Dark schemes based on section entry.
4.  [x] **Edges**: Implement the 4-tap edge detection above using a small `THICKNESS` value (approx `0.000005`).
5.  [x] **Fluid Pass**: Sample a `tFluid` texture (liquid simulation) to displace UVs before sampling the noise.

---
## 4. Definitive Configuration Parameters (Extracted from Live Site)

The following parameters were extracted directly from `window.landoGL.params` on `landonorris.com`.

### 4.1 Head Scene (Hero Animation)
| Parameter | Value | Description |
| :--- | :--- | :--- |
| `COLOR_BACKGROUND` | `#F8F8F3` | The off-white background color. |
| `COLOR_FOREGROUND` | `#D2FF00` | The primary Lando Lime color. |
| `COLOR_OUTLINE` | `#CBCBB9` | The outline/edge detection color. |
| `COLOR_CURSOR_FOREGROUND` | `#CFD2C5` | Foreground color inside the interactive disclosure. |
| `COLOR_CURSOR_BACKGROUND` | `#E8E8DF` | Background color inside the interactive disclosure. |
| `SPEED` | `0.1` | Simplex noise animation speed. |
| `DISTORT_INTENSITY` | `0.5` | Intensity of the fluid distortion. |
| `REVEAL_SIZE` | `25` | The radius of the interactive disclosure effect. |
| `VARIANT` | `"Google"` | Current helmet design variant. |

### 4.2 Background Scene (Dark Theme)
| Parameter | Value | Description |
| :--- | :--- | :--- |
| `COLOR_BACKGROUND` | `#282C20` | Dark green background used after scroll. |
| `COLOR_FOREGROUND` | `#363B25` | Foreground highlight in the dark theme. |
| `COLOR_CURSOR_BACKGROUND`| `#B2C73A` | Cursor bloom color in dark theme. |

---

## 5. Implementation Summary for Next.js

1.  **State Management**: Use `GSAP` to interpolate between the Light theme (`#F8F8F3`) and Dark theme (`#282C20`) based on `ScrollTrigger`.
2.  **Shader Uniforms**: Hardcode the `SPEED` (0.1), `DISTORT_INTENSITY` (0.5), and `REVEAL_SIZE` (25.0) as the "Golden Ratios" of the animation.
3.  **Interaction**: Ensure the `uCursorIntensity` and `uReveal` uniforms are driven by both mouse position and scroll progress.

---
*Report synthesized by Antigravity on 2026-02-01.*
