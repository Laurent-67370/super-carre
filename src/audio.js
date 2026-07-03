/* AudioManager — Web Audio (bruitages + 4 ambiances musicales) */

export class AudioManager {
    constructor() { this.ctx = null; this.ok = false; }
    init() {
        if (this.ok) return;
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.ok = true; } catch(e){}
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    beep(f1, f2, dur, type='square', vol=0.12) {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f1, t);
        o.frequency.linearRampToValueAtTime(f2, t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(t); o.stop(t + dur);
    }
    saut() { this.beep(200, 600, 0.12, 'square', 0.1); }
    piece() { this.beep(880, 880, 0.06, 'square', 0.12); setTimeout(()=>this.beep(1320,1320,0.08,'square',0.12),60); }
    degat() { this.beep(400, 80, 0.3, 'sawtooth', 0.15); }
    ecrase() { this.beep(600, 150, 0.15, 'square', 0.12); }
    victoire() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.beep(f,f,0.18,'square',0.12),i*130)); }
    transition() { this.beep(440, 880, 0.2, 'sine', 0.08); }

    // ============================================================
    //  FANFARE D'INTRO (🍿 générique) — composition ORIGINALE
    //  dans l'esprit des grands génériques spatiaux : timbales,
    //  cuivres héroïques et nappes en quintes. Aucune œuvre
    //  existante n'est reproduite.
    // ============================================================
    jouerFanfare() {
        if (!this.ctx) return;
        this.arreterFanfare();
        this.fanfareGain = this.ctx.createGain();
        this.fanfareGain.gain.value = this.musiqueMuet ? 0 : 0.1;
        this.fanfareGain.connect(this.ctx.destination);
        this._fanfareActive = true;
        this._boucleFanfare();
    }
    arreterFanfare() {
        this._fanfareActive = false;
        if (this._fanfareTimer) { clearTimeout(this._fanfareTimer); this._fanfareTimer = null; }
        if (this.fanfareGain) {
            try {
                const t = this.ctx.currentTime;
                this.fanfareGain.gain.cancelScheduledValues(t);
                this.fanfareGain.gain.setValueAtTime(this.fanfareGain.gain.value, t);
                this.fanfareGain.gain.linearRampToValueAtTime(0, t + 0.25);
                const g = this.fanfareGain;
                setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 400);
            } catch (e) {}
            this.fanfareGain = null;
        }
    }
    // Une note vers le bus fanfare (enveloppe attaque/relâche douce)
    _noteFanfare(freq, t, dur, type = 'sawtooth', vol = 0.5) {
        if (!this.ctx || !this.fanfareGain || !freq) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.04);
        g.gain.setValueAtTime(vol, t + Math.max(0.05, dur - 0.12));
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(this.fanfareGain);
        o.start(t); o.stop(t + dur + 0.05);
    }
    // Coup de timbale (basse triangle percussive)
    _timbale(freq, t, vol = 0.9) {
        if (!this.ctx || !this.fanfareGain) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.6), t + 0.28);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
        o.connect(g); g.connect(this.fanfareGain);
        o.start(t); o.stop(t + 0.36);
    }
    _boucleFanfare() {
        if (!this._fanfareActive || !this.ctx || !this.fanfareGain) return;
        const t0 = this.ctx.currentTime + 0.06;
        const T = 0.44; // pulsation
        const DO2 = 65.41, SOL2 = 98.0;
        // --- Appel de timbales (roulement montant) ---
        [0, 0.5, 1, 1.4, 1.7, 1.9, 2.05, 2.2].forEach((d, i) => {
            this._timbale(i % 2 ? SOL2 : DO2, t0 + d, 0.55 + i * 0.05);
        });
        const debut = t0 + 2.6;
        // --- Mélodie de cuivres (originale) : élan, réponse, sommet, résolution ---
        // [fréquence, durée en pulsations]
        const phrases = [
            [[392, .5], [392, .5], [523, 2.6], [659, 1], [587, 1], [523, 1], [587, 2.4]],   // élan
            [[349, .5], [349, .5], [440, 2.6], [523, 1], [494, 1], [440, 1], [494, 2.4]],   // réponse
            [[392, .5], [440, .5], [523, 1.6], [659, 1], [698, 1], [784, 3]],               // sommet
            [[659, 1], [587, 1], [523, 1], [494, 1.2], [523, 3.4]]                          // résolution
        ];
        // Nappes en quintes sous chaque phrase (cordes sinusoïdales)
        const nappes = [[130.8, 196.0], [174.6, 261.6], [130.8, 196.0], [130.8, 196.0]];
        let t = debut;
        phrases.forEach((phrase, i) => {
            const dureePhrase = phrase.reduce((s, n) => s + n[1], 0) * T;
            for (const f of nappes[i]) this._noteFanfare(f, t, dureePhrase + 0.2, 'sine', 0.28);
            // pulsation de timbales sous la phrase
            for (let b = 0; b < Math.floor(dureePhrase / (T * 2)); b++) {
                this._timbale(b % 2 ? SOL2 : DO2, t + b * T * 2, 0.5);
            }
            for (const [freq, beats] of phrase) {
                const dur = beats * T;
                // cuivre principal + doublure à l'octave, léger désaccord chaleureux
                this._noteFanfare(freq, t, dur, 'sawtooth', 0.42);
                this._noteFanfare(freq * 2.003, t, dur, 'square', 0.1);
                t += dur;
            }
        });
        // Boucle : relance juste avant la fin
        const total = (t - t0 + 0.6) * 1000;
        this._fanfareTimer = setTimeout(() => this._boucleFanfare(), total);
    }

    // === MUSIQUE DE FOND ===
    // Mélodie chiptune générée en boucle. Programmée par petits blocs pour
    // rester fluide. Coupable via muet (n'affecte pas les bruitages).
    demarrerMusique() {
        if (!this.ctx || this.musiqueActive) return;
        this.musiqueActive = true;
        this.musiqueMuet = this.musiqueMuet || false;
        if (this.pisteIndex == null) this.pisteIndex = 0;
        // Gain maître de la musique (séparé des bruitages)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musiqueMuet ? 0 : 0.06;
        this.musicGain.connect(this.ctx.destination);
        this._chargerPiste(this.pisteIndex);
        this.noteIndex = 0;
        this.basseIndex = 0;
        this.prochaineNote = this.ctx.currentTime + 0.1;
        this._planifierMusique();
    }
    // Catalogue des pistes musicales (toutes générées, aucun fichier audio)
    static get PISTES() {
        return [
            {
                nom: 'Aventure', emoji: '🗺️', onde: 'square', tempo: 0.16, volMel: 0.5, volBasse: 0.7, ondeBasse: 'triangle',
                melodie: [
                    440,0,523,0, 659,0,523,0, 440,0,392,0, 440,440,0,0,
                    349,0,440,0, 523,0,440,0, 392,0,330,0, 392,392,0,0,
                    440,0,523,0, 659,0,784,0, 659,0,523,0, 440,440,0,0,
                    523,0,494,0, 440,0,392,0, 440,0,494,0, 523,523,0,0
                ],
                basse: [220,165,220,196]
            },
            {
                nom: 'Calme', emoji: '🌙', onde: 'triangle', tempo: 0.24, volMel: 0.55, volBasse: 0.6, ondeBasse: 'sine',
                melodie: [
                    523,0,0,0, 587,0,659,0, 523,0,0,0, 392,0,0,0,
                    440,0,0,0, 523,0,587,0, 523,0,0,0,0,0,0,0,
                    659,0,0,0, 587,0,523,0, 494,0,0,0, 440,0,0,0,
                    523,0,0,0, 494,0,440,0, 392,0,0,0,0,0,0,0
                ],
                basse: [262,196,220,294]
            },
            {
                nom: 'Rétro', emoji: '👾', onde: 'sawtooth', tempo: 0.12, volMel: 0.42, volBasse: 0.6, ondeBasse: 'square',
                melodie: [
                    330,330,392,392, 494,494,392,0, 330,392,494,587, 494,392,330,0,
                    349,349,440,440, 523,523,440,0, 349,440,523,659, 523,440,349,0,
                    392,494,587,494, 392,330,392,494, 587,659,587,494, 392,330,294,0,
                    330,392,494,659, 587,494,392,330, 294,330,392,494, 392,0,0,0
                ],
                basse: [165,165,196,131]
            },
            {
                nom: 'Mystère', emoji: '🔮', onde: 'sine', tempo: 0.22, volMel: 0.6, volBasse: 0.55, ondeBasse: 'triangle',
                melodie: [
                    440,0,0,466, 0,0,415,0, 440,0,0,0, 349,0,0,0,
                    415,0,0,440, 0,0,392,0, 349,0,0,0,0,0,0,0,
                    523,0,0,494, 0,0,440,0, 466,0,0,0, 415,0,0,0,
                    440,0,415,0, 392,0,349,0, 330,0,0,0,0,0,0,0
                ],
                basse: [110,117,98,87]
            }
        ];
    }
    _chargerPiste(idx) {
        const p = AudioManager.PISTES[idx] || AudioManager.PISTES[0];
        this.melodie = p.melodie;
        this.basse = p.basse;
        this.tempoNote = p.tempo;
        this._ondeMel = p.onde;
        this._ondeBasse = p.ondeBasse;
        this._volMel = p.volMel;
        this._volBasse = p.volBasse;
    }
    // Change de piste à chaud (redémarre la séquence en gardant le flux)
    changerPiste(idx) {
        this.pisteIndex = idx;
        if (this.musiqueActive && this.ctx) {
            this._chargerPiste(idx);
            this.noteIndex = 0;
            this.basseIndex = 0;
            this.prochaineNote = this.ctx.currentTime + 0.05;
        }
    }
    _planifierMusique() {
        if (!this.musiqueActive || !this.ctx) return;
        const maintenant = this.ctx.currentTime;
        // Programmer les notes jusqu'à 0,3s dans le futur
        while (this.prochaineNote < maintenant + 0.3) {
            const f = this.melodie[this.noteIndex % this.melodie.length];
            if (f > 0) this._noteMusique(f, this.prochaineNote, this.tempoNote * 0.9, this._ondeMel, this._volMel);
            // basse tous les 4 temps
            if (this.noteIndex % 4 === 0) {
                const bf = this.basse[this.basseIndex % this.basse.length];
                this._noteMusique(bf, this.prochaineNote, this.tempoNote * 3.6, this._ondeBasse, this._volBasse);
                this.basseIndex++;
            }
            this.noteIndex++;
            this.prochaineNote += this.tempoNote;
        }
        this._musiqueTimer = setTimeout(() => this._planifierMusique(), 100);
    }
    _noteMusique(freq, t, dur, type, vol) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.musicGain);
        o.start(t); o.stop(t + dur + 0.05);
    }
    arreterMusique() {
        this.musiqueActive = false;
        if (this._musiqueTimer) clearTimeout(this._musiqueTimer);
        if (this.musicGain) { try { this.musicGain.disconnect(); } catch(e){} this.musicGain = null; }
    }
    basculerMuet() {
        this.musiqueMuet = !this.musiqueMuet;
        if (this.musicGain) {
            const t = this.ctx.currentTime;
            this.musicGain.gain.setValueAtTime(this.musiqueMuet ? 0 : 0.06, t);
        }
        return this.musiqueMuet;
    }
}

// ============================================================
//  PLAYER
// ============================================================
