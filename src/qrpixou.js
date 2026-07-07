/* QR PIXOU 📱 — QR codes stylés pour les partages : points arrondis,
   correction d'erreur élevée (le centre est recouvert par un mini-Pixou
   aux couleurs du skin équipé, posé sur une pastille blanche).
   La sur-impression reste ≤ ~8 % des modules : très en-dessous des 30 %
   (ECC H) / 15 % (ECC M) que le format tolère. */
import qrcode from 'qrcode-generator';

// Dessine le QR du texte sur le canvas (taille CSS ~min(78vw, 340px)).
// couleurs = { corps, bord, casquette } du skin équipé (mini-Pixou central).
export function dessinerQRPixou(canvas, texte, couleurs = {}) {
    // ECC H (30 %) tant que le texte reste raisonnable, sinon M (15 %)
    const ecc = texte.length <= 520 ? 'H' : 'M';
    const qr = qrcode(0, ecc);
    qr.addData(texte);
    qr.make();
    const n = qr.getModuleCount();

    const PX = 8, MARGE = 3;                 // pixels par module, marge (quiet zone)
    const T = (n + MARGE * 2) * PX;
    canvas.width = T; canvas.height = T;
    const ctx = canvas.getContext('2d');

    // Fond blanc (indispensable au contraste de lecture)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, T, T);

    // Zone centrale réservée au logo (en modules)
    const logoMod = Math.floor(n * 0.24);
    const l0 = Math.floor((n - logoMod) / 2), l1 = l0 + logoMod;
    const dansLogo = (r, c) => r >= l0 && r < l1 && c >= l0 && c < l1;
    // Les trois yeux de détection (finder patterns) : dessinés à part, arrondis
    const dansFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

    // Modules : points arrondis
    ctx.fillStyle = '#1a1a2e';
    const RAYON = PX * 0.32;
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (!qr.isDark(r, c) || dansFinder(r, c) || dansLogo(r, c)) continue;
            const x = (c + MARGE) * PX, y = (r + MARGE) * PX;
            ctx.beginPath();
            ctx.arc(x + PX / 2, y + PX / 2, RAYON + PX * 0.14, 0, 6.2832);
            ctx.fill();
        }
    }

    // Finder patterns arrondis (carré 7×7 : anneau + cœur)
    const finder = (mr, mc) => {
        const x = (mc + MARGE) * PX, y = (mr + MARGE) * PX, s = 7 * PX;
        ctx.fillStyle = '#1a1a2e';
        _rr(ctx, x, y, s, s, PX * 1.6); ctx.fill();
        ctx.fillStyle = '#ffffff';
        _rr(ctx, x + PX, y + PX, s - 2 * PX, s - 2 * PX, PX * 1.1); ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        _rr(ctx, x + 2 * PX, y + 2 * PX, s - 4 * PX, s - 4 * PX, PX * 0.9); ctx.fill();
    };
    finder(0, 0); finder(0, n - 7); finder(n - 7, 0);

    // Pastille blanche + mini-Pixou au centre
    const cx = T / 2, cy = T / 2;
    const rond = (logoMod + 1.6) * PX / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, rond, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = 'rgba(26,26,46,.15)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, rond - 1, 0, 6.2832); ctx.stroke();
    _miniPixou(ctx, cx, cy, rond * 1.05, couleurs);
    return canvas;
}

function _rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Le visage de Pixou, aux couleurs du skin équipé
function _miniPixou(ctx, cx, cy, rayon, k) {
    const corps = k.corps || '#E74C3C', bord = k.bord || '#C0392B', casq = k.casquette || '#8E44AD';
    const L = rayon * 1.18, H = L;
    const x = cx - L / 2, y = cy - H / 2 + rayon * 0.06;
    // corps
    ctx.fillStyle = corps;
    ctx.strokeStyle = bord; ctx.lineWidth = Math.max(2, L * 0.06);
    _rr(ctx, x, y, L, H, L * 0.2); ctx.fill(); ctx.stroke();
    // casquette
    ctx.fillStyle = casq;
    _rr(ctx, x - L * 0.04, y - H * 0.10, L * 1.08, H * 0.24, L * 0.12); ctx.fill();
    ctx.fillRect(x + L * 0.62, y - H * 0.06, L * 0.52, H * 0.13);
    // yeux
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x + L * 0.32, y + H * 0.42, L * 0.13, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(x + L * 0.68, y + H * 0.42, L * 0.13, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(x + L * 0.35, y + H * 0.43, L * 0.06, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(x + L * 0.71, y + H * 0.43, L * 0.06, 0, 6.2832); ctx.fill();
    // sourire
    ctx.strokeStyle = '#C0392B'; ctx.lineWidth = Math.max(2, L * 0.05); ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + L * 0.32, y + H * 0.68);
    ctx.quadraticCurveTo(x + L * 0.5, y + H * 0.82, x + L * 0.68, y + H * 0.68);
    ctx.stroke();
}
