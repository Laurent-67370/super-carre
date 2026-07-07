import { signaler } from './succes.js';
/* COMBAT DE BOSS — extrait de game.js (v70) : gestion des 4 boss côté
   moteur (écrasement, contact, projectiles, ondes de choc, secousses).
   gererBoss(g) renvoie true si l'update du jeu doit s'interrompre
   (mort du joueur ou fin de niveau). */

// Séquence de dégât au joueur (contact boss, projectile ou onde).
// Renvoie true si le joueur n'a plus de vies (le jeu passe en état 'mort').
export function degatJoueur(g) {
    const p = g.player;
    g.audio.degat(); if (navigator.vibrate) navigator.vibrate(200);
    if (!g.modeDemo) { g.vies--; } g.updateHearts(); g.shakeFrames = 8; g.mortsNiveau++;
    if (g.vies <= 0) { g._spawnDebris(p.x + 15, p.y + 15); g.etat = 'mort'; g.mortFrame = 0; return true; }
    p.subirDegat();
    g.recalculerCamera(true);
    return false;
}

export function gererBoss(g) {
    if (g.boss && !g.bossVaincu) {
        g.boss.update(g.player);
        const p = g.player, b = g.boss;
        if (!b.mort && !b.intangible && p.x < b.x + b.largeur && p.x + p.largeur > b.x && p.y < b.y + b.hauteur && p.y + p.hauteur > b.y) {
            // saut sur la tête ?
            if (p.vy > 2 && (p.y + p.hauteur - b.y) < 24) {
                const vaincu = b.encaisser();
                p.vy = p.forceSaut * 0.8; g.audio.ecrase();
                if (navigator.vibrate) navigator.vibrate(60);
                if (vaincu) {
                    g.bossVaincu = true;
                    signaler('boss', { type: b.type });
                    g.scoreCumul += 1000;
                    g.scorePopups.push({ x: b.x, y: b.y, vie: 80, text: 'BOSS VAINCU ! +1000' });
                    g.player.setExpression('win', 60);
                    g.audio.victoire();
                    // si toutes les pièces sont déjà ramassées, terminer maintenant
                    if (g.scoreNiveau >= g.totalPiecesNiveau) { g.niveauTermine(); return true; }
                } else {
                    g.scorePopups.push({ x: b.x + 10, y: b.y, vie: 50, text: `${b.pv} ❤` });
                    g.player.setExpression('joy', 20);
                }
            } else if (b.invincible <= 0 && p.invincible <= 0 && p.powerUpTimer.shield <= 0) {
                // touché par le boss sur le côté → dégât
                if (degatJoueur(g)) return true;
            }
        }
        // 🌋 Impact du Colosse : secousse d'écran
        if (b.impactFrame > 0) {
            b.impactFrame = 0;
            g.shakeFrames = Math.max(g.shakeFrames, 12);
            g.audio.ecrase();
            if (navigator.vibrate) navigator.vibrate([60, 40, 90]);
        }
        // Projectiles 🔮 et ondes de choc 🌋 : dégât au contact
        if (p.invincible <= 0 && p.powerUpTimer.shield <= 0) {
            const pcx = p.x + p.largeur / 2, pcy = p.y + p.hauteur / 2;
            let touche = false;
            for (const pr of b.projectiles) {
                if (Math.abs(pr.x - pcx) < pr.r + 13 && Math.abs(pr.y - pcy) < pr.r + 13) { pr.vie = 0; touche = true; break; }
            }
            if (!touche) for (const o of b.ondes) {
                if (Math.abs(o.x - pcx) < 14 && p.y + p.hauteur > o.y - 20) { touche = true; break; }
            }
            if (touche) {
                if (degatJoueur(g)) return true;
            }
        }
    } else if (g.boss && g.bossVaincu && g.boss.mort) {
        g.boss.update(g.player); // laisse jouer l'animation de mort
    }
    return false;
}
