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
        this.echecs = new Map();   // pièce → nombre d'abandons (déclenche la route ressort)
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

        // ════════════════════════════════════════════════════════
        //  NAVIGATION PLANIFIÉE — graphe des plateformes
        //  Nœuds = plateformes praticables. Arêtes = sauts possibles
        //  (portée mesurée : ~190 px de haut avec maintien, ~150 px
        //  de large en course) + arêtes « ressort » (super saut).
        //  Un BFS donne le chemin complet vers la pièce visée.
        // ════════════════════════════════════════════════════════
        if (this._nivRef !== game.niveau) {
            this._nivRef = game.niveau;
            this._graphe = this._construireGraphe(game);
        }
        return this._piloterCorps(game, p, t, px, py);
    }

    _construireGraphe(game) {
        const plats = game.niveau.filter(pl => pl.type !== 'mur' && pl.largeur >= 40);
        const aretes = new Map(); // index plateforme → [{vers, ressort?}]
        const gapH = (a, b) => Math.max(0, b.x - (a.x + a.largeur), a.x - (b.x + b.largeur));
        for (let i = 0; i < plats.length; i++) {
            const liste = [];
            for (let j = 0; j < plats.length; j++) {
                if (i === j) continue;
                const a = plats[i], b = plats[j];
                const montee = a.y - b.y; // >0 : b est plus haute
                const gap = gapH(a, b);
                // Saut montant (maintenu) / saut plat / descente pilotée
                if ((montee > 0 && montee <= 185 && gap <= 140) ||
                    (montee <= 0 && gap <= 170)) {
                    liste.push({ vers: j });
                }
            }
            aretes.set(i, liste);
        }
        // Arêtes ressort : depuis la plateforme qui porte le ressort,
        // vers toute plateforme bien plus haute pilotable en vol.
        for (const r of (game.ressorts || [])) {
            const rcx = r.x + r.largeur / 2;
            let porteur = -1, py0 = Infinity;
            for (let i = 0; i < plats.length; i++) {
                const pl = plats[i];
                if (rcx >= pl.x - 4 && rcx <= pl.x + pl.largeur + 4 && pl.y >= r.y && pl.y < py0) { porteur = i; py0 = pl.y; }
            }
            if (porteur < 0) continue;
            for (let j = 0; j < plats.length; j++) {
                const monte = plats[porteur].y - plats[j].y;
                const derive = Math.abs((plats[j].x + plats[j].largeur / 2) - rcx);
                if (monte > 140 && monte <= 480 && derive <= 260) {
                    aretes.get(porteur).push({ vers: j, ressort: r });
                }
            }
        }
        return { plats, aretes };
    }

    // Plateforme sous un point (la plus haute dont le dessus est sous y)
    _platSous(x, y) {
        const { plats } = this._graphe;
        let best = -1, by = Infinity;
        for (let i = 0; i < plats.length; i++) {
            const pl = plats[i];
            if (x >= pl.x - 6 && x <= pl.x + pl.largeur + 6 && pl.y >= y - 8 && pl.y < by) { best = i; by = pl.y; }
        }
        return best;
    }

    // BFS : prochaine étape (arête) du chemin de `depuis` vers `vers`
    _prochaineEtape(depuis, vers) {
        if (depuis < 0 || vers < 0 || depuis === vers) return null;
        const { aretes } = this._graphe;
        const pred = new Map([[depuis, null]]);
        const file = [depuis];
        while (file.length) {
            const n = file.shift();
            for (const a of (aretes.get(n) || [])) {
                if (pred.has(a.vers)) continue;
                pred.set(a.vers, { de: n, arete: a });
                if (a.vers === vers) {
                    // Remonter jusqu'à la première étape après `depuis`
                    let cur = vers, lien = pred.get(cur);
                    while (lien && lien.de !== depuis) { cur = lien.de; lien = pred.get(cur); }
                    return lien ? lien.arete : null;
                }
                file.push(a.vers);
            }
        }
        return null;
    }

    _piloterCorps(game, p, t, px, py) {

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
                if (!this.cible.collectee) {
                    this.blacklist.set(this.cible, this.frame + 480);
                    this.echecs.set(this.cible, (this.echecs.get(this.cible) || 0) + 1);
                }
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

        // ── SUPER SAUT adaptatif : si la cible résiste depuis 5 s et
        //    qu'un ressort peut l'atteindre (portée ~440 px de haut,
        //    pilotable en vol sur ~250 px de large), on prend le ressort.
        if (!modeBoss && this.cible && this.cibleFrames > 300 &&
            (this.cible.y < p.y + p.hauteur - 220 || (this.echecs.get(this.cible) || 0) >= 2) &&
            game.ressorts && game.ressorts.length) {
            let ressort = null, rd = Infinity;
            for (const r of game.ressorts) {
                const rcx = r.x + r.largeur / 2;
                if (Math.abs(rcx - this.cible.x) > 260) continue;  // trop loin pour piloter en vol
                if (this.cible.y < r.y - 460) continue;            // hors de portée même en super saut
                const d = Math.abs(rcx - px);
                if (d < rd) { rd = d; ressort = r; }
            }
            if (ressort) {
                this.waypoint = { x: ressort.x + ressort.largeur / 2, y: ressort.y - 16 };
                this.waypointFin = this.frame + 300;
                this.cibleFrames = 60; // laisser 4 s à la route ressort avant de réessayer
            }
        }

        // ── CHEMIN PLANIFIÉ (BFS) : prochaine étape vers la cible ──
        // Au sol et sans engagement en cours : plateforme actuelle →
        // plateforme de la cible ; l'étape suivante devient le waypoint.
        if (!modeBoss && p.onGround && !this.waypoint && this.cible) {
            const ici = this._platSous(px, p.y + p.hauteur);
            const but = this._platSous(this.cible.x, this.cible.y);
            const etape = this._prochaineEtape(ici, but);
            if (etape) {
                const { plats } = this._graphe;
                if (etape.ressort) {
                    const r = etape.ressort;
                    this.waypoint = { x: r.x + r.largeur / 2, y: r.y - 16 };
                } else {
                    const b = plats[etape.vers];
                    this.waypoint = {
                        x: Math.max(b.x + 16, Math.min(this.cible.x, b.x + b.largeur - 16)),
                        y: b.y - 30
                    };
                }
                this.waypointFin = this.frame + 180;
            }
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
        // ⚠️ Planification AU SOL uniquement : en vol (saut, ressort),
        // on pilote droit vers la cible sans se laisser distraire.
        const piedsY = p.y + p.hauteur;
        if (!modeBoss && p.onGround && cy < piedsY - 125) {
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
            } else if (game.ressorts && game.ressorts.length) {
                // Aucune plateforme relais → SUPER SAUT : viser le ressort le
                // plus pertinent (force -19 ≈ 3× un saut normal). Le rebond se
                // déclenche en marchant dessus, puis le bot pilote la cible en vol.
                let ressort = null, rd = Infinity;
                for (const r of game.ressorts) {
                    const d = Math.abs((r.x + r.largeur / 2) - px) + Math.abs(r.y - cy) * 0.5;
                    if (d < rd) { rd = d; ressort = r; }
                }
                if (ressort) { cx = ressort.x + ressort.largeur / 2; cy = ressort.y - 16; }
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
        // Le plafond ne gêne que si la cible est AU-DESSUS de lui : pour une
        // cible située sous le plafond, un saut dosé passe sans le toucher.
        const plafondBloque = plafond && cy < (plafond.y + plafond.hauteur) + 50;
        if (plafondBloque && cy < py - 24) {
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

        // ── Descente : la cible est EN DESSOUS et la plateforme actuelle
        //    bloque la verticale → marcher jusqu'au bord le plus proche
        //    de la cible et se laisser tomber (pilotage en chute ensuite).
        if (!modeBoss && p.onGround && cy > py + 30) {
            const idxIci = this._platSous(px, p.y + p.hauteur);
            const ici = idxIci >= 0 ? this._graphe.plats[idxIci] : null;
            if (ici && cx >= ici.x - 6 && cx <= ici.x + ici.largeur + 6) {
                const gauche = ici.x - 12, droite = ici.x + ici.largeur + 12;
                cx = Math.abs(droite - cx) < Math.abs(gauche - cx) ? droite : gauche;
            }
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
            if (!sousPlafond && !plafondBloque && dy < -24 && Math.abs(dx) < 180) sauter = true;
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
            // (sauf en pleine descente : sauter interromprait la manœuvre)
            if (dir !== 0 && !sauter && cy < py + 30) {
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
                        if (!plafondBloque) sauter = true;
                        else if (dist < 22) { this.recul = 30; this.reculDir = -dir; }
                        break;
                    }
                }
            }
            // Boss proche → sauter pour retomber sur sa tête
            if (modeBoss && Math.abs(dx) < 90 && dy > -60) sauter = true;
        }

        // En vol ascendant rapide (ressort !) : maintenir le saut → la gravité
        // réduite du saut variable fait monter bien plus haut, comme un vrai joueur.
        if (!p.onGround && p.vy < -2 && dy < -20) t.jump = true;
        if (sauter && this.sautHold === 0 && this.sautRepos === 0) {
            // Saut dosé : maintien proportionnel à la hauteur à gagner
            // (~55 px en bref appui, ~200 px en maintien complet). Les sauts
            // de franchissement (trou, pics, blocage) restent au maximum.
            const besoin = dy < -10 ? -dy : 999;
            this.sautHold = besoin <= 45 ? 5 : besoin <= 90 ? 8 : besoin <= 135 ? 11 : 13;
        }
        if (this.sautHold > 0) {
            t.jump = true;
            this.sautHold--;
            if (this.sautHold === 0) this.sautRepos = 3; // relâche avant le prochain appui
        } else if (this.sautRepos > 0) {
            this.sautRepos--;
        }
    }
}
