import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend, ThreeElement } from '@react-three/fiber'

/**
 * Background Material (Verified Live Site Version)
 * 
 * Logic: "Filled Blob" Rendering
 * - No Edge Detection/Outlines
 * - Smooth mixing between Background and Blob Color based on Noise
 * - Distortion applied via UV displacement from Fluid Simulation
 */

export const BackgroundMaterial = shaderMaterial(
  {
    uTime: 0,
    uAspect: 1,
    uResolution: new THREE.Vector2(1, 1),
    // Textures
    tBackgroundNoise: null,
    tCursorEffect: null,

    // Colors
    COLOR_BG_LIGHT: new THREE.Color('#F8F8F3'),
    COLOR_GEL_FILL: new THREE.Color('#F8F8F3'),
    COLOR_GEL_STROKE: new THREE.Color('#CBCBB9'),
    COLOR_CURSOR_FOREGROUND: new THREE.Color('#CFD2C5'),

    // Scrolled (Scroll > 0)
    COLOR_BG_DARK: new THREE.Color('#282C20'),
    COLOR_GEL_FILL_DARK: new THREE.Color('#1A1D18'),

    // Logic
    uStrokeWidth: 2.0, // Physical pixels
    uDistortIntensity: 0.02,
    uCursorIntensity: 1.0,
    uReveal: 0.0,
    uDetail: 3.0, // [NEW] Needed here to reconstruct rings
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    precision highp float;

    uniform float uTime;
    uniform float uAspect;
    uniform vec2 uResolution;
    uniform sampler2D tBackgroundNoise;
    uniform sampler2D tCursorEffect;
    
    uniform float uDistortIntensity;
    uniform float uCursorIntensity;
    uniform float uReveal;
    uniform float uDetail;

    // Palette
    uniform vec3 COLOR_BG_LIGHT;
    uniform vec3 COLOR_GEL_FILL;
    uniform vec3 COLOR_GEL_STROKE;
    uniform vec3 COLOR_BG_DARK;
    uniform vec3 COLOR_GEL_FILL_DARK;
    uniform vec3 COLOR_CURSOR_FOREGROUND;

    uniform float uStrokeWidth;
    varying vec2 vUv;

    // PROPER GRADIENT-NORMALIZED SDF FUNCTION
    // guarantees constant 1px/2px width regardless of noise slope
    float aastep(float threshold, float value) {
      float afwidth = length(vec2(dFdx(value), dFdy(value))) * 0.70710678118654757;
      return smoothstep(threshold - afwidth, threshold + afwidth, value);
    }

    void main() {
      vec2 uv = vUv;

      // 1. Fluid Distortion
      vec4 fluid = texture2D(tCursorEffect, uv);
      vec2 velocity = fluid.xy; 
      float velMag = length(velocity);
      vec2 displacedUV = uv - velocity * uDistortIntensity;

      // 2. High-Precision Forward Difference Gradient
      // We calculate physically correct derivatives by sampling neighbors.
      // This bypasses fwidth() which can be unstable on noise fields.
      
      vec2 pixelStep = 1.0 / uResolution; 
      
      float n_center = texture2D(tBackgroundNoise, displacedUV).r;
      float n_right  = texture2D(tBackgroundNoise, displacedUV + vec2(pixelStep.x, 0.0)).r;
      float n_up     = texture2D(tBackgroundNoise, displacedUV + vec2(0.0, pixelStep.y)).r;
      
      // Calculate change per pixel
      float dndx = n_right - n_center;
      float dndy = n_up - n_center;
      
      // Topology Scaling (v = n * uDetail)
      float v = n_center * uDetail;
      
      // Gradient Magnitude (Change of v per pixel)
      float gradLen = length(vec2(dndx, dndy)) * uDetail;
      float safeGrad = max(gradLen, 0.00001);

      // 3. Signed Pixel Distance
      // Distance from the 0.5 threshold, in units of Pixels.
      // fract(v) wraps 0..1. Center is 0.5.
      float distVal = fract(v) - 0.5;
      float signedPixelDist = distVal / safeGrad;

      // 4. Smooth Fill Mask
      // AA the fill edge at 0.0 distance
      float fillMask = smoothstep(-0.5, 0.5, signedPixelDist);

      // 5. Uniform Stroke Mask (Width = uStrokeWidth pixels)
      // We accept a pixel distance of +/- halfWidth
      float halfWidth = uStrokeWidth * 0.5;
      
      // Use a wider smoothstep window (1.5px) for softer, cleaner AA
      float strokeAlpha = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 1.0, abs(signedPixelDist));

      // 6. Compose Colors
      vec3 currentBg = mix(COLOR_BG_LIGHT, COLOR_BG_DARK, uReveal);
      vec3 currentFill = mix(COLOR_GEL_FILL, COLOR_GEL_FILL_DARK, uReveal);
      vec3 currentStroke = mix(COLOR_GEL_STROKE, COLOR_GEL_FILL_DARK, uReveal);

      vec3 finalColor = mix(currentBg, currentFill, fillMask);
      finalColor = mix(finalColor, currentStroke, strokeAlpha);

      // 7. Hotspot
      float hotspotMask = smoothstep(0.01, 0.4, velMag);
      finalColor = mix(finalColor, COLOR_CURSOR_FOREGROUND, hotspotMask * uCursorIntensity);

      gl_FragColor = vec4(finalColor, 1.0);
      #include <colorspace_fragment>
    }
  `
)
extend({ BackgroundMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    backgroundMaterial: ThreeElement<typeof BackgroundMaterial>
  }
}
