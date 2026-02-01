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
        uVelocity: new THREE.Vector2(0, 0),
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
    uniform vec2 uVelocity;
    varying vec2 vUv;

    vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c) * v;
    }

    float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * h * k * (1.0 / 6.0);
    }

    float sdSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
    }

    float sdTriangle(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
        vec2 e0 = p1 - p0;
        vec2 e1 = p2 - p1;
        vec2 e2 = p0 - p2;

        vec2 v0 = p - p0;
        vec2 v1 = p - p1;
        vec2 v2 = p - p2;

        vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
        vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
        vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);

        float s = sign(e0.x * e2.y - e0.y * e2.x);
        vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                         vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                     vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));

        return -sqrt(d.x) * sign(d.y);
    }

    float getInitialPosition(vec2 uv, float aspect) {
        return 1e10;
    }

    float getHead(float d, vec2 uv, vec2 pHead, float speed, vec2 velocity) {
        vec2 p = uv - pHead;

        // 1. Calculate Rotation Angle
        float angle = atan(velocity.y, velocity.x);

        // 2. Rotate to align Local +X (Front) with Velocity Angle
        // Our 'rotate' function implements inverse rotation (by -angle).
        // Calling it with 'angle' rotates SPACE by -angle.
        // Rotating SPACE by -angle rotates OBJECT by +angle.
        p = rotate(p, angle);

        // 3. Define Shape in Local Space (Facing RIGHT / +X)
        
        // Base Circle (Stationary)
        float dCircle = length(p) - 0.05;
        
        // D-Shaped Head (Moving) - Smooth, rounded dome
        // Use a simple oval for a bulbous, non-pointed front
        float dOval = length(p / vec2(1.2, 0.9)) - 0.05; 
        
        // Side Shoulder Bumps
        // Positioned on the "shoulders" of the streamlined body
        
        // Top Shoulder
        vec2 f1_base = vec2(-0.03, 0.05); 
        vec2 f1_tip  = vec2(-0.08, 0.08); 
        vec2 f1_out  = vec2(-0.05, 0.06); 
        float dFin1 = sdTriangle(p, f1_base, f1_tip, f1_out);

        // Bot Shoulder
        vec2 f2_base = vec2(-0.03, -0.05); 
        vec2 f2_tip  = vec2(-0.08, -0.08); 
        vec2 f2_out  = vec2(-0.05, -0.06); 
        float dFin2 = sdTriangle(p, f2_base, f2_tip, f2_out);

        float dFins = min(dFin1, dFin2);
        
        // 4. Blend and Morph
        float circleToOval = smoothstep(0.0, 0.4, speed);
        float ovalToHead = smoothstep(0.2, 0.8, speed);
        
        // Define final streamlined shape 
        float dWhale = smin(dOval, dFins, 0.4);

         // Construct Head:
        float dBase = mix(dCircle, dOval, circleToOval);
        float dHead = mix(dBase, dWhale, 0.3 + 0.7 * ovalToHead);

        return smin(d, dHead, 0.4);
    }

    float getBody(float d, vec2 uv, float speed, float aspect, vec2 top[5], vec2 bot[5]) {
        float res = d;
        // 2. TOP V-CHAIN (Liquid shoulder fin)
        for(int i=0; i<4; i++) {
            vec2 pA = top[i]; pA.x *= aspect;
            vec2 pB = top[i+1]; pB.x *= aspect;
            float r = 0.025 * (1.0 - float(i)/5.0) * (0.4 + 0.6 * clamp(speed * 5.0, 0.0, 1.0));
            res = smin(res, sdSegment(uv, pA, pB) - r, 0.35);
        }

        // 3. BOTTOM V-CHAIN (Liquid shoulder fin - heavier)
        for(int i=0; i<4; i++) {
            vec2 pA = bot[i]; pA.x *= aspect;
            vec2 pB = bot[i+1]; pB.x *= aspect;
            float r = 0.035 * (1.0 - float(i)/5.0) * (0.4 + 0.6 * clamp(speed * 5.0, 0.0, 1.0));
            res = smin(res, sdSegment(uv, pA, pB) - r, 0.35);
        }
        return res;
    }

    float getTail(float d, vec2 uv, float speed, float aspect, vec2 tail[8]) {
        float res = d;
        // 4. CENTRAL TAIL CHAIN (The spine)
        for(int i=0; i<7; i++) {
            vec2 pA = tail[i]; pA.x *= aspect;
            vec2 pB = tail[i+1]; pB.x *= aspect;
            float r = 0.03 * (1.0 - float(i)/8.0) * (0.4 + 0.6 * clamp(speed * 5.0, 0.0, 1.0));
            res = smin(res, sdSegment(uv, pA, pB) - r, 0.45);
        }
        return res;
    }

    void main() {
        vec2 uv = vUv;
        uv.x *= uAspect;
        vec2 pHead = uHead; pHead.x *= uAspect;

        float d = getInitialPosition(uv, uAspect);
        d = getHead(d, uv, pHead, uSpeed, uVelocity);
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

    const currentVel = useRef(new THREE.Vector2(0, 0));
    const currentSpeed = useRef(0);
    const idleFrames = useRef(0);
    const stableAngle = useRef(0);

    const updateHead = (target: THREE.Vector2) => {
        head.current.lerp(target, 0.3);
    };

    const updateBody = (moveAngle: number, speed: number, isIdle: boolean) => {
        // Update Chains with S-Curve Whiplash
        const updateChain = (chain: THREE.Vector2[], angleOffset: number, length: number, lags: number[]) => {
            if (isIdle) {
                // At rest, trail behind based on last known movement direction
                const idleTarget = new THREE.Vector2(
                    head.current.x + Math.cos(moveAngle + Math.PI + angleOffset) * length,
                    head.current.y + Math.sin(moveAngle + Math.PI + angleOffset) * length
                );
                chain[0].lerp(idleTarget, 0.1);
            } else {
                const firstTarget = new THREE.Vector2(
                    head.current.x + Math.cos(moveAngle + Math.PI + angleOffset) * ((length * 0.4) * speed),
                    head.current.y + Math.sin(moveAngle + Math.PI + angleOffset) * ((length * 0.4) * speed)
                );
                chain[0].lerp(firstTarget, 0.35);
            }

            for (let i = 1; i < chain.length; i++) {
                const lag = lags[i - 1] ?? 0.2;
                chain[i].lerp(chain[i - 1], lag);
            }
        };

        const bodyLags = [0.2, 0.2, 0.25, 0.25];
        updateChain(topChain, -0.6, 0.04, bodyLags);
        updateChain(botChain, 0.7, 0.05, bodyLags);
        return updateChain;
    };

    const updateTail = (updateChain: any, moveAngle: number, speed: number, isIdle: boolean) => {
        const tailLags = [0.25, 0.3, 0.3, 0.35, 0.35, 0.4, 0.4, 0.45];
        updateChain(tailChain, 0.0, 0.10, tailLags); // Central Tail
    };

    useFrame((state) => {
        const { target, moveAngle, speed, isIdle } = updateInitialPosition(state);

        // Smooth velocity for rotation
        // Reconstruct velocity vector from speed and angle, OR just lerp the computed vel
        // But we computed 'vel' inside updateInitialPosition, let's just use speed/angle to make a vector
        const targetVel = new THREE.Vector2(Math.cos(moveAngle), Math.sin(moveAngle));
        // Only update if moving to avoid spinning at rest
        if (speed > 0.01) {
            currentVel.current.lerp(targetVel.multiplyScalar(speed), 0.1);
            // Actually we just need direction, but let's keep it simple. 
            // We can just lerp angle vector.
            // Better:
        }

        // Simpler: Just lerp the unit vector derived from moveAngle
        const dir = new THREE.Vector2(Math.cos(moveAngle), Math.sin(moveAngle));
        if (speed > 0.01) {
            currentVel.current.lerp(dir, 0.15);
        }

        // Idle detection: wait 30 frames before settling
        if (speed < 0.01) {
            idleFrames.current++;
        } else {
            idleFrames.current = 0;
            // Update stable angle only when moving
            stableAngle.current = THREE.MathUtils.lerp(stableAngle.current, moveAngle, 0.15);
        }
        const actualIsIdle = idleFrames.current > 30;

        updateHead(target);

        // Use stableAngle for resting tail direction
        const currentAngle = actualIsIdle ? stableAngle.current : moveAngle;
        const updateChainFunc = updateBody(currentAngle, speed, actualIsIdle);
        updateTail(updateChainFunc, currentAngle, speed, actualIsIdle);

        if (materialRef.current) {
            materialRef.current.uTime = state.clock.elapsedTime;
            materialRef.current.uSpeed = currentSpeed.current;
            materialRef.current.uVelocity = currentVel.current;
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
