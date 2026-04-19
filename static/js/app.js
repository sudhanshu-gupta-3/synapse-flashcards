// ── Synapse Main App ──
const App = {
    navigate(path) {
        window.location.hash = path;
    },

    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const [view, id] = hash.split('/');

        // Update active nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeNav = document.querySelector(`[data-view="${view}"]`);
        if (activeNav) activeNav.classList.add('active');

        switch (view) {
            case 'dashboard': await Views.dashboard(); break;
            case 'upload': Views.upload(); break;
            case 'deck': if (id) await Views.deckView(id); break;
            case 'review': if (id) await Views.review(id); break;
            case 'stats': await Views.stats(); break;
            default: await Views.dashboard();
        }
    },

    showAddCardModal(deckId) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <h3>Add New Card</h3>
                <div class="form-group"><label>Question (Front)</label><textarea id="modal-front" placeholder="Enter the question..."></textarea></div>
                <div class="form-group"><label>Answer (Back)</label><textarea id="modal-back" placeholder="Enter the answer..."></textarea></div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" id="modal-save">Add Card</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.getElementById('modal-save').onclick = async () => {
            const front = document.getElementById('modal-front').value.trim();
            const back = document.getElementById('modal-back').value.trim();
            if (!front || !back) { Components.toast('Both fields are required', 'error'); return; }
            try {
                await API.addCard(deckId, front, back);
                overlay.remove();
                Components.toast('Card added!', 'success');
                await Views.deckView(deckId);
            } catch (e) { Components.toast(e.message, 'error'); }
        };
    },

    async editCard(cardId) {
        // Fetch current card data from DOM
        const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
        if (!cardEl) return;
        const frontText = cardEl.querySelector('.card-front-text')?.textContent || '';
        const backText = cardEl.querySelector('.card-back-text')?.textContent || '';

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <h3>Edit Card</h3>
                <div class="form-group"><label>Question (Front)</label><textarea id="modal-front">${Components.esc(frontText)}</textarea></div>
                <div class="form-group"><label>Answer (Back)</label><textarea id="modal-back">${Components.esc(backText)}</textarea></div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button class="btn btn-primary" id="modal-save">Save</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.getElementById('modal-save').onclick = async () => {
            const front = document.getElementById('modal-front').value.trim();
            const back = document.getElementById('modal-back').value.trim();
            if (!front || !back) { Components.toast('Both fields are required', 'error'); return; }
            try {
                await API.updateCard(cardId, { front, back });
                overlay.remove();
                Components.toast('Card updated!', 'success');
                // Reload current deck view
                const hash = window.location.hash.slice(1);
                const deckId = hash.split('/')[1];
                if (deckId) await Views.deckView(deckId);
            } catch (e) { Components.toast(e.message, 'error'); }
        };
    },

    async deleteCard(cardId, deckId) {
        if (!confirm('Delete this card?')) return;
        try {
            await API.deleteCard(cardId);
            Components.toast('Card deleted', 'info');
            await Views.deckView(deckId);
        } catch (e) { Components.toast(e.message, 'error'); }
    },

    async confirmDeleteDeck(deckId) {
        if (!confirm('Delete this entire deck and all its cards? This cannot be undone.')) return;
        try {
            await API.deleteDeck(deckId);
            Components.toast('Deck deleted', 'info');
            App.navigate('dashboard');
        } catch (e) { Components.toast(e.message, 'error'); }
    },

    initSearch() {
        let timeout;
        const input = document.getElementById('search-input');
        if (!input) return;
        input.addEventListener('input', () => {
            clearTimeout(timeout);
            const q = input.value.trim();
            if (q.length < 2) return;
            timeout = setTimeout(async () => {
                try {
                    const results = await API.search(q);
                    Views.searchResults(results);
                } catch (e) { console.error(e); }
            }, 400);
        });
    }
};

// ── Initialize ──
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('hashchange', () => App.handleRoute());
    App.handleRoute();
    App.initSearch();
});
