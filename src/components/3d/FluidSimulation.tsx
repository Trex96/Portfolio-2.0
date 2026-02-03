import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Fluid Simulation Component
 * 
 * Based on the GPGPU implementation from Lando Norris website.
 * Solves Navier-Stokes equations for incompressible fluid.
 * 
 * Pipeline:
 * 1. Advection (Transport velocity/color)
 * 2. External Forces (Mouse input) -> Splat
 * 3. Divergence (Calculate velocity change)
 * 4. Pressure (Solve Poisson equation via Jacobi iteration)
 * 5. Gradient Subtraction (Enforce incompressibility)
 */

export const FluidSimulation: React.FC<{ onTextureUpdate: (texture: THREE.Texture) => void }> = ({ onTextureUpdate }) => {
    const { gl, size, viewport } = useThree();

    // simulation resolution (Increased to 512 for higher-fidelity distortion)
    const simRes = 512;

    // --- Shaders ---
    // Standard GPGPU vertex shader
    const baseVertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const advectionFrag = `
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform float dt;
        uniform float dissipation;

        void main() {
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
            gl_FragColor = result * dissipation;
        }
    `;

    const divergenceFrag = `
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform vec2 texelSize;

        void main() {
            float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
            float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
            float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
            float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;

            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vUv.x < texelSize.x) L = -C.x;
            if (vUv.x > 1.0 - texelSize.x) R = -C.x;
            if (vUv.y < texelSize.y) B = -C.y;
            if (vUv.y > 1.0 - texelSize.y) T = -C.y;

            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `;

    const curlFrag = `
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform vec2 texelSize;

        void main() {
            float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
            float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
            float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
            float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `;

    const vorticityFrag = `
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
        uniform vec2 texelSize;

        void main() {
            float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
            float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
            float T = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x;
            float B = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x;
            float C = texture2D(uCurl, vUv).x;

            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;

            vec2 vel = texture2D(uVelocity, vUv).xy;
            gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
        }
    `;

    const pressureFrag = `
        varying vec2 vUv;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
        uniform vec2 texelSize;

        void main() {
            float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
            float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
            float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
            float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `;

    const gradientSubtractFrag = `
        varying vec2 vUv;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
        uniform vec2 texelSize;

        void main() {
            float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
            float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
            float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
            float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `;

    const splatFrag = `
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;

        void main() {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `;

    // --- FBO Management ---
    const fboProps = {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
    };

    const fbos = useMemo(() => {
        const createDoubleFBO = () => ({
            read: new THREE.WebGLRenderTarget(simRes, simRes, fboProps),
            write: new THREE.WebGLRenderTarget(simRes, simRes, fboProps),
            swap: function () {
                const temp = this.read;
                this.read = this.write;
                this.write = temp;
            }
        });

        return {
            velocity: createDoubleFBO(),
            pressure: createDoubleFBO(),
            divergence: new THREE.WebGLRenderTarget(simRes, simRes, fboProps),
            curl: new THREE.WebGLRenderTarget(simRes, simRes, fboProps),
        };
    }, []);

    // --- Materials ---
    const materials = useMemo(() => {
        const createMaterial = (fragShader: string) => new THREE.ShaderMaterial({
            vertexShader: baseVertexShader,
            fragmentShader: fragShader,
            uniforms: {
                texelSize: { value: new THREE.Vector2(1.0 / simRes, 1.0 / simRes) },
                dt: { value: 0.016 },
                // Advection
                uVelocity: { value: null },
                uSource: { value: null },
                dissipation: { value: 0.98 },
                // Splat
                uTarget: { value: null },
                aspectRatio: { value: 1.0 },
                color: { value: new THREE.Vector3() },
                point: { value: new THREE.Vector2() },
                radius: { value: 0.02 }, // Bigger radius for visibility
                // Divergence
                uDivergence: { value: null },
                // Pressure
                uPressure: { value: null },
                // Curl
                uCurl: { value: null },
                curl: { value: 30 },
            },
            depthTest: false,
            depthWrite: false,
        });

        return {
            advection: createMaterial(advectionFrag),
            divergence: createMaterial(divergenceFrag),
            curl: createMaterial(curlFrag),
            vorticity: createMaterial(vorticityFrag),
            pressure: createMaterial(pressureFrag),
            gradientSubtract: createMaterial(gradientSubtractFrag),
            splat: createMaterial(splatFrag),
        };
    }, []);

    // --- Scene Setup ---
    const scene = useMemo(() => {
        const s = new THREE.Scene();
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
        s.add(mesh);
        return s;
    }, []);
    const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

    // --- Interaction State ---
    const lastMouse = useRef(new THREE.Vector2(0, 0));
    const isFirstFrame = useRef(true);

    // --- Simulation Loop ---
    useFrame((state) => {
        const { pointer } = state;

        // 1. Calculate Mouse Velocity
        // Pointer is [-1, 1], map to [0, 1] for shaders
        const currentMouse = new THREE.Vector2(
            pointer.x * 0.5 + 0.5,
            pointer.y * 0.5 + 0.5
        );

        if (isFirstFrame.current) {
            lastMouse.current.copy(currentMouse);
            isFirstFrame.current = false;
        }

        const velocity = new THREE.Vector2()
            .subVectors(currentMouse, lastMouse.current)
            .multiplyScalar(800.0); // Amplify weak movements

        // 2. Splat (Apply Input)
        if (velocity.lengthSq() > 0) {
            materials.splat.uniforms.uTarget.value = fbos.velocity.read.texture;
            materials.splat.uniforms.aspectRatio.value = size.width / size.height;
            materials.splat.uniforms.point.value.copy(currentMouse);
            materials.splat.uniforms.color.value.set(velocity.x, velocity.y, 1.0);
            materials.splat.uniforms.radius.value = 0.005; // Tight brush

            gl.setRenderTarget(fbos.velocity.write);
            scene.children[0].material = materials.splat;
            gl.render(scene, camera);
            fbos.velocity.swap();
        }

        lastMouse.current.copy(currentMouse);

        // 3. Curl (Vorticity Confinement Pt 1)
        materials.curl.uniforms.uVelocity.value = fbos.velocity.read.texture;
        gl.setRenderTarget(fbos.curl);
        scene.children[0].material = materials.curl;
        gl.render(scene, camera);

        // 4. Vorticity (Vorticity Confinement Pt 2)
        materials.vorticity.uniforms.uVelocity.value = fbos.velocity.read.texture;
        materials.vorticity.uniforms.uCurl.value = fbos.curl.texture;
        gl.setRenderTarget(fbos.velocity.write);
        scene.children[0].material = materials.vorticity;
        gl.render(scene, camera);
        fbos.velocity.swap();

        // 5. Divergence
        materials.divergence.uniforms.uVelocity.value = fbos.velocity.read.texture;
        gl.setRenderTarget(fbos.divergence);
        scene.children[0].material = materials.divergence;
        gl.render(scene, camera);

        // 6. Clear Pressure
        // (Optional: can keep pressure for stability, but clearing often safer)
        gl.setRenderTarget(fbos.pressure.write);
        gl.clear();
        fbos.pressure.swap();

        // 7. Pressure (Jacobi Iteration)
        materials.pressure.uniforms.uDivergence.value = fbos.divergence.texture;
        scene.children[0].material = materials.pressure;

        for (let i = 0; i < 20; i++) {
            materials.pressure.uniforms.uPressure.value = fbos.pressure.read.texture;
            gl.setRenderTarget(fbos.pressure.write);
            gl.render(scene, camera);
            fbos.pressure.swap();
        }

        // 8. Gradient Subtract (Final Step)
        materials.gradientSubtract.uniforms.uPressure.value = fbos.pressure.read.texture;
        materials.gradientSubtract.uniforms.uVelocity.value = fbos.velocity.read.texture;
        gl.setRenderTarget(fbos.velocity.write);
        scene.children[0].material = materials.gradientSubtract;
        gl.render(scene, camera);
        fbos.velocity.swap();

        // 9. Advection (Move everything)
        // Advect Velocity
        materials.advection.uniforms.uVelocity.value = fbos.velocity.read.texture;
        materials.advection.uniforms.uSource.value = fbos.velocity.read.texture;
        materials.advection.uniforms.dt.value = 0.016;
        materials.advection.uniforms.dissipation.value = 0.98; // Trails fade out

        gl.setRenderTarget(fbos.velocity.write);
        scene.children[0].material = materials.advection;
        gl.render(scene, camera);
        fbos.velocity.swap();

        // Output results
        gl.setRenderTarget(null);
        onTextureUpdate(fbos.velocity.read.texture);
    });

    return null;
};
