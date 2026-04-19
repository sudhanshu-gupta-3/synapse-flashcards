// ── Synapse View Renderers ──
const Views = {
    async dashboard() {
        const main = document.getElementById('main-content');
        main.innerHTML = '<div class="spinner"></div>';
        try {
            const [decks, stats, heatmap] = await Promise.all([API.getDecks(), API.getStats(), API.getHeatmap()]);
            const icons = {
                cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
                fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c.5 4-3 6-3 10a5 5 0 0010 0c0-4-3-6-3-10"/></svg>',
                check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
                target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
            };
            main.innerHTML = `
                <div class="page-header animate-in"><h1>Dashboard</h1><p>Welcome back! Here's your learning overview.</p></div>
                <div class="stats-grid">
                    ${Components.statCard(stats.total_cards, 'Total Cards', 'purple', icons.cards)}
                    ${Components.statCard('🔥 ' + stats.streak, 'Day Streak', 'yellow', icons.fire)}
                    ${Components.statCard(stats.accuracy + '%', 'Accuracy', 'green', icons.check)}
                    ${Components.statCard(stats.mastered, 'Mastered', 'teal', icons.target)}
                </div>
                ${Components.heatmap(heatmap)}
                <div style="display:flex;align-items:center;justify-content:space-between;margin:32px 0 16px">
                    <h2 style="font-size:1.2rem">Your Decks</h2>
                    <button class="btn btn-primary btn-sm" onclick="App.navigate('upload')">+ New Deck</button>
                </div>
                ${decks.length > 0
                    ? `<div class="deck-grid">${decks.map(d => Components.deckCard(d)).join('')}</div>`
                    : `<div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <h3>No decks yet</h3><p>Upload a PDF to create your first flashcard deck!</p>
                        <button class="btn btn-primary" onclick="App.navigate('upload')">Upload PDF</button>
                    </div>`
                }`;
        } catch (e) { main.innerHTML = `<div class="empty-state"><h3>Error loading dashboard</h3><p>${e.message}</p></div>`; }
    },

    upload() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <div class="page-header animate-in"><h1>Upload PDF</h1><p>Drop a PDF and Synapse will generate smart flashcards from it.</p></div>
            <div class="upload-zone animate-in stagger-1" id="upload-zone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <h3>Drag & drop your PDF here</h3>
                <p>or click to browse • Max 16MB</p>
                <input type="file" accept=".pdf" id="file-input">
            </div>
            <div class="upload-progress" id="upload-progress" style="display:none">
                <div class="spinner"></div>
                <div class="progress-bar-container"><div class="progress-bar-fill" id="progress-fill" style="width:0%"></div></div>
                <div class="upload-status" id="upload-status">Uploading PDF...</div>
            </div>`;
        const zone = document.getElementById('upload-zone');
        const input = document.getElementById('file-input');
        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); });
        input.addEventListener('change', () => { if (input.files[0]) handleUpload(input.files[0]); });

        async function handleUpload(file) {
            if (!file.name.toLowerCase().endsWith('.pdf')) { Components.toast('Please upload a PDF file', 'error'); return; }
            zone.style.display = 'none';
            const prog = document.getElementById('upload-progress');
            const fill = document.getElementById('progress-fill');
            const status = document.getElementById('upload-status');
            prog.style.display = 'block';
            try {
                status.textContent = 'Uploading PDF...';
                const data = await API.uploadPDF(file, (pct) => { fill.style.width = pct + '%'; });
                fill.style.width = '70%'; status.textContent = 'Generating flashcards with AI...';
                await new Promise(r => setTimeout(r, 500));
                fill.style.width = '100%'; status.textContent = `✨ Created ${data.deck?.card_count || 0} flashcards!`;
                Components.toast(data.message || 'Deck created!', 'success');
                Components.confetti();
                setTimeout(() => App.navigate(`deck/${data.deck.id}`), 1500);
            } catch (e) {
                status.textContent = '❌ ' + e.message;
                Components.toast(e.message, 'error');
                setTimeout(() => { prog.style.display = 'none'; zone.style.display = ''; }, 2000);
            }
        }
    },

    async deckView(deckId) {
        const main = document.getElementById('main-content');
        main.innerHTML = '<div class="spinner"></div>';
        try {
            const deck = await API.getDeck(deckId);
            const cards = deck.cards || [];
            main.innerHTML = `
                <div class="deck-header animate-in">
                    <div class="deck-header-left">
                        <h1>${Components.esc(deck.name)}</h1>
                        <p>${Components.esc(deck.description || '')} • ${deck.card_count} cards</p>
                    </div>
                    <div class="deck-header-actions">
                        <button class="btn btn-primary" onclick="App.navigate('review/${deckId}')" ${cards.length===0?'disabled':''}>
                            ▶ Start Review${deck.due > 0 ? ` (${deck.due} due)` : ''}
                        </button>
                        <button class="btn btn-secondary" onclick="App.showAddCardModal(${deckId})">+ Add Card</button>
                        <button class="btn btn-danger btn-sm" onclick="App.confirmDeleteDeck(${deckId})">Delete Deck</button>
                    </div>
                </div>
                <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
                    ${Components.masteryRing(deck.mastered, deck.learning, deck.card_count, 72)}
                    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
                        <span style="font-size:0.8rem">🟢 Mastered: ${deck.mastered}</span>
                        <span style="font-size:0.8rem">🟡 Learning: ${deck.learning}</span>
                        <span style="font-size:0.8rem">⚪ New: ${deck.new}</span>
                    </div>
                </div>
                <div class="card-list" id="card-list">
                    ${cards.length > 0 ? cards.map(c => Components.cardItem(c)).join('') :
                    '<div class="empty-state"><h3>No cards yet</h3><p>Add cards manually or re-upload a PDF.</p></div>'}
                </div>`;
        } catch (e) { main.innerHTML = `<div class="empty-state"><h3>Deck not found</h3><p>${e.message}</p><button class="btn btn-primary" onclick="App.navigate('dashboard')">Go Home</button></div>`; }
    },

    async review(deckId) {
        const main = document.getElementById('main-content');
        main.innerHTML = '<div class="spinner"></div>';
        try {
            const data = await API.getReviewCards(deckId);
            if (!data.cards || data.cards.length === 0) {
                main.innerHTML = `<div class="session-summary animate-in"><h2>🎉 All caught up!</h2><p class="summary-subtitle">No cards are due for review right now.</p><button class="btn btn-primary" onclick="App.navigate('deck/${deckId}')">Back to Deck</button></div>`;
                return;
            }
            const session = { cards: data.cards, current: 0, results: [], deckId, deckName: data.deck.name };
            window._reviewSession = session;
            renderReviewCard(session);
        } catch (e) { main.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
    },

    async stats() {
        const main = document.getElementById('main-content');
        main.innerHTML = '<div class="spinner"></div>';
        try {
            const [stats, heatmap] = await Promise.all([API.getStats(), API.getHeatmap()]);
            const icons = {
                review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
                today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
            };
            main.innerHTML = `
                <div class="page-header animate-in"><h1>Statistics</h1><p>Your learning analytics at a glance.</p></div>
                <div class="stats-grid">
                    ${Components.statCard(stats.total_reviews, 'Total Reviews', 'purple', icons.review)}
                    ${Components.statCard(stats.today.reviewed, 'Today', 'teal', icons.today)}
                    ${Components.statCard(stats.accuracy + '%', 'Accuracy', 'green', icons.review)}
                    ${Components.statCard(stats.mastered + '/' + stats.total_cards, 'Mastered', 'yellow', icons.review)}
                </div>
                ${Components.heatmap(heatmap)}
                <div class="stats-grid" style="margin-top:24px">
                    <div class="stat-card animate-in"><div class="stat-value" style="color:var(--green)">${stats.mastered}</div><div class="stat-label">Mastered Cards</div></div>
                    <div class="stat-card animate-in"><div class="stat-value" style="color:var(--yellow)">${stats.learning}</div><div class="stat-label">Learning</div></div>
                    <div class="stat-card animate-in"><div class="stat-value" style="color:var(--text-muted)">${stats.new}</div><div class="stat-label">New Cards</div></div>
                </div>`;
        } catch (e) { main.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`; }
    },

    searchResults(results) {
        const main = document.getElementById('main-content');
        const deckHtml = results.decks.length > 0 ? `<h3>Decks</h3><div class="deck-grid">${results.decks.map(d => Components.deckCard(d)).join('')}</div>` : '';
        const cardHtml = results.cards.length > 0 ? `<h3 style="margin-top:24px">Cards</h3><div class="card-list">${results.cards.map(c => Components.cardItem(c)).join('')}</div>` : '';
        main.innerHTML = `<div class="page-header animate-in"><h1>Search Results</h1></div><div class="search-results">${deckHtml}${cardHtml}${!deckHtml && !cardHtml ? '<div class="empty-state"><h3>No results found</h3></div>' : ''}</div>`;
    }
};

// ── Review Card Renderer ──
function renderReviewCard(session) {
    const main = document.getElementById('main-content');
    const card = session.cards[session.current];
    const progress = ((session.current) / session.cards.length * 100).toFixed(0);
    main.innerHTML = `
        <div class="review-container animate-in">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <button class="btn btn-secondary btn-sm" onclick="App.navigate('deck/${session.deckId}')">✕ End Session</button>
                <span style="font-size:0.85rem;color:var(--text-secondary)">${Components.esc(session.deckName)}</span>
            </div>
            <div class="review-progress">
                <div class="review-progress-bar"><div class="review-progress-fill" style="width:${progress}%"></div></div>
                <span class="review-progress-text">${session.current + 1} / ${session.cards.length}</span>
            </div>
            <div class="flashcard" id="flashcard" onclick="document.getElementById('flashcard').classList.toggle('flipped');document.getElementById('rating-area').style.display='flex'">
                <div class="flashcard-inner">
                    <div class="flashcard-front">
                        <span class="card-label">${(card.card_type||'concept').replace('_',' ')}</span>
                        <div class="card-content">${Components.esc(card.front)}</div>
                        <div class="flip-hint">Click or press Space to reveal answer</div>
                    </div>
                    <div class="flashcard-back">
                        <span class="card-label">Answer</span>
                        <div class="card-content">${Components.esc(card.back)}</div>
                    </div>
                </div>
            </div>
            <div class="rating-buttons" id="rating-area" style="display:none">
                <button class="rating-btn again" onclick="rateCard(1)"><span>Again</span><span class="rating-interval">&lt;1 min</span></button>
                <button class="rating-btn hard" onclick="rateCard(2)"><span>Hard</span><span class="rating-interval">1 day</span></button>
                <button class="rating-btn good" onclick="rateCard(4)"><span>Good</span><span class="rating-interval">~3 days</span></button>
                <button class="rating-btn easy" onclick="rateCard(5)"><span>Easy</span><span class="rating-interval">~7 days</span></button>
            </div>
        </div>`;

    // Keyboard shortcut
    document.onkeydown = (e) => {
        if (e.code === 'Space') { e.preventDefault(); document.getElementById('flashcard')?.classList.toggle('flipped'); const ra = document.getElementById('rating-area'); if(ra) ra.style.display = 'flex'; }
        if (e.key === '1') rateCard(1);
        if (e.key === '2') rateCard(2);
        if (e.key === '3') rateCard(4);
        if (e.key === '4') rateCard(5);
    };
}

async function rateCard(quality) {
    const session = window._reviewSession;
    if (!session) return;
    const card = session.cards[session.current];
    try {
        await API.reviewCard(card.id, quality);
        session.results.push({ cardId: card.id, quality });
        session.current++;
        if (session.current >= session.cards.length) {
            showSessionSummary(session);
        } else {
            renderReviewCard(session);
        }
    } catch (e) { Components.toast('Failed to save review', 'error'); }
}

function showSessionSummary(session) {
    document.onkeydown = null;
    const correct = session.results.filter(r => r.quality >= 3).length;
    const total = session.results.length;
    const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;
    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div class="session-summary animate-in">
            <h2>🎉 Session Complete!</h2>
            <p class="summary-subtitle">Great work! Here's how you did.</p>
            <div class="summary-stats">
                <div class="summary-stat"><div class="value">${total}</div><div class="label">Cards Reviewed</div></div>
                <div class="summary-stat"><div class="value" style="color:var(--green)">${correct}</div><div class="label">Correct</div></div>
                <div class="summary-stat"><div class="value" style="color:var(--accent)">${accuracy}%</div><div class="label">Accuracy</div></div>
            </div>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
                <button class="btn btn-primary" onclick="App.navigate('review/${session.deckId}')">Review Again</button>
                <button class="btn btn-secondary" onclick="App.navigate('deck/${session.deckId}')">Back to Deck</button>
                <button class="btn btn-secondary" onclick="App.navigate('dashboard')">Dashboard</button>
            </div>
        </div>`;
    if (accuracy >= 70) Components.confetti();
}
