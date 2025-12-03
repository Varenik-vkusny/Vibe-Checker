document.addEventListener('DOMContentLoaded', () => {
    initComparison();
});

const mockCompetitors = {
    'mcd': {
        name: 'McDonald\'s',
        score: '4.7',
        icon: 'https://em-content.zobj.net/source/apple/419/french-fries_1f35f.png',
        tags: ['🍟 Iconic Fries', '⚡ Very Fast'],
        stats: { quality: 85, speed: 95, clean: 70 },
        verdict: "If speed is your priority, McDonald's wins. However, Burger King edges out on flavor profile."
    },
    'kfc': {
        name: 'KFC',
        score: '4.5',
        icon: 'https://em-content.zobj.net/source/apple/419/poultry-leg_1f357.png',
        tags: ['🍗 Crispy', '🌶️ Spicy'],
        stats: { quality: 88, speed: 60, clean: 65 },
        verdict: "KFC offers a distinct texture experience, but Burger King maintains better consistency across locations."
    }
};

function initComparison() {
    const btns = document.querySelectorAll('.competitor-btn');
    const stepSelection = document.getElementById('step-selection');
    const stepResult = document.getElementById('step-result');
    const resetBtn = document.getElementById('reset-btn');

    // Selection Logic
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const data = mockCompetitors[id];

            // 1. Populate Data
            populateComparison(data);

            // 2. Transition with GSAP
            gsap.to(stepSelection, {
                opacity: 0,
                y: -20,
                duration: 0.4,
                onComplete: () => {
                    stepSelection.classList.remove('active');
                    stepResult.classList.add('active');

                    gsap.fromTo(stepResult,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, duration: 0.4 }
                    );

                    // 3. Animate Bars and Elements
                    animateResultElements();
                }
            });
        });
    });

    // Reset Logic
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            gsap.to(stepResult, {
                opacity: 0,
                y: 20,
                duration: 0.4,
                onComplete: () => {
                    stepResult.classList.remove('active');
                    stepSelection.classList.add('active');
                    resetBars();

                    gsap.fromTo(stepSelection,
                        { opacity: 0, y: -20 },
                        { opacity: 1, y: 0, duration: 0.4 }
                    );
                }
            });
        });
    }
}

function populateComparison(data) {
    // Populate Right Column
    document.getElementById('comp-name').innerText = data.name;
    document.getElementById('comp-score').innerText = data.score;
    document.getElementById('comp-icon').src = data.icon;

    // Tags
    const tagContainer = document.getElementById('comp-tags');
    tagContainer.innerHTML = '';
    data.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'vibe-pill';
        span.innerText = tag;
        tagContainer.appendChild(span);
    });

    // Update Bar Data Attributes (Left is static BK at 92/70/60 for demo)
    const bars = document.querySelectorAll('.bar-row');
    const stats = [data.stats.quality, data.stats.speed, data.stats.clean];

    bars.forEach((bar, index) => {
        bar.dataset.right = stats[index];
    });

    // Verdict
    document.getElementById('verdict-text').innerText = data.verdict;

    // Determine Winner for Highlight Box
    const winnerBox = document.getElementById('winner-box');
    if (parseFloat(data.score) > 4.8) {
        winnerBox.innerHTML = `Winner: <strong>${data.name}</strong> for <em>Overall Vibe</em>`;
    } else {
        winnerBox.innerHTML = `Winner: <strong>Burger King</strong> for <em>Overall Vibe</em>`;
    }
}

function animateResultElements() {
    // Stagger animate bars
    const rows = document.querySelectorAll('.bar-row');
    rows.forEach((row, i) => {
        const leftVal = row.dataset.left;
        const rightVal = row.dataset.right;

        const leftBar = row.querySelector('.bar-fill.left');
        const rightBar = row.querySelector('.bar-fill.right');

        // Reset first
        leftBar.style.width = '0%';
        rightBar.style.width = '0%';

        // Animate
        setTimeout(() => {
            leftBar.style.width = (leftVal / 2) + '%';
            rightBar.style.width = (rightVal / 2) + '%';
        }, 300 + (i * 100));
    });

    // Confetti Effect
    triggerConfetti();
}

function resetBars() {
    const fills = document.querySelectorAll('.bar-fill');
    fills.forEach(fill => fill.style.width = '0%');
}

function triggerConfetti() {
    const colors = ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'];
    const count = 50;

    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '8px';
        confetti.style.height = '8px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        confetti.style.zIndex = '100';
        confetti.style.pointerEvents = 'none';
        document.body.appendChild(confetti);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 200;
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity;

        gsap.to(confetti, {
            x: x,
            y: y,
            opacity: 0,
            rotation: Math.random() * 720,
            duration: 1 + Math.random(),
            ease: "power2.out",
            onComplete: () => confetti.remove()
        });
    }
}