/* BOUTIQUE DE SKINS — catalogue, portefeuille 🪙 et gestionnaire.
   Chaque pièce ramassée en partie normale (ni démo, ni test éditeur)
   alimente un portefeuille persistant. Les skins achetés modifient le
   rendu de Pixou partout dans le jeu (couleurs, chapeau, lunettes). */

export const CATALOGUE = {
    corps: [
        { id: 'rouge',  nom: 'Rouge',  prix: 0,   haut: '#FF6B5C', bas: '#E74C3C', bord: '#C0392B' },
        { id: 'bleu',   nom: 'Bleu',   prix: 60,  haut: '#5DADE2', bas: '#2E86C1', bord: '#1B4F72' },
        { id: 'vert',   nom: 'Vert',   prix: 60,  haut: '#58D68D', bas: '#28B463', bord: '#186A3B' },
        { id: 'violet', nom: 'Violet', prix: 90,  haut: '#BB8FCE', bas: '#8E44AD', bord: '#5B2C6F' },
        { id: 'rose',   nom: 'Rose',   prix: 90,  haut: '#F8BBD0', bas: '#EC5F8F', bord: '#AD1457' },
        { id: 'orange',    nom: 'Orange',    prix: 60,  haut: '#F8C471', bas: '#E67E22', bord: '#9C640C' },
        { id: 'turquoise', nom: 'Turquoise', prix: 60,  haut: '#76D7C4', bas: '#17A589', bord: '#0E6655' },
        { id: 'menthe',    nom: 'Menthe',    prix: 90,  haut: '#D5F5E3', bas: '#82E0AA', bord: '#239B56' },
        { id: 'lavande',   nom: 'Lavande',   prix: 90,  haut: '#E8DAEF', bas: '#C39BD3', bord: '#7D3C98' },
        { id: 'corail',    nom: 'Corail',    prix: 120, haut: '#FADBD8', bas: '#F1948A', bord: '#C0392B' },
        { id: 'ocean',     nom: 'Océan',     prix: 150, haut: '#85C1E9', bas: '#21618C', bord: '#0B2E4F' },
        { id: 'chocolat',  nom: 'Chocolat',  prix: 150, haut: '#D7BDA6', bas: '#8E5B3A', bord: '#4E342E' },
        { id: 'nuit',      nom: 'Nuit',      prix: 150, haut: '#5D6D7E', bas: '#2C3E50', bord: '#17202A' },
        { id: 'or',        nom: 'Or',        prix: 250, haut: '#F9E79F', bas: '#F1C40F', bord: '#B7950B' }
    ],
    studio: [
        { id: 'studio', nom: 'Studio 🌈', prix: 300, emoji: '🌈' }
    ],
    chapeau: [
        { id: 'casquette', nom: 'Casquette', prix: 0,   emoji: '🧢' },
        { id: 'aucun',     nom: 'Tête nue',  prix: 0,   emoji: '🚫' },
        { id: 'fete',      nom: 'Fête',      prix: 80,  emoji: '🥳' },
        { id: 'bandana',   nom: 'Pirate',    prix: 100, emoji: '🏴‍☠️' },
        { id: 'cowboy',    nom: 'Cowboy',    prix: 120, emoji: '🤠' },
        { id: 'magicien',  nom: 'Magicien',  prix: 120, emoji: '🎩' },
        { id: 'diplome',   nom: 'Diplômé',   prix: 150, emoji: '🎓' },
        { id: 'viking',    nom: 'Viking',    prix: 180, emoji: '⚔️' },
        { id: 'couronne',  nom: 'Couronne',  prix: 200, emoji: '👑' }
    ],
    costume: [
        { id: 'aucun',    nom: 'Aucun',        prix: 0,   emoji: '🚫' },
        { id: 'noeud',    nom: 'Nœud pap.',    prix: 80,  emoji: '🎀' },
        { id: 'echarpe',  nom: 'Écharpe',      prix: 120, emoji: '🧣' },
        { id: 'ceinture', nom: 'Karatéka',     prix: 150, emoji: '🥋' },
        { id: 'cape',     nom: 'Cape de héros', prix: 200, emoji: '🦸' },
        { id: 'sherif',   nom: 'Shérif',       prix: 100, emoji: '⭐' },
        { id: 'hawai',    nom: 'Hawaïen',      prix: 120, emoji: '🌺' },
        { id: 'sac',      nom: 'Aventurier',   prix: 150, emoji: '🎒' },
        { id: 'jetpack',  nom: 'Jetpack',      prix: 250, emoji: '🚀' }
    ],
    lunettes: [
        { id: 'aucune',  nom: 'Aucune',  prix: 0,   emoji: '🙂' },
        { id: 'rondes',  nom: 'Savant',  prix: 80,  emoji: '🤓' },
        { id: 'soleil',  nom: 'Soleil',  prix: 100, emoji: '🕶️' },
        { id: 'troisD',  nom: '3D rétro', prix: 100, emoji: '🎬' },
        { id: 'etoiles', nom: 'Star',    prix: 150, emoji: '🤩' }
    ]
};

const DEFAUTS = { corps: 'rouge', chapeau: 'casquette', lunettes: 'aucune', costume: 'aucun' };
const CUSTOM_DEFAUTS = { corps: '#E74C3C', casquette: '#16A085', pieds: '#F1C40F' };

// --- Aides couleur : éclaircir/assombrir un hex (#RRGGBB) ---
export function nuancer(hex, facteur) {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex));
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
        const r = facteur >= 0 ? v + (255 - v) * facteur : v * (1 + facteur);
        return Math.max(0, Math.min(255, Math.round(r)));
    });
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

export class SkinManager {
    constructor() {
        this.KEY = 'supercarre_skins';
        this.WALLET_KEY = 'supercarre_portefeuille';
        // premierLancement : vrai si aucun portefeuille n'existait encore
        // (permet au jeu d'offrir un bonus de bienvenue aux joueurs existants)
        this.premierLancement = localStorage.getItem(this.WALLET_KEY) === null;
        this.portefeuille = parseInt(localStorage.getItem(this.WALLET_KEY), 10) || 0;
        let d;
        try { d = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { d = {}; }
        this.possedes = new Set(Array.isArray(d.possedes) ? d.possedes : []);
        // Les articles gratuits sont toujours possédés
        for (const cat of Object.keys(CATALOGUE)) {
            for (const item of CATALOGUE[cat]) if (item.prix === 0) this.possedes.add(cat + ':' + item.id);
        }
        this.equipes = Object.assign({}, DEFAUTS, d.equipes || {});
        this.custom = Object.assign({}, CUSTOM_DEFAUTS, d.custom || {});
        // Sécurité : un équipement non possédé retombe au défaut.
        // Cas particulier : corps = 'studio' (couleur libre) est valide
        // si le Studio 🌈 est possédé.
        for (const cat of Object.keys(DEFAUTS)) {
            const ok = this.possedes.has(cat + ':' + this.equipes[cat]) ||
                (cat === 'corps' && this.equipes.corps === 'studio' && this.possedes.has('studio:studio'));
            if (!ok) this.equipes[cat] = DEFAUTS[cat];
        }
    }
    _sauver() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify({ possedes: [...this.possedes], equipes: this.equipes, custom: this.custom }));
            localStorage.setItem(this.WALLET_KEY, String(this.portefeuille));
        } catch (e) {}
    }
    solde() { return this.portefeuille; }
    crediter(n) { this.portefeuille += n; this._sauver(); }
    possede(cat, id) { return this.possedes.has(cat + ':' + id); }
    itemDe(cat, id) { return (CATALOGUE[cat] || []).find(i => i.id === id) || null; }
    // Achat : débite le portefeuille, possède ET équipe. false si fonds insuffisants.
    acheter(cat, id) {
        const item = this.itemDe(cat, id);
        if (!item || this.possede(cat, id)) return false;
        if (this.portefeuille < item.prix) return false;
        this.portefeuille -= item.prix;
        this.possedes.add(cat + ':' + id);
        this.equipes[cat] = id;
        this._sauver();
        return true;
    }
    equiper(cat, id) {
        if (!this.possede(cat, id)) return false;
        this.equipes[cat] = id;
        this._sauver();
        return true;
    }
    // 🌈 Studio : définir une couleur libre ('corps'|'casquette'|'pieds')
    definirCustom(champ, hex) {
        if (!(champ in CUSTOM_DEFAUTS) || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
        this.custom[champ] = hex;
        if (champ === 'corps') this.equipes.corps = 'studio'; // porter la couleur libre
        this._sauver();
        return true;
    }
    reinitialiserCustom() {
        this.custom = Object.assign({}, CUSTOM_DEFAUTS);
        if (this.equipes.corps === 'studio') this.equipes.corps = DEFAUTS.corps;
        this._sauver();
    }
    studioActif() { return this.possede('studio', 'studio'); }
    // Configuration de rendu appliquée à Player.skin
    config() {
        let haut, bas, bord;
        if (this.equipes.corps === 'studio' && this.studioActif()) {
            // Dégradé dérivé automatiquement de la couleur libre
            bas = this.custom.corps;
            haut = nuancer(bas, 0.28);
            bord = nuancer(bas, -0.38);
        } else {
            const corps = this.itemDe('corps', this.equipes.corps) || CATALOGUE.corps[0];
            haut = corps.haut; bas = corps.bas; bord = corps.bord;
        }
        const cfg = {
            haut, bas, bord,
            chapeau: this.equipes.chapeau,
            costume: this.equipes.costume,
            lunettes: this.equipes.lunettes
        };
        // Couleurs de tenue (casquette, pieds) — libres si le Studio est débloqué
        if (this.studioActif()) {
            cfg.casq = this.custom.casquette;
            cfg.pieds = this.custom.pieds;
        }
        return cfg;
    }
}
