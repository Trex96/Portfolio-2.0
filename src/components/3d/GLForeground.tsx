'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LandoHead } from './LandoHead';

export function GLForeground() {
    // const [fluidTexture, setFluidTexture] = useState<THREE.Texture | null>(null);

    return (
        <>
            {/* 2. Lando Head (Foreground Model) - Fluid interaction disabled */}
            <LandoHead
                fluidTexture={null}
            />
        </>
    );
}
