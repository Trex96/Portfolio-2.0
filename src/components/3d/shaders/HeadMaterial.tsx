import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'

/**
 * HeadMaterial
 * 
 * Custom shader for the Lando head parallax effect.
 * Implements displacement mapping and interactive shadow mixing.
 */
const HeadMaterial = shaderMaterial(
  {
    uTime: 0,
    uReveal: 0,
    uHelmetHover: 0,
    uProjectorMatrix: new THREE.Matrix4(),
    uProjectorViewMatrix: new THREE.Matrix4(),
    tDefaultDiffuse: null,
    tShadowDiffuse: null,
    tCursorEffect: null,
    tDepth: null,
    tAlpha: null,
    uDisplacementScale: 0.25,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec4 vTexCoords;
    uniform mat4 uProjectorMatrix;
    uniform mat4 uProjectorViewMatrix;
    uniform sampler2D tDepth;
    uniform float uDisplacementScale;

    void main() {
      vUv = uv;
      
      // Sample depth for displacement
      float depth = texture2D(tDepth, vUv).r;
      vec3 displacedPosition = position + normal * depth * uDisplacementScale;
      
      vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Projector UVs for screen-space effects
      vTexCoords = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying vec4 vTexCoords;
    
    uniform sampler2D tDefaultDiffuse;
    uniform sampler2D tShadowDiffuse;
    uniform sampler2D tCursorEffect;
    uniform sampler2D tAlpha;
    
    uniform float uHelmetHover;
    uniform float uReveal;

    const float PI = 3.14159265359;

    void main() {
      // 1. Screen-space UVs for cursor effect sampling
      vec2 cameraUv = vTexCoords.xy / vTexCoords.w;
      cameraUv = cameraUv * 0.5 + 0.5;

      // 2. Alpha check
      float alpha = texture2D(tAlpha, vUv).r;
      if (alpha < 0.01) discard;

      // 3. Hover Transition Logic
      float hoverTransition = cameraUv.y + sin(cameraUv.x * PI) * sin(uHelmetHover * PI) * 0.2;

      // 4. Cursor Effect sampling (inverted as per original)
      // 4. Cursor Effect sampling (DISABLED per user request to clean up model body)
      // vec4 textureCursorEffect = texture2D(tCursorEffect, vec2(cameraUv.x, 0.025 + cameraUv.y * 0.95));
      // textureCursorEffect.rgb = 1.0 - textureCursorEffect.rgb;
      // float cursorEffect = step(0.1, textureCursorEffect.r);
      float cursorEffect = 0.0;

      // 5. Diffuse and Shadow textures
      vec3 diffuseColor = texture2D(tDefaultDiffuse, vUv).rgb;
      vec3 shadowColor = texture2D(tShadowDiffuse, vUv).rgb;

      // 6. Final Color Mix (Only hover transition affects mask now)
      // float mask = clamp(cursorEffect + step(1.0 - hoverTransition, uHelmetHover), 0.0, 1.0);
      float mask = 0.0;
      vec3 finalColor = mix(diffuseColor, shadowColor, mask);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ HeadMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      headMaterial: any
    }
  }
}

export { HeadMaterial }
