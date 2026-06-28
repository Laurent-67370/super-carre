import { NIVEAUX } from './levels.js';
/* Fonctions UI : Hall of Fame, partage */

export function afficherHallOfFame(hs) {
    const table = document.getElementById('score-table');
    const data = hs.getTableau();
    const btnShare = document.getElementById('btn-scores-share');
    if (btnShare) btnShare.style.display = data.length > 0 ? 'inline-block' : 'none';
    if (data.length === 0) {
        table.innerHTML = '<div class="score-empty">Aucun score enregistré.<br>Sois le premier légende ! 🎮</div>';
        return;
    }
    table.innerHTML = data.map(s => `
        <div class="score-row">
            <div class="score-rank">${s.rank}</div>
            <div class="score-name">${s.nom}<br><span style="font-size:.55em;opacity:.5;font-weight:400;letter-spacing:0">Niv. ${s.niveau}/${NIVEAUX.length}</span></div>
            <div class="score-val">${s.score}<br><span style="font-size:.65em;opacity:.6">🪙${s.pieces} • ⏱️${s.temps}s</span></div>
        </div>
    `).join('');
}

// ============================================================
//  PARTAGE DES SCORES — Web Share API + fallback presse-papier
// ============================================================
const URL_PARTAGE = 'https://laurent-67370.github.io/super-carre/';

export function partagerScores(hs) {
    const data = hs.getTableau();
    if (data.length === 0) { afficherToast("Aucun score à partager — joue d'abord ! 🎮"); return; }
    const lignes = data.map(s => {
        const pref = /^\d+$/.test(String(s.rank)) ? `${s.rank}. ` : `${s.rank} `;
        return `${pref}${s.nom} — ${s.score.toLocaleString('fr-FR')} pts (niv ${s.niveau}/${NIVEAUX.length} · 🪙 ${s.pieces} · ⏱️ ${s.temps}s)`;
    }).join('\n');
    const texte = `🟥 Super Carré — Hall of Fame 🏆\n\n${lignes}\n\n🎮 Tente de me battre : ${URL_PARTAGE}`;
    if (navigator.share) {
        navigator.share({ title: '🟥 Super Carré — mes scores', text: texte })
            .catch(err => { if (!err || err.name !== 'AbortError') copierPartage(texte); });
    } else {
        copierPartage(texte);
    }
}

export function copierPartage(texte) {
    try {
        navigator.clipboard.writeText(texte)
            .then(() => afficherToast('📋 Scores copiés ! Colle-les où tu veux.'))
            .catch(() => fallbackCopierPartage(texte));
    } catch(e) { fallbackCopierPartage(texte); }
}

export function fallbackCopierPartage(texte) {
    const ta = document.createElement('textarea');
    ta.value = texte; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); afficherToast('📋 Scores copiés ! Colle-les où tu veux.'); }
    catch(e) { afficherToast('❌ Copie impossible — partage manuellement.'); }
    document.body.removeChild(ta);
}

export function afficherToast(msg) {
    const t = document.getElementById('share-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._shareToastT);
    window._shareToastT = setTimeout(() => t.classList.remove('show'), 2600);
}

// ============================================================
//  CONTRÔLES TACTILES — Multi-touch global (chaque doigt suivi individuellement)
// ============================================================
