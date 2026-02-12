// ========================================
// VUE : DASHBOARD (CORRIGÉ & COMPLET)
// ========================================
// ========================================
// VUE : DASHBOARD (CORRIGÉ - ID BOUTON EQ)
// ========================================

function showDashboard() {
    updateNav([]); 
    const container = document.getElementById('content-area');
    if (!container) return;

    if (allMusic.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Chargement...</p></div>';
        return;
    }

    // --- CALCULS STATS ---
    const artistMap = {};
    allMusic.forEach(t => { artistMap[t.artist] = (artistMap[t.artist] || 0) + 1; });
    const topArtistsList = Object.entries(artistMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxArtistCount = topArtistsList[0] ? topArtistsList[0][1] : 1;
    const highQualityCount = allMusic.filter(t => t.url.endsWith('.flac') || t.url.endsWith('.wav')).length;
    const mp3Pct = Math.round(((allMusic.length - highQualityCount) / allMusic.length) * 100);

    // --- BANDEAU ---
    const now = new Date();
    const hours = now.getHours();
    let greeting = hours >= 18 ? 'Bonsoir' : (hours < 5 ? 'Bonne nuit' : 'Bonjour');
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = now.toLocaleDateString('fr-FR', options).toUpperCase();
    const artistsCount = new Set(allMusic.map(t => t.artist)).size;
    
    let bannerTrack = history.length > 0 ? history[0] : allMusic[Math.floor(Math.random() * allMusic.length)];
    let bannerImg = getCover(bannerTrack);

    // Widget Dernière écoute
    let lastPlayedHTML = '';
    if (history.length > 0) {
        lastPlayedHTML = `
        <div class="last-played-card" onclick="playRecentTrack(0)">
            <img src="${getCover(history[0])}" class="lp-thumb">
            <div style="flex:1; overflow:hidden;">
                <div style="font-size:10px; color:#aaa; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">Dernière écoute</div>
                <div style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(history[0].name)}</div>
                <div style="font-size:12px; color:#888;">${escapeHtml(history[0].artist)}</div>
            </div>
            <div style="background:var(--accent); width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center;">▶</div>
        </div>`;
    }

    let html = `
    <div>
        <div class="welcome-banner" style="background-image: linear-gradient(135deg, rgba(20,20,20,0.7), rgba(0,0,0,0.9)), url('${bannerImg}');">
            <div style="width:100%; display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                    <div class="date-badge">${dateStr}</div>
                    <h1 class="banner-title">${greeting},<br>Bienvenue sur Localify.</h1>
                </div>
                ${lastPlayedHTML}
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box sb-purple"><h3>${allMusic.length}</h3><p>Titres</p></div>
            <div class="stat-box sb-blue"><h3>${artistsCount}</h3><p>Artistes</p></div>
            <div class="stat-box sb-green"><h3>${favs.length}</h3><p>Favoris</p></div>
            <div class="stat-box sb-orange" onclick="showAllPlaylists()" style="cursor:pointer;"><h3>${playlists.length}</h3><p>Playlists</p></div>
        </div>

        <div class="actions-bar">
            <button class="action-chip ac-primary" onclick="startSmartFlow()">⚡ Lancer le Flow</button>
            <button class="action-chip" onclick="playRandomMix()">🎲 Aléatoire</button>
            <button class="action-chip" onclick="openEQModal()">🎚️ Égaliseur</button>
            <button class="action-chip" onclick="toggleFocusMode()">🌌 Mode Focus</button>
        </div>

        <div class="advanced-stats">
            <div class="stats-panel">
                <h3>Top Artistes</h3>
                ${topArtistsList.map(item => {
                    const width = (item[1] / maxArtistCount) * 100;
                    return `<div class="stat-row"><div class="stat-label">${escapeHtml(item[0])}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${width}%; background:#e67e22;"></div></div><div class="stat-val">${item[1]}</div></div>`;
                }).join('')}
            </div>
            <div class="stats-panel">
                <h3>Qualité Audio</h3>
                <div class="stat-row" style="margin-top:20px;">
                    <div class="stat-label">MP3 / AAC</div>
                    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${mp3Pct}%; background:#3498db;"></div></div>
                    <div class="stat-val">${mp3Pct}%</div>
                </div>
            </div>
        </div>

        <div class="grid">
            ${allMusic.slice(-4).reverse().map((track, i) => `
                <div class="card" onclick="play(${allMusic.length - 1 - i})">
                     <img src="${getCover(track)}" class="card-img" loading="lazy" style="aspect-ratio:1; object-fit:cover; width:100%; border-radius:8px; margin-bottom:8px;">
                     <div class="card-title">${escapeHtml(track.name)}</div>
                     <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(track.artist)}</div>
                </div>
            `).join('')}
        </div>
        <div style="height: 100px;"></div>
    </div>
    
    <div id="eq-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(5px); z-index:9000; align-items:center; justify-content:center;">
        <div style="background:var(--card); padding:20px; border-radius:20px; width:90%; max-width:600px; border:1px solid var(--border); max-height:85vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="margin:0; font-size:20px;">🎚️ Égaliseur</h2>
                <div style="display:flex; gap:10px;">
                    <button id="eq-mode-btn" onclick="switchEQType()" class="btn-secondary" style="font-size:12px;">Mode ${personalization.eqMode} Bandes</button>
                    <button onclick="closeEQModal()" style="background:rgba(255,255,255,0.1); border:none; color:white; width:30px; height:30px; border-radius:50%; cursor:pointer;">&times;</button>
                </div>
            </div>
            
            <div class="actions-bar" style="padding:0; margin-bottom:20px; justify-content: center;">
                <button class="action-chip" onclick="applyPreset('flat')">Plat</button>
                <button class="action-chip" onclick="applyPreset('bass')">Bass</button>
                <button class="action-chip" onclick="applyPreset('rock')">Rock</button>
                <button class="action-chip" onclick="applyPreset('pop')">Pop</button>
                <button class="action-chip" onclick="applyPreset('voice')">Voix</button>
            </div>

            <div class="eq-container" id="eq-sliders-container"></div>
            <div style="text-align:center; margin-top:20px; color:var(--text-muted); font-size:12px;">Graves ⟵ ⟶ Aigus</div>
        </div>
    </div>`;

    container.innerHTML = html;
}

// ==========================================
// FONCTIONS MANQUANTES AJOUTÉES ICI
// ==========================================

function startSmartFlow() {
    // Mélange intelligent : Favoris + Aléatoire
    let flow = allMusic.filter(t => favs.includes(t.path));
    // Si pas assez de favoris, on prend tout
    if (flow.length < 10) flow = [...allMusic];
    
    // Mélange
    flow.sort(() => Math.random() - 0.5);
    
    queue = flow;
    play(0);
    showNotification("⚡ Flow Lancé !");
}

function playRandomMix() {
    queue = [...allMusic].sort(() => Math.random() - 0.5);
    play(0);
    showNotification("🎲 Mix Aléatoire lancé");
}

function openEQModal() {
    const modal = document.getElementById('eq-modal');
    if (modal) {
        modal.style.display = 'flex';
        renderEQContent(); // Génère les sliders
    }
}

function closeEQModal() {
    const modal = document.getElementById('eq-modal');
    if (modal) modal.style.display = 'none';
}

function renderEQContent() {
    const container = document.getElementById('eq-sliders-container');
    if (!container) return;

    if (personalization.eqMode === '3') {
        // --- MODE 3 BANDES ---
        container.innerHTML = `
            <div class="eq-band">
                <input type="range" orient="vertical" id="eq-3-bass" min="-10" max="10" step="1" value="${eqSettings3.bass || 0}" oninput="setEQ3('bass', this.value)">
                <label>Basse</label>
            </div>
            <div class="eq-band">
                <input type="range" orient="vertical" id="eq-3-mid" min="-10" max="10" step="1" value="${eqSettings3.mid || 0}" oninput="setEQ3('mid', this.value)">
                <label>Mids</label>
            </div>
            <div class="eq-band">
                <input type="range" orient="vertical" id="eq-3-treble" min="-10" max="10" step="1" value="${eqSettings3.treble || 0}" oninput="setEQ3('treble', this.value)">
                <label>Aigus</label>
            </div>
        `;
    } else {
        // --- MODE 10 BANDES ---
        const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const labels = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
        
        let html = '';
        frequencies.forEach((freq, i) => {
            const val = (eqSettings10 && eqSettings10[i]) ? eqSettings10[i] : 0;
            html += `
            <div class="eq-band">
                <input type="range" orient="vertical" min="-12" max="12" step="1" value="${val}" oninput="setEQ10(${i}, this.value)">
                <label>${labels[i]}</label>
            </div>`;
        });
        container.innerHTML = html;
    }
}