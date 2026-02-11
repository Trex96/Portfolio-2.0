'use client';

import { ReactLenis } from 'lenis/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

/**
 * SmoothScroll
 * 
 * Global smooth scrolling provider using 'lenis'.
 * This gives the site its characteristic high-end "heavy" scroll feel.
 * Also handles sync between Lenis and GSAP ScrollTrigger.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
    const lenisRef = useRef(null);

    useEffect(() => {
        // Register GSAP ScrollTrigger
        gsap.registerPlugin(ScrollTrigger);
    }, []);

    return (
        <ReactLenis
            ref={lenisRef}
            root
            options={{
                // "Heavy" scroll feel configuration
                lerp: 0.1,
                duration: 1.2,
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
            }}
        >
            {children}
        </ReactLenis>
    );
}
