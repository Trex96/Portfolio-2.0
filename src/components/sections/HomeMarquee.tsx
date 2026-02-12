'use client';

import Image from 'next/image';

export function HomeMarquee() {
    return (
        <section className="s home-marquee">
            <div className="c is-marquee">
                <div className="marqee-adv-layout">
                    {/* Top section with signature and text */}
                    <div className="marquee-adv-top-w">
                        <div className="marquee-adv-top-layout">
                            {/* Signature Images */}
                            <div className="marquee-signature-w">
                                <div className="home-hero-logo-wrap">
                                    <Image
                                        src="/helmet/textures/ui/ln4-hw-signature2.svg"
                                        alt="Lando's signature in lime color"
                                        width={200}
                                        height={80}
                                        className="image is-home-marquee-sig-img is-1"
                                        loading="eager"
                                        data-hero-anim="img"
                                    />
                                    <Image
                                        src="/helmet/textures/ui/ln4-LN-logo-svg.svg"
                                        alt="LN Logo"
                                        width={80}
                                        height={80}
                                        className="image is-home-marquee-sig-img is-ln4-logo"
                                        loading="eager"
                                        data-hero-anim="img"
                                    />
                                </div>
                            </div>

                            {/* Message from Lando text */}
                            <div className="eyebrow-w">
                                <div className="text-eyebrow" data-hero-anim="msg">
                                    Message from lando
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* GL Target for Rive animation */}
                    <div className="marquee-gl-target-w">
                        <div className="marquee-gl-target" data-sticky-hero="target">
                            <div className="marquee-gl-rive-target">
                                <div className="marquee-gl-rive-w w-embed">
                                    <canvas
                                        data-rive-object=""
                                        data-rive-file="signature"
                                        data-rive-artboard="signature"
                                        data-rive-state-machine="signature_scroll"
                                        data-rive-input="color_lime"
                                        data-rive-fit="contain"
                                        data-rive-scrolltrigger-target=".hero-rive-tracker"
                                        data-rive-scrolltrigger-start="top center"
                                        data-rive-scrolltrigger-end="bottom 80%"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* GL Carousel target */}
                        <div className="gl-carousel" data-gl="carousel"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
