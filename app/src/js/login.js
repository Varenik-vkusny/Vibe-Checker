document.addEventListener('DOMContentLoaded', () => {
    initAuthToggle();
    initAnimations();
});

function initAuthToggle() {
    const toggles = document.querySelectorAll('.auth-toggle-btn');
    const bg = document.querySelector('.auth-toggle-bg');
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    if (!toggles.length || !bg) return;

    toggles.forEach((toggle, index) => {
        toggle.addEventListener('click', () => {
            // 1. Update Buttons
            toggles.forEach(t => t.classList.remove('active'));
            toggle.classList.add('active');

            // 2. Move Background Pill
            // 0% for first item, 100% (relative to width) for second
            const translateVal = index === 0 ? '0%' : '100%';
            bg.style.transform = `translateX(${translateVal})`;

            // 3. Switch Forms with GSAP
            const target = toggle.dataset.target;
            
            if (target === 'login') {
                animateFormSwitch(registerForm, loginForm);
            } else {
                animateFormSwitch(loginForm, registerForm);
            }
        });
    });
}

function animateFormSwitch(fromForm, toForm) {
    // Current form fades out and slides left
    gsap.to(fromForm, {
        opacity: 0,
        x: -20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
            fromForm.classList.remove('active');
            fromForm.style.display = 'none'; // Ensure it doesn't take space
            
            // Prepare new form
            toForm.style.display = 'block';
            toForm.classList.add('active');
            
            gsap.fromTo(toForm, 
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    });
}

function initAnimations() {
    // Initial entrance animation for inputs
    gsap.from('.input-group', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2
    });
}

// Fluid simulation configuration override for Login Page
// If needed, we can make the background more subtle
window.addEventListener('load', () => {
    // Wait for the main fluid sim to init, then maybe adjust config if we had access to the variable
    // Since config is local in fluid-sim.js, we rely on CSS opacity changes in login.css/base.css
});