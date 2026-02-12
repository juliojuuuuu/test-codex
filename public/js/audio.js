// ========================================
// MOTEUR AUDIO HYBRIDE (3 & 10 BANDES)
// ========================================

let pannerNode; // Pour le mode 8D
let pannerInterval;
let iosWakeInterval;

// Fréquences standards ISO pour le mode 10 bandes
const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

function initAudioContext() {
    if (!audioContext) {
        // 1. Création du contexte
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext({ latencyHint: 'playback' });
        
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256; 
        
        source = audioContext.createMediaElementSource(audio);
        pannerNode = audioContext.createStereoPanner();

        // 2. Construction de la chaîne EQ (3 ou 10 bandes selon le réglage)
        setupEQChain();

        // 3. Fin de chaîne (Panner -> Analyser -> Sortie)
        pannerNode.connect(analyser);
        analyser.connect(audioContext.destination);

        dataArray = new Uint8Array(analyser.frequencyBinCount);
        console.log("🔊 Moteur Audio Initialisé");
        
        if (typeof drawVisualizer === 'function') drawVisualizer();
        enableIOSHack();
    }

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => console.log("🔊 Audio déverrouillé"));
    }
}

// --- CŒUR DU SYSTÈME : Construction dynamique ---
function setupEQChain() {
    if (!audioContext || !source) return;

    // 1. Déconnexion propre des anciens nœuds pour éviter les conflits
    try { source.disconnect(); } catch(e) {}
    
    // Nettoyage EQ 10
    eqNodes.forEach(n => { try { n.disconnect(); } catch(e){} });
    eqNodes = [];

    // Nettoyage EQ 3
    if(bassNode) { try{bassNode.disconnect();}catch(e){} }
    if(midNode) { try{midNode.disconnect();}catch(e){} }
    if(trebleNode) { try{trebleNode.disconnect();}catch(e){} }

    let previousNode = source;

    // 2. Branchement selon le mode choisi
    if (personalization.eqMode === '3') {
        // --- MODE 3 BANDES (Simple) ---
        bassNode = audioContext.createBiquadFilter();
        bassNode.type = 'lowshelf';
        bassNode.frequency.value = 250;

        midNode = audioContext.createBiquadFilter();
        midNode.type = 'peaking';
        midNode.frequency.value = 1000;
        midNode.Q.value = 0.5;

        trebleNode = audioContext.createBiquadFilter();
        trebleNode.type = 'highshelf';
        trebleNode.frequency.value = 4000;

        previousNode.connect(bassNode);
        bassNode.connect(midNode);
        midNode.connect(trebleNode);
        previousNode = trebleNode;
        
        restoreEQ3(); // Charge les valeurs 3 bandes

    } else {
        // --- MODE 10 BANDES (Pro) ---
        eqNodes = EQ_FREQUENCIES.map(freq => {
            const node = audioContext.createBiquadFilter();
            node.type = 'peaking';
            node.frequency.value = freq;
            node.Q.value = 1.5;
            node.gain.value = 0;
            return node;
        });

        eqNodes.forEach(node => {
            previousNode.connect(node);
            previousNode = node;
        });
        
        restoreEQ10(); // Charge les valeurs 10 bandes
    }

    // 3. Reconnexion au reste de la chaîne (8D et Sortie)
    previousNode.connect(pannerNode);
}

// --- FONCTION DE BASCULE (Switch) ---
function switchEQType() {
    // Change le mode
    personalization.eqMode = (personalization.eqMode === '10') ? '3' : '10';
    localStorage.setItem('localify_perso', JSON.stringify(personalization));
    
    // Reconstruit le moteur audio instantanément
    setupEQChain();
    
    // Met à jour l'affichage si le modal est ouvert
    if (typeof renderEQContent === 'function') {
        renderEQContent();
    }
    
    showNotification(`Mode Égaliseur : ${personalization.eqMode} Bandes`);
}

// --- GESTION 10 BANDES ---
function setEQ10(index, value) {
    if (!audioContext || !eqNodes[index]) return; 
    const val = parseFloat(value);
    eqNodes[index].gain.value = val;
    if (typeof eqSettings10 !== 'undefined') {
        eqSettings10[index] = val;
        localStorage.setItem('localify_eq_10', JSON.stringify(eqSettings10));
    }
}

function restoreEQ10() {
    const saved = localStorage.getItem('localify_eq_10');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === 10) {
                eqSettings10 = parsed;
                if(eqNodes.length > 0) eqNodes.forEach((n, i) => n.gain.value = eqSettings10[i]);
            }
        } catch (e) {}
    }
}

// --- GESTION 3 BANDES ---
function setEQ3(band, value) {
    if (!audioContext) return;
    const val = parseFloat(value);
    
    if (band === 'bass' && bassNode) bassNode.gain.value = val;
    if (band === 'mid' && midNode) midNode.gain.value = val;
    if (band === 'treble' && trebleNode) trebleNode.gain.value = val;

    eqSettings3[band] = val;
    localStorage.setItem('localify_eq_3', JSON.stringify(eqSettings3));
}

function restoreEQ3() {
    const saved = localStorage.getItem('localify_eq_3');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            eqSettings3 = parsed;
            if(bassNode) bassNode.gain.value = eqSettings3.bass || 0;
            if(midNode) midNode.gain.value = eqSettings3.mid || 0;
            if(trebleNode) trebleNode.gain.value = eqSettings3.treble || 0;
        } catch (e) {}
    }
}

// --- PRESETS (Intelligents selon le mode) ---
function applyPreset(type) {
    if (personalization.eqMode === '3') {
        let b=0, m=0, t=0;
        switch(type) {
            case 'bass': b=8; m=-2; t=-2; break;
            case 'rock': b=5; m=-1; t=6; break;
            case 'pop': b=3; m=4; t=3; break;
            case 'voice': b=-2; m=6; t=2; break;
            case 'flat': b=0; m=0; t=0; break;
        }
        setEQ3('bass', b); setEQ3('mid', m); setEQ3('treble', t);
        
        // Mise à jour visuelle des sliders 3 bandes
        if(document.getElementById('eq-3-bass')) {
            document.getElementById('eq-3-bass').value = b;
            document.getElementById('eq-3-mid').value = m;
            document.getElementById('eq-3-treble').value = t;
        }
    } else {
        let gains = new Array(10).fill(0);
        switch (type) {
            case 'bass':  gains = [9, 7, 6, 4, 0, 0, 0, 0, 2, 2]; break; 
            case 'rock':  gains = [5, 4, 3, 1, -1, -1, 2, 4, 5, 6]; break; 
            case 'pop':   gains = [2, 3, 4, 3, 1, 0, 1, 3, 4, 4]; break; 
            case 'voice': gains = [-4, -3, -2, 0, 3, 6, 4, 2, 0, -2]; break;
            case 'flat':  gains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; break;
        }
        gains.forEach((g, i) => setEQ10(i, g));
        
        // Mise à jour visuelle des sliders 10 bandes
        const inputs = document.querySelectorAll('.eq-band input');
        inputs.forEach((input, i) => { if (gains[i] !== undefined) input.value = gains[i]; });
    }
    showNotification(`Preset "${type}" appliqué`);
}

// --- FONCTIONS UTILITAIRES ---
function enableIOSHack() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && audioContext && audioContext.state !== 'running' && !audio.paused) {
            audioContext.resume();
        }
    });
    if (iosWakeInterval) clearInterval(iosWakeInterval);
    iosWakeInterval = setInterval(() => {
        if (audioContext && !audio.paused && (audioContext.state === 'suspended' || audioContext.state === 'interrupted')) {
            console.log("Audio Réveil Force");
            audioContext.resume();
        }
    }, 2000);
    document.addEventListener('touchstart', function() {
        if (audioContext) {
            const buf = audioContext.createBuffer(1, 1, 22050);
            const src = audioContext.createBufferSource();
            src.buffer = buf; src.connect(audioContext.destination); src.start(0);
        }
    }, { once: true });
}

function toggle8DMode(enable) {
    if (!audioContext || !pannerNode) return;
    if (enable) {
        let x = 0;
        clearInterval(pannerInterval);
        pannerInterval = setInterval(() => {
            if (!audio.paused) { x += 0.02; pannerNode.pan.value = Math.sin(x); }
        }, 50);
        showNotification("Mode 8D Activé 🎧");
    } else {
        clearInterval(pannerInterval);
        pannerNode.pan.value = 0; 
        showNotification("Mode 8D Désactivé");
    }
}

function toggleMute() {
    audio.muted = !audio.muted;
    const btn = document.getElementById('mute-btn');
    if (btn) btn.innerHTML = audio.muted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
    if (typeof lucide !== 'undefined') lucide.createIcons();
}