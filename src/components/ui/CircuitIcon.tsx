'use client';

import { motion } from 'framer-motion';

/**
 * Animated Circuit Icon - Placeholder for Rive animation
 * Displays a minimal animated circuit path until real Rive files are available
 */
export function CircuitIcon({ className }: { className?: string }) {
    return (
        <div className={className}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <motion.path
                    d="M8 24C8 24 12 8 24 8C36 8 40 24 40 24C40 24 36 40 24 40C12 40 8 24 8 24Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                        pathLength: { duration: 2, ease: "easeInOut" },
                        opacity: { duration: 0.5 }
                    }}
                />
                <motion.circle
                    cx="24"
                    cy="8"
                    r="2"
                    fill="var(--color-ln-lime)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                />
                <motion.circle
                    cx="40"
                    cy="24"
                    r="2"
                    fill="var(--color-ln-lime)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                />
                <motion.circle
                    cx="24"
                    cy="40"
                    r="2"
                    fill="var(--color-ln-lime)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                />
                <motion.circle
                    cx="8"
                    cy="24"
                    r="2"
                    fill="var(--color-ln-lime)"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                />
            </svg>
        </div>
    );
}
