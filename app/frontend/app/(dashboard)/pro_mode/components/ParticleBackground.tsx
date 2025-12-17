'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface ParticleBackgroundProps {
  shape: 'idle' | 'mapPin' | 'balls' | 'analysis';
}

export const ParticleBackground = ({ shape }: ParticleBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null); // Если понадобится обертка
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  
  const particlesRef = useRef<any[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  const PARTICLE_COUNT = 400;
  const PARTICLE_SIZE = 2.5;

  const getTargetPositions = (shapeName: string) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const positions: {x: number, y: number}[] = [];

    if (shapeName === 'mapPin') {
        const headRadius = 60;
        const headParticles = Math.floor(PARTICLE_COUNT * 0.6);

        for (let i = 0; i < headParticles; i++) {
            const angle = (i / headParticles) * Math.PI * 2;
            const r = headRadius * (0.3 + Math.random() * 0.7);
            positions.push({
                x: cx + Math.cos(angle) * r,
                y: cy - 40 + Math.sin(angle) * r
            });
        }
        const bodyParticles = PARTICLE_COUNT - headParticles;
        for (let i = 0; i < bodyParticles; i++) {
            const t = i / bodyParticles;
            const spreadX = (1 - t) * 60; 
            const x = cx + (Math.random() - 0.5) * spreadX;
            const y = cy + 20 + t * 100; 
            positions.push({ x, y });
        }
    } 
    else if (shapeName === 'balls') {
        const ballCount = 3;
        const particlesPerBall = Math.floor(PARTICLE_COUNT / ballCount);
        const rotationAngle = (Date.now() * 0.0005) % (Math.PI * 2);

        for (let b = 0; b < ballCount; b++) {
            const angle = (b / ballCount) * Math.PI * 2 + rotationAngle;
            const orbitRadius = 120;
            const ballX = cx + Math.cos(angle) * orbitRadius;
            const ballY = cy + Math.sin(angle) * orbitRadius;
            const ballRadius = 35;

            for (let i = 0; i < particlesPerBall; i++) {
                const a = Math.random() * Math.PI * 2;
                const r = Math.random() * ballRadius;
                positions.push({
                    x: ballX + Math.cos(a) * r,
                    y: ballY + Math.sin(a) * r
                });
            }
        }
        while(positions.length < PARTICLE_COUNT) {
             positions.push({ x: cx, y: cy });
        }
    }
    else if (shapeName === 'analysis') {
        const cardCount = 3;
        const particlesPerCard = Math.floor(PARTICLE_COUNT / cardCount);

        for (let c = 0; c < cardCount; c++) {
            const offset = (c - 1) * 180;
            const cardW = 120;
            const cardH = 160;

            for (let i = 0; i < particlesPerCard; i++) {
                positions.push({
                    x: cx + offset + (Math.random() - 0.5) * cardW,
                    y: cy + (Math.random() - 0.5) * cardH
                });
            }
        }
        while(positions.length < PARTICLE_COUNT) {
             positions.push({ x: cx, y: cy });
        }
    }
    else {
        const radius = 150;
        for(let i=0; i<PARTICLE_COUNT; i++) {
            const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
            const r = radius + Math.sin(i * 0.5) * 30;
            positions.push({
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r
            });
        }
    }

    return positions;
  };

  useEffect(() => {
    if (particlesRef.current.length === 0) return;
    
    const targets = getTargetPositions(shape); 

    particlesRef.current.forEach((p, i) => {
      const t = targets[i] || targets[0];
      gsap.to(p, {
        x: t.x,
        y: t.y,
        duration: 1.5,
        ease: "power2.inOut", 
        delay: Math.random() * 0.1
      });
    });
  }, [shape]); 

  useEffect(() => {
    const scene = new THREE.Scene();
    
    const rimLight = new THREE.SpotLight(0x4080ff, 10.0);
    rimLight.position.set(-10, 10, -5);
    scene.add(rimLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 5, 10);
    scene.add(mainLight);

    const renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        canvas: canvas3DRef.current!,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;

    const ctx = canvas2DRef.current!.getContext('2d');
    canvas2DRef.current!.width = window.innerWidth;
    canvas2DRef.current!.height = window.innerHeight;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: cx + (Math.random() - 0.5) * 300,
      y: cy + (Math.random() - 0.5) * 300,
    }));

    const initialTargets = getTargetPositions('idle');
    particlesRef.current.forEach((p, i) => {
        const t = initialTargets[i];
        p.x = t.x; 
        p.y = t.y;
    });

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      renderer.render(scene, camera);

      if (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        
        const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-theme');
        
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.shadowBlur = 8;
        ctx.shadowColor = isDark ? '#22d3ee' : '#2563EB'; 

        particlesRef.current.forEach((p, i) => {
          let floatX = 0;
          let floatY = 0;
          
          if (shape === 'idle') {
             floatX = Math.sin(time * 0.5 + p.x * 0.01) * 2;
             floatY = Math.cos(time * 0.4 + p.y * 0.01) * 2;
          } else {
             floatX = Math.sin(time + i) * 0.5;
             floatY = Math.cos(time + i * 0.5) * 0.5;
          }

          ctx.beginPath();
          ctx.arc(p.x + floatX, p.y + floatY, PARTICLE_SIZE, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    };
    animate();

    const handleResize = () => {
        if(canvas2DRef.current && canvas3DRef.current) {
            canvas2DRef.current.width = window.innerWidth;
            canvas2DRef.current.height = window.innerHeight;
            
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []); 

  return (
    <>
      <canvas ref={canvas3DRef} className="absolute inset-0 z-0 opacity-50 pointer-events-none" />
      <canvas ref={canvas2DRef} className="absolute inset-0 z-1 pointer-events-none" />
    </>
  );
};