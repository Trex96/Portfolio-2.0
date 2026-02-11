'use client';

import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';

/**
 * Lando Official "Whale" Cursor
 * 
 * Standalone GPGPU Fluid Simulation.
 * Optimized for TypeScript and React.
 * 
 * Logic flow:
 * 1. Splat (User interaction)
 * 2. Advection (Fluid movement/Dissipation)
 * 3. Divergence -> Pressure (Solves incompressibility)
 * 4. Gradient Subtraction
 * 5. Final Threshold Pass (The "Whale" silhouette)
 */

// Shaders
const baseVertex = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const splatFrag = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform vec2 uPoint;
    uniform vec2 uForce;
    uniform float uRadius;
    uniform float uAspect;

    void main() {
        vec2 p = vUv - uPoint;
        p.x *= uAspect;
        float d = exp(-dot(p, p) / uRadius);
        vec2 base = texture2D(uTarget, vUv).xy;
        gl_FragColor = vec4(base + uForce * d, 0.0, 1.0);
    }
`;

const advectionFrag = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform float uDt;
    uniform float uDissipation;

    void main() {
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vec2 coord = vUv - uDt * vel;
        vec2 advected = texture2D(uVelocity, coord).xy;
        gl_FragColor = vec4(advected * uDissipation, 0.0, 1.0);
    }
`;

const divergenceFrag = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;

    void main() {
        float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
        float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
        float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
        float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`;

const pressureFrag = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    uniform vec2 uTexelSize;

    void main() {
        float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
        float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
        float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
        float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
        float div = texture2D(uDivergence, vUv).x;
        float p = (L + R + B + T - div) * 0.25;
        gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
    }
`;

const gradientSubtractFrag = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    uniform vec2 uTexelSize;

    void main() {
        float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
        float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
        float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
        float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
        vec2 vel = texture2D(uVelocity, vUv).xy;
        vel -= 0.5 * vec2(R - L, T - B);
        gl_FragColor = vec4(vel, 0.0, 1.0);
    }
`;

const whaleFrag = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec3 uColor; // The "Cream" (Background) Color
    uniform float uThreshold;
    uniform float uTime;
    uniform float uAspect;
    uniform float uDetail; // Matches Background Detail (12.0)

    // --- Simplex Noise (Same as BackgroundMaterial) ---
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) { 
        // ... (standard simplex noise) ...
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
        vec2 vel = texture2D(uVelocity, vUv).xy;
        float intensity = length(vel);
        
        // Whale Shape
        float alpha = step(uThreshold, intensity);
        if(alpha < 0.1) discard;

        // --- Gel Pattern Logic (Inside the Whale) ---
        vec2 st = vUv * 0.6; 
        st.x *= uAspect;

        float time = uTime * 0.015;
        
        // Warp 1
        vec2 q = vec2(0.);
        q.x = snoise(vec3(st + vec2(0.0, 0.0), time));
        q.y = snoise(vec3(st + vec2(5.2, 1.3), time));

        // Field
        vec2 r = st + q * 0.5;
        float field = snoise(vec3(r, time * 0.5));
        field = field * 0.5 + 0.5;

        // "Part of blob should be color to gel"
        // "Part of blob should be color to gel"
        // Black for high contrast with Gray
        vec3 colorGel = vec3(0.0, 0.0, 0.0);
        
        // Colors
        vec3 finalColor;

        // "1 gel 1 ring , only ring , gel ring"
        // Alternating Bands Logic based on uDetail
        float ringIndex = floor(field * uDetail);
        
        // Use mod 2 to alternate: Even rings = Gel, Odd rings = Cream
        if (mod(ringIndex, 2.0) == 0.0) {
            finalColor = colorGel;
        } else {
            finalColor = uColor; // Cream
        }
        
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

function WhaleSim({ fillColor }: { fillColor: string }) {
    const { gl, size } = useThree();
    const simRes = 128; // Standard organic resolution

    // FBO Setup
    const fboProps = {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
    };

    const targets = useMemo(() => {
        const createRT = () => new THREE.WebGLRenderTarget(simRes, simRes, fboProps);
        return {
            vel0: createRT(),
            vel1: createRT(),
            pressure0: createRT(),
            pressure1: createRT(),
            divergence: createRT(),
        };
    }, []);

    // Scene for FBO passes
    const { scene, camera, quad } = useMemo(() => {
        const s = new THREE.Scene();
        const c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
        s.add(q);
        return { scene: s, camera: c, quad: q };
    }, []);

    // Interaction state
    const lastMouse = useRef(new THREE.Vector2(0, 0));
    const isFirstFrame = useRef(true);

    // Materials
    const mats = useMemo(() => {
        const createMat = (frag: string, uniforms = {}) => new THREE.ShaderMaterial({
            vertexShader: baseVertex,
            fragmentShader: frag,
            uniforms: {
                uTexelSize: { value: new THREE.Vector2(1 / simRes, 1 / simRes) },
                uDt: { value: 0.016 },
                ...uniforms
            },
            depthTest: false,
            depthWrite: false,
        });

        return {
            splat: createMat(splatFrag, {
                uTarget: { value: null },
                uPoint: { value: new THREE.Vector2() },
                uForce: { value: new THREE.Vector2() },
                uRadius: { value: 0.0005 },
                uAspect: { value: 1.0 }
            }),
            advection: createMat(advectionFrag, {
                uVelocity: { value: null },
                uDissipation: { value: 0.96 }
            }),
            divergence: createMat(divergenceFrag, { uVelocity: { value: null } }),
            pressure: createMat(pressureFrag, { uPressure: { value: null }, uDivergence: { value: null } }),
            gradient: createMat(gradientSubtractFrag, { uPressure: { value: null }, uVelocity: { value: null } }),
            output: new THREE.ShaderMaterial({
                vertexShader: baseVertex,
                fragmentShader: whaleFrag,
                uniforms: {
                    uVelocity: { value: null },
                    uColor: { value: new THREE.Color(fillColor) },
                    uThreshold: { value: 0.05 },
                    uTime: { value: 0 },
                    uAspect: { value: 1 },
                    uDetail: { value: 12.0 } // 12.0 Matches Background
                },
                transparent: true
            })
        };
    }, [fillColor]);

    useFrame((state) => {
        const mouse = state.pointer;
        const currentMouse = new THREE.Vector2((mouse.x + 1) / 2, (mouse.y + 1) / 2);

        // Update Uniforms
        mats.output.uniforms.uTime.value = state.clock.elapsedTime;
        mats.output.uniforms.uAspect.value = size.width / size.height;
        // uDetail is typically static, but we could update it if needed. 
        // mats.output.uniforms.uDetail.value = 12.0; 

        if (isFirstFrame.current) {
            lastMouse.current.copy(currentMouse);
            isFirstFrame.current = false;
        }

        const force = new THREE.Vector2().subVectors(currentMouse, lastMouse.current).multiplyScalar(50.0);
        lastMouse.current.copy(currentMouse);

        // 1. Splat
        if (force.lengthSq() > 0.0) {
            mats.splat.uniforms.uTarget.value = targets.vel0.texture;
            mats.splat.uniforms.uPoint.value.copy(currentMouse);
            mats.splat.uniforms.uForce.value.copy(force);
            mats.splat.uniforms.uAspect.value = size.width / size.height;
            gl.setRenderTarget(targets.vel1);
            quad.material = mats.splat;
            gl.render(scene, camera);

            // Swap
            const temp = targets.vel0;
            targets.vel0 = targets.vel1;
            targets.vel1 = temp;
        }

        // 2. Advection
        mats.advection.uniforms.uVelocity.value = targets.vel0.texture;
        gl.setRenderTarget(targets.vel1);
        quad.material = mats.advection;
        gl.render(scene, camera);

        const tempAd = targets.vel0;
        targets.vel0 = targets.vel1;
        targets.vel1 = tempAd;

        // 3. Divergence
        mats.divergence.uniforms.uVelocity.value = targets.vel0.texture;
        gl.setRenderTarget(targets.divergence);
        quad.material = mats.divergence;
        gl.render(scene, camera);

        // 4. Pressure (Jacobi iterations per site logic)
        gl.setRenderTarget(targets.pressure0);
        gl.clear();
        for (let i = 0; i < 4; i++) {
            mats.pressure.uniforms.uDivergence.value = targets.divergence.texture;
            mats.pressure.uniforms.uPressure.value = targets.pressure0.texture;
            gl.setRenderTarget(targets.pressure1);
            quad.material = mats.pressure;
            gl.render(scene, camera);

            const tempP = targets.pressure0;
            targets.pressure0 = targets.pressure1;
            targets.pressure1 = tempP;
        }

        // 5. Gradient Subtract
        mats.gradient.uniforms.uPressure.value = targets.pressure0.texture;
        mats.gradient.uniforms.uVelocity.value = targets.vel0.texture;
        gl.setRenderTarget(targets.vel1);
        quad.material = mats.gradient;
        gl.render(scene, camera);

        const tempG = targets.vel0;
        targets.vel0 = targets.vel1;
        targets.vel1 = tempG;

        // 6. Rendering output
        mats.output.uniforms.uVelocity.value = targets.vel0.texture;
        gl.setRenderTarget(null);
    });

    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            <primitive object={mats.output} />
        </mesh>
    );
}

export default function LandoCursor({
    fillColor = '#A0A0A0',
    zIndex = 99,
    blendMode = 'normal',
}) {
    return (
        <div
            className="lando-cursor-fluid-wrap"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: zIndex,
                mixBlendMode: blendMode as any,
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 1] }}
                gl={{ alpha: true, antialias: true }}
                style={{ background: 'transparent' }}
            >
                <WhaleSim fillColor={fillColor} />
            </Canvas>
        </div>
    );
}
