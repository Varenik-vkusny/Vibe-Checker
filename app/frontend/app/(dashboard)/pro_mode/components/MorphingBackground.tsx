'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface MorphingBackgroundProps {
    icon: 'search' | 'sparkles' | 'mapPin' | 'cloud' | 'none';
    isExploding?: boolean;
    onExplosionComplete?: () => void;
}

// SVG Paths
const ICONS = {
    search: "M 85 30 A 55 55 0 1 0 130 95 A 55 55 0 0 0 85 30 M 125 125 L 170 170",
    sparkles: "M 100 50 L 115 90 L 155 105 L 115 120 L 100 160 L 85 120 L 45 105 L 85 90 Z  M 160 40 L 165 55 L 180 60 L 165 65 L 160 80 L 155 65 L 140 60 L 155 55 Z  M 40 140 L 50 160 L 70 170 L 50 180 L 40 200 L 30 180 L 10 170 L 30 160 Z",
    mapPin: "M 100 60 C 80 60 65 75 65 95 C 65 125 100 160 100 160 C 100 160 135 125 135 95 C 135 75 120 60 100 60 M 100 85 A 10 10 0 1 1 100 105 A 10 10 0 0 1 100 85",
    cloud: "M86.35,29.93c-0.75,0.37-1.51,0.78-2.26,1.21c-2.25,1.32-4.47,2.93-6.74,4.78l-4.84-5.54c1.67-1.55,3.48-2.96,5.4-4.21 c1.53-1,3.13-1.89,4.78-2.65c0.66-0.33,1.32-0.64,2-0.93c-3.19-5.65-7.78-9.7-12.98-12.2c-5.2-2.49-11.02-3.45-16.69-2.9 c-5.63,0.54-11.1,2.59-15.62,6.1c-5.23,4.05-9.2,10.11-10.73,18.14l-0.48,2.51l-2.5,0.44c-2.45,0.43-4.64,1.02-6.56,1.77 c-1.86,0.72-3.52,1.61-4.97,2.66c-1.16,0.84-2.16,1.78-3.01,2.8c-2.63,3.15-3.85,7.1-3.82,11.1c0.03,4.06,1.35,8.16,3.79,11.53 c0.91,1.25,1.96,2.4,3.16,3.4c1.22,1.01,2.59,1.85,4.13,2.48c1.53,0.63,3.22,1.08,5.09,1.34l72.55,0c3.53-0.85,6.65-2,9.3-3.48 c2.63-1.47,4.78-3.26,6.39-5.41c2.5-3.33,3.73-8.04,3.78-12.87c0.06-5.07-1.18-10.16-3.59-13.86c-0.69-1.07-1.45-2.03-2.25-2.89 c-3.61-3.89-8.19-5.59-12.95-5.62C93.3,27.6,89.73,28.43,86.35,29.93L86.35,29.93L86.35,29.93z M91.99,20.65 c1.6-0.25,3.2-0.38,4.79-0.36c6.72,0.05,13.2,2.45,18.3,7.95c1.07,1.15,2.08,2.45,3.03,3.9c3.2,4.92,4.84,11.49,4.77,17.92 c-0.07,6.31-1.77,12.59-5.25,17.21c-2.27,3.01-5.18,5.47-8.67,7.42c-3.36,1.88-7.28,3.31-11.68,4.33l-0.82,0.1l-73.08,0l-0.46-0.04 c-2.67-0.34-5.09-0.97-7.29-1.88c-2.27-0.94-4.28-2.15-6.05-3.63c-1.68-1.4-3.15-2.99-4.4-4.72C1.84,64.25,0.04,58.63,0,53.03 c-0.04-5.66,1.72-11.29,5.52-15.85c1.23-1.48,2.68-2.84,4.34-4.04c1.93-1.4,4.14-2.58,6.64-3.55c1.72-0.67,3.56-1.23,5.5-1.68 c2.2-8.74,6.89-15.47,12.92-20.14c5.64-4.37,12.43-6.92,19.42-7.59c6.96-0.67,14.12,0.51,20.55,3.6 C81.9,7.15,88.02,12.76,91.99,20.65L91.99,20.65L91.99,20.65z",
    none: ""
};

const MORPH_PARTICLE_COUNT = 800; // Shape formation
const BOOM_PARTICLE_COUNT = 800;  // Explosion effects
const IDLE_VELOCITY_FACTOR = 0.5;

// Vibrant colors for explosion
// Vibrant neon colors for explosion (Brighter, more saturation)
const EXPLOSION_COLORS = ['#3B82F6', '#8B5CF6', '#F97316', '#14B8A6', '#EC4899', '#EAB308']; // Tailwind 500s (Visible on Light & Dark)

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetX: number;
    targetY: number;
    size: number;
    alpha: number;
    color: string | null;
    exploding: boolean;
    // For 2-layer logic
    layer: 'morph' | 'boom';
}

export const MorphingBackground = ({ icon, isExploding = false, onExplosionComplete }: MorphingBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Two groups of particles in one array for easier rendering loop
    const particlesRef = useRef<Particle[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const timeRef = useRef<number>(0);
    const explosionTimeRef = useRef<number>(0);
    const explosionTriggeredRef = useRef<boolean>(false);

    // Helper to sample points from SVG path
    const samplePath = (pathData: string, sampleCount: number) => {
        if (!pathData) return null;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);

        const length = path.getTotalLength();
        const points = [];

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        for (let i = 0; i < sampleCount; i++) {
            const distance = (i / sampleCount) * length;
            const point = path.getPointAtLength(distance);

            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);

            points.push({
                x: point.x + (Math.random() - 0.5) * 5,
                y: point.y + (Math.random() - 0.5) * 5
            });
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        return { points, centerX, centerY };
    };

    // Initialize Particles (Runs once)
    useEffect(() => {
        if (particlesRef.current.length === 0) {
            const w = typeof window !== 'undefined' ? window.innerWidth : 1000;
            const h = typeof window !== 'undefined' ? window.innerHeight : 1000;

            // 1. Create Morph Particles (Monochrome, active in loop)
            for (let i = 0; i < MORPH_PARTICLE_COUNT; i++) {
                particlesRef.current.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * IDLE_VELOCITY_FACTOR,
                    vy: (Math.random() - 0.5) * IDLE_VELOCITY_FACTOR,
                    targetX: Math.random() * w,
                    targetY: Math.random() * h,
                    size: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.6 + 0.2,
                    color: null,
                    exploding: false,
                    layer: 'morph'
                });
            }

            // 2. Create Boom Particles (Hidden until explosion)
            for (let i = 0; i < BOOM_PARTICLE_COUNT; i++) {
                particlesRef.current.push({
                    x: w / 2,
                    y: h / 2,
                    vx: 0,
                    vy: 0,
                    targetX: w / 2,
                    targetY: h / 2,
                    size: Math.random() * 3 + 1, // Larger confetti
                    alpha: 0, // Hidden initially
                    color: EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)],
                    exploding: true, // They are always "physics" based effectively
                    layer: 'boom'
                });
            }
        }
    }, []);

    // Handle Explosion Sequence logic
    useEffect(() => {
        if (isExploding) {
            explosionTimeRef.current = 0;
            explosionTriggeredRef.current = false;

            // Prepare Boom Particles: Reset to Center (or scattered for gathering)
            // Strategy: Gather from edges to center? Or just spawn at center.
            // User: "All particles go into center... then blow up"
            // Let's scatter Boom particles so they can "gather" to center.
            const w = window.innerWidth;
            const h = window.innerHeight;

            particlesRef.current.forEach(p => {
                if (p.layer === 'boom') {
                    // Scatter them initially so they can implode
                    const angle = Math.random() * Math.PI * 2;
                    const r = Math.min(w, h) / 1.5; // Large radius
                    p.x = w / 2 + Math.cos(angle) * r;
                    p.y = h / 2 + Math.sin(angle) * r;
                    p.vx = 0;
                    p.vy = 0;
                    p.alpha = 1; // Make visible
                    p.color = EXPLOSION_COLORS[Math.floor(Math.random() * EXPLOSION_COLORS.length)];
                }

                // Kill GSAP for everything briefly to handle the transition manually
                if (p.layer === 'morph') {
                    gsap.killTweensOf(p); // We'll manually control them during implosion
                }
            });

        } else {
            // Reset
            explosionTriggeredRef.current = false;
            particlesRef.current.forEach(p => {
                if (p.layer === 'boom') {
                    p.alpha = 0; // Hide boom particles
                }
                p.exploding = false;
                p.color = null;
            });
        }
    }, [isExploding]);

    // Handle Morphing Targets (Only for Morph Layer)
    useEffect(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const cx = w / 2;
        const cy = h / 2;
        const scale = Math.min(w, h) / 300;

        let newTargets: { x: number, y: number }[] = [];

        if (icon === 'none') {
            newTargets = particlesRef.current.filter(p => p.layer === 'morph').map(() => {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * Math.min(w, h) / 2;
                return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
            });
        } else {
            const pathData = ICONS[icon];
            const morphParticles = particlesRef.current.filter(p => p.layer === 'morph');
            const totalMorph = morphParticles.length;
            const shapeCount = Math.floor(totalMorph * 0.85); // 85% shape for better definition
            const noiseCount = totalMorph - shapeCount;

            const sampled = samplePath(pathData, shapeCount);

            if (sampled) {
                const { points, centerX, centerY } = sampled;
                newTargets = points.map(p => ({
                    x: cx + (p.x - centerX) * scale,
                    y: cy + (p.y - centerY) * scale
                }));
            }

            for (let i = 0; i < noiseCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * Math.min(w, h) / 1.5;
                newTargets.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
            }
        }

        let targetIndex = 0;
        particlesRef.current.forEach((p) => {
            if (p.layer === 'morph') {
                const t = newTargets[targetIndex] || { x: w / 2, y: h / 2 };
                p.targetX = t.x;
                p.targetY = t.y;
                targetIndex++;

                // If NOT exploding, use GSAP.
                // If exploding, we ignore GSAP because we manually lerp/move them in render loop.
                if (!isExploding) {
                    gsap.killTweensOf(p);
                    const isShape = targetIndex < newTargets.length && targetIndex < (icon === 'none' ? 0 : Math.floor(MORPH_PARTICLE_COUNT * 0.85));
                    gsap.to(p, {
                        x: p.targetX,
                        y: p.targetY,
                        duration: isShape ? 1.5 : 2.5,
                        ease: isShape ? "elastic.out(1, 0.7)" : "power2.out",
                        delay: Math.random() * 0.1
                    });
                }
            }
        });

    }, [icon, isExploding]);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            timeRef.current += 0.02;

            if (isExploding) {
                explosionTimeRef.current += 0.016;
            }

            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;
            const isDark = document.documentElement.classList.contains('dark');

            ctx.clearRect(0, 0, width, height);
            ctx.save();

            // Background / Morph Layer micro-animations (when not exploding)
            if (!isExploding) {
                if (icon === 'search') ctx.translate(Math.sin(timeRef.current * 2) * 10, 0);
                else if (icon === 'sparkles') {
                    const s = 1 + Math.sin(timeRef.current * 2) * 0.05;
                    ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
                }
                else if (icon === 'cloud') {
                    ctx.translate(cx, cy); ctx.rotate(Math.sin(timeRef.current * 0.5) * 0.1); ctx.translate(-cx, -cy);
                }
                else if (icon === 'mapPin') ctx.translate(0, Math.sin(timeRef.current * 3) * 10);
            }

            const r = isDark ? 255 : 30;
            const g = isDark ? 255 : 30;
            const b = isDark ? 255 : 50;
            const defaultColor = `rgba(${r}, ${g}, ${b}`;

            let allSettled = true;

            particlesRef.current.forEach((p, i) => {
                // PHYSICS ENGINE
                if (isExploding) {
                    const t = explosionTimeRef.current;

                    if (p.layer === 'boom') {
                        // --- BOOM LAYER LOGIC ---
                        if (t < 0.5) {
                            // Phase 1: Implode to Center
                            const dx = cx - p.x;
                            const dy = cy - p.y;
                            p.x += dx * 0.15; // Strong implosion
                            p.y += dy * 0.15;
                        } else if (t < 0.6) {
                            // Phase 2: BOOM Trigger
                            if (!p.vx && !p.vy) { // Give initial push only once roughly
                                const angle = Math.random() * Math.PI * 2;
                                const force = Math.random() * 15 + 10;
                                p.vx = Math.cos(angle) * force;
                                p.vy = Math.sin(angle) * force;
                            }
                            p.x += p.vx;
                            p.y += p.vy;
                        } else {
                            // Phase 3: Gravity Fall
                            p.x += p.vx;
                            p.y += p.vy;
                            p.vy += 0.4; // Gravity
                            p.vx *= 0.96; // Air resistance
                            if (p.y > height + 50) p.alpha = 0; // Hide when off screen
                        }
                    } else {
                        // --- MORPH LAYER LOGIC (Icon) ---
                        // 0-0.5s: Implode with the boom layer? Or just Morph to MapPin targets?
                        // User wants "Map pin icon should APPEAR with explosion".
                        // So at 0.5s, it should be visible.

                        if (t < 0.5) {
                            // Phase 1: Also Implode (Suck in cloud)
                            const dx = cx - p.x;
                            const dy = cy - p.y;
                            p.x += dx * 0.1;
                            p.y += dy * 0.1;
                        } else {
                            // Phase 2: Form Map Pin immediately
                            // We lerp quickly to target
                            const dx = p.targetX - p.x;
                            const dy = p.targetY - p.y;
                            p.x += dx * 0.1;
                            p.y += dy * 0.1;

                            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) allSettled = false;
                        }
                    }

                } else {
                    // IDLE
                    if (p.layer === 'morph') {
                        p.x += p.vx;
                        p.y += p.vy;
                        if (p.x < 0 || p.x > width) p.vx *= -1;
                        if (p.y < 0 || p.y > height) p.vy *= -1;
                    }
                }

                // DRAW
                if (p.alpha > 0.01) {
                    ctx.beginPath();
                    const floatX = isExploding ? 0 : Math.sin(timeRef.current + i) * 2;
                    const floatY = isExploding ? 0 : Math.cos(timeRef.current + i * 0.5) * 2;

                    ctx.arc(p.x + floatX, p.y + floatY, p.size, 0, Math.PI * 2);

                    if (p.layer === 'boom') {
                        ctx.fillStyle = p.color || '#fff';
                        ctx.globalAlpha = 1; // Force bright
                    } else {
                        ctx.fillStyle = `${defaultColor}, ${p.alpha})`;
                    }
                    ctx.fill();
                    ctx.globalAlpha = 1; // Reset
                }
            });

            ctx.restore();

            if (isExploding && explosionTimeRef.current > 2.5 && allSettled) {
                if (onExplosionComplete) onExplosionComplete(); // Only triggers if Map Pin is settled
            }
        };

        animate();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [icon, isExploding]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 z-0 pointer-events-none"
        />
    );
};
