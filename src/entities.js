/* Entités de jeu : plateformes, pics, ennemis, boss, pièces, ressorts, power-ups */

export class Platform {
    constructor(x,y,l,h,c='#228B22',t='herbe'){this.x=x;this.y=y;this.largeur=l;this.hauteur=h;this.couleur=c;this.type=t;this.baseX=x;this.baseY=y;this.dx=0}
    dessiner(ctx){ctx.fillStyle=this.couleur;ctx.fillRect(this.x,this.y,this.largeur,this.hauteur);if(this.type==='herbe'){ctx.fillStyle='#2ECC40';ctx.fillRect(this.x,this.y,this.largeur,4)}else if(this.type==='sol'){ctx.fillStyle='#A0522D';ctx.fillRect(this.x,this.y,this.largeur,4)}ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;ctx.strokeRect(this.x,this.y,this.largeur,this.hauteur)}
}
export class MovingPlatform extends Platform {
    constructor(x,y,l,h,axe,dist,vit,c='#8E44AD'){super(x,y,l,h,c,'mobile');this.axe=axe;this.baseX=x;this.baseY=y;this.distance=dist;this.vitesse=vit;this.temps=0;this.dx=0;this.dy=0}
    update(){const ox=this.x,oy=this.y;this.temps+=this.vitesse;if(this.axe==='h'){this.x=this.baseX+Math.sin(this.temps)*this.distance;this.dx=this.x-ox;this.dy=0}else{this.y=this.baseY+Math.sin(this.temps)*this.distance;this.dy=this.y-oy;this.dx=0}}
    dessiner(ctx){ctx.fillStyle=this.couleur;ctx.fillRect(this.x,this.y,this.largeur,this.hauteur);ctx.fillStyle='rgba(255,255,255,.5)';if(this.axe==='h'){ctx.fillRect(this.x+this.largeur/2-8,this.y+2,16,3);ctx.beginPath();ctx.moveTo(this.x+this.largeur/2+8,this.y+3.5);ctx.lineTo(this.x+this.largeur/2+12,this.y+6);ctx.lineTo(this.x+this.largeur/2+8,this.y+8.5);ctx.fill()}else{ctx.fillRect(this.x+2,this.y+this.hauteur/2-8,3,16);ctx.beginPath();ctx.moveTo(this.x+3.5,this.y+this.hauteur/2+8);ctx.lineTo(this.x+6,this.y+this.hauteur/2+12);ctx.lineTo(this.x+8.5,this.y+this.hauteur/2+8);ctx.fill()}ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.strokeRect(this.x,this.y,this.largeur,this.hauteur)}
}
export class Spike {
    constructor(x,y,w=30){this.x=x;this.y=y;this.w=w;this.h=20;this.largeur=w;this.hauteur=20}
    dessiner(ctx){const n=Math.floor(this.w/10);for(let i=0;i<n;i++){ctx.fillStyle='#C0392B';ctx.beginPath();ctx.moveTo(this.x+i*10,this.y+this.h);ctx.lineTo(this.x+i*10+5,this.y);ctx.lineTo(this.x+i*10+10,this.y+this.h);ctx.closePath();ctx.fill();ctx.strokeStyle='#E74C3C';ctx.lineWidth=1;ctx.stroke()}}
}
export class Ennemi {
    constructor(x,y,d=80,v=1){this.x=x;this.y=y;this.largeur=28;this.hauteur=28;this.baseX=x;this.distance=d;this.vitesse=v;this.direction=1;this.temps=0;this.mort=false;this.mortFrame=0;this.ecrasable=true}
    update(){if(this.mort){this.mortFrame++;return}this.temps+=0.03;this.x=this.baseX+Math.sin(this.temps*this.vitesse)*this.distance;this.direction=Math.cos(this.temps*this.vitesse)>0?1:-1}
    dessiner(ctx){if(this.mort){if(this.mortFrame<15){const s=1-this.mortFrame/15;ctx.fillStyle='#8B4513';ctx.fillRect(this.x+(1-s)*14,this.y+this.hauteur-6*s,this.largeur*s,6*s)}return}ctx.fillStyle='#9B59B6';ctx.fillRect(this.x,this.y,this.largeur,this.hauteur);ctx.strokeStyle='#7D3C98';ctx.lineWidth=2;ctx.strokeRect(this.x,this.y,this.largeur,this.hauteur);const ox=this.direction>0?8:4;ctx.fillStyle='#FFF';ctx.fillRect(this.x+ox,this.y+5,7,7);ctx.fillRect(this.x+ox+10,this.y+5,7,7);ctx.fillStyle='#E74C3C';ctx.fillRect(this.x+ox+2,this.y+7,4,4);ctx.fillRect(this.x+ox+12,this.y+7,4,4);ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(this.x+ox,this.y+4);ctx.lineTo(this.x+ox+7,this.y+6);ctx.moveTo(this.x+ox+17,this.y+4);ctx.lineTo(this.x+ox+10,this.y+6);ctx.stroke()}
}

// ============================================================
//  ENNEMI VOLANT (abeille/guêpe) — NON écrasable, vole et poursuit
// ============================================================
export class EnnemiVolant {
    constructor(x, y, d = 120, v = 1) {
        this.baseX = x; this.baseY = y;
        this.x = x; this.y = y;
        this.largeur = 26; this.hauteur = 22;
        this.distance = d; this.vitesse = v;
        this.temps = Math.random() * 6.28;
        this.direction = 1;
        this.mort = false; this.mortFrame = 0;
        this.ecrasable = false;   // ← NE PEUT PAS être écrasé
        this.ailePhase = 0;       // Animation des ailes
    }
    update(player) {
        if (this.mort) { this.mortFrame++; return; }
        this.temps += 0.025 * this.vitesse;
        this.ailePhase += 0.4;
        // Mouvement sinusoïdal horizontal + vertical
        this.x = this.baseX + Math.sin(this.temps) * this.distance;
        this.y = this.baseY + Math.sin(this.temps * 1.7) * 30;
        this.direction = Math.cos(this.temps) > 0 ? 1 : -1;
    }
    dessiner(ctx) {
        if (this.mort) {
            if (this.mortFrame < 15) {
                const s = 1 - this.mortFrame / 15;
                ctx.globalAlpha = s;
                ctx.fillStyle = '#F39C12';
                ctx.fillRect(this.x + (1 - s) * 13, this.y, this.largeur * s, this.hauteur);
                ctx.globalAlpha = 1;
            }
            return;
        }
        // Ailes (qui battent)
        const aw = Math.abs(Math.sin(this.ailePhase)) * 10 + 6;
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.largeur / 2 - 5, this.y - 2, aw, 6, -0.3, 0, 6.28);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + this.largeur / 2 + 8, this.y - 2, aw, 6, 0.3, 0, 6.28);
        ctx.fill();
        // Corps (rayé jaune/noir)
        ctx.fillStyle = '#F39C12';
        ctx.beginPath();
        ctx.ellipse(this.x + this.largeur / 2, this.y + this.hauteur / 2, this.largeur / 2, this.hauteur / 2, 0, 0, 6.28);
        ctx.fill();
        // Rayures noires
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(this.x + this.largeur / 2 - 2, this.y + 3, 3, this.hauteur - 6);
        ctx.fillRect(this.x + this.largeur / 2 + 4, this.y + 5, 3, this.hauteur - 10);
        // Dard
        const dx = this.direction > 0 ? this.x + this.largeur : this.x - 5;
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(dx, this.y + this.hauteur / 2);
        ctx.lineTo(dx + (this.direction > 0 ? 6 : -6), this.y + this.hauteur / 2 - 3);
        ctx.lineTo(dx + (this.direction > 0 ? 6 : -6), this.y + this.hauteur / 2 + 3);
        ctx.fill();
        // Yeux
        const ox = this.direction > 0 ? 10 : 4;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + ox, this.y + 5, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + ox + 1, this.y + 6, 2, 2);
    }
}

// ============================================================
//  ENNEMI SAUT (blob rebondissant) — écrasable, saute en boucle
// ============================================================
export class EnnemiSaut {
    constructor(x, y, d = 0, v = 1) {
        this.x = x; this.y = y;
        this.largeur = 28; this.hauteur = 28;
        this.baseX = x; this.baseY = y;
        this.vy = 0;
        this.hauteurSaut = 110 + (v - 1) * 30;  // Hauteur du bond
        this.temps = Math.random() * 120;        // Décale les sauts entre ennemis
        this.delaiSaut = 80 - (v - 1) * 10;      // Frames entre chaque saut (plus v = plus rapide)
        this.direction = 1;
        this.mort = false; this.mortFrame = 0;
        this.ecrasable = true;   // ← PEUT être écrasé
        this.auSol = true;
        this.compression = 0;    // Animation visuelle
    }
    update(player) {
        if (this.mort) { this.mortFrame++; return; }
        if (this.compression > 0) this.compression--;
        if (this.auSol) {
            this.temps++;
            if (this.temps >= this.delaiSaut) {
                this.vy = -Math.sqrt(2 * 0.6 * this.hauteurSaut);  // Impulsion calculée pour la hauteur
                this.auSol = false;
                this.temps = 0;
                this.compression = 0;  // Se décompressera au décollage
            } else if (this.temps >= this.delaiSaut - 8) {
                this.compression = this.delaiSaut - this.temps;  // Se compresse avant de sauter
            }
        }
        if (!this.auSol) {
            this.vy += 0.6;
            this.y += this.vy;
            if (this.y >= this.baseY) {
                this.y = this.baseY;
                this.vy = 0;
                this.auSol = true;
                this.compression = 6;  // Petit écrasement à l'atterrissage
            }
        }
    }
    dessiner(ctx) {
        if (this.mort) {
            if (this.mortFrame < 15) {
                const s = 1 - this.mortFrame / 15;
                ctx.fillStyle = '#1ABC9C';
                ctx.fillRect(this.x + (1 - s) * 14, this.y + this.hauteur - 6 * s, this.largeur * s, 6 * s);
            }
            return;
        }
        // Compression visuelle (avant saut + à l'atterrissage)
        const comp = this.compression > 0 ? Math.sin((6 - this.compression) / 6 * Math.PI) * 4 : 0;
        const dy = comp;
        const dh = comp;
        // Corps (blob vert/turquoise)
        ctx.fillStyle = '#1ABC9C';
        ctx.beginPath();
        ctx.ellipse(this.x + this.largeur / 2, this.y + this.hauteur / 2 + dy, this.largeur / 2, this.hauteur / 2 + dh, 0, 0, 6.28);
        ctx.fill();
        ctx.strokeStyle = '#16A085'; ctx.lineWidth = 2;
        ctx.stroke();
        // Yeux
        const ox = this.direction > 0 ? 8 : 4;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + ox, this.y + 6 + dy, 7, 7);
        ctx.fillRect(this.x + ox + 10, this.y + 6 + dy, 7, 7);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + ox + 2, this.y + 8 + dy, 3, 3);
        ctx.fillRect(this.x + ox + 12, this.y + 8 + dy, 3, 3);
        // Ombre au sol
        if (!this.auSol) {
            const o = (this.baseY - this.y) / this.hauteurSaut;
            ctx.fillStyle = `rgba(0,0,0,${0.3 * (1 - o)})`;
            ctx.beginPath();
            ctx.ellipse(this.x + this.largeur / 2, this.baseY + this.hauteur, this.largeur / 2 * (1 - o * 0.4), 4, 0, 0, 6.28);
            ctx.fill();
        }
    }
}
// ============================================================
//  BOSS — gros ennemi à écraser 3 fois sur la tête
// ============================================================
export class Boss {
    constructor(x, y, mondeW, bornes) {
        this.largeur = 60; this.hauteur = 52;
        this.x = x; this.y = y;
        this.baseY = y;
        this.mondeW = mondeW || 800;
        // bornes horizontales de patrouille (par défaut tout le monde)
        this.minX = bornes ? bornes.min : 4;
        this.maxX = bornes ? bornes.max : (this.mondeW - 4 - this.largeur);
        this.pv = 3; this.pvMax = 3;
        this.vitesse = 1.4;
        this.direction = 1;
        this.mort = false; this.mortFrame = 0;
        this.ecrasable = true;     // mais géré spécialement (3 coups)
        this.estBoss = true;       // marqueur pour le moteur
        this.invincible = 0;       // frames d'invincibilité après un coup (clignote)
        this.compression = 0;      // animation à l'atterrissage du joueur
        this.temps = 0;
        this.colere = 0;           // 0..1, augmente quand il perd des PV (devient plus rapide)
    }
    // Reçoit un coup sur la tête : renvoie true si vaincu
    encaisser() {
        if (this.invincible > 0 || this.mort) return false;
        this.pv--;
        this.invincible = 20;   // < durée d'un arc de rebond (~28 frames) : chaque écrasement
                                 //   atterrit APRÈS la fin de l'invincibilité → 3 écrasements
                                 //   = boss vaincu (sans « rebonds fantômes » sans dégât).
        this.compression = 10;
        this.colere = 1 - this.pv / this.pvMax;
        if (this.pv <= 0) { this.mort = true; this.mortFrame = 0; return true; }
        return false;
    }
    update(player) {
        if (this.mort) { this.mortFrame++; return; }
        if (this.invincible > 0) this.invincible--;
        if (this.compression > 0) this.compression--;
        this.temps += 0.05;
        const v = this.vitesse * (1 + this.colere * 0.8);
        this.x += v * this.direction;
        if (this.x <= this.minX) { this.x = this.minX; this.direction = 1; }
        if (this.x >= this.maxX) { this.x = this.maxX; this.direction = -1; }
        this.y = this.baseY + Math.abs(Math.sin(this.temps * 2)) * -4;
    }
    dessiner(ctx) {
        if (this.mort) {
            if (this.mortFrame < 30) {
                const s = 1 + this.mortFrame / 10;
                const a = 1 - this.mortFrame / 30;
                ctx.globalAlpha = a;
                ctx.fillStyle = '#C0392B';
                const cx = this.x + this.largeur / 2, cy = this.y + this.hauteur / 2;
                ctx.beginPath(); ctx.arc(cx, cy, (this.largeur / 2) * s, 0, 6.28); ctx.fill();
                ctx.globalAlpha = 1;
            }
            return;
        }
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;
        const comp = this.compression > 0 ? Math.sin((10 - this.compression) / 10 * Math.PI) * 5 : 0;
        const x = this.x, y = this.y + comp, L = this.largeur, H = this.hauteur - comp;
        const cx = x + L / 2;
        const r = Math.round(155 + this.colere * 80), g = Math.round(89 - this.colere * 40), b = Math.round(182 - this.colere * 100);
        const grad = ctx.createLinearGradient(x, y, x, y + H);
        grad.addColorStop(0, `rgb(${Math.min(255,r+30)},${g+20},${b+20})`);
        grad.addColorStop(1, `rgb(${r},${g},${b})`);
        ctx.fillStyle = grad;
        this._rr(ctx, x, y, L, H, 10); ctx.fill();
        ctx.strokeStyle = '#5B2C6F'; ctx.lineWidth = 3; this._rr(ctx, x, y, L, H, 10); ctx.stroke();
        // couronne (c'est un boss !)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(cx - 16, y - 2); ctx.lineTo(cx - 16, y - 12); ctx.lineTo(cx - 8, y - 5);
        ctx.lineTo(cx, y - 14); ctx.lineTo(cx + 8, y - 5); ctx.lineTo(cx + 16, y - 12);
        ctx.lineTo(cx + 16, y - 2); ctx.closePath(); ctx.fill();
        // yeux féroces (suivent la direction)
        const ox = this.direction > 0 ? 6 : -6;
        ctx.fillStyle = '#FFF';
        ctx.beginPath(); ctx.ellipse(cx - 12 + ox, y + 22, 8, 9, 0, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 12 + ox, y + 22, 8, 9, 0, 0, 6.28); ctx.fill();
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath(); ctx.arc(cx - 12 + ox * 1.4, y + 23, 3.5, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 12 + ox * 1.4, y + 23, 3.5, 0, 6.28); ctx.fill();
        // sourcils en colère
        ctx.strokeStyle = '#2C0B3F'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - 20, y + 14); ctx.lineTo(cx - 6, y + 19);
        ctx.moveTo(cx + 20, y + 14); ctx.lineTo(cx + 6, y + 19); ctx.stroke();
        // bouche
        ctx.strokeStyle = '#2C0B3F'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(cx, y + H - 8, 6 + (this.pvMax - this.pv) * 2, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
        // barre de vie au-dessus
        const bw = L, bx = x, by = y - 22;
        ctx.fillStyle = 'rgba(0,0,0,.5)'; this._rr(ctx, bx, by, bw, 6, 3); ctx.fill();
        ctx.fillStyle = '#E74C3C';
        if (this.pv > 0) { this._rr(ctx, bx, by, bw * (this.pv / this.pvMax), 6, 3); ctx.fill(); }
    }
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
}
export class Coin {
    constructor(x,y){this.x=x;this.y=y;this.rayon=10;this.collectee=false;this.temps=Math.random()*6.28;this.offsetY=0;this.rotation=0;this.particles=[]}
    update(){if(this.collectee){for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.3;p.vie--;if(p.vie<=0)this.particles.splice(i,1)}return}this.temps+=0.05;this.offsetY=Math.sin(this.temps)*5;this.rotation=Math.abs(Math.sin(this.temps*1.5))}
    testerCollecte(player){if(this.collectee)return false;const px=Math.max(player.x,Math.min(this.x,player.x+player.largeur));const py=Math.max(player.y,Math.min(this.y+this.offsetY,player.y+player.hauteur));const dx=this.x-px,dy=(this.y+this.offsetY)-py;if(Math.sqrt(dx*dx+dy*dy)<this.rayon+4){this.collectee=true;for(let i=0;i<8;i++){const a=(6.28*i)/8;this.particles.push({x:this.x,y:this.y+this.offsetY,vx:Math.cos(a)*3,vy:Math.sin(a)*3-2,vie:25,couleur:['#FFD700','#FFA500','#FFF'][i%3]})}return true}return false}
    dessiner(ctx){for(const p of this.particles){ctx.globalAlpha=p.vie/25;ctx.fillStyle=p.couleur;ctx.fillRect(p.x-2,p.y-2,4,4)}ctx.globalAlpha=1;if(this.collectee)return;const cy=this.y+this.offsetY;const ls=this.rayon*2*(0.3+this.rotation*0.7);const grad=ctx.createRadialGradient(this.x,cy,0,this.x,cy,this.rayon*2.5);grad.addColorStop(0,'rgba(255,215,0,.35)');grad.addColorStop(1,'rgba(255,215,0,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(this.x,cy,this.rayon*2.5,0,6.28);ctx.fill();ctx.fillStyle='#FFD700';ctx.beginPath();ctx.ellipse(this.x,cy,Math.max(2,ls/2),this.rayon,0,0,6.28);ctx.fill();ctx.strokeStyle='#DAA520';ctx.lineWidth=2;ctx.stroke();if(ls>8){ctx.fillStyle='#FFF8DC';ctx.beginPath();ctx.ellipse(this.x,cy-2,Math.max(1,ls/6),this.rayon/3,0,0,6.28);ctx.fill()}}
}

// ============================================================
//  RESSORT / TRAMPOLINE — fait rebondir très haut
// ============================================================
export class Ressort {
    constructor(x, y, w = 36) {
        this.x = x; this.y = y;
        this.largeur = w; this.hauteur = 14;
        this.w = w; this.h = 14;
        this.compression = 0; // Animation visuelle au rebond
        this.force = -19;     // Force du rebond (très haut)
    }
    update() { if (this.compression > 0) this.compression--; }
    // Vérifie si le joueur tombe sur le ressort → déclenche le rebond
    testerRebond(player) {
        if (player.vy >= 0 && // En chute ou immobile
            player.x + player.largeur > this.x &&
            player.x < this.x + this.largeur &&
            player.y + player.hauteur >= this.y - 2 &&
            player.y + player.hauteur <= this.y + this.hauteur + 12) {
            this.compression = 12;
            return true;
        }
        return false;
    }
    dessiner(ctx) {
        const c = this.compression;
        const dy = c > 0 ? Math.sin((12 - c) / 12 * Math.PI) * 5 : 0;
        // Base en bois
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y + 10, this.largeur, 4);
        // Spirales du ressort
        ctx.strokeStyle = '#BDC3C7'; ctx.lineWidth = 2;
        const n = Math.floor(this.largeur / 9);
        for (let i = 0; i < n; i++) {
            ctx.beginPath();
            ctx.arc(this.x + 4 + i * 9, this.y + 6 - dy, 4, 0, Math.PI);
            ctx.stroke();
        }
        // Plaque supérieure rouge
        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(this.x, this.y - dy, this.largeur, 4);
        ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y - dy, this.largeur, 4);
        // Flèche ▲
        ctx.fillStyle = 'rgba(255,255,255,.7)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▲', this.x + this.largeur / 2, this.y - dy - 8);
    }
}

// ============================================================
//  POWER-UP — bonus temporaires (double saut, bouclier, vitesse)
// ============================================================
export class PowerUp {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.rayon = 14;
        this.type = type; // 'doublejump', 'shield', 'speed'
        this.collectee = false;
        this.temps = Math.random() * 6.28;
        this.offsetY = 0;
        this.particles = [];
    }
    update() {
        if (this.collectee) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vie--;
                if (p.vie <= 0) this.particles.splice(i, 1);
            }
            return;
        }
        this.temps += 0.04;
        this.offsetY = Math.sin(this.temps) * 6;
    }
    testerCollecte(player) {
        if (this.collectee) return false;
        const px = Math.max(player.x, Math.min(this.x, player.x + player.largeur));
        const py = Math.max(player.y, Math.min(this.y + this.offsetY, player.y + player.hauteur));
        const dx = this.x - px, dy = (this.y + this.offsetY) - py;
        if (Math.sqrt(dx * dx + dy * dy) < this.rayon + 6) {
            this.collectee = true;
            const config = this.getConfig();
            for (let i = 0; i < 10; i++) {
                const a = (6.28 * i) / 10;
                this.particles.push({x: this.x, y: this.y + this.offsetY, vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5 - 1.5, vie: 30, couleur: config.color});
            }
            return true;
        }
        return false;
    }
    getConfig() {
        return {
            'doublejump': {color: '#3498DB', label: 'JS'},
            'shield':     {color: '#F1C40F', label: 'BD'},
            'speed':      {color: '#E67E22', label: 'VT'}
        }[this.type] || {color: '#FFF', label: '??'};
    }
    dessiner(ctx) {
        // Particules de collecte
        for (const p of this.particles) {
            ctx.globalAlpha = p.vie / 30;
            ctx.fillStyle = p.couleur;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
        if (this.collectee) return;
        const cy = this.y + this.offsetY;
        const config = this.getConfig();
        // Halo lumineux
        const grad = ctx.createRadialGradient(this.x, cy, 0, this.x, cy, this.rayon * 2.5);
        grad.addColorStop(0, config.color + '60');
        grad.addColorStop(1, config.color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(this.x, cy, this.rayon * 2.5, 0, 6.28); ctx.fill();
        // Disque
        ctx.fillStyle = config.color;
        ctx.beginPath(); ctx.arc(this.x, cy, this.rayon, 0, 6.28); ctx.fill();
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; ctx.stroke();
        // Anneau pulsant
        const pulse = Math.sin(this.temps * 2) * 3 + 4;
        ctx.strokeStyle = config.color + '80'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(this.x, cy, this.rayon + pulse, 0, 6.28); ctx.stroke();
        // Label
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(config.label, this.x, cy);
    }
}

// ============================================================
//  NIVEAUX
// ============================================================
