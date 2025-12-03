
const themeStorageKey = 'vibecheck-theme';
const darkThemeClass = 'dark-theme';
const toggleBtnSelector = '.theme-toggle-btn';

function getPreferredTheme() {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add(darkThemeClass);
    } else {
        document.body.classList.remove(darkThemeClass);
    }
    localStorage.setItem(themeStorageKey, theme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains(darkThemeClass);
    setTheme(isDark ? 'light' : 'dark');
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    setTheme(getPreferredTheme());

    // Bind Button
    const btn = document.querySelector(toggleBtnSelector);
    if (btn) {
        btn.addEventListener('click', toggleTheme);
    }
});

// Avoid transition flicker on load
(function avoidFlicker() {
    const theme = localStorage.getItem(themeStorageKey) || 
                  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') {
        document.body.classList.add(darkThemeClass);
    }
})();
