'use client';

import { useGLTF } from '@react-three/drei';
import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function LandoHelmet(props: any) {
    const { nodes, materials } = useGLTF('/helmet/models/helmet-21.glb') as any;
    const groupRef = useRef<Group>(null);
    const { viewport } = useThree();

    // Receive mouse from props
    const mouse = props.mouse || { x: 0, y: 0 };

    // --- 0. GSAP Setters ---
    const qRotX = useRef<any>(null);
    const qRotY = useRef<any>(null);

    useGSAP(() => {
        if (!groupRef.current) return;
        qRotX.current = gsap.quickTo(groupRef.current.rotation, "x", { duration: 0.6, ease: "power2.out" });
        qRotY.current = gsap.quickTo(groupRef.current.rotation, "y", { duration: 0.6, ease: "power2.out" });
    }, [groupRef.current]);

    // Clone scene for material manipulation
    const scene = (useGLTF('/helmet/models/helmet-21.glb') as any).scene.clone();

    // Apply solid glossy material to all meshes (Matching original look)
    scene.traverse((child: any) => {
        if (child.isMesh) {
            child.material.wireframe = true;
            child.material.transparent = true;
            child.material.opacity = 0.06;
            child.material.color.set('#000000');
            child.material.roughness = 0.5;
            child.material.metalness = 0.0;
        }
    });

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Helmet rotation based on mouse (Internal Mesh Parallax)
        const baseRotationY = mouse.x * 0.1;
        const baseRotationX = mouse.y * -0.07;

        // Apply rotation using GSAP
        if (qRotY.current) qRotY.current(baseRotationY);
        if (qRotX.current) qRotX.current(baseRotationX + (Math.PI * 0.06));
    });

    // Match LandoHead vertical offset
    const positionY = isMobile ? -viewport.height * 0.05 : -viewport.height * 0.1;
    const currentReveal = (window as any).landoGL?.reveal ?? props.reveal;
    const scale = isMobile ? viewport.height * 0.7 : viewport.height * 0.85;

    return (
        <group
            onPointerEnter={props.onPointerEnter}
            onPointerLeave={props.onPointerLeave}
        >
            <primitive
                object={scene}
                ref={groupRef}
                scale={scale * currentReveal}
                position={[0, positionY, 0]}
                rotation={[0, 0, 0]}
            />
        </group>
    );
}

useGLTF.preload('/helmet/models/helmet-21.glb');

