import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';

/**
 * Fluid Simulation Shaders
 * Ported strictly from lando.OFF+BRAND.js (p9 class)
 */

const BASE_VERTEX = `
attribute vec3 position;
varying vec2 vUv;

precision highp float;

void main(){
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}
`;

const ADVECTION_FRAG = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform float dissipation;
uniform bool isBFECC;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 vUv;

void main(){
    vec2 uv = vUv;
    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;

    if(isBFECC == false){
        vec2 vel = texture2D(velocity, uv).xy;
        vec2 uv2 = uv - vel * dt * ratio;
        vec2 newVel = texture2D(velocity, uv2).xy;
        gl_FragColor = vec4(newVel, 0.0, 0.0);
    } else {
        vec2 spot_new = uv;
        vec2 vel_old = texture2D(velocity, uv).xy;
        
        vec2 spot_old = spot_new - vel_old * dt * ratio;
        vec2 vel_new1 = texture2D(velocity, spot_old).xy;

        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
        vec2 error = spot_new2 - spot_new;

        vec2 spot_new3 = spot_new - error / 2.0;
        vec2 vel_2 = texture2D(velocity, spot_new3).xy;

        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
        vec2 newVel2 = texture2D(velocity, spot_old2).xy * dissipation; 
        gl_FragColor = vec4(newVel2, 0.0, 0.0);
    }
}
`;

const EXTERNAL_FORCE_VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;

void main(){
    vec2 pos = position.xy * scale * 2.0 * px + center;
    vUv = uv;
    gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const EXTERNAL_FORCE_FRAG = `
precision highp float;
uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;

void main(){
    vec2 circle = (vUv - 0.5) * 2.0;
    float d = 1.0 - min(length(circle), 1.0);
    d *= d; // Quadratic falloff
    gl_FragColor = vec4(force * d, 0, 1);
}
`;

const DIVERGENCE_FRAG = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 vUv;

void main(){
    vec2 uv = vUv;
    float x0 = texture2D(velocity, uv - vec2(px.x, 0)).x;
    float x1 = texture2D(velocity, uv + vec2(px.x, 0)).x;
    float y0 = texture2D(velocity, uv - vec2(0, px.y)).y;
    float y1 = texture2D(velocity, uv + vec2(0, px.y)).y;
    float divergence = (x1 - x0 + y1 - y0) / 2.0;

    gl_FragColor = vec4(divergence / dt, 0.0, 0.0, 1.0);
}
`;

const POISSON_FRAG = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform float straightness;
uniform vec2 px;
varying vec2 vUv;

void main(){    
    vec2 uv = vUv;
    float p0 = texture2D(pressure, uv + vec2(px.x * 2.0,  0)).r;
    float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0)).r;
    float p2 = texture2D(pressure, uv + vec2(0, px.y * 2.0 )).r;
    float p3 = texture2D(pressure, uv - vec2(0, px.y * 2.0 )).r;
    float div = texture2D(divergence, uv).r;
    
    float newP = (p0 + p1 + p2 + p3) / (4.0 + straightness) - div;
    gl_FragColor = vec4(newP, 0.0, 0.0, 1.0);
}
`;

const PRESSURE_GRADIENT_FRAG = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 vUv;

void main(){
    vec2 uv = vUv;
    float p0 = texture2D(pressure, uv + vec2(px.x, 0)).r;
    float p1 = texture2D(pressure, uv - vec2(px.x, 0)).r;
    float p2 = texture2D(pressure, uv + vec2(0, px.y)).r;
    float p3 = texture2D(pressure, uv - vec2(0, px.y)).r;

    vec2 v = texture2D(velocity, uv).xy;
    vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
    v = v - gradP * dt;
    gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

// ORIGINAL tN shader logic
const OUTPUT_FRAG = `
precision highp float;
uniform sampler2D velocity;
varying vec2 vUv;

void main(){
    vec2 uv = vUv;
    vec2 vel = texture2D(velocity, uv).xy;
    float len = length(vel);
    vel = vel * 0.5 + 0.5;
    
    vec3 color = vec3(vel.x, vel.y, 1.0);
    color = mix(vec3(1.0), color, len);

    gl_FragColor = vec4(color, 1.0);
}
`;

interface FluidSimulationProps {
    onTextureUpdate: (texture: THREE.Texture) => void;
}

export const FluidSimulation: React.FC<FluidSimulationProps> = ({ onTextureUpdate }) => {
    const { gl, size } = useThree();

    // STRICTLY MATCH original p9 class options
    const options = useMemo(() => ({
        iterations_poisson: 4,
        dissipation: 0.96,
        mouse_force: 50,
        resolution: 0.1, // Original resolution
        cursor_size: 18, // Original cursor size
        straightness: 1,
        dt: 0.014,
        isBFECC: true,
    }), []);

    const simWidth = Math.round(size.width * options.resolution);
    const simHeight = Math.round(size.height * options.resolution);

    const cellScale = useMemo(() => {
        return new THREE.Vector2(1 / simWidth, 1 / simHeight);
    }, [simWidth, simHeight]);

    // Check device type for HalfFloat vs Float type support if needed, but HalfFloat is generally safe for modern WebGL2
    const fbOptions = {
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false,
        depthBuffer: false,
    };

    const fbos = useMemo(() => {
        return {
            vel0: new THREE.WebGLRenderTarget(simWidth, simHeight, fbOptions),
            vel1: new THREE.WebGLRenderTarget(simWidth, simHeight, fbOptions),
            pressure0: new THREE.WebGLRenderTarget(simWidth, simHeight, fbOptions),
            pressure1: new THREE.WebGLRenderTarget(simWidth, simHeight, fbOptions),
            divergence: new THREE.WebGLRenderTarget(simWidth, simHeight, fbOptions),
            final: new THREE.WebGLRenderTarget(size.width, size.height, {
                ...fbOptions,
                samples: 2
            }),
        };
    }, [simWidth, simHeight, size.width, size.height]);

    const quadGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
    const forceGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
    const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const scene = useMemo(() => new THREE.Scene(), []);

    const advectionMaterial = useMemo(() => new THREE.RawShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: ADVECTION_FRAG,
        uniforms: {
            velocity: { value: null },
            dt: { value: options.dt },
            dissipation: { value: options.dissipation },
            isBFECC: { value: options.isBFECC },
            fboSize: { value: new THREE.Vector2(simWidth, simHeight) },
            px: { value: cellScale },
        }
    }), [simWidth, simHeight, cellScale, options]);

    const forceMaterial = useMemo(() => new THREE.RawShaderMaterial({
        vertexShader: EXTERNAL_FORCE_VERTEX,
        fragmentShader: EXTERNAL_FORCE_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
            px: { value: cellScale },
            force: { value: new THREE.Vector2() },
            center: { value: new THREE.Vector2() },
            scale: { value: new THREE.Vector2(options.cursor_size, options.cursor_size) },
        }
    }), [cellScale, options.cursor_size]);

    const divergenceMaterial = useMemo(() => new THREE.RawShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: DIVERGENCE_FRAG,
        uniforms: {
            velocity: { value: null },
            dt: { value: options.dt },
            px: { value: cellScale },
        }
    }), [cellScale, options.dt]);

    const poissonMaterial = useMemo(() => new THREE.RawShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: POISSON_FRAG,
        uniforms: {
            pressure: { value: null },
            divergence: { value: null },
            straightness: { value: options.straightness },
            px: { value: cellScale },
        }
    }), [cellScale, options.straightness]);

    const gradientMaterial = useMemo(() => new THREE.RawShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: PRESSURE_GRADIENT_FRAG,
        uniforms: {
            pressure: { value: null },
            velocity: { value: null },
            px: { value: cellScale },
            dt: { value: options.dt },
        }
    }), [cellScale, options.dt]);

    const outputMaterial = useMemo(() => new THREE.RawShaderMaterial({
        vertexShader: BASE_VERTEX,
        fragmentShader: OUTPUT_FRAG,
        uniforms: {
            velocity: { value: null },
        }
    }), []);

    const passMesh = useMemo(() => new THREE.Mesh(quadGeometry, advectionMaterial), [quadGeometry, advectionMaterial]);
    const forceMesh = useMemo(() => new THREE.Mesh(forceGeometry, forceMaterial), [forceGeometry, forceMaterial]);

    const mouse = useRef({
        coords: new THREE.Vector2(),
        coords_old: new THREE.Vector2(),
        diff: new THREE.Vector2(),
        isIdle: true,
    });

    const idleCursor = useRef(new THREE.Vector2());
    const idleProgress = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            const nx = (clientX / size.width) * 2 - 1;
            const ny = -((clientY / size.height) * 2 - 1);
            mouse.current.coords.set(nx, ny);
            mouse.current.isIdle = false;
            // Original has 2500ms timeout for idleness
            if ((window as any).idleTimeout) clearTimeout((window as any).idleTimeout);
            (window as any).idleTimeout = setTimeout(() => {
                mouse.current.isIdle = true;
                gsap.to(idleProgress.current, { x: 0, y: 0, duration: 0.5 });
            }, 2500);
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);

        // Exact timeline from c9 class idle state
        const idleTl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
        idleTl.fromTo(idleProgress.current, { y: 0 }, { y: 1, duration: 2.5, ease: "none" }, 0);
        idleTl.fromTo(idleProgress.current, { x: 0 }, { x: 1, duration: 2.5, ease: "power1.inOut" }, 0);
        idleTl.fromTo(idleProgress.current, { y: 1 }, { y: 0, duration: 2.5, ease: "none" }, 4);
        idleTl.fromTo(idleProgress.current, { x: 1 }, { x: 0, duration: 2.5, ease: "power1.inOut" }, 4);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            idleTl.kill();
        };
    }, [size.width, size.height]);

    useFrame((state) => {
        if (mouse.current.isIdle) {
            const px = idleProgress.current.x * Math.PI * 4;
            const py = idleProgress.current.y * Math.PI;
            idleCursor.current.x = -Math.cos(px) * 0.75;
            idleCursor.current.y = Math.cos(py) * 0.5;
            mouse.current.coords.copy(idleCursor.current);
        }
        mouse.current.diff.subVectors(mouse.current.coords, mouse.current.coords_old);
        if (mouse.current.coords_old.x === 0 && mouse.current.coords_old.y === 0) mouse.current.diff.set(0, 0);
        mouse.current.coords_old.copy(mouse.current.coords);

        const { vel0, vel1, pressure0, pressure1, divergence, final } = fbos;

        passMesh.material = advectionMaterial;
        advectionMaterial.uniforms.velocity.value = vel0.texture;
        gl.setRenderTarget(vel1);
        gl.render(scene, camera);
        fbos.vel0 = vel1; fbos.vel1 = vel0;

        const forceX = mouse.current.diff.x / 2 * options.mouse_force;
        const forceY = mouse.current.diff.y / 2 * options.mouse_force;
        forceMaterial.uniforms.force.value.set(forceX, forceY);
        forceMaterial.uniforms.center.value.copy(mouse.current.coords);
        gl.autoClear = false;
        gl.setRenderTarget(fbos.vel0);
        gl.render(forceMesh, camera);

        passMesh.material = divergenceMaterial;
        divergenceMaterial.uniforms.velocity.value = fbos.vel0.texture;
        gl.setRenderTarget(divergence);
        gl.render(scene, camera);

        passMesh.material = poissonMaterial;
        poissonMaterial.uniforms.divergence.value = divergence.texture;
        gl.setRenderTarget(pressure0);
        gl.clear();
        for (let i = 0; i < options.iterations_poisson; i++) {
            poissonMaterial.uniforms.pressure.value = fbos.pressure0.texture;
            gl.setRenderTarget(pressure1);
            gl.render(scene, camera);
            let tempP = fbos.pressure0; fbos.pressure0 = fbos.pressure1; fbos.pressure1 = tempP;
        }

        passMesh.material = gradientMaterial;
        gradientMaterial.uniforms.pressure.value = fbos.pressure0.texture;
        gradientMaterial.uniforms.velocity.value = fbos.vel0.texture;
        gl.setRenderTarget(vel1);
        gl.render(scene, camera);
        fbos.vel0 = vel1; fbos.vel1 = vel0;

        passMesh.material = outputMaterial;
        outputMaterial.uniforms.velocity.value = fbos.vel0.texture;
        gl.autoClear = true;
        gl.setRenderTarget(final);
        gl.render(passMesh, camera);
        gl.setRenderTarget(null);
        onTextureUpdate(final.texture || null);
    });

    return null;
};
