import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Configuration
const PARTICLE_COUNT = 400;
const PARTICLE_SIZE = 2.5;
const MORPH_DURATION = 1.2;

let scene, camera, renderer;
let particleCanvas, particleCtx;
let particles = [];
let currentShape = 'idle';

// Shape definitions (target positions for particles)
const shapes = {
    idle: () => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const radius = 150;

        return particles.map((_, i) => {
            const angle = (i / particles.length) * Math.PI * 2;
            const r = radius + Math.sin(i * 0.5) * 30;
            return {
                x: centerX + Math.cos(angle) * r,
                y: centerY + Math.sin(angle) * r
            };
        });
    },

    mapPin: () => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const positions = [];

        // Map pin shape: circle head + triangle body
        const headRadius = 60;
        const headParticles = Math.floor(PARTICLE_COUNT * 0.6);

        // Circle head
        for (let i = 0; i < headParticles; i++) {
            const angle = (i / headParticles) * Math.PI * 2;
            const r = headRadius * (0.3 + Math.random() * 0.7);
            positions.push({
                x: centerX + Math.cos(angle) * r,
                y: centerY - 40 + Math.sin(angle) * r
            });
        }

        // Triangle pointer
        const bodyParticles = PARTICLE_COUNT - headParticles;
        for (let i = 0; i < bodyParticles; i++) {
            const t = i / bodyParticles;
            const x = centerX + (Math.random() - 0.5) * (1 - t) * 60;
            const y = centerY + 20 + t * 100;
            positions.push({ x, y });
        }

        return positions;
    },

    balls: () => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const positions = [];
        const ballCount = 3;
        const particlesPerBall = Math.floor(PARTICLE_COUNT / ballCount);
        const rotationAngle = (Date.now() * 0.0005) % (Math.PI * 2);

        for (let b = 0; b < ballCount; b++) {
            const angle = (b / ballCount) * Math.PI * 2 + rotationAngle;
            const orbitRadius = 120;
            const ballX = centerX + Math.cos(angle) * orbitRadius;
            const ballY = centerY + Math.sin(angle) * orbitRadius;
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

        return positions;
    },

    analysis: () => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const positions = [];
        const cardCount = 3;
        const particlesPerCard = Math.floor(PARTICLE_COUNT / cardCount);

        for (let c = 0; c < cardCount; c++) {
            const offset = (c - 1) * 180;
            const cardW = 120;
            const cardH = 160;

            for (let i = 0; i < particlesPerCard; i++) {
                positions.push({
                    x: centerX + offset + (Math.random() - 0.5) * cardW,
                    y: centerY + (Math.random() - 0.5) * cardH
                });
            }
        }

        return positions;
    }
};

function init3DScene() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const rimLight = new THREE.SpotLight(0x4080ff, 8.0);
    rimLight.position.set(-10, 10, -5);
    scene.add(rimLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 5, 10);
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0xa855f7, 0.8);
    fillLight.position.set(0, -10, 5);
    scene.add(fillLight);

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        if (particleCanvas) {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }
    });
}

function initParticleSystem() {
    // Create overlay canvas for particles
    particleCanvas = document.createElement('canvas');
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particleCanvas.style.position = 'fixed';
    particleCanvas.style.top = '0';
    particleCanvas.style.left = '0';
    particleCanvas.style.pointerEvents = 'none';
    particleCanvas.style.zIndex = '1';
    document.getElementById('canvas-container').appendChild(particleCanvas);

    particleCtx = particleCanvas.getContext('2d');

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
            y: window.innerHeight / 2 + (Math.random() - 0.5) * 300,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            targetX: 0,
            targetY: 0,
            baseX: 0,
            baseY: 0
        });
    }

    animate();
}

function morphToShape(shapeName) {
    currentShape = shapeName;
    const targetPositions = shapes[shapeName]();

    particles.forEach((p, i) => {
        const target = targetPositions[i] || targetPositions[0];
        p.baseX = p.x;
        p.baseY = p.y;
        p.targetX = target.x;
        p.targetY = target.y;

        // Use GSAP to smoothly interpolate
        gsap.to(p, {
            x: target.x,
            y: target.y,
            duration: MORPH_DURATION,
            ease: "power2.inOut",
            delay: Math.random() * 0.3
        });
    });
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Continuously update ball positions if in balls mode
    if (currentShape === 'balls') {
        const targetPositions = shapes.balls();
        particles.forEach((p, i) => {
            const target = targetPositions[i] || targetPositions[0];
            p.targetX = target.x;
            p.targetY = target.y;
            // Smoothly move towards target
            p.x += (p.targetX - p.x) * 0.1;
            p.y += (p.targetY - p.y) * 0.1;
        });
    }

    // Clear canvas
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    // Draw particles
    const isDark = document.body.classList.contains('dark-theme');
    particleCtx.fillStyle = isDark ? '#ffffff' : '#000000';
    particleCtx.shadowBlur = 10;
    particleCtx.shadowColor = isDark ? '#4080ff' : '#2563EB';

    particles.forEach((p, i) => {
        // Dynamic movement based on shape
        let floatX = 0;
        let floatY = 0;

        if (currentShape === 'idle') {
            // Organic wandering for idle
            floatX = Math.sin(time * 0.5 + p.x * 0.01) * 10 + Math.cos(time * 0.3 + i) * 5;
            floatY = Math.cos(time * 0.4 + p.y * 0.01) * 10 + Math.sin(time * 0.6 + i) * 5;
        } else if (currentShape === 'mapPin') {
            // Pulse and slight orbit for map pin
            const angle = time + i * 0.1;
            floatX = Math.cos(angle) * 2;
            floatY = Math.sin(angle) * 2 + Math.sin(time * 2) * 1; // Bobbing
        } else if (currentShape === 'analysis') {
            // Scanning effect
            floatX = Math.sin(time * 2 + p.y * 0.05) * 3;
            floatY = Math.cos(time * 1 + p.x * 0.05) * 2;
        } else {
            // Default float
            floatX = Math.sin(time + p.x) * 0.5;
            floatY = Math.cos(time + p.y) * 0.5;
        }

        particleCtx.beginPath();
        particleCtx.arc(p.x + floatX, p.y + floatY, PARTICLE_SIZE, 0, Math.PI * 2);
        particleCtx.fill();
    });

    // Render 3D scene (lights only, no meshes)
    renderer.render(scene, camera);
}

function initInteraction() {
    const input = document.getElementById('pro-input');
    const submitBtn = document.getElementById('pro-submit');
    const chips = document.querySelectorAll('.suggestion-pill');

    const startProcess = (query) => {
        const inputState = document.getElementById('ui-input-state');
        const processState = document.getElementById('pro-loader');
        const processText = document.getElementById('process-text');
        const processSub = document.getElementById('process-sub');

        // Fade out Input
        gsap.to(inputState, {
            opacity: 0, y: -20, duration: 0.4, onComplete: () => {
                inputState.style.display = 'none';
                processState.style.display = 'flex';
                gsap.fromTo(processState, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
            }
        });

        // Sequence with particle morphing
        processText.innerText = "Processing Query";
        processSub.innerText = "Analyzing semantic context...";

        // 1. Map Pin
        setTimeout(() => {
            processText.innerText = "Scanning Area";
            processSub.innerText = "Locating nearby hotspots via IP";
            morphToShape('mapPin');
        }, 500);

        // 2. Balls
        setTimeout(() => {
            processText.innerText = "Filtering Spots";
            processSub.innerText = "Evaluating 42 locations based on vibe";
            morphToShape('balls');
        }, 3500);

        // 3. Analysis
        setTimeout(() => {
            processText.innerText = "Deep Analysis";
            processSub.innerText = "Reading 1.4M reviews in real-time";
            morphToShape('analysis');
        }, 6500);

        // 4. Redirect
        setTimeout(() => {
            window.location.href = 'map.html?mode=analysis';
        }, 10000);
    };

    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim() !== "") {
                startProcess(input.value);
            }
        });
    }

    if (submitBtn && input) {
        submitBtn.addEventListener('click', () => {
            if (input.value.trim() !== "") {
                startProcess(input.value);
            }
        });
    }

    if (chips) {
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.innerText.trim();
                startProcess(text);
            });
        });
    }

    // Initialize with idle animation
    morphToShape('idle');
}

// Initialize everything after definitions
init3DScene();
initParticleSystem();
initInteraction();

// Theme is handled by theme.js
