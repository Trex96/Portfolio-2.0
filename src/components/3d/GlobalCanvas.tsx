'use client';

import { Scene } from './Scene';
import { GLBackground } from './GLBackground';

export function GlobalCanvas() {
    return (
        <div className="gl-canvas" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            pointerEvents: 'none'
        }}>
            <Scene className="w-full h-full">
                <GLBackground />
            </Scene>
        </div>
    );
}
