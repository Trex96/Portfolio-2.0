
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend, Object3DNode } from '@react-three/fiber'

/**
 * Background Material Bundle
 * Ported from lando.OFF+BRAND.js
 * 
 * Replicates the O9 class shader responsible for compositing:
 * - Background Noise (Gel)
 * - Fluid Cursor Effect
 * - Lando Head/Helmet (tHelmet)
 */

export const BackgroundMaterial = shaderMaterial(
  {
    tBackgroundNoise: null,
    tCursorEffect: null,
    tHelmet: null,
    uTime: 0,
    uAspect: 0,
    uReveal: 0,
    uCursorIntensity: 1.0, // Default to visible
    COLOR_BACKGROUND: new THREE.Color('#282c20'), // Dark Green (Gel Background)
    COLOR_FOREGROUND: new THREE.Color('#f4f4ed'), // Light White (Gel Highlight)
    COLOR_CURSOR_BACKGROUND: new THREE.Color('#7a206a'), // Purple (Cursor Gel Background)
    COLOR_CURSOR_FOREGROUND: new THREE.Color('#ffd600'), // Yellow (Cursor Gel Highlight)
    COLOR_CURSOR_OUTLINE: new THREE.Color('#d2ff00'),  // Lime (Cursor Outline)
    OUTLINE: true,
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
    uniform sampler2D tBackgroundNoise;
    uniform sampler2D tCursorEffect;
    uniform sampler2D tHelmet;
    uniform float uTime;
    uniform float uAspect;
    uniform float uReveal;
    uniform float uCursorIntensity;

    uniform vec3 COLOR_BACKGROUND;
    uniform vec3 COLOR_FOREGROUND;
    uniform vec3 COLOR_CURSOR_BACKGROUND;
    uniform vec3 COLOR_CURSOR_FOREGROUND;
    uniform vec3 COLOR_CURSOR_OUTLINE;
    uniform bool OUTLINE;

    varying vec2 vUv;

    // Utility functions from lando.OFF+BRAND.js
    vec3 adjustContrast(vec3 color, float value) {
      return 0.5 + (1.0 + value) * (color - 0.5);
    }

    vec3 toGrayscale(vec3 color) {
      float average = (color.r + color.g + color.b) / 3.0;
      return vec3(average);
    }

    vec3 blendScreen(vec3 base, vec3 blend) {
      return 1.0 - ((1.0 - base) * (1.0 - blend));
    }
    
    vec3 blendHardLight(vec3 base, vec3 blend) {
      return mix(
        2.0 * base * blend,
        1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
        step(0.5, blend)
      );
    }

    void main() {
      vec4 textureBackgroundNoise = texture2D(tBackgroundNoise, vUv);
      vec4 textureCursorEffect = texture2D(tCursorEffect, vUv);
      
      /* 
         Inversion Logic:
         FluidSimulation outputs a WHITE background (velocity length 0 gives mix(white, color, 0) = white).
         We need to invert this so background is BLACK (0.0) and cursor is non-zero for masking.
      */
      textureCursorEffect.rgb = 1.0 - textureCursorEffect.rgb;
      
      // Smoothstep for liquidy edges
      float cursorEffect = smoothstep(0.0, 0.2, textureCursorEffect.r);

      /* 
        Outline
      */
      float noiseBase = textureBackgroundNoise.r;

      vec3 background = mix(
        COLOR_BACKGROUND, 
        mix(COLOR_BACKGROUND, COLOR_FOREGROUND, uReveal),
        noiseBase
      );

      /* 
         Cursor Overlay REMOVED (User requested DOM-based BlobCursor instead)
      */
      // vec3 cursorBackground = mix(COLOR_CURSOR_BACKGROUND, COLOR_CURSOR_FOREGROUND, noiseBase);
      // ... (logic removed) ...
      
      // Keep background mix as simple as possible or revert to previous state
      /* 
      background = mix(
        background,
        cursorBackground,
        cursorEffect * uCursorIntensity
      ); 
      */
     
      /* 
         Cursor Overlay REMOVED (User requested DOM-based BlobCursor instead)
         Logic for mixing color disabled.
      */
      
      // Ensure background variable is valid if previous mix was removed
      // (Variable 'background' is already defined above)

      /*
        Tone Mapping / Post
      */
      // Note: Replaced custom tone mapping with standard or simplified version if needed
      // but keeping color logic close to source.

      gl_FragColor = vec4(background, 1.0);

      // Include standard tone mapping if available
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
)

extend({ BackgroundMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    backgroundMaterial: Object3DNode<THREE.ShaderMaterial, typeof BackgroundMaterial>
  }
}
