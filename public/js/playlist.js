// ========================================
// PLAYLISTS & FAVORIS & DRAG DROP
// ========================================

// Variable globale pour stocker l'index de la playlist à supprimer
let playlistToDeleteIndex = null;

function renderPLs() {
    generateSmartPlaylists();
}

function generateSmartPlaylists() {
    const plList = document.getElementById('pl-list');
    if (!plList) return;

    const smartHtml = `
        <div class="sidebar-pl-row" onclick="showSmartPL('recent')">
            <div class="sidebar-pl-thumb" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);">📅</div>
            <span class="sidebar-pl-name" style="color:var(--accent);">Récemment Ajoutés</span>
        </div>
        <div class="sidebar-pl-row" onclick="showSmartPL('top')">
            <div class="sidebar-pl-thumb" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);">🔥</div>
            <span class="sidebar-pl-name" style="color:var(--accent);">Top 50</span>
        </div>
        <div style="height:1px; background:var(--border); margin:10px 15px; opacity:0.5;"></div>`;

    const userPlaylistsHtml = playlists.map((pl, i) => {
        let imgUrl = 'https://img.icons8.com/?size=100&id=20909&format=png&color=FFFFFF';
        if (pl.tracks.length > 0) imgUrl = getCover(pl.tracks[0]);
        return `<div class="sidebar-pl-row" onclick="showPL(${i})">
            <img src="${imgUrl}" class="sidebar-pl-thumb" loading="lazy">
            <span class="sidebar-pl-name">${escapeHtml(pl.name)}</span>
        </div>`;
    }).join('');

    plList.innerHTML = smartHtml + userPlaylistsHtml;
}

function showSmartPL(type) {
    let tracks = [];
    let title = "";
    
    if (type === 'recent') {
        title = "📅 Récemment Ajoutés";
        tracks = allMusic.slice(-50).reverse();
    } else if (type === 'top') {
        title = "🔥 Top 50 (Historique)";
        tracks = history.slice(0, 50);
    }

    if (tracks.length === 0) {
        showNotification("Playlist vide pour le moment", "info");
        return;
    }

    updateNav([{name: 'Playlists', cmd: 'showAllPlaylists()'}, {name: title, cmd: ''}]);
    currentViewTracks = tracks;
    
    let html = `
        <div class="playlist-header-banner">
            <div class="pl-info">
                <div class="pl-type">PLAYLIST INTELLIGENTE</div>
                <h1 class="pl-title">${title}</h1>
                <div class="pl-meta">${tracks.length} titres</div>
                <div class="pl-actions-bar">
                    <button class="btn-primary" onclick="playAll()">▶ Lecture</button>
                </div>
            </div>
        </div>
        <div class="playlist-tracks">`;

    html += tracks.map((track, i) => {
        const isPlaying = (queue[qIdx]?.path === track.path);
        return `
        <div class="row ${isPlaying ? 'active-track' : ''}" 
             onclick="playFromList(${i})" 
             oncontextmenu="openContextMenu(event, ${i})">
            <img src="${getCover(track)}" class="track-thumbnail" loading="lazy">
            <div class="track-info">
                <div class="track-name">${escapeHtml(track.name)}</div>
                <div class="track-artist">${escapeHtml(track.artist)}</div>
            </div>
            
            <div class="row-actions">
                <button class="action-btn desktop-only" onclick="event.stopPropagation(); addToQueue(${i})" title="Queue">⏳</button>
                <button class="action-btn" onclick="event.stopPropagation(); toggleFav(${i})" title="Favoris">❤️</button>
                <button class="action-btn mobile-only" onclick="event.stopPropagation(); openContextMenu(event, ${i})">⋮</button>
            </div>
        </div>`;
    }).join('');

    html += `</div>`;
    document.getElementById('content-area').innerHTML = html;
}

// --- CRÉATION DE PLAYLIST ---

function createPL() { 
    const modal = document.getElementById('create-pl-modal');
    const input = document.getElementById('new-pl-name');
    if (modal && input) {
        modal.style.display = 'flex';
        input.value = '';
        setTimeout(() => input.focus(), 50);
        input.onkeydown = (e) => {
            if (e.key === 'Enter') confirmCreatePL();
            if (e.key === 'Escape') closeCreatePL();
        };
    }
}

function closeCreatePL() {
    const modal = document.getElementById('create-pl-modal');
    if (modal) modal.style.display = 'none';
}

async function confirmCreatePL() {
    const input = document.getElementById('new-pl-name');
    const name = input.value.trim();
    if (name) { 
        playlists.push({ name, tracks: [] }); 
        await saveData('pl', playlists); 
        renderPLs(); 
        if(typeof showAllPlaylists === 'function') showAllPlaylists(); 
        closeCreatePL();
        showNotification(`Playlist "${name}" créée !`); 
    } else {
        showNotification("Veuillez entrer un nom", "error");
    }
}

// --- SUPPRESSION DE PLAYLIST (NOUVEAU SYSTÈME MODALE) ---

function deletePL(idx) {
    playlistToDeleteIndex = idx;
    const plName = playlists[idx].name;
    const msgElement = document.getElementById('delete-pl-msg');
    if (msgElement) {
        msgElement.innerText = `Voulez-vous vraiment supprimer la playlist "${plName}" ?`;
    }
    const modal = document.getElementById('delete-pl-modal');
    if (modal) modal.style.display = 'flex';
}

async function performDeletePL() {
    if (playlistToDeleteIndex !== null) {
        playlists.splice(playlistToDeleteIndex, 1);
        await saveData('pl', playlists);
        renderPLs();
        if(typeof showAllPlaylists === 'function') showAllPlaylists();
        showNotification(`Playlist supprimée 🗑️`);
    }
    closeDeleteModal();
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-pl-modal');
    if (modal) modal.style.display = 'none';
    playlistToDeleteIndex = null;
}

// --- ÉDITION DE PLAYLIST ---

async function editPLName(idx) {
    const oldName = playlists[idx].name;
    const newName = prompt("Nouveau nom :", oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        playlists[idx].name = newName.trim();
        await saveData('pl', playlists);
        renderPLs();
        showPL(idx);
        showNotification("Playlist renommée !");
    }
}

function showPL(idx) {
    const pl = playlists[idx]; 
    if(!pl) return;
    updateNav([{name: 'Playlists', cmd: 'showAllPlaylists()'}, {name: pl.name, cmd: ''}]);
    currentViewTracks = pl.tracks;
    
    let html = `
        <div class="playlist-header-banner">
            <div class="pl-info">
                <div class="pl-type">PLAYLIST</div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <h1 class="pl-title">${escapeHtml(pl.name)}</h1>
                    <button class="btn-icon-edit" onclick="editPLName(${idx})" title="Renommer">✏️</button>
                </div>
                <div class="pl-meta">${pl.tracks.length} titres</div>
                <div class="pl-actions-bar">
                    <button class="btn-primary" onclick="playAll()">▶ Lecture</button>
                    <button class="btn-danger" onclick="deletePL(${idx})">🗑️ Supprimer</button>
                </div>
            </div>
        </div>
        <div style="padding: 0 20px; color: var(--text-muted); margin-bottom: 10px;">
            <small>💡 Glissez les titres pour changer l'ordre</small>
        </div>
        <div class="playlist-tracks" id="pl-tracks-container">`;

    if (pl.tracks.length === 0) {
        html += `<div class="empty-state"><p>Playlist vide 🙈</p></div>`;
    } else {
        html += pl.tracks.map((track, i) => {
            const isPlaying = (queue[qIdx]?.path === track.path);
            return `
            <div class="row ${isPlaying ? 'active-track' : ''} draggable-pl" 
                 draggable="true" 
                 data-index="${i}"
                 onclick="playFromList(${i})" 
                 oncontextmenu="openContextMenu(event, ${i})">
                <div style="color:var(--text-dim); margin-right:10px; cursor:grab;">☰</div>
                <img src="${getCover(track)}" class="track-thumbnail" loading="lazy">
                <div class="track-info">
                    <div class="track-name">${escapeHtml(track.name)}</div>
                    <div class="track-artist">${escapeHtml(track.artist)}</div>
                </div>
                
                <div class="row-actions">
                    <button class="action-btn btn-remove-track desktop-only" 
                            onclick="event.stopPropagation(); removeTrackFromPL(${idx}, ${i}); return false;" 
                            title="Retirer">❌</button>
                    <button class="action-btn mobile-only" onclick="event.stopPropagation(); openContextMenu(event, ${i})">⋮</button>
                </div>
            </div>`;
        }).join('');
    }
    html += `</div>`;
    document.getElementById('content-area').innerHTML = html;
    setupPlaylistDragAndDrop(idx);
}

async function removeTrackFromPL(plIdx, trackIdx) {
    playlists[plIdx].tracks.splice(trackIdx, 1);
    await saveData('pl', playlists);
    showPL(plIdx);
    showNotification("Titre retiré");
}

// --- AJOUT À UNE PLAYLIST (POPUP) ---

function openPLModal(idx) {
    // Si idx est undefined, c'est que l'appel vient du lecteur (titre en cours)
    if (idx !== undefined) {
        trackToEnqueue = currentViewTracks[idx];
    } else {
        trackToEnqueue = queue[qIdx];
    }
    
    if (trackToEnqueue) {
        const modal = document.getElementById('pl-modal');
        const listContainer = document.getElementById('modal-pl-list');
        if (modal && listContainer) {
            listContainer.innerHTML = playlists.map((pl, i) => `
                <div class="modal-pl-item" onclick="addTrackToPL(${i})">
                    <span>${escapeHtml(pl.name)}</span>
                </div>
            `).join('');
            modal.style.display = 'flex'; 
        }
    }
}

function closePLModal() {
    const modal = document.getElementById('pl-modal');
    if (modal) modal.style.display = 'none';
    trackToEnqueue = null;
}

async function addTrackToPL(plIdx) {
    if (trackToEnqueue && playlists[plIdx]) {
        // Vérifie si le titre existe déjà
        const exists = playlists[plIdx].tracks.some(t => t.path === trackToEnqueue.path);
        
        if (!exists) {
            playlists[plIdx].tracks.push(trackToEnqueue);
            await saveData('pl', playlists);
            showNotification(`Ajouté à ${playlists[plIdx].name}`);
            
            // --- LE CORRECTIF EST ICI ---
            // Si le titre qu'on vient d'ajouter est celui en cours de lecture,
            // on force la mise à jour de l'interface du lecteur immédiatement.
            if (queue[qIdx] && queue[qIdx].path === trackToEnqueue.path) {
                if (typeof updatePlayerUI === 'function') {
                    updatePlayerUI(queue[qIdx]);
                }
            }
        } else {
            showNotification(`Déjà dans la playlist`, 'info');
        }
        
        closePLModal();
    }
}

// --- FAVORIS ---

async function toggleFav(idx) {
    const track = currentViewTracks[idx];
    if (favs.includes(track.path)) { 
        favs = favs.filter(p => p !== track.path); 
        showNotification("Retiré des favoris", "info");
    } else { 
        favs.push(track.path); 
        showNotification("Ajouté aux favoris ❤️");
    }
    await saveData('fav', favs); 
    renderList(currentViewTracks);
    if (queue[qIdx]?.path === track.path) {
        if(typeof updatePlayerUI === 'function') updatePlayerUI(track);
        if(typeof applyPersonalization === 'function') applyPersonalization(); 
    }
}

async function toggleCurrentFav() {
    const track = queue[qIdx];
    if (!track) return;
    
    if (favs.includes(track.path)) {
        favs = favs.filter(p => p !== track.path);
        showNotification("Retiré des favoris", "info");
    } else {
        favs.push(track.path);
        showNotification("Ajouté aux favoris ❤️");
    }
    
    await saveData('fav', favs);
    
    if(typeof updatePlayerUI === 'function') updatePlayerUI(track); 
    if(typeof applyPersonalization === 'function') applyPersonalization(); 
}

function showFavs() {
    updateNav([{name: 'Favoris', cmd: 'showFavs()'}]);
    currentViewTracks = allMusic.filter(m => favs.includes(m.path));
    document.getElementById('content-area').innerHTML = `<h2 class="section-title">❤️ Favoris</h2>`;
    renderList(currentViewTracks);
}

// --- FILE D'ATTENTE (QUEUE) ---

function showQueue() {
    updateNav([{name: "File d'attente", cmd: 'showQueue()'}]);
    currentViewTracks = queue;

    let html = `
        <div class="section-header">
            <h2 class="section-title">⏳ File d'attente</h2>
            <button class="btn-secondary" onclick="clearQueue()">🗑️ Vider</button>
        </div>
        <div style="padding: 0 20px; color: var(--text-muted); margin-bottom: 20px;">
            <small>💡 Astuce : Glissez-déposez les titres pour changer l'ordre.</small>
        </div>
        <div id="queue-list">`;

    if (queue.length === 0) {
        html += '<div class="empty-state"><p>La file d\'attente est vide.</p></div></div>';
        document.getElementById('content-area').innerHTML = html;
        return;
    }

    html += queue.map((track, i) => `
        <div class="row ${i === qIdx ? 'active-track' : ''} draggable" 
             draggable="true" 
             data-index="${i}" 
             onclick="play(${i})"
             oncontextmenu="openContextMenu(event, ${i})">
            <span style="color:var(--text-dim); margin-right:10px; cursor:grab;">☰</span>
            <img src="${getCover(track)}" class="track-thumbnail" loading="lazy">
            <div class="track-info">
                <div class="track-name">${escapeHtml(track.name)}</div>
                <div class="track-artist">${escapeHtml(track.artist)}</div>
            </div>
            
            <div class="row-actions">
                <button class="action-btn desktop-only" onclick="event.stopPropagation(); removeFromQueue(${i})">❌</button>
                <button class="action-btn mobile-only" onclick="event.stopPropagation(); openContextMenu(event, ${i})">⋮</button>
            </div>
        </div>`).join('');

    html += '</div>';
    document.getElementById('content-area').innerHTML = html;
    addDragAndDropHandlers();
}

function addToQueue(idx) { 
    queue.push(currentViewTracks[idx]); 
    showNotification('Ajouté à la file'); 
}

function removeFromQueue(index) {
    if (index === qIdx) {
        showNotification("Impossible de retirer le titre en cours", "error");
        return;
    }
    if (index < qIdx) qIdx--;
    queue.splice(index, 1);
    if(typeof saveSession === 'function') saveSession();
    showQueue();
}

function clearQueue() {
    if (queue.length <= 1) return;
    const currentTrack = queue[qIdx];
    queue = [currentTrack];
    qIdx = 0;
    if(typeof saveSession === 'function') saveSession();
    showQueue();
}

function playFromList(idx) { 
    queue = [...currentViewTracks]; 
    if(typeof play === 'function') play(idx); 
}

function playAll() { 
    if (currentViewTracks.length > 0) { 
        queue = [...currentViewTracks]; 
        if(typeof play === 'function') play(0); 
    } 
}

function playRecentTrack(idx) { 
    if(history[idx]) {
        queue = [history[idx]]; 
        if(typeof play === 'function') play(0); 
    }
}

// --- DRAG & DROP LOGIC ---

function setupPlaylistDragAndDrop(plIdx) {
    const list = document.getElementById('pl-tracks-container');
    if (!list) return;

    let draggedItem = null;
    let draggedIndex = null;
    const rows = list.querySelectorAll('.draggable-pl');

    rows.forEach(row => {
        row.addEventListener('dragstart', (e) => {
            draggedItem = row;
            draggedIndex = parseInt(row.getAttribute('data-index'));
            setTimeout(() => row.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
        });
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            draggedItem = null;
            draggedIndex = null;
        });
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) list.appendChild(draggable);
        else list.insertBefore(draggable, afterElement);
    });

    list.addEventListener('drop', async (e) => {
        e.preventDefault();
        const newIndex = [...list.querySelectorAll('.draggable-pl')].indexOf(draggedItem);
        if (draggedIndex !== null && newIndex !== -1 && draggedIndex !== newIndex) {
            const pl = playlists[plIdx];
            const item = pl.tracks.splice(draggedIndex, 1)[0];
            pl.tracks.splice(newIndex, 0, item);
            await saveData('pl', playlists);
            showPL(plIdx);
            showNotification("Playlist réorganisée 👌");
        }
    });
}

function addDragAndDropHandlers() {
    const list = document.getElementById('queue-list');
    if (!list) return;
    let draggedItem = null;
    let draggedIndex = null;
    const rows = list.querySelectorAll('.draggable');

    rows.forEach(row => {
        row.addEventListener('dragstart', (e) => {
            draggedItem = row;
            draggedIndex = parseInt(row.getAttribute('data-index'));
            setTimeout(() => row.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
        });
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            draggedItem = null;
            draggedIndex = null;
            showQueue();
        });
        row.addEventListener('click', (e) => {
            if (row.classList.contains('just-dropped')) {
                e.stopPropagation(); e.preventDefault();
                row.classList.remove('just-dropped');
            }
        });
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) list.appendChild(draggable);
        else list.insertBefore(draggable, afterElement);
    });

    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const newIndex = [...list.querySelectorAll('.draggable')].indexOf(draggedItem);
        if (draggedIndex !== null && newIndex !== -1 && draggedIndex !== newIndex) {
            const item = queue.splice(draggedIndex, 1)[0];
            queue.splice(newIndex, 0, item);
            if (qIdx === draggedIndex) qIdx = newIndex;
            else if (qIdx > draggedIndex && qIdx <= newIndex) qIdx--;
            else if (qIdx < draggedIndex && qIdx >= newIndex) qIdx++;
            if(typeof saveSession === 'function') saveSession();
            draggedItem.classList.add('just-dropped');
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging), .draggable-pl:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}