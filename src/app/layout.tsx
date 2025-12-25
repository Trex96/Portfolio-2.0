import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SmoothScroll } from '@/components/ui/SmoothScroll';

// Load Inter (Professional Fallback)
const inter = Inter({
    subsets: ['latin'],
    variable: '--font-mona-sans', // Keep variable name to match CSS
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Lando Norris | Formula 1 Driver',
    description: 'Official website of McLaren Formula 1 Driver Lando Norris.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={inter.variable}>
            <body className="bg-ln-black text-ln-white antialiased selection:bg-ln-lime selection:text-ln-black">
                <SmoothScroll>
                    {/* Navigation is fixed, so it sits outside or inside smooth scroll? 
                Usually fixed elements should be outside if using native lenis, 
                but since lenis affects the html/body scroll, fixed elements work fine inside.
                However, to be safe and match standard patterns:
            */}
                    <Navbar />

                    {/* Main Content */}
                    <main className="relative min-h-screen">
                        {children}
                    </main>

                    <Footer />
                </SmoothScroll>
            </body>
        </html>
    );
}
