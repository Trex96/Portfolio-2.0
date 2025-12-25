'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function ImpactSection() {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section ref={containerRef} className="relative w-full bg-ln-white py-24 md:py-40 px-6 md:px-12 flex justify-center items-center">
            <div className="max-w-[1200px] w-full text-center">
                <div className="mb-12 flex justify-center">
                    {/* Placeholder for small graphic if needed */}
                    <div className="w-12 h-12 bg-ln-lime rounded-full mix-blend-multiply blur-xl opacity-50"></div>
                </div>

                <h2 className="text-3xl md:text-5xl lg:text-7xl font-mona font-bold text-ln-black uppercase leading-[1.1] tracking-tight">
                    <span className="block mb-2">Redefining limits,</span>
                    <span className="block mb-2 text-ln-grey">fighting for wins,</span>
                    <span className="block">bringing it all <span className="text-ln-lime">in all ways.</span></span>
                </h2>

                <p className="mt-12 text-lg md:text-xl font-mona text-ln-black/70 max-w-2xl mx-auto">
                    Defining a legacy in Formula 1 on and off the track.
                </p>
            </div>
        </section>
    );
}
