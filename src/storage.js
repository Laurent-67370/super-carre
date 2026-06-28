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
        this.nbNiveaux = nbNiveaux;
        this.niveauDebloque = this.charger(); // index 0-based du plus haut niveau atteint
        this.etoiles = this.chargerEtoiles(); // {idxNiveau: nbEtoiles}
    }
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
        try { localStorage.removeItem(this.key); localStorage.removeItem(this.starsKey); } catch(e) {}
    }
}

// ============================================================
//  NAME ENTRY — Sélecteur de lettres 3D intuitif (flèches par lettre + swipe)
// ============================================================
