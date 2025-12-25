import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend, Object3DNode } from '@react-three/fiber'

const SimplexNoiseMaterial = shaderMaterial(
  {
    uTime: 0,
    uAspect: 1,
    uMouseCoords: new THREE.Vector2(0, 0),
    uMousePace: 0,
    uReveal: 0,
    SCALE: 1.0,
    SPEED: 0.1,
    DISTORT_SCALE: 1.0,
    DISTORT_INTENSITY: 0.5,
    NOISE_DETAIL: 3.0,
    CURSOR_INTENSITY: 0.15,
    CURSOR_SCALE: 3.0,
    CURSOR_BOUNCE: -0.75,
    REVEAL_SIZE: 25.0,
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
    varying vec2 vUv;

    uniform float uAspect;
    uniform float uTime;
    uniform float uMousePace;
    uniform float uReveal;
    uniform vec2 uMouseCoords;

    uniform float SCALE;
    uniform float SPEED;
    uniform float DISTORT_SCALE;
    uniform float DISTORT_INTENSITY;
    uniform float NOISE_DETAIL;
    uniform float CURSOR_INTENSITY;
    uniform float CURSOR_SCALE;
    uniform float CURSOR_BOUNCE;
    uniform float REVEAL_SIZE;

    // Simplex Noise Implementation (from VO variable)
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
      const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
      const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy) );
      vec3 x0 =   v - i + dot(i, C.xxx) ;

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min( g.xyz, l.zxy );
      vec3 i2 = max( g.xyz, l.zxy );

      vec3 x1 = x0 - i1 + 1.0 * C.xxx;
      vec3 x2 = x0 - i2 + 2.0 * C.xxx;
      vec3 x3 = x0 - 1. + 3.0 * C.xxx;

      i = mod(i, 289.0 ); 
      vec4 p = permute( permute( permute( 
                 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
               + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

      float n_ = 1.0/7.0; 
      vec3  ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_ );    

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4( x.xy, y.xy );
      vec4 b1 = vec4( x.zw, y.zw );

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

      vec3 p0 = vec3(a0.xy,h.x);
      vec3 p1 = vec3(a0.zw,h.y);
      vec3 p2 = vec3(a1.xy,h.z);
      vec3 p3 = vec3(a1.zw,h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      /* 
        UVs
      */
      vec2 uv = vUv;
      uv.x *= uAspect;
      uv.y += (REVEAL_SIZE + REVEAL_SIZE / 3.) * (1.0 - uReveal);
      uv.y /= 1.0 + (REVEAL_SIZE) * (1.0 - uReveal);
    
      /* 
        Cursor (Unused for distortion now)
      */
      vec2 mouse = uMouseCoords;
      mouse *= vec2(0.5);
      mouse += vec2(0.5);
      mouse.x *= uAspect;
    
      float cursor = 1.0 - distance(mouse, uv) * CURSOR_SCALE;
      cursor *= uMousePace;
      cursor = clamp(cursor, CURSOR_BOUNCE, 1.0);
    
      /* 
        Noise
      */
      float noiseDistort = 0.5 + snoise(vec3(uv.x * DISTORT_SCALE, uv.y * DISTORT_SCALE, uTime * SPEED * 0.1)) * 0.5;
    
      // REMOVED cursor influence on coordinates here
      float noiseFinal = 0.5 + snoise(
        vec3(
          (uv.x + (noiseDistort * DISTORT_INTENSITY)) * SCALE, 
          (uv.y + (noiseDistort * DISTORT_INTENSITY)) * SCALE, 
          uTime * SPEED
        )
      ) * 0.5;
      noiseFinal *= NOISE_DETAIL;
      noiseFinal = fract(noiseFinal); 

      // Anti-aliased step for sharp but smooth edges
      float delta = fwidth(noiseFinal);
      float noiseBase = smoothstep(0.5 - delta, 0.5 + delta, noiseFinal);

      gl_FragColor = vec4(vec3(noiseBase, noiseFinal, 0.0), 1.0);
    }
  `
);

// Register the material with R3F
extend({ SimplexNoiseMaterial });

// Type definitions for TypeScript usage
declare global {
  namespace JSX {
    interface IntrinsicElements {
      simplexNoiseMaterial: {
        attach?: string;
        args?: any[];
        uTime?: number;
        uAspect?: number;
        uMouseCoords?: THREE.Vector2;
        uMousePace?: number;
        uReveal?: number;
        SCALE?: number;
        SPEED?: number;
        DISTORT_SCALE?: number;
        DISTORT_INTENSITY?: number;
        NOISE_DETAIL?: number;
        CURSOR_INTENSITY?: number;
        CURSOR_SCALE?: number;
        CURSOR_BOUNCE?: number;
        REVEAL_SIZE?: number;
      } & Object3DNode<THREE.ShaderMaterial, typeof SimplexNoiseMaterial>
    }
  }
}

export { SimplexNoiseMaterial };
