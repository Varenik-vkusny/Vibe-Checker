const headerTemplate = `
<header class="header">
    <a href="index.html" class="logo">VibeCheck</a>
    
    <nav class="nav-center">
        <ul class="nav-links">
            <li>
                <a href="map.html" class="nav-item">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Places</span>
                </a>
            </li>
            <li>
                <a href="compare.html" class="nav-item">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Compare</span>
                </a>
            </li>
            <li>
                <a href="pro.html" class="nav-item">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>AI Analysis</span>
                </a>
            </li>
            <li class="mobile-only">
                <a href="login.html" class="nav-item">
                    <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                </a>
            </li>
        </ul>
    </nav>
    
    <div class="header-right">
        <button class="theme-toggle-btn" aria-label="Toggle Dark Mode">
            <svg class="theme-icon sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg class="theme-icon moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        </button>
        <a href="login.html" class="btn btn--outline desktop-only">Sign In</a>
    </div>
</header>
`;

function initHeader() {
    const headerContainer = document.getElementById('app-header');
    if (!headerContainer) return;

    headerContainer.innerHTML = headerTemplate;

    // Highlight Active Link
    const currentPath = window.location.pathname;
    // Extract filename (e.g., 'map.html' from '/map.html')
    const page = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-item').forEach(link => {
        if (link.getAttribute('href') === page) {
            link.classList.add('active');
        }
    });

    // Pro Mode Detection
    const isPro = page === 'pro.html' || document.body.classList.contains('pro-body');
    if (isPro) {
        const header = headerContainer.querySelector('.header');
        if (header) {
            header.classList.add('header--pro');
            
            // Swap "Sign In" for "Exit Pro Mode"
            const signInBtn = header.querySelector('.btn--outline');
            if (signInBtn) {
                signInBtn.textContent = 'Exit Pro Mode';
                signInBtn.href = 'index.html';
            }
        }
    }
}

// Execute immediately
initHeader();
