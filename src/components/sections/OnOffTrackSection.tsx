'use client';

import Image from 'next/image';

export function OnOffTrackSection() {
    return (
        <section className="relative w-full flex flex-col md:flex-row h-screen">
            {/* Split Backgrounds (Optional, handled by images for now) */}

            {/* ON TRACK */}
            <div className="relative w-full md:w-1/2 h-[50vh] md:h-full group overflow-hidden bg-ln-black border-b md:border-b-0 md:border-r border-ln-lime/20">
                <div className="absolute inset-0 z-10 flex flex-col justify-center items-center p-12 text-center transition-transform duration-500 group-hover:scale-105">
                    <h2 className="font-mona font-black text-6xl md:text-8xl lg:text-9xl uppercase text-ln-white leading-none relative z-20 mix-blend-difference">
                        ON<br /><span className="text-ln-lime">TRACK</span>
                    </h2>
                    <p className="mt-6 text-ln-white/80 max-w-xs font-mona text-lg relative z-20">
                        Most recent results, career stats and photos from trackside.
                    </p>
                </div>

                {/* Image Background */}
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500">
                    <Image
                        src="/helmet/textures/ui/ln4-hp-lando-helmet.webp"
                        alt="Lando On Track"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>

            {/* OFF TRACK */}
            <div className="relative w-full md:w-1/2 h-[50vh] md:h-full group overflow-hidden bg-ln-white">
                <div className="absolute inset-0 z-10 flex flex-col justify-center items-center p-12 text-center transition-transform duration-500 group-hover:scale-105">
                    <h2 className="font-mona font-black text-6xl md:text-8xl lg:text-9xl uppercase text-ln-black leading-none relative z-20">
                        OFF<br /><span className="text-ln-grey">TRACK</span>
                    </h2>
                    <p className="mt-6 text-ln-black/70 max-w-xs font-mona text-lg relative z-20">
                        Campaigns, shoots and promotional materials properly offline.
                    </p>
                </div>

                {/* Image Background */}
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                    <Image
                        src="/helmet/textures/ui/ln4-hp-lando-head.webp"
                        alt="Lando Off Track"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        </section>
    );
}
