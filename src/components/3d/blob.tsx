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
    uniform vec3 uColor;
    uniform float uThreshold;

    void main() {
        vec2 vel = texture2D(uVelocity, vUv).xy;
        float intensity = length(vel);
        
        // The signature "Whale" thresholding
        // Site uses inverted color logic, but we can simplify to direct length mapping
        float alpha = step(uThreshold, intensity);
        
        if(alpha < 0.1) discard;
        gl_FragColor = vec4(uColor, 1.0);
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
                    uThreshold: { value: 0.05 }
                },
                transparent: true
            })
        };
    }, [fillColor]);

    useFrame((state) => {
        const mouse = state.pointer;
        const currentMouse = new THREE.Vector2((mouse.x + 1) / 2, (mouse.y + 1) / 2);

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
    fillColor = '#EFEFE5',
    zIndex = 99,
    blendMode = 'exclusion',
}) {
    return (
        <div
            className="lando-cursor-fluid-wrap"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
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
