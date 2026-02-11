'use client';

import { useTexture } from '@react-three/drei'
import { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { HeadMaterial } from './HeadMaterial'
import { extend } from '@react-three/fiber'
extend({ HeadMaterial })

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function LandoHead({ reveal = 0, scrollProgress = 0, helmetHover = 0, fluidTexture = null, mouse = { x: 0, y: 0 } }: any) {
    const meshRef = useRef<THREE.Mesh>(null)
    const { size, camera, viewport } = useThree()

    // Load textures
    const [diffuse, depth, alpha, shadow] = useTexture([
        '/lando.itsoffbrand.io/gl/textures/head/webp/diffuse.webp',
        '/lando.itsoffbrand.io/gl/textures/head/webp/depth.webp',
        '/lando.itsoffbrand.io/gl/textures/head/webp/alpha.webp',
        '/lando.itsoffbrand.io/gl/textures/head/webp/shadow.webp'
    ])

    // --- 0. GSAP Setters ---
    const qRotX = useRef<any>(null);
    const qRotY = useRef<any>(null);

    useGSAP(() => {
        if (!meshRef.current) return;
        qRotX.current = gsap.quickTo(meshRef.current.rotation, "x", { duration: 0.6, ease: "power2.out" });
        qRotY.current = gsap.quickTo(meshRef.current.rotation, "y", { duration: 0.6, ease: "power2.out" });
    }, [meshRef.current]);

    // Responsive logic
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useFrame((state, delta) => {
        if (!meshRef.current) return
        const material = meshRef.current.material as any

        // 1. Rotation (Internal Mesh Parallax)
        const intensity = 0.075 // Matches original params.movement.intensity
        if (qRotY.current) qRotY.current(mouse.x * intensity);
        if (!isMobile && qRotX.current) {
            qRotX.current(mouse.y * -1 * intensity * (1.0 - scrollProgress));
        }

        // 2. Update Uniforms
        material.uTime = state.clock.elapsedTime
        const currentReveal = (window as any).landoGL?.reveal ?? reveal
        material.uReveal = currentReveal
        material.uHelmetHover = helmetHover
        material.tCursorEffect = fluidTexture
        material.uProjectorMatrix = camera.projectionMatrix
        material.uProjectorViewMatrix = camera.matrixWorldInverse
    })

    // Responsive scale & position (Relative to viewport for perfect framing)
    // Head texture has padding, so we scale it up slightly more than 1.0 to fill height
    // Responsive scale & position (Corrected for FOV 15 / Z 3)
    const scale = isMobile ? viewport.height * 0.7 : viewport.height * 0.85;
    const positionY = isMobile ? -viewport.height * 0.05 : -viewport.height * 0.1;

    return (
        <mesh ref={meshRef} position={[0, positionY, 0]} scale={[scale, scale, 1]}>
            <planeGeometry args={[1, 1, 128, 128]} />
            {/* @ts-ignore */}
            <headMaterial
                attach="material"
                tDefaultDiffuse={diffuse}
                tDepth={depth}
                tAlpha={alpha}
                tShadowDiffuse={shadow}
                uDisplacementScale={0.25}
                tCursorEffect={fluidTexture}
                transparent
            />
        </mesh>
    )
}
