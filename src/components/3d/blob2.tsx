'use client';

import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, extend, ThreeElement } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

/**
 * Multi-Chain Liquid Wave Shader
 * Recreates the 'Whale' silhouette using 3 independent history chains (Top V, Bot V, Tail V).
 * Delivers extreme liquid whiplash and snaking S-curve behavior.
 */
const BlobMaterial = shaderMaterial(
    {
        uHead: new THREE.Vector2(0, 0),
        uTopChain: new Array(5).fill(new THREE.Vector2(0, 0)),
        uBotChain: new Array(5).fill(new THREE.Vector2(0, 0)),
        uTailChain: new Array(8).fill(new THREE.Vector2(0, 0)),
        uTime: 0,
        uAspect: 1,
        uColor: new THREE.Color('#5cafc1'),
        uSpeed: 0,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    uniform vec2 uHead;
    uniform vec2 uTopChain[5];
    uniform vec2 uBotChain[5];
    uniform vec2 uTailChain[8];
    uniform float uTime;
    uniform float uAspect;
    uniform vec3 uColor;
    uniform float uSpeed;
    varying vec2 vUv;

    float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * h * k * (1.0 / 6.0);
    }

    float sdSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
    }

    float getInitialPosition(vec2 uv, float aspect) {
        return 1e10;
    }

    float getHead(float d, vec2 uv, vec2 pHead, float speed) {
        float headStretch = 1.0 + speed * 0.4;
        float dHead = length((uv - pHead) / vec2(headStretch, 1.0 / sqrt(headStretch))) - 0.13;
        return smin(d, dHead, 0.08);
    }

    float getBody(float d, vec2 uv, float speed, float aspect, vec2 top[5], vec2 bot[5]) {
        float res = d;
        // 2. TOP V-CHAIN (Liquid shoulder fin)
        for(int i=0; i<4; i++) {
            vec2 pA = top[i]; pA.x *= aspect;
            vec2 pB = top[i+1]; pB.x *= aspect;
            float r = 0.06 * (1.0 - float(i)/5.0) * clamp(speed*5.0, 0.0, 1.0);
            res = smin(res, sdSegment(uv, pA, pB) - r, 0.08);
        }

        // 3. BOTTOM V-CHAIN (Liquid shoulder fin - heavier)
        for(int i=0; i<4; i++) {
            vec2 pA = bot[i]; pA.x *= aspect;
            vec2 pB = bot[i+1]; pB.x *= aspect;
            float r = 0.08 * (1.0 - float(i)/5.0) * clamp(speed*5.0, 0.0, 1.0);
            res = smin(res, sdSegment(uv, pA, pB) - r, 0.08);
        }
        return res;
    }

    float getTail(float d, vec2 uv, float speed, float aspect, vec2 tail[8]) {
        float res = d;
        // 4. CENTRAL TAIL CHAIN (The spine)
        for(int i=0; i<7; i++) {
            vec2 pA = tail[i]; pA.x *= aspect;
            vec2 pB = tail[i+1]; pB.x *= aspect;
            float r = 0.07 * (1.0 - float(i)/8.0) * clamp(speed*5.0, 0.0, 1.0);
            res = smin(res, sdSegment(uv, pA, pB) - r, 0.1);
        }
        return res;
    }

    void main() {
        vec2 uv = vUv;
        uv.x *= uAspect;
        vec2 pHead = uHead; pHead.x *= uAspect;

        float d = getInitialPosition(uv, uAspect);
        d = getHead(d, uv, pHead, uSpeed);
        d = getBody(d, uv, uSpeed, uAspect, uTopChain, uBotChain);
        d = getTail(d, uv, uSpeed, uAspect, uTailChain);

        // Active Liquid Organic Wobble
        float wobble = sin(uTime * 3.0 + vUv.x * 15.0) * cos(uTime * 2.5 + vUv.y * 15.0) * 0.005;
        d += wobble * smoothstep(0.0, 0.3, length(uv-pHead));

        float alpha = smoothstep(0.005, -0.005, d);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha);
    }
    `
);

extend({ BlobMaterial });

function BlobScene({ fillColor }: { fillColor: string }) {
    const materialRef = useRef<any>(null);
    const { size } = useThree();

    // History Chains for extreme liquid behavior
    const head = useRef(new THREE.Vector2(0.5, 0.5));
    const topChain = useMemo(() => new Array(5).fill(0).map(() => new THREE.Vector2(0.5, 0.5)), []);
    const botChain = useMemo(() => new Array(5).fill(0).map(() => new THREE.Vector2(0.5, 0.5)), []);
    const tailChain = useMemo(() => new Array(8).fill(0).map(() => new THREE.Vector2(0.5, 0.5)), []);

    const [prevMouse] = useState(() => new THREE.Vector2(0.5, 0.5));
    const [vel] = useState(() => new THREE.Vector2(0, 0));

    const updateInitialPosition = (state: any) => {
        const mouse = state.pointer;
        const tx = mouse.x * 0.5 + 0.5;
        const ty = mouse.y * 0.5 + 0.5;
        const target = new THREE.Vector2(tx, ty);

        vel.subVectors(target, prevMouse);
        prevMouse.copy(target);

        const moveAngle = Math.atan2(vel.y, vel.x);
        const speed = Math.min(vel.length() * 60, 1.0);
        const isIdle = speed < 0.01;

        return { target, moveAngle, speed, isIdle };
    };

    const updateHead = (target: THREE.Vector2) => {
        head.current.lerp(target, 0.25);
    };

    const updateBody = (moveAngle: number, speed: number, isIdle: boolean) => {
        // Update Chains with S-Curve Whiplash
        const updateChain = (chain: THREE.Vector2[], angleOffset: number, length: number, lag: number) => {
            const firstTarget = new THREE.Vector2(
                head.current.x + Math.cos(moveAngle + Math.PI + angleOffset) * (length * speed),
                head.current.y + Math.sin(moveAngle + Math.PI + angleOffset) * (length * speed)
            );

            if (isIdle) {
                chain[0].lerp(head.current, 0.2);
            } else {
                chain[0].lerp(firstTarget, 0.2);
            }

            for (let i = 1; i < chain.length; i++) {
                chain[i].lerp(chain[i - 1], lag - (i * 0.01));
            }
        };

        updateChain(topChain, -0.6, 0.12, 0.4); // Top Shoulder
        updateChain(botChain, 0.7, 0.15, 0.35);  // Bot Shoulder
        return updateChain; // Return for reuse if needed, though we use it internally
    };

    const updateTail = (updateChain: any, moveAngle: number, speed: number, isIdle: boolean) => {
        updateChain(tailChain, 0.0, 0.22, 0.45); // Central Tail
    };

    useFrame((state) => {
        const { target, moveAngle, speed, isIdle } = updateInitialPosition(state);

        updateHead(target);
        const updateChainFunc = updateBody(moveAngle, speed, isIdle);
        updateTail(updateChainFunc, moveAngle, speed, isIdle);

        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
            materialRef.current.uSpeed = speed;
            materialRef.current.uHead.copy(head.current);
            materialRef.current.uTopChain = topChain;
            materialRef.current.uBotChain = botChain;
            materialRef.current.uTailChain = tailChain;
            materialRef.current.uAspect = size.width / size.height;
        }
    });

    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            {/* @ts-ignore */}
            <blobMaterial
                ref={materialRef}
                transparent={true}
                uColor={new THREE.Color(fillColor)}
                blending={THREE.NormalBlending}
            />
        </mesh>
    );
}

export default function GooCursor({
    fillColor = '#5cafc1',
    zIndex = 99,
    blendMode = 'exclusion',
}) {
    return (
        <div
            className="cursor-shader-wrap"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: zIndex,
                mixBlendMode: blendMode as any,
            }}
        >
            <Canvas
                shadows={false}
                camera={{ position: [0, 0, 1] }}
                gl={{ alpha: true, antialias: true, stencil: false, depth: false }}
                style={{ background: 'transparent' }}
            >
                <BlobScene fillColor={fillColor} />
            </Canvas>
        </div>
    );
}

declare module '@react-three/fiber' {
    interface ThreeElements {
        blobMaterial: ThreeElement<typeof BlobMaterial>
    }
}
