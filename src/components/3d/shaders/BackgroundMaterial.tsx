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

    // Colors - Tuned for Lando 100% Match (Exact Vis)
    COLOR_BG_LIGHT: new THREE.Color('#F4F4ED'), // Lando "White" (Warm Cream)
    COLOR_GEL_FILL: new THREE.Color('#EFEFE5'), // Lando "Cream" (Greenish Tint)
    COLOR_GEL_STROKE: new THREE.Color('#BABDAA'), // Dark Olive for contrast
    COLOR_CURSOR_FOREGROUND: new THREE.Color('#CFD2C5'),

    // Scrolled (Scroll > 0)
    COLOR_BG_DARK: new THREE.Color('#282C20'),
    COLOR_GEL_FILL_DARK: new THREE.Color('#1A1D18'),

    // Logic
    uStrokeWidth: 2.0,
    uDistortIntensity: 0.02,
    uCursorIntensity: 1.0,
    uReveal: 0.0,
    uDetail: 2.0, // [TUNED] 6.0 for ~5-6 Rings
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

    varying vec2 vUv;

    // --- Simplex Noise (Single-Pass Version) ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) { 
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
      i = mod289(i); 
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
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
    }

    void main() {
      vec2 uv = vUv;

      // 1. Fluid Distortion (Mouse Interaction)
      vec4 fluid = texture2D(tCursorEffect, uv);
      vec2 velocity = fluid.xy; 
      float velMag = length(velocity);
      
      // 2. DOMAIN WARPING (The "Multi-Focal" Look)
      // We don't use a center. We warp the space itself.
      
      
      vec2 st = uv * 0.6; // [TUNED] Smaller features (Zoomed out)
      // Correct aspect ratio for the noise field so circles aren't stretched
      st.x *= uAspect;

      // First layer of warping (The "Flow")
      vec2 q = vec2(0.);
      float time = uTime * 0.015; // Slow breathing
      
      q.x = snoise(vec3(st + vec2(0.0, 0.0), time));
      q.y = snoise(vec3(st + vec2(5.2, 1.3), time));

      // Inject Mouse Velocity into the warp
      q += velocity * uDistortIntensity * 5.0;

      // Second layer (The "Terrain")
      // We use the warped 'q' to sample the next noise
      vec2 r = st + q * 0.5;
      float field = snoise(vec3(r, time * 0.5));

      // Normalize field roughly to 0..1 for easier ring math
      field = field * 0.5 + 0.5;

      // 3. ISOLINES (Topographic Rings)
      // The 'field' is now a complex terrain with islands and valleys
      // uDetail determines how many "elevation lines" we draw
      float topographic = fract(field * uDetail); 

      // 4. SMART LINE GENERATOR (Anti-Aliased & Sharp)
      // Use the same scale factor as fract() above
      float delta = fwidth(field * uDetail);
      // Tighter smoothstep for "wireframe" look (1.5 * delta for clean feel)
      float line = smoothstep(delta * 1.5, 0.0, topographic) + smoothstep(1.0 - delta * 1.5, 1.0, topographic);

      // 5. COLORS
      vec3 currentBg = mix(COLOR_BG_LIGHT, COLOR_BG_DARK, uReveal);
      vec3 currentFill = mix(COLOR_GEL_FILL, COLOR_GEL_FILL_DARK, uReveal);
      vec3 currentStroke = mix(COLOR_GEL_STROKE, COLOR_GEL_FILL_DARK, uReveal);

      // Body Area (The Gel) - Use the height field for the mask
      float bodyMask = smoothstep(0.4, 0.8, field); // Smoother, wider gradient for fill
      vec3 finalColor = mix(currentBg, currentFill, bodyMask);
      
      // Overlay Topographic Lines
      // [TUNED] 50% Opacity (Exact Match Balance)
      finalColor = mix(finalColor, currentStroke, clamp(line, 0.0, 1.0) * 0.5);
      // Hotspot Highlight
      float hotspot = smoothstep(0.01, 0.4, velMag);
      finalColor = mix(finalColor, COLOR_CURSOR_FOREGROUND, hotspot * uCursorIntensity * 0.5);

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
