// ========================================
// MAIN ENTRY POINT (DÉMARRAGE UNIQUE)
// ========================================

async function init() {
    console.log("🚀 Démarrage de Localify...");
    try {
        // 1. Chargement parallèle des données
        const [mRes, fRes, pRes, cRes, hRes] = await Promise.all([
            fetch('/api/music'),
            fetch('/api/data/fav'),
            fetch('/api/data/pl'),
            fetch('/api/data/cfg'),
            fetch('/api/data/history')
        ]);
        
        // 2. Traitement de la musique
        allMusic = await mRes.json();
        
        // Correction des artistes (Structure dossiers)
        allMusic.forEach(track => {
            const p = track.path.replace(/\\/g, '/');
            const parts = p.split('/');
            if (parts.length > 2) {
                track.artist = parts[1]; // Dossier Artiste
            }
        });

        // 3. Assignation des variables globales (définies dans state.js)
        favs = await fRes.json() || [];
        playlists = await pRes.json() || [];
        history = await hRes.json() || [];
        
        // --- CORRECTION MAJEURE ICI ---
        // On récupère la config du serveur
        const serverConfig = await cRes.json() || { autoplay: true, volume: 1 };
        config = serverConfig;

        // Si la config contient des personnalisations (couleur, fond...), on les applique immédiatement
        if (serverConfig.personalization) {
            // On fusionne avec les valeurs par défaut pour éviter les bugs
            personalization = { ...personalization, ...serverConfig.personalization };
            
            // On force la mise à jour du cache local du téléphone pour la prochaine fois
            localStorage.setItem('localify_perso', JSON.stringify(personalization));
            if (personalization.themeColor) {
                localStorage.setItem('localify_theme', personalization.themeColor);
            }
        }
        // -----------------------------
        
        console.log(`✅ Chargé : ${allMusic.length} titres`);

        // 4. Initialisation de l'interface
        if (typeof renderPLs === 'function') renderPLs(); // Playlists Sidebar
        
        // On lance la Bibliothèque par défaut
        if (typeof showLib === 'function') showLib(); 
        
        // 5. Restauration de la session (lecture en cours)
        if (typeof restoreSession === 'function') restoreSession();
        
        // 6. Application des préférences visuelles
        // Maintenant que 'personalization' est à jour avec les données du serveur, 
        // cette fonction va appliquer la bonne couleur et le bon fond d'écran.
        if (typeof applyPersonalization === 'function') applyPersonalization();

        // 7. Configuration Volume
        if (config.volume !== undefined) {
            audio.volume = config.volume;
            const volInput = document.getElementById('vol');
            if(volInput) volInput.value = config.volume;
        }

    } catch (e) {
        console.error('❌ Erreur critique au démarrage:', e);
        if (typeof showNotification === 'function') {
            showNotification('Erreur de connexion au serveur', 'error');
        }
    }
}

// Lancement au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    // Initialisation principale
    await init();

    // Mise en place des écouteurs d'événements
    if (typeof setupAudioEventHandlers === 'function') setupAudioEventHandlers();
    if (typeof setupUIEventHandlers === 'function') setupUIEventHandlers();
    if (typeof updateShuffleRepeatUI === 'function') updateShuffleRepeatUI();
});