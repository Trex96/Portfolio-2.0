'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { FluidSimulation } from './FluidSimulation';
import { BackgroundMaterial } from './shaders/BackgroundMaterial';
import { SimplexNoiseMaterial } from './shaders/SimplexNoiseMaterial';
import { extend } from '@react-three/fiber';

extend({ BackgroundMaterial, SimplexNoiseMaterial });


export function GLBackground() {
    const { size, viewport, gl, camera } = useThree();
    const [fluidTexture, setFluidTexture] = useState<THREE.Texture | null>(null);

    // --- 1. Noise Generation Setup (Off-screen) ---
    // This pass generates the CLEAN noise (no distortion yet)
    // The red channel holds the "shape" of the blobs
    const noiseScene = useMemo(() => new THREE.Scene(), []);
    const noiseCamera = useMemo(() => {
        const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        cam.position.z = 1; // Crucial: Set above the plane
        return cam;
    }, []);
    const noiseTarget = useMemo(() => new THREE.WebGLRenderTarget(512, 512, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType // [NEW] High precision for smooth gradients
    }), []);

    // Noise Material Reference
    const noiseMaterialRef = useRef<any>(null);

    // --- 2. Main Background Setup ---
    // The final shader that combines Noise + Fluid Distortion
    const bgMaterialRef = useRef<any>(null);

    // --- 3. Animation Loop ---
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        const reveal = (window as any).landoGL?.reveal ?? 0;

        // A. Pass 2: Render Clean Noise to FBO
        if (noiseMaterialRef.current) {
            noiseMaterialRef.current.uTime = time;
            noiseMaterialRef.current.uAspect = size.width / size.height;

            // Site-Match Professional Scaling Strategy:
            // 1. Cap DPR at 1.25 on desktop to allow "Soft-Scaling" AA
            const cappedDPR = size.width > 768 ? Math.min(viewport.dpr, 1.25) : Math.min(viewport.dpr, 2.0);
            gl.setPixelRatio(cappedDPR);

            // 2. Force Noise Target to Logical Resolution (1:1 with size)
            // This allows hardware bilinear filtering (LinearFilter) to create 
            // perfect sub-pixel ramps between logical texels.
            const targetW = size.width;
            const targetH = size.height;

            if (noiseTarget.width !== targetW || noiseTarget.height !== targetH) {
                noiseTarget.setSize(targetW, targetH);
            }

            gl.setRenderTarget(noiseTarget);
            gl.setClearColor(new THREE.Color(0, 0, 0), 0);
            gl.render(noiseScene, noiseCamera);
            gl.setRenderTarget(null);
        }

        // B. Pass 3: Final Composition (Distortion & Coloring)
        if (bgMaterialRef.current) {
            bgMaterialRef.current.uTime = time;
            bgMaterialRef.current.uReveal = reveal;
            bgMaterialRef.current.uAspect = size.width / size.height;
            bgMaterialRef.current.uResolution = new THREE.Vector2(size.width, size.height); // [NEW] Pass resolution

            // Pass the clean noise texture we just rendered
            bgMaterialRef.current.tBackgroundNoise = noiseTarget.texture;

            // Pass the fluid velocity texture (for distortion/warping)
            if (fluidTexture) {
                bgMaterialRef.current.tCursorEffect = fluidTexture;
            } else {
                bgMaterialRef.current.tCursorEffect = null;
            }
            // Distortion Intensity (Calibrated to site precise 0.02)
            bgMaterialRef.current.uDistortIntensity = 0.02;
            // Stroke Width (Calibrated to 1 physical pixel scale)
            bgMaterialRef.current.uStrokeWidth = 2.0; // 2 physical pixels thick
        }
    });

    return (
        <>
            {/* 1. Fluid Simulation (Pass 1) */}
            {/* Generates variables velocity/pressure for the "Cursor Effect" */}
            <FluidSimulation onTextureUpdate={setFluidTexture} />

            {/* 2. Background Noise Generation (The Rings) */}
            {createPortal(
                <mesh>
                    <planeGeometry args={[2, 2]} />
                    <simplexNoiseMaterial
                        ref={noiseMaterialRef}
                        uDetail={3.0} // CALIBRATED: 3.0 rings as per lando site
                        uScale={1.5}
                        uSpeed={0.1}
                    />
                </mesh>,
                noiseScene
            )}

            {/* 3. Final Composition (The Liquid Surface) */}
            <mesh scale={[viewport.width * 1.5, viewport.height * 1.5, 1]} position={[0, 0, -1]}>
                <planeGeometry />
                <backgroundMaterial
                    ref={bgMaterialRef}
                    key={BackgroundMaterial.key}
                    transparent={true}
                    uReveal={0}
                    uCursorIntensity={1.0}
                    uDistortIntensity={0.02}
                    uStrokeWidth={1.25}      // [TUNED] Thinner strokes as requested (was 2.0)
                    uDetail={3.0}
                    COLOR_BG_LIGHT="#F8F8F3"
                    COLOR_GEL_FILL="#F8F8F3"
                    COLOR_GEL_STROKE="#CBCBB9"
                    COLOR_BG_DARK="#282C20"
                    COLOR_GEL_FILL_DARK="#363B25"
                    COLOR_CURSOR_FOREGROUND="#FFFFFF"
                />
            </mesh>
        </>
    );
}
