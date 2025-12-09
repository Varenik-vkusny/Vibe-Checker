document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initVibeChart();
    initSettingsSync();
});

function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.tab-view');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(view => {
                if (view.id === `view-${target}`) {
                    view.classList.add('active');
                    gsap.fromTo(view, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 });
                } else {
                    view.classList.remove('active');
                }
            });
        });
    });
}

let vibeChart = null;

function initVibeChart() {
    const canvas = document.getElementById('radar-chart-canvas');
    if (!canvas) return;
    
    // Read from body to get dark theme overrides
    const getCssVar = (varName) => getComputedStyle(document.body).getPropertyValue(varName).trim();

    if (vibeChart) vibeChart.destroy();

    const chartData = {
        labels: ["Quiet", "Cost", "Wi-Fi", "Social", "Food"],
        datasets: [{
            label: 'Vibe Preference',
            data: [0.8, 0.6, 0.9, 0.4, 0.7],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
        }]
    };

    const chartConfig = {
        type: 'radar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart'
            },
            scales: {
                r: {
                    angleLines: {
                        color: getCssVar('--chart-grid')
                    },
                    grid: {
                        color: getCssVar('--chart-grid')
                    },
                    pointLabels: {
                        font: {
                            family: getCssVar('--font-mono'),
                            size: 11
                        },
                        color: getCssVar('--text-muted')
                    },
                    ticks: {
                        display: false,
                        backdropColor: 'transparent',
                        max: 1,
                        min: 0,
                        stepSize: 0.25
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    };
    
    new Chart(canvas, chartConfig);
}

function initSettingsSync() {
    const toggle = document.getElementById('setting-theme-toggle');
    if (toggle) {
        const isDark = document.body.classList.contains('dark-theme');
        toggle.checked = isDark;

        toggle.addEventListener('change', () => {
            const globalBtn = document.querySelector('.theme-toggle-btn');
            if (globalBtn) globalBtn.click();
        });
    }

    // Observe theme changes to update chart
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                initVibeChart(); // Re-render chart with new colors
            }
        });
    });
    observer.observe(document.body, { attributes: true });
}
