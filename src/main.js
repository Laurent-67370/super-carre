import { Game } from './game.js';
import { LevelEditor } from './editor.js';
import { NameEntry } from './nameentry.js';
import { AudioManager } from './audio.js';
import { NIVEAUX, medaillePour, MEDAILLE_EMOJI } from './levels.js';
import { setupControls } from './controls.js';
import { afficherHallOfFame, partagerScores, afficherToast } from './ui.js';
import { exporterSauvegarde, importerSauvegarde } from './storage.js';
import './style.css';

/* === Prologue : Service Worker (PWA) + invite d'installation === */

// --- Enregistrement du Service Worker (PWA, mode hors-ligne + mises à jour auto) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js', {updateViaCache:'none'}).then((reg) => {
            // Vérifier s'il existe une nouvelle version à chaque lancement
            reg.update();
        }).catch(() => {});
        // Quand un nouveau Service Worker prend le contrôle, recharger pour
        // afficher la dernière version (une seule fois pour éviter une boucle)
        let dejaRecharge = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (dejaRecharge) return;
            dejaRecharge = true;
            window.location.reload();
        });
    });
}

// --- Invite d'installation PWA (bouton « Installer » dans le menu) ---
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // empêche l'invite auto de Chrome
    _deferredInstallPrompt = e;  // on la garde pour le bouton
    const b = document.getElementById('btn-install');
    if (b) b.style.display = 'inline-block';
});
window.addEventListener('appinstalled', () => {
    _deferredInstallPrompt = null;
    const b = document.getElementById('btn-install');
    if (b) b.style.display = 'none';
});


/* === Init : câblage DOM une fois la page prête === */
function init() {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    // Name Entry avec callback
    game.nameEntry = new NameEntry((nom) => {
        game.validerScore(nom);
    });

    // Éditeur de niveaux
    const editor = new LevelEditor(game);
    game._editor = editor;
    document.getElementById('btn-editor').addEventListener('click', () => {
        game.audio.init();
        editor.ouvrir();
    });

    // --- Sélecteur de musique (cycle entre les ambiances) ---
    const btnMusic = document.getElementById('btn-music');
    const PISTES = AudioManager.PISTES;
    // Restaurer le choix mémorisé
    let pisteCourante = 0;
    try { const p = parseInt(localStorage.getItem('supercarre_piste'), 10); if (!isNaN(p) && p >= 0 && p < PISTES.length) pisteCourante = p; } catch(e) {}
    game.audio.pisteIndex = pisteCourante;
    function majLibelleMusique() {
        const p = PISTES[pisteCourante];
        btnMusic.textContent = `${p.emoji} Musique : ${p.nom}`;
    }
    majLibelleMusique();
    btnMusic.addEventListener('click', () => {
        game.audio.init(); game.audio.resume();
        pisteCourante = (pisteCourante + 1) % PISTES.length;
        majLibelleMusique();
        try { localStorage.setItem('supercarre_piste', String(pisteCourante)); } catch(e) {}
        // Aperçu : démarrer la musique si besoin, puis basculer sur la piste choisie
        if (!game.audio.musiqueActive) { game.audio.musiqueMuet = false; game.audio.demarrerMusique(); }
        game.audio.changerPiste(pisteCourante);
    });

    // Bouton AIDE
    document.getElementById('btn-help').addEventListener('click', () => {
        game.audio.init(); game.audio.resume();
        document.getElementById('help-screen').classList.add('show');
    });
    document.getElementById('btn-help-back').addEventListener('click', () => {
        document.getElementById('help-screen').classList.remove('show');
    });

    // --- GÉNÉRIQUE STAR WARS (🎬 INTRO dans l'aide) ---
    function fermerCrawl() {
        const scr = document.getElementById('crawl-screen');
        scr.classList.remove('show');
        // Réinitialise les animations (retire/remet les éléments animés)
        const txt = document.getElementById('crawl-text');
        const intro = document.getElementById('crawl-intro');
        for (const el of [txt, intro]) {
            const clone = el.cloneNode(true);
            el.parentNode.replaceChild(clone, el);
        }
    }
    document.getElementById('btn-crawl').addEventListener('click', () => {
        const scr = document.getElementById('crawl-screen');
        // Champ d'étoiles généré une seule fois (~110 étoiles)
        const stars = document.getElementById('crawl-stars');
        if (!stars.childElementCount) {
            for (let i = 0; i < 110; i++) {
                const s = document.createElement('div');
                s.className = 'crawl-star';
                const taille = Math.random() * 2 + 1;
                s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${taille}px;height:${taille}px;animation-delay:${(Math.random()*3).toFixed(2)}s`;
                stars.appendChild(s);
            }
        }
        scr.classList.add('show');
        if (navigator.vibrate) navigator.vibrate(30);
        // Fin du défilement → fermeture automatique
        document.getElementById('crawl-text').addEventListener('animationend', fermerCrawl, { once: true });
    });
    document.getElementById('btn-crawl-skip').addEventListener('click', fermerCrawl);
    // Toucher n'importe où ferme aussi le générique
    document.getElementById('crawl-screen').addEventListener('click', (e) => {
        if (e.target.id !== 'btn-crawl-skip') fermerCrawl();
    });

    // Bouton « Installer » : déclenche l'invite native de Chrome
    document.getElementById('btn-install').addEventListener('click', async () => {
        if (!_deferredInstallPrompt) return;
        _deferredInstallPrompt.prompt();
        try { await _deferredInstallPrompt.userChoice; } catch (e) {}
        _deferredInstallPrompt = null;
        document.getElementById('btn-install').style.display = 'none';
    });

    const startScreen = document.getElementById('start-screen');
    const gameWrapper = document.getElementById('game-wrapper');
    const btnContinue = document.getElementById('btn-continue');
    const btnStart = document.getElementById('btn-start');

    // Affiche/masque CONTINUER selon la progression sauvegardée
    function rafraichirMenu() {
        if (game.progress.aProgression()) {
            const niv = game.progress.niveauDebloque + 1;
            btnContinue.innerHTML = `▶ CONTINUER <span class="lvl">niv. ${niv}</span>`;
            btnContinue.style.display = 'inline-block';
            btnStart.textContent = '🔄 NOUVELLE PARTIE';
            btnStart.classList.add('secondaire');
        } else {
            btnContinue.style.display = 'none';
            btnStart.textContent = '▶ JOUER';
            btnStart.classList.remove('secondaire');
        }
    }
    rafraichirMenu();
    game._rafraichirMenu = rafraichirMenu;

    // Prépare l'affichage de jeu puis exécute l'action de démarrage
    function entrerEnJeu(demarrage) {
        game.audio.init(); game.audio.resume();
        startScreen.style.display = 'none';
        gameWrapper.style.display = 'flex';
        game.configurerCanvas(); // le canvas a maintenant sa taille réelle dans le layout
        if (!game._controlesInstalles) { setupControls(game); game._controlesInstalles = true; }
        game.audio.demarrerMusique();
        demarrage();
    }

    // JOUER / NOUVELLE PARTIE → repart de zéro (et efface la progression)
    btnStart.addEventListener('click', () => {
        entrerEnJeu(() => game.nouvellePartie());
    });
    // CONTINUER → reprend au niveau débloqué
    btnContinue.addEventListener('click', () => {
        entrerEnJeu(() => game.demarrerAuNiveau(game.progress.niveauDebloque));
    });

    // Hall of Fame (depuis le menu)
    document.getElementById('btn-scores').addEventListener('click', () => {
        game.audio.init(); game.audio.resume();
        afficherHallOfFame(game.hs);
        document.getElementById('btn-scores-back').style.display = 'inline-block';
        document.getElementById('btn-scores-replay').style.display = 'none';
        document.getElementById('scores-screen').classList.add('show');
    });
    document.getElementById('btn-scores-back').addEventListener('click', () => {
        document.getElementById('scores-screen').classList.remove('show');
    });
    document.getElementById('btn-scores-share').addEventListener('click', () => {
        game.audio.resume();
        partagerScores(game.hs);
    });

    // --- SÉLECTEUR DE NIVEAUX ---
    function remplirSelecteurNiveaux() {
        const grid = document.getElementById('levels-grid');
        grid.innerHTML = '';
        const maxDebloque = game.progress.niveauDebloque; // index du plus haut niveau atteint
        document.getElementById('levels-stars-total').textContent = `⭐ ${game.progress.totalEtoiles()} / ${NIVEAUX.length * 3}`;
        NIVEAUX.forEach((niv, i) => {
            const debloque = i <= maxDebloque;
            const tile = document.createElement('button');
            tile.className = 'level-tile ' + (debloque ? 'unlocked' : 'locked');
            const nbEtoiles = game.progress.etoilesDe(i);
            const etoilesHTML = debloque
                ? `<span class="tile-stars">${'★'.repeat(nbEtoiles)}${'☆'.repeat(3 - nbEtoiles)}</span>`
                : '';
            // Médaille contre-la-montre (🥇🥈🥉) selon le meilleur temps
            const medaille = debloque ? medaillePour(i, game.progress.tempsDe(i)) : null;
            const medailleHTML = medaille ? `<span class="tile-medal">${MEDAILLE_EMOJI[medaille]}</span>` : '';
            const bestT = debloque ? game.progress.tempsDe(i) : null;
            if (bestT !== null) tile.title = `Meilleur temps : ${bestT.toFixed(1)}s`;
            tile.innerHTML = debloque
                ? `${medailleHTML}<span class="ico">${niv.icon}</span><span class="num">${i + 1}</span>${etoilesHTML}`
                : `<span class="ico">🔒</span><span class="num">${i + 1}</span>`;
            if (debloque) {
                tile.addEventListener('click', () => {
                    document.getElementById('levels-screen').classList.remove('show');
                    entrerEnJeu(() => game.demarrerAuNiveau(i));
                });
            }
            grid.appendChild(tile);
        });
    }
    document.getElementById('btn-levels').addEventListener('click', () => {
        game.audio.init(); game.audio.resume();
        remplirSelecteurNiveaux();
        document.getElementById('levels-screen').classList.add('show');
    });
    document.getElementById('btn-levels-back').addEventListener('click', () => {
        document.getElementById('levels-screen').classList.remove('show');
    });

    // --- SAUVEGARDE : export / import ---
    document.getElementById('btn-save').addEventListener('click', () => {
        document.getElementById('save-screen').classList.add('show');
    });
    document.getElementById('btn-save-back').addEventListener('click', () => {
        document.getElementById('save-screen').classList.remove('show');
    });
    document.getElementById('btn-save-export').addEventListener('click', () => {
        try {
            const json = exporterSauvegarde();
            const date = new Date().toISOString().slice(0, 10);
            const blob = new Blob([json], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `super-carre-sauvegarde-${date}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
            afficherToast('💾 Sauvegarde exportée !');
        } catch (e) {
            afficherToast('❌ Export impossible : ' + e.message);
        }
    });
    document.getElementById('btn-save-import').addEventListener('click', () => {
        document.getElementById('save-file').click();
    });
    document.getElementById('save-file').addEventListener('change', (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const n = importerSauvegarde(reader.result);
                afficherToast(`✅ ${n} éléments restaurés — rechargement…`);
                setTimeout(() => location.reload(), 1400);
            } catch (e) {
                afficherToast('❌ ' + e.message);
            }
        };
        reader.onerror = () => afficherToast('❌ Lecture du fichier impossible.');
        reader.readAsText(file);
        ev.target.value = ''; // permet de réimporter le même fichier
    });
    // Hall of Fame (après enregistrement du score → retour menu)
    document.getElementById('btn-scores-replay').addEventListener('click', () => {
        game.audio.resume();
        document.getElementById('scores-screen').classList.remove('show');
        game.retourMenu();
    });

    document.getElementById('btn-next').addEventListener('click',()=>{game.audio.resume();game.niveauSuivant()});
    document.getElementById('btn-replay').addEventListener('click',()=>{game.audio.resume();game.retourMenu()});
    document.getElementById('btn-retry').addEventListener('click',()=>{game.audio.resume();game.retourMenu()});

    // --- PAUSE ---
    const btnPause = document.getElementById('btn-pause');
    const togglePause = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (game.etat === 'playing') game.pause();
        else if (game.etat === 'paused') game.reprendre();
    };
    btnPause.addEventListener('click', togglePause);
    btnPause.addEventListener('touchstart', togglePause, {passive:false});

    // Bouton muet (musique) — conserve le choix dans localStorage
    const btnMute = document.getElementById('btn-mute');
    function appliquerEtatMute() {
        const muet = localStorage.getItem('supercarre_muet') === '1';
        game.audio.musiqueMuet = muet;
        btnMute.textContent = muet ? '🔇' : '🔊';
        if (game.audio.musicGain) game.audio.musicGain.gain.value = muet ? 0 : 0.06;
    }
    const toggleMute = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        game.audio.init();
        const muet = game.audio.basculerMuet();
        try { localStorage.setItem('supercarre_muet', muet ? '1' : '0'); } catch(err){}
        btnMute.textContent = muet ? '🔇' : '🔊';
    };
    btnMute.addEventListener('click', toggleMute);
    btnMute.addEventListener('touchstart', toggleMute, {passive:false});
    // Restaurer l'état muet au chargement
    try { if (localStorage.getItem('supercarre_muet') === '1') { game.audio.musiqueMuet = true; btnMute.textContent = '🔇'; } } catch(err){}

    document.getElementById('btn-resume').addEventListener('click', () => game.reprendre());
    document.getElementById('btn-quit').addEventListener('click', () => game.quitterVersMenu());
    // Mettre en pause automatiquement si l'app passe en arrière-plan
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && game.etat === 'playing') game.pause();
    });

    // Bouton "SCORES" depuis le Game Over (sans high score)
    document.getElementById('btn-go-scores').addEventListener('click', () => {
        game.audio.resume();
        document.getElementById('gameover-screen').classList.remove('show');
        afficherHallOfFame(game.hs);
        document.getElementById('btn-scores-back').style.display = 'none';
        document.getElementById('btn-scores-replay').style.display = 'inline-block';
        document.getElementById('scores-screen').classList.add('show');
    });

    // Clavier
    window.addEventListener('keydown',(e)=>{
        switch(e.code){
            case 'ArrowLeft':case 'KeyQ':game.touches.left=true;break;
            case 'ArrowRight':case 'KeyD':game.touches.right=true;break;
            case 'Space':case 'ArrowUp':case 'KeyZ':game.touches.jump=true;e.preventDefault();break;
            case 'Escape':case 'KeyP':
                if(game.etat==='playing')game.pause();
                else if(game.etat==='paused')game.reprendre();
                e.preventDefault();break;
        }
    });
    window.addEventListener('keyup',(e)=>{
        switch(e.code){
            case 'ArrowLeft':case 'KeyQ':game.touches.left=false;break;
            case 'ArrowRight':case 'KeyD':game.touches.right=false;break;
            case 'Space':case 'ArrowUp':case 'KeyZ':game.touches.jump=false;break;
        }
    });
}
if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
else init();
