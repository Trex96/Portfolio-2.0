'use client';

import { useRef } from 'react';
import Image from 'next/image';

const GALLERY_ITEMS = [
    { id: 1, title: 'Qatar, 2024', image: '/helmet/textures/ui/ln-home-horiz-1.webp' },
    { id: 2, title: 'FIA Prize Giving, 2024', image: '/helmet/textures/ui/ln-home-horiz-2.webp' },
    { id: 3, title: 'Miami GP, 2024', image: '/helmet/textures/ui/ln-home-horiz-3.webp' },
    { id: 4, title: 'Monaco, 2023', image: '/helmet/textures/ui/ln-home-horiz-4.webp' },
];

export function HorizontalGallery() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    return (
        <section className="bg-ln-black text-ln-white py-20 overflow-hidden">
            <div className="pl-6 md:pl-12 mb-12">
                <h3 className="text-ln-lime font-mona font-bold text-xl uppercase tracking-wider">Latest Highlights</h3>
            </div>

            {/* Horizontal Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-6 md:gap-12 overflow-x-auto px-6 md:px-12 pb-12 snap-x snap-mandatory hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {GALLERY_ITEMS.map((item) => (
                    <div key={item.id} className="relative flex-shrink-0 w-[80vw] md:w-[45vw] lg:w-[35vw] aspect-[4/5] md:aspect-video snap-center group">
                        <div className="absolute inset-0 z-10 p-6 flex flex-col justify-between transition-opacity duration-300 opacity-100 group-hover:opacity-100 bg-gradient-to-t from-black/60 to-transparent">
                            <span className="font-mona font-bold text-2xl uppercase">{item.title}</span>
                        </div>
                        <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover object-center rounded-sm"
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
