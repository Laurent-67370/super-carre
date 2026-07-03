import { Player } from './player.js';
import { Boss } from './entities.js';
import { AudioManager } from './audio.js';
import { NIVEAUX, medaillePour, seuilsMedailles, MEDAILLE_EMOJI } from './levels.js';
import { HighScoreManager, ProgressManager } from './storage.js';
import { DemoBot } from './demo.js';
import { SkinManager } from './skins.js';
import { afficherHallOfFame } from './ui.js';
/* Game — moteur de jeu (boucle, physique, rendu) */

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.W = 800; this.H = 600;
        this.dpr = 1;
        this.configurerCanvas();
        window.addEventListener('resize', () => this.configurerCanvas());
        this.audio = new AudioManager();
        window._gameAudio = this.audio;
        this.touches = { left:false, right:false, jump:false };
        this.modeDemo = false; // « attract mode » : le jeu se joue tout seul
        this.hs = new HighScoreManager();
        this.progress = new ProgressManager(NIVEAUX.length);
        // 🎨 Boutique : portefeuille + skins. Bonus de bienvenue pour les
        // joueurs existants (30 🪙 par niveau déjà débloqué).
        this.skins = new SkinManager();
        if (this.skins.premierLancement && this.progress.niveauDebloque > 0) {
            this.skins.crediter(this.progress.niveauDebloque * 30);
        }
        this.niveauActuel = 0; this.scoreTotal = 0; this.tempsTotal = 0;
        this.tempsNiveau = 0; this.frameCount = 0; this.vies = 5;
        this.scoreCumul = 0; // Score total affiché pendant le jeu (pièces + ennemis + power-ups)
        this.piecesTotal = 0; // Nombre de pièces ramassées (pour l'affichage Hall of Fame)
        this.prochainPalierScore = 5000; // +1 vie chaque fois que le score franchit ce seuil
        this.effets = []; // particules de feedback (confettis paliers, débris mort)
        this.etat = 'menu'; this.shakeFrames = 0;
        this.player = null; this.niveau = []; this.pieces = []; this.ennemis = []; this.pics = []; this.nuages = [];
        this.ressorts = []; this.powerups = [];
        this.scorePopups = []; // Popups "+100" flottants à chaque pièce collectée
        // --- SYSTÈME TUTORIEL (niveau 1, première fois) ---
        this.tutoHints = [];   // {x, y, text, triggerX, vu}
        this.tutoVu = false;   // localStorage → on n'affiche qu'une fois
        try { this.tutoVu = localStorage.getItem('supercarre_tuto_vu') === '1'; } catch(e) {}
    }
    // Adapte le backing store du canvas à la densité de pixels de l'écran.
    // La logique de jeu continue de raisonner en coordonnées 800×600 ;
    // le setTransform mappe ces coordonnées vers les pixels physiques.
    configurerCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 3); // plafonné à 3 pour limiter la charge GPU
        // Taille d'affichage réelle décidée par le layout CSS (flex + aspect-ratio)
        const rect = this.canvas.getBoundingClientRect();
        let cssW = rect.width, cssH = rect.height;
        // Avant le 1er layout, rect peut être nul → repli sur le ratio 4/3
        if (cssW < 1 || cssH < 1) { cssW = this.W; cssH = this.H; }
        const bw = Math.round(cssW * dpr);
        const bh = Math.round(cssH * dpr);
        if (this.canvas.width !== bw || this.canvas.height !== bh) {
            this.canvas.width = bw;
            this.canvas.height = bh;
        }
        this.dpr = dpr;
        // Mappe 800×600 logiques → backing store physique
        this.ctx.setTransform(bw / this.W, 0, 0, bh / this.H, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
    }
    chargerNiveau(idx) {
        this.modeTest = false;
        this.niveauActuel = idx;
        this._initNiveau(NIVEAUX[idx].creer(), NIVEAUX[idx].largeurMonde, NIVEAUX[idx].hauteurMonde, NIVEAUX[idx].spawn);
    }
    // Charge un niveau depuis des données déjà instanciées (utilisé par l'éditeur en mode test)
    chargerNiveauData(data, largeurMonde, hauteurMonde, spawn) {
        this.modeTest = true;
        this._initNiveau(data, largeurMonde, hauteurMonde, spawn);
    }
    _initNiveau(data, largeurMonde, hauteurMonde, spawn) {
        this.niveau = data.niveau; this.pieces = data.pieces;
        this.ennemis = data.ennemis||[]; this.pics = data.pics||[];
        this.ressorts = data.ressorts||[]; this.powerups = data.powerups||[];
        this.scoreNiveau = 0; this.totalPiecesNiveau = this.pieces.length;
        this.mortsNiveau = 0; // morts/dégâts subis dans ce niveau (pour les étoiles)
        this.tempsNiveau = 0; this.frameCount = 0;
        // Vider les particules et popups du niveau précédent (confettis de palier,
        // débris de mort, popups +100/BOSS VAINCU…) pour qu'elles ne s'affichent
        // pas brièvement au tout début du niveau suivant.
        this.effets = []; this.scorePopups = [];
        // Dimensions du monde (défaut = taille écran → niveaux classiques sans scroll)
        this.mondeW = largeurMonde || this.W;
        this.mondeH = hauteurMonde || this.H;
        this.boss = null;
        this.bossVaincu = false;
        this.player = new Player(spawn.x, spawn.y);
        this.player.skin = this.skins.config();
        this.player.checkpointX = spawn.x; this.player.checkpointY = spawn.y;
        this.player.mondeW = this.mondeW; this.player.mondeH = this.mondeH;
        const platSafe = this.niveau.filter(p=>p.type==='herbe');
        // --- BOSS tous les 6 niveaux (6, 12, 18, 24) — jamais en mode test éditeur ---
        // Placé juste au-dessus d'une plateforme existante pour être TOUJOURS atteignable.
        const numNiveau = this.niveauActuel + 1;
        if (!this.modeTest && numNiveau % 6 === 0) {
            const platsSol = this.niveau.filter(p => p.type === 'herbe' || p.type === 'sol');
            // Choisir une bonne plateforme « arène » : large, et avec assez d'espace au-dessus
            // pour que le boss y patrouille à hauteur de saut sans être collé au plafond.
            let arene = null;
            if (platsSol.length) {
                const candidates = platsSol.filter(p => p.largeur >= 100 && p.y >= 130 && p.y < this.mondeH - 100);
                const pool = candidates.length ? candidates : platsSol.filter(p => p.largeur >= 80);
                const finalPool = pool.length ? pool : platsSol;
                // parmi celles qui ont de l'espace, prendre une plateforme assez haute mais pas trop
                // (cible : autour du tiers supérieur du monde)
                const cible = this.mondeH * 0.35;
                arene = finalPool.reduce((a, b) => (Math.abs(b.y - cible) < Math.abs(a.y - cible) ? b : a));
            }
            const bossH = 52;
            // le boss patrouille à ~70px au-dessus de la plateforme arène → atteignable d'un saut,
            // mais pas collé (écart entre 55 et 75px pour laisser de la marge de saut)
            const ecartSouhaite = 70;
            let bossY = arene ? (arene.y - bossH - ecartSouhaite) : Math.max(20, this.mondeH - 220);
            if (bossY < 20) bossY = 20; // ne pas sortir en haut du monde
            // si l'espace au-dessus est trop réduit, on garde au moins 50px d'écart
            if (arene && (arene.y - bossH - bossY) < 50) bossY = Math.max(20, arene.y - bossH - 50);
            const bx = arene ? (arene.x + arene.largeur / 2 - 30) : (this.mondeW / 2 - 30);
            // bornes de patrouille : au-dessus de la plateforme arène (+ marge), pour rester atteignable
            let bornes = null;
            if (arene) {
                const marge = 40;
                bornes = {
                    min: Math.max(4, arene.x - marge),
                    max: Math.min(this.mondeW - 4 - 60, arene.x + arene.largeur + marge - 60)
                };
                if (bornes.max < bornes.min) bornes.max = bornes.min; // plateforme étroite
            }
            this.boss = new Boss(bx, bossY, this.mondeW, bornes);
            this.bossArene = arene ? { x: arene.x, r: arene.x + arene.largeur, y: arene.y } : null;
            this.bossVaincu = false;
        }
        // Checkpoint à mi-parcours, uniquement pour les grands niveaux (où une chute coûte cher).
        // On choisit une plateforme proche du milieu géographique du parcours.
        this.checkpoint = null;
        const grand = this.mondeW > 1200 || this.mondeH > 800;
        if (grand && platSafe.length > 3) {
            // axe principal = horizontal si large, vertical si haut
            const horizontal = this.mondeW >= this.mondeH;
            const milieu = horizontal ? this.mondeW / 2 : this.mondeH / 2;
            // plateforme dont le centre est le plus proche du milieu de l'axe
            let best = null, bestD = Infinity;
            for (const p of platSafe) {
                const c = horizontal ? (p.x + p.largeur / 2) : p.y;
                const d = Math.abs(c - milieu);
                if (d < bestD) { bestD = d; best = p; }
            }
            if (best) {
                this.checkpoint = {
                    x: best.x + best.largeur / 2,
                    y: best.y - 36,            // le drapeau repose sur la plateforme
                    spawnX: best.x + 10,
                    spawnY: best.y - this.player.hauteur,
                    atteint: false
                };
            }
        }
        this.nuages = [];
        const largeurNuages = Math.max(800, this.mondeW);
        for(let i=0;i<4;i++){this.nuages.push({x:Math.random()*largeurNuages,y:20+Math.random()*120,t:25+Math.random()*30,v:0.15+Math.random()*0.2})}
        // Caméra : centrée immédiatement sur le spawn (pas de glissement au démarrage)
        this.camX = 0; this.camY = 0;
        this.recalculerCamera(true);

        // --- Tutoriel niveau 1 (première fois uniquement) ---
        this.tutoHints = [];
        if (!this.tutoVu && this.niveauActuel === 0 && !this.modeTest && !this.modeDemo) {
            this.tutoHints = [
                { text: '◀ ▶ pour bouger', triggerX: 80, vu: false, fade: 0, y: 400 },
                { text: '🦘 pour sauter !', triggerX: 250, vu: false, fade: 0, y: 340 },
                { text: '🪙 Ramasse toutes les pièces !', triggerX: 440, vu: false, fade: 0, y: 280 },
            ];
        }
        // HUD dessiné sur canvas — plus de mises à jour DOM
        this.updateHearts(); this.etat = 'playing';
    }
    // Positionne la caméra sur le joueur, bornée aux limites du monde.
    // instant=true : pas de lissage (chargement / respawn).
    recalculerCamera(instant) {
        if (!this.player) return;
        const cibleX = this.player.x + this.player.largeur / 2 - this.W / 2;
        const cibleY = this.player.y + this.player.hauteur / 2 - this.H / 2;
        const maxX = Math.max(0, this.mondeW - this.W);
        const maxY = Math.max(0, this.mondeH - this.H);
        const tx = Math.max(0, Math.min(maxX, cibleX));
        const ty = Math.max(0, Math.min(maxY, cibleY));
        if (instant) { this.camX = tx; this.camY = ty; }
        else {
            // Lissage : la caméra rattrape la cible en douceur
            this.camX += (tx - this.camX) * 0.12;
            this.camY += (ty - this.camY) * 0.12;
            if (Math.abs(tx - this.camX) < 0.5) this.camX = tx;
            if (Math.abs(ty - this.camY) < 0.5) this.camY = ty;
        }
    }
    updateHearts() { /* HUD dessiné sur canvas — plus de DOM */ }
    update() {
        // --- MORT FUN : anime les débris de Pixou avant le game over ---
        if (this.etat === 'mort') {
            this.mortFrame = (this.mortFrame || 0) + 1;
            this._updateEffets();
            for (let i = this.scorePopups.length - 1; i >= 0; i--) { const p = this.scorePopups[i]; p.y -= 1.5; p.vie--; if (p.vie <= 0) this.scorePopups.splice(i, 1); }
            if (this.mortFrame >= 45) this.gameOver();
            return;
        }
        if (this.etat !== 'playing') return;
        // --- MODE DÉMO : pilote automatique + passage au niveau suivant après 60 s ---
        if (this.modeDemo) {
            this._demoBot.piloter(this);
            const inactif = this.frameCount - (this._demoDernierePiece || 0) > 15 * 60;
            if (this.frameCount > 60 * 60 || (inactif && this.frameCount > 18 * 60)) { this._demoSuivant(); return; }
        }
        this.frameCount++;
        if (this.frameCount%6===0){this.tempsNiveau=Math.round((this.frameCount/60)*10)/10}
        for(const p of this.niveau){if(p.update&&p.axe)p.update()}

        // --- Mise à jour des bulles tutoriel ---
        if (this.player && this.tutoHints.length > 0) {
            for (const h of this.tutoHints) {
                if (!h.vu && this.player.x >= h.triggerX) {
                    h.vu = true; h.fade = 0;
                }
                if (h.vu && h.fade < 1) h.fade = Math.min(1, h.fade + 0.05);
                if (h.vu && h.fade >= 1 && this.player.x > h.triggerX + 150) {
                    h.fade = Math.max(0, h.fade - 0.03);
                }
            }
            // Marquer le tuto comme vu quand toutes les bulles ont été déclenchées
            if (this.tutoHints.every(h => h.vu)) {
                this.tutoVu = true;
                try { localStorage.setItem('supercarre_tuto_vu', '1'); } catch(e) {}
            }
        }
        for(const e of this.ennemis) e.update(this.player);
        // --- BOSS : update + collision spéciale (3 coups sur la tête) ---
        if (this.boss && !this.bossVaincu) {
            this.boss.update(this.player);
            const p = this.player, b = this.boss;
            if (!b.mort && p.x < b.x + b.largeur && p.x + p.largeur > b.x && p.y < b.y + b.hauteur && p.y + p.hauteur > b.y) {
                // saut sur la tête ?
                if (p.vy > 2 && (p.y + p.hauteur - b.y) < 24) {
                    const vaincu = b.encaisser();
                    p.vy = p.forceSaut * 0.8; this.audio.ecrase();
                    if (navigator.vibrate) navigator.vibrate(60);
                    if (vaincu) {
                        this.bossVaincu = true;
                        this.scoreCumul += 1000;
                        this.scorePopups.push({ x: b.x, y: b.y, vie: 80, text: 'BOSS VAINCU ! +1000' });
                        this.player.setExpression('win', 60);
                        this.audio.victoire();
                        // si toutes les pièces sont déjà ramassées, terminer maintenant
                        if (this.scoreNiveau >= this.totalPiecesNiveau) { this.niveauTermine(); return; }
                    } else {
                        this.scorePopups.push({ x: b.x + 10, y: b.y, vie: 50, text: `${b.pv} ❤` });
                        this.player.setExpression('joy', 20);
                    }
                } else if (b.invincible <= 0 && p.invincible <= 0 && p.powerUpTimer.shield <= 0) {
                    // touché par le boss sur le côté → dégât
                    this.audio.degat(); if(navigator.vibrate)navigator.vibrate(200);
                    if(!this.modeDemo){this.vies--;} this.updateHearts(); this.shakeFrames=8; this.mortsNiveau++;
                    if(this.vies<=0){ this._spawnDebris(p.x+15,p.y+15); this.etat='mort'; this.mortFrame=0; return; }
                    p.subirDegat();
                    this.recalculerCamera(true);
                }
            }
        } else if (this.boss && this.bossVaincu && this.boss.mort) {
            this.boss.update(this.player); // laisse jouer l'animation de mort
        }

        // Mettre à jour les popups de score flottants
        for(let i=this.scorePopups.length-1;i>=0;i--){const p=this.scorePopups[i];p.y-=1.5;p.vie--;if(p.vie<=0)this.scorePopups.splice(i,1)}
        this._updateEffets();

        const result = this.player.update(this.touches,this.audio,this.niveau,this.ennemis,this.pics);
        // --- CHECKPOINT : activé quand le joueur le franchit ---
        if (this.checkpoint && !this.checkpoint.atteint) {
            const pcx = this.player.x + 15, pcy = this.player.y + 15;
            if (Math.abs(pcx - this.checkpoint.x) < 45 && Math.abs(pcy - this.checkpoint.y) < 60) {
                this.checkpoint.atteint = true;
                this.player.checkpointX = this.checkpoint.spawnX;
                this.player.checkpointY = this.checkpoint.spawnY;
                this.audio.transition();
                if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
                this.scorePopups.push({ x: this.checkpoint.x - 15, y: this.checkpoint.y - 10, vie: 70, text: '🚩 Checkpoint !' });
                this.player.setExpression('joy', 24);
            }
        }
        // Bonus pour chaque ennemi écrasé cette frame (+150)
        if (this.player.ennemisEcrases) {
            this.scoreCumul += 150 * this.player.ennemisEcrases;
            this.scorePopups.push({x:this.player.x, y:this.player.y-10, vie:45, text:'+150'});
            this.player.ennemisEcrases = 0;
            this.player.setExpression('joy', 20);
        }
        // Expression « effrayé » si un ennemi vivant est tout proche (sauf si une expression prioritaire est active)
        if (this.player.expressionTimer === 0) {
            let scare = false;
            const pcx = this.player.x + 15, pcy = this.player.y + 15;
            for (const e of this.ennemis) {
                if (!e.mort) { const ex = (e.x + e.largeur / 2) - pcx, ey = (e.y + e.hauteur / 2) - pcy; if (ex * ex + ey * ey < 55 * 55) { scare = true; break; } }
            }
            this.player.expression = scare ? 'scared' : 'normal';
        }
        if(result==='degat'||result==='trou'){
            this.audio.degat(); if(navigator.vibrate)navigator.vibrate(200);
            if(!this.modeDemo){this.vies--;} this.updateHearts(); this.shakeFrames=8; this.mortsNiveau++;
            if(this.vies<=0){
                // Sur une chute dans un trou, le joueur est déjà sorti de l'écran par le bas :
                // on fait apparaître les débris en bas de la zone visible (caméra) pour que
                // l'animation de mort reste visible, au lieu d'afficher une scène figée vide
                // pendant 45 frames. Sur un dégât normal (ennemi/pic), le joueur est à l'écran
                // → on garde le comportement d'origine (player.y).
                const dy = result==='trou' ? (this.camY + this.H - 30) : (this.player.y + 15);
                this._spawnDebris(this.player.x + 15, dy);
                this.etat='mort'; this.mortFrame=0; return;
            }
            if(this.checkpoint&&this.checkpoint.atteint){this.player.checkpointX=this.checkpoint.spawnX;this.player.checkpointY=this.checkpoint.spawnY}
            this.player.subirDegat();
            this.recalculerCamera(true); // recentrage immédiat après respawn
        }
        for(const piece of this.pieces){
            piece.update();
            if(piece.testerCollecte(this.player)){
                this.scoreNiveau++; this.audio.piece();
                if (!this.modeDemo && !this.modeTest) this.skins.crediter(1); // 🪙 boutique
                if (this.modeDemo) this._demoDernierePiece = this.frameCount;
                this.scoreCumul += 100; this.piecesTotal++;
                if(navigator.vibrate)navigator.vibrate(30);
                // Popup de score flottant sur le canvas
                this.scorePopups.push({x:piece.x,y:piece.y,vie:45,text:'+100'});
                this.player.setExpression('joy', 18);
                if(this.scoreNiveau>=this.totalPiecesNiveau && (!this.boss || this.bossVaincu)){this.niveauTermine();return}
            }
        }
        // --- RESSORTS : vérifier le rebond ---
        for(const r of this.ressorts){
            r.update();
            if(r.testerRebond(this.player)){
                this.player.vy = r.force;
                this.player.onGround = false;
                this.player.sauteEncore = false;
                this.player.dejaDoubleJump = false;
                this.audio.beep(300, 900, 0.15, 'sine', 0.12);
                if(navigator.vibrate) navigator.vibrate(25);
            }
        }
        // --- POWER-UPS : vérifier la collecte ---
        for(const pu of this.powerups){
            pu.update();
            if(pu.testerCollecte(this.player)){
                // Activer le power-up
                this.player.powerUpTimer[pu.type] = this.player.dureePowerUp;
                this.scoreCumul += 250;
                this.audio.victoire();
                if(navigator.vibrate) navigator.vibrate([30, 20, 50]);
                this.scorePopups.push({x:pu.x, y:pu.y, vie:50, text:pu.type==='doublejump'?'DBL SAUT +250':pu.type==='shield'?'BOUCLIER +250':'VITESSE +250'});
                this.player.setExpression('joy', 30);
            }
        }
        const wrapN = Math.max(850, this.mondeW + 50);
        for(const n of this.nuages){n.x+=n.v;if(n.x>wrapN)n.x=-60}
        if(this.shakeFrames>0)this.shakeFrames--;
        // La caméra suit le joueur en douceur
        this.recalculerCamera(false);
        // Bonus : +1 vie à chaque palier de 5000 points
        this.verifierBonusScore();
    }
    // Accorde +1 vie chaque fois que le score franchit un multiple de 5000.
    // Gère le franchissement de plusieurs paliers d'un coup.
    verifierBonusScore() {
        while (this.scoreCumul >= this.prochainPalierScore) {
            this.vies++;
            this.updateHearts();
            const palier = this.prochainPalierScore;
            this.scorePopups.push({ x: this.player.x, y: this.player.y - 20, vie: 70, text: `🎉 ${palier} !` });
            this.scorePopups.push({ x: this.player.x, y: this.player.y - 44, vie: 60, text: '❤ +1 VIE !' });
            this._spawnConfettis(this.player.x + 15, this.player.y + 5, 28);
            this.player.setExpression('joy', 40);
            if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
            this.prochainPalierScore += 5000;
        }
    }
    // Confettis colorés (célébration de palier de points)
    _spawnConfettis(x, y, n) {
        const couleurs = ['#FFD700', '#FF6B5C', '#16A085', '#3498DB', '#9B59B6', '#E67E22', '#FFF'];
        for (let i = 0; i < n; i++) {
            this.effets.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6 - 2,
                g: 0.25,
                couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
                taille: 3 + Math.random() * 4,
                rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
                vie: 60, vieMax: 60, type: 'confetti'
            });
        }
    }
    // Débris rouges (mort fun de Pixou)
    _spawnDebris(x, y) {
        const couleurs = ['#FF6B5C', '#E74C3C', '#C0392B', '#F1C40F', '#16A085'];
        for (let i = 0; i < 14; i++) {
            this.effets.push({
                x, y,
                vx: (Math.random() - 0.5) * 12,
                vy: -Math.random() * 9 - 2,
                g: 0.4,
                couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
                taille: 4 + Math.random() * 5,
                rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.5,
                vie: 45, vieMax: 45, type: 'debris'
            });
        }
    }
    _updateEffets() {
        for (let i = this.effets.length - 1; i >= 0; i--) {
            const e = this.effets[i];
            e.vy += e.g; e.x += e.vx; e.y += e.vy; e.rot += e.vr; e.vie--;
            if (e.vie <= 0) this.effets.splice(i, 1);
        }
    }
    dessiner() {
        const ctx = this.ctx;
        // --- RESET COMPLET du contexte canvas à chaque frame ---
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        // Effacer explicitement le canvas (anti-résidu)
        ctx.clearRect(0, 0, this.W, this.H);

        // Fond (dessiné en premier, sans shake) — palette définie une seule fois (pas par frame)
        if (!Game._cielPalette) {
            Game._cielPalette = [['#5DADE2','#D6EAF8'],['#2C3E50','#1a1a2e'],['#8E44AD','#2C003E'],['#1B4F72','#0E2F44'],['#922B21','#1A0000'],['#1B263B','#02030a'],['#145A32','#0a1f12'],['#641E16','#1a0500'],['#7DCEA0','#D5F5E3'],['#5499C7','#1B2631'],['#5B2C6F','#1B0A2E'],['#7B241C','#0B0000'],['#34495E','#0a0a0a'],['#212F3D','#050810'],['#16A085','#0A2A24'],['#5D4037','#1A0E08'],['#CB4335','#2C0008'],['#5D6D7E','#1B2631'],['#1F618D','#0B2540'],['#6C3483','#1A0A2E'],['#1B2631','#02030a'],['#AED6F1','#21618C'],['#2E4053','#0a0a0a'],['#512E5F','#0D0D0D']];
        }
        const couleurs=Game._cielPalette;
        const cols=couleurs[Math.min(this.niveauActuel,couleurs.length-1)];
        // Le dégradé du ciel ne dépend que du niveau et de la hauteur : on le met en cache
        // pour ne pas le reconstruire à chaque frame (gain CPU, aucun changement visuel).
        if (!this._cielGrad || this._cielGradNiv !== this.niveauActuel || this._cielGradH !== this.H) {
            const g = ctx.createLinearGradient(0,0,0,this.H);
            g.addColorStop(0,cols[0]); g.addColorStop(1,cols[1]);
            this._cielGrad = g; this._cielGradNiv = this.niveauActuel; this._cielGradH = this.H;
        }
        ctx.fillStyle=this._cielGrad;ctx.fillRect(0,0,this.W,this.H);
        // Étoiles (niveaux sombres) — légère parallaxe, réparties sur le monde
        if(this.niveauActuel>=1){ctx.fillStyle='rgba(255,255,255,.4)';const sox=-(this.camX||0)*0.15;for(let i=0;i<24;i++){const stx=((i*53+37)%Math.max(800,this.mondeW))+sox;const sty=(i*31+17)%200;ctx.fillRect(stx,sty,2,2)}}
        // Parallaxe : le décor lointain défile plus lentement que le monde
        const camX = this.camX || 0, camY = this.camY || 0;
        const paraX = -camX * 0.3, paraY = -camY * 0.3;
        // Collines (parallaxe)
        ctx.save(); ctx.translate(paraX, paraY);
        ctx.fillStyle='rgba(46,204,113,.2)';ctx.beginPath();ctx.arc(150,560,120,Math.PI,0);ctx.arc(450,560,100,Math.PI,0);ctx.arc(700,560,130,Math.PI,0);ctx.fill();
        // Nuages (parallaxe)
        ctx.fillStyle='rgba(255,255,255,.7)';
        for(const n of this.nuages){ctx.beginPath();ctx.arc(n.x,n.y,n.t,0,6.28);ctx.arc(n.x+n.t*.8,n.y,n.t*.7,0,6.28);ctx.arc(n.x-n.t*.7,n.y+5,n.t*.6,0,6.28);ctx.fill()}
        ctx.restore();

        // Éléments de jeu : translation caméra (+ shake éventuel)
        ctx.save();
        const sx = this.shakeFrames>0 ? (Math.random()-0.5)*3 : 0;
        const sy = this.shakeFrames>0 ? (Math.random()-0.5)*3 : 0;
        ctx.translate(-camX + sx, -camY + sy);
        for(const s of this.pics) s.dessiner(ctx);
        for(const p of this.niveau) p.dessiner(ctx);
        // --- Drapeau de checkpoint (gris = inactif, vert lumineux = atteint) ---
        if (this.checkpoint) {
            const cp = this.checkpoint, fx = cp.x, fy = cp.y;
            const actif = cp.atteint;
            // mât
            ctx.strokeStyle = '#7f8c9b'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(fx, fy - 4); ctx.lineTo(fx, fy + 36); ctx.stroke();
            // drapeau (ondule légèrement si atteint)
            const wave = actif ? Math.sin(this.frameCount / 8) * 3 : 0;
            ctx.fillStyle = actif ? '#2ECC71' : '#566573';
            ctx.beginPath();
            ctx.moveTo(fx, fy - 2);
            ctx.lineTo(fx + 22, fy + 4 + wave);
            ctx.lineTo(fx, fy + 12);
            ctx.closePath(); ctx.fill();
            if (actif) {
                ctx.fillStyle = 'rgba(46,204,113,.25)';
                ctx.beginPath(); ctx.arc(fx, fy + 16, 16, 0, 6.28); ctx.fill();
            }
        }
        for(const e of this.ennemis) e.dessiner(ctx);
        if (this.boss && (!this.bossVaincu || this.boss.mortFrame < 30)) this.boss.dessiner(ctx);
        for(const piece of this.pieces) piece.dessiner(ctx);
        for(const r of this.ressorts) r.dessiner(ctx);
        for(const pu of this.powerups) pu.dessiner(ctx);
        if(this.player && this.etat !== 'mort') this.player.dessiner(ctx);

        // Particules d'effets (confettis, débris) dans le repère monde
        for(const ef of this.effets){
            ctx.save();
            ctx.globalAlpha = Math.min(1, ef.vie / (ef.vieMax * 0.5));
            ctx.translate(ef.x, ef.y);
            ctx.rotate(ef.rot);
            ctx.fillStyle = ef.couleur;
            ctx.fillRect(-ef.taille/2, -ef.taille/2, ef.taille, ef.taille);
            ctx.restore();
        }
        ctx.globalAlpha = 1;

        // Popups de score flottants (dans le repère monde)
        ctx.globalAlpha = 1;
        for(const p of this.scorePopups){
            const maxVie = 50;
            const alpha = Math.min(1, p.vie / maxVie);
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,.6)';
            ctx.fillText(p.text, p.x + 2, p.y + 2);
            ctx.fillStyle = '#FFD700';
            ctx.fillText(p.text, p.x, p.y);
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // --- HUD DESSINÉ SUR CANVAS (zéro clignotement, zéro composition DOM) ---
        this.dessinerHUD(ctx);

        // --- BANDEAU MODE DÉMO ---
        if (this.modeDemo) {
            ctx.save();
            const alpha = 0.65 + Math.sin(this.frameCount * 0.06) * 0.3;
            ctx.font = '700 20px -apple-system, "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            const txt = '🎬 MODE DÉMO';
            const w = ctx.measureText(txt).width + 36;
            ctx.fillStyle = 'rgba(0,0,0,.55)';
            ctx.beginPath(); ctx.roundRect(this.W/2 - w/2, 46, w, 34, 17); ctx.fill();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#FFD700';
            ctx.fillText(txt, this.W/2, 70);
            ctx.globalAlpha = .8;
            ctx.font = '600 13px -apple-system, "Segoe UI", system-ui, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('Touche l\'écran pour reprendre la main', this.W/2, 96);
            ctx.restore();
        }

        // --- BULLES TUTORIEL ---
        this.dessinerTuto(ctx);
    }

    dessinerTuto(ctx) {
        if (this.tutoHints.length === 0) return;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const h of this.tutoHints) {
            if (h.fade <= 0) continue;
            const px = this.player ? this.player.x + this.player.largeur / 2 : h.triggerX;
            const py = this.player ? this.player.y - 50 : h.y;
            ctx.globalAlpha = h.fade;
            // Mesure du texte
            ctx.font = 'bold 16px -apple-system,system-ui,sans-serif';
            const tw = ctx.measureText(h.text).width;
            const bw = tw + 28, bh = 32, bx = px - bw / 2, by = py - bh / 2;
            // Fond de la bulle
            ctx.fillStyle = 'rgba(0,0,0,.82)';
            this.roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
            // Bordure dorée
            ctx.strokeStyle = 'rgba(255,215,0,.5)'; ctx.lineWidth = 1.5;
            this.roundRect(ctx, bx, by, bw, bh, 10); ctx.stroke();
            // Petit triangle pointant vers le joueur
            ctx.fillStyle = 'rgba(0,0,0,.82)';
            ctx.beginPath();
            ctx.moveTo(px - 6, py + bh / 2);
            ctx.lineTo(px + 6, py + bh / 2);
            ctx.lineTo(px, py + bh / 2 + 8);
            ctx.closePath(); ctx.fill();
            // Texte
            ctx.fillStyle = '#FFD700';
            ctx.fillText(h.text, px, py);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Helper : rectangle arrondi
    roundRect(ctx,x,y,w,h,r){
        ctx.beginPath();
        ctx.moveTo(x+r,y);
        ctx.arcTo(x+w,y,x+w,y+h,r);
        ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r);
        ctx.arcTo(x,y,x+w,y,r);
        ctx.closePath();
    }

    // HUD entièrement sur canvas — pas de DOM = pas de flash
    dessinerHUD(ctx){
        ctx.save();
        ctx.globalAlpha=1;
        ctx.textBaseline='middle';
        ctx.font='bold 22px -apple-system,system-ui,sans-serif';

        // === CÔTÉ GAUCHE : cœurs + pièces ===
        // Cœurs
        // Cœurs : rangée classique jusqu'à 5 vies, format compact « ❤×N » au-delà
        let hText, hColor='#E74C3C';
        if (this.vies <= 5) {
            hText = '❤'.repeat(this.vies) + '🖤'.repeat(Math.max(0, 5 - this.vies));
        } else {
            hText = '❤ ×' + this.vies;
        }
        ctx.textAlign='left';
        const hw=ctx.measureText(hText).width;
        ctx.fillStyle='rgba(0,0,0,.75)';
        this.roundRect(ctx,10,8,hw+24,32,16);ctx.fill();
        ctx.fillStyle=hColor;
        ctx.fillText(hText,22,25);

        // Pièces
        const cText=`🪙 ${this.scoreNiveau}/${this.totalPiecesNiveau}`;
        const cw=ctx.measureText(cText).width;
        ctx.fillStyle='rgba(0,0,0,.75)';
        this.roundRect(ctx,10,46,cw+24,32,16);ctx.fill();
        ctx.fillStyle='#FFD700';
        ctx.fillText(cText,22,63);

        // Indicateur boss (clignotant) tant qu'il n'est pas vaincu
        if (this.boss && !this.bossVaincu) {
            const bText = `👑 Bats le boss ! (${this.boss.pv}❤)`;
            ctx.textAlign='left';
            const bw = ctx.measureText(bText).width;
            const pulse = 0.6 + 0.4 * Math.abs(Math.sin(this.frameCount/15));
            ctx.fillStyle=`rgba(155,89,182,${0.85*pulse})`;
            this.roundRect(ctx,10,84,bw+24,30,15);ctx.fill();
            ctx.fillStyle='#fff';
            ctx.fillText(bText,22,100);
            ctx.textAlign='left';
        }

        // === CÔTÉ DROIT : score + niveau + timer ===
        ctx.textAlign='right';

        // Score (⭐)
        const sText=`⭐ ${this.scoreCumul}`;
        const sw=ctx.measureText(sText).width;
        ctx.fillStyle='rgba(0,0,0,.82)';
        this.roundRect(ctx,this.W-sw-34,8,sw+24,32,16);ctx.fill();
        ctx.fillStyle='#FFD700';
        ctx.fillText(sText,this.W-22,25);

        // Niveau
        const lText=`🏁 Niv.${this.niveauActuel+1}`;
        const lw=ctx.measureText(lText).width;
        ctx.fillStyle='rgba(0,0,0,.75)';
        this.roundRect(ctx,this.W-lw-34,46,lw+24,32,16);ctx.fill();
        ctx.fillStyle='#5DADE2';
        ctx.fillText(lText,this.W-22,63);

        // Timer
        const tText=`⏱️ ${this.tempsNiveau.toFixed(1)}s`;
        const tw=ctx.measureText(tText).width;
        ctx.fillStyle='rgba(0,0,0,.75)';
        this.roundRect(ctx,this.W-tw-34,84,tw+24,32,16);ctx.fill();
        ctx.fillStyle='#5BDE60';
        ctx.fillText(tText,this.W-22,101);

        // === POWER-UPS ACTIFS (barre du bas, centrée) ===
        if(this.player){
            const pus=[];
            if(this.player.powerUpTimer.doublejump>0) pus.push({label:'JS',color:'#3498DB',frames:this.player.powerUpTimer.doublejump});
            if(this.player.powerUpTimer.shield>0) pus.push({label:'BD',color:'#F1C40F',frames:this.player.powerUpTimer.shield});
            if(this.player.powerUpTimer.speed>0) pus.push({label:'VT',color:'#E67E22',frames:this.player.powerUpTimer.speed});
            if(pus.length>0){
                ctx.font='bold 14px Arial';
                ctx.textAlign='center';
                const bw=50, gap=8;
                const totalW=pus.length*bw+(pus.length-1)*gap;
                let bx=this.W/2-totalW/2;
                const by=this.H-44;
                for(const pu of pus){
                    const pct=pu.frames/600;
                    // Fond
                    ctx.fillStyle='rgba(0,0,0,.8)';
                    this.roundRect(ctx,bx,by,bw,34,8);ctx.fill();
                    // Label
                    ctx.fillStyle=pu.color;
                    ctx.fillText(pu.label,bx+bw/2,by+12);
                    // Barre de temps
                    ctx.fillStyle=pu.color+'40';
                    this.roundRect(ctx,bx+6,by+22,bw-12,6,3);ctx.fill();
                    ctx.fillStyle=pu.color;
                    this.roundRect(ctx,bx+6,by+22,(bw-12)*pct,6,3);ctx.fill();
                    bx+=bw+gap;
                }
            }
        }

        ctx.restore();
    }
    niveauTermine() {
        this.audio.victoire();
        if (this.modeDemo) { setTimeout(() => { if (this.modeDemo) this._demoSuivant(); }, 900); this.etat = 'transition'; return; }
        if (this.modeTest) { if (navigator.vibrate) navigator.vibrate([100,50,100]); if (this._onTestFini) this._onTestFini(true); return; }
        this.etat='transition';
        this.scoreTotal+=this.scoreNiveau; this.tempsTotal+=this.tempsNiveau;
        // Débloquer le niveau suivant dès qu'on termine celui-ci
        this.progress.debloquer(this.niveauActuel + 1);
        // --- ÉTOILES : 3 = sans une égratignure, 2 = une seule, 1 = terminé ---
        let etoiles = 1;
        if (this.mortsNiveau === 0) etoiles = 3;
        else if (this.mortsNiveau <= 1) etoiles = 2;
        this.progress.enregistrerEtoiles(this.niveauActuel, etoiles);
        this._dernieresEtoiles = etoiles;
        // --- CONTRE-LA-MONTRE : meilleur temps + médaille 🥇🥈🥉 ---
        const nouveauRecord = this.progress.enregistrerTemps(this.niveauActuel, this.tempsNiveau);
        const medaille = medaillePour(this.niveauActuel, this.progress.tempsDe(this.niveauActuel));
        this._chronoInfo = { temps: this.tempsNiveau, record: nouveauRecord, medaille };
        // Bonus : +1 vie tous les 4 niveaux atteints (4, 8, 12, 16, 20, 24)
        const niveauAtteint = this.niveauActuel + 1;
        let bonusVie = false;
        if (niveauAtteint % 4 === 0) { this.vies++; this.updateHearts(); bonusVie = true; }
        if(navigator.vibrate)navigator.vibrate([100,50,100]);
        if(this.niveauActuel>=NIVEAUX.length-1){setTimeout(()=>this.victoireFinale(),800)}
        else{this.audio.transition();setTimeout(()=>{
            document.getElementById('trans-icon').textContent=NIVEAUX[this.niveauActuel].icon;
            const etoilesStr = '⭐'.repeat(this._dernieresEtoiles) + '☆'.repeat(3 - this._dernieresEtoiles);
            document.getElementById('trans-title').textContent=`Niveau ${this.niveauActuel+1} terminé !  ${etoilesStr}`;
            document.getElementById('trans-desc').textContent = bonusVie
                ? `❤️ +1 vie bonus ! • Prochain : ${NIVEAUX[this.niveauActuel+1].nom}`
                : `Prochain : ${NIVEAUX[this.niveauActuel+1].nom}`;
            document.getElementById('trans-coins').textContent=this.scoreTotal;
            document.getElementById('trans-time').textContent=this.tempsTotal.toFixed(1)+'s';
            // Chrono du niveau : temps + médaille + mention record + objectif suivant
            const ci = this._chronoInfo;
            const chronoEl = document.getElementById('trans-chrono');
            if (chronoEl && ci) {
                const s = seuilsMedailles(this.niveauActuel);
                let txt = `⏱️ Niveau : ${ci.temps.toFixed(1)}s`;
                if (ci.medaille) txt += `  ${MEDAILLE_EMOJI[ci.medaille]}`;
                if (ci.record) txt += `  🔥 RECORD !`;
                // Prochain objectif de médaille
                const best = this.progress.tempsDe(this.niveauActuel);
                if (ci.medaille !== 'or' && s) {
                    const cible = ci.medaille === 'argent' ? s.or : (ci.medaille === 'bronze' ? s.argent : s.bronze);
                    const emoji = ci.medaille === 'argent' ? '🥇' : (ci.medaille === 'bronze' ? '🥈' : '🥉');
                    txt += `<br><span style="opacity:.65;font-size:.85em">${emoji} à battre : ${cible}s (record : ${best.toFixed(1)}s)</span>`;
                }
                chronoEl.innerHTML = txt;
            }
            document.getElementById('transition-screen').classList.add('show');
        },500)}
    }
    niveauSuivant() { this.niveauActuel++; document.getElementById('transition-screen').classList.remove('show'); this.chargerNiveau(this.niveauActuel); }
    gameOver() {
        if (this.modeTest) { this.audio.degat(); if (this._onTestFini) this._onTestFini(false); return; }
        this.etat='gameover';
        const scoreFinal = this.scoreCumul;
        const tempsFinal = this.tempsTotal + this.tempsNiveau;
        const niveauAtteint = this.niveauActuel + 1;

        // Afficher les infos sur l'écran Game Over
        document.getElementById('go-level').textContent=`niveau ${niveauAtteint}`;
        const goStats = document.getElementById('go-stats');
        if (goStats) goStats.innerHTML = `⭐ Score : <strong style="color:#FFD700">${this.hs.calculerScore(scoreFinal, tempsFinal, this.vies, niveauAtteint)}</strong> • 🪙 ${this.piecesTotal} pièces • ⏱️ ${tempsFinal.toFixed(1)}s`;

        // Vérifier si le score mérite d'être enregistré
        if (this.hs.isHighScore(scoreFinal, tempsFinal, this.vies, niveauAtteint)) {
            this.tempsTotal = tempsFinal;
            this.afficherNameEntry();
        } else {
            // Afficher le Game Over + bouton pour voir les scores
            const goScoresBtn = document.getElementById('btn-go-scores');
            if (goScoresBtn) goScoresBtn.style.display = 'inline-block';
            const goRetry = document.getElementById('btn-retry');
            if (goRetry) goRetry.style.display = 'inline-block';
            setTimeout(()=>document.getElementById('gameover-screen').classList.add('show'),400);
        }
    }
    victoireFinale() {
        this.etat='win';
        this.progress.debloquer(NIVEAUX.length - 1); // tout débloqué
        this.scoreTotal = this.scoreTotal + this.scoreNiveau;
        this.tempsTotal = this.tempsTotal + this.tempsNiveau;
        // Toujours proposer l'enregistrement en cas de victoire
        if (this.hs.isHighScore(this.scoreCumul, this.tempsTotal, this.vies, NIVEAUX.length)) {
            this.afficherNameEntry();
        } else {
            this.afficherVictoire();
        }
    }
    afficherNameEntry() {
        document.getElementById('win-screen').classList.remove('show');
        document.getElementById('gameover-screen').classList.remove('show');
        this.nameEntry.afficher(this.piecesTotal, this.tempsTotal);
    }
    afficherVictoire() {
        document.getElementById('win-coins').textContent=this.piecesTotal;
        document.getElementById('win-time').textContent=this.tempsTotal.toFixed(1)+'s';
        document.getElementById('win-lives').textContent=this.vies;
        document.getElementById('win-screen').classList.add('show');
    }
    validerScore(nom) {
        const niveauAtteint = this.etat==='win'?NIVEAUX.length:this.niveauActuel+1;
        const score = this.hs.ajouter(nom, this.scoreCumul, this.tempsTotal, this.vies, niveauAtteint, this.piecesTotal);
        // Afficher le Hall of Fame avec le bouton "NOUVELLE PARTIE"
        afficherHallOfFame(this.hs);
        document.getElementById('btn-scores-back').style.display = 'none';
        document.getElementById('btn-scores-replay').style.display = 'inline-block';
        document.getElementById('scores-screen').classList.add('show');
    }
    // Réinitialise l'état d'une partie et charge le niveau demandé
    _resetPartie(idx) {
        this.niveauActuel=idx;this.scoreTotal=0;this.tempsTotal=0;this.vies=5;this.scoreCumul=0;this.piecesTotal=0;this.prochainPalierScore=5000;this.effets=[];
        document.getElementById('win-screen').classList.remove('show');
        document.getElementById('gameover-screen').classList.remove('show');
        document.getElementById('transition-screen').classList.remove('show');
        const goScoresBtn = document.getElementById('btn-go-scores');
        if (goScoresBtn) goScoresBtn.style.display = 'none';
        this.chargerNiveau(idx);
    }
    // Rejouer depuis le début SANS effacer la progression (Réessayer / Rejouer)
    redemarrer() { this._resetPartie(0); }
    // Reprendre à un niveau débloqué (bouton Continuer)
    demarrerAuNiveau(idx) {
        this._lastTime = undefined; this._accumulateur = 0;
        this._resetPartie(idx);
        if (!this._boucleLancee) { this._boucleLancee = true; requestAnimationFrame((t) => this.boucle(t)); }
    }
    // ── MODE DÉMO (« attract mode ») ─────────────────────────
    // Le jeu se joue tout seul sur une playlist de niveaux, avec
    // invincibilité (aucun impact sur la progression sauvegardée).
    demarrerDemo(playlist) {
        this.modeDemo = true;
        this._demoPlaylist = playlist;
        this._demoIdx = 0;
        this._demoBot = new DemoBot();
        this._demoDernierePiece = 0;
        this.demarrerAuNiveau(playlist[0]);
    }
    // Niveau de démo suivant (ou fin de la démo)
    _demoSuivant() {
        this._demoIdx++;
        if (this._demoIdx >= this._demoPlaylist.length) { this.quitterDemo(); return; }
        this._demoBot.reset();
        this._demoDernierePiece = 0;
        this._lastTime = undefined; this._accumulateur = 0;
        this.chargerNiveau(this._demoPlaylist[this._demoIdx]);
    }
    quitterDemo() {
        if (!this.modeDemo) return;
        this.modeDemo = false;
        this.retourMenu();
    }
    // Nouvelle partie depuis le menu : efface la progression sauvegardée
    nouvellePartie() {
        this.progress.reinitialiser();
        this.demarrerAuNiveau(0);
    }
    pause() {
        if (this.etat !== 'playing') return;
        this.etat = 'paused';
        // Relâcher les inputs pour ne pas rester « collé » à la reprise
        this.touches.left = this.touches.right = this.touches.jump = false;
        document.getElementById('pause-overlay').classList.add('show');
        document.getElementById('btn-pause').textContent = '▶';
    }
    reprendre() {
        if (this.etat !== 'paused') return;
        this.etat = 'playing';
        document.getElementById('pause-overlay').classList.remove('show');
        document.getElementById('btn-pause').textContent = '⏸';
        this.audio.resume();
    }
    quitterVersMenu() { this.retourMenu(); }
    // Retour au menu principal depuis n'importe quel écran ; rafraîchit le bouton Continuer
    retourMenu() {
        // Si un test d'éditeur est en cours, revenir à l'éditeur, pas au menu
        if (this.modeTest && this._editor) {
            document.getElementById('pause-overlay').classList.remove('show');
            document.getElementById('btn-pause').textContent = '⏸';
            this._editor.finTest();
            return;
        }
        this.etat = 'menu';
        if (this.audio) this.audio.arreterMusique();
        ['pause-overlay','win-screen','gameover-screen','transition-screen','scores-screen']
            .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('show'); });
        document.getElementById('btn-pause').textContent = '⏸';
        document.getElementById('game-wrapper').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        if (this._rafraichirMenu) this._rafraichirMenu();
    }
    boucle(now) {
        if (this._lastTime === undefined) this._lastTime = now;
        let frameTime = (now - this._lastTime) / 1000;
        this._lastTime = now;
        // Garde-fou : après un onglet en arrière-plan, éviter une avalanche d'updates
        if (frameTime > 0.25) frameTime = 0.25;
        this._accumulateur = (this._accumulateur || 0) + frameTime;
        const PAS = 1 / 60;
        let n = 0;
        // En pause / transition / menu : on ne simule pas, et on ne laisse pas
        // l'accumulateur gonfler (sinon rattrapage brutal à la reprise).
        // L'état 'mort' DOIT continuer à simuler (animation des débris avant game over).
        if (this.etat !== 'playing' && this.etat !== 'mort') this._accumulateur = 0;
        try {
            while (this._accumulateur >= PAS && n < 5) {
                this.update();
                this._accumulateur -= PAS;
                n++;
            }
            if (this.etat === 'playing' || this.etat === 'mort' || (this.modeTest && document.getElementById('game-wrapper').style.display !== 'none')) {
                this.dessiner();
            }
        } catch(err) {
            console.error('[Game] Crash dans la boucle:', err);
            // Si on est en mode test, revenir à l'éditeur proprement
            if (this.modeTest && this._editor) {
                this._editor.finTest();
                alert('⚠️ Le niveau a rencontré une erreur :\n' + err.message + '\n\nVérifie les propriétés des objets (distances, vitesses).');
            }
            this.etat = 'menu';
        }
        requestAnimationFrame((t) => this.boucle(t));
    }
    demarrer() { this.demarrerAuNiveau(0); }
}

// ============================================================
//  AFFICHAGE HALL OF FAME
// ============================================================
