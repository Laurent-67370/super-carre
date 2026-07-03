/* MODE DÉMO — pilote automatique (« attract mode » façon borne d'arcade)
   Le bot écrit directement dans game.touches, comme le ferait un joueur.
   Heuristiques : viser le boss s'il est vivant, sinon la pièce la plus proche ;
   sauter quand la cible est au-dessus, qu'un trou ou un ennemi se présente,
   ou que Pixou est coincé. Une pièce inaccessible est mise de côté 8 s. */

export class DemoBot {
    constructor() { this.reset(); }
    reset() {
        this.lastX = 0;            // position frame précédente (détection blocage)
        this.blocage = 0;          // frames consécutives sans avancer
        this.sautHold = 0;         // frames restantes de maintien du saut (saut haut)
        this.sautRepos = 0;        // frames de relâchement OBLIGATOIRE entre deux sauts
                                   // (le jeu détecte l'appui frais : sans relâche, pas de saut !)
        this.cible = null;         // pièce actuellement visée
        this.cibleFrames = 0;      // depuis combien de frames on la vise
        this.blacklist = new Map();// pièces temporairement abandonnées → frame de fin
        this.recul = 0;            // frames de marche arrière (pics infranchissables sous plafond)
        this.reculDir = 0;         // direction du recul
        this.waypoint = null;      // point de passage engagé (hystérésis anti-oscillation)
        this.waypointFin = 0;      // frame limite d'engagement
        this.frame = 0;
    }

    piloter(game) {
        this.frame++;
        const p = game.player, t = game.touches;
        t.left = t.right = t.jump = false;
        if (!p || p.mort) return;
        const px = p.x + p.largeur / 2, py = p.y + p.hauteur / 2;

        // ── Choix de la cible ─────────────────────────────────
        let cx, cy, modeBoss = false;
        if (game.boss && !game.boss.mort) {
            // Boss : se placer sur lui pour l'écraser
            modeBoss = true;
            cx = game.boss.x + game.boss.largeur / 2;
            cy = game.boss.y - 30;
        } else {
            // Pièce la plus proche (poids vertical accru : préférer celles à portée)
            if (this.cible && (this.cible.collectee || this.cibleFrames > 480)) {
                // Visée depuis 8 s sans succès → blacklist 8 s
                if (!this.cible.collectee) this.blacklist.set(this.cible, this.frame + 480);
                this.cible = null;
            }
            if (!this.cible) {
                let dmin = Infinity;
                for (const c of game.pieces) {
                    if (c.collectee) continue;
                    const fin = this.blacklist.get(c);
                    if (fin && this.frame < fin) continue;
                    const dx = c.x - px, dy = c.y - py;
                    const d = dx * dx + dy * dy * 1.7;
                    if (d < dmin) { dmin = d; this.cible = c; }
                }
                // Tout est blacklisté → repartir de zéro
                if (!this.cible && game.pieces.some(c => !c.collectee)) {
                    this.blacklist.clear();
                    this.cibleFrames = 0;
                    return;
                }
                this.cibleFrames = 0;
            }
            if (!this.cible) return; // niveau fini, rien à faire
            this.cibleFrames++;
            cx = this.cible.x; cy = this.cible.y;
        }

        // ── Hystérésis : rester engagé sur le point de passage en cours ──
        if (this.waypoint) {
            const atteint = Math.abs(this.waypoint.x - px) < 26 && Math.abs(this.waypoint.y - py) < 34;
            if (atteint || this.frame > this.waypointFin || modeBoss) this.waypoint = null;
            else { cx = this.waypoint.x; cy = this.waypoint.y; }
        }

        // ── Plateforme relais : escalier vers les cibles hautes ──
        // Un saut monte ~135 px. Si la cible est plus haute, viser une
        // plateforme intermédiaire atteignable qui s'en rapproche.
        const piedsY = p.y + p.hauteur;
        if (!modeBoss && cy < piedsY - 125) {
            let relais = null, dmin = Infinity;
            for (const pl of game.niveau) {
                if (pl.type === 'mur' || pl.largeur < 40) continue; // pas les murs
                if (pl.y > piedsY - 12 || pl.y < piedsY - 130) continue; // hors d'un saut
                const centre = pl.x + pl.largeur / 2;
                const d = Math.abs(centre - px) + Math.abs(pl.y - cy) * 1.5;
                if (d < dmin) { dmin = d; relais = pl; }
            }
            if (relais) {
                // Point posé SUR le relais, tiré vers la cible finale
                cx = Math.max(relais.x + 16, Math.min(cx, relais.x + relais.largeur - 16));
                cy = relais.y - 30;
            }
        }

        // ── Point de passage : ne jamais sauter SOUS une plateforme ──
        // Si la cible est posée sur une plateforme et que Pixou est plus bas,
        // viser le bord le plus proche pour grimper par le côté (sinon il se
        // cogne la tête sous la plateforme en boucle).
        let sousPlafond = false;
        if (!modeBoss) {
            let support = null;
            for (const pl of game.niveau) {
                if (cx >= pl.x - 4 && cx <= pl.x + pl.largeur + 4 && pl.y >= cy) {
                    if (!support || pl.y < support.y) support = pl;
                }
            }
            if (support && py > support.y + 8) {
                const dessous = px > support.x - 8 && px < support.x + support.largeur + 8;
                if (dessous) {
                    // Sous la plateforme → marcher vers le bord le plus proche, sans sauter
                    sousPlafond = true;
                    const gauche = support.x - 26, droite = support.x + support.largeur + 26;
                    cx = Math.abs(px - gauche) < Math.abs(px - droite) ? gauche : droite;
                    cx = Math.max(20, Math.min(cx, (p.mondeW || 800) - 50));
                    cy = py; // pas d'incitation à sauter
                } else {
                    // À côté → sauter vers le DESSUS de la plateforme, côté proche
                    cx = px < support.x ? support.x + 24 : support.x + support.largeur - 24;
                    cy = support.y - 34;
                }
            }
        }

        // Mémoriser le détour comme engagement (3 s max)
        if (!modeBoss && !this.waypoint) {
            const detour = this.cible && (Math.abs(cx - this.cible.x) > 8 || Math.abs(cy - this.cible.y) > 8);
            if (detour) { this.waypoint = { x: cx, y: cy }; this.waypointFin = this.frame + 180; }
        }

        // ── Plafond : une plateforme (n'importe laquelle) est-elle
        //    juste au-dessus de la tête ? Si oui, tout saut vers une
        //    cible haute se solderait par un cognement en boucle :
        //    on se décale d'abord latéralement pour s'en dégager.
        let plafond = null;
        for (const pl of game.niveau) {
            if (pl.type === 'mur') continue;
            const bas = pl.y + pl.hauteur;
            if (bas <= p.y + 2 && bas > p.y - 150 &&
                p.x + p.largeur > pl.x - 2 && p.x < pl.x + pl.largeur + 2) {
                if (!plafond || bas > plafond.y + plafond.hauteur) plafond = pl;
            }
        }
        if (plafond && cy < py - 24) {
            // Sortir de sous le plafond par le bord qui rapproche de la cible
            const gauche = plafond.x - 26, droite = plafond.x + plafond.largeur + 26;
            cx = Math.abs(gauche - cx) < Math.abs(droite - cx) ? gauche : droite;
            cx = Math.max(20, Math.min(cx, (p.mondeW || 800) - 50));
            cy = py; // pas d'incitation à sauter tant qu'on est dessous
        }

        // ── Recul prioritaire (échappement pics sous plafond) ──
        if (this.recul > 0) {
            this.recul--;
            t.left = this.reculDir < 0; t.right = this.reculDir > 0;
            this.lastX = p.x;
            return;
        }

        // ── Déplacement horizontal ────────────────────────────
        const dx = cx - px, dy = cy - py;
        const dir = dx > 6 ? 1 : (dx < -6 ? -1 : 0);
        if (dir > 0) t.right = true;
        else if (dir < 0) t.left = true;

        // ── Détection de blocage (mur, coin de plateforme) ────
        if (dir !== 0 && Math.abs(p.x - this.lastX) < 0.4) this.blocage++;
        else this.blocage = 0;
        this.lastX = p.x;

        // ── Décision de saut ──────────────────────────────────
        let sauter = false;
        if (p.onGround) {
            // Cible nettement au-dessus et pas trop loin (jamais sous une plateforme !)
            if (!sousPlafond && !plafond && dy < -24 && Math.abs(dx) < 180) sauter = true;
            // Coincé contre un obstacle
            if (this.blocage > 24) sauter = true;
            // Trou devant : aucune plateforme sous le pas suivant
            if (dir !== 0 && !sauter) {
                const fx = px + dir * 40, fyMin = p.y + p.hauteur - 4;
                let sol = false;
                for (const pl of game.niveau) {
                    if (fx >= pl.x && fx <= pl.x + pl.largeur &&
                        pl.y >= fyMin && pl.y <= fyMin + 90) { sol = true; break; }
                }
                if (!sol) sauter = true;
            }
            // Ennemi vivant droit devant à hauteur de Pixou → bondir dessus
            if (dir !== 0 && !sauter) {
                for (const e of game.ennemis) {
                    if (e.mort) continue;
                    const ex = (e.x + e.largeur / 2) - px;
                    const ey = (e.y + e.hauteur / 2) - py;
                    if (ex * dir > 0 && ex * dir < 90 && Math.abs(ey) < 42) { sauter = true; break; }
                }
            }
            // Pics droit devant au niveau des pieds → sauter par-dessus.
            // MAIS sous un plafond, le saut se cogne et retombe SUR les pics :
            // dans ce cas, demi-tour (une route par les plateformes existe ailleurs).
            if (dir !== 0 && !sauter && game.pics) {
                for (const s of game.pics) {
                    const bord = dir > 0 ? s.x : s.x + s.largeur;
                    const dist = (bord - px) * dir;
                    if (dist > 0 && dist < 60 && Math.abs(s.y - piedsY) < 40) {
                        // Sous un plafond on continue d avancer (il se termine souvent
                        // avant les pics) ; on ne recule qu au contact imminent.
                        if (!plafond) sauter = true;
                        else if (dist < 22) { this.recul = 30; this.reculDir = -dir; }
                        break;
                    }
                }
            }
            // Boss proche → sauter pour retomber sur sa tête
            if (modeBoss && Math.abs(dx) < 90 && dy > -60) sauter = true;
        }

        if (sauter && this.sautHold === 0 && this.sautRepos === 0) this.sautHold = 13; // maintien ≈ grand saut
        if (this.sautHold > 0) {
            t.jump = true;
            this.sautHold--;
            if (this.sautHold === 0) this.sautRepos = 3; // relâche avant le prochain appui
        } else if (this.sautRepos > 0) {
            this.sautRepos--;
        }
    }
}
