/* HighScoreManager + ProgressManager — persistance localStorage */

// ============================================================
//  HIGH SCORE MANAGER — Sauvegarde via localStorage
// ============================================================
export class HighScoreManager {
    constructor() {
        this.key = 'supercarre_highscores';
        this.maxEntries = 5;
        this.scores = this.charger();
    }

    charger() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) return JSON.parse(data);
        } catch(e) {}
        return [];
    }

    sauvegarder() {
        try { localStorage.setItem(this.key, JSON.stringify(this.scores)); } catch(e) {}
    }

    // Calcule un score final à partir du score brut accumulé en jeu
    // (pièces +100, ennemis, power-ups +250…) plus les bonus de fin.
    calculerScore(scoreBrut, temps, vies, niveauAtteint) {
        let score = scoreBrut;
        score += vies * 500;            // Bonus vies restantes
        score += niveauAtteint * 200;   // Bonus niveaux
        score -= Math.floor(temps) * 2; // Pénalité temps (légère)
        return Math.max(0, score);
    }

    // Vérifie si le score mérite d'entrer dans le top
    isHighScore(scoreBrut, temps, vies, niveauAtteint) {
        const score = this.calculerScore(scoreBrut, temps, vies, niveauAtteint);
        if (this.scores.length < this.maxEntries) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    // Ajoute un score
    ajouter(nom, scoreBrut, temps, vies, niveauAtteint, pieces) {
        const score = this.calculerScore(scoreBrut, temps, vies, niveauAtteint);
        const entry = {
            nom: nom || '???',
            score: score,
            pieces: pieces,
            temps: parseFloat(temps.toFixed(1)),
            niveau: niveauAtteint,
            date: new Date().toLocaleDateString('fr-FR')
        };
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, this.maxEntries);
        this.sauvegarder();
        return score;
    }

    // Récupère le tableau formaté pour l'affichage
    getTableau() {
        const medals = ['🥇','🥈','🥉'];
        return this.scores.map((s, i) => ({
            rank: medals[i] || `${i+1}`,
            nom: s.nom,
            score: s.score,
            pieces: s.pieces,
            temps: s.temps,
            niveau: s.niveau || 1
        }));
    }
}

// ============================================================
//  PROGRESS MANAGER — mémorise le meilleur niveau débloqué
// ============================================================
export class ProgressManager {
    constructor(nbNiveaux) {
        this.key = 'supercarre_progress';
        this.starsKey = 'supercarre_stars';
        this.tempsKey = 'supercarre_temps';
        this.nbNiveaux = nbNiveaux;
        this.niveauDebloque = this.charger(); // index 0-based du plus haut niveau atteint
        this.etoiles = this.chargerEtoiles(); // {idxNiveau: nbEtoiles}
        this.temps = this.chargerTemps();     // {idxNiveau: meilleur temps en secondes}
    }
    chargerTemps() {
        try { return JSON.parse(localStorage.getItem(this.tempsKey)) || {}; } catch(e) { return {}; }
    }
    // v74 : records séparés par difficulté — {idx: {f: t, n: t, d: t}}.
    // Migration : les anciens records (nombre nu) sont attribués au mode Normal.
    _migrerTemps(idx) {
        if (typeof this.temps[idx] === 'number') this.temps[idx] = { n: this.temps[idx] };
    }
    _sauverTemps() {
        try { localStorage.setItem(this.tempsKey, JSON.stringify(this.temps)); } catch(e) {}
    }
    // Enregistre le temps d'un niveau POUR une difficulté (garde le MEILLEUR).
    // Retourne true si c'est un nouveau record de cette difficulté.
    enregistrerTemps(idx, t, diff = 'n') {
        this._migrerTemps(idx);
        if (!this.temps[idx]) this.temps[idx] = {};
        const actuel = this.temps[idx][diff];
        if (actuel === undefined || t < actuel) {
            this.temps[idx][diff] = Math.round(t * 10) / 10;
            this._sauverTemps();
            return true;
        }
        return false;
    }
    // Meilleur temps pour une difficulté (défaut Normal) ; diff=null → meilleur tous modes.
    tempsDe(idx, diff = 'n') {
        this._migrerTemps(idx);
        const e = this.temps[idx];
        if (!e) return null;
        if (diff === null) { const v = Object.values(e); return v.length ? Math.min(...v) : null; }
        return e[diff] !== undefined ? e[diff] : null;
    }
    // Toutes les entrées {f,n,d} d'un niveau (affichage avec badges 😊😐😈)
    tempsTous(idx) { this._migrerTemps(idx); return this.temps[idx] || {}; }
    charger() {
        try {
            const v = parseInt(localStorage.getItem(this.key), 10);
            if (!isNaN(v) && v >= 0 && v < this.nbNiveaux) return v;
        } catch(e) {}
        return 0;
    }
    chargerEtoiles() {
        try { return JSON.parse(localStorage.getItem(this.starsKey)) || {}; } catch(e) { return {}; }
    }
    // Enregistre les étoiles d'un niveau (garde le meilleur score obtenu)
    enregistrerEtoiles(idx, nb) {
        const actuel = this.etoiles[idx] || 0;
        if (nb > actuel) {
            this.etoiles[idx] = nb;
            try { localStorage.setItem(this.starsKey, JSON.stringify(this.etoiles)); } catch(e) {}
        }
    }
    etoilesDe(idx) { return this.etoiles[idx] || 0; }
    totalEtoiles() { return Object.values(this.etoiles).reduce((a, b) => a + b, 0); }
    // Débloque un niveau (ne régresse jamais)
    debloquer(idx) {
        const cible = Math.min(idx, this.nbNiveaux - 1);
        if (cible > this.niveauDebloque) {
            this.niveauDebloque = cible;
            try { localStorage.setItem(this.key, String(this.niveauDebloque)); } catch(e) {}
        }
    }
    // Y a-t-il une partie à reprendre (au-delà du niveau 1) ?
    aProgression() { return this.niveauDebloque > 0; }
    // Repartir de zéro
    reinitialiser() {
        this.niveauDebloque = 0;
        this.etoiles = {};
        this.temps = {};
        try { localStorage.removeItem(this.key); localStorage.removeItem(this.starsKey); localStorage.removeItem(this.tempsKey); } catch(e) {}
    }
}

// ============================================================
//  SAUVEGARDE EXPORTABLE — export/import de TOUTES les données
//  du jeu (progression, étoiles, temps, scores, niveaux créés,
//  préférences). Protège contre la perte lors d'un nettoyage
//  du navigateur, et permet de migrer vers un autre appareil.
// ============================================================
export function exporterSauvegarde() {
    const data = {
        _app: 'super-carre',
        _format: 1,
        _date: new Date().toISOString()
    };
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('supercarre_')) data[k] = localStorage.getItem(k);
    }
    return JSON.stringify(data, null, 2);
}

// --- 📲 TRANSFERT ENTRE APPAREILS : sauvegarde compressée en code URL ---
async function _deflateB64(texte) {
    const flux = new Blob([texte]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = await new Response(flux).arrayBuffer();
    let bin = '';
    const oct = new Uint8Array(buf);
    for (let i = 0; i < oct.length; i++) bin += String.fromCharCode(oct[i]);
    return btoa(bin);
}
async function _inflateB64(b64) {
    const bin = atob(b64);
    const oct = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) oct[i] = bin.charCodeAt(i);
    const flux = new Blob([oct]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(flux).text();
}
// Code compact de la sauvegarde complète (PIXSAVE1.xxxx)
export async function codeSauvegarde() {
    return 'PIXSAVE1.' + await _deflateB64(exporterSauvegarde());
}
// Restaure depuis un code (ou un texte/lien le contenant). Retourne le
// nombre d'entrées importées, ou lève une erreur explicite.
export async function chargerCodeSauvegarde(texte) {
    // lien ?s=… éventuel : décoder d'abord
    const mUrl = String(texte).match(/[?&]s=([A-Za-z0-9%._~-]+)/);
    if (mUrl) { try { texte = decodeURIComponent(mUrl[1]) + ' ' + texte; } catch (e) {} }
    const m = String(texte).match(/PIXSAVE1\.([A-Za-z0-9+/=]+)/);
    if (!m) throw new Error('Aucun code de sauvegarde (PIXSAVE1.…) détecté.');
    const json = await _inflateB64(m[1]);
    return importerSauvegarde(json);
}

// Restaure une sauvegarde. Retourne le nombre d'entrées importées.
// Lève une erreur si le fichier n'est pas une sauvegarde valide.
export function importerSauvegarde(json) {
    const data = JSON.parse(json);
    if (!data || data._app !== 'super-carre') {
        throw new Error('Ce fichier n\'est pas une sauvegarde Super Pixou.');
    }
    let n = 0;
    for (const [k, v] of Object.entries(data)) {
        if (k.startsWith('supercarre_') && typeof v === 'string') {
            try { localStorage.setItem(k, v); n++; } catch(e) {}
        }
    }
    if (n === 0) throw new Error('Sauvegarde vide — rien à restaurer.');
    return n;
}

// ============================================================
//  NAME ENTRY — Sélecteur de lettres 3D intuitif (flèches par lettre + swipe)
// ============================================================
