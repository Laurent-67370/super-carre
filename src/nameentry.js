/* NameEntry — saisie du nom pour le Hall of Fame */

export class NameEntry {
    constructor(onValidate) {
        this.lettres = ['A','A','A'];
        this.positionActive = 0;
        this.alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
        this.indexLettre = [0, 0, 0];
        this.onValidate = onValidate;
        this.container = document.getElementById('name-entry');
        this.lettersDisplay = document.getElementById('letters-display');
        this.scoreDisplay = document.getElementById('ne-score-display');
        this.posIndicator = document.getElementById('pos-indicator');
        this.initialiser();
    }

    initialiser() {
        this.lettersDisplay.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const slot = document.createElement('div');
            slot.className = 'letter-slot';
            slot.innerHTML = `
                <button class="letter-nav up" data-pos="${i}" data-dir="1">▲</button>
                <div class="letter-3d ${i === 0 ? 'active' : 'inactive'}" data-pos="${i}">
                    <div class="side"></div>
                    <div class="face">${this.lettres[i]}</div>
                </div>
                <button class="letter-nav down" data-pos="${i}" data-dir="-1">▼</button>
            `;
            this.lettersDisplay.appendChild(slot);
        }

        // Boutons flèches haut/bas pour chaque lettre
        this.lettersDisplay.querySelectorAll('.letter-nav').forEach(btn => {
            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const pos = parseInt(btn.dataset.pos);
                const dir = parseInt(btn.dataset.dir);
                this.selectionnerPosition(pos);
                this.changerLettre(dir);
            };
            btn.addEventListener('touchstart', handler, {passive:false});
            btn.addEventListener('mousedown', handler);
            btn.addEventListener('contextmenu', e => e.preventDefault());
        });

        // Toucher direct sur une lettre = sélectionner cette position
        this.lettersDisplay.querySelectorAll('.letter-3d').forEach(el => {
            const handler = (e) => {
                e.preventDefault();
                const pos = parseInt(el.dataset.pos);
                this.selectionnerPosition(pos);
            };
            el.addEventListener('touchstart', handler, {passive:false});
            el.addEventListener('mousedown', handler);
        });

        // Swipe vertical sur chaque lettre pour changer rapidement
        this.lettersDisplay.querySelectorAll('.letter-3d').forEach(el => {
            let startY = 0, startTime = 0;
            el.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                startTime = Date.now();
            }, {passive:true});
            el.addEventListener('touchend', (e) => {
                const endY = e.changedTouches[0].clientY;
                const dy = startY - endY;
                const dt = Date.now() - startTime;
                if (Math.abs(dy) > 20 && dt < 500) {
                    e.preventDefault();
                    const pos = parseInt(el.dataset.pos);
                    this.selectionnerPosition(pos);
                    this.changerLettre(dy > 0 ? 1 : -1);
                }
            }, {passive:false});
        });

        // Boutons valider / passer
        document.getElementById('btn-validate-name').addEventListener('click', (e) => {
            e.preventDefault(); this.valider();
        });
        document.getElementById('btn-skip-name').addEventListener('click', (e) => {
            e.preventDefault(); this.lettres = ['?','?','?']; this.valider();
        });

        // --- CLAVIER PHYSIQUE ---
        // ↑/↓ : fait défiler la lettre • ←/→ : change de position
        // A-Z / 0-9 : frappe directe (avance automatiquement)
        // Entrée : valide • Retour arrière : efface et recule
        this._surClavier = (e) => {
            if (!this.container.classList.contains('show')) return;
            const k = e.key;
            if (k === 'ArrowUp')        { e.preventDefault(); this.changerLettre(1); }
            else if (k === 'ArrowDown') { e.preventDefault(); this.changerLettre(-1); }
            else if (k === 'ArrowRight'){ e.preventDefault(); this.selectionnerPosition(Math.min(2, this.positionActive + 1)); }
            else if (k === 'ArrowLeft') { e.preventDefault(); this.selectionnerPosition(Math.max(0, this.positionActive - 1)); }
            else if (k === 'Enter')     { e.preventDefault(); this.valider(); }
            else if (k === 'Backspace') {
                e.preventDefault();
                this._poserLettre('A', false);
                this.selectionnerPosition(Math.max(0, this.positionActive - 1));
            }
            else if (/^[a-zA-Z0-9]$/.test(k)) {
                e.preventDefault();
                this._poserLettre(k.toUpperCase(), true);
            }
        };
        document.addEventListener('keydown', this._surClavier);
    }

    // Pose un caractère à la position active (frappe directe),
    // avec l'animation de flip et l'avancée automatique.
    _poserLettre(car, avancer) {
        const idx = this.alphabet.indexOf(car);
        if (idx < 0) return;
        this.indexLettre[this.positionActive] = idx;
        this.lettres[this.positionActive] = car;
        this.rafraichir();
        const el = this.lettersDisplay.querySelectorAll('.letter-3d')[this.positionActive];
        el.classList.remove('flip-up', 'flip-down');
        void el.offsetWidth;
        el.classList.add('flip-up');
        if (window._gameAudio) window._gameAudio.beep(300 + idx * 18, 300 + idx * 18, 0.04, 'square', 0.05);
        if (avancer && this.positionActive < 2) this.selectionnerPosition(this.positionActive + 1);
    }

    afficher(pieces, temps) {
        this.scoreDisplay.textContent = `🪙 ${pieces} pièces • ⏱️ ${temps.toFixed(1)}s`;
        this.lettres = ['A','A','A'];
        this.indexLettre = [0, 0, 0];
        this.positionActive = 0;
        this.rafraichir();
        this.container.classList.add('show');
    }

    selectionnerPosition(pos) {
        if (this.positionActive === pos) return;
        this.positionActive = pos;
        this.rafraichir();
        if (window._gameAudio) window._gameAudio.beep(440 + pos * 80, 660 + pos * 80, 0.06, 'sine', 0.06);
    }

    changerLettre(direction) {
        const idx = this.indexLettre[this.positionActive];
        let nouvelIdx = idx + direction;
        if (nouvelIdx < 0) nouvelIdx = this.alphabet.length - 1;
        if (nouvelIdx >= this.alphabet.length) nouvelIdx = 0;
        this.indexLettre[this.positionActive] = nouvelIdx;
        this.lettres[this.positionActive] = this.alphabet[nouvelIdx];
        this.rafraichir();

        // Animation flip sur la lettre active
        const slots = this.lettersDisplay.querySelectorAll('.letter-3d');
        const el = slots[this.positionActive];
        const animClass = direction > 0 ? 'flip-up' : 'flip-down';
        el.classList.remove('flip-up', 'flip-down');
        void el.offsetWidth;
        el.classList.add(animClass);

        // Son qui monte avec l'alphabet
        if (window._gameAudio) {
            const freq = 300 + nouvelIdx * 18;
            window._gameAudio.beep(freq, freq, 0.04, 'square', 0.05);
        }
    }

    rafraichir() {
        const slots = this.lettersDisplay.querySelectorAll('.letter-3d');
        slots.forEach((el, i) => {
            el.classList.toggle('active', i === this.positionActive);
            el.classList.toggle('inactive', i !== this.positionActive);
            el.querySelector('.face').textContent = this.lettres[i];
        });
        // Indicateurs de position
        const dots = this.posIndicator.querySelectorAll('.pos-dot');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === this.positionActive));
    }

    valider() {
        const nom = this.lettres.join('');
        this.container.classList.remove('show');
        if (window._gameAudio) window._gameAudio.victoire();
        if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
        if (this.onValidate) this.onValidate(nom);
    }
}

// ============================================================
//  AUDIO MANAGER
// ============================================================
