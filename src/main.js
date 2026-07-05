import { Game } from './game.js';
import { LevelEditor } from './editor.js';
import { NameEntry } from './nameentry.js';
import { AudioManager } from './audio.js';
import { NIVEAUX, medaillePour, MEDAILLE_EMOJI } from './levels.js';
import { setupControls } from './controls.js';
import { afficherHallOfFame, partagerScores, afficherToast } from './ui.js';
import { exporterSauvegarde, importerSauvegarde } from './storage.js';
import { CATALOGUE, nuancer } from './skins.js';
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
        btnMusic.textContent = `🎵 ${p.nom}`;
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

    // --- MODE DÉMO (« attract mode ») ---
    // Playlist : L'Éveil (bases), Invasion (ennemis à écraser), La Grande Traversée
    // (grand monde + caméra), puis La Nuit des Pics et son 👑 BOSS en final.
    const DEMO_PLAYLIST = [0, 3, 8, 5];
    function quitterDemoUtilisateur(e) {
        if (!game.modeDemo) return;
        e.preventDefault(); e.stopPropagation();
        window.removeEventListener('pointerdown', quitterDemoUtilisateur, true);
        window.removeEventListener('keydown', quitterDemoUtilisateur, true);
        game.quitterDemo();
    }
    document.getElementById('btn-demo').addEventListener('click', () => {
        game.audio.init(); game.audio.resume();
        entrerEnJeu(() => game.demarrerDemo(DEMO_PLAYLIST));
        // Le moindre toucher / touche clavier rend la main (attaché après ce clic)
        setTimeout(() => {
            window.addEventListener('pointerdown', quitterDemoUtilisateur, true);
            window.addEventListener('keydown', quitterDemoUtilisateur, true);
        }, 400);
    });

    // --- PIXOU INTERACTIF : tap = bond 🦘, glisser = rotation 3D 🌀 ---
    const logo = document.querySelector('#start-screen .logo');
    const logoSvg = logo ? logo.querySelector('.pixou3d') : null; // boîte 3D (SVG + tranches + dos)
    function bondMascotte() {
        game.audio.init(); game.audio.resume();
        game.audio.saut();
        if (navigator.vibrate) navigator.vibrate(20);
        logo.classList.remove('hop');
        void logo.offsetWidth; // relance l'animation même en tapotant vite
        logo.classList.add('hop');
    }
    if (logo && logoSvg) {
        let rotY = 0, spinVel = 0, spinRAF = null, dragM = null, dernierQuart = 0;
        const appliquerRot = () => { logoSvg.style.transform = rotY ? `rotateY(${rotY}deg)` : ''; };
        const clicQuart = () => {
            // petit clic sonore + vibration à chaque quart de tour
            const q = Math.floor(Math.abs(rotY) / 90);
            if (q !== dernierQuart) {
                dernierQuart = q;
                game.audio.beep(480 + (q % 4) * 70, 480 + (q % 4) * 70, 0.03, 'square', 0.05);
                if (navigator.vibrate) navigator.vibrate(8);
            }
        };
        const inertie = () => {
            spinVel *= 0.955; // frottement
            rotY += spinVel;
            clicQuart(); appliquerRot();
            if (Math.abs(spinVel) > 0.45) { spinRAF = requestAnimationFrame(inertie); return; }
            // Se stabiliser face au joueur : multiple de 360° le plus proche
            spinRAF = null;
            logoSvg.style.transition = 'transform .55s cubic-bezier(.2,.8,.3,1.18)';
            rotY = Math.round(rotY / 360) * 360;
            appliquerRot();
            setTimeout(() => {
                logoSvg.style.transition = '';
                rotY = 0; dernierQuart = 0; appliquerRot();
            }, 570);
        };
        logo.addEventListener('pointerdown', (e) => {
            if (spinRAF) { cancelAnimationFrame(spinRAF); spinRAF = null; }
            logoSvg.style.transition = '';
            dragM = { x0: e.clientX, rot0: rotY, lastX: e.clientX, lastT: performance.now(), moved: false };
            try { logo.setPointerCapture(e.pointerId); } catch (err) {}
        });
        logo.addEventListener('pointermove', (e) => {
            if (!dragM) return;
            const dx = e.clientX - dragM.x0;
            if (Math.abs(dx) > 7) dragM.moved = true;
            if (!dragM.moved) return;
            const t = performance.now();
            spinVel = (e.clientX - dragM.lastX) / Math.max(1, t - dragM.lastT) * 14;
            dragM.lastX = e.clientX; dragM.lastT = t;
            rotY = dragM.rot0 + dx * 0.9; // le doigt entraîne la rotation
            game.audio.init();
            clicQuart(); appliquerRot();
        });
        const finDrag = () => {
            if (!dragM) return;
            const etaitDrag = dragM.moved; dragM = null;
            if (!etaitDrag) { bondMascotte(); return; } // simple tap → bond
            spinRAF = requestAnimationFrame(inertie);   // pichenette → inertie
        };
        logo.addEventListener('pointerup', finDrag);
        logo.addEventListener('pointercancel', finDrag);
    }

    // --- 🎨 BOUTIQUE DE SKINS ---
    const CAT_TITRES = { corps: '🎨 Couleur de Pixou', chapeau: '🧢 Chapeaux', costume: '🦸 Costumes', chaussures: '👟 Chaussures', lunettes: '🕶️ Lunettes', studio: '🌈 Studio de couleurs' };
    function majMascotte() {
        // La mascotte de l'accueil porte le skin complet : couleur,
        // chapeau (casquette/couronne/fête/magicien/tête nue) et lunettes.
        const cfg = game.skins.config();
        const svg = document.querySelector('#start-screen .logo svg');
        if (!svg) return;
        const stops = svg.querySelectorAll('linearGradient stop');
        if (stops.length >= 2) { stops[0].setAttribute('stop-color', cfg.haut); stops[1].setAttribute('stop-color', cfg.bas); }
        const corpsRect = svg.querySelector('rect[stroke]');
        if (corpsRect) corpsRect.setAttribute('stroke', cfg.bord);
        for (const id of ['casquette', 'couronne', 'fete', 'magicien', 'bandana', 'cowboy', 'viking', 'diplome']) {
            const g = svg.querySelector('#mascotte-chap-' + id);
            if (g) g.style.display = cfg.chapeau === id ? '' : 'none';
        }
        const typeLun = cfg.lunettes === true ? 'soleil' : (cfg.lunettes || 'aucune');
        const lun = svg.querySelector('#mascotte-lunettes');
        if (lun) lun.style.display = typeLun === 'soleil' ? '' : 'none';
        for (const id of ['rondes', '3d', 'etoiles']) {
            const g = svg.querySelector('#mascotte-lun-' + id);
            if (g) g.style.display = (typeLun === id || (id === '3d' && typeLun === 'troisD')) ? '' : 'none';
        }
        for (const id of ['noeud', 'echarpe', 'ceinture', 'cape', 'sherif', 'hawai', 'sac', 'jetpack']) {
            const g = svg.querySelector('#mascotte-cost-' + id);
            if (g) g.style.display = cfg.costume === id ? '' : 'none';
        }
        // 🌈 Studio : casquette et pieds aux couleurs libres
        const casq = svg.querySelector('#mascotte-chap-casquette');
        if (casq) {
            const [base, visiere, pompon] = [cfg.casq || '#16A085', nuancer(cfg.casq || '#16A085', -0.15), nuancer(cfg.casq || '#16A085', 0.25)];
            const rects = casq.querySelectorAll('rect');
            if (rects[0]) rects[0].setAttribute('fill', cfg.casq ? base : '#16A085');
            if (rects[1]) rects[1].setAttribute('fill', cfg.casq ? visiere : '#138D75');
            const cercle = casq.querySelector('circle');
            if (cercle) cercle.setAttribute('fill', cfg.casq ? pompon : '#1ABC9C');
        }
        // Chaussures : masquer les pieds de base quand un modèle est porté
        const modele = cfg.chaussures || 'basiques';
        const pixouFeet = svg.querySelector('.pixou-feet');
        if (pixouFeet) pixouFeet.style.display = modele === 'basiques' ? '' : 'none';
        for (const id of ['baskets', 'santiags', 'palmes', 'rollers']) {
            const g = svg.querySelector('#mascotte-shoe-' + id);
            if (g) g.style.display = modele === id ? '' : 'none';
        }
        for (const pied of svg.querySelectorAll('.pixou-feet rect')) {
            pied.setAttribute('fill', cfg.pieds || '#F1C40F');
        }
        // 🧊 Volume 3D : tranches et dos aux couleurs du corps équipé
        for (const face of document.querySelectorAll('.p3d-left, .p3d-right')) {
            face.style.background = `linear-gradient(180deg, ${nuancer(cfg.bord, 0.15)}, ${nuancer(cfg.bord, -0.25)})`;
        }
        const dos = document.querySelector('.p3d-back');
        if (dos) {
            dos.style.background = `linear-gradient(180deg, ${nuancer(cfg.bas, 0.12)}, ${cfg.bas})`;
            dos.style.borderColor = nuancer(cfg.bord, -0.15);
        }
    }
    function dessinerBoutique() {
        document.getElementById('shop-wallet').textContent = '🪙 ' + game.skins.solde();
        const soldeBtn = document.getElementById('btn-shop-solde');
        if (soldeBtn) soldeBtn.textContent = '· 🪙 ' + game.skins.solde();
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';
        for (const [cat, items] of Object.entries(CATALOGUE)) {
            const titre = document.createElement('div');
            titre.className = 'shop-cat';
            titre.textContent = CAT_TITRES[cat] || cat;
            grid.appendChild(titre);
            const rangee = document.createElement('div');
            rangee.className = 'shop-tiles';
            // 🌈 Studio débloqué → sélecteurs de couleur libres (corps, casquette, pieds)
            if (cat === 'studio' && game.skins.studioActif()) {
                const champs = [
                    { champ: 'corps', nom: 'Corps', note: game.skins.equipes.corps === 'studio' ? '✓ porté' : 'toucher = porter' },
                    { champ: 'casquette', nom: 'Casquette', note: 'appliquée' },
                    { champ: 'pieds', nom: 'Pieds', note: 'appliqués' }
                ];
                for (const c of champs) {
                    const tile = document.createElement('label');
                    tile.className = 'shop-tile shop-picker' + (c.champ === 'corps' && game.skins.equipes.corps === 'studio' ? ' porte' : '');
                    tile.innerHTML = `<input type="color" value="${game.skins.custom[c.champ]}" aria-label="Couleur ${c.nom}">` +
                        `<span class="shop-nom">${c.nom}</span><span class="shop-prix">${c.note}</span>`;
                    tile.querySelector('input').addEventListener('input', (ev) => {
                        game.skins.definirCustom(c.champ, ev.target.value);
                        if (game.player) game.player.skin = game.skins.config();
                        majMascotte();
                    });
                    tile.querySelector('input').addEventListener('change', () => dessinerBoutique());
                    rangee.appendChild(tile);
                }
                const reset = document.createElement('button');
                reset.className = 'shop-tile';
                reset.innerHTML = `<span class="shop-preview" style="background:rgba(255,255,255,.08)">↺</span><span class="shop-nom">Origine</span><span class="shop-prix">réinitialiser</span>`;
                reset.addEventListener('click', () => {
                    game.skins.reinitialiserCustom();
                    if (game.player) game.player.skin = game.skins.config();
                    majMascotte();
                    dessinerBoutique();
                });
                rangee.appendChild(reset);
                grid.appendChild(rangee);
                continue;
            }
            for (const item of items) {
                const possede = game.skins.possede(cat, item.id);
                const porte = game.skins.equipes[cat] === item.id;
                const tile = document.createElement('button');
                tile.className = 'shop-tile' + (porte ? ' porte' : '') + (!possede ? ' verrou' : '');
                const apercu = item.haut
                    ? `<span class="shop-preview" style="background:linear-gradient(180deg,${item.haut},${item.bas})"></span>`
                    : `<span class="shop-preview" style="background:rgba(255,255,255,.08)">${item.emoji}</span>`;
                const etat = porte ? '✓ porté' : (possede ? 'possédé' : `🪙 ${item.prix}`);
                tile.innerHTML = `${apercu}<span class="shop-nom">${item.nom}</span><span class="shop-prix${!possede && game.skins.solde() >= item.prix ? ' ok' : ''}">${etat}</span>`;
                tile.addEventListener('click', () => {
                    game.audio.init(); game.audio.resume();
                    if (possede) {
                        if (!porte) { game.skins.equiper(cat, item.id); game.audio.saut(); }
                    } else if (game.skins.solde() >= item.prix) {
                        if (confirm(`Acheter « ${item.nom} » pour 🪙 ${item.prix} ?`)) {
                            game.skins.acheter(cat, item.id);
                            game.audio.victoire();
                            if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
                        }
                    } else {
                        afficherToast(`🪙 Il te manque ${item.prix - game.skins.solde()} pièces — retourne en ramasser !`);
                        return;
                    }
                    if (game.player) game.player.skin = game.skins.config();
                    majMascotte();
                    dessinerBoutique();
                });
                rangee.appendChild(tile);
            }
            grid.appendChild(rangee);
        }
    }
    document.getElementById('btn-shop').addEventListener('click', () => {
        game.audio.init(); game.audio.resume();
        dessinerBoutique();
        document.getElementById('shop-screen').classList.add('show');
    });
    document.getElementById('btn-shop-back').addEventListener('click', () => {
        document.getElementById('shop-screen').classList.remove('show');
    });
    majMascotte();

    // --- 🎚️ SÉLECTEUR DE DIFFICULTÉ ---
    const DIFF_TOASTS = {
        facile: '😊 Facile — 6 vies, ennemis ralentis, checkpoint partout, invincibilité prolongée',
        normal: '😐 Normal — 5 vies, l\'aventure telle qu\'elle est née',
        difficile: '😈 Difficile — 3 vies, ennemis rapides, aucun checkpoint auto… mais pièces ×2 au portefeuille !'
    };
    function majDiff() {
        const actuel = Game.difficulteActuelle();
        for (const b of document.querySelectorAll('#diff-select button')) {
            b.classList.toggle('on', b.dataset.d === actuel);
        }
    }
    for (const b of document.querySelectorAll('#diff-select button')) {
        b.addEventListener('click', () => {
            try { localStorage.setItem('supercarre_difficulte', b.dataset.d); } catch (e) {}
            game.audio.init(); game.audio.resume(); game.audio.saut();
            if (navigator.vibrate) navigator.vibrate(15);
            majDiff();
            afficherToast(DIFF_TOASTS[b.dataset.d]);
        });
    }
    majDiff();

    // --- 📬 NIVEAU REÇU PAR LIEN (?n=CODE dans l'URL) ---
    (async () => {
        const m = location.search.match(/[?&]n=([^&]+)/);
        if (!m) return;
        // Nettoyer l'URL tout de suite (pas de re-déclenchement au refresh)
        try { history.replaceState(null, '', location.pathname); } catch (e) {}
        let code;
        try { code = decodeURIComponent(m[1]); } catch (e) { return; }
        const ok = await editor.chargerCode(code);
        if (!ok) { afficherToast('😕 Le lien de niveau reçu est invalide ou incomplet.'); return; }
        const nom = editor.modele.nom || 'Niveau partagé';
        document.getElementById('share-recu-info').innerHTML =
            `Quelqu'un t'a envoyé le niveau<br><strong>« ${nom.replace(/</g, '&lt;')} »</strong> !`;
        document.getElementById('share-recu').classList.add('show');
        document.getElementById('share-jouer').onclick = () => {
            document.getElementById('share-recu').classList.remove('show');
            game.audio.init(); game.audio.resume();
            entrerEnJeu(() => game.demarrerPerso(editor.modele, editor.construireData(editor.modele)));
        };
        document.getElementById('share-editer').onclick = () => {
            document.getElementById('share-recu').classList.remove('show');
            document.getElementById('btn-editor').click(); // le niveau est déjà chargé dans l'éditeur
        };
        document.getElementById('share-fermer').onclick = () => {
            document.getElementById('share-recu').classList.remove('show');
            afficherToast('💡 Le niveau reste ouvert dans ✏️ ÉDITEUR.');
        };
    })();

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
        game.audio.arreterFanfare(); // couper la fanfare
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
        // Pixou en apesanteur = CLONE de la mascotte personnalisée (skin complet).
        // Les ids clonés (gradient, clipPath) sont renommés pour rester uniques.
        const source = document.querySelector('#start-screen .logo svg');
        const conteneur = document.getElementById('crawl-pixou');
        if (source && conteneur) {
            majMascotte(); // s'assurer que la mascotte reflète le skin courant
            const clone = source.cloneNode(true);
            clone.setAttribute('width', '80'); clone.setAttribute('height', '80');
            const grad = clone.querySelector('linearGradient');
            if (grad) {
                grad.id = 'pixou-body-crawlclone';
                const corps = clone.querySelector('rect[fill^="url"]');
                if (corps) corps.setAttribute('fill', 'url(#pixou-body-crawlclone)');
            }
            const clip = clone.querySelector('clipPath');
            if (clip) {
                clip.id = clip.id + '-crawlclone';
                const porteur = clone.querySelector('[clip-path]');
                if (porteur) porteur.setAttribute('clip-path', 'url(#' + clip.id + ')');
            }
            conteneur.innerHTML = '';
            conteneur.appendChild(clone);
        }
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
        game.audio.init(); game.audio.resume();
        game.audio.jouerFanfare(); // 🎺 fanfare orchestrale originale
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
        // Solde 🪙 du bouton BOUTIQUE : toujours à jour au retour du jeu
        const sb = document.getElementById('btn-shop-solde');
        if (sb) sb.textContent = '· 🪙 ' + game.skins.solde();
        if (game.progress.aProgression()) {
            const niv = game.progress.niveauDebloque + 1;
            btnContinue.innerHTML = `▶ CONTINUER <span class="lvl">niv. ${niv}</span>`;
            btnContinue.style.display = 'inline-block';
            btnStart.textContent = '🔄 RECOMMENCER';
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
        // --- 📝 MES NIVEAUX (créés dans l'éditeur) ---
        const persos = editor.chargerSauvegardes();
        if (persos.length) {
            const titre = document.createElement('div');
            titre.className = 'levels-section';
            titre.textContent = '📝 Mes niveaux';
            grid.appendChild(titre);
            const records = Game.tempsPerso();
            for (const m of persos) {
                const tile = document.createElement('button');
                tile.className = 'level-tile unlocked perso';
                const best = records[m.nom];
                if (best !== undefined) tile.title = `Meilleur temps : ${best.toFixed(1)}s`;
                const bestHTML = best !== undefined ? `<span class="tile-stars">⏱ ${best.toFixed(1)}s</span>` : '<span class="tile-stars">·</span>';
                tile.innerHTML = `<span class="ico">📝</span><span class="num perso-nom">${(m.nom || '?').slice(0, 12)}</span>${bestHTML}`;
                tile.addEventListener('click', () => {
                    document.getElementById('levels-screen').classList.remove('show');
                    entrerEnJeu(() => game.demarrerPerso(m, editor.construireData(m)));
                });
                grid.appendChild(tile);
            }
        }
    }
    // Overlay de fin de niveau perso : REJOUER / MENU
    document.getElementById('perso-rejouer').addEventListener('click', () => {
        document.getElementById('perso-win').classList.remove('show');
        const src = game._persoSource;
        if (src) game.demarrerPerso(src.modele, editor.construireData(src.modele));
    });
    document.getElementById('perso-menu').addEventListener('click', () => {
        game.retourMenu();
    });
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
