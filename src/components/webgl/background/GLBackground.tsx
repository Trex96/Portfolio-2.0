'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { FluidSimulation } from './FluidSimulation';
import { BackgroundMaterial } from './BackgroundMaterial';
import { SimplexNoiseMaterial } from '../shared/SimplexNoiseMaterial';
import { extend } from '@react-three/fiber';

extend({ BackgroundMaterial, SimplexNoiseMaterial });


export function GLBackground() {
    const { size, viewport, gl } = useThree();
    const [fluidTexture, setFluidTexture] = useState<THREE.Texture | null>(null);

    // --- Main Background Setup ---
    const bgMaterialRef = useRef<any>(null);

    // --- Animation Loop ---
    useFrame((state) => {
        const time = state.clock.elapsedTime;
        const reveal = (window as any).landoGL?.reveal ?? 0;

        if (bgMaterialRef.current) {
            bgMaterialRef.current.uTime = time;
            bgMaterialRef.current.uReveal = reveal;
            bgMaterialRef.current.uAspect = size.width / size.height;
            bgMaterialRef.current.uResolution = new THREE.Vector2(size.width, size.height);

            // Pass the fluid velocity texture (for distortion/warping)
            if (fluidTexture) {
                bgMaterialRef.current.tCursorEffect = fluidTexture;
            } else {
                bgMaterialRef.current.tCursorEffect = null;
            }
        }
    });

    return (
        <>
            {/* 1. Fluid Simulation (Pass 1) */}
            <FluidSimulation onTextureUpdate={setFluidTexture} />

            {/* 2. Final Composition (The Liquid Surface) */}
            {/* Scale to Viewport to ensure full coverage with Orthographic Camera */}
            <mesh scale={[viewport.width, viewport.height, 1]} position={[0, 0, -1]}>
                <planeGeometry args={[1, 1]} />
                <backgroundMaterial
                    ref={bgMaterialRef}
                    key={BackgroundMaterial.key}
                    transparent={true}
                    uReveal={0}
                    uCursorIntensity={1.0}
                    uDistortIntensity={0.06}
                    uDetail={12.0}
                    COLOR_BG_LIGHT="#F8F8F3"
                    COLOR_GEL_FILL="#F8F8F3"
                    COLOR_GEL_STROKE="#CBCBB9"
                    COLOR_BG_DARK="#1A1D18"
                    COLOR_GEL_FILL_DARK="#24281E"
                    COLOR_CURSOR_FOREGROUND="#D5F500"
                />
            </mesh>
        </>
    );
}
