'use client';

import Image from 'next/image';

const HELMETS = [
    { name: 'Season', year: '2025', image: '/cdn.prod.website-files.com/67d97a68478fe87e30c67abe/68305b3e6c7ab86033cf172c_In-helm-2025-Season-base.webp' },
    { name: 'Discoball', year: '2025', image: '/cdn.prod.website-files.com/67d97a68478fe87e30c67abe/68305b2259159e5170d2b923_In-helm-2025-Discoball-base.webp' },
    { name: 'Porcelain', year: '2024', image: '/cdn.prod.website-files.com/67d97a68478fe87e30c67abe/68305acf3fccf71c6d72607b_In-helm-2024-Porcelain-base.webp' },
    { name: 'Japan', year: '2024', image: '/cdn.prod.website-files.com/67d97a68478fe87e30c67abe/68305a980c399022066600a6_In-helm-2024-Japan-base.webp' },
];

export function HelmetsGrid() {
    return (
        <section className="bg-ln-black text-ln-white py-24 px-6 md:px-12">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <h2 className="font-mona font-black text-5xl md:text-8xl uppercase leading-[0.9]">
                        Helmets<br />
                        <span className="text-ln-lime">Hall of Fame</span>
                    </h2>
                    <p className="max-w-md text-ln-white/70 font-mona text-lg pb-2">
                        From his iconic blobs to innovative one-off designs, Lando has always been passionate about designing memorable helmets.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {HELMETS.map((helmet, i) => (
                        <div key={i} className="group relative aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-ln-lime/50 transition-colors duration-300">
                            {/* Helmet Image */}
                            <div className="absolute inset-4 transition-transform duration-500 group-hover:scale-110">
                                <Image
                                    src={helmet.image}
                                    alt={helmet.name}
                                    fill
                                    className="object-contain"
                                />
                            </div>

                            {/* Overlay Details */}
                            <div className="absolute top-4 left-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-ln-white/50">{helmet.year}</span>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <span className="text-xl font-bold uppercase font-mona">{helmet.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
