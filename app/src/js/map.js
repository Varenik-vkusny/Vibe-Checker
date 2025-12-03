document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderSidebarList();
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

    // Back button listener
    const backBtn = document.getElementById('back-to-list');
    if (backBtn) {
        backBtn.addEventListener('click', clearSelection);
    }

    // FIX: Force map resize calculation to ensure tiles load correctly
    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}

function renderSidebarList() {
    const container = document.getElementById('places-list-container');
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
}

function selectPlace(id) {
    const sidebar = document.getElementById('sidebar');
    const cards = document.querySelectorAll('.place-card');

    // 1. Update UI Classes
    sidebar.classList.add('showing-detail');

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
    cards.forEach(card => {
        if (card.dataset.id === id) card.style.background = 'var(--bg-surface)';
        else card.style.background = '';
    });

    // 2. Update Content
    updateDetailContent(id);
}

function clearSelection() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('showing-detail');

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

    // Basic Info
    const titleEl = document.getElementById('detail-title');
    const subtitleEl = document.querySelector('.detail-subtitle');
    const scoreEl = document.getElementById('detail-score');
    const reviewsEl = document.getElementById('detail-reviews');

    if (titleEl) titleEl.innerText = data.title;
    if (subtitleEl) subtitleEl.innerText = data.meta;
    if (scoreEl) scoreEl.innerText = data.score;
    if (reviewsEl) reviewsEl.innerText = Math.floor(Math.random() * 500) + 50;

    // Bars
    const barFood = document.getElementById('bar-food');
    const barService = document.getElementById('bar-service');
    if (barFood) barFood.style.width = (data.bars?.food || 0) + '%';
    if (barService) barService.style.width = (data.bars?.service || 0) + '%';

    // AI Verdict
    const verdictEl = document.getElementById('detail-verdict');
    if (verdictEl) verdictEl.innerText = data.verdict || 'No analysis available.';

    // Vibe Signature
    const noiseEl = document.getElementById('val-noise');
    const lightEl = document.getElementById('val-light');
    const wifiEl = document.getElementById('val-wifi');
    if (noiseEl) noiseEl.innerText = data.noise || '-';
    if (lightEl) lightEl.innerText = data.light || '-';
    if (wifiEl) wifiEl.innerText = data.wifi || '-';

    // Audience Bar
    const barContainer = document.getElementById('audience-bar');
    const legendContainer = document.getElementById('audience-legend');

    if (barContainer && legendContainer && data.audience) {
        barContainer.innerHTML = '';
        legendContainer.innerHTML = '';

        data.audience.forEach(segment => {
            // Bar Segment
            const segDiv = document.createElement('div');
            segDiv.className = 'split-seg';
            segDiv.style.width = segment.pct + '%';
            segDiv.style.backgroundColor = segment.color;
            segDiv.dataset.label = segment.label;
            barContainer.appendChild(segDiv);

            // Legend Item
            const legItem = document.createElement('div');
            legItem.className = 'legend-item';
            legItem.innerHTML = `
                <span class="legend-dot" style="background:${segment.color}"></span>
                <span>${segment.label} (${segment.pct}%)</span>
            `;
            legendContainer.appendChild(legItem);
        });
    }
}