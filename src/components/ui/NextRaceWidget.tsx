import Link from 'next/link';

export function NextRaceWidget() {
    return (
        <div className="relative w-[120px] h-[244px]">
            {/* Widget Outline SVG */}
            <div className="absolute inset-0 pointer-events-none">
                <svg width="119" height="244" viewBox="0 0 119 244" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M118.5 6v232a5.5 5.5 0 0 1-5.5 5.5H6A5.5 5.5 0 0 1 .5 238V25A5.5 5.5 0 0 1 6 19.5h46.346c4.695 0 9.167-2 12.297-5.498l7.46-8.337A15.5 15.5 0 0 1 83.653.5H113a5.5 5.5 0 0 1 5.5 5.5Z"
                        stroke="currentColor"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>

            {/* Top Label */}
            <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest text-gray-500" style={{ color: '#656d61' }}>
                Next Race
            </div>

            {/* Track Content (Melbourne) */}
            <Link href="/calendar" className="absolute top-16 left-0 right-0 px-4 group">
                <div className="relative h-24 mb-4 flex items-center justify-center">
                    {/* Track Map SVG Placeholder */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:scale-110 transition-transform duration-500">
                        {/* Simple Albert Park-ish shape - Dark stroke for white bg */}
                        <path d="M70 20 L80 30 L80 60 L60 80 L30 75 L20 50 L30 25 L50 20 Z" stroke="#000000" strokeWidth="1.5" fill="none" />
                    </svg>
                </div>

                <div className="flex flex-col gap-0.5">
                    <span className="text-xl font-bold uppercase leading-none group-hover:text-ln-lime transition-colors">Melbourne</span>
                    <span className="text-xl font-bold uppercase leading-none text-ln-lime group-hover:text-ln-white transition-colors">GP</span>
                </div>
            </Link>

            {/* Separator Line */}
            <div className="absolute top-[180px] left-0 w-full h-px bg-black" style={{ backgroundColor: '#000000' }} />

            {/* Bottom Info (Helmet + Since 2019) */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                {/* Small Helmet SVG */}
                <div className="w-8 h-8 text-black" style={{ color: '#000000' }}>
                    <svg viewBox="0 0 97 50.1" fill="currentColor" className="w-full h-full">
                        <path d="M.4 27.6s3 .9 6.1 5.9c-.4-1.1-.6-2.2-.8-3.4C1.5 27.8 1.1 25.7.8 22c.2 1 3.2 2.4 3.6 4 .4 1.3.8 2.5 1.3 3.1 0-1-.1-2 0-3v-.5c-1.3-1.1-4.3-4.3-3.5-9.1.5 1.2 3 1.6 3.7 7.4.2-1.1.5-2.1.8-3.2C5.5 19.2 3.5 15 5.6 7.9c.3 1.2 2.5 5.7 2 8.3-.2.8-.2 1.7-.3 2.6 0-.2.1-.4.2-.6.3-.9.7-1.8 1.2-2.7 0-1.4-.2-2.8-.8-4.1-.3-.6-.4-1.3-.4-2s.4-1.3.8-1.8c.6-.8.8-2.8.8-2.8s2.2 3.4 0 9.8c.4-.7.9-1.5 1.4-2.1.4-1 .4-2 .2-3.1-.4-1.8-.7-4.5 2.2-7.7-.3 1.5.4 4.2-.1 6-.4 1.3-.9 2.6-1.5 3.8.5-.6 1.1-1.2 1.7-1.8.3-1 .2-2.5.8-4.9.7-2.9 2.2-3.3 2.8-4.8.5 3.3-1 6.7-2.4 8.6l.4-.3c.4-.3.8-.6 1.1-1 .4-1.8 1.2-3.5 2.4-5 .8-.9 2.7-1.4 3-2.2-.3 3.3-2.3 5.1-4 6.3.9-.5 1.9-.7 2.9-.7s2 .4 2.8 1c0 0-2.2 1.3-3.7 1.1-1.5-.2-2.1-.5-3-.2-.3.3-.7.6-1.1.9 2.2-.6 4.8 1 5.8 2-1.9.9-3.5.3-4.3-.6-.7-.7-1.8-.4-2.3-.8-.7.6-1.3 1.2-2 1.8-.7.7-1.3 1.5-1.9 2.4 1.4-1.3 3.7-2.7 6-2.2-.3.9-1.8 2.5-3.4 3.1-1.4.4-2.7.4-3.6.9-.6 1-1 2.1-1.4 3.3 2.1-3.1 6.3-3.9 7.3-3.7 0 0-2 .9-2.4 2.4-.5 1.6-2.2 2.1-3.6 2.2-.7.1-1.4.5-1.9 1-.4 1.4-.8 2.9-1 4.4 1.9-6.5 6.4-5.5 6.4-5.5-.6.3-1 .9-1.2 1.5-.4 1.1-.9 2-2.6 3.2-1.2.8-2.2 2.1-2.7 3.5 0 1.8.4 3.5.9 5.2-.3-2.2-.2-5.2 1.4-7.4-.2 1.5 1.5 4.1 1.1 5.9-.3 1.5-1.4 3.4-1.2 4.8.2.4.4.8.6 1.1 0-1 .5-2.3.5-3.3.3.9.2 3 .2 4.4.5.8 1.1 1.5 1.7 2.2-1.3-2.4-1.4-6-.4-9 1 1.5 2.1 4.4 1.8 6.4-.2 1.5 0 2.9.4 4.3l.3.3c.3.3.7.6 1 .8-1.5-2.1-1.3-5.3-1-6.7 1.8 2 3.3 6 3.2 8.1l1.2.6c1.6.7 3.4 1.1 5.1.6v.2l.1.2v.4c-1.8.5-3.8 0-5.5-.7l-1.8-.9c-1.1 1.1-3.4 1.8-4.8 1.4-1.3-.4-2.6-1.4-3.6-1.3 1.7-1.8 3.9-1.9 5.2-1.1 1.2.7 2 1 2.7.8-.8-.5-1.6-1.1-2.3-1.7l-.3-.3c-1.9.7-4 0-5.3-.8-1.5-.9-1.7-2.6-2.8-3.5 3.5-.1 5 1.4 5.6 2.3.5.7 1.2 1.3 2 1.5-1.1-1.1-2.1-2.2-2.9-3.5-.9-.2-3 0-4.1-1.5 1.5-.1 2.6 0 3.4.5-.2-.4-.4-.8-.6-1.1-1.1-.2-3.1 0-4.4-1.1-1.1-2.2-2.3-3.1-3.6 0 0 2.5.5 3.8 1.1-1.1-1-3.8-5.7-3.8-5.8Z" />
                    </svg>
                </div>
                <div className="text-[10px] uppercase font-bold leading-tight text-right text-ln-grey-2">
                    McLaren F1
                    <br />
                    Since 2019
                </div>
            </div>
        </div>
    );
}
