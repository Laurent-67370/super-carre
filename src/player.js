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

        // --- Pieds animés (chaussures 🎨 boutique) ---
        // Les pieds Basiques restent DERRIÈRE le corps (look d'origine).
        // Les modèles à tige (santiags, rollers…) seront dessinés DEVANT
        // le corps, sinon leur partie montante serait masquée.
        const modelePied = skin.chaussures || 'basiques';
        const piedsBaseY = enLair ? y + H - 3 : y + H - 2;
        const piedsF1 = enLair ? 0 : phase * 3, piedsF2 = enLair ? 0 : -phase * 3;
        if (modelePied === 'basiques') {
            this._dessinerPied(ctx, modelePied, x + 3, piedsBaseY + piedsF1, dir, skin.pieds);
            this._dessinerPied(ctx, modelePied, x + L - 12, piedsBaseY + piedsF2, dir, skin.pieds);
        }

        // --- Corps arrondi (rouge, dégradé léger) ---
        // --- Skin (🎨 boutique) : couleurs du corps équipées ---
        const cHaut = skin.haut || '#FF6B5C', cBas = skin.bas || '#E74C3C', cBord = skin.bord || '#C0392B';
        // Costumes ARRIÈRE (cape, sac, jetpack) : derrière le corps
        this._animT = (this._animT || 0) + 1;
        if (skin.costume === 'cape') this._dessinerCape(ctx, x, y, L, H, dir);
        else if (skin.costume === 'sac') this._dessinerSac(ctx, x, y, L, H, dir);
        else if (skin.costume === 'jetpack') this._dessinerJetpack(ctx, x, y, L, H, dir);
        const bodyGrad = ctx.createLinearGradient(x, y, x, y + H);
        bodyGrad.addColorStop(0, cHaut);
        bodyGrad.addColorStop(1, cBas);
        ctx.fillStyle = bodyGrad;
        this._rr(ctx, x, y + 3, L, H - 4, 7); ctx.fill();
        ctx.strokeStyle = cBord; ctx.lineWidth = 2;
        this._rr(ctx, x, y + 3, L, H - 4, 7); ctx.stroke();

        // Chaussures à modèle : DEVANT le corps (tiges visibles)
        if (modelePied !== 'basiques') {
            this._dessinerPied(ctx, modelePied, x + 3, piedsBaseY + piedsF1, dir, skin.pieds);
            this._dessinerPied(ctx, modelePied, x + L - 12, piedsBaseY + piedsF2, dir, skin.pieds);
        }

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

        // --- Costume (🎨 boutique) : nœud, écharpe, ceinture ---
        this._dessinerCostume(ctx, skin.costume, x, y, L, H, cx, dir);

        // --- Lunettes (skin) : par-dessus les yeux ---
        const lun = skin.lunettes === true ? 'soleil' : (skin.lunettes || 'aucune');
        if (lun === 'soleil') {
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
        } else if (lun === 'rondes') {
            // Lunettes rondes de savant : fine monture métallique
            ctx.strokeStyle = '#2C3E50'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.arc(cx - 5.5, eyeY + 3, 4.6, 0, 6.28); ctx.stroke();
            ctx.beginPath(); ctx.arc(cx + 5.5, eyeY + 3, 4.6, 0, 6.28); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 1, eyeY + 2); ctx.quadraticCurveTo(cx, eyeY + 0.5, cx + 1, eyeY + 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 10, eyeY + 2.5); ctx.lineTo(x - 1, eyeY + 1.5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 10, eyeY + 2.5); ctx.lineTo(x + L + 1, eyeY + 1.5); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,.18)';
            ctx.beginPath(); ctx.arc(cx - 5.5, eyeY + 3, 4, 0, 6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 5.5, eyeY + 3, 4, 0, 6.28); ctx.fill();
        } else if (lun === 'troisD') {
            // Lunettes 3D rétro : monture blanche, verres rouge et cyan
            ctx.fillStyle = '#fff';
            this._rr(ctx, cx - 11, eyeY - 0.5, 22, 8, 2); ctx.fill();
            ctx.fillStyle = 'rgba(231,76,60,.75)';
            this._rr(ctx, cx - 9.5, eyeY + 1, 8, 5, 1.5); ctx.fill();
            ctx.fillStyle = 'rgba(52,152,219,.75)';
            this._rr(ctx, cx + 1.5, eyeY + 1, 8, 5, 1.5); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(cx - 11, eyeY + 2); ctx.lineTo(x - 1, eyeY + 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 11, eyeY + 2); ctx.lineTo(x + L + 1, eyeY + 1); ctx.stroke();
        } else if (lun === 'etoiles') {
            // Lunettes étoiles de star : montures en étoile dorées
            const etoile = (ex, ey, r) => {
                ctx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const a = -Math.PI / 2 + i * Math.PI / 5;
                    const rr2 = i % 2 === 0 ? r : r * 0.45;
                    ctx.lineTo(ex + Math.cos(a) * rr2, ey + Math.sin(a) * rr2);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            };
            ctx.fillStyle = '#F4D03F'; ctx.strokeStyle = '#B7950B'; ctx.lineWidth = 1;
            etoile(cx - 5.5, eyeY + 3, 6.5);
            etoile(cx + 5.5, eyeY + 3, 6.5);
            ctx.fillStyle = 'rgba(26,26,46,.8)';
            ctx.beginPath(); ctx.arc(cx - 5.5, eyeY + 3, 2.6, 0, 6.28); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 5.5, eyeY + 3, 2.6, 0, 6.28); ctx.fill();
        }

        ctx.restore();  // fin squash & stretch

        ctx.globalAlpha = 1;
    }
    // --- Chaussures (🎨 boutique) : un pied ~9×4 à (fx, fy) ---
    _dessinerPied(ctx, modele, fx, fy, dir, couleur) {
        if (modele === 'baskets') {
            // Basket blanche : semelle grise, bande rouge
            ctx.fillStyle = '#fff';
            this._rr(ctx, fx - 0.5, fy - 1.5, 10, 5, 2); ctx.fill();
            ctx.fillStyle = '#BDC3C7';
            ctx.fillRect(fx - 0.5, fy + 2.4, 10, 1.4);
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath(); ctx.moveTo(fx + 2, fy - 1.2); ctx.lineTo(fx + 5, fy - 1.2); ctx.lineTo(fx + 3.5, fy + 2); ctx.lineTo(fx + 1, fy + 2); ctx.closePath(); ctx.fill();
            return;
        }
        if (modele === 'santiags') {
            // Santiag brune : tige montante, talon, surpiqûre dorée
            ctx.fillStyle = '#8E5B3A';
            this._rr(ctx, fx + 0.5, fy - 5, 8, 6, 1.5); ctx.fill();       // tige
            ctx.fillStyle = '#7A4A2B';
            this._rr(ctx, fx - 1 + (dir > 0 ? 0 : 1), fy - 0.5, 11, 4, 1.5); ctx.fill(); // pied
            ctx.fillStyle = '#4E342E';
            ctx.fillRect(fx + (dir > 0 ? 0 : 7), fy + 2.6, 3, 1.6);        // talon
            ctx.strokeStyle = '#F4D03F'; ctx.lineWidth = 0.9;
            ctx.beginPath(); ctx.moveTo(fx + 2, fy - 3.4); ctx.lineTo(fx + 4.5, fy - 2); ctx.lineTo(fx + 7, fy - 3.4); ctx.stroke();
            return;
        }
        if (modele === 'palmes') {
            // Palme verte : longue nageoire orientée vers l'avant + striures
            const av = dir > 0 ? 1 : -1;
            ctx.fillStyle = '#28B463';
            ctx.beginPath();
            ctx.moveTo(fx + (av > 0 ? 0 : 9), fy - 1);
            ctx.lineTo(fx + 4.5 + av * 11, fy - 0.5);
            ctx.quadraticCurveTo(fx + 4.5 + av * 13, fy + 1.5, fx + 4.5 + av * 11, fy + 3.5);
            ctx.lineTo(fx + (av > 0 ? 0 : 9), fy + 4);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#1D8348';
            this._rr(ctx, fx, fy - 1, 9, 5, 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.8;
            for (const d2 of [4, 7, 10]) {
                ctx.beginPath(); ctx.moveTo(fx + 4.5 + av * d2, fy); ctx.lineTo(fx + 4.5 + av * d2, fy + 3); ctx.stroke();
            }
            return;
        }
        if (modele === 'rollers') {
            // Roller violet : botte + deux roues turquoise
            ctx.fillStyle = '#8E44AD';
            this._rr(ctx, fx, fy - 3.5, 9, 5.5, 2); ctx.fill();
            ctx.fillStyle = '#6C3483';
            ctx.fillRect(fx, fy + 0.8, 9, 1.4);
            for (const wx of [fx + 2.2, fx + 6.8]) {
                ctx.fillStyle = '#1ABC9C';
                ctx.beginPath(); ctx.arc(wx, fy + 3.6, 1.9, 0, 6.28); ctx.fill();
                ctx.fillStyle = '#0E6655';
                ctx.beginPath(); ctx.arc(wx, fy + 3.6, 0.8, 0, 6.28); ctx.fill();
            }
            return;
        }
        // Basiques : le petit pied d'origine (couleur libre via le Studio 🌈)
        ctx.fillStyle = couleur || '#F1C40F';
        ctx.fillRect(fx, fy, 9, 4);
    }
    // --- Costumes (🎨 boutique) ---
    _dessinerCape(ctx, x, y, L, H, dir) {
        // Cape rouge qui flotte du côté opposé à la direction
        const onde = Math.sin(this._animT * 0.15) * 3;
        const vit = Math.min(Math.abs(this.vx || 0), 5);
        const ampleur = 10 + vit * 2.2;
        const ax = dir > 0 ? x + 3 : x + L - 3; // attache épaule
        const bx = ax - dir * ampleur;          // bas de cape
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.moveTo(ax - 2 * dir, y + 7);
        ctx.quadraticCurveTo(bx - 4 * dir, y + 12 + onde * 0.4, bx, y + H - 5 + onde);
        ctx.lineTo(bx + dir * 6, y + H - 2 + onde * 0.6);
        ctx.quadraticCurveTo(ax - dir * 3, y + H - 6, ax + 2 * dir, y + H - 10);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#922B21'; ctx.lineWidth = 1.4;
        ctx.stroke();
    }
    _dessinerSac(ctx, x, y, L, H, dir) {
        // Sac à dos d'aventurier : dans le dos, côté opposé à la direction
        const sx = dir > 0 ? x - 9 : x + L - 3;
        ctx.fillStyle = '#8E5B3A';
        this._rr(ctx, sx, y + 8, 12, 16, 4); ctx.fill();
        ctx.strokeStyle = '#6E4428'; ctx.lineWidth = 1.4;
        this._rr(ctx, sx, y + 8, 12, 16, 4); ctx.stroke();
        // rabat + boucle
        ctx.fillStyle = '#6E4428';
        this._rr(ctx, sx + 1, y + 8, 10, 5.5, 3); ctx.fill();
        ctx.fillStyle = '#F4D03F';
        ctx.fillRect(sx + 5, y + 11, 2.4, 3.4);
        // sangle sur l'épaule
        ctx.strokeStyle = '#6E4428'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx + (dir > 0 ? 11 : 1), y + 10); ctx.lineTo(dir > 0 ? x + 8 : x + L - 8, y + 6); ctx.stroke();
    }
    _dessinerJetpack(ctx, x, y, L, H, dir) {
        // Jetpack : réservoir métallique dans le dos + flammes en pleine montée 🚀
        const jx = dir > 0 ? x - 10 : x + L - 3;
        ctx.fillStyle = '#95A5A6';
        this._rr(ctx, jx, y + 6, 13, 17, 5); ctx.fill();
        ctx.strokeStyle = '#707B7C'; ctx.lineWidth = 1.4;
        this._rr(ctx, jx, y + 6, 13, 17, 5); ctx.stroke();
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(jx + 2, y + 9, 9, 2.6);
        // tuyères
        ctx.fillStyle = '#707B7C';
        ctx.fillRect(jx + 1.5, y + 22.5, 4, 3.5);
        ctx.fillRect(jx + 7.5, y + 22.5, 4, 3.5);
        // flammes uniquement quand Pixou s'élève (saut / ressort)
        if (!this.onGround && this.vy < -1) {
            const f = 5 + (this._animT % 4) * 1.6;
            for (const tx of [jx + 3.5, jx + 9.5]) {
                ctx.fillStyle = '#E67E22';
                ctx.beginPath(); ctx.moveTo(tx - 2.2, y + 26); ctx.lineTo(tx + 2.2, y + 26); ctx.lineTo(tx, y + 26 + f); ctx.closePath(); ctx.fill();
                ctx.fillStyle = '#F4D03F';
                ctx.beginPath(); ctx.moveTo(tx - 1.1, y + 26); ctx.lineTo(tx + 1.1, y + 26); ctx.lineTo(tx, y + 26 + f * 0.55); ctx.closePath(); ctx.fill();
            }
        }
    }
    _dessinerCostume(ctx, type, x, y, L, H, cx, dir) {
        if (!type || type === 'aucun' || type === 'cape') return;
        if (type === 'noeud') {
            // Nœud papillon sous le sourire
            const ny = y + H - 5;
            ctx.fillStyle = '#8E44AD';
            ctx.beginPath(); ctx.moveTo(cx - 1.5, ny); ctx.lineTo(cx - 8, ny - 4); ctx.lineTo(cx - 8, ny + 4); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx + 1.5, ny); ctx.lineTo(cx + 8, ny - 4); ctx.lineTo(cx + 8, ny + 4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#6C3483';
            ctx.beginPath(); ctx.arc(cx, ny, 2.4, 0, 6.28); ctx.fill();
            return;
        }
        if (type === 'echarpe') {
            // Écharpe rouge : bande + pan flottant côté opposé à la course
            const ey = y + H - 12;
            ctx.fillStyle = '#E74C3C';
            this._rr(ctx, x - 1, ey, L + 2, 6, 3); ctx.fill();
            const px2 = dir > 0 ? x + 2 : x + L - 2;
            const onde = Math.sin(this._animT * 0.18) * 2.5;
            ctx.beginPath();
            ctx.moveTo(px2, ey + 3);
            ctx.quadraticCurveTo(px2 - dir * 9, ey + 8 + onde, px2 - dir * 7, ey + 15 + onde);
            ctx.lineTo(px2 - dir * 2, ey + 13 + onde * 0.6);
            ctx.quadraticCurveTo(px2 - dir * 4, ey + 8, px2, ey + 5.5);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x - 1, ey + 3); ctx.lineTo(x + L + 1, ey + 3); ctx.stroke();
            return;
        }
        if (type === 'sherif') {
            // Étoile de shérif dorée sur la poitrine
            const ex = cx - 8, ey = y + H - 13;
            ctx.fillStyle = '#F4D03F'; ctx.strokeStyle = '#B7950B'; ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = -Math.PI / 2 + i * Math.PI / 5;
                const r = i % 2 === 0 ? 5.5 : 2.4;
                ctx.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#B7950B';
            ctx.beginPath(); ctx.arc(ex, ey, 1.4, 0, 6.28); ctx.fill();
            return;
        }
        if (type === 'hawai') {
            // Collier de fleurs hawaïen sur la poitrine
            const couleurs = ['#E74C3C', '#F4D03F', '#9B59B6', '#E67E22', '#3498DB', '#E91E63'];
            for (let i = 0; i < 6; i++) {
                const fx = x + 3 + i * (L - 6) / 5;
                const fy = y + H - 12 + Math.sin(i / 5 * Math.PI) * 3.5;
                ctx.fillStyle = couleurs[i];
                for (let p2 = 0; p2 < 5; p2++) {
                    const a = p2 * 2 * Math.PI / 5 + i;
                    ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 1.7, fy + Math.sin(a) * 1.7, 1.4, 0, 6.28); ctx.fill();
                }
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(fx, fy, 1, 0, 6.28); ctx.fill();
            }
            return;
        }
        if (type === 'ceinture') {
            // Tenue de karatéka : revers de kimono blancs en V + ceinture noire
            const by = y + H - 11;
            ctx.fillStyle = '#F7F9F9';
            ctx.strokeStyle = '#D5DBDB'; ctx.lineWidth = 1;
            // revers gauche et droit (col du gi, au-dessus de la ceinture)
            ctx.beginPath(); ctx.moveTo(x + 1, by - 7); ctx.lineTo(cx - 1, by + 1); ctx.lineTo(x + 1, by + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + L - 1, by - 7); ctx.lineTo(cx + 1, by + 1); ctx.lineTo(x + L - 1, by + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
            // ceinture noire : bande + nœud + pans
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(x - 1, by, L + 2, 6);
            ctx.fillRect(cx - 3.5, by - 1.5, 7, 9);
            ctx.beginPath(); ctx.moveTo(cx - 2, by + 6); ctx.lineTo(cx - 7, by + 14); ctx.lineTo(cx - 2.5, by + 12); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx + 2, by + 6); ctx.lineTo(cx + 7, by + 14); ctx.lineTo(cx + 2.5, by + 12); ctx.closePath(); ctx.fill();
        }
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
        if (type === 'bandana') {
            // Bandana de pirate : bandeau rouge à pois, nœud flottant à l'arrière
            ctx.fillStyle = '#C0392B';
            this._rr(ctx, x - 1, y, L + 2, 8.5, 4); ctx.fill();
            ctx.beginPath(); ctx.arc(cx, y + 1, 8, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#fff';
            for (const [dx2, dy2] of [[-8, 4], [-2, 2], [4, 5], [9, 3], [1, 6.5]]) {
                ctx.beginPath(); ctx.arc(cx + dx2, y + dy2, 1.1, 0, 6.28); ctx.fill();
            }
            // nœud + pans côté opposé à la direction
            const nx = dir > 0 ? x - 2 : x + L + 2;
            ctx.fillStyle = '#A93226';
            ctx.beginPath(); ctx.moveTo(nx, y + 3); ctx.lineTo(nx - 7 * dir, y + 1); ctx.lineTo(nx - 5 * dir, y + 6); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(nx, y + 4); ctx.lineTo(nx - 6 * dir, y + 9); ctx.lineTo(nx - 2 * dir, y + 8); ctx.closePath(); ctx.fill();
            return;
        }
        if (type === 'cowboy') {
            // Chapeau de cowboy : large bord + calotte + ruban
            ctx.fillStyle = '#8E5B3A';
            ctx.beginPath(); ctx.ellipse(cx, y + 5.5, L / 2 + 8, 4, 0, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#7A4A2B';
            this._rr(ctx, cx - 8.5, y - 8, 17, 14, 5); ctx.fill();
            ctx.fillStyle = '#4E342E';
            ctx.fillRect(cx - 8.5, y + 1.5, 17, 3);
            return;
        }
        if (type === 'viking') {
            // Casque de viking : dôme métallique + bandeau + cornes
            ctx.fillStyle = '#95A5A6';
            ctx.beginPath(); ctx.arc(cx, y + 6, 12, Math.PI, 0); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#707B7C'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(cx, y + 6, 12, Math.PI, 0); ctx.stroke();
            ctx.fillStyle = '#707B7C';
            ctx.fillRect(cx - 12, y + 4.5, 24, 2.5);
            // cornes
            ctx.fillStyle = '#F7F9F9';
            ctx.beginPath(); ctx.moveTo(cx - 11, y + 3); ctx.quadraticCurveTo(cx - 20, y - 2, cx - 17, y - 11); ctx.quadraticCurveTo(cx - 14, y - 3, cx - 8, y - 1); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(cx + 11, y + 3); ctx.quadraticCurveTo(cx + 20, y - 2, cx + 17, y - 11); ctx.quadraticCurveTo(cx + 14, y - 3, cx + 8, y - 1); ctx.closePath(); ctx.fill();
            return;
        }
        if (type === 'diplome') {
            // Mortier de diplômé : calotte + plateau losange + pompon doré
            ctx.fillStyle = '#1a1a2e';
            this._rr(ctx, cx - 8, y + 1, 16, 6, 2); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx - 14, y + 1); ctx.lineTo(cx, y - 5); ctx.lineTo(cx + 14, y + 1); ctx.lineTo(cx, y + 6);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#F4D03F'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(cx, y - 1); ctx.lineTo(cx + 12 * dir, y + 2); ctx.lineTo(cx + 12 * dir, y + 8); ctx.stroke();
            ctx.fillStyle = '#F4D03F';
            ctx.beginPath(); ctx.arc(cx + 12 * dir, y + 9, 2, 0, 6.28); ctx.fill();
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
