// Analyse "pièces sans perte de vie" — statique + simulation bot
// Statique : pour chaque pièce, qu'y a-t-il DESSOUS quand on retombe ?
//   - une plateforme sûre → OK
//   - des pics avant la plateforme → DANGER (dégât quasi garanti)
//   - rien (trou) → DANGER (chute mortelle), sauf ressort proche (arc de rebond)
// Simulation : le DemoBot joue le niveau (≤75 s) → pièces ramassées + dégâts subis.
Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });

const [{ NIVEAUX }, { Player }, { DemoBot }] = await Promise.all([
    import('./src/levels.js'), import('./src/player.js'), import('./src/demo.js')
]);

function analyseStatique(meta, d) {
    const alertes = [];
    for (const c of d.pieces) {
        // première surface solide sous la pièce (span horizontal ±14)
        let plat = null;
        for (const p of d.niveau) {
            if (c.x >= p.x - 14 && c.x <= p.x + p.largeur + 14 && p.y >= c.y) {
                if (!plat || p.y < plat.y) plat = p;
            }
        }
        // pics rencontrés avant cette surface ?
        let picDanger = null;
        for (const s of d.pics) {
            const sw = s.largeur || s.w || 40;
            if (c.x >= s.x - 6 && c.x <= s.x + sw + 6 && s.y >= c.y - 4 && (!plat || s.y <= plat.y + 4)) {
                picDanger = s;
            }
        }
        // ressort sous/près de la pièce (arc de rebond = collecte aérienne voulue)
        let ressortProche = d.ressorts.some(r =>
            Math.abs((r.x + (r.largeur || 36) / 2) - c.x) < 90 && r.y > c.y - 10);
        if (picDanger && !ressortProche) {
            alertes.push({ type: 'PICS', x: c.x, y: c.y, detail: `pics à y=${picDanger.y}` });
        } else if (!plat && !ressortProche) {
            alertes.push({ type: 'TROU', x: c.x, y: c.y, detail: 'aucune surface ni ressort dessous' });
        }
    }
    return alertes;
}

function simulerBot(meta, d, maxSec = 75) {
    const player = new Player(meta.spawn.x, meta.spawn.y);
    player.checkpointX = meta.spawn.x; player.checkpointY = meta.spawn.y;
    player.mondeW = meta.largeurMonde; player.mondeH = meta.hauteurMonde;
    const jeu = { player, touches: { left: false, right: false, jump: false },
        pieces: d.pieces, ennemis: d.ennemis, niveau: d.niveau,
        pics: d.pics, ressorts: d.ressorts, boss: d.boss || null };
    const bot = new DemoBot();
    const muet = new Proxy({}, { get: () => () => {} });
    let coll = 0, degats = 0, f = 0;
    const max = 60 * maxSec;
    while (f < max && coll < d.pieces.length) {
        f++;
        for (const p of d.niveau) if (p.update && p.axe) p.update();
        for (const e of d.ennemis) e.update(player);
        if (d.boss && d.boss.update) d.boss.update(player);
        for (const r of d.ressorts) {
            r.update();
            if (r.testerRebond(player)) { player.vy = r.force; player.onGround = false; }
        }
        bot.piloter(jeu);
        const res = player.update(jeu.touches, muet, d.niveau, d.ennemis, d.pics);
        if (res === 'degat' || res === 'trou') {
            degats++;
            player.x = player.checkpointX; player.y = player.checkpointY;
            player.vx = 0; player.vy = 0; player.mort = false; player.invincible = 60;
        }
        for (const c of d.pieces) if (!c.collectee && c.testerCollecte(player)) coll++;
    }
    return { coll, total: d.pieces.length, degats, temps: f / 60,
        ratees: d.pieces.filter(c => !c.collectee).map(c => ({ x: c.x, y: c.y })) };
}

const seul = process.argv[2] ? parseInt(process.argv[2], 10) : null;
for (let i = 0; i < NIVEAUX.length; i++) {
    if (seul !== null && i !== seul - 1) continue;
    const meta = NIVEAUX[i];
    const d = meta.creer();
    const alertes = analyseStatique(meta, d);
    const sim = simulerBot(meta, d);
    const tag = alertes.length || sim.degats > 3 ? '⚠️' : '✅';
    console.log(`${tag} Niv.${String(i + 1).padStart(2)} ${meta.nom} — statique: ${alertes.length} alerte(s) | bot: ${sim.coll}/${sim.total} pièces, ${sim.degats} dégât(s), ${sim.temps.toFixed(0)}s${d.boss ? ' [BOSS]' : ''}`);
    for (const a of alertes) console.log(`     ↳ ${a.type} pièce (${a.x},${a.y}) — ${a.detail}`);
    if (sim.ratees.length && sim.ratees.length <= 6) console.log(`     ↳ ratées par le bot: ${sim.ratees.map(r => `(${r.x},${r.y})`).join(' ')}`);
}
