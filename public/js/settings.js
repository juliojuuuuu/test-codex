// ========================================
// PARAMÈTRES (VERSION ULTIME - RÉORGANISÉE)
// ========================================

/**
 * Affiche la vue des paramètres et génère l'interface HTML
 */
function showSettings() {
    updateNav([{name: 'Paramètres', cmd: 'showSettings()'}]);
    
    // Récupération sécurisée des valeurs actuelles
    const currentColor = personalization.themeColor || localStorage.getItem('localify_theme') || '#ff007b';
    const currentSpeed = personalization.playbackRate || 1;
    const currentAmbiance = personalization.ambianceMode || 'none';
    const currentAngle = personalization.gradientAngle || 135;
    
    // FIX : Autorise la valeur 0 pour le flou
    const currentBlur = (personalization.bgBlur !== undefined) ? personalization.bgBlur : 10;
    
    const grad1 = personalization.gradColor1 || '#2d0016';
    const grad2 = personalization.gradColor2 || '#050505';

    // Helper pour générer les interrupteurs (Switchs)
    const renderSwitch = (label, checked, key) => `
        <div class="setting-switch-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-size:14px; color:#eee;">${label}</span>
            <label class="switch">
                <input type="checkbox" ${checked ? 'checked' : ''} onchange="togglePersonalization('${key}')">
                <span class="slider"></span>
            </label>
        </div>`;

    document.getElementById('content-area').innerHTML = `
    <div class="settings-container">
        <h2 class="section-title" style="margin-bottom:25px;">⚙️ Configuration</h2>
        
        <div class="settings-box theme-picker-box" style="margin-bottom: 25px;">
            <div class="box-header">🎭 Collection de Thèmes</div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 15px;">Appliquez une ambiance complète en un clic.</p>
            <div class="theme-presets-grid">
                ${(typeof PRESET_THEMES !== 'undefined' ? PRESET_THEMES : []).map(t => `
                    <div class="theme-card ${personalization.activeThemeId === t.id ? 'active' : ''}" 
                         onclick="selectThemePreset('${t.id}')"
                         style="--theme-accent: ${t.accent}; --theme-bg: ${t.bg ? `url('${t.bg}')` : 'none'};">
                        <div class="theme-preview">
                            <div class="theme-dot"></div>
                        </div>
                        <span>${t.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="settings-grid">
            
            <div class="settings-box">
                <div class="box-header">🖥️ Général</div>
                
                <div class="setting-item">
                    <div class="setting-label">Visualiseur</div>
                    <select class="styled-select" onchange="setVisStyle(this.value)">
                        <option value="bars" ${personalization.visualizerType==='bars'?'selected':''}>Barres</option>
                        <option value="dual-bars" ${personalization.visualizerType==='dual-bars'?'selected':''}>Miroir</option>
                        <option value="round" ${personalization.visualizerType==='round'?'selected':''}>Circulaire</option>
                        <option value="wave" ${personalization.visualizerType==='wave'?'selected':''}>Onde</option>
                        <option value="shockwave" ${personalization.visualizerType==='shockwave'?'selected':''}>Shockwave</option>
                        <option value="none" ${personalization.visualizerType==='none'?'selected':''}>Désactivé</option>
                    </select>
                </div>

                <div class="setting-item">
                    <div class="setting-label">Fond d'écran (Image URL)</div>
                    <input type="text" class="styled-input" 
                           value="${personalization.bgImage || ''}" 
                           onchange="setWallpaper(this.value)" 
                           placeholder="Lien vers une image..." 
                           style="width:100%; margin-bottom:10px;">
                    <button class="btn-secondary" onclick="setWallpaper('')" style="width:100%; margin-bottom:15px;">🗑️ Retirer l'image</button>
                    
                    <div style="margin: 10px 0; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                        <div class="setting-label">Flou du fond : <span id="blur-val" style="color:var(--accent); font-weight:bold;">${currentBlur}px</span></div>
                        <input type="range" min="0" max="40" step="1" value="${currentBlur}" 
                               style="width:100%; cursor:pointer;" 
                               oninput="updateBlur(this.value)">
                    </div>
                </div>

                ${renderSwitch('Thème Caméléon (Couleur Auto)', personalization.chameleonMode, 'chameleonMode')}
                
                <div class="setting-item">
                    <div class="setting-label">Couleur manuelle</div>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="color" value="${currentColor}" onchange="applyTheme(this.value)" style="flex:1; height:40px; border:none; cursor:pointer; background:none;">
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; margin-top:10px;">
                    ${renderSwitch('✨ Activer le Mode Dégradé', personalization.enableGradient, 'enableGradient')}
                    
                    <div id="custom-gradient-ui" style="display: ${personalization.enableGradient ? 'block' : 'none'}; margin-top: 10px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px;">
                        <div class="setting-label">Couleurs personnalisées :</div>
                        <div style="display:flex; gap:10px; margin-bottom:15px;">
                            <input type="color" value="${grad1}" onchange="updateGradientColor('gradColor1', this.value)" style="flex:1; height:45px; cursor:pointer; background:none; border:none;">
                            <input type="color" value="${grad2}" onchange="updateGradientColor('gradColor2', this.value)" style="flex:1; height:45px; cursor:pointer; background:none; border:none;">
                        </div>
                        <div class="setting-label">Angle du dégradé : <span id="angle-val" style="color:var(--accent); font-weight:bold;">${currentAngle}°</span></div>
                        <input type="range" min="0" max="360" step="1" value="${currentAngle}" 
                               style="width:100%; cursor:pointer; margin-top: 5px;" 
                               oninput="updateGradientAngle(this.value)">
                    </div>
                </div>
            </div>

<div class="settings-box">
                <div class="box-header">✨ Mode Focus</div>
                <div class="setting-item">
                    <div class="setting-label">Style de la Pochette</div>
                    <select class="styled-select" onchange="setCoverStyle(this.value)">
                        <option value="square" ${personalization.coverStyle==='square'?'selected':''}>Carré (Classique)</option>
                        <option value="round" ${personalization.coverStyle==='round'?'selected':''}>Rond (Moderne)</option>
                        <option value="vinyl" ${personalization.coverStyle==='vinyl'?'selected':''}>Vinyle (Tourne)</option>
                    </select>
                </div>
                ${renderSwitch('Activer les Animations', personalization.enableFocusAnimation!==false, 'enableFocusAnimation')}
                ${renderSwitch('Afficher bouton Favori', personalization.showFocusHeart!==false, 'showFocusHeart')}
                ${renderSwitch('Afficher bouton Playlist', personalization.showFocusAddBtn!==false, 'showFocusAddBtn')} 
                ${renderSwitch('Économiseur d\'écran auto', personalization.enableScreensaver, 'enableScreensaver')}
            </div>

            <div class="settings-box">
                <div class="box-header">📚 Bibliothèque</div>
                ${renderSwitch('Playlists dans la Bibliothèque', personalization.showPlaylistsOnHome, 'showPlaylistsOnHome')}
                
                <div class="setting-item">
                    <div class="setting-label">Position "Récents"</div>
                    <select class="styled-select" onchange="setRecentPos(this.value)">
                        <option value="top" ${personalization.recentPosition==='top'?'selected':''}>Haut de page</option>
                        <option value="bottom" ${personalization.recentPosition==='bottom'?'selected':''}>Bas de page</option>
                    </select>
                </div>
            </div>

            <div class="settings-box">
                <div class="box-header">🎧 Audio & Système</div>
                ${renderSwitch('Mode 8D (Spatialisation)', personalization.enable8D, 'enable8D')}
                ${renderSwitch('Fondu enchaîné (Crossfade)', personalization.enableCrossfade, 'enableCrossfade')}
                
                <div class="setting-item">
                    <div class="setting-label">Ambiance (Particules)</div>
                    <select class="styled-select" onchange="setAmbiance(this.value)">
                        <option value="none" ${currentAmbiance==='none'?'selected':''}>Désactivé</option>
                        <option value="snow" ${currentAmbiance==='snow'?'selected':''}>❄️ Neige</option>
                        <option value="embers" ${currentAmbiance==='embers'?'selected':''}>🔥 Braises</option>
                        <option value="stars" ${currentAmbiance==='stars'?'selected':''}>✨ Étoiles</option>
                        <option value="fireflies" ${currentAmbiance==='fireflies'?'selected':''}>🧚 Lucioles</option>
                    </select>
                </div>

                <div class="setting-item">
                    <div class="setting-label">Vitesse de lecture : <span id="speed-val" style="color:var(--accent); font-weight:bold;">x${currentSpeed}</span></div>
                    <input type="range" min="0.5" max="1.5" step="0.05" value="${currentSpeed}" 
                           style="width:100%; cursor:pointer;" 
                           oninput="updatePlaybackSpeed(this.value)">
                </div>

                <div style="margin-top:20px; display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-secondary" style="width:100%;" onclick="openEQModal()">🎚️ Égaliseur</button>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-secondary" style="flex:1;" onclick="exportData()">💾 Exporter</button>
                        <button class="btn-secondary" style="flex:1;" onclick="triggerImport()">📥 Importer</button>
                    </div>
                </div>
                <button class="btn-secondary" style="width:100%; margin-top:15px;" onclick="document.getElementById('shortcuts-modal').style.display='flex'">
                    ⌨️ Voir les Raccourcis
                </button>
            </div>
        </div>
    </div>`;
}

// ========================================
// LOGIQUE DE PERSONNALISATION
// ========================================

function applyPersonalization() {
    const body = document.body;
    const angle = personalization.gradientAngle || 135;
    const g1 = personalization.gradColor1 || '#2d0016';
    const g2 = personalization.gradColor2 || '#050505';

    // FIX : Gestion du flou (autorise le 0)
    const blurValue = (personalization.bgBlur !== undefined) ? personalization.bgBlur : 10;
    document.documentElement.style.setProperty('--bg-blur', blurValue + 'px');
    document.documentElement.style.setProperty('--bg-overlay', personalization.bgOverlay || '0.95');

    // Application du fond (Dégradé > Image > Couleur)
    if (personalization.enableGradient) {
        body.style.backgroundImage = 'none';
        body.style.background = `linear-gradient(${angle}deg, ${g1}, ${g2})`;
        body.style.backgroundAttachment = 'fixed';
    } else if (personalization.bgImage) {
        body.style.background = 'none';
        body.style.setProperty('--bg-image', `url('${personalization.bgImage}')`);
        body.style.backgroundImage = `var(--bg-image)`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundAttachment = 'fixed';
    } else {
        body.style.backgroundImage = 'none';
        body.style.background = 'var(--bg)';
    }

    // Gestion des classes
    body.classList.toggle('no-animations', personalization.enableFocusAnimation === false);
    
    // Mise à jour de la pochette Focus
    const cover = document.getElementById('focus-cover'); 
    if(cover) {
        cover.classList.remove('style-round', 'style-vinyl');
        if(personalization.coverStyle === 'round') cover.classList.add('style-round');
        if(personalization.coverStyle === 'vinyl') cover.classList.add('style-vinyl');
    }
    
    if(personalization.themeColor) applyTheme(personalization.themeColor, false);
}

function updateBlur(val) {
    personalization.bgBlur = parseInt(val);
    const label = document.getElementById('blur-val');
    if (label) label.innerText = val + 'px';
    applyPersonalization();
    savePerso();
}

function updateGradientColor(key, val) {
    personalization[key] = val;
    applyPersonalization();
    savePerso();
}

function updateGradientAngle(val) {
    personalization.gradientAngle = parseInt(val);
    const label = document.getElementById('angle-val');
    if (label) label.innerText = val + '°';
    applyPersonalization();
    savePerso();
}

function selectThemePreset(themeId) {
    if (typeof PRESET_THEMES === 'undefined') return;
    const theme = PRESET_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    personalization.activeThemeId = themeId;
    if (theme.gradient) personalization.gradientValue = theme.gradient;
    if (theme.overlay) personalization.bgOverlay = theme.overlay;
    
    applyTheme(theme.accent, false);
    setWallpaper(theme.bg);
    showSettings();
    showNotification(`Thème "${theme.name}" appliqué !`);
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function applyTheme(col, save = true) { 
    personalization.themeColor = col; 
    document.documentElement.style.setProperty('--accent', col);
    document.documentElement.style.setProperty('--accent-hover', col);
    
    let c = col.substring(1);
    if(c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
    if(typeof visualizerColor !== 'undefined') visualizerColor = { r, g, b };
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.6)`);
    
    localStorage.setItem('localify_theme', col);
    if(save) savePerso(); 
}

function setWallpaper(url) { 
    personalization.bgImage = url; 
    applyPersonalization(); 
    savePerso(); 
}

function updatePlaybackSpeed(val) {
    const speed = parseFloat(val);
    const label = document.getElementById('speed-val');
    if (label) label.innerText = 'x' + speed;
    if (audio) { audio.playbackRate = speed; audio.preservesPitch = true; }
    personalization.playbackRate = speed;
    savePerso();
}

function triggerSleepTimer(val) {
    const min = parseInt(val);
    if (typeof setSleepTimer === 'function') setSleepTimer(min);
}

async function savePerso() {
    localStorage.setItem('localify_perso', JSON.stringify(personalization));
    if (typeof config !== 'undefined') {
        config.personalization = personalization;
        if(typeof saveData === 'function') await saveData('cfg', config);
    }
}

function setCoverStyle(s) { personalization.coverStyle = s; applyPersonalization(); savePerso(); }

function setVisStyle(s) { personalization.visualizerType = s; savePerso(); }

function setRecentPos(p) { 
    personalization.recentPosition = p; 
    savePerso(); 
    showSettings(); 
    if (typeof showLib === 'function') showLib(); 
}

function setAmbiance(mode) {
    personalization.ambianceMode = mode;
    savePerso();
    if (typeof initParticles === 'function') initParticles();
}

function togglePersonalization(k) { 
    // Bascule la valeur (vrai/faux)
    if(personalization[k] === undefined) personalization[k] = true; 
    personalization[k] = !personalization[k]; 
    
    // Gestion spécifique du mode Caméléon
    if (k === 'chameleonMode' && !personalization[k]) {
        applyTheme(localStorage.getItem('localify_theme') || '#ff007b');
    }
    
    // Gestion du mode 8D
    if (k === 'enable8D' && typeof toggle8DMode === 'function') {
        toggle8DMode(personalization[k]);
    }

    // Applique les changements visuels (Fond, Flou, etc.)
    applyPersonalization(); 
    savePerso(); 
    showSettings(); // Rafraîchit les interrupteurs

    // Rafraîchit la bibliothèque si nécessaire
    if (k === 'showPlaylistsOnHome' || k === 'recentPosition') {
        if (typeof showLib === 'function') showLib(); 
    }

    // --- LE CORRECTIF EST ICI ---
    // Si on touche aux boutons du Focus (Coeur ou Playlist), on force la mise à jour du lecteur
    if (k === 'showFocusHeart' || k === 'showFocusAddBtn') {
        if (typeof updatePlayerUI === 'function' && queue[qIdx]) {
            updatePlayerUI(queue[qIdx]);
        }
    }
}

function exportData() {
    const data = { playlists, favs, config, personalization, theme: personalization.themeColor };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "localify_backup.json"; a.click();
}

function triggerImport() { 
    const input = document.getElementById('import-file');
    if(input) input.click(); 
}