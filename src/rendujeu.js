/* RENDU DU JEU — extrait de game.js (v70) : dessin du monde, du tutoriel
   et du HUD. Fonctions pures de rendu : elles lisent l'état du jeu (g)
   et dessinent, sans jamais le modifier. */
import { NIVEAUX } from './levels.js';

// Palette du ciel des 24 niveaux (haut, bas) — constante de module
const CIEL_PALETTE = [['#5DADE2','#D6EAF8'],['#2C3E50','#1a1a2e'],['#8E44AD','#2C003E'],['#1B4F72','#0E2F44'],['#922B21','#1A0000'],['#1B263B','#02030a'],['#145A32','#0a1f12'],['#641E16','#1a0500'],['#7DCEA0','#D5F5E3'],['#5499C7','#1B2631'],['#5B2C6F','#1B0A2E'],['#7B241C','#0B0000'],['#34495E','#0a0a0a'],['#212F3D','#050810'],['#16A085','#0A2A24'],['#5D4037','#1A0E08'],['#CB4335','#2C0008'],['#5D6D7E','#1B2631'],['#1F618D','#0B2540'],['#6C3483','#1A0A2E'],['#1B2631','#02030a'],['#AED6F1','#21618C'],['#2E4053','#0a0a0a'],['#512E5F','#0D0D0D']];

export function dessinerJeu(g) {
    const ctx = g.ctx;
    // --- RESET COMPLET du contexte canvas à chaque frame ---
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    // Effacer explicitement le canvas (anti-résidu)
    ctx.clearRect(0, 0, g.W, g.H);

    // Fond (dessiné en premier, sans shake) — palette définie une seule fois (pas par frame)
    const couleurs = CIEL_PALETTE;
    const cols=couleurs[Math.min(g.niveauActuel,couleurs.length-1)];
    // Le dégradé du ciel ne dépend que du niveau et de la hauteur : on le met en cache
    // pour ne pas le reconstruire à chaque frame (gain CPU, aucun changement visuel).
    if (g._fondPerso) {
        if (!g._cielGrad || g._cielGradH !== g.H) {
            const grd = ctx.createLinearGradient(0, 0, 0, g.H);
            grd.addColorStop(0, g._fondPerso[0]); grd.addColorStop(1, g._fondPerso[1]);
            g._cielGrad = grd; g._cielGradH = g.H;
        }
    } else if (!g._cielGrad || g._cielGradNiv !== g.niveauActuel || g._cielGradH !== g.H) {
        const grd = ctx.createLinearGradient(0,0,0,g.H);
        grd.addColorStop(0,cols[0]); grd.addColorStop(1,cols[1]);
        g._cielGrad = grd; g._cielGradNiv = g.niveauActuel; g._cielGradH = g.H;
    }
    ctx.fillStyle=g._cielGrad;ctx.fillRect(0,0,g.W,g.H);
    // Étoiles (niveaux sombres) — légère parallaxe, réparties sur le monde
    if(g.niveauActuel>=1){ctx.fillStyle='rgba(255,255,255,.4)';const sox=-(g.camX||0)*0.15;for(let i=0;i<24;i++){const stx=((i*53+37)%Math.max(800,g.mondeW))+sox;const sty=(i*31+17)%200;ctx.fillRect(stx,sty,2,2)}}
    // Parallaxe : le décor lointain défile plus lentement que le monde
    const camX = g.camX || 0, camY = g.camY || 0;
    const paraX = -camX * 0.3, paraY = -camY * 0.3;
    // Collines (parallaxe)
    ctx.save(); ctx.translate(paraX, paraY);
    ctx.fillStyle='rgba(46,204,113,.2)';ctx.beginPath();ctx.arc(150,560,120,Math.PI,0);ctx.arc(450,560,100,Math.PI,0);ctx.arc(700,560,130,Math.PI,0);ctx.fill();
    // Nuages (parallaxe)
    ctx.fillStyle='rgba(255,255,255,.7)';
    for(const n of g.nuages){ctx.beginPath();ctx.arc(n.x,n.y,n.t,0,6.28);ctx.arc(n.x+n.t*.8,n.y,n.t*.7,0,6.28);ctx.arc(n.x-n.t*.7,n.y+5,n.t*.6,0,6.28);ctx.fill()}
    ctx.restore();

    // Éléments de jeu : translation caméra (+ shake éventuel)
    ctx.save();
    const sx = g.shakeFrames>0 ? (Math.random()-0.5)*3 : 0;
    const sy = g.shakeFrames>0 ? (Math.random()-0.5)*3 : 0;
    ctx.translate(-camX + sx, -camY + sy);
    for(const s of g.pics) s.dessiner(ctx);
    for(const p of g.niveau) p.dessiner(ctx);
    // --- Drapeau de checkpoint (gris = inactif, vert lumineux = atteint) ---
    if (g.checkpoint) {
        const cp = g.checkpoint, fx = cp.x, fy = cp.y;
        const actif = cp.atteint;
        // mât
        ctx.strokeStyle = '#7f8c9b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(fx, fy - 4); ctx.lineTo(fx, fy + 36); ctx.stroke();
        // drapeau (ondule légèrement si atteint)
        const wave = actif ? Math.sin(g.frameCount / 8) * 3 : 0;
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
    for(const e of g.ennemis) e.dessiner(ctx);
    if (g.boss && (!g.bossVaincu || g.boss.mortFrame < 30)) g.boss.dessiner(ctx);
    for(const piece of g.pieces) piece.dessiner(ctx);
    for(const r of g.ressorts) r.dessiner(ctx);
    for(const pu of g.powerups) pu.dessiner(ctx);
    if(g.player && g.etat !== 'mort') g.player.dessiner(ctx);

    // Particules d'effets (confettis, débris) dans le repère monde
    for(const ef of g.effets){
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
    for(const p of g.scorePopups){
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
    dessinerHUD(g, ctx);

    // --- BANDEAU MODE DÉMO ---
    if (g.modeDemo) {
        ctx.save();
        const alpha = 0.65 + Math.sin(g.frameCount * 0.06) * 0.3;
        ctx.font = '700 20px -apple-system, "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const txt = '🎬 MODE DÉMO';
        const w = ctx.measureText(txt).width + 36;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.beginPath(); ctx.roundRect(g.W/2 - w/2, 46, w, 34, 17); ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#FFD700';
        ctx.fillText(txt, g.W/2, 70);
        ctx.globalAlpha = .8;
        ctx.font = '600 13px -apple-system, "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText('Touche l\'écran pour reprendre la main', g.W/2, 96);
        ctx.restore();
    }

    // --- BULLES TUTORIEL ---
    dessinerTuto(g, ctx);
}


export function dessinerTuto(g, ctx) {
    if (g.tutoHints.length === 0) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const h of g.tutoHints) {
        if (h.fade <= 0) continue;
        const px = g.player ? g.player.x + g.player.largeur / 2 : h.triggerX;
        const py = g.player ? g.player.y - 50 : h.y;
        ctx.globalAlpha = h.fade;
        // Mesure du texte
        ctx.font = 'bold 16px -apple-system,system-ui,sans-serif';
        const tw = ctx.measureText(h.text).width;
        const bw = tw + 28, bh = 32, bx = px - bw / 2, by = py - bh / 2;
        // Fond de la bulle
        ctx.fillStyle = 'rgba(0,0,0,.82)';
        roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
        // Bordure dorée
        ctx.strokeStyle = 'rgba(255,215,0,.5)'; ctx.lineWidth = 1.5;
        roundRect(ctx, bx, by, bw, bh, 10); ctx.stroke();
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

export function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
}

// HUD entièrement sur canvas — pas de DOM = pas de flash

export function dessinerHUD(g, ctx){
    ctx.save();
    ctx.globalAlpha=1;
    ctx.textBaseline='middle';
    ctx.font='bold 22px -apple-system,system-ui,sans-serif';

    // === CÔTÉ GAUCHE : cœurs + pièces ===
    // Cœurs
    // Cœurs : rangée classique jusqu'à 5 vies, format compact « ❤×N » au-delà
    let hText, hColor='#E74C3C';
    if (g.vies <= 5) {
        hText = '❤'.repeat(g.vies) + '🖤'.repeat(Math.max(0, 5 - g.vies));
    } else {
        hText = '❤ ×' + g.vies;
    }
    ctx.textAlign='left';
    const hw=ctx.measureText(hText).width;
    ctx.fillStyle='rgba(0,0,0,.75)';
    roundRect(ctx,10,8,hw+24,32,16);ctx.fill();
    ctx.fillStyle=hColor;
    ctx.fillText(hText,22,25);

    // Pièces
    const cText=`🪙 ${g.scoreNiveau}/${g.totalPiecesNiveau}`;
    const cw=ctx.measureText(cText).width;
    ctx.fillStyle='rgba(0,0,0,.75)';
    roundRect(ctx,10,46,cw+24,32,16);ctx.fill();
    ctx.fillStyle='#FFD700';
    ctx.fillText(cText,22,63);

    // Indicateur boss (clignotant) tant qu'il n'est pas vaincu
    if (g.boss && !g.bossVaincu) {
        const bText = `👑 Bats le boss ! (${g.boss.pv}❤)`;
        ctx.textAlign='left';
        const bw = ctx.measureText(bText).width;
        const pulse = 0.6 + 0.4 * Math.abs(Math.sin(g.frameCount/15));
        ctx.fillStyle=`rgba(155,89,182,${0.85*pulse})`;
        roundRect(ctx,10,84,bw+24,30,15);ctx.fill();
        ctx.fillStyle='#fff';
        ctx.fillText(bText,22,100);
        ctx.textAlign='left';
    }

    // === CÔTÉ DROIT : score + niveau + timer ===
    ctx.textAlign='right';

    // Score (⭐)
    const sText=`⭐ ${g.scoreCumul}`;
    const sw=ctx.measureText(sText).width;
    ctx.fillStyle='rgba(0,0,0,.82)';
    roundRect(ctx,g.W-sw-34,8,sw+24,32,16);ctx.fill();
    ctx.fillStyle='#FFD700';
    ctx.fillText(sText,g.W-22,25);

    // Niveau
    const lText=`🏁 Niv.${g.niveauActuel+1}`;
    const lw=ctx.measureText(lText).width;
    ctx.fillStyle='rgba(0,0,0,.75)';
    roundRect(ctx,g.W-lw-34,46,lw+24,32,16);ctx.fill();
    ctx.fillStyle='#5DADE2';
    ctx.fillText(lText,g.W-22,63);

    // Timer
    const tText=`⏱️ ${g.tempsNiveau.toFixed(1)}s`;
    const tw=ctx.measureText(tText).width;
    ctx.fillStyle='rgba(0,0,0,.75)';
    roundRect(ctx,g.W-tw-34,84,tw+24,32,16);ctx.fill();
    ctx.fillStyle='#5BDE60';
    ctx.fillText(tText,g.W-22,101);

    // === POWER-UPS ACTIFS (barre du bas, centrée) ===
    if(g.player){
        const pus=[];
        if(g.player.powerUpTimer.doublejump>0) pus.push({label:'JS',color:'#3498DB',frames:g.player.powerUpTimer.doublejump});
        if(g.player.powerUpTimer.shield>0) pus.push({label:'BD',color:'#F1C40F',frames:g.player.powerUpTimer.shield});
        if(g.player.powerUpTimer.speed>0) pus.push({label:'VT',color:'#E67E22',frames:g.player.powerUpTimer.speed});
        if(pus.length>0){
            ctx.font='bold 14px Arial';
            ctx.textAlign='center';
            const bw=50, gap=8;
            const totalW=pus.length*bw+(pus.length-1)*gap;
            let bx=g.W/2-totalW/2;
            const by=g.H-44;
            for(const pu of pus){
                const pct=pu.frames/600;
                // Fond
                ctx.fillStyle='rgba(0,0,0,.8)';
                roundRect(ctx,bx,by,bw,34,8);ctx.fill();
                // Label
                ctx.fillStyle=pu.color;
                ctx.fillText(pu.label,bx+bw/2,by+12);
                // Barre de temps
                ctx.fillStyle=pu.color+'40';
                roundRect(ctx,bx+6,by+22,bw-12,6,3);ctx.fill();
                ctx.fillStyle=pu.color;
                roundRect(ctx,bx+6,by+22,(bw-12)*pct,6,3);ctx.fill();
                bx+=bw+gap;
            }
        }
    }

    ctx.restore();
}
