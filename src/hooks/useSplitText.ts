import { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import gsap from 'gsap';

/**
 * Hook for animating text with character-by-character or line-by-line split effect
 * Matches the original landonorris.com text animation behavior
 * 
 * @param animType - Type of split animation: 'chars' for character-by-character, 'lines' for line-by-line
 * @param delay - Optional delay before animation starts (in seconds)
 * @param stagger - Optional stagger time between each character/line (in seconds)
 * @returns Ref to attach to the text element
 */
export function useSplitText(
    animType: 'chars' | 'lines' = 'chars',
    delay: number = 0.3,
    stagger: number = 0.02
) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!elementRef.current) return;

        // Split text into characters or lines
        const split = new SplitType(elementRef.current, {
            types: animType,
            tagName: 'span'
        });

        // Get the elements to animate
        const elements = animType === 'chars' ? split.chars : split.lines;

        if (!elements) return;

        // Animate in with stagger effect
        gsap.fromTo(
            elements,
            {
                y: 20,
                opacity: 0
            },
            {
                y: 0,
                opacity: 1,
                stagger: stagger,
                duration: 0.6,
                ease: 'power3.out',
                delay: delay
            }
        );

        // Cleanup function to revert the split
        return () => {
            split.revert();
        };
    }, [animType, delay, stagger]);

    return elementRef;
}
