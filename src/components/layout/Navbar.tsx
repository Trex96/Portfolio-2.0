'use client';

import Link from 'next/link';

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-16 py-6">
            <div className="flex items-start justify-between">

                {/* Top-Left Logo - Serif Style */}
                <Link href="/" className="text-[#A89F8F] leading-tight">
                    <div className="font-serif text-2xl md:text-3xl font-normal tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
                        LANDO
                        <br />
                        <span className="text-[#B8B096]">NORRIS</span>
                    </div>
                </Link>

                {/* Center Logo - LN4 */}
                <Link href="/" className="absolute left-1/2 -translate-x-1/2 top-6">
                    <div className="text-black font-black text-5xl md:text-6xl tracking-tighter">
                        LN4
                    </div>
                </Link>

                {/* Right Side - Store Button + Hamburger Menu */}
                <div className="flex items-center gap-4">

                    {/* STORE Button */}
                    <Link
                        href="/store"
                        className="hidden md:flex items-center gap-2 px-6 py-3 rounded-full border-2 border-black bg-[#D4C9B0] hover:bg-[#C5BBAA] transition-colors"
                    >
                        {/* Shopping Bag Icon */}
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path
                                d="M14 5.5H4L3 16H15L14 5.5Z"
                                stroke="#000000"
                                strokeWidth="1.5"
                                fill="none"
                            />
                            <path
                                d="M6 5.5V4C6 2.5 7 1.5 9 1.5C11 1.5 12 2.5 12 4V5.5"
                                stroke="#000000"
                                strokeWidth="1.5"
                                fill="none"
                            />
                        </svg>
                        <span className="font-semibold text-black uppercase text-sm tracking-wide">STORE</span>
                    </Link>

                    {/* Hamburger Menu Button */}
                    <button
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-black bg-[#D4C9B0] hover:bg-[#C5BBAA] flex items-center justify-center transition-colors"
                        aria-label="Menu"
                    >
                        <div className="flex flex-col gap-1.5">
                            <span className="w-5 h-0.5 bg-black"></span>
                            <span className="w-5 h-0.5 bg-black"></span>
                            <span className="w-5 h-0.5 bg-black"></span>
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
}
