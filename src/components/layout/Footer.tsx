import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-ln-black text-ln-white relative overflow-hidden">
            {/* Top mask shape */}
            <div
                className="absolute top-0 left-0 right-0 h-32 bg-ln-dark-green"
                style={{
                    maskImage: 'url(/helmet/textures/ui/ln4-footer-mask-desktop.svg)',
                    maskSize: 'cover',
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    WebkitMaskImage: 'url(/helmet/textures/ui/ln4-footer-mask-desktop.svg)',
                    WebkitMaskSize: 'cover',
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                }}
            />

            <div className="container mx-auto px-5 pt-40 pb-12">
                {/* Main Footer Content */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Column 1 - Logo & Description */}
                    <div>
                        <div className="mb-6">
                            <svg width="138" height="63" viewBox="0 0 138 63" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32">
                                <path
                                    className="fill-ln-grey-2"
                                    d="M122.638.174c8.968 0 14.659 6.985 14.659 15.737 0 8.795-5.691 15.736-14.659 15.736-8.967 0-14.658-6.985-14.658-15.736 0-8.752 5.691-15.737 14.658-15.737Zm4.182 30.265c4.613-1.293 7.329-8.88 4.958-17.158-2.328-8.106-8.752-13.193-13.322-11.9-4.57 1.294-7.286 8.968-4.914 17.246 2.328 8.105 8.708 13.106 13.278 11.813ZM88.191.821c13.495 0 18.496 7.027 18.496 14.874 0 9.614-6.381 15.305-17.116 15.305H78.577l-.56-1.207c1.724-1.854 1.724-1.854 1.724-3.492V5.52c0-1.639 0-1.639-1.724-3.536l.56-1.164h9.614Zm13.107 14.917c0-6.984-4.182-14.4-13.107-14.4-3.707 0-3.707 2.544-3.707 4.182V26.3c0 1.639.043 4.183 2.802 4.183 7.89 0 14.012-2.76 14.012-14.745ZM77.192.821l.604 1.207c-3.535 2.673-3.535 2.673-3.535 4.829V31h-1.983L55.636 7.547C53.74 4.917 53.74 4.7 53.74 9.444v15.52c0 2.156 0 2.156 3.363 4.829L56.498 31H50.29l-.603-1.207c3.535-2.673 3.535-2.673 3.535-4.829V6.857c0-2.156 0-2.156-3.535-4.829L50.29.821h6.338l15.305 21.384c1.81 2.5 1.81 2.5 1.81-1.983V6.857c0-2.156 0-2.156-3.362-4.829l.603-1.207h6.209ZM31.49.821h5.777l8.795 24.014c1.121 3.104 1.121 3.104 2.76 4.958L48.217 31h-7.07l-.604-1.207c1.293-1.81 1.293-1.81-.863-8.32-.776-2.329-1.552-3.493-3.104-3.493h-4.57l-2.586 2.414c-1.725 1.639-2.329 3.19-2.846 4.829-.69 2.242-.69 2.242 1.94 4.57L27.912 31h-5.519l-.603-1.207c3.276-2.414 3.276-2.414 4.44-5.519l6.467-17.158c.56-1.423.949-2.415-1.81-5.088L31.49.821Zm-1.725 18.582 2.027-1.94h4.656c1.552 0 1.336-1.337 1.078-2.07l-2.932-8.32c-.733-2.113-1.078-.95-1.423.043L29.12 18.152c-.776 2.07-.992 2.803.646 1.25ZM19.945 24.145l1.853.647L20.85 31H.716l-.56-1.164c1.767-1.94 1.767-1.94 1.767-3.708V5.693c0-1.768 0-1.768-1.767-3.708L.716.821h7.157l.56 1.164c-1.767 1.94-1.767 1.94-1.767 3.708v20.435c0 1.768 0 4.355 2.716 4.355 3.104 0 8.191-.431 10.563-6.338Z"
                                />
                            </svg>
                        </div>
                        <p className="text-ln-grey-2 text-sm leading-relaxed">
                            McLaren F1 since 2019
                        </p>
                    </div>

                    {/* Column 2 - Navigation */}
                    <div>
                        <h3 className="text-lg font-bold uppercase mb-6">Navigation</h3>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-ln-grey-2 hover:text-ln-lime transition-colors">Home</Link></li>
                            <li><Link href="/on-track" className="text-ln-grey-2 hover:text-ln-lime transition-colors">On Track</Link></li>
                            <li><Link href="/off-track" className="text-ln-grey-2 hover:text-ln-lime transition-colors">Off Track</Link></li>
                            <li><Link href="/calendar" className="text-ln-grey-2 hover:text-ln-lime transition-colors">Calendar</Link></li>
                        </ul>
                    </div>

                    {/* Column 3 - Shop & Business */}
                    <div>
                        <h3 className="text-lg font-bold uppercase mb-6">Connect</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="https://store.landonorris.com"
                                    target="_blank"
                                    className="text-ln-grey-2 hover:text-ln-lime transition-colors"
                                >
                                    Store
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="mailto:business@landonorris.com"
                                    className="text-ln-grey-2 hover:text-ln-lime transition-colors"
                                >
                                    Business Enquiries
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4 - Social */}
                    <div>
                        <h3 className="text-lg font-bold uppercase mb-6">Social</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="https://www.instagram.com/lando"
                                    target="_blank"
                                    className="text-ln-grey-2 hover:text-ln-lime transition-colors"
                                >
                                    Instagram
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://www.tiktok.com/@landonorris"
                                    target="_blank"
                                    className="text-ln-grey-2 hover:text-ln-lime transition-colors"
                                >
                                    TikTok
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://www.youtube.com/landonorris04"
                                    target="_blank"
                                    className="text-ln-grey-2 hover:text-ln-lime transition-colors"
                                >
                                    YouTube
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://www.twitch.tv/landonorris"
                                    target="_blank"
                                    className="text-ln-grey-2 hover:text-ln-lime transition-colors"
                                >
                                    Twitch
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-ln-grey-2/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-ln-grey-2 text-sm">
                        © {new Date().getFullYear()} Lando Norris. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <Link href="/legal/privacy-policy" className="text-ln-grey-2 hover:text-ln-lime transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/legal/terms-conditions" className="text-ln-grey-2 hover:text-ln-lime transition-colors">
                            Terms & Conditions
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
