// ========================================
// ÉTAT GLOBAL & CONFIGURATION
// ========================================
let allMusic = [], favs = [], playlists = [], queue = [], qIdx = 0;
let currentViewTracks = [], history = [], trackToEnqueue = null;
let audio = new Audio();






// Configuration iOS indispensable
audio.setAttribute("playsinline", "true");
audio.setAttribute("webkit-playsinline", "true");
audio.preload = "auto";
audio.crossOrigin = "anonymous";
audio.muted = false; 

let config = { autoplay: true, volume: 1, carMode: false };
let isAsc = true;
let isShuffle = false;
let repeatMode = 0; 
let isFocusMode = false;

let audioContext, analyser, dataArray, source;

// --- VARIABLES HYBRIDES (EQ 3 & 10) ---
// Mode 10 Bandes
let eqNodes = []; 
let eqSettings10 = new Array(10).fill(0);

// Mode 3 Bandes
let bassNode, midNode, trebleNode;
let eqSettings3 = { bass: 0, mid: 0, treble: 0 };

let visualizerColor = { r: 255, g: 0, b: 123 }; 
let animationId;

// Options de personnalisation
let personalization = {
    bgImage: '',            
    visualizerType: 'bars', 
    borderRadius: '12px',   
    showFocusHeart: true,       
    enableFocusAnimation: true, 
    showFocusVisualizer: true,
    enableScreensaver: false, 
    enableCrossfade: false,
    showPlaylistsOnHome: false,
    recentPosition: 'bottom',
    chameleonMode: false,
    coverStyle: 'square',
    ambianceMode: 'none',
    
    // --- NOUVEAU : Choix du mode EQ ('3' ou '10') ---
    eqMode: '10',


    enableGradient: false, // Désactivé par défaut
    gradientValue: 'linear-gradient(135deg, #000000, #1a1a1a)',

showFocusAddBtn: true

};


// Définition des thèmes prédéfinis
const PRESET_THEMES = [
    { id: 'default', name: 'Localify Pink', accent: '#ff007b', bg: '', overlay: 0.95 },
    { id: 'discord', name: 'Discord Dark', accent: '#5865f2', bg: '', overlay: 0.98 },
    { id: 'emerald', name: 'Émeraude', accent: '#1db954', bg: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=2000', overlay: 0.8 },
    { id: 'cyberpunk', name: 'Neon City', accent: '#f700ff', bg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000', overlay: 0.7 },
    { id: 'sunset', name: 'Ocean Sunset', accent: '#ff7e5f', bg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000', overlay: 0.75 },
    { id: 'minimal', name: 'Noir Absolu', accent: '#ffffff', bg: 'none', overlay: 1 },



    { 
        id: 'synthwave', 
        name: 'Retro Synth', 
        accent: '#ff00ff', 
        bg: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2000', 
        gradient: 'linear-gradient(135deg, #2b0054, #000000)', 
        overlay: 0.8 
    },
    { 
        id: 'abyss', 
        name: 'Abysse Profond', 
        accent: '#00d2ff', 
        bg: 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=2000', 
        gradient: 'linear-gradient(135deg, #000428, #004e92)', 
        overlay: 0.9 
    },
    { 
        id: 'sakura', 
        name: 'Sakura Zen', 
        accent: '#ffb7c5', 
        bg: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2000', 
        gradient: 'linear-gradient(135deg, #3a1c21, #050505)', 
        overlay: 0.85 
    },
    { 
        id: 'luxury', 
        name: 'Or & Noir', 
        accent: '#d4af37', 
        bg: '', 
        gradient: 'linear-gradient(135deg, #1a1a10, #000000)', 
        overlay: 0.98 
    },
    { 
        id: 'aurora', 
        name: 'Aurore Boréale', 
        accent: '#00ffcc', 
        bg: 'https://images.unsplash.com/photo-1537815763285-3bc7443ef17c?q=80&w=2000', 
        gradient: 'linear-gradient(135deg, #020111, #0b4a44)', 
        overlay: 0.8 
    },
    { 
        id: 'blood', 
        name: 'Vampire Night', 
        accent: '#ff0000', 
        bg: '', 
        gradient: 'linear-gradient(135deg, #4b0000, #000000)', 
        overlay: 0.95 
    },
    { 
        id: 'matcha', 
        name: 'Matcha Tea', 
        accent: '#9dc183', 
        bg: '', 
        gradient: 'linear-gradient(135deg, #1e2d16, #050505)', 
        overlay: 0.9 
    }
];


// Chargement et fusion des préférences
const savedPerso = localStorage.getItem('localify_perso');
if (savedPerso) {
    try {
        const parsed = JSON.parse(savedPerso);
        personalization = { ...personalization, ...parsed };
    } catch (e) { console.error("Erreur chargement perso", e); }
}