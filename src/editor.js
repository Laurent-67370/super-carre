import { Game } from './game.js';
import { Platform, MovingPlatform, Spike, Ennemi, EnnemiVolant, EnnemiSaut, Coin, Ressort, PowerUp } from './entities.js';
import { Player } from './player.js';
import { FONDS } from './levels.js';
import { signaler } from './succes.js';
import { DemoBot } from './demo.js';
import { setupControls } from './controls.js';
/* LevelEditor — éditeur de niveaux */

export class LevelEditor {
    constructor(game) {
        this.game = game;
        this.scr = document.getElementById('editor-screen');
        this.canvas = document.getElementById('ed-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.GRID = 10;          // pas de la grille / snap
        this.outil = 'select';   // outil actif
        this.selection = null;   // objet sélectionné
        this.modele = this.modeleVide();
        this.cam = { x: 0, y: 0, zoom: 1 };
        this.STORE_KEY = 'supercarre_editor_levels';
        // --- Historique Undo/Redo ---
        this._hist = [];          // pile d'états passés
        this._histFutur = [];     // pile d'états futurs (pour redo)
        this._HIST_MAX = 50;      // profondeur max
        this._initUI();
        this._initPointer();
        this._snapshot();         // état initial
    }

    modeleVide() {
        return {
            nom: 'Mon niveau',
            largeurMonde: 800, hauteurMonde: 600, fond: 'jour',
            spawn: { x: 60, y: 480 },
            objets: []  // {type, x, y, w, h, dist, vit}  (type: sol/herbe/mur/mobileH/mobileV/coin/ennemi/spike/ressort/puDouble/puShield/puSpeed)
        };
    }

    // ---------- Génération aléatoire de niveaux JOUABLES ----------
    // Construit un parcours de plateformes toujours atteignables (physique réelle :
    // saut ~95px de haut, ~120px de portée), puis décore avec pièces, dangers
    // évitables et power-ups. Valide le résultat ; régénère si besoin.
    genererAleatoire(diff, alea = Math.random) {
        const SAUT_H = 95, SAUT_W = 120, JL = 30;
        const rnd = (a, b) => a + alea() * (b - a);
        const ri = (a, b) => Math.floor(rnd(a, b + 1));
        const ch = (arr) => arr[Math.floor(alea() * arr.length)];
        const D = {
            doux:      { dangers: 0.10, ennemis: 0.15, mobiles: 0.10, powerups: 2 },
            equilibre: { dangers: 0.22, ennemis: 0.30, mobiles: 0.20, powerups: 2 },
            intense:   { dangers: 0.38, ennemis: 0.45, mobiles: 0.30, powerups: 1 }
        }[diff] || { dangers: 0.22, ennemis: 0.30, mobiles: 0.20, powerups: 2 };

        const construire = () => {
            const vertical = alea() < 0.5;
            const objets = [];
            let mondeW, mondeH, spawn;
            const chemin = [];

            if (vertical) {
                mondeW = 800; mondeH = ri(900, 1300);
                objets.push({ type: 'sol', x: 0, y: mondeH - 40, w: mondeW, h: 40 });
                objets.push({ type: 'mur', x: 0, y: 0, w: 20, h: mondeH - 40 });
                objets.push({ type: 'mur', x: mondeW - 20, y: 0, w: 20, h: mondeH - 40 });
                let cx = ri(60, 200), cy = mondeH - 110, cw = ri(100, 140);
                chemin.push({ x: cx, y: cy, w: cw });
                spawn = { x: cx + 20, y: cy - JL };
                while (cy > 160) {
                    const ny = cy - ri(60, SAUT_H), w = ri(90, 140);
                    let nx = cx + ri(-SAUT_W, SAUT_W);
                    nx = Math.max(40, Math.min(mondeW - 40 - w, nx));
                    chemin.push({ x: nx, y: ny, w }); cx = nx; cy = ny; cw = w;
                }
            } else {
                mondeW = ri(1200, 2000); mondeH = 600;
                objets.push({ type: 'mur', x: 0, y: 0, w: 20, h: 560 });
                objets.push({ type: 'mur', x: mondeW - 20, y: 0, w: 20, h: 560 });
                let cx = 30, cy = 470, cw = ri(120, 180);
                objets.push({ type: 'sol', x: 0, y: 560, w: cw + 40, h: 40 });
                chemin.push({ x: cx, y: cy, w: cw });
                spawn = { x: 60, y: cy - JL };
                while (cx < mondeW - 200) {
                    const nx = cx + cw + ri(70, SAUT_W);
                    if (nx > mondeW - 120) break;
                    const w = ri(80, 140);
                    let ny = cy + ri(-SAUT_H, SAUT_H);
                    ny = Math.max(180, Math.min(500, ny));
                    chemin.push({ x: nx, y: ny, w }); cx = nx; cy = ny; cw = w;
                }
                objets.push({ type: 'sol', x: mondeW - 160, y: 560, w: 160, h: 40 });
            }

            // plateformes du chemin (certaines deviennent mobiles)
            const nbMob = Math.round(chemin.length * D.mobiles);
            const mobIdx = new Set();
            for (let k = 0; k < nbMob; k++) mobIdx.add(ri(1, Math.max(1, chemin.length - 2)));
            chemin.forEach((p, i) => {
                if (mobIdx.has(i) && i > 0 && i < chemin.length - 1) {
                    const axe = alea() < 0.5 ? 'mobileH' : 'mobileV';
                    objets.push({ type: axe, x: p.x, y: p.y, w: Math.min(p.w, 90), h: 16, dist: ri(45, 80), vit: +rnd(2, 3).toFixed(1) });
                } else {
                    objets.push({ type: 'herbe', x: p.x, y: p.y, w: p.w, h: 18 });
                }
            });

            // pièces au-dessus de chaque plateforme
            chemin.forEach(p => objets.push({ type: 'coin', x: Math.round(p.x + p.w / 2 - 8), y: Math.round(p.y - ri(35, 55)) }));

            // dangers (pics) évitables
            if (!vertical) {
                for (let i = 0; i < chemin.length - 1; i++) {
                    if (alea() < D.dangers) {
                        const a = chemin[i], b = chemin[i + 1];
                        const gx = a.x + a.w + 5, gw = Math.max(0, b.x - gx - 5);
                        if (gw >= 30) objets.push({ type: 'spike', x: Math.round(gx), y: 540, w: Math.min(gw, 100) });
                    }
                }
            } else {
                const nb = Math.round(D.dangers * 5), placed = [];
                for (let k = 0; k < nb; k++) {
                    const w = ri(50, 90); let x, e = 0, ok = false;
                    do { x = ri(40, mondeW - 60 - w); ok = placed.every(px => Math.abs(px - x) > w + 130); e++; } while (!ok && e < 12);
                    if (ok) { objets.push({ type: 'spike', x, y: mondeH - 60, w }); placed.push(x); }
                }
            }

            // ennemis sur plateformes (esquivables/écrasables)
            chemin.forEach((p, i) => {
                if (i > 0 && i < chemin.length - 1 && alea() < D.ennemis && p.w >= 90 && !mobIdx.has(i)) {
                    const dist = Math.max(20, Math.min(Math.round(p.w / 2) - 10, 60));
                    objets.push({ type: 'ennemi', x: Math.round(p.x + p.w / 2), y: Math.round(p.y - 28), dist, vit: +rnd(0.7, 1.2).toFixed(1) });
                }
            });

            // ressort de fin + power-ups
            const last = chemin[chemin.length - 1];
            objets.push({ type: 'ressort', x: Math.round(last.x + last.w / 2 - 14), y: Math.round(last.y - 14) });
            const milieu = chemin.slice(1, -1).length ? chemin.slice(1, -1) : chemin;
            const tPU = ['puDouble', 'puShield', 'puSpeed'];
            for (let k = 0; k < D.powerups; k++) {
                const p = ch(milieu);
                objets.push({ type: ch(tPU), x: Math.round(p.x + p.w / 2 - 10), y: Math.round(p.y - 40) });
            }

            return { nom: (vertical ? 'Ascension' : 'Course') + ' aléatoire', largeurMonde: mondeW, hauteurMonde: mondeH, spawn, objets, _vertical: vertical, _chemin: chemin };
        };

        const valide = (m) => {
            const W = m.largeurMonde, H = m.hauteurMonde;
            const plats = m.objets.filter(o => o.type === 'herbe' || o.type === 'sol' || o.type === 'mobileH' || o.type === 'mobileV').map(o => ({ x: o.x, y: o.y, r: o.x + o.w, w: o.w }));
            const s = m.spawn;
            if (!plats.some(p => s.x + JL > p.x && s.x < p.r && p.y >= s.y && p.y <= s.y + JL + 100)) return false;
            if (m.objets.some(o => o.x < 0 || o.x > W || o.y < 0 || o.y > H)) return false;
            for (let i = 1; i < m._chemin.length; i++) {
                const a = m._chemin[i - 1], b = m._chemin[i];
                const dyOK = Math.abs(b.y - a.y) <= SAUT_H + 5 || b.y > a.y;
                const gapX = Math.max(0, Math.max(a.x - b.x - b.w, b.x - a.x - a.w));
                if (!(dyOK && gapX <= SAUT_W + 5)) return false;
            }
            const coins = m.objets.filter(o => o.type === 'coin');
            for (const c of coins) {
                if (!plats.some(p => c.x >= p.x - SAUT_W && c.x <= p.r + SAUT_W && c.y <= p.y && c.y >= p.y - SAUT_H - 50)) return false;
            }
            return true;
        };

        // Générer jusqu'à obtenir un niveau valide (quasi toujours du 1er coup)
        let m, essais = 0;
        do { m = construire(); essais++; } while (!valide(m) && essais < 30);
        delete m._vertical; delete m._chemin;
        return m;
    }

    ouvrir() {
        this.scr.classList.add('show');
        document.getElementById('start-screen').style.display = 'none';
        // Charger les dimensions par défaut dans les champs
        document.getElementById('ed-world-w').value = this.modele.largeurMonde;
        document.getElementById('ed-world-h').value = this.modele.hauteurMonde;
        document.getElementById('ed-name').value = this.modele.nom;
        this.resize();
        this.fit();
        this.dessiner();
    }
    fermer() {
        this.scr.classList.remove('show');
        document.getElementById('start-screen').style.display = 'flex';
        if (this.game._rafraichirMenu) this.game._rafraichirMenu();
    }

    // ---------- Géométrie d'un objet (dimensions par défaut selon le type) ----------
    dimsDefaut(type) {
        switch (type) {
            case 'sol':     return { w: 200, h: 40 };
            case 'herbe':   return { w: 100, h: 20 };
            case 'mur':     return { w: 20,  h: 200 };
            case 'mobileH': return { w: 80,  h: 16, dist: 80, vit: 2 };
            case 'mobileV': return { w: 80,  h: 16, dist: 60, vit: 2 };
            case 'spike':   return { w: 40,  h: 20 };
            case 'ressort': return { w: 36,  h: 14 };
            case 'coin':    return { w: 20,  h: 20 };
            case 'ennemi':  return { w: 28,  h: 28, dist: 80, vit: 1 };
            case 'ennemiVol':  return { w: 26, h: 22, dist: 120, vit: 1 };
            case 'ennemiSaut': return { w: 28, h: 28, dist: 0, vit: 1 };
            case 'checkpoint': return { w: 30, h: 44 };
            default:        return { w: 28,  h: 28 }; // power-ups
        }
    }
    // Boîte englobante d'un objet (pour collision/affichage)
    bbox(o) {
        if (o.type === 'coin' || o.type.startsWith('pu')) return { x: o.x - 14, y: o.y - 14, w: 28, h: 28 };
        if (o.type === 'ennemi') return { x: o.x - 16, y: o.y - 4, w: 32, h: 32 };
        if (o.type === 'ennemiVol') return { x: o.x - 16, y: o.y - 6, w: 32, h: 32 };
        if (o.type === 'ennemiSaut') return { x: o.x - 16, y: o.y - 4, w: 32, h: 32 };
        if (o.type === 'spike') return { x: o.x, y: o.y, w: o.w || 40, h: 20 };
        if (o.type === 'ressort') return { x: o.x - 4, y: o.y - 4, w: 36, h: 28 };
        return { x: o.x, y: o.y, w: o.w, h: o.h };
    }

    // ---------- Conversion écran <-> monde ----------
    versMonde(sx, sy) {
        return { x: (sx - this.cam.x) / this.cam.zoom, y: (sy - this.cam.y) / this.cam.zoom };
    }
    snap(v) { return Math.round(v / this.GRID) * this.GRID; }

    resize() {
        const wrap = document.getElementById('ed-canvas-wrap');
        const r = wrap.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.cssW = r.width; this.cssH = r.height;
        this.canvas.width = Math.round(r.width * dpr);
        this.canvas.height = Math.round(r.height * dpr);
        this.canvas.style.width = r.width + 'px';
        this.canvas.style.height = r.height + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Ajuste le zoom pour voir tout le monde
    fit() {
        const m = 30;
        const zx = (this.cssW - m) / this.modele.largeurMonde;
        const zy = (this.cssH - m) / this.modele.hauteurMonde;
        this.cam.zoom = Math.min(zx, zy, 1.5);
        this.cam.x = (this.cssW - this.modele.largeurMonde * this.cam.zoom) / 2;
        this.cam.y = (this.cssH - this.modele.hauteurMonde * this.cam.zoom) / 2;
    }

    // ---------- Sélection : trouve l'objet sous un point monde ----------
    objetSous(mx, my) {
        // Du dernier au premier (z-order : derniers placés au-dessus)
        for (let i = this.modele.objets.length - 1; i >= 0; i--) {
            const o = this.modele.objets[i];
            const b = this.bbox(o);
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) return o;
        }
        return null;
    }
    // Poignée de redimensionnement sous le point (coin bas-droit), si objet redimensionnable
    poigneeSous(mx, my, o) {
        if (!o || o.type === 'coin' || o.type.startsWith('pu') || o.type === 'ressort') return false;
        const b = this.bbox(o);
        const hx = b.x + b.w, hy = b.y + b.h;
        const t = 14 / this.cam.zoom;
        return Math.abs(mx - hx) < t && Math.abs(my - hy) < t;
    }

    // ---------- Placement d'un nouvel objet ----------
    placer(mx, my) {
        if (this.outil === 'spawn') {
            this.modele.spawn = { x: this.snap(mx), y: this.snap(my) };
            this._snapshot(); this.dessiner(); return;
        }
        const d = this.dimsDefaut(this.outil);
        const o = { type: this.outil, x: this.snap(mx - (d.w || 0) / 2), y: this.snap(my - (d.h || 0) / 2), ...d };
        // pièces / powerups : on stocke le centre
        if (this.outil === 'coin' || this.outil.startsWith('pu')) { o.x = this.snap(mx); o.y = this.snap(my); }
        // ennemi : posé par son coin
        // checkpoint : unique — poser un nouveau retire l'ancien
        if (this.outil === 'checkpoint') {
            this.modele.objets = this.modele.objets.filter(ob => ob.type !== 'checkpoint');
        }
        this.modele.objets.push(o);
        this.selection = (this.outil === 'select') ? o : null;
        this._snapshot(); this.dessiner();
    }
    dupliquerSelection() {
        if (!this.selection) return;
        const copie = JSON.parse(JSON.stringify(this.selection));
        copie.x = Math.min(copie.x + 24, this.modele.largeurMonde - 20);
        copie.y = Math.min(copie.y + 18, this.modele.hauteurMonde - 20);
        if (copie.type === 'checkpoint') this.modele.objets = this.modele.objets.filter(ob => ob.type !== 'checkpoint');
        this.modele.objets.push(copie);
        this.selection = copie;
        this._snapshot(); this.majProps(); this.dessiner();
    }
    effacerSous(mx, my) {
        const o = this.objetSous(mx, my);
        if (o) {
            this.modele.objets.splice(this.modele.objets.indexOf(o), 1);
            if (this.selection === o) this.deselectionner();
            this._snapshot(); this.dessiner();
        }
    }

    // ---------- Undo / Redo ----------
    _snapshot() {
        // Sauvegarde une copie profonde de l'état courant
        this._hist.push(JSON.stringify(this.modele));
        if (this._hist.length > this._HIST_MAX) this._hist.shift();
        this._histFutur = []; // toute nouvelle action vide le futur
    }
    undo() {
        if (this._hist.length < 2) return; // au moins l'état initial + 1
        this._histFutur.push(this._hist.pop()); // déplace courant vers futur
        const prev = this._hist[this._hist.length - 1];
        this.modele = JSON.parse(prev);
        this.selection = null;
        document.getElementById('ed-props').classList.add('hidden');
        this.fit(); this.dessiner();
    }
    redo() {
        if (this._histFutur.length === 0) return;
        const state = this._histFutur.pop();
        this._hist.push(state);
        this.modele = JSON.parse(state);
        this.selection = null;
        document.getElementById('ed-props').classList.add('hidden');
        this.fit(); this.dessiner();
    }

    // ---------- Rendu ----------
    dessiner() {
        const ctx = this.ctx, c = this.cam;
        ctx.clearRect(0, 0, this.cssW, this.cssH);
        ctx.save();
        ctx.translate(c.x, c.y); ctx.scale(c.zoom, c.zoom);
        // Fond du monde : aperçu du 🎨 fond choisi
        const f = FONDS[this.modele.fond] || FONDS.jour;
        const gradFond = ctx.createLinearGradient(0, 0, 0, this.modele.hauteurMonde);
        gradFond.addColorStop(0, f.haut); gradFond.addColorStop(1, f.bas);
        ctx.fillStyle = gradFond;
        ctx.fillRect(0, 0, this.modele.largeurMonde, this.modele.hauteurMonde);
        // Grille
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1 / c.zoom;
        const step = 50;
        ctx.beginPath();
        for (let x = 0; x <= this.modele.largeurMonde; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, this.modele.hauteurMonde); }
        for (let y = 0; y <= this.modele.hauteurMonde; y += step) { ctx.moveTo(0, y); ctx.lineTo(this.modele.largeurMonde, y); }
        ctx.stroke();
        // Bordure du monde
        ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2 / c.zoom;
        ctx.strokeRect(0, 0, this.modele.largeurMonde, this.modele.hauteurMonde);

        // Objets
        for (const o of this.modele.objets) this.dessinerObjet(ctx, o);
        // 🤖 pièces jugées inaccessibles : halo rouge clignotant (6 s)
        if (this._piecesRatees && Date.now() < this._rateesJusqua) {
            const pulse = 0.5 + Math.sin(Date.now() / 160) * 0.4;
            ctx.strokeStyle = `rgba(231,76,60,${pulse})`;
            ctx.lineWidth = 3;
            for (const p of this._piecesRatees) {
                ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, 6.28); ctx.stroke();
            }
            requestAnimationFrame(() => this.dessiner());
        } else { this._piecesRatees = null; }

        // Spawn
        const s = this.modele.spawn;
        ctx.fillStyle = '#5BDE60';
        ctx.fillRect(s.x, s.y, 30, 30);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 / c.zoom; ctx.strokeRect(s.x, s.y, 30, 30);
        ctx.fillStyle = '#fff'; ctx.font = `${14/c.zoom}px Arial`; ctx.textAlign = 'center';
        ctx.fillText('🚩', s.x + 15, s.y - 6 / c.zoom);

        // Surbrillance sélection + poignée
        if (this.selection) {
            const b = this.bbox(this.selection);
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2 / c.zoom;
            ctx.setLineDash([6 / c.zoom, 4 / c.zoom]);
            ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
            ctx.setLineDash([]);
            if (!(this.selection.type === 'coin' || this.selection.type.startsWith('pu') || this.selection.type === 'ressort')) {
                ctx.fillStyle = '#FFD700';
                const hs = 9 / c.zoom;
                ctx.fillRect(b.x + b.w - hs/2, b.y + b.h - hs/2, hs, hs);
            }
        }
        ctx.restore();
    }
    dessinerObjet(ctx, o) {
        if (o.type === 'checkpoint') {
            const bx = o.x, by = o.y;
            ctx.strokeStyle = '#ECF0F1'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(bx + 6, by); ctx.lineTo(bx + 6, by + 44); ctx.stroke();
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath(); ctx.moveTo(bx + 8, by + 2); ctx.lineTo(bx + 30, by + 9); ctx.lineTo(bx + 8, by + 17); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(bx + 9, by + 4, 5, 5);
            ctx.fillRect(bx + 16, by + 8, 5, 5);
            ctx.fillStyle = '#95A5A6';
            ctx.fillRect(bx + 2, by + 42, 9, 4);
            return;
        }
        const couleurs = {
            sol:'#8B4513', herbe:'#228B22', mur:'#6B4226',
            mobileH:'#8E44AD', mobileV:'#8E44AD', spike:'#C0392B',
            ressort:'#E74C3C', coin:'#FFD700', ennemi:'#9B59B6',
            ennemiVol:'#F39C12', ennemiSaut:'#1ABC9C',
            puDouble:'#3498DB', puShield:'#F1C40F', puSpeed:'#E67E22'
        };
        ctx.fillStyle = couleurs[o.type] || '#fff';
        if (o.type === 'coin' || o.type.startsWith('pu')) {
            ctx.beginPath(); ctx.arc(o.x, o.y, 12, 0, 6.28); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 / this.cam.zoom; ctx.stroke();
            const lbl = { coin:'$', puDouble:'JS', puShield:'BD', puSpeed:'VT' }[o.type] || '';
            ctx.fillStyle = '#000'; ctx.font = `bold ${9/this.cam.zoom}px Arial`; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(lbl, o.x, o.y);
            ctx.textBaseline = 'alphabetic';
        } else if (o.type === 'spike') {
            const n = Math.max(1, Math.floor(o.w / 10));
            for (let i = 0; i < n; i++) {
                ctx.beginPath();
                ctx.moveTo(o.x + i*10, o.y + o.h); ctx.lineTo(o.x + i*10 + 5, o.y); ctx.lineTo(o.x + i*10 + 10, o.y + o.h);
                ctx.closePath(); ctx.fill();
            }
        } else {
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1 / this.cam.zoom;
            ctx.strokeRect(o.x, o.y, o.w, o.h);
            if (o.type === 'mobileH' || o.type === 'mobileV') {
                // flèche de direction + amplitude
                ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2 / this.cam.zoom;
                ctx.beginPath();
                const cx = o.x + o.w/2, cy = o.y + o.h/2;
                if (o.type === 'mobileH') { ctx.moveTo(cx - o.dist/2, cy); ctx.lineTo(cx + o.dist/2, cy); }
                else { ctx.moveTo(cx, cy - o.dist/2); ctx.lineTo(cx, cy + o.dist/2); }
                ctx.stroke();
            }
        }
    }

    // ---------- Propriétés ----------
    selectionner(o) {
        this.selection = o;
        const panel = document.getElementById('ed-props');
        panel.classList.remove('hidden');
        const nom = { sol:'Sol', herbe:'Plateforme', mur:'Mur', mobileH:'Plate. mobile ↔', mobileV:'Plate. mobile ↕', spike:'Pics', ressort:'Ressort', coin:'Pièce', ennemi:'Ennemi patrouilleur', ennemiVol:'Ennemi volant 🐝', ennemiSaut:'Ennemi sauteur 🦘', puDouble:'Power-up saut', puShield:'Power-up bouclier', puSpeed:'Power-up vitesse' }[o.type] || o.type;
        document.getElementById('ed-props-label').textContent = nom;
        const rowSize = document.getElementById('ed-props-size');
        const rowMove = document.getElementById('ed-props-move');
        const redimensionnable = !(o.type === 'coin' || o.type.startsWith('pu') || o.type === 'ressort' || o.type.startsWith('ennemi'));
        rowSize.classList.toggle('hidden', !redimensionnable);
        if (redimensionnable) {
            document.getElementById('ed-prop-w').value = o.w;
            document.getElementById('ed-prop-h').value = o.h;
        }
        const mobile = (o.type === 'mobileH' || o.type === 'mobileV' || o.type === 'ennemi' || o.type === 'ennemiVol' || o.type === 'ennemiSaut');
        rowMove.classList.toggle('hidden', !mobile);
        if (mobile) {
            document.getElementById('ed-prop-dist').value = o.dist;
            document.getElementById('ed-prop-vit').value = o.vit;
        }
        this.dessiner();
    }
    deselectionner() {
        this.selection = null;
        document.getElementById('ed-props').classList.add('hidden');
        this.dessiner();
    }

    // ---------- Conversion modèle -> objets de jeu instanciés ----------
    construireData(modele = this.modele) {
        const niveau = [], pieces = [], ennemis = [], pics = [], ressorts = [], powerups = [];
        for (const o of modele.objets) {
            // Sécuriser les propriétés numériques (NaN → crash)
            const dist = Math.max(0, o.dist || 0);
            const vit = Math.max(0.1, o.vit || 1);
            switch (o.type) {
                case 'sol':   niveau.push(new Platform(o.x,o.y,Math.max(10,o.w||100),Math.max(10,o.h||40),'#8B4513','sol')); break;
                case 'herbe': niveau.push(new Platform(o.x,o.y,Math.max(10,o.w||100),Math.max(10,o.h||20),'#228B22','herbe')); break;
                case 'mur':   niveau.push(new Platform(o.x,o.y,Math.max(10,o.w||20),Math.max(10,o.h||200),'#6B4226','mur')); break;
                case 'mobileH': niveau.push(new MovingPlatform(o.x,o.y,Math.max(10,o.w||80),Math.max(10,o.h||16),'h',dist,vit/100)); break;
                case 'mobileV': niveau.push(new MovingPlatform(o.x,o.y,Math.max(10,o.w||80),Math.max(10,o.h||16),'v',dist,vit/100)); break;
                case 'coin':  pieces.push(new Coin(o.x,o.y)); break;
                case 'ennemi':ennemis.push(new Ennemi(o.x,o.y,dist,vit)); break;
                case 'ennemiVol':ennemis.push(new EnnemiVolant(o.x,o.y,dist,vit)); break;
                case 'ennemiSaut':ennemis.push(new EnnemiSaut(o.x,o.y,dist,vit)); break;
                case 'spike': pics.push(new Spike(o.x,o.y,Math.max(10,o.w||40))); break;
                case 'ressort':ressorts.push(new Ressort(o.x,o.y)); break;
                case 'puDouble':powerups.push(new PowerUp(o.x,o.y,'doublejump')); break;
                case 'puShield':powerups.push(new PowerUp(o.x,o.y,'shield')); break;
                case 'puSpeed': powerups.push(new PowerUp(o.x,o.y,'speed')); break;
            }
        }
        // Checkpoint manuel éventuel (drapeau 🏁 posé dans l'éditeur)
        const cp = modele.objets.find(o => o.type === 'checkpoint');
        const checkpointPos = cp ? { x: cp.x + 15, y: cp.y + 22 } : null;
        return { niveau, pieces, ennemis, pics, ressorts, powerups, checkpointPos };
    }

    // ---------- 🤖 Vérification par le bot de démo ----------
    // Simulation accélérée (jusqu'à 90 s de jeu, sans rendu) : le pilote
    // automatique tente de ramasser toutes les pièces. Résultat pur,
    // testable hors navigateur.
    _simulerBot(data, mondeW, mondeH, spawn, maxSecondes = 90) {
        const player = new Player(spawn.x, spawn.y);
        player.checkpointX = spawn.x; player.checkpointY = spawn.y;
        player.mondeW = mondeW; player.mondeH = mondeH;
        const jeu = {
            player, touches: { left: false, right: false, jump: false },
            pieces: data.pieces, ennemis: data.ennemis, niveau: data.niveau,
            pics: data.pics, ressorts: data.ressorts, boss: null
        };
        const bot = new DemoBot();
        const audioMuet = new Proxy({}, { get: () => () => {} });
        let collectees = 0, frames = 0, degats = 0;
        const maxFrames = 60 * maxSecondes;
        while (frames < maxFrames && collectees < data.pieces.length) {
            frames++;
            for (const p of data.niveau) if (p.update && p.axe) p.update();
            for (const e of data.ennemis) e.update(player);
            for (const r of data.ressorts) {
                r.update();
                if (r.testerRebond(player)) {
                    player.vy = r.force; player.onGround = false;
                    player.sauteEncore = false; player.dejaDoubleJump = false;
                }
            }
            bot.piloter(jeu);
            const res = player.update(jeu.touches, audioMuet, data.niveau, data.ennemis, data.pics);
            if (res === 'degat' || res === 'trou') {
                degats++;
                player.x = player.checkpointX; player.y = player.checkpointY;
                player.vx = 0; player.vy = 0; player.mort = false; player.invincible = 60;
            }
            for (const c of data.pieces) if (!c.collectee && c.testerCollecte(player)) collectees++;
        }
        return {
            collectees, total: data.pieces.length, degats,
            temps: frames / 60,
            ratees: data.pieces.filter(c => !c.collectee).map(c => ({ x: c.x, y: c.y }))
        };
    }
    verifierBot() {
        const probs = this.valider();
        if (probs.length) { alert('⚠️ ' + probs.join('\n')); return; }
        const data = this.construireData();
        const m = this.modele;
        const r = this._simulerBot(data, m.largeurMonde, m.hauteurMonde, m.spawn);
        if (r.collectees === r.total) {
            this._piecesRatees = null;
            signaler('bot_valide');
            alert(`🤖 Niveau validé !\n\n✅ ${r.total}/${r.total} pièces ramassées en ${r.temps.toFixed(1)} s` +
                  (r.degats ? `\n💥 ${r.degats} dégât(s) en route — un joueur prudent fera mieux` : '\n✨ Sans le moindre dégât'));
        } else {
            // Surligner 6 s les pièces que le bot n'a pas atteintes
            this._piecesRatees = r.ratees;
            this._rateesJusqua = Date.now() + 6000;
            this.dessiner();
            alert(`🤖 Vérification : ${r.collectees}/${r.total} pièces en ${r.temps.toFixed(0)} s.\n\n⚠️ ${r.ratees.length} pièce(s) peut-être inaccessibles — elles clignotent en rouge.\nAjoute une plateforme ou un ressort, ou rapproche-les.\n(Le bot est bon mais pas parfait : un passage très acrobatique peut le dépasser.)`);
        }
    }

    // ---------- Validation rapide ----------
    valider() {
        const probs = [];
        const piecesCount = this.modele.objets.filter(o => o.type === 'coin').length;
        if (piecesCount === 0) probs.push('Ajoute au moins une pièce 🪙 (sinon le niveau ne peut pas être gagné).');
        const sols = this.modele.objets.filter(o => o.type === 'sol' || o.type === 'herbe');
        if (sols.length === 0) probs.push('Ajoute au moins une plateforme ou un sol.');
        const s = this.modele.spawn;
        if (s.x < 0 || s.x > this.modele.largeurMonde || s.y < 0 || s.y > this.modele.hauteurMonde) probs.push('Le point de départ 🚩 est hors du monde.');
        // Vérifier que le spawn n'est pas DANS un objet solide
        const spawnBox = { x: s.x, y: s.y, w: 30, h: 30 };
        for (const o of this.modele.objets) {
            if (o.type === 'sol' || o.type === 'herbe' || o.type === 'mur' || o.type === 'mobileH' || o.type === 'mobileV') {
                const b = this.bbox(o);
                if (spawnBox.x < b.x + b.w && spawnBox.x + spawnBox.w > b.x &&
                    spawnBox.y < b.y + b.h && spawnBox.y + spawnBox.h > b.y) {
                    probs.push('Le point de départ 🚩 est bloqué DANS une plateforme. Déplace-le dans un espace vide.');
                    break;
                }
            }
        }
        // Vérifier qu'il y a une plateforme SOUS le spawn (sinon chute immédiate)
        let solSousSpawn = false;
        for (const o of this.modele.objets) {
            if (o.type === 'sol' || o.type === 'herbe') {
                const b = this.bbox(o);
                if (s.x + 15 >= b.x && s.x + 15 <= b.x + b.w && s.y + 30 >= b.y - 5 && s.y + 30 <= b.y + b.h + 60) {
                    solSousSpawn = true; break;
                }
            }
        }
        if (!solSousSpawn && probs.length === 0) {
            probs.push('⚠️ Pas de plateforme sous le point de départ 🚩 — tu vas tomber immédiatement !');
        }
        // Avertissement pour objets hors-monde (pas bloquant, juste informatif)
        let horsMonde = 0;
        for (const o of this.modele.objets) {
            const b = this.bbox(o);
            if (b.x + b.w < 0 || b.x > this.modele.largeurMonde || b.y + b.h < 0 || b.y > this.modele.hauteurMonde) horsMonde++;
        }
        if (horsMonde > 0) probs.push(`${horsMonde} objet(s) sont hors des limites du monde.`);
        return probs;
    }

    // ---------- Test : jouer le niveau ----------
    tester() {
        const probs = this.valider();
        if (probs.length) { alert('⚠️ ' + probs.join('\n')); return; }
        const data = this.construireData();
        const gw = document.getElementById('game-wrapper');
        const banner = document.getElementById('ed-test-banner');
        // Préparer le moteur en mode test
        this.game.vies = 5; this.game.scoreCumul = 0; this.game.piecesTotal = 0; this.game.prochainPalierScore = 5000;
        this.game.scoreTotal = 0; this.game.tempsTotal = 0; this.game.niveauActuel = 0;
        this.game._onTestFini = (reussi) => {
            this.game.etat = 'paused'; // fige la simulation pendant l'affichage du résultat
            document.getElementById('ed-test-msg').textContent = reussi ? '✅ Niveau réussi !' : '💀 Perdu — réessaie';
            banner.classList.remove('hidden');
        };
        // Afficher le jeu par-dessus l'éditeur
        gw.style.display = 'flex';
        this.scr.style.zIndex = '70'; gw.style.zIndex = '80';
        this.game.configurerCanvas();
        if (!this.game._controlesInstalles) { setupControls(this.game); this.game._controlesInstalles = true; }
        this.game.audio.init(); this.game.audio.resume();
        banner.classList.add('hidden');
        this.game.chargerNiveauData(data, this.modele.largeurMonde, this.modele.hauteurMonde, this.modele.spawn, this.modele.fond);
        // Démarrer la boucle de jeu si ce n'est pas déjà fait
        if (!this.game._boucleLancee) { this.game._boucleLancee = true; this.game._lastTime = undefined; this.game._accumulateur = 0; requestAnimationFrame((t) => this.game.boucle(t)); }
    }
    finTest() {
        this.game.etat = 'menu';
        const gw = document.getElementById('game-wrapper');
        gw.style.display = 'none';
        gw.style.zIndex = ''; this.scr.style.zIndex = '';
        document.getElementById('ed-test-banner').classList.add('hidden');
        this.game.modeTest = false;
        this.game._onTestFini = null;
        this.resize(); this.dessiner();
    }

    // ---------- Export JS ----------
    exporter() {
        const m = this.modele;
        const q = (n) => Math.round(n);
        const parts = [];
        for (const o of m.objets) {
            switch (o.type) {
                case 'sol':   parts.push(`new Platform(${q(o.x)},${q(o.y)},${q(o.w)},${q(o.h)},'#8B4513','sol')`); break;
                case 'herbe': parts.push(`new Platform(${q(o.x)},${q(o.y)},${q(o.w)},${q(o.h)},'#228B22','herbe')`); break;
                case 'mur':   parts.push(`new Platform(${q(o.x)},${q(o.y)},${q(o.w)},${q(o.h)},'#6B4226','mur')`); break;
                case 'mobileH': parts.push(`new MovingPlatform(${q(o.x)},${q(o.y)},${q(o.w)},${q(o.h)},'h',${q(o.dist)},${o.vit/100})`); break;
                case 'mobileV': parts.push(`new MovingPlatform(${q(o.x)},${q(o.y)},${q(o.w)},${q(o.h)},'v',${q(o.dist)},${o.vit/100})`); break;
            }
        }
        const coins = m.objets.filter(o=>o.type==='coin').map(o=>`new Coin(${q(o.x)},${q(o.y)})`).join(',');
        const enns = m.objets.filter(o=>o.type==='ennemi').map(o=>`new Ennemi(${q(o.x)},${q(o.y)},${q(o.dist)},${o.vit})`).join(',');
        const ennVols = m.objets.filter(o=>o.type==='ennemiVol').map(o=>`new EnnemiVolant(${q(o.x)},${q(o.y)},${q(o.dist)},${o.vit})`).join(',');
        const ennSauts = m.objets.filter(o=>o.type==='ennemiSaut').map(o=>`new EnnemiSaut(${q(o.x)},${q(o.y)},${q(o.dist)},${o.vit})`).join(',');
        const allEnns = [enns, ennVols, ennSauts].filter(s=>s).join(',');
        const spk = m.objets.filter(o=>o.type==='spike').map(o=>`new Spike(${q(o.x)},${q(o.y)},${q(o.w)})`).join(',');
        const rss = m.objets.filter(o=>o.type==='ressort').map(o=>`new Ressort(${q(o.x)},${q(o.y)})`).join(',');
        const pus = m.objets.filter(o=>o.type.startsWith('pu')).map(o=>{
            const t = {puDouble:'doublejump',puShield:'shield',puSpeed:'speed'}[o.type];
            return `new PowerUp(${q(o.x)},${q(o.y)},'${t}')`;
        }).join(',');
        const dims = (m.largeurMonde !== 800 || m.hauteurMonde !== 600) ? `largeurMonde:${m.largeurMonde},hauteurMonde:${m.hauteurMonde},` : '';
        return `    {nom:${JSON.stringify(m.nom)},icon:"⭐",desc:"Niveau personnalisé",spawn:{x:${q(m.spawn.x)},y:${q(m.spawn.y)}},${dims}\n    creer:()=>({niveau:[${parts.join(',')}],pieces:[${coins}],ennemis:[${allEnns}],pics:[${spk}],ressorts:[${rss}],powerups:[${pus}]})}`;
    }

    // ---------- Import depuis un code exporté ----------
    // Parse le texte produit par exporter() (sans eval, par expressions régulières)
    // et reconstruit le modèle. Renvoie true si au moins un élément a été lu.
    importer(texte) {
        if (!texte || !texte.trim()) return false;
        const mod = this.modeleVide();
        mod.objets = [];
        let trouve = 0;

        // Nom
        const mNom = texte.match(/nom:\s*"((?:[^"\\]|\\.)*)"/);
        if (mNom) { try { mod.nom = JSON.parse('"' + mNom[1] + '"'); } catch(e) { mod.nom = mNom[1]; } }
        // Spawn
        const mSpawn = texte.match(/spawn:\s*\{\s*x:\s*(-?\d+)\s*,\s*y:\s*(-?\d+)\s*\}/);
        if (mSpawn) { mod.spawn = { x: +mSpawn[1], y: +mSpawn[2] }; }
        // Dimensions du monde
        const mLw = texte.match(/largeurMonde:\s*(\d+)/);
        const mLh = texte.match(/hauteurMonde:\s*(\d+)/);
        mod.largeurMonde = mLw ? +mLw[1] : 800;
        mod.hauteurMonde = mLh ? +mLh[1] : 600;

        // Plateformes : new Platform(x,y,w,h,'couleur','type')
        const reP = /new\s+Platform\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*'[^']*'\s*,\s*'(sol|herbe|mur)'\s*\)/g;
        let m;
        while ((m = reP.exec(texte))) { mod.objets.push({ type: m[5], x: +m[1], y: +m[2], w: +m[3], h: +m[4] }); trouve++; }
        // Plateformes mobiles : new MovingPlatform(x,y,w,h,'h'|'v',dist,vit)
        const reM = /new\s+MovingPlatform\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*'(h|v)'\s*,\s*(-?\d+)\s*,\s*([\d.]+)\s*\)/g;
        while ((m = reM.exec(texte))) { mod.objets.push({ type: m[5] === 'h' ? 'mobileH' : 'mobileV', x: +m[1], y: +m[2], w: +m[3], h: +m[4], dist: +m[6], vit: Math.round(parseFloat(m[7]) * 1000) / 10 }); trouve++; }
        // Pièces
        const reC = /new\s+Coin\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g;
        while ((m = reC.exec(texte))) { mod.objets.push({ type: 'coin', x: +m[1], y: +m[2] }); trouve++; }
        // Ennemis : new Ennemi(x,y,dist,vit)
        const reE = /new\s+Ennemi\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*([\d.]+)\s*\)/g;
        while ((m = reE.exec(texte))) { mod.objets.push({ type: 'ennemi', x: +m[1], y: +m[2], dist: +m[3], vit: parseFloat(m[4]) }); trouve++; }
        // Pics : new Spike(x,y,w)
        const reS = /new\s+Spike\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g;
        while ((m = reS.exec(texte))) { mod.objets.push({ type: 'spike', x: +m[1], y: +m[2], w: +m[3] }); trouve++; }
        // Ressorts
        const reR = /new\s+Ressort\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g;
        while ((m = reR.exec(texte))) { mod.objets.push({ type: 'ressort', x: +m[1], y: +m[2] }); trouve++; }
        // Power-ups : new PowerUp(x,y,'type')
        const rePU = /new\s+PowerUp\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*'(doublejump|shield|speed)'\s*\)/g;
        const mapPU = { doublejump: 'puDouble', shield: 'puShield', speed: 'puSpeed' };
        while ((m = rePU.exec(texte))) { mod.objets.push({ type: mapPU[m[3]], x: +m[1], y: +m[2] }); trouve++; }

        if (trouve === 0) return false;
        this.modele = mod;
        return true;
    }

    // ---------- Export / Import fichier .json (lossless) ----------
    // Modèle pur du niveau (forme partagée par le fichier .json ET le code de partage)
    _modeleJSON() {
        const m = this.modele;
        return {
            format: 'super-carre-niveau',
            version: 1,
            nom: m.nom,
            fond: m.fond || 'jour',
            largeurMonde: m.largeurMonde,
            hauteurMonde: m.hauteurMonde,
            spawn: { x: Math.round(m.spawn.x), y: Math.round(m.spawn.y) },
            objets: m.objets.map(o => {
                const obj = { type: o.type, x: Math.round(o.x), y: Math.round(o.y) };
                if (o.w != null) obj.w = Math.round(o.w);
                if (o.h != null) obj.h = Math.round(o.h);
                if (o.dist != null) obj.dist = Math.round(o.dist);
                if (o.vit != null) obj.vit = o.vit;
                return obj;
            })
        };
    }

    // ---------- CODE DE PARTAGE (🔗) ----------
    // Un niveau tient dans un code texte « PIXOU1.xxxx » : JSON compact
    // compressé (deflate) puis encodé en base64 — copiable dans WhatsApp,
    // SMS, mail… PIXOU0 = variante non compressée (vieux navigateurs).
    _b64DepuisOctets(bytes) {
        let s = '';
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return btoa(s);
    }
    _octetsDepuisB64(b64) {
        const s = atob(b64);
        const bytes = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
        return bytes;
    }
    async _viaStream(bytes, Stream, mode) {
        const flux = new Blob([bytes]).stream().pipeThrough(new Stream(mode));
        return new Uint8Array(await new Response(flux).arrayBuffer());
    }
    // ⚠️ Ordre FIGÉ à jamais (les liens PIXOU2 en dépendent) — ajouter
    // les futurs types uniquement EN FIN de tableau.
    static TYPES_COMPACTS = ['sol','herbe','mur','mobileH','mobileV','coin','ennemi','ennemiVol','ennemiSaut','spike','ressort','puDouble','puShield','puSpeed','checkpoint'];

    // PIXOU2 : modèle → tuples compacts → deflate → base64url (sûr dans une
    // URL sans aucun encodage %XX). ~47 % plus court que PIXOU1.
    _compacter() {
        const m = this._modeleJSON();
        return [2, m.nom, m.fond || 'jour', m.largeurMonde, m.hauteurMonde, m.spawn.x, m.spawn.y,
            m.objets.map(o => {
                const t = [LevelEditor.TYPES_COMPACTS.indexOf(o.type), o.x, o.y];
                if (o.w != null || o.h != null || o.dist != null || o.vit != null) t.push(o.w != null ? o.w : null);
                if (o.h != null || o.dist != null || o.vit != null) t.push(o.h != null ? o.h : null);
                if (o.dist != null || o.vit != null) t.push(o.dist != null ? o.dist : null);
                if (o.vit != null) t.push(o.vit);
                return t;
            })];
    }
    static _decompacter(arr) {
        if (!Array.isArray(arr) || arr[0] !== 2 || !Array.isArray(arr[7])) return null;
        const [, nom, fond, largeurMonde, hauteurMonde, sx, sy, objets] = arr;
        return {
            format: 'super-carre-niveau', version: 1,
            nom, fond, largeurMonde, hauteurMonde,
            spawn: { x: sx, y: sy },
            objets: objets.map(t => {
                const o = { type: LevelEditor.TYPES_COMPACTS[t[0]], x: t[1], y: t[2] };
                if (t[3] != null) o.w = t[3];
                if (t[4] != null) o.h = t[4];
                if (t[5] != null) o.dist = t[5];
                if (t[6] != null) o.vit = t[6];
                return o;
            })
        };
    }
    async codePartage() {
        const octets = new TextEncoder().encode(JSON.stringify(this._compacter()));
        if (typeof CompressionStream !== 'undefined') {
            const comp = await this._viaStream(octets, CompressionStream, 'deflate-raw');
            return 'PIXOU2.' + this._b64DepuisOctets(comp).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        return 'PIXOU0.' + this._b64DepuisOctets(octets);
    }
    // Accepte un code PIXOU même noyé dans un message copié-collé.
    // Renvoie true si un niveau valide a été chargé.
    async chargerCode(texte) {
        // Lien de partage ?n=… : décoder le code encodé dans l'URL
        const mUrl = String(texte).match(/[?&]n=([A-Za-z0-9%._~-]+)/);
        if (mUrl) { try { texte = decodeURIComponent(mUrl[1]) + ' ' + texte; } catch (e) {} }
        const m = String(texte).match(/PIXOU([012])\.([A-Za-z0-9+/=_-]+)/);
        if (!m) return false;
        try {
            // base64url → base64 classique (PIXOU2)
            let b64 = m[2].replace(/-/g, '+').replace(/_/g, '/');
            while (b64.length % 4) b64 += '=';
            let octets = this._octetsDepuisB64(b64);
            if (m[1] !== '0') {
                if (typeof DecompressionStream === 'undefined') return false;
                octets = await this._viaStream(octets, DecompressionStream, 'deflate-raw');
            }
            const json = new TextDecoder().decode(octets);
            if (m[1] === '2') {
                const modele = LevelEditor._decompacter(JSON.parse(json));
                if (!modele) return false;
                return this.chargerJSON(JSON.stringify(modele)); // même validation que tout import
            }
            return this.chargerJSON(json);
        } catch (e) { return false; }
    }

    // Télécharge le modèle complet du niveau dans un fichier .json.
    telechargerJSON() {
        // On exporte le modèle pur (sans propriétés internes éventuelles)
        const data = this._modeleJSON();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        // Nom de fichier propre à partir du nom du niveau
        const nomFichier = (this.modele.nom || 'niveau').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
        a.href = url;
        a.download = nomFichier + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // Charge un modèle depuis le contenu texte d'un fichier .json.
    // Renvoie true si le fichier est un niveau valide.
    chargerJSON(texte) {
        let data;
        try { data = JSON.parse(texte); } catch (e) { return false; }
        if (!data || !Array.isArray(data.objets) || !data.spawn) return false;
        const typesValides = new Set(['sol','herbe','mur','mobileH','mobileV','coin','ennemi','ennemiVol','ennemiSaut','spike','ressort','puDouble','puShield','puSpeed','checkpoint']);
        const objets = [];
        for (const o of data.objets) {
            if (!o || !typesValides.has(o.type)) continue;
            const obj = { type: o.type, x: +o.x || 0, y: +o.y || 0 };
            if (o.w != null) obj.w = +o.w;
            if (o.h != null) obj.h = +o.h;
            if (o.dist != null) obj.dist = +o.dist;
            if (o.vit != null) obj.vit = +o.vit;
            objets.push(obj);
        }
        if (objets.length === 0) return false;
        const fondValide = (data && FONDS[data.fond]) ? data.fond : 'jour';
        this.modele = {
            fond: fondValide,
            nom: typeof data.nom === 'string' ? data.nom : 'Niveau importé',
            largeurMonde: +data.largeurMonde || 800,
            hauteurMonde: +data.hauteurMonde || 600,
            spawn: { x: +data.spawn.x || 60, y: +data.spawn.y || 480 },
            objets
        };
        return true;
    }

    // ---------- Sauvegarde locale ----------
    chargerSauvegardes() {
        try { return JSON.parse(localStorage.getItem(this.STORE_KEY)) || []; } catch(e) { return []; }
    }
    sauvegarder() {
        signaler('niveau_sauve');
        this.modele.nom = document.getElementById('ed-name').value.trim() || 'Sans nom';
        const list = this.chargerSauvegardes();
        const copie = JSON.parse(JSON.stringify(this.modele));
        const idx = list.findIndex(l => l.nom === copie.nom);
        if (idx >= 0) list[idx] = copie; else list.push(copie);
        try { localStorage.setItem(this.STORE_KEY, JSON.stringify(list)); alert('💾 « ' + copie.nom +' » sauvegardé.'); }
        catch(e) { alert('Impossible de sauvegarder (stockage indisponible).'); }
    }
    chargerNiveau(modele) {
        this.modele = JSON.parse(JSON.stringify(modele));
        document.getElementById('ed-name').value = this.modele.nom;
        document.getElementById('ed-world-w').value = this.modele.largeurMonde;
        document.getElementById('ed-world-h').value = this.modele.hauteurMonde;
        this.deselectionner();
        this.fit(); this.dessiner();
    }

    // ============ UI BINDINGS ============
    _initUI() {
        // Palette
        document.getElementById('ed-palette').querySelectorAll('.ed-tool').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.ed-tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.outil = btn.dataset.tool;
                if (this.outil !== 'select') this.deselectionner();
            });
        });
        // Barre du haut
        document.getElementById('ed-menu').addEventListener('click', () => this.fermer());
        document.getElementById('ed-undo').addEventListener('click', () => this.undo());
        document.getElementById('ed-redo').addEventListener('click', () => this.redo());
        document.getElementById('ed-test').addEventListener('click', () => this.tester());
        document.getElementById('ed-verify').addEventListener('click', () => {
            document.getElementById('ed-dropdown').classList.add('hidden');
            setTimeout(() => this.verifierBot(), 60); // laisser le menu se fermer
        });
        document.getElementById('ed-share').addEventListener('click', async () => {
            try {
                const code = await this.codePartage();
                const nom = this.modele.nom || 'Mon niveau';
                // Lien cliquable : le code voyage dans l'URL (?n=…), le jeu
                // l'ouvre automatiquement à l'arrivée. Le collage manuel du
                // lien dans \uD83D\uDCE5 reste possible en secours.
                const lien = 'https://laurent-67370.github.io/super-carre/?n=' + code; // base64url : déjà sûr dans une URL
                const message = `\u{1F7E5} Super Pixou \u2014 je t'envoie mon niveau \u00AB ${nom} \u00BB !\n\n\uD83D\uDC49 Clique pour y jouer :\n${lien}`;
                if (this.onPartage) { this.onPartage(nom, lien, message); return; }
                if (navigator.share) {
                    await navigator.share({ title: 'Super Pixou \u2014 ' + nom, text: message });
                } else {
                    await navigator.clipboard.writeText(message);
                    alert('\uD83D\uDCCB Message copi\u00E9 ! Colle-le dans WhatsApp, SMS, mail\u2026');
                }
            } catch (e) {
                if (e && e.name === 'AbortError') return; // partage annul\u00E9 par l'utilisateur
                alert('Partage impossible : ' + (e && e.message ? e.message : e));
            }
        });
        // Dropdown ⋯
        const dd = document.getElementById('ed-dropdown');
        document.getElementById('ed-menu2').addEventListener('click', () => dd.classList.toggle('hidden'));
        // 🎨 Fond du niveau
        const selFond = document.getElementById('ed-fond');
        if (selFond) {
            for (const [id, fd] of Object.entries(FONDS)) {
                const opt = document.createElement('option');
                opt.value = id; opt.textContent = fd.nom;
                selFond.appendChild(opt);
            }
            selFond.value = this.modele.fond || 'jour';
            selFond.addEventListener('change', () => {
                this.modele.fond = selFond.value;
                this._snapshot(); this.dessiner();
            });
        }
        document.getElementById('ed-save').addEventListener('click', () => { dd.classList.add('hidden'); this.sauvegarder(); });
        document.getElementById('ed-clear').addEventListener('click', () => { dd.classList.add('hidden'); if (confirm('Tout effacer ?')) { this.modele = this.modeleVide(); document.getElementById('ed-name').value = this.modele.nom; this.deselectionner(); this._snapshot(); this.fit(); this.dessiner(); } });
        document.getElementById('ed-load').addEventListener('click', () => { dd.classList.add('hidden'); this._ouvrirListe(); });
        // Génération aléatoire (avec confirmation si le niveau courant n'est pas vide)
        document.getElementById('ed-random').addEventListener('click', () => {
            dd.classList.add('hidden');
            const nonVide = this.modele.objets.length > 0;
            if (nonVide && !confirm('Remplacer le niveau actuel par un niveau aléatoire ?')) return;
            const m = this.genererAleatoire('equilibre');
            this.modele = m;
            document.getElementById('ed-world-w').value = m.largeurMonde;
            document.getElementById('ed-world-h').value = m.hauteurMonde;
            document.getElementById('ed-name').value = m.nom;
            this.deselectionner();
            this._snapshot();
            this.fit();
            this.dessiner();
        });
        // Télécharger le niveau en .json
        document.getElementById('ed-export-json').addEventListener('click', () => {
            dd.classList.add('hidden');
            this.telechargerJSON();
        });
        // Charger un .json (ouvre le sélecteur de fichier)
        const fileInput = document.getElementById('ed-file-input');
        document.getElementById('ed-import-json').addEventListener('click', () => {
            dd.classList.add('hidden');
            fileInput.value = ''; // permet de recharger le même fichier
            fileInput.click();
        });
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                if (this.chargerJSON(reader.result)) {
                    document.getElementById('ed-world-w').value = this.modele.largeurMonde;
                    document.getElementById('ed-world-h').value = this.modele.hauteurMonde;
                    document.getElementById('ed-name').value = this.modele.nom;
                    this.deselectionner();
                    this._snapshot();
                    this.fit();
                    this.dessiner();
                } else {
                    alert('Fichier .json non reconnu (ce n\'est pas un niveau Super Pixou valide).');
                }
            };
            reader.onerror = () => alert('Impossible de lire le fichier.');
            reader.readAsText(file);
        });
        // Import overlay (coller un code)
        document.getElementById('ed-import').addEventListener('click', () => {
            dd.classList.add('hidden');
            document.getElementById('ed-import-text').value = '';
            document.getElementById('ed-import-overlay').classList.remove('hidden');
        });
        document.getElementById('ed-import-close').addEventListener('click', () => document.getElementById('ed-import-overlay').classList.add('hidden'));
        document.getElementById('ed-import-ok').addEventListener('click', async () => {
            const txt = document.getElementById('ed-import-text').value;
            // Code de partage 🔗 (PIXOU1.… même noyé dans un message) ou ancien format
            const ok = /PIXOU[012]\./.test(txt) ? await this.chargerCode(txt) : this.importer(txt);
            if (ok) {
                document.getElementById('ed-world-w').value = this.modele.largeurMonde;
                document.getElementById('ed-world-h').value = this.modele.hauteurMonde;
                document.getElementById('ed-name').value = this.modele.nom;
                this.deselectionner();
                this._snapshot();
                this.fit();
                this.dessiner();
                document.getElementById('ed-import-overlay').classList.add('hidden');
            } else {
                alert('Code non reconnu. Vérifie que tu as bien collé un niveau exporté.');
            }
        });
        // Export overlay
        // Load overlay
        document.getElementById('ed-load-close').addEventListener('click', () => document.getElementById('ed-load-overlay').classList.add('hidden'));
        // Dimensions du monde
        const appliqDims = () => {
            this.modele.largeurMonde = Math.max(800, parseInt(document.getElementById('ed-world-w').value) || 800);
            this.modele.hauteurMonde = Math.max(600, parseInt(document.getElementById('ed-world-h').value) || 600);
            this.fit(); this.dessiner();
        };
        document.getElementById('ed-world-w').addEventListener('change', appliqDims);
        document.getElementById('ed-world-h').addEventListener('change', appliqDims);
        document.getElementById('ed-fit').addEventListener('click', () => { this.fit(); this.dessiner(); });
        document.getElementById('ed-name').addEventListener('change', () => this.modele.nom = document.getElementById('ed-name').value);
        // Propriétés
        const upd = () => {
            const o = this.selection; if (!o) return;
            if (document.getElementById('ed-prop-w').value) o.w = Math.max(10, parseInt(document.getElementById('ed-prop-w').value) || o.w);
            if (document.getElementById('ed-prop-h').value) o.h = Math.max(10, parseInt(document.getElementById('ed-prop-h').value) || o.h);
            if (document.getElementById('ed-prop-dist').value) o.dist = Math.max(10, parseInt(document.getElementById('ed-prop-dist').value) || o.dist);
            if (document.getElementById('ed-prop-vit').value) o.vit = Math.max(1, Math.min(9, parseInt(document.getElementById('ed-prop-vit').value) || o.vit));
            this.dessiner();
        };
        ['ed-prop-w','ed-prop-h','ed-prop-dist','ed-prop-vit'].forEach(id => document.getElementById(id).addEventListener('input', upd));
        document.getElementById('ed-prop-dup').addEventListener('click', () => this.dupliquerSelection());
        document.getElementById('ed-prop-del').addEventListener('click', () => {
            if (this.selection) { this.modele.objets.splice(this.modele.objets.indexOf(this.selection), 1); this.deselectionner(); }
        });
        // Test banner
        document.getElementById('ed-test-back').addEventListener('click', () => this.finTest());
        window.addEventListener('resize', () => { if (this.scr.classList.contains('show')) { this.resize(); this.dessiner(); } });
        // Raccourcis clavier Undo/Redo
        window.addEventListener('keydown', (e) => {
            if (!this.scr.classList.contains('show')) return;
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); if (e.shiftKey) this.redo(); else this.undo(); }
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { e.preventDefault(); this.redo(); }
        });
    }

    _ouvrirListe() {
        const list = this.chargerSauvegardes();
        const cont = document.getElementById('ed-load-list');
        if (list.length === 0) { cont.innerHTML = '<p class="ed-hint">Aucun niveau sauvegardé.</p>'; }
        else {
            cont.innerHTML = '';
            list.forEach((lvl, i) => {
                const row = document.createElement('div'); row.className = 'ed-load-item';
                const nb = (lvl.objets||[]).filter(o=>o.type==='coin').length;
                row.innerHTML = `<span>${lvl.nom} <small style="opacity:.5">(${lvl.largeurMonde}×${lvl.hauteurMonde}, ${nb}🪙)</small></span>`;
                const bOpen = document.createElement('button'); bOpen.textContent = 'Ouvrir';
                bOpen.addEventListener('click', () => { this.chargerNiveau(lvl); document.getElementById('ed-load-overlay').classList.add('hidden'); });
                const bDel = document.createElement('button'); bDel.textContent = '🗑'; bDel.className = 'ed-li-del';
                bDel.addEventListener('click', () => {
                    if (confirm('Supprimer « ' + lvl.nom + ' » ?')) {
                        const l2 = this.chargerSauvegardes(); l2.splice(i, 1);
                        try { localStorage.setItem(this.STORE_KEY, JSON.stringify(l2)); } catch(e){}
                        this._ouvrirListe();
                    }
                });
                row.appendChild(bOpen); row.appendChild(bDel); cont.appendChild(row);
            });
        }
        document.getElementById('ed-load-overlay').classList.remove('hidden');
    }

    // ============ POINTER (souris + tactile unifiés) ============
    _initPointer() {
        const cv = this.canvas;
        let dragging = false, mode = null, startM = null, startObj = null, lastPan = null, moved = false;

        const pos = (e) => {
            const r = cv.getBoundingClientRect();
            const p = e.touches ? e.touches[0] : e;
            return { sx: p.clientX - r.left, sy: p.clientY - r.top };
        };

        const onDown = (e) => {
            e.preventDefault();
            const { sx, sy } = pos(e);
            const m = this.versMonde(sx, sy);
            moved = false;
            if (this.outil === 'select') {
                // poignée de redim sur la sélection courante ?
                if (this.selection && this.poigneeSous(m.x, m.y, this.selection)) {
                    mode = 'resize'; startM = m; startObj = { w: this.selection.w, h: this.selection.h }; dragging = true; return;
                }
                const o = this.objetSous(m.x, m.y);
                if (o) { this.selectionner(o); mode = 'move'; startM = m; startObj = { x: o.x, y: o.y }; dragging = true; }
                else { this.deselectionner(); mode = 'pan'; lastPan = { sx, sy }; dragging = true; }
            } else if (this.outil === 'erase') {
                this.effacerSous(m.x, m.y);
            } else {
                this.placer(m.x, m.y);
            }
        };
        const onMove = (e) => {
            if (!dragging) return;
            e.preventDefault();
            const { sx, sy } = pos(e);
            const m = this.versMonde(sx, sy);
            moved = true;
            if (mode === 'pan') {
                this.cam.x += sx - lastPan.sx; this.cam.y += sy - lastPan.sy; lastPan = { sx, sy }; this.dessiner();
            } else if (mode === 'move' && this.selection) {
                this.selection.x = this.snap(startObj.x + (m.x - startM.x));
                this.selection.y = this.snap(startObj.y + (m.y - startM.y));
                this.dessiner();
            } else if (mode === 'resize' && this.selection) {
                this.selection.w = Math.max(10, this.snap(startObj.w + (m.x - startM.x)));
                this.selection.h = Math.max(10, this.snap(startObj.h + (m.y - startM.y)));
                this.selectionner(this.selection); // rafraîchit le panneau
            }
        };
        const onUp = (e) => {
            if (dragging && moved && mode !== 'pan') {
                // Snapshot seulement si on a réellement modifié un objet (pas un simple pan)
                this._snapshot();
            }
            dragging = false; mode = null;
        };

        cv.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        cv.addEventListener('touchstart', onDown, { passive: false });
        cv.addEventListener('touchmove', onMove, { passive: false });
        cv.addEventListener('touchend', onUp);

        // Zoom à la molette (desktop)
        cv.addEventListener('wheel', (e) => {
            e.preventDefault();
            const { sx, sy } = pos(e);
            const avant = this.versMonde(sx, sy);
            const f = e.deltaY < 0 ? 1.1 : 0.9;
            this.cam.zoom = Math.max(0.2, Math.min(3, this.cam.zoom * f));
            const apres = this.versMonde(sx, sy);
            this.cam.x += (apres.x - avant.x) * this.cam.zoom;
            this.cam.y += (apres.y - avant.y) * this.cam.zoom;
            this.dessiner();
        }, { passive: false });
    }
}

// ============================================================
//  INIT
// ============================================================
