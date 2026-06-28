/* setupControls — contrôles tactiles multi-points + clavier */

export function setupControls(game) {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const controls = document.getElementById('controls');

    // Map : identifiant tactile -> action ('left'/'right'/'jump')
    const touchMap = new Map();

    // Détermine quel bouton se trouve sous un point (coordonnées écran)
    function boutonSous(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;
        if (el === btnLeft || btnLeft.contains(el)) return 'left';
        if (el === btnRight || btnRight.contains(el)) return 'right';
        if (el === btnJump || btnJump.contains(el)) return 'jump';
        return null;
    }

    // Recalcule l'état de tous les boutons à partir des doigts actifs
    function rafraichirEtat() {
        game.touches.left = false;
        game.touches.right = false;
        game.touches.jump = false;
        for (const action of touchMap.values()) {
            game.touches[action] = true;
        }
        btnLeft.classList.toggle('pressed', game.touches.left);
        btnRight.classList.toggle('pressed', game.touches.right);
        btnJump.classList.toggle('pressed', game.touches.jump);
    }

    // --- Toute la zone de contrôle écoute les événements (pas bouton par bouton) ---
    function onTouchStart(e) {
        e.preventDefault();
        for (const t of e.changedTouches) {
            const action = boutonSous(t.clientX, t.clientY);
            if (action) {
                touchMap.set(t.identifier, action);
                game.audio.resume();
            }
        }
        rafraichirEtat();
    }

    function onTouchEnd(e) {
        e.preventDefault();
        for (const t of e.changedTouches) {
            touchMap.delete(t.identifier);
        }
        rafraichirEtat();
    }

    // touchmove : si un doigt glisse vers un autre bouton, on met à jour
    function onTouchMove(e) {
        e.preventDefault();
        let changed = false;
        for (const t of e.changedTouches) {
            // Multitouch tolérant : un doigt qui glisse sur un bouton l'active
            // (même s'il a commencé à côté), un doigt qui le quitte le relâche.
            const action = boutonSous(t.clientX, t.clientY);
            const current = touchMap.get(t.identifier);
            if (action !== current) {
                if (action) {
                    touchMap.set(t.identifier, action);
                } else {
                    touchMap.delete(t.identifier);
                }
                changed = true;
            }
        }
        if (changed) rafraichirEtat();
    }

    // Écouteurs sur toute la zone des contrôles (pas sur chaque bouton)
    controls.addEventListener('touchstart', onTouchStart, {passive:false});
    controls.addEventListener('touchend', onTouchEnd, {passive:false});
    controls.addEventListener('touchcancel', onTouchEnd, {passive:false});
    controls.addEventListener('touchmove', onTouchMove, {passive:false});

    // Empêcher le double-tap zoom et le scroll
    let lt = 0;
    document.addEventListener('touchend', (e) => {
        const n = Date.now();
        if (n - lt <= 300) e.preventDefault();
        lt = n;
    }, {passive: false});
    // Empêcher le scroll/zoom pendant le JEU uniquement (canvas + contrôles).
    // Les overlays (aide, sélection de niveaux, éditeur…) doivent pouvoir défiler
    // normalement au toucher — sinon l'aide devient impossible à faire défiler
    // une fois qu'on a joué (ce handler document est installé au 1er lancement).
    // Note : touch-action:none sur body/canvas/contrôles + overscroll-behavior:none
    // gèrent déjà le blocage de scroll en CSS ; ce preventDefault n'est là qu'en
    // renfort pour la zone de jeu, et ne doit JAMAIS toucher les overlays.
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest && e.target.closest('#game-wrapper')) e.preventDefault();
    }, {passive: false});

    // Support souris (desktop)
    function bindMouse(btn, key) {
        const press = (e) => { e.preventDefault(); game.touches[key] = true; btn.classList.add('pressed'); game.audio.resume(); };
        const release = (e) => { e.preventDefault(); game.touches[key] = false; btn.classList.remove('pressed'); };
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('contextmenu', e => e.preventDefault());
    }
    bindMouse(btnLeft, 'left');
    bindMouse(btnRight, 'right');
    bindMouse(btnJump, 'jump');
}

// ============================================================
//  LEVEL EDITOR — éditeur de niveaux complet (intégré)
// ============================================================
