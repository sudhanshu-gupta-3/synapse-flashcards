// ── Synapse UI Components ──
const Components = {
    masteryRing(mastered, learning, total, size = 80) {
        if (total === 0) total = 1;
        const pct = Math.round(mastered / total * 100);
        const r = (size - 8) / 2, c = Math.PI * 2 * r;
        const offset = c - (c * pct / 100);
        return `<div class="mastery-ring" style="width:${size}px;height:${size}px">
            <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="6"/>
                <circle class="ring-fill" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="6"
                    stroke="url(#rg)" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
                    style="--ring-circumference:${c};--ring-offset:${offset};animation:ringFill 1s ease forwards"/>
                <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--teal)"/></linearGradient></defs>
            </svg>
            <span class="ring-label">${pct}%</span>
        </div>`;
    },
    masteryBar(mastered, learning, newCount, total) {
        if (total === 0) return '<div class="mastery-bar"></div>';
        const mp = mastered/total*100, lp = learning/total*100, np = newCount/total*100;
        return `<div class="mastery-bar">
            <div class="bar-segment bar-mastered" style="width:${mp}%"></div>
            <div class="bar-segment bar-learning" style="width:${lp}%"></div>
            <div class="bar-segment bar-new" style="width:${np}%"></div>
        </div>`;
    },
    statCard(value, label, iconClass, icon) {
        return `<div class="stat-card animate-in">
            <div class="stat-icon ${iconClass}">${icon}</div>
            <div class="stat-value">${value}</div>
            <div class="stat-label">${label}</div>
        </div>`;
    },
    deckCard(deck) {
        const tags = (deck.tags || []).slice(0, 3).map(t => `<span class="deck-tag">${t}</span>`).join('');
        return `<div class="deck-card animate-in" data-deck-id="${deck.id}" onclick="App.navigate('deck/${deck.id}')">
            ${tags ? `<div class="deck-tags">${tags}</div>` : ''}
            <div class="deck-name">${this.esc(deck.name)}</div>
            <div class="deck-desc">${this.esc(deck.description || '')}</div>
            <div class="deck-meta">
                <span>📇 ${deck.card_count} cards</span>
                <span>📅 ${this.timeAgo(deck.created_at)}</span>
                ${deck.due > 0 ? `<span style="color:var(--yellow)">⏰ ${deck.due} due</span>` : ''}
            </div>
            ${Components.masteryBar(deck.mastered, deck.learning, deck.new, deck.card_count)}
        </div>`;
    },
    cardItem(card) {
        const badgeClass = `badge-${card.card_type || 'concept'}`;
        const statusClass = `status-${card.status || 'new'}`;
        return `<div class="card-item animate-in" data-card-id="${card.id}">
            <span class="card-type-badge ${badgeClass}">${(card.card_type||'concept').replace('_',' ')}</span>
            <div class="card-text">
                <div class="card-front-text">${this.esc(card.front)}</div>
                <div class="card-back-text">${this.esc(card.back)}</div>
            </div>
            <span class="card-status ${statusClass}">${card.status||'new'}</span>
            <div class="card-actions">
                <button onclick="event.stopPropagation();App.editCard(${card.id})" title="Edit">✏️</button>
                <button class="delete-btn" onclick="event.stopPropagation();App.deleteCard(${card.id},${card.deck_id})" title="Delete">🗑️</button>
            </div>
        </div>`;
    },
    heatmap(data) {
        const cells = [];
        const today = new Date();
        for (let i = 90; i >= 0; i--) {
            const d = new Date(today); d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = data[key] || 0;
            const level = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
            cells.push(`<div class="heatmap-cell" data-level="${level}" title="${key}: ${count} cards"></div>`);
        }
        return `<div class="heatmap-container"><h3>📅 Study Activity</h3><div class="heatmap">${cells.join('')}</div></div>`;
    },
    toast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = msg;
        container.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
    },
    confetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        const pieces = Array.from({ length: 100 }, () => ({
            x: Math.random() * canvas.width, y: -20 - Math.random() * 200,
            w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
            color: ['#a78bfa','#06b6d4','#34d399','#fbbf24','#f87171','#ec4899'][Math.floor(Math.random()*6)],
            vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4,
            rot: Math.random() * 360, vr: (Math.random() - 0.5) * 10,
        }));
        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.05;
                ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - frame / 120);
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h); ctx.restore();
            });
            frame++;
            if (frame < 120) requestAnimationFrame(draw);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        draw();
    },
    esc(str) { const d = document.createElement('div'); d.textContent = str || ''; return d.innerHTML; },
    timeAgo(iso) {
        if (!iso) return '';
        const s = Math.floor((Date.now() - new Date(iso)) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s/60)}m ago`;
        if (s < 86400) return `${Math.floor(s/3600)}h ago`;
        return `${Math.floor(s/86400)}d ago`;
    }
};
