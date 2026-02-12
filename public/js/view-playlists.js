// ========================================
// VUE : LISTE DES PLAYLISTS
// ========================================

function showAllPlaylists() {
    updateNav([{name: 'Playlists', cmd: 'showAllPlaylists()'}]);
    
    let html = `
        <div class="section-header">
            <h2 class="section-title">Mes Playlists</h2>
            <button class="btn-primary" onclick="createPL()">+ Créer</button>
        </div>
        <div class="grid">`;

    if (!playlists || playlists.length === 0) {
        html += `<div class="empty-state"><p>Aucune playlist créée 🙈</p></div>`;
    } else {
        html += playlists.map((pl, i) => {
            let imgUrl = 'https://img.icons8.com/?size=200&id=20909&format=png&color=333333';
            let hasCover = pl.tracks.length > 0;
            if (hasCover) imgUrl = getCover(pl.tracks[0]);

            return `
                <div class="card pl-card" onclick="showPL(${i})">
                    <div class="pl-card-img-wrap">
                        <img src="${imgUrl}" class="pl-card-img ${hasCover ? '' : 'default-icon'}" loading="lazy">
                        <div class="pl-card-overlay">▶</div>
                    </div>
                    <div class="card-title" style="margin-top:10px;">${escapeHtml(pl.name)}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">
                        ${pl.tracks.length} titres
                    </div>
                </div>`;
        }).join('');
    }
    
    html += `</div>`;
    document.getElementById('content-area').innerHTML = html;
}