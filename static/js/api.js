// ── Synapse API Client ──
const API = {
    async request(url, options = {}) {
        try {
            const res = await fetch(url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            return data;
        } catch (e) {
            console.error('API Error:', e);
            throw e;
        }
    },
    getDecks() { return this.request('/api/decks'); },
    getDeck(id) { return this.request(`/api/decks/${id}`); },
    updateDeck(id, data) { return this.request(`/api/decks/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteDeck(id) { return this.request(`/api/decks/${id}`, { method: 'DELETE' }); },
    getReviewCards(deckId, limit = 20) { return this.request(`/api/decks/${deckId}/review?limit=${limit}`); },
    reviewCard(cardId, quality) { return this.request(`/api/cards/${cardId}/review`, { method: 'POST', body: JSON.stringify({ quality }) }); },
    updateCard(id, data) { return this.request(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteCard(id) { return this.request(`/api/cards/${id}`, { method: 'DELETE' }); },
    addCard(deckId, front, back, type = 'concept') { return this.request(`/api/decks/${deckId}/cards`, { method: 'POST', body: JSON.stringify({ front, back, card_type: type }) }); },
    getStats() { return this.request('/api/stats'); },
    getHeatmap() { return this.request('/api/stats/heatmap'); },
    search(q) { return this.request(`/api/search?q=${encodeURIComponent(q)}`); },
    async uploadPDF(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');
            xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 60)); };
            xhr.onload = () => {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) resolve(data);
                    else reject(new Error(data.error || 'Upload failed'));
                } catch (e) { reject(new Error('Invalid response')); }
            };
            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    }
};
