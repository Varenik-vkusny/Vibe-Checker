document.addEventListener('DOMContentLoaded', () => {
    initComparison();
});

// Store comparison data
let currentComparisonData = null;

function initComparison() {
    const stepSelection = document.getElementById('step-selection');
    const stepResult = document.getElementById('step-result');
    const resetBtn = document.getElementById('reset-btn');

    // Add Place Button Flow
    const addBtn = document.getElementById('add-place-btn');
    const modal = document.getElementById('compare-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalItems = document.querySelectorAll('.modal-item');

    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
            gsap.fromTo('.modal-glass', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
        });
    }

    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            gsap.to('.modal-glass', { y: 20, opacity: 0, duration: 0.2, onComplete: () => {
                modal.style.display = 'none';
            }});
        });
    }

    modalItems.forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            
            // Hide Modal
            modal.style.display = 'none';

            // Get Mock Data
            const mockData = getMockComparisonData(id);
            
            try {
                currentComparisonData = mockData;
                populateComparison(mockData);

                // Transition with GSAP
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

                        // Animate Bars and Elements
                        animateResultElements();
                    }
                });
            } catch (error) {
                console.error('Error loading comparison:', error);
            }
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
                    currentComparisonData = null;

                    gsap.fromTo(stepSelection,
                        { opacity: 0, y: -20 },
                        { opacity: 1, y: 0, duration: 0.4 }
                    );
                }
            });
        });
    }
}

function getMockComparisonData(id) {
    // Mock data matching the backend format
    const mockData = {
        'mcd': {
            place_a: {
                name: "Burger King",
                google_rating: 4.8,
                url: "https://example.com/burgerking",
                latitude: 51.505,
                longitude: -0.09
            },
            place_b: {
                name: "McDonald's",
                google_rating: 4.7,
                url: "https://example.com/mcdonalds",
                latitude: 51.51,
                longitude: -0.1
            },
            comparison: {
                winner_category: {
                    food: "place_a",
                    service: "place_b",
                    atmosphere: "place_a",
                    value: "place_b"
                },
                key_differences: [
                    "McDonald's is significantly faster in service than Burger King.",
                    "Burger King offers flame-grilled burgers, while McDonald's focuses on classic fast food.",
                    "McDonald's has more locations and better accessibility.",
                    "Burger King generally has better food quality ratings."
                ],
                place_a_unique_pros: [
                    "Flame-grilled burgers",
                    "Better food quality",
                    "More spacious seating"
                ],
                place_b_unique_pros: [
                    "Very fast service",
                    "Iconic fries",
                    "24/7 availability"
                ],
                verdict: "If speed is your priority, McDonald's wins. However, Burger King edges out on flavor profile and food quality."
            }
        },
        'kfc': {
            place_a: {
                name: "Burger King",
                google_rating: 4.8,
                url: "https://example.com/burgerking",
                latitude: 51.505,
                longitude: -0.09
            },
            place_b: {
                name: "KFC",
                google_rating: 4.5,
                url: "https://example.com/kfc",
                latitude: 51.51,
                longitude: -0.1
            },
            comparison: {
                winner_category: {
                    food: "place_b",
                    service: "place_a",
                    atmosphere: "place_a",
                    value: "place_a"
                },
                key_differences: [
                    "KFC offers a distinct texture experience with crispy chicken, but Burger King maintains better consistency.",
                    "Burger King has faster service times compared to KFC.",
                    "KFC specializes in chicken, while Burger King offers more variety.",
                    "Burger King generally provides better value for money."
                ],
                place_a_unique_pros: [
                    "Faster service",
                    "Better value",
                    "More variety"
                ],
                place_b_unique_pros: [
                    "Crispy chicken",
                    "Spicy options",
                    "Unique flavor profile"
                ],
                verdict: "KFC offers a distinct texture experience, but Burger King maintains better consistency across locations and provides better overall value."
            }
        }
    };
    
    return mockData[id] || mockData['mcd'];
}

function populateComparison(data) {
    const { place_a, place_b, comparison } = data;

    // Populate Left Column (Place A)
    const leftIcon = document.querySelector('.col-place.left .col-icon-wrapper img');
    const leftName = document.getElementById('place-a-name-display');
    const leftScore = document.getElementById('place-a-score');
    const leftTags = document.getElementById('place-a-tags');
    
    if (leftIcon) leftIcon.src = getPlaceIcon(place_a.name);
    if (leftName) leftName.innerText = place_a.name;
    if (leftScore) leftScore.innerText = place_a.google_rating.toFixed(1);
    
    // Tags for Place A
    if (leftTags) {
        leftTags.innerHTML = '';
        if (comparison.place_a_unique_pros && comparison.place_a_unique_pros.length > 0) {
            comparison.place_a_unique_pros.slice(0, 3).forEach(pro => {
                const span = document.createElement('span');
                span.className = 'vibe-pill';
                span.innerText = pro;
                leftTags.appendChild(span);
            });
        }
    }

    // Populate Right Column (Place B)
    document.getElementById('comp-name').innerText = place_b.name;
    document.getElementById('comp-score').innerText = place_b.google_rating.toFixed(1);
    document.getElementById('comp-icon').src = getPlaceIcon(place_b.name);

    // Tags from unique pros
    const tagContainer = document.getElementById('comp-tags');
    tagContainer.innerHTML = '';
    if (comparison.place_b_unique_pros && comparison.place_b_unique_pros.length > 0) {
        comparison.place_b_unique_pros.slice(0, 3).forEach(pro => {
            const span = document.createElement('span');
            span.className = 'vibe-pill';
            span.innerText = pro;
            tagContainer.appendChild(span);
        });
    }

    // Update bars based on winner categories
    updateBars(comparison.winner_category);

    // Verdict
    document.getElementById('verdict-text').innerText = comparison.verdict || 'No verdict available.';

    // Determine Overall Winner
    const winnerBox = document.getElementById('winner-box');
    const placeAWins = Object.values(comparison.winner_category).filter(w => w === 'place_a').length;
    const placeBWins = Object.values(comparison.winner_category).filter(w => w === 'place_b').length;
    
    if (placeBWins > placeAWins) {
        winnerBox.innerHTML = `Winner: <strong>${place_b.name}</strong> for <em>Overall Vibe</em>`;
    } else {
        winnerBox.innerHTML = `Winner: <strong>${place_a.name}</strong> for <em>Overall Vibe</em>`;
    }

    // Key Differences
    const differencesList = document.getElementById('key-differences');
    differencesList.innerHTML = '';
    if (comparison.key_differences) {
        comparison.key_differences.forEach(diff => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="diff-icon">⚡</span> ${diff}`;
            differencesList.appendChild(li);
        });
    }

    // Unique Pros
    document.getElementById('place-a-name').innerText = place_a.name;
    document.getElementById('place-b-name').innerText = place_b.name;
    
    const placeAPros = document.getElementById('place-a-pros');
    placeAPros.innerHTML = '';
    if (comparison.place_a_unique_pros) {
        comparison.place_a_unique_pros.forEach(pro => {
            const li = document.createElement('li');
            li.innerText = pro;
            placeAPros.appendChild(li);
        });
    }

    const placeBPros = document.getElementById('place-b-pros');
    placeBPros.innerHTML = '';
    if (comparison.place_b_unique_pros) {
        comparison.place_b_unique_pros.forEach(pro => {
            const li = document.createElement('li');
            li.innerText = pro;
            placeBPros.appendChild(li);
        });
    }
}

function updateBars(winnerCategory) {
    const categories = ['food', 'service', 'atmosphere', 'value'];
    
    categories.forEach(category => {
        const barRow = document.querySelector(`.bar-row[data-category="${category}"]`);
        if (!barRow) return;

        const leftBar = barRow.querySelector('.bar-fill.left');
        const rightBar = barRow.querySelector('.bar-fill.right');
        const leftValEl = barRow.querySelector('.bar-value.left .value-number');
        const rightValEl = barRow.querySelector('.bar-value.right .value-number');
        
        if (!leftBar || !rightBar) return;

        const winner = winnerCategory[category];
        
        let leftPct = 50, rightPct = 50;

        if (winner === 'place_a') {
            leftPct = 65 + Math.floor(Math.random() * 15); // 65-80
            rightPct = 100 - leftPct;
        } else if (winner === 'place_b') {
            rightPct = 65 + Math.floor(Math.random() * 15); // 65-80
            leftPct = 100 - rightPct;
        } else {
            leftPct = 50; rightPct = 50;
        }

        // Apply width via GSAP or transition
        // We'll use CSS transition by setting style, but wait for animation trigger
        // Store values in dataset for animation function
        barRow.dataset.left = leftPct;
        barRow.dataset.right = rightPct;
        
        // Update text immediately
        if (leftValEl) leftValEl.innerText = leftPct + '%';
        if (rightValEl) rightValEl.innerText = rightPct + '%';
    });
}

function getPlaceIcon(name) {
    // Simple icon mapping - can be enhanced
    const iconMap = {
        "Burger King": 'https://em-content.zobj.net/source/apple/419/hamburger_1f354.png',
        "McDonald's": 'https://em-content.zobj.net/source/apple/419/french-fries_1f35f.png',
        "KFC": 'https://em-content.zobj.net/source/apple/419/poultry-leg_1f357.png',
    };
    
    // Try to find match (case insensitive)
    for (const [key, icon] of Object.entries(iconMap)) {
        if (name.toLowerCase().includes(key.toLowerCase().split("'")[0])) {
            return icon;
        }
    }
    
    // Default icon
    return 'https://em-content.zobj.net/source/apple/419/round-pushpin_1f4cd.png';
}

function animateResultElements() {
    // Stagger animate bars
    const rows = document.querySelectorAll('.bar-row');
    rows.forEach((row, i) => {
        const leftVal = parseFloat(row.dataset.left) || 0;
        const rightVal = parseFloat(row.dataset.right) || 0;

        const leftBar = row.querySelector('.bar-fill.left');
        const rightBar = row.querySelector('.bar-fill.right');

        // Reset first
        leftBar.style.width = '0%';
        rightBar.style.width = '0%';

        // Animate
        setTimeout(() => {
            leftBar.style.width = leftVal + '%'; // Don't divide by 2, visual bar takes full width of its side? 
            // Wait, CSS: bar-visual is 100% width. Left bar and Right bar sit inside it?
            // CSS: 
            // .bar-fill.left { margin-right: auto; }
            // .bar-fill.right { margin-left: auto; }
            // They are stacked or side by side? 
            // The HTML structure has .bar-visual containing both .bar-fill.left and .bar-fill.right.
            // If they are `position: relative`, they might stack. 
            // CSS says `display: flex` on `.bar-visual`.
            // So left bar and right bar share the space.
            // So width should be proportional to 100%.
            
            leftBar.style.width = leftVal + '%';
            rightBar.style.width = rightVal + '%';
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
