/* Player — Pixou */
import { nuancer } from './skins.js';

export class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.largeur = 30; this.hauteur = 30;
        this.vx = 0; this.vy = 0;
        this.vitesseMax = 4.5; this.acceleration = 0.5; this.friction = 0.75;
        this.forceSaut = -10.5;    // Impulsion de saut de base (assez pour les petites marches)
        this.boostSaut = -0.5;     // Boost par frame si on maintient (annule ~80% de la gravité)
        this.dureeBoostMax = 12;   // Frames pendant lesquelles le boost s'applique
        this.chuteMax = 16;
        this.onGround = false; this.sauteEncore = false; this.direction = 1;
        this.invincible = 0;
        this.tempsAppuiSaut = 0;
        this.jumpHeldPrev = false;  // État de la touche saut à la frame précédente (edge-detection)
        this.coyoteTimer = 0;       // Frames restantes pour sauter après avoir quitté le sol
        this.coyoteMax = 6;         // ~0.1s de tolérance
        this.jumpBuffer = 0;        // Mémorise un appui fait juste avant d'atterrir
        this.jumpBufferMax = 6;
        this.frameAnim = 0;         // Compteur pour l'animation du personnage
        this.checkpointX = x; this.checkpointY = y;
        // --- POWER-UPS ---
        this.dejaDoubleJump = false;         // A déjà utilisé le double saut dans ce saut
        this.powerUpTimer = { doublejump: 0, shield: 0, speed: 0 }; // Durée restante (en frames)
        this.dureePowerUp = 600;             // 10 secondes à 60fps
        this.vitesseMaxNormale = 4.5;        // Sauvegardé pour le boost de vitesse
        this.accelerationNormale = 0.5;
        // --- EXPRESSIONS & SQUASH/STRETCH ---
        this.expression = 'normal';   // normal | joy | hurt | scared | win
        this.expressionTimer = 0;     // frames restantes avant retour à normal
        this.sx = 1; this.sy = 1;     // facteurs d'échelle squash&stretch (rendu uniquement)
        this.auSolPrev = false;       // état au sol frame précédente (détection atterrissage)
        this._lastVy = 0;             // vy frame précédente (impact d'atterrissage)
    }
    // Fixe une expression prioritaire (ne remplace pas une expression plus longue en cours)
    setExpression(e, duree) { if (duree >= this.expressionTimer) { this.expression = e; this.expressionTimer = duree; } }
    update(touches, audio, niveau, ennemis, pics) {
        this.frameAnim++;
        // --- DÉCRÉMENTER LE TIMER D'EXPRESSION ---
        if (this.expressionTimer > 0) { this.expressionTimer--; if (this.expressionTimer === 0) this.expression = 'normal'; }
        // --- DÉCRÉMENTER LES TIMERS DE POWER-UPS ---
        if (this.powerUpTimer.doublejump > 0) this.powerUpTimer.doublejump--;
        if (this.powerUpTimer.shield > 0) this.powerUpTimer.shield--;
        if (this.powerUpTimer.speed > 0) this.powerUpTimer.speed--;
        // Appliquer le boost de vitesse dynamiquement
        if (this.powerUpTimer.speed > 0) { this.vitesseMax = 6.5; this.acceleration = 0.7; }
        else { this.vitesseMax = this.vitesseMaxNormale; this.acceleration = this.accelerationNormale; }

        // --- PORTER LE JOUEUR PAR LES PLATEFORMES MOBILES (AVANT la physique) ---
        // On utilise l'état onGround de la frame précédente pour suivre la plateforme
        if (this.onGround) {
            for (const p of niveau) {
                if (p.dx !== undefined &&
                    this.x + this.largeur > p.x + 2 && this.x < p.x + p.largeur - 2 &&
                    Math.abs((this.y + this.hauteur) - p.y) < 12) {
                    this.x += p.dx;
                    if (p.dy) this.y += p.dy;
                }
            }
        }
        if (touches.left) { this.vx -= this.acceleration; this.direction = -1; }
        else if (touches.right) { this.vx += this.acceleration; this.direction = 1; }
        else { this.vx *= this.friction; if (Math.abs(this.vx) < 0.1) this.vx = 0; }
        this.vx = Math.max(-this.vitesseMax, Math.min(this.vitesseMax, this.vx));
        // Détection du front montant : la touche vient juste d'être pressée cette frame
        const jumpPressedThisFrame = touches.jump && !this.jumpHeldPrev;

        // Recharge du coyote time tant qu'on est au sol ; sinon il s'épuise
        if (this.onGround) this.coyoteTimer = this.coyoteMax;
        else if (this.coyoteTimer > 0) this.coyoteTimer--;

        // Jump buffer : un appui s'arme, puis se consomme à l'atterrissage
        if (jumpPressedThisFrame) this.jumpBuffer = this.jumpBufferMax;
        else if (this.jumpBuffer > 0) this.jumpBuffer--;

        const veutSauter = jumpPressedThisFrame || this.jumpBuffer > 0;
        const peutSauterSol = this.onGround || this.coyoteTimer > 0;

        // --- SAUT DYNAMIQUE (hold = plus haut, release = plus court) ---
        if (veutSauter && peutSauterSol && !this.sauteEncore) {
            this.vy = this.forceSaut;
            this.onGround = false;
            this.sauteEncore = true;
            this.tempsAppuiSaut = 0;
            this.dejaDoubleJump = false;
            this.coyoteTimer = 0;   // consommé
            this.jumpBuffer = 0;    // consommé
            audio.saut();
        }
        // --- DOUBLE SAUT : déclenché par un NOUVEL appui en l'air (power-up actif) ---
        else if (jumpPressedThisFrame && !this.onGround &&
            this.powerUpTimer.doublejump > 0 && !this.dejaDoubleJump) {
            this.vy = this.forceSaut * 0.9;
            this.sauteEncore = true;
            this.tempsAppuiSaut = 0;
            this.dejaDoubleJump = true;
            this.jumpBuffer = 0;
            audio.saut();
            if (navigator.vibrate) navigator.vibrate(20);
        }

        this.jumpHeldPrev = touches.jump;

        // Pendant la montée (vy < 0) :
        // - Si on MAINTIENT le saut → on applique un boost qui annule une partie de la gravité
        //   → le joueur monte plus haut et plus longtemps
        // - Si on RELÂCHE → on coupe la vélocité pour un saut court
        if (this.sauteEncore && this.vy < 0) {
            if (touches.jump && this.tempsAppuiSaut < this.dureeBoostMax) {
                this.tempsAppuiSaut++;
                this.vy += this.boostSaut; // boost négatif (vers le haut), annule ~80% de la gravité 0.6
            } else if (!touches.jump) {
                this.vy *= 0.4;
                this.sauteEncore = false;
            }
        }

        if (this.onGround) this.sauteEncore = false;
        if (this.onGround) this.dejaDoubleJump = false;
        this.vy += 0.6;
        if (this.vy > this.chuteMax) this.vy = this.chuteMax;
        this.onGround = false;
        this.x += this.vx;
        for (const p of niveau) {
            if (this.collisionAABB(p)) {
                if (this.vx > 0) this.x = p.x - this.largeur;
                else if (this.vx < 0) this.x = p.x + p.largeur;
                this.vx = 0;
            }
        }
        for (const e of ennemis) { if (!e.mort && this.collisionAABB(e) && this.invincible <= 0 && this.powerUpTimer.shield <= 0) return 'degat'; }
        for (const s of pics) { if (this.collisionAABB(s) && this.invincible <= 0 && this.powerUpTimer.shield <= 0) return 'degat'; }
        this.y += this.vy;
        for (const p of niveau) {
            if (this.collisionAABB(p)) {
                if (this.vy > 0) { this.y = p.y - this.hauteur; this.vy = 0; this.onGround = true; }
                else if (this.vy < 0) { this.y = p.y + p.hauteur; this.vy = 0; }
            }
        }
        for (const e of ennemis) {
            if (e.mort) continue;
            if (this.collisionAABB(e)) {
                // Ennemis écrasables (normaux + sauteurs) : on peut les écraser en tombant dessus
                if (e.ecrasable !== false && this.vy > 2 && (this.y + this.hauteur - e.y) < 20) {
                    e.mort = true; this.vy = this.forceSaut * 0.7; audio.ecrase();
                    this.ennemisEcrases = (this.ennemisEcrases || 0) + 1;
                    if (navigator.vibrate) navigator.vibrate(40);
                } else if (this.invincible <= 0 && this.powerUpTimer.shield <= 0) return 'degat';
            }
        }
        for (const s of pics) { if (this.collisionAABB(s) && this.invincible <= 0 && this.powerUpTimer.shield <= 0) return 'degat'; }
        const mW = this.mondeW || 800, mH = this.mondeH || 600;
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.largeur > mW) { this.x = mW - this.largeur; this.vx = 0; }
        if (this.y > mH + 50) return 'trou';
        if (this.y < 0) { this.y = 0; this.vy = 0; }
        if (this.invincible > 0) this.invincible--;
        // --- SQUASH & STRETCH (rendu uniquement, n'affecte pas la collision) ---
        // Atterrissage après une chute → aplatissement ; saut vers le haut → étirement
        if (!this.auSolPrev && this.onGround && this._lastVy > 6) { this.sx = 1.25; this.sy = 0.78; }
        else if (this.vy < -6) { this.sx = 0.85; this.sy = 1.15; }
        // Ease progressif vers la forme neutre
        this.sx += (1 - this.sx) * 0.18;
        this.sy += (1 - this.sy) * 0.18;
        this.auSolPrev = this.onGround;
        this._lastVy = this.vy;
        return null;
    }
    collisionAABB(o) {
        return this.x < o.x + (o.largeur||o.w) && this.x + this.largeur > o.x &&
               this.y < o.y + (o.hauteur||o.h) && this.y + this.hauteur > o.y;
    }
    dessiner(ctx) {
        // Skin (🎨 boutique) en tête : utilisé par les pieds AVANT le corps
        const skin = this.skin || {};
        // --- AURA BOUCLIER (si power-up shield actif) ---
        if (this.powerUpTimer.shield > 0) {
            const flicker = this.powerUpTimer.shield < 120 ? (Math.floor(this.powerUpTimer.shield / 8) % 2 === 0 ? 0.3 : 0.6) : 0.5;
            ctx.globalAlpha = flicker;
            const grad = ctx.createRadialGradient(this.x + this.largeur / 2, this.y + this.hauteur / 2, 0, this.x + this.largeur / 2, this.y + this.hauteur / 2, this.largeur);
            grad.addColorStop(0, 'rgba(241,196,15,.4)');
            grad.addColorStop(1, 'rgba(241,196,15,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(this.x + this.largeur / 2, this.y + this.hauteur / 2, this.largeur, 0, 6.28); ctx.fill();
            ctx.strokeStyle = 'rgba(241,196,15,.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(this.x + this.largeur / 2, this.y + this.hauteur / 2, this.largeur - 2, 0, 6.28); ctx.stroke();
            ctx.globalAlpha = 1;
        }
        // --- AURA VITESSE (si power-up speed actif) ---
        if (this.powerUpTimer.speed > 0 && Math.abs(this.vx) > 1) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#E67E22';
            const tx = this.vx > 0 ? this.x - 8 : this.x + this.largeur - 2;
            ctx.fillRect(tx, this.y + 4, 10, 4);
            ctx.fillRect(tx + 2, this.y + 12, 8, 4);
            ctx.fillRect(tx + 4, this.y + 20, 6, 4);
            ctx.globalAlpha = 1;
        }
        // --- AURA DOUBLE SAUT (si actif et en l'air) ---
        if (this.powerUpTimer.doublejump > 0 && !this.onGround && !this.dejaDoubleJump) {
            ctx.globalAlpha = 0.5;
            ctx.strokeStyle = '#3498DB'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(this.x + this.largeur / 2, this.y + this.hauteur / 2, this.largeur, 0, 6.28); ctx.stroke();
            ctx.globalAlpha = 1;
        }
        // Invincibilité : semi-transparent au lieu de complètement invisible (évite le flash)
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        }
        // === PERSONNAGE « Pixou » — design original, expressif et animé ===
        const x = this.x, y = this.y, L = this.largeur, H = this.hauteur;
        const dir = this.direction > 0 ? 1 : -1;
        const cx = x + L / 2, cy = y + H / 2;
        // Animation de course : balancement des pieds quand on bouge au sol
        const court = this.onGround && Math.abs(this.vx) > 0.5;
        const phase = court ? Math.sin(this.frameAnim * 0.4) : 0;
        const enLair = !this.onGround;
        const expr = this.expression;

        // --- Squash & stretch : déformation du corps autour de son centre ---
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.sx, this.sy);
        ctx.translate(-cx, -cy);

        // --- Petits pieds (jaunes) qui s'animent ---
        ctx.fillStyle = skin.pieds || '#F1C40F';
        if (enLair) {
            // pieds repliés en saut
            ctx.fillRect(x + 3, y + H - 3, 8, 4);
            ctx.fillRect(x + L - 11, y + H - 3, 8, 4);
        } else {
            const f1 = phase * 3, f2 = -phase * 3;
            ctx.fillRect(x + 3, y + H - 2 + f1, 9, 4);
            ctx.fillRect(x + L - 12, y + H - 2 + f2, 9, 4);
        }

        // --- Corps arrondi (rouge, dégradé léger) ---
        // --- Skin (🎨 boutique) : couleurs du corps équipées ---
        const cHaut = skin.haut || '#FF6B5C', cBas = skin.bas || '#E74C3C', cBord = skin.bord || '#C0392B';
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + H);
        bodyGrad.addColorStop(0, cHaut);
        bodyGrad.addColorStop(1, cBas);
        ctx.fillStyle = bodyGrad;
        this._rr(ctx, x, y + 3, L, H - 4, 7); ctx.fill();
        ctx.strokeStyle = cBord; ctx.lineWidth = 2;
        this._rr(ctx, x, y + 3, L, H - 4, 7); ctx.stroke();

        // --- Chapeau selon le skin (casquette turquoise par défaut) ---
        this._casq = skin.casq;
        this._dessinerChapeau(ctx, skin.chapeau || 'casquette', x, y, L, cx, dir);

        // --- Yeux & bouche : expression contextuelle ---
        const eyeY = y + 13;
        const e1 = cx - 7, e2 = cx + 1; // base des deux yeux
        const cligne = (this.frameAnim % 200) < 6;
        const pdx = dir * 1.6;
        ctx.strokeStyle = cBord; ctx.lineWidth = 1.5; ctx.fillStyle = cBord;
        if (expr === 'hurt') {
            // Yeux en X (deux traits croisés par œil)
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(e1, eyeY + 1); ctx.lineTo(e1 + 6, eyeY + 7);
            ctx.moveTo(e1 + 6, eyeY + 1); ctx.lineTo(e1, eyeY + 7);
            ctx.moveTo(e2, eyeY + 1); ctx.lineTo(e2 + 6, eyeY + 7);
            ctx.moveTo(e2 + 6, eyeY + 1); ctx.lineTo(e2, eyeY + 7);
            ctx.stroke();
            ctx.lineWidth = 1.5;
            // Bouche froncée (arc vers le bas)
            ctx.beginPath(); ctx.arc(cx, y + H - 5, 3, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
        } else if (expr === 'joy' || expr === 'win') {
            // Yeux en arcs joyeux ^^
            const w = expr === 'win' ? 5 : 4;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(e1 + 3, eyeY + 5, w, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.arc(e2 + 3, eyeY + 5, w, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke();
            ctx.lineWidth = 1.5;
            // Grand sourire ouvert
            const r = expr === 'win' ? 5 : 4;
            ctx.beginPath(); ctx.arc(cx, y + H - 11, r, 0.1 * Math.PI, 0.9 * Math.PI); ctx.fill();
        } else if (expr === 'scared') {
            // Yeux agrandis + grosses pupilles
            ctx.fillStyle = '#FFF';
            ctx.beginPath(); ctx.ellipse(e1 + 3, eyeY + 3, 4, 4.5, 0, 0, 6.28); ctx.fill();
            ctx.beginPath(); ctx.ellipse(e2 + 3, eyeY + 3, 4, 4.5, 0, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath(); ctx.arc(e1 + 3 + pdx, eyeY + 3, 2.4, 0, 6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(e2 + 3 + pdx, eyeY + 3, 2.4, 0, 6.28); ctx.fill();
            // Petit O de surprise
            ctx.beginPath(); ctx.arc(cx, y + H - 8, 2.2, 0, 6.28); ctx.fill();
            // Goutte de sueur
            ctx.fillStyle = 'rgba(133,193,233,.8)';
            ctx.beginPath(); ctx.arc(x + L - 3, y + 8, 2, 0, 6.28); ctx.fill();
        } else {
            // 'normal' : yeux blancs + pupilles directionnelles + clignement
            ctx.fillStyle = '#FFF';
            if (cligne) {
                ctx.fillRect(e1, eyeY + 3, 6, 1.5); ctx.fillRect(e2, eyeY + 3, 6, 1.5);
            } else {
                ctx.beginPath(); ctx.ellipse(e1 + 3, eyeY + 3, 3.2, 4, 0, 0, 6.28); ctx.fill();
                ctx.beginPath(); ctx.ellipse(e2 + 3, eyeY + 3, 3.2, 4, 0, 0, 6.28); ctx.fill();
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath(); ctx.arc(e1 + 3 + pdx, eyeY + 4, 1.8, 0, 6.28); ctx.fill();
                ctx.beginPath(); ctx.arc(e2 + 3 + pdx, eyeY + 4, 1.8, 0, 6.28); ctx.fill();
            }
            // Bouche : sourire au sol, petit « o » en saut
            if (enLair) {
                ctx.beginPath(); ctx.arc(cx, y + H - 7, 1.8, 0, 6.28); ctx.fill();
            } else {
                ctx.beginPath(); ctx.arc(cx, y + H - 9, 3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
            }
        }
        // petites joues
        ctx.fillStyle = 'rgba(255,150,150,.5)';
        ctx.beginPath(); ctx.arc(cx - 9, y + H - 9, 2, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 9, y + H - 9, 2, 0, 6.28); ctx.fill();

        // --- Lunettes de soleil 🕶️ (skin) : par-dessus les yeux ---
        if (skin.lunettes) {
            ctx.fillStyle = '#1a1a2e';
            this._rr(ctx, cx - 10, eyeY, 8.5, 6.5, 2.5); ctx.fill();
            this._rr(ctx, cx + 1.5, eyeY, 8.5, 6.5, 2.5); ctx.fill();
            ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(cx - 1.5, eyeY + 2.5); ctx.lineTo(cx + 1.5, eyeY + 2.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 10, eyeY + 2); ctx.lineTo(x - 1, eyeY + 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 10, eyeY + 2); ctx.lineTo(x + L + 1, eyeY + 1); ctx.stroke();
            // reflet
            ctx.fillStyle = 'rgba(255,255,255,.35)';
            ctx.fillRect(cx - 8.5, eyeY + 1.5, 2.5, 1.5);
            ctx.fillRect(cx + 3, eyeY + 1.5, 2.5, 1.5);
        }

        ctx.restore();  // fin squash & stretch

        ctx.globalAlpha = 1;
    }
    // --- Chapeaux (🎨 boutique) ---
    _dessinerChapeau(ctx, type, x, y, L, cx, dir) {
        if (type === 'aucun') return;
        if (type === 'couronne') {
            // Couronne dorée : bandeau + 3 pointes + joyaux
            ctx.fillStyle = '#F1C40F';
            ctx.fillRect(x + 3, y + 1, L - 6, 6);
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 1); ctx.lineTo(x + 6.5, y - 6); ctx.lineTo(x + 10, y + 1);
            ctx.lineTo(cx - 3, y + 1); ctx.lineTo(cx, y - 8); ctx.lineTo(cx + 3, y + 1);
            ctx.lineTo(x + L - 10, y + 1); ctx.lineTo(x + L - 6.5, y - 6); ctx.lineTo(x + L - 3, y + 1);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#B7950B'; ctx.lineWidth = 1;
            ctx.strokeRect(x + 3, y + 1, L - 6, 6);
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath(); ctx.arc(cx, y + 4, 1.6, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#3498DB';
            ctx.beginPath(); ctx.arc(x + 8, y + 4, 1.3, 0, 6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(x + L - 8, y + 4, 1.3, 0, 6.28); ctx.fill();
            return;
        }
        if (type === 'fete') {
            // Cône de fête rayé + pompon
            ctx.fillStyle = '#E67E22';
            ctx.beginPath(); ctx.moveTo(cx - 8, y + 3); ctx.lineTo(cx + 8, y + 3); ctx.lineTo(cx, y - 13); ctx.closePath(); ctx.fill();
            ctx.save();
            ctx.beginPath(); ctx.moveTo(cx - 8, y + 3); ctx.lineTo(cx + 8, y + 3); ctx.lineTo(cx, y - 13); ctx.closePath(); ctx.clip();
            ctx.fillStyle = '#F4D03F';
            ctx.fillRect(cx - 9, y - 4, 18, 3.5);
            ctx.fillRect(cx - 9, y - 11, 18, 3.5);
            ctx.restore();
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath(); ctx.arc(cx, y - 13, 2.5, 0, 6.28); ctx.fill();
            return;
        }
        if (type === 'magicien') {
            // Chapeau de magicien : large bord + cône bleu nuit étoilé
            ctx.fillStyle = '#2C3E50';
            this._rr(ctx, x - 4, y + 2, L + 8, 5, 2.5); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx - 9, y + 3); ctx.lineTo(cx + 9, y + 3); ctx.lineTo(cx + 2 * dir, y - 14); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#F4D03F';
            const et = (ex, ey, r) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); };
            et(cx - 3, y - 4, 2.2); et(cx + 4, y - 9, 1.7);
            return;
        }
        // Casquette (turquoise par défaut — libre avec le Studio 🌈)
        const casq = this._casq || '#16A085';
        ctx.fillStyle = casq;
        this._rr(ctx, x - 1, y, L + 2, 9, 4); ctx.fill();
        // visière orientée selon la direction (nuance plus sombre)
        ctx.fillStyle = nuancer(casq, -0.15);
        if (dir > 0) { this._rr(ctx, x + L - 4, y + 5, 9, 4, 2); ctx.fill(); }
        else { this._rr(ctx, x - 5, y + 5, 9, 4, 2); ctx.fill(); }
        // pompon (nuance plus claire)
        ctx.fillStyle = nuancer(casq, 0.25);
        ctx.beginPath(); ctx.arc(cx, y, 2.5, 0, 6.28); ctx.fill();
    }
    // Helper : tracé d'un rectangle à coins arrondis
    _rr(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
    subirDegat() { this.invincible = 90; this.x = this.checkpointX; this.y = this.checkpointY; this.vx = 0; this.vy = 0; this.expression = 'hurt'; this.expressionTimer = 90; }
}

// ============================================================
//  PLATFORM / MOVING PLATFORM / SPIKE / ENNEMY / COIN
// ============================================================
