// ========================================
// VUE : BIBLIOTHÈQUE (FIX FLAC & DOSSIERS)
// ========================================

// --- FONCTION INTELLIGENTE : RÉCUPÉRER LE NOM DE L'ALBUM ---
function getSmartAlbumName(track) {
    // 1. Si c'est un fichier FLAC, on privilégie TOUJOURS le dossier parent.
    // Les tags FLAC sont souvent mal lus par les navigateurs/serveurs basiques.
    const isFlac = track.path.toLowerCase().endsWith('.flac');
    
    // 2. Si l'album est vide, inconnu, ou si c'est du FLAC
    if (isFlac || !track.album || track.album === '' || track.album === 'Unknown Album' || track.album === track.artist) {
        try {
            // On nettoie le chemin (remplace les anti-slashs Windows par des slashs)
            const p = track.path.replace(/\\/g, '/');
            const parts = p.split('/');
            
            // Structure attendue : ... / Artiste / NOM_ALBUM / Titre.flac
            // Donc l'album est l'avant-dernier élément (parts.length - 2)
            if (parts.length >= 2) {
                const folderName = parts[parts.length - 2];
                // Sécurité : si le dossier parent est le dossier "music" ou "genre", on garde "Singles"
                if (folderName.toLowerCase() === 'music' || folderName.length < 2) return "Singles";
                return folderName;
            }
        } catch (e) { console.error(e); }
    }
    
    // Sinon on garde le tag existant, ou "Singles" par défaut
    return track.album || "Singles";
}

function showLib() {
    updateNav([{name: 'Bibliothèque', cmd: 'showLib()'}]);
    const container = document.getElementById('content-area');
    if (!container) return;

    // --- 1. LOGIQUE PLAYLISTS ---
    let playlistsHtml = '';
    if (personalization.showPlaylistsOnHome) {
        playlistsHtml = `<section class="recent-section">
            <h2 class="section-title">📂 Mes Playlists</h2>
            <div class="recent-grid">`;
        
        if (playlists.length > 0) {
            playlistsHtml += playlists.map((pl, i) => `
                <div class="recent-card" onclick="showPL(${i})">
                    <img src="${pl.tracks.length > 0 ? getCover(pl.tracks[0]) : 'https://img.icons8.com/?size=200&id=20909&format=png&color=333333'}" class="recent-cover">
                    <div class="recent-name">${escapeHtml(pl.name)}</div>
                </div>`).join('');
        } else {
            playlistsHtml += `<p style="padding:0 20px; color:var(--text-muted); font-size:12px;">Aucune playlist créée 🙈</p>`;
        }
        playlistsHtml += `</div></section>`;
    }

    // --- 2. LOGIQUE NAVIGATION (TON SCREENSHOT) ---
    const stylesMap = {};
    allMusic.forEach(track => {
        const p = track.path.replace(/\\/g, '/');
        const parts = p.split('/');
        if (parts.length > 1) {
            let styleName = parts[0]; 
            if (!stylesMap[styleName]) stylesMap[styleName] = new Set();
            stylesMap[styleName].add(track.artist);
        }
    });

    let stylesHtml = `<section><h2 class="section-title">🎹 Parcourir par Dossier</h2><div class="grid">`;
    Object.keys(stylesMap).sort().forEach(style => {
        stylesHtml += `
            <div class="card" onclick="showArtistsByStyle('${style.replace(/'/g, "\\'")}')">
                <div class="card-icon" style="color:var(--accent)">🎵</div>
                <div class="card-title">${escapeHtml(style)}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${stylesMap[style].size} Artistes</div>
            </div>`;
    });
    stylesHtml += `</div></section>`;

    // --- 3. LOGIQUE RÉCENTS ---
    let recentHtml = '';
    if (history.length > 0) {
        recentHtml = `<section class="recent-section"><h2 class="section-title">🕒 Récemment écoutés</h2><div class="recent-grid">`;
        recentHtml += history.slice(0, 10).map((t, idx) => `
            <div class="recent-card" onclick="playRecentTrack(${idx})">
                <img src="${getCover(t)}" class="recent-cover">
                <div class="recent-name">${escapeHtml(t.name)}</div>
            </div>`).join('');
        recentHtml += `</div></section>`;
    } else if (personalization.recentPosition) {
        // Optionnel : on peut afficher un message si activé mais vide
    }

    // --- ASSEMBLAGE FINAL ---
    const pos = personalization.recentPosition || 'bottom'; 
    if (pos === 'top') container.innerHTML = playlistsHtml + recentHtml + stylesHtml; 
    else container.innerHTML = playlistsHtml + stylesHtml + recentHtml;
}

function showAllArtists() {
    updateNav([{name: 'Tous les Artistes', cmd: 'showAllArtists()'}]);
    const artistsSet = new Set();
    allMusic.forEach(track => { if (track.artist) artistsSet.add(track.artist); });
    const sortedArtists = [...artistsSet].sort((a, b) => a.localeCompare(b));
    
    let html = `<div class="section-header"><h2 class="section-title">🎤 Tous les Artistes</h2><span style="font-size: 12px; color: var(--text-dim);">Total : ${sortedArtists.length}</span></div><div class="grid">`;
    
    if (sortedArtists.length === 0) html += `<div class="empty-state"><p>Aucun artiste trouvé 🙈</p></div>`;
    else html += sortedArtists.map(artist => {
        const color = stringToColor(artist);
        return `<div class="card" onclick="showAlbums('${artist.replace(/'/g, "\\'")}')"><div class="card-icon" style="color:${color}">👤</div><div class="card-title">${escapeHtml(artist)}</div><div style="font-size: 12px; color: var(--text-muted); margin-top:5px;">Voir les albums</div></div>`;
    }).join('');
    html += `</div>`;
    document.getElementById('content-area').innerHTML = html;
}

function showArtistsByStyle(style) {
    updateNav([{name: style, cmd: `showArtistsByStyle('${style.replace(/'/g, "\\'")}')`}]);
    const artistsInStyle = new Set();
    
    // Correction : Meilleure détection du dossier
    allMusic.forEach(track => { 
        const p = track.path.replace(/\\/g, '/');
        if (p.startsWith(style + '/')) {
            artistsInStyle.add(track.artist); 
        }
    });
    
    const sortedArtists = [...artistsInStyle].sort();
    document.getElementById('content-area').innerHTML = `<h2 class="section-title">Style : ${escapeHtml(style)}</h2><div class="grid">${sortedArtists.map(artist => `<div class="card" onclick="showAlbums('${artist.replace(/'/g, "\\'")}')"><div class="card-icon">👤</div><div class="card-title">${escapeHtml(artist)}</div></div>`).join('')}</div>`;
}

function showAlbums(artist) {
    updateNav([{name: artist, cmd: `showAlbums('${artist.replace(/'/g, "\\'")}')`}]);
    
    // --- ICI EST LA CORRECTION MAJEURE ---
    // On groupe par le "Smart Name" (Nom du dossier) au lieu du tag Album
    const albumsSet = new Set();
    allMusic.filter(m => m.artist === artist).forEach(m => {
        albumsSet.add(getSmartAlbumName(m));
    });

    const albums = [...albumsSet].sort();
    
    document.getElementById('content-area').innerHTML = `<h2 class="section-title">Albums de ${escapeHtml(artist)}</h2><div class="grid">${albums.map(al => `<div class="card" onclick="showTracks('${artist.replace(/'/g, "\\'")}', '${al.replace(/'/g, "\\'")}')"><div class="card-icon">💿</div><div class="card-title">${escapeHtml(al)}</div></div>`).join('')}</div>`;
}

function showTracks(artist, album) {
    updateNav([{name: artist, cmd: `showAlbums('${artist.replace(/'/g, "\\'")}')`}, {name: album, cmd: ''}]);
    
    // --- FILTRAGE INTELLIGENT ---
    // On ne garde que les pistes dont le "Smart Album" correspond
    currentViewTracks = allMusic.filter(m => {
        return m.artist === artist && getSmartAlbumName(m) === album;
    });

    // Tri alphabétique des pistes (car les numéros de piste FLAC manquent souvent)
    currentViewTracks.sort((a, b) => a.name.localeCompare(b.name));

    document.getElementById('content-area').innerHTML = `<h2 class="section-title">💿 ${escapeHtml(album)}</h2><button class="btn-primary" onclick="playAll()">▶ Tout lire</button>`;
    renderList(currentViewTracks);
}