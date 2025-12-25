import Image from 'next/image';

export function HeroMarquee() {
    return (
        <div className="w-full bg-ln-lime overflow-hidden py-3 absolute bottom-0 z-20">
            <div className="flex animate-marquee whitespace-nowrap">
                {/* Marquee Content repeated */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-8 mx-8">
                        <span className="text-ln-black font-bold uppercase text-xl md:text-2xl tracking-wide">
                            Message from Lando
                        </span>
                        <div className="relative w-24 h-8 md:w-32 md:h-10">
                            {/* Using standard img for SVG to ensure intrinsic sizing works if Tailwind fails */}
                            <img
                                src="/cdn.prod.website-files.com/67b5a02dc5d338960b17a7e9/67cecea4e9d311047dcb51e5_ln4-hw-signature2.svg"
                                alt="Lando Signature"
                                className="w-full h-full object-contain"
                                style={{ maxHeight: '100%' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
