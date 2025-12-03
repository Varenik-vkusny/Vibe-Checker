document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initSearchInteraction();
});

// Жидкость инициализируем только когда всё загружено (стили, скрипты, размеры)
window.addEventListener('load', () => {
    initFluidCanvas();
});

function initSmoothScroll() {
    const lenis = new Lenis({
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

function initSearchInteraction() {
    const searchInput = document.getElementById('search-input');
    const searchWrapper = document.getElementById('search-wrapper');

    if (!searchInput || !searchWrapper) return;

    searchInput.addEventListener('focus', () => {
        searchWrapper.classList.add('active');
    });

    document.addEventListener('click', (e) => {
        if (!searchWrapper.contains(e.target)) {
            searchWrapper.classList.remove('active');
        }
    });
}

function initFluidCanvas() {
    const canvas = document.getElementById('fluid-canvas');
    if (!canvas) {
        console.warn('Canvas not found');
        return;
    }

    // Принудительно задаем размер перед стартом
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeCanvas);

    // Скрываем GUI от fluid-sim библиотеки
    setTimeout(() => {
        const gui = document.querySelector('.dg.ac');
        if (gui) gui.style.display = 'none';
    }, 500); // Чуть увеличили задержку
}