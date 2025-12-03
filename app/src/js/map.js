document.addEventListener('DOMContentLoaded', () => {
    initMap();
});

// Mock Data for Detail View
const mockData = {
    '1': {
        title: 'Burger King Center',
        meta: 'Fast Food • 1.2km away',
        score: '4.8',
        lat: 51.505,
        lng: -0.09,
        icon: 'https://em-content.zobj.net/source/apple/419/hamburger_1f354.png',
        verdict: 'High energy, fast service, popular with students.',
        noise: 'High',
        light: 'Bright',
        wifi: 'Fast',
        audience: [
            { label: 'Students', pct: 60, color: '#3b82f6' },
            { label: 'Families', pct: 30, color: '#10b981' },
            { label: 'Remote Workers', pct: 10, color: '#f59e0b' }
        ]
    },
    '2': {
        title: 'KFC Downtown',
        meta: 'Chicken • 0.5km away',
        score: '4.5',
        lat: 51.51,
        lng: -0.1,
        icon: 'https://em-content.zobj.net/source/apple/419/poultry-leg_1f357.png',
        verdict: 'Casual vibe, good for quick bites.',
        noise: 'Medium',
        light: 'Standard',
        wifi: 'Okay',
        audience: [
            { label: 'Teens', pct: 50, color: '#8b5cf6' },
            { label: 'Locals', pct: 30, color: '#ec4899' },
            { label: 'Tourists', pct: 20, color: '#6366f1' }
        ]
    },
    '3': {
        title: 'McDonald\'s',
        meta: 'Burgers • 2.0km away',
        score: '4.7',
        lat: 51.51,
        lng: -0.08,
        icon: 'https://em-content.zobj.net/source/apple/419/french-fries_1f35f.png',
        verdict: 'Busy, consistent, family-friendly.',
        noise: 'High',
        light: 'Bright',
        wifi: 'Fast',
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

    // Add Dark/Light Tile Layer based on theme (or just a neutral one)
    // Using CartoDB Voyager for a clean look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
    }).addTo(map);

    // Add Zoom Control to bottom right
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

    // Map Click to deselect
    map.on('click', () => {
        clearSelection();
    });

    // Back button listener
    const backBtn = document.getElementById('back-to-list');
    if (backBtn) {
        backBtn.addEventListener('click', clearSelection);
    }
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
    document.getElementById('detail-title').innerText = data.title;
    document.querySelector('.detail-subtitle').innerText = data.meta;
    document.querySelector('.big-score').innerText = data.score;

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
    document.addEventListener('DOMContentLoaded', () => {
        initMap();
    });

    // Mock Data for Detail View
    const mockData = {
        '1': {
            title: 'Burger King Center',
            meta: 'Fast Food • 1.2km away',
            score: '4.8',
            lat: 51.505,
            lng: -0.09,
            icon: 'https://em-content.zobj.net/source/apple/419/hamburger_1f354.png',
            verdict: 'High energy, fast service, popular with students.',
            noise: 'High',
            light: 'Bright',
            wifi: 'Fast',
            audience: [
                { label: 'Students', pct: 60, color: '#3b82f6' },
                { label: 'Families', pct: 30, color: '#10b981' },
                { label: 'Remote Workers', pct: 10, color: '#f59e0b' }
            ]
        },
        '2': {
            title: 'KFC Downtown',
            meta: 'Chicken • 0.5km away',
            score: '4.5',
            lat: 51.51,
            lng: -0.1,
            icon: 'https://em-content.zobj.net/source/apple/419/poultry-leg_1f357.png',
            verdict: 'Casual vibe, good for quick bites.',
            noise: 'Medium',
            light: 'Standard',
            wifi: 'Okay',
            audience: [
                { label: 'Teens', pct: 50, color: '#8b5cf6' },
                { label: 'Locals', pct: 30, color: '#ec4899' },
                { label: 'Tourists', pct: 20, color: '#6366f1' }
            ]
        },
        '3': {
            title: 'McDonald\'s',
            meta: 'Burgers • 2.0km away',
            score: '4.7',
            lat: 51.51,
            lng: -0.08,
            icon: 'https://em-content.zobj.net/source/apple/419/french-fries_1f35f.png',
            verdict: 'Busy, consistent, family-friendly.',
            noise: 'High',
            light: 'Bright',
            wifi: 'Fast',
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

        // Add Dark/Light Tile Layer based on theme (or just a neutral one)
        // Using CartoDB Voyager for a clean look
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(map);

        // Add Zoom Control to bottom right
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

        // Map Click to deselect
        map.on('click', () => {
            clearSelection();
        });

        // Back button listener
        const backBtn = document.getElementById('back-to-list');
        if (backBtn) {
            backBtn.addEventListener('click', clearSelection);
        }
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
        document.getElementById('detail-title').innerText = data.title;
        document.querySelector('.detail-subtitle').innerText = data.meta;
        document.querySelector('.big-score').innerText = data.score;

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