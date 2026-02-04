'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrthographicCamera } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';

interface SceneProps {
    children: React.ReactNode;
    className?: string;
}

export function Scene({ children, className }: SceneProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className={className} />;

    return (
        <div className={className}>
            <Canvas
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                    outputColorSpace: THREE.SRGBColorSpace
                }}
                dpr={[1, 2]}
            >
                {/* Fixed Full-Screen Orthographic Camera */}
                <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={1} />
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </Canvas>
        </div>
    );
}
