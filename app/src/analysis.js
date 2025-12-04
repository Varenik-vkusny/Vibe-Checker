const reviewsData = [
    {
        name: "Jessica Miller",
        date: "2 days ago",
        verified: true,
        rating: 5,
        text: "Honestly, the fries are consistently hot and salted perfectly. Best fast food joint in the area.",
        tags: ["fries", "hot"],
        highlightType: "green",
        highlightPhrase: "fries are consistently hot"
    },
    {
        name: "David Kim",
        date: "1 week ago",
        verified: true,
        rating: 2,
        text: "Food is okay but the restrooms are messy. Water was everywhere on the floor. Needs attention.",
        tags: ["clean", "messy"],
        highlightType: "red",
        highlightPhrase: "restrooms are messy"
    },
    {
        name: "Sarah Lee",
        date: "3 weeks ago",
        verified: false,
        rating: 5,
        text: "I come here specifically for the fries. They are always fresh and crispy! The staff is super quick too!",
        tags: ["fries", "fresh"],
        highlightType: "green",
        highlightPhrase: "fresh and crispy"
    },
    {
        name: "John Doe",
        date: "1 week ago",
        verified: true,
        rating: 3,
        text: "Food is great but the tables were sticky. I had to ask someone to clean it before I sat down.",
        tags: ["clean", "tables"],
        highlightType: "red",
        highlightPhrase: "tables were sticky"
    },
    {
        name: "Mike Ross",
        date: "3 weeks ago",
        verified: true,
        rating: 4,
        text: "Good vibe for a quick lunch. Wi-Fi is surprisingly fast, got some work done.",
        tags: ["wifi"],
        highlightType: "green",
        highlightPhrase: "Wi-Fi is surprisingly fast"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    renderReviews(reviewsData);
    setupFilters();
});

// Exposed function for clicking links in the Pros/Cons list
window.filterReviews = function(keyword) {
    document.getElementById('reviews-anchor').scrollIntoView({ behavior: 'smooth' });
    const searchInput = document.getElementById('review-search');
    searchInput.value = keyword;

    // Visual cue
    searchInput.parentElement.style.borderColor = '#3b82f6';
    setTimeout(() => { searchInput.parentElement.style.borderColor = ''; }, 1000);

    const filtered = reviewsData.filter(r => 
        r.text.toLowerCase().includes(keyword.toLowerCase()) || 
        r.tags.some(tag => tag.includes(keyword.toLowerCase()))
    );
    renderReviews(filtered);
}

function setupFilters() {
    const searchInput = document.getElementById('review-search');
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = reviewsData.filter(r => r.text.toLowerCase().includes(val));
        renderReviews(filtered);
    });

    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            const filter = chip.dataset.filter;
            if(filter === 'all') {
                renderReviews(reviewsData);
            } else {
                const filtered = reviewsData.filter(r => 
                    r.tags.includes(filter) || 
                    r.text.toLowerCase().includes(filter)
                );
                renderReviews(filtered);
            }
        });
    });
}

function renderReviews(data) {
    const grid = document.getElementById('reviews-grid');
    grid.innerHTML = '';

    if (data.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No reviews found.</div>`;
        return;
    }

    data.forEach(r => {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        const initials = r.name.split(' ').map(n=>n[0]).join('');
        const verifiedHtml = r.verified ? `<span class="verified-badge">Verified</span>` : '';
        
        // Stars
        let starsHtml = '<div style="display:flex; gap:2px;">';
        for(let i=1; i<=5; i++) {
            const cls = i <= r.rating ? '' : 'gray';
            // Simple gray fill or orange fill based on class
            const fill = i <= r.rating ? '#f59e0b' : (document.body.classList.contains('dark-theme') ? '#374151' : '#e5e7eb');
            starsHtml += `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${fill}">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>`;
        }
        starsHtml += '</div>';

        // Highlight logic
        let reviewText = r.text;
        if(r.highlightPhrase) {
            const cls = r.highlightType === 'red' ? 'highlight red' : 'highlight green';
            reviewText = reviewText.replace(r.highlightPhrase, `<span class="${cls}">${r.highlightPhrase}</span>`);
        }

        // Tags
        const tagsHtml = r.tags.map(t => `<span class="review-tag">#${t}</span>`).join('');

        card.innerHTML = `
            <div class="rc-header">
                <div class="user-info">
                    <div class="avatar">${initials}</div>
                    <div>
                        <span class="u-name">${r.name}</span>
                        <div class="u-meta">
                            ${starsHtml} <span style="margin: 0 4px">•</span> ${r.date}
                        </div>
                    </div>
                </div>
                ${verifiedHtml}
            </div>
            <div class="rc-body">"${reviewText}"</div>
            <div>${tagsHtml}</div>
        `;
        grid.appendChild(card);
    });
}