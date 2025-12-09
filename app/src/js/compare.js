document.addEventListener('DOMContentLoaded', () => {
    initComparison();
});

const placeAData = {
    name: "Burger King",
    stats: { food: 80, service: 74, noise: 65 },
    pros: ["Consistent taste", "Fast service", "Good location"],
    color: "#2563eb" // Blue
};

function initComparison() {
    // UI Elements
    const addBtn = document.getElementById('add-place-btn');
    const resetBtn = document.getElementById('reset-btn');
    const modal = document.getElementById('compare-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalItems = document.querySelectorAll('.modal-item');
    
    // Actions & Views
    const compareActions = document.getElementById('compare-actions');
    const detailedView = document.getElementById('detailed-comparison');
    const triggerBtn = document.getElementById('trigger-compare-btn');
    const closeDetailBtn = document.getElementById('close-detail-btn');

    // Card Elements
    const cardB = document.getElementById('card-b');
    const cardBContent = cardB.querySelector('.competitor-content');

    // Modal Interactions
    if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
            modal.classList.add('active');
            gsap.fromTo('.modal-glass', 
                { y: 20, opacity: 0, scale: 0.95 }, 
                { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
            );
        });
    }

    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            closeModalFunc();
        });
    }

    // Modal Item Selection
    modalItems.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            
            // 1. Close Modal
            closeModalFunc();

            // 2. Load Data
            const data = getMockComparisonData(id);
            populateCompetitorCard(data);
            populateDetailedView(data);

            // 3. UI Transition
            // Hide Add Button
            addBtn.classList.add('hidden');
            
            // Show Card Content
            cardB.classList.remove('empty');
            cardB.classList.add('filled');
            cardBContent.classList.remove('hidden');
            
            // Animate Entrance
            gsap.fromTo(cardBContent, 
                { opacity: 0, y: 10 }, 
                { opacity: 1, y: 0, duration: 0.4, delay: 0.1 }
            );

            // 4. Show Compare Actions
            compareActions.classList.remove('hidden');
            gsap.fromTo(compareActions,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, delay: 0.3, ease: "power2.out" }
            );

            // 5. Trigger Bar Animations (Card)
            setTimeout(() => {
                animateBars(data);
            }, 500);

            // 6. Mobile Story Mode: Auto-Advance to Verdict
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    // Unhide detailed view so it joins the scroll track
                    detailedView.classList.remove('hidden');
                    
                    // Scroll to the end (Slide 3)
                    const engine = document.querySelector('.comparison-engine');
                    if (engine) {
                        engine.scrollTo({
                            left: engine.scrollWidth,
                            behavior: 'smooth'
                        });
                    }
                    
                    // Animate the detail bars
                    animateDetailBars();
                }, 1200);
            }
        });
    });

    // Reset Comparison
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click
            
            // Hide Actions
            compareActions.classList.add('hidden');
            detailedView.classList.add('hidden'); // Close detail if open

            // Reset Card B
            gsap.to(cardBContent, { opacity: 0, duration: 0.3, onComplete: () => {
                cardBContent.classList.add('hidden');
                addBtn.classList.remove('hidden');
                
                cardB.classList.remove('filled');
                cardB.classList.add('empty');

                // Reset Bars
                resetBarWidths();
            }});
        });
    }

    // Open Detailed View
    if (triggerBtn) {
        triggerBtn.addEventListener('click', () => {
            detailedView.classList.remove('hidden');
            // Animate In
            gsap.fromTo(detailedView, 
                { opacity: 0, y: 50 }, 
                { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
            );
            
            // Trigger Bar Animations (Detail)
            animateDetailBars();
        });
    }

    // Close Detailed View
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            gsap.to(detailedView, { opacity: 0, y: 50, duration: 0.3, onComplete: () => {
                detailedView.classList.add('hidden');
            }});
        });
    }

    function closeModalFunc() {
        if (!modal) return;
        modal.classList.remove('active');
    }

    // Story Progress Logic (Mobile)
    const engine = document.querySelector('.comparison-engine');
    const progressBars = document.querySelectorAll('.story-progress .progress-bar');

    if (engine && progressBars.length > 0) {
        const updateProgress = () => {
            const scrollLeft = engine.scrollLeft;
            const width = window.innerWidth;
            const index = Math.round(scrollLeft / width);
            
            progressBars.forEach((bar, i) => {
                if (i <= index) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            });
        };

        engine.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        
        // Initial call
        updateProgress();
    }
}

function getMockComparisonData(id) {
    const mockData = {
        'mcd': {
            name: "McDonald's",
            meta: "Fast Food • 0.8km",
            score: "8.9",
            img: "https://em-content.zobj.net/source/apple/419/french-fries_1f35f.png",
            stats: {
                food: 75,
                vibe: 50,
                service: 88,
                noise: 80
            },
            pros: ["Cheaper", "Better Fries", "More locations"],
            verdict: "McDonald's is faster and cheaper, but Burger King wins on taste.",
            winner: "Burger King",
            diff: "+0.3"
        },
        'kfc': {
            name: "KFC",
            meta: "Chicken • 0.5km",
            score: "8.5",
            img: "https://em-content.zobj.net/source/apple/419/poultry-leg_1f357.png",
            stats: {
                food: 85,
                vibe: 55,
                service: 60,
                noise: 50
            },
            pros: ["Better Chicken", "Spicy Options", "Less Crowded"],
            verdict: "KFC has superior chicken quality, but Burger King offers a better overall vibe for sitting down.",
            winner: "Burger King",
            diff: "+0.7"
        }
    };
    return mockData[id] || mockData['mcd'];
}

function populateCompetitorCard(data) {
    document.getElementById('comp-name').innerText = data.name;
    document.getElementById('comp-meta').innerText = data.meta;
    document.getElementById('comp-score').innerText = data.score;
    document.getElementById('comp-img').src = data.img;
}

function populateDetailedView(data) {
    // Verdict
    document.getElementById('detailed-winner').querySelector('span').innerText = data.winner;
    document.getElementById('detailed-summary').innerText = data.verdict;

    // Pros lists
    const prosA = document.getElementById('pros-a');
    const prosB = document.getElementById('pros-b');
    
    // Place A Pros
    prosA.innerHTML = placeAData.pros.map(p => `<li>${p}</li>`).join('');
    // Place B Pros
    prosB.innerHTML = data.pros.map(p => `<li>${p}</li>`).join('');

    // Metrics Values
    const rows = document.querySelectorAll('.metric-compare-group');
    
    // Food
    rows[0].querySelector('.val-a').innerText = placeAData.stats.food + '%';
    rows[0].querySelector('.val-b').innerText = data.stats.food + '%';
    rows[0].dataset.valA = placeAData.stats.food;
    rows[0].dataset.valB = data.stats.food;

    // Service
    rows[1].querySelector('.val-a').innerText = placeAData.stats.service + '%';
    rows[1].querySelector('.val-b').innerText = data.stats.service + '%';
    rows[1].dataset.valA = placeAData.stats.service;
    rows[1].dataset.valB = data.stats.service;

    // Noise
    rows[2].querySelector('.val-a').innerText = placeAData.stats.noise + '%';
    rows[2].querySelector('.val-b').innerText = data.stats.noise + '%';
    rows[2].dataset.valA = placeAData.stats.noise;
    rows[2].dataset.valB = data.stats.noise;
}

function animateBars(data) {
    // Animate Card B Bars
    const foodBar = document.getElementById('comp-bar-food');
    const vibeBar = document.getElementById('comp-bar-vibe');

    if (foodBar) foodBar.style.width = data.stats.food + '%';
    if (vibeBar) vibeBar.style.width = data.stats.vibe + '%';
}

function animateDetailBars() {
    const groups = document.querySelectorAll('.metric-compare-group');
    groups.forEach(group => {
        const valA = group.dataset.valA;
        const valB = group.dataset.valB;
        
        const barA = group.querySelector('.bar-a');
        const barB = group.querySelector('.bar-b');
        
        // Reset
        barA.style.width = '0%';
        barB.style.width = '0%';

        // Animate
        setTimeout(() => {
            barA.style.width = valA + '%';
            barB.style.width = valB + '%';
        }, 100);
    });
}

function resetBarWidths() {
    document.getElementById('comp-bar-food').style.width = '0%';
    document.getElementById('comp-bar-vibe').style.width = '0%';
}
