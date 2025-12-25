'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Scene } from '../3d/Scene';
import { GLBackground } from '../3d/GLBackground';
import { GLForeground } from '../3d/GLForeground';
import { CircuitIcon } from '../ui/CircuitIcon';
import { HelmetIcon } from '../ui/HelmetIcon';
import { useSplitText } from '@/hooks/useSplitText';
import BlobCursor from '../3d/blob';


export function HomeHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const nextRaceRef = useRef<HTMLDivElement>(null);
    const tabletTextRef = useRef<HTMLDivElement>(null);

    // Text animation refs using the custom hook
    const nextRaceTitleRef = useSplitText('chars', 0.5, 0.03);
    const melbourneTextRef = useSplitText('chars', 0.7, 0.02);

    // Touch controls state
    const [isScrollLocked, setIsScrollLocked] = useState(false);

    gsap.registerPlugin(useGSAP, ScrollTrigger);

    useGSAP(() => {
        // Initialize landoGL global for shaders
        if (typeof window !== 'undefined') {
            (window as any).landoGL = (window as any).landoGL || { reveal: 0 };
        }

        // Entrance animations timeline
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // Global reveal animation for shaders
        tl.to((window as any).landoGL, {
            reveal: 1,
            duration: 2.5,
            ease: 'power2.out',
            onUpdate: () => {
                // Force a re-render or just let the GL loop pick it up
            }
        }, 0);

        // Next Race card entrance
        if (nextRaceRef.current) {
            tl.fromTo(nextRaceRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 1 },
                1.5 // Start after reveal starts
            );
        }

        // Tablet text entrance  
        if (tabletTextRef.current) {
            tl.fromTo(tabletTextRef.current,
                { scale: 1.1, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.2 },
                "<" // Start with previous animation
            );
        }

        // Sticky pin animation (matches original site scroll behavior)
        if (containerRef.current) {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: '+=100%',
                pin: true,
                pinSpacing: false,
                scrub: 1,
            });
        }
    }, { scope: containerRef, dependencies: [] });

    // Toggle scroll lock for touch controls
    const toggleScrollLock = () => {
        setIsScrollLocked(prev => !prev);

        // Toggle body scroll
        if (!isScrollLocked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    };

    return (
        <div
            className="sticky-track home-hero"
            data-sticky-hero="track"
            data-gl-track="head"
        >
            <div className="sticky-item home-hero">
                <section ref={containerRef} className="s home-hero" data-hero-animation-container="" style={{ cursor: 'none' }}>
                    <div className="c home-hero">
// BlobCursor removed from here

                        {/* Screen reader titles */}
                        <div className="sr-only">
                            <h1>Lando Norris</h1>
                            <h2>2025 McLaren Formula 1 Driver</h2>
                        </div>

                        {/* WebGL Canvas - Absolute Overlay */}
                        <div className="gl-canvas" data-gl="head" data-sticky-hero="canvas" style={{ zIndex: 1 }}>
                            <Scene className="w-full h-full pointer-events-none">
                                <GLBackground />
                            </Scene>
                            <BlobCursor
                                blobType="circle"
                                fillColor="#C0C0C0" // Silver for contrast
                                innerColor="#ffffff"
                                trailCount={3}
                                sizes={[60, 125, 75]}
                                innerSizes={[20, 35, 25]}
                                opacities={[1, 1, 1]}
                                shadowColor="#000000"
                                shadowBlur={0}
                                shadowOffsetX={0}
                                shadowOffsetY={0}
                                filterStdDeviation={30}
                                useFilter={true}
                                fastDuration={0.1}
                                slowDuration={0.5}
                                zIndex={10} // Blob sits in middle
                                // @ts-ignore
                                mixBlendMode="difference"
                            />

                            {/* WebGL Foreground (Lando Head) - Z-Index 50 */}
                            <div className="gl-canvas foreground" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 50
                            }}>
                                <Scene className="w-full h-full pointer-events-none">
                                    <GLForeground />
                                </Scene>
                            </div>
                        </div>

                        {/* Next Race Section - Bottom Left */}
                        <div ref={nextRaceRef} className="home-hero-next-race-w">
                            {/* Outline SVG */}
                            <div className="home-hero-next-race-outline w-embed">
                                <svg width="119" height="244" viewBox="0 0 119 244" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M118.5 6v232a5.5 5.5 0 0 1-5.5 5.5H6A5.5 5.5 0 0 1 .5 238V25A5.5 5.5 0 0 1 6 19.5h46.346c4.695 0 9.167-2 12.297-5.498l7.46-8.337A15.5 15.5 0 0 1 83.653.5H113a5.5 5.5 0 0 1 5.5 5.5Z"
                                        stroke="currentColor" />
                                </svg>
                            </div>

                            {/* Next Race Top */}
                            <div className="home-hero-next-race-top">
                                <div ref={nextRaceTitleRef} data-anim-high="right, lime" split-text="lines" className="text-eyebrow">Next Race</div>
                            </div>

                            {/* Race Row 1 - Circuit */}
                            <div className="home-hero-next-race-row is-1">
                                <a href="/calendar" className="home-hero-next-race-row w-inline-block">
                                    {/* Circuit Icon */}
                                    <div className="home-hero-next-race-rive-w">
                                        <CircuitIcon className="home-hero-next-race-rive" />
                                    </div>

                                    {/* Race Name */}
                                    <div className="eyebrow-w gap0-25">
                                        <div ref={melbourneTextRef} data-anim-high="right, lime" split-text="lines" className="text-eyebrow">Melbourne</div>
                                        <div data-anim-high="right, lime" split-text="lines" className="text-eyebrow">GP</div>
                                    </div>
                                </a>
                            </div>

                            {/* Separator Line */}
                            <div className="home-hero-next-race-line"></div>

                            {/* Race Row 2 - McLaren */}
                            <div className="home-hero-next-race-row is-2" data-gl-helmet="hover">
                                {/* Helmet Icon */}
                                <div className="base-helmet-rive-w">
                                    <HelmetIcon className="base-helmet-rive" autoplay={true} />
                                </div>

                                {/* McLaren Text */}
                                <div className="eyebrow-w hero-next-race">
                                    <div data-anim-high="right, lime" split-text="lines" className="text-eyebrow">McLaren F1<br />Since 2019</div>
                                </div>
                            </div>
                        </div>

                        {/* Tablet/Mobile Hero Text */}
                        <div className="home-hero-tablet-hero-text">
                            {/* Text Image - Shows on tablet/mobile */}
                            <div ref={tabletTextRef} data-hero-anim="mob1" className="home-hero-tablet-text-w">
                                <Image
                                    src="https://cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/67e968a40345883f8ccc1b05_ln4-lando-norris-text-mobile.svg"
                                    alt="Lando Norris Text"
                                    width={800}
                                    height={400}
                                    className="image"
                                    priority
                                />
                            </div>

                            {/* McLaren F1 - Mobile only */}
                            <div data-hero-anim="mob2" className="eyebrow-w hero-next-race mobile-only">
                                <div data-anim-high="right, lime" split-text="lines" className="text-eyebrow">McLaren F1<br />Since 2019</div>
                            </div>
                        </div>

                        {/* Touch Controls - Mobile/Tablet */}
                        <div className="home-hero-touch-controls-w" data-home-swipe-wrap="">
                            <button
                                title="Toggle Swipe"
                                data-home-swipe-toggle=""
                                className="btn-w is-touch-swipe"
                                onClick={toggleScrollLock}
                            >
                                <div className="btn-inner is-touch-swipe">
                                    <div className="btn-icon-w is-touch-swipe">
                                        {/* Unlocked Icon */}
                                        <div className={`btn-rive-w is-touch-swipe is-unlocked w-embed ${isScrollLocked ? 'hidden' : ''}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.51 15.32">
                                                <g>
                                                    <path d="M4.9 15.32c-.37 0-.73-.07-1.07-.2s-.65-.34-.92-.61L.12 10.58a.747.747 0 0 1 .2-1.02l1.17-.8c.22-.22.52-.22.81-.13L2.27.77c0-.22.08-.4.23-.55S2.84 0 3.05 0s.39.07.54.22c.14.15.22.33.22.55v10.22s.02 1.13.02 1.55.28 1.26 1.08 1.26h4.78c.61 0 1.14-.2 1.57-.61.49-.47.73-1.15.73-1.83V7.15c0-.22.08-.4.23-.55s.34-.22.55-.22.39.07.54.22c.14.15.22.33.22.55v4.34c0 1.07-.37 1.98-1.11 2.72s-1.65 1.11-2.72 1.11H4.9Z" fill="currentColor" />
                                                    <path d="M5.51 7.92V3.83c0-.22.08-.4.23-.55.15-.14.34-.22.55-.22s.39.07.54.22c.14.15.22.33.22.55v4.09H5.51ZM8.73 7.92V5.11c0-.22.08-.4.23-.55s.34-.22.55-.22.39.07.54.22c.14.15.22.33.22.55v2.81H8.73Z" fill="currentColor" />
                                                </g>
                                            </svg>
                                        </div>

                                        {/* Locked Icon */}
                                        <div className={`btn-rive-w is-touch-swipe is-locked w-embed ${!isScrollLocked ? 'hidden' : ''}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8.51 8.51">
                                                <g>
                                                    <path d="M7.89 7.89.63.63M.63 7.89 7.89.63" stroke="currentColor" strokeWidth="0.17rem" />
                                                </g>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Touch Control Description */}
                            <div className="home-hero-touch-desc-w">
                                <div data-home-swipe-desc="unlocked" className={`touch-desc-inner ${isScrollLocked ? 'hidden' : ''}`}>
                                    <div className="text-eyebrow touch-desc">Tap to lock</div>
                                </div>
                                <div data-home-swipe-desc="locked" className={`touch-desc-inner ${!isScrollLocked ? 'hidden' : ''}`}>
                                    <div className="text-eyebrow touch-desc">Back to scroll</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
}
