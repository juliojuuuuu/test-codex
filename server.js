const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mm = require('music-metadata');
const app = express();

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    MUSIC_PATH: './music',
    DATA_DIR: './data',
    PORT: process.env.PORT || 3000,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};

const DATA_FILES = { 
    fav: path.join(CONFIG.DATA_DIR, 'fav.json'),
    pl: path.join(CONFIG.DATA_DIR, 'pl.json'),
    cfg: path.join(CONFIG.DATA_DIR, 'cfg.json'),
    history: path.join(CONFIG.DATA_DIR, 'history.json')
};

let musicCache = { data: null, timestamp: null };

// ========================================
// INITIALISATION
// ========================================
async function initializeDataDir() {
    try {
        if (!fsSync.existsSync(CONFIG.DATA_DIR)) {
            await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
            console.log('✓ Dossier data créé');
        }
        if (!fsSync.existsSync(CONFIG.MUSIC_PATH)) {
            await fs.mkdir(CONFIG.MUSIC_PATH, { recursive: true });
            console.log('✓ Dossier music créé');
        }
        for (const [key, filePath] of Object.entries(DATA_FILES)) {
            if (!fsSync.existsSync(filePath)) {
                const defaultContent = key === 'cfg' 
                    ? JSON.stringify({ autoplay: true, volume: 1 }, null, 2)
                    : JSON.stringify([], null, 2);
                await fs.writeFile(filePath, defaultContent);
                console.log(`✓ ${key}.json initialisé`);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
}

// ========================================
// MIDDLEWARE & ROUTING (CORRIGÉ POUR ELECTRON)
// ========================================
app.use(express.json({ limit: '10mb' }));

// CORRECTION CRITIQUE : Utiliser path.join(__dirname, ...) pour les chemins
// Cela permet à l'application de trouver les fichiers même une fois compilée en .exe
app.use(express.static(path.join(__dirname, 'public')));
app.use('/stream', express.static(path.resolve(CONFIG.MUSIC_PATH)));

// Route racine explicite pour être sûr que l'index se charge
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// UTILITAIRES
// ========================================
function sanitizePath(filePath) {
    if (!filePath) throw new Error('Chemin manquant');

    // 1. Décodage et normalisation
    const decodedPath = decodeURIComponent(filePath);
    
    // 2. On calcule le chemin absolu du dossier musique et du fichier demandé
    const root = path.resolve(CONFIG.MUSIC_PATH);
    const finalPath = path.resolve(root, decodedPath);

    // 3. SÉCURITÉ : On vérifie que le chemin final commence bien par le chemin du dossier racine
    if (!finalPath.startsWith(root)) {
        throw new Error('Chemin invalide : tentative de remontée interdite');
    }

    // On retourne le chemin relatif par rapport à la racine musique
    return path.relative(root, finalPath);
}

function parseMetadata(filePath, fileName) {
    const parts = filePath.split(path.sep);
    let artist = 'Artiste Inconnu';
    let album = 'Singles';
    
    if (parts.length >= 2) {
        artist = parts[0];
        if (parts.length >= 3) album = parts[1];
    } else {
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        const dashParts = nameWithoutExt.split(' - ');
        if (dashParts.length >= 2) artist = dashParts[dashParts.length - 1].trim();
    }
    
    return { name: fileName.replace(/\.[^/.]+$/, ''), artist, album };
}

async function scanMusicDirectory() {
    const results = [];
    const extensions = ['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.opus'];
    
    async function walkDir(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walkDir(fullPath);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensions.includes(ext)) {
                    const relativePath = path.relative(CONFIG.MUSIC_PATH, fullPath);
                    const metadata = parseMetadata(relativePath, entry.name);
                    results.push({
                        id: Buffer.from(relativePath).toString('base64').substring(0, 12),
                        name: metadata.name,
                        artist: metadata.artist,
                        album: metadata.album,
                        url: `/stream/${relativePath.split(path.sep).map(s => encodeURIComponent(s)).join('/')}`,
                        path: relativePath
                    });
                }
            }
        }
    }
    if (fsSync.existsSync(CONFIG.MUSIC_PATH)) await walkDir(CONFIG.MUSIC_PATH);
    return results;
}

// ========================================
// ROUTES API
// ========================================
app.get('/api/music', async (req, res) => {
    const now = Date.now();
    if (musicCache.data && (now - musicCache.timestamp) < CONFIG.CACHE_DURATION) {
        return res.json(musicCache.data);
    }
    const musicList = await scanMusicDirectory();
    musicCache = { data: musicList, timestamp: now };
    res.json(musicList);
});

app.get('/api/cover', async (req, res) => {
    try {
        const rawPath = req.query.path;
        const cleanPath = sanitizePath(rawPath);
        const fullPath = path.join(CONFIG.MUSIC_PATH, cleanPath);

        const placeholder = 'https://img.icons8.com/?size=100&id=1wPyVx3xGRwD&format=png&color=000000';

        if (!fsSync.existsSync(fullPath)) return res.redirect(placeholder);

        // Lecture des métadonnées (MP3 ou FLAC)
        const metadata = await mm.parseFile(fullPath);
        const picture = metadata.common.picture && metadata.common.picture[0];

        if (picture) {
            // Gestion du type MIME pour FLAC
            const mimeType = picture.format.includes('/') ? picture.format : `image/${picture.format}`;
            res.set({
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000',
                'Content-Length': picture.data.length
            });
            return res.send(picture.data);
        }

        // Si pas de pochette interne, on cherche un fichier image dans le dossier
        const folderPath = path.dirname(fullPath);
        const imagesInFolder = ['cover.jpg', 'folder.jpg', 'album.jpg', 'cover.png', 'front.jpg'];
        
        for (const name of imagesInFolder) {
            const imgPath = path.join(folderPath, name);
            if (fsSync.existsSync(imgPath)) {
                return res.sendFile(path.resolve(imgPath));
            }
        }

        res.redirect(placeholder);
    } catch (error) {
        console.error('Erreur cover :', error.message);
        res.redirect('https://img.icons8.com/?size=100&id=1wPyVx3xGRwD&format=png&color=000000');
    }
});

app.get('/api/data/:type', async (req, res) => {
    const filePath = DATA_FILES[req.params.type];
    if (!filePath || !fsSync.existsSync(filePath)) return res.json(req.params.type === 'cfg' ? { autoplay: true, volume: 1 } : []);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json(JSON.parse(content));
});

app.post('/api/data/:type', async (req, res) => {
    const filePath = DATA_FILES[req.params.type];
    if (filePath) {
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
        res.json({ success: true });
    }
});

async function startServer() {
    await initializeDataDir();
    app.listen(CONFIG.PORT, () => {
        console.log(`\n✓ Serveur Localify démarré sur http://localhost:${CONFIG.PORT}\n`);
    });
}

startServer();