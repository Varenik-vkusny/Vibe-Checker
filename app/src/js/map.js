document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderSidebarList();
    initBottomSheet();
});

// Mock Data
const mockData = {
    '1': {
        title: 'Burger King Center',
        category: 'Fast Food',
        meta: 'Fast Food • 1.2km away',
        score: '4.8',
        lat: 51.505,
        lng: -0.09,
        icon: 'https://em-content.zobj.net/source/apple/419/hamburger_1f354.png',
        tags: ['Fast', 'Cheap', 'Student Friendly'],
        verdict: 'High energy, fast service, popular with students.',
        noise: 'High',
        light: 'Bright',
        wifi: 'Fast',
        bars: { food: 80, service: 90 },
        audience: [
            { label: 'Students', pct: 60, color: '#3b82f6' },
            { label: 'Families', pct: 30, color: '#10b981' },
            { label: 'Remote', pct: 10, color: '#f59e0b' }
        ]
    },
    '2': {
        title: 'KFC Downtown',
        category: 'Chicken',
        meta: 'Chicken • 0.5km away',
        score: '4.5',
        lat: 51.51,
        lng: -0.1,
        icon: 'https://em-content.zobj.net/source/apple/419/poultry-leg_1f357.png',
        tags: ['Crispy', 'Casual'],
        verdict: 'Casual vibe, good for quick bites.',
        noise: 'Medium',
        light: 'Standard',
        wifi: 'Okay',
        bars: { food: 85, service: 60 },
        audience: [
            { label: 'Teens', pct: 50, color: '#8b5cf6' },
            { label: 'Locals', pct: 30, color: '#ec4899' },
            { label: 'Tourists', pct: 20, color: '#6366f1' }
        ]
    },
    '3': {
        title: 'McDonald\'s',
        category: 'Burgers',
        meta: 'Burgers • 2.0km away',
        score: '4.7',
        lat: 51.51,
        lng: -0.08,
        icon: 'https://em-content.zobj.net/source/apple/419/french-fries_1f35f.png',
        tags: ['Classic', '24/7'],
        verdict: 'Busy, consistent, family-friendly.',
        noise: 'High',
        light: 'Bright',
        wifi: 'Fast',
        bars: { food: 75, service: 95 },
        audience: [
            { label: 'Families', pct: 40, color: '#ef4444' },
            { label: 'Students', pct: 40, color: '#f97316' },
            { label: 'Workers', pct: 20, color: '#84cc16' }
        ]
    }
};

let map;
let markers = {};

function initMap() {
    // Initialize Leaflet Map
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([51.505, -0.09], 13);

    // Add Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(map);

    // Add Zoom Control
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Add Markers
    Object.keys(mockData).forEach(id => {
        const data = mockData[id];

        // Custom Icon
        const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
                <div class="pin-bubble">
                    <img src="${data.icon}" alt="icon">
                </div>
                <div class="pin-point"></div>
            `,
            iconSize: [40, 50],
            iconAnchor: [20, 50]
        });

        const marker = L.marker([data.lat, data.lng], { icon: customIcon }).addTo(map);

        marker.on('click', () => {
            selectPlace(id);
        });

        markers[id] = marker;
    });

    map.on('click', () => {
        clearSelection();
    });

    // Back button listener (Desktop)
    const backBtn = document.getElementById('back-to-list');
    if (backBtn) {
        backBtn.addEventListener('click', clearSelection);
    }
    
    // Back button listener (Mobile)
    const mobileBackBtn = document.getElementById('mobile-back-to-list');
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', closePlaceMobile);
    }

    // FIX: Force map resize calculation to ensure tiles load correctly
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}

function renderSidebarList() {
    // Render to both Desktop and Mobile containers
    const containers = [
        document.getElementById('places-list-container'),
        document.getElementById('mobile-places-list')
    ];
    
    containers.forEach(container => {
        if (!container) return;
        
        container.innerHTML = ''; 

        Object.keys(mockData).forEach(id => {
            const data = mockData[id];
            
            const card = document.createElement('div');
            card.className = 'place-card';
            card.dataset.id = id;
            card.onclick = () => selectPlace(id);

            card.innerHTML = `
                <div class="place-img" style="background-color: var(--bg-surface); display: flex; align-items: center; justify-content: center; font-size: 32px;">
                    <img src="${data.icon}" width="32" height="32" alt="icon">
                </div>
                <div class="place-info">
                    <div class="place-header">
                        <h3>${data.title}</h3>
                        <span class="rating-badge">${data.score}</span>
                    </div>
                    <div class="place-meta">${data.meta}</div>
                    <div class="place-vibe">
                        ${data.tags.map(tag => `<span class="vibe-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    });
}

function selectPlace(id) {
    // Highlight Marker
    Object.values(markers).forEach(m => {
        const icon = m.getElement();
        if (icon) icon.classList.remove('active');
    });
    if (markers[id]) {
        const icon = markers[id].getElement();
        if (icon) icon.classList.add('active');

        // Pan to marker
        map.flyTo(markers[id].getLatLng(), 15, {
            duration: 1.5
        });
    }

    // Highlight Card
    const cards = document.querySelectorAll('.place-card');
    cards.forEach(card => {
        if (card.dataset.id === id) card.style.background = 'var(--bg-surface)';
        else card.style.background = '';
    });

    // Update Content
    updateDetailContent(id);

    // Mobile vs Desktop Logic
    if (window.innerWidth <= 768) {
        openPlaceMobile(id);
    } else {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.add('showing-detail');
        sidebar.classList.remove('minimized');
    }
}

function clearSelection() {
    // Desktop
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('showing-detail');

    // Mobile
    closeMobileDetail();

    // Reset Markers
    Object.values(markers).forEach(m => {
        const icon = m.getElement();
        if (icon) icon.classList.remove('active');
    });

    // Reset Map View
    map.flyTo([51.505, -0.09], 13, { duration: 1.5 });
}

function updateDetailContent(id) {
    const data = mockData[id];
    if (!data) return;

    // Helper to update text by ID prefix
    const updateText = (suffix, text) => {
        const elDesktop = document.getElementById(suffix);
        const elMobile = document.getElementById('mobile-' + suffix);
        if (elDesktop) elDesktop.innerText = text;
        if (elMobile) elMobile.innerText = text;
    };

    // Helper to update style width
    const updateWidth = (suffix, width) => {
        const elDesktop = document.getElementById(suffix);
        const elMobile = document.getElementById('mobile-' + suffix);
        if (elDesktop) elDesktop.style.width = width + '%';
        if (elMobile) elMobile.style.width = width + '%';
    };

    updateText('detail-title', data.title);
    
    // Subtitle is a class query in desktop, ID in mobile (or I used class in HTML, let's check HTML)
    // HTML has <p class="detail-subtitle"> in both.
    const subs = document.querySelectorAll('.detail-subtitle');
    subs.forEach(s => s.innerText = data.meta);

    updateText('detail-score', data.score);
    
    const reviews = Math.floor(Math.random() * 500) + 50;
    updateText('detail-reviews', reviews);

    // Bars
    updateWidth('bar-food', data.bars?.food || 0);
    updateWidth('bar-service', data.bars?.service || 0);

    // AI Verdict
    updateText('detail-verdict', data.verdict || 'No analysis available.');

    // Vibe Signature
    updateText('val-noise', data.noise || '-');
    updateText('val-light', data.light || '-');
    updateText('val-wifi', data.wifi || '-');

    // Audience Bar
    // We need to target both containers
    const containers = [
        { bar: document.getElementById('audience-bar'), legend: document.getElementById('audience-legend') },
        { bar: document.getElementById('mobile-audience-bar'), legend: document.getElementById('mobile-audience-legend') }
    ];

    containers.forEach(({ bar, legend }) => {
        if (bar && legend && data.audience) {
            bar.innerHTML = '';
            legend.innerHTML = '';

            data.audience.forEach(segment => {
                const segDiv = document.createElement('div');
                segDiv.className = 'split-seg';
                segDiv.style.width = segment.pct + '%';
                segDiv.style.backgroundColor = segment.color;
                segDiv.dataset.label = segment.label;
                bar.appendChild(segDiv);

                const legItem = document.createElement('div');
                legItem.className = 'legend-item';
                legItem.innerHTML = `
                    <span class="legend-dot" style="background:${segment.color}"></span>
                    <span>${segment.label} (${segment.pct}%)</span>
                `;
                legend.appendChild(legItem);
            });
        }
    });
}

// Function triggered when a user clicks a pin or a list item
function openPlaceMobile(id) {
    const dock = document.querySelector('.mobile-nav-overlay');
    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    const listView = document.getElementById('sheet-list-view');
    const detailView = document.getElementById('sheet-detail-view');
    const actionBar = document.querySelector('.place-action-bar');

    // 1. Hide the Global Nav Dock
    if (dock) dock.classList.add('dock-hidden');

    // 2. Expand the Sheet completely
    if (bottomSheet) {
        bottomSheet.classList.remove('collapsed');
        bottomSheet.classList.add('expanded');
    }

    // 3. Swap Content (List -> Detail)
    if (listView) listView.style.display = 'none';
    if (detailView) detailView.classList.add('active');
    
    // 4. Populate Data
    updateDetailContent(id);

    // 5. Slide up the specific Place Actions (Directions/Compare)
    if (actionBar) actionBar.classList.add('visible');
}

// Function triggered when user clicks "Back" or "Close"
function closePlaceMobile() {
    const dock = document.querySelector('.mobile-nav-overlay');
    const listView = document.getElementById('sheet-list-view');
    const detailView = document.getElementById('sheet-detail-view');
    const actionBar = document.querySelector('.place-action-bar');

    // 1. Hide Place Actions
    if (actionBar) actionBar.classList.remove('visible');

    // 2. Swap Content (Detail -> List)
    if (detailView) detailView.classList.remove('active');
    setTimeout(() => {
        if (listView) listView.style.display = 'block';
    }, 200); // Wait for fade out

    // 3. Bring back the Global Dock
    if (dock) dock.classList.remove('dock-hidden');
}

function initBottomSheet() {
    const sheet = document.getElementById('mobile-bottom-sheet');
    if (!sheet) return;

    const handle = document.getElementById('sheet-toggle');
    const searchInput = sheet.querySelector('input');
    
    // Toggle Function
    const toggleSheet = (forceState = null) => {
        if (forceState === 'expand') {
            sheet.classList.remove('collapsed');
            sheet.classList.add('expanded');
        } else if (forceState === 'collapse') {
            sheet.classList.remove('expanded');
            sheet.classList.add('collapsed');
            // Blur input to hide keyboard
            if (searchInput) searchInput.blur();
        } else {
            // Toggle
            if (sheet.classList.contains('collapsed')) {
                toggleSheet('expand');
            } else {
                toggleSheet('collapse');
            }
        }
    };

    // Events
    if (handle) {
        handle.addEventListener('click', () => toggleSheet());
    }
    
    // Expand when typing
    if (searchInput) {
        searchInput.addEventListener('focus', () => toggleSheet('expand'));
    }

    // Collapse when clicking the map
    const mapEl = document.getElementById('map');
    if (mapEl) {
        mapEl.addEventListener('click', () => toggleSheet('collapse'));
    }

    // Handle "Places" nav click to toggle
    const placesNav = document.querySelector('.mobile-nav-overlay a[data-target="places"]');
    if (placesNav) {
        placesNav.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSheet();
        });
    }
    
    initGestures(sheet);
}

function initGestures(sheet) {
    const handle = document.getElementById('sheet-toggle');
    if (!handle) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const threshold = 50; // Distance to trigger state change

    const onTouchStart = (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        sheet.style.transition = 'none'; // Disable CSS transition for direct tracking
    };

    const onTouchMove = (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        // Simple resistance/tracking logic could go here
        // For now, we just track the delta for the end event
    };

    const onTouchEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = ''; // Re-enable CSS transition

        const deltaY = currentY - startY;

        // Determine direction
        if (deltaY < -threshold) {
            // Swipe UP -> Expand
            sheet.classList.remove('collapsed');
            sheet.classList.add('expanded');
        } else if (deltaY > threshold) {
            // Swipe DOWN -> Collapse
            sheet.classList.remove('expanded');
            sheet.classList.add('collapsed');
            
            // Also close detail view if open?
            // closeMobileDetail(); // Optional
        } else {
            // Snap back to nearest or current state logic
        }
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('touchmove', onTouchMove, { passive: true });
    handle.addEventListener('touchend', onTouchEnd);
}
