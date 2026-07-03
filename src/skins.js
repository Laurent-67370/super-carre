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
        { id: 'nuit',   nom: 'Nuit',   prix: 150, haut: '#5D6D7E', bas: '#2C3E50', bord: '#17202A' },
        { id: 'or',     nom: 'Or',     prix: 250, haut: '#F9E79F', bas: '#F1C40F', bord: '#B7950B' }
    ],
    chapeau: [
        { id: 'casquette', nom: 'Casquette', prix: 0,   emoji: '🧢' },
        { id: 'aucun',     nom: 'Tête nue',  prix: 0,   emoji: '🚫' },
        { id: 'fete',      nom: 'Fête',      prix: 80,  emoji: '🥳' },
        { id: 'magicien',  nom: 'Magicien',  prix: 120, emoji: '🎩' },
        { id: 'couronne',  nom: 'Couronne',  prix: 200, emoji: '👑' }
    ],
    lunettes: [
        { id: 'aucune', nom: 'Aucune', prix: 0,   emoji: '🙂' },
        { id: 'soleil', nom: 'Soleil', prix: 100, emoji: '🕶️' }
    ]
};

const DEFAUTS = { corps: 'rouge', chapeau: 'casquette', lunettes: 'aucune' };

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
        // Sécurité : un équipement non possédé retombe au défaut
        for (const cat of Object.keys(DEFAUTS)) {
            if (!this.possedes.has(cat + ':' + this.equipes[cat])) this.equipes[cat] = DEFAUTS[cat];
        }
    }
    _sauver() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify({ possedes: [...this.possedes], equipes: this.equipes }));
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
    // Configuration de rendu appliquée à Player.skin
    config() {
        const corps = this.itemDe('corps', this.equipes.corps) || CATALOGUE.corps[0];
        return {
            haut: corps.haut, bas: corps.bas, bord: corps.bord,
            chapeau: this.equipes.chapeau,
            lunettes: this.equipes.lunettes === 'soleil'
        };
    }
}
