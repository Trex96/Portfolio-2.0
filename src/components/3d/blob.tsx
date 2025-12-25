'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './blob.css';

interface BlobCursorProps {
    blobType?: 'circle';
    fillColor?: string;
    trailCount?: number;
    sizes?: number[];
    innerSizes?: number[];
    innerColor?: string;
    opacities?: number[];
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    filterStdDeviation?: number;
    useFilter?: boolean;
    fastDuration?: number;
    slowDuration?: number;
    zIndex?: number;
    mixBlendMode?: string;
}

export default function BlobCursor({
    fillColor = '#5227FF',
    trailCount = 3,
    sizes = [60, 125, 75], // Main blob sizes
    opacities = [0.6, 0.6, 0.6],
    fastDuration = 0.1,
    slowDuration = 0.5,
    zIndex = 100,
    mixBlendMode = 'normal',
}: BlobCursorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLDivElement>(null);
    const blobsRef = useRef<HTMLDivElement[]>([]);
    const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // GSAP Setters
    const moveXRefs = useRef<any[]>([]);
    const moveYRefs = useRef<any[]>([]);

    useGSAP(() => {
        // Initialize GSAP QuickTo for performance
        blobsRef.current.forEach((blob, index) => {
            if (!blob) return;

            // Staggered duration/lag for the "trail" effect
            // 0 is fastest (leader), subsequent are slower
            const duration = index === 0 ? fastDuration : slowDuration + (index * 0.1);

            // Ensure blobs are centered on the cursor
            gsap.set(blob, { xPercent: -50, yPercent: -50 });

            moveXRefs.current[index] = gsap.quickTo(blob, "x", { duration: duration, ease: "power3.out" });
            moveYRefs.current[index] = gsap.quickTo(blob, "y", { duration: duration, ease: "power3.out" });
        });

        const handleMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            moveXRefs.current.forEach((moveX) => moveX(clientX));
            moveYRefs.current.forEach((moveY) => moveY(clientY));

            // Fade in on move
            gsap.to(mainRef.current, { opacity: 1, duration: 0.2, overwrite: 'auto' });

            // Clear previous timeout
            if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

            // Set idle timeout (fade out when still)
            idleTimeoutRef.current = setTimeout(() => {
                gsap.to(mainRef.current, { opacity: 0, duration: 0.5, overwrite: 'auto' });
            }, 300); // 300ms stillness = idle
        };

        window.addEventListener('mousemove', handleMove);

        return () => {
            window.removeEventListener('mousemove', handleMove);
        };
    }, { scope: containerRef });

    return (
        <div
            ref={containerRef}
            className="blob-container"
            style={{
                zIndex: zIndex,
                position: 'fixed', // Fixed to viewport so clientX/Y map correctly
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                mixBlendMode: mixBlendMode as any // Ensure visibility
            }}
        >
            {/* SVG Filter for Gooey Effect */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="30" />
                    <feColorMatrix
                        in="blur"
                        mode="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                        result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
            </svg>

            <div
                ref={mainRef}
                className="blob-main"
                style={{ filter: 'url(#goo)' }} // Removed initial opacity: 0 to debug visibility
            >
                {Array.from({ length: trailCount }).map((_, i) => (
                    <div
                        key={i}
                        ref={(el) => { if (el) blobsRef.current[i] = el; }}
                        className="blob"
                        style={{
                            width: sizes[i] || sizes[0],
                            height: sizes[i] || sizes[0],
                            backgroundColor: fillColor,
                            opacity: opacities[i] || opacities[0],
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)' // Center anchor
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
