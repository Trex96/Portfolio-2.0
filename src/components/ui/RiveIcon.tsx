'use client';

import { useRive, UseRiveParameters } from '@rive-app/react-canvas';

/**
 * Reusable component for Rive animations
 * Matches the original landonorris.com Rive icon implementation
 * 
 * @param src - Name of the .riv file (without extension)
 * @param artboard - Optional artboard name within the Rive file
 * @param stateMachine - Optional state machine name to control the animation
 * @param className - Optional CSS classes for styling
 */
interface RiveIconProps {
    src: string;
    artboard?: string;
    stateMachine?: string;
    className?: string;
    autoplay?: boolean;
}

export function RiveIcon({
    src,
    artboard,
    stateMachine,
    className,
    autoplay = true
}: RiveIconProps) {
    const params: UseRiveParameters = {
        src: `/rive/${src}.riv`,
        artboard: artboard,
        stateMachines: stateMachine,
        autoplay: autoplay,
    };

    const { RiveComponent } = useRive(params);

    return (
        <div className={className}>
            <RiveComponent />
        </div>
    );
}
