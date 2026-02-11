'use client';

import { motion } from 'framer-motion';

/**
 * Animated Helmet Icon - Placeholder for Rive animation
 * Displays a minimal animated helmet until real Rive files are available
 */
export function HelmetIcon({ className, autoplay = true }: { className?: string; autoplay?: boolean }) {
    return (
        <div className={className}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Helmet body */}
                <motion.path
                    d="M24 8C16 8 10 14 10 22C10 26 10 30 12 32C14 34 18 36 24 36C30 36 34 34 36 32C38 30 38 26 38 22C38 14 32 8 24 8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={autoplay ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Visor */}
                <motion.path
                    d="M14 20C14 20 16 18 24 18C32 18 34 20 34 20"
                    stroke="var(--color-ln-lime)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={autoplay ? { pathLength: 1, opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                />

                {/* Detail lines */}
                <motion.line
                    x1="18"
                    y1="24"
                    x2="30"
                    y2="24"
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.5"
                    initial={{ pathLength: 0 }}
                    animate={autoplay ? { pathLength: 1 } : {}}
                    transition={{ duration: 0.5, delay: 1 }}
                />

                {/* Glow effect */}
                <motion.circle
                    cx="24"
                    cy="18"
                    r="8"
                    fill="var(--color-ln-lime)"
                    opacity="0.1"
                    initial={{ scale: 0 }}
                    animate={autoplay ? {
                        scale: [0, 1.2, 1],
                        opacity: [0, 0.2, 0.1]
                    } : {}}
                    transition={{ duration: 1, delay: 0.8 }}
                />
            </svg>
        </div>
    );
}
