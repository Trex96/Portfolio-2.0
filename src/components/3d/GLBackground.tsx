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
    const noiseScene = useMemo(() => new THREE.Scene(), []);
    const noiseCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
    const noiseTarget = useMemo(() => new THREE.WebGLRenderTarget(512, 512, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
    }), []);

    // Noise Material Reference
    const noiseMaterialRef = useRef<any>(null);

    // --- 2. Main Background Setup ---
    const bgMaterialRef = useRef<any>(null);

    // --- 3. Mouse Tracking for Pace and Velocity ---
    const prevMouse = useRef(new THREE.Vector2());
    const mouseVelocity = useRef(new THREE.Vector2());
    const mousePace = useRef(0);

    // --- 4. Animation Loop ---
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        const reveal = (window as any).landoGL?.reveal ?? 0;
        const pointer = state.pointer; // Normalized [-1, 1]

        // Calculate mouse velocity and pace (speed)
        mouseVelocity.current.subVectors(pointer, prevMouse.current);
        const dist = mouseVelocity.current.length();
        const targetPace = Math.min(dist * 50, 1.0); // Scale up distance for pace
        mousePace.current += (targetPace - mousePace.current) * 0.1; // Smooth it
        prevMouse.current.copy(pointer);

        // A. Render Noise to FBO
        if (noiseMaterialRef.current) {
            noiseMaterialRef.current.uTime = time;
            noiseMaterialRef.current.uReveal = reveal;
            noiseMaterialRef.current.uAspect = size.width / size.height;

            // Pass mouse coordinates (normalized -1 to 1)
            noiseMaterialRef.current.uMouseCoords.set(pointer.x, pointer.y);
            noiseMaterialRef.current.uMousePace = mousePace.current;
            noiseMaterialRef.current.uMouseVelocity.copy(mouseVelocity.current);

            // Resize target if needed
            if (noiseTarget.width !== size.width || noiseTarget.height !== size.height) {
                noiseTarget.setSize(size.width, size.height);
            }

            gl.setRenderTarget(noiseTarget);
            gl.render(noiseScene, noiseCamera);
            gl.setRenderTarget(null);
        }

        // B. Update Background Material
        if (bgMaterialRef.current) {
            bgMaterialRef.current.uTime = time;
            bgMaterialRef.current.uReveal = reveal;
            bgMaterialRef.current.uAspect = size.width / size.height;

            // Pass the generated noise texture
            bgMaterialRef.current.tBackgroundNoise = noiseTarget.texture;

            // Pass fluid texture
            if (fluidTexture) {
                bgMaterialRef.current.tCursorEffect = fluidTexture;
            }
        }
    });

    return (
        <>
            {/* 1. Fluid Simulation */}
            <FluidSimulation onTextureUpdate={setFluidTexture} />

            {/* 2. Noise Generation Scene (Portal) */}
            {createPortal(
                <mesh>
                    <planeGeometry args={[2, 2]} />
                    {/* @ts-ignore */}
                    <simplexNoiseMaterial
                        ref={noiseMaterialRef}
                        attach="material"
                        SCALE={1.0}
                        SPEED={0.2}
                        DISTORT_SCALE={1.0}
                        DISTORT_INTENSITY={0.5}
                        NOISE_DETAIL={3.0}
                        REVEAL_SIZE={25.0} // Sync with shader defaults
                    />
                </mesh>,
                noiseScene
            )}

            {/* 3. Main Background Plane */}
            <mesh scale={[viewport.width * 1.5, viewport.height * 1.5, 1]} position={[0, 0, -1]}>
                <planeGeometry args={[1, 1]} />
                {/* @ts-ignore */}
                <backgroundMaterial
                    ref={bgMaterialRef}
                    attach="material"
                    transparent={false}
                    depthWrite={false}
                    COLOR_BACKGROUND={new THREE.Color('#282c20')}
                    COLOR_FOREGROUND={new THREE.Color('#f4f4ed')}
                    COLOR_CURSOR_BACKGROUND={new THREE.Color('#7a206a')}
                    COLOR_CURSOR_FOREGROUND={new THREE.Color('#ffd600')}
                    COLOR_CURSOR_OUTLINE={new THREE.Color('#d2ff00')}
                />
            </mesh>

            {/* 4. Lando Head (Moved to GLForeground for z-indexing) */}

            {/* 5. Blob Cursor Overlay (HTML) - Moved to HomeHero for stacking context */}
        </>
    );
}
