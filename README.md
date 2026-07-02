# 🟥 Super Carré

Jeu de plateforme HTML5 autonome, jouable au clavier comme au tactile. La **source** est organisée en modules ES (`src/`) assemblés par **Vite** ; le build produit un **`index.html` unique** (JS + CSS inlinés et minifiés via `vite-plugin-singlefile`), déployé en statique sur GitHub Pages.

**24 niveaux**, un éditeur de niveaux intégré, une sauvegarde de progression, un Hall of Fame — et c'est une **PWA installable** (jouable hors-ligne, en plein écran sur mobile).

🎮 **Jouer en ligne :** https://laurent-67370.github.io/super-carre/

🟥 **Pixou**, le héros carré, a du tempérament : il sourit en ramassant les pièces, s'effraie quand un ennemi s'approche, fait la grimace quand il est touché, et triomphe à chaque palier de 5 000 points. Il s'aplatit à l'atterrissage, s'étire au saut (**squash & stretch**), et explose en petits carrés à sa dernière vie. Des **confettis** célèbrent chaque franchissement de palier.

---

## 🎮 Comment jouer

| Action | Clavier | Tactile |
|---|---|---|
| Aller à gauche | ← ou Q | bouton ◀ |
| Aller à droite | → ou D | bouton ▶ |
| Sauter | Espace, ↑ ou Z | bouton 🦘 |
| Pause | Échap ou P | bouton ⏸ |
| Couper / remettre la musique | — | bouton 🔊 / 🔇 |
| Ouvrir l'aide intégrée | — | bouton **❓** (haut à droite) |

💡 Un bouton **❓ doré** flottant en haut à droite ouvre une **aide intégrée** (« Comment jouer »), consultable à tout moment sans quitter la partie : contrôles, ennemis, power-ups, éléments et score.

Le saut est **dynamique** : maintenir la touche saute plus haut, relâcher tôt fait un petit saut. Une tolérance de saut (*coyote time*) et une mémorisation de l'appui (*jump buffer*) rendent les sauts plus pardonnants, surtout sur mobile.

Une **musique de fond** accompagne le jeu (générée à la volée, sans fichier audio). Le bouton 🔊 / 🔇 la coupe ou la remet, et ton choix est mémorisé.

Tu peux choisir entre **4 ambiances musicales** depuis le menu d'accueil (bouton **« 🎵 Musique »**) : 🗺️ Aventure (entraînante), 🌙 Calme (douce), 👾 Rétro (arcade rapide) et 🔮 Mystère (atmosphérique). Chaque tap passe à la suivante, avec un aperçu immédiat, et le choix est conservé.

### But
Ramasse **toutes les pièces** 🪙 d'un niveau pour débloquer le suivant. Tu démarres avec **5 vies** ❤️. Tomber dans un trou ou toucher un ennemi/pic sans protection coûte une vie. À court de vies, c'est le Game Over.

Tu gagnes **+1 vie bonus** chaque fois que tu atteins un palier de 4 niveaux (niveaux 4, 8, 12, 16, 20, 24). Tu gagnes aussi **+1 vie** à chaque **palier de 5 000 points** franchi (score cumulé sur toute la partie, pas seulement le niveau en cours). Au-delà de 5 vies, le compteur passe en affichage compact (❤ ×6, ❤ ×7…).

**Étoiles** ⭐ : chaque niveau terminé te rapporte de 1 à 3 étoiles selon ta performance — **3 étoiles** si tu finis sans perdre une seule vie, **2** avec une seule perte, **1** sinon. Le meilleur score est conservé : rejoue un niveau pour viser les 3 étoiles. Tes étoiles s'affichent dans le sélecteur de niveaux, avec un compteur total.

**Checkpoints** 🚩 : dans les grands niveaux, un drapeau placé à mi-parcours devient vert quand tu le franchis. Après une chute ou un dégât, tu réapparais à ce checkpoint plutôt qu'au tout début du niveau.

### Astuces
- **Saute sur les ennemis** 👾 pour les écraser (et gagner des points) — sauf l'abeille 🐝, impossible à écraser (voir plus bas).
- Les **ressorts** 🔴 propulsent très haut.
- Les **pics** 🔺 sont mortels au contact.

### 👾 Ennemis

| Ennemi | Comportement | Écrasable ? |
|---|---|---|
| 👾 Patrouilleur violet | marche de gauche à droite | ✅ oui — saute dessus (+150 pts) |
| 🦘 Blob turquoise | rebondit en boucle sur place | ✅ oui — en tombant dessus (+150 pts) |
| 🐝 Abeille | vole en zigzag | ❌ **non** — évite-la ou utilise un bouclier 🟡 |

> ⚠️ On ne peut **pas** écraser une abeille : contourne-la ou active un bouclier avant de passer.

### 👑 Boss

Tous les **6 niveaux** (niveaux **6, 12, 18 et 24**), un **boss** t'attend : un gros ennemi à couronne, avec une barre de vie au-dessus de lui. Il patrouille au-dessus d'une plateforme.

Pour le vaincre, **saute-lui sur la tête 3 fois**. Après chaque coup il devient brièvement invincible (il clignote), puis **plus rapide et plus enragé** (il rougit). Le toucher sur le côté coûte une vie — vise bien la tête.

La condition de victoire d'un niveau à boss : **battre le boss, puis ramasser toutes les pièces**. Un bandeau « 👑 Bats le boss ! » affiche ses vies restantes tant qu'il est en vie. Le vaincre rapporte **+1000 points**.

### Le héros : Pixou
Tu incarnes **Pixou**, un petit personnage rouge à casquette turquoise, au design original. Il est animé : ses yeux suivent la direction du regard, il cligne des yeux, ses pieds se balancent à la course et il fait une petite tête de surprise en plein saut.

---

## ⚡ Power-ups

Chaque power-up dure environ 10 secondes (visible via l'aura autour du joueur).

| Power-up | Effet |
|---|---|
| 🔵 Double saut | un second saut en l'air |
| 🟡 Bouclier | immunité temporaire aux dégâts |
| 🟠 Vitesse | déplacement accéléré |

---

## 🏆 Score

| Action | Points |
|---|---|
| Ramasser une pièce | +100 |
| Écraser un ennemi | +150 |
| Ramasser un power-up | +250 |
| Vaincre un boss | +1000 |

Le score final ajoute un bonus pour les vies restantes et les niveaux franchis, moins une légère pénalité de temps. Les meilleurs scores sont enregistrés dans le **Hall of Fame** (avec saisie d'un pseudo).

📤 **Partage tes scores** : depuis le Hall of Fame, le bouton **« 📤 PARTAGER »** ouvre la feuille de partage native du système (Web Share API) avec le classement top 5 et un lien vers le jeu. Sur les navigateurs sans feuille de partage (ordinateur), le classement est copié dans le presse-papier d'un seul appui — plus qu'à le coller wherever tu veux.

---

## 🗺️ Les 24 niveaux

La difficulté monte progressivement. À partir du niveau 9, les mondes deviennent **plus grands que l'écran** : la caméra suit le joueur (scrolling horizontal et/ou vertical). Tous les 6 niveaux (6, 12, 18, 24), un **combat de boss** 👑 t'attend.

| # | Niveau | Taille du monde | Particularités |
|---|---|---|---|
| 1 | 🌱 L'Éveil | 800×600 | Découverte, aucun danger |
| 2 | ⚠️ Pics Mortels | 800×600 | Premiers pics |
| 3 | 🌀 Plateformes Vivantes | 800×600 | Plateformes mobiles |
| 4 | 👾 Invasion | 800×600 | Premiers ennemis |
| 5 | 🔥 Le Défi Final | 800×600 | Tout combiné, corsé |
| 6 | 🌙 La Nuit des Pics | 800×600 | Ambiance nocturne |
| 7 | 🐝 La Ruche | 800×600 | Nuée d'ennemis |
| 8 | 🌋 Le Cœur du Volcan | 800×600 | Final du premier bloc |
| 9 | 🏜️ La Grande Traversée | 1600×600 | **Premier niveau large** (scroll horizontal) |
| 10 | 🌾 Les Plaines Sans Fin | 1400×600 | Course aérée, facile |
| 11 | 🗼 La Tour Céleste | 800×1200 | **Ascension verticale** |
| 12 | 🌌 Le Labyrinthe Suspendu | 1400×1000 | **Exploration 2D** (large + haut) |
| 13 | 💀 La Course Infernale | 2000×600 | Gauntlet horizontal, pièges enchaînés |
| 14 | 🕳️ Le Gouffre Sans Fond | 800×1300 | Descente/ascension verticale |
| 15 | 🦘 Le Saut de la Foi | 1500×800 | Sauts de précision |
| 16 | 🏰 La Forteresse | 2000×1100 | Forteresse géante à gravir de bas en haut (29 pièces, 9 ennemis) |
| 17 | 🌋 La Coulée | 1800×600 | Failles de pics à franchir, plateformes mobiles |
| 18 | 🏔️ La Cordillère | 2000×700 | Ascension de sommets, plateformes mobiles h/v |
| 19 | 🌊 L'Archipel | 1800×800 | Îles flottantes au-dessus du vide, ressorts |
| 20 | 🐉 L'Antre du Dragon | 2000×1100 | Repaire du dragon (30 pièces, 11 ennemis) |
| 21 | 🌌 La Galaxie | 1900×900 | Astéroïdes flottants, vide intersidéral (28 pièces, 11 ennemis) |
| 22 | ❄️ Le Palais de Glace | 2000×1000 | Cristal et pics tranchants, mobiles h/v (32 pièces, 13 ennemis) |
| 23 | ⚙️ L'Usine Mécanique | 2000×900 | Engrenages et plateformes mobiles (30 pièces, 13 ennemis) |
| 24 | 💀 Le Chaos Final | 2200×1200 | **Niveau final ultime**, tout combiné (46 pièces, 16 ennemis) |

### Rejouer un niveau
Le bouton **« 🎯 CHOISIR UN NIVEAU »** du menu ouvre une grille de tous les niveaux : ceux que tu as débloqués sont jouables directement, les autres restent verrouillés 🔒. Chaque tuile affiche les **étoiles** ⭐ obtenues (sur 3), et un compteur en haut indique ton total sur l'ensemble du jeu. Pratique pour refaire un niveau et viser le 3 étoiles partout.

---

## ✏️ Éditeur de niveaux

Accessible via le bouton **« ✏️ ÉDITEUR DE NIVEAUX »** du menu d'accueil. Il permet de créer ses propres niveaux, y compris des mondes plus grands que l'écran (la caméra/scroll fonctionne aussi en mode test).

### Outils de placement
| Outil | Élément |
|---|---|
| ↖ | Sélection / déplacement |
| 🟫 | Sol |
| 🟩 | Plateforme |
| 🧱 | Mur |
| ↔️ | Plateforme mobile horizontale |
| ↕️ | Plateforme mobile verticale |
| 🪙 | Pièce |
| 👾 | Ennemi patrouilleur (marche, écrasable) |
| 🦘 | Ennemi sauteur / blob (rebondit, écrasable) |
| 🐝 | Ennemi volant / abeille (zigzag, **non écrasable**) |
| 🔺 | Pics |
| 🔴 | Ressort |
| 🔵 | Power-up double saut |
| 🟡 | Power-up bouclier |
| 🟠 | Power-up vitesse |
| 🚩 | Point de départ (spawn) |

### Fonctions
- **Monde L / Monde H** : règle la largeur et la hauteur du monde (pour des niveaux qui scrollent).
- **↶ Annuler / ↷ Rétablir** : revenir en arrière ou refaire une action (undo/redo).
- **🎲 Niveau aléatoire** : génère automatiquement un niveau **jouable** (course horizontale ou ascension verticale, tiré au hasard). Chaque plateforme est placée à portée de saut de la précédente, les pièces sont toujours accessibles et les dangers évitables. Confirmation demandée si le niveau courant n'est pas vide.
- **▶ Tester** : jouer immédiatement son niveau, puis « ◀ Retour éditeur » pour revenir à l'édition.
- **💾 Sauvegarder** et **📂 Mes niveaux** : enregistrer et recharger ses créations dans le navigateur.
- **⤓ Export** / **📥 Importer** : copier-coller le code d'un niveau (format `NIVEAUX`).
- **💾 Télécharger .json** / **📂 Charger .json** : exporter ou importer un niveau sous forme de **fichier `.json`**, pratique pour le sauvegarder hors du navigateur ou le partager. Le format JSON est sans perte (contrairement au copier-coller de code).

Les niveaux créés sont stockés localement dans le navigateur. Le partage se fait soit par le code (Export/Importer), soit par fichier `.json` (Télécharger/Charger).

---

## 💾 Sauvegarde

Le jeu utilise le stockage local du navigateur (`localStorage`) :

| Donnée | Clé |
|---|---|
| Meilleur niveau débloqué | `supercarre_progress` |
| Étoiles obtenues par niveau | `supercarre_stars` |
| Hall of Fame (top scores) | `supercarre_highscores` |
| Niveaux de l'éditeur | `supercarre_editor_levels` |
| Musique coupée ou non | `supercarre_muet` |
| Ambiance musicale choisie | `supercarre_piste` |
| Meilleurs temps par niveau (contre-la-montre) | `supercarre_temps` |

### 📤 Sauvegarde exportable (v30)

Le bouton **💾 SAUVEGARDE** du menu principal permet :
- **📤 EXPORTER** : télécharge un fichier `super-carre-sauvegarde-AAAA-MM-JJ.json` contenant toute la progression (niveaux, étoiles, chronos, Hall of Fame, niveaux créés dans l'éditeur, préférences) ;
- **📥 IMPORTER** : restaure ce fichier — sur le même appareil après un nettoyage du navigateur, ou sur un autre appareil pour migrer sa progression.

L'import valide le fichier (en-tête `_app: super-carre`) et ne touche qu'aux clés `supercarre_*`, puis recharge le jeu.

Au lancement, si une progression existe, le menu propose **▶ CONTINUER** (reprendre au niveau débloqué) en plus de **🔄 NOUVELLE PARTIE** (repartir de zéro, ce qui efface la progression). Terminer un niveau débloque le suivant ; un Game Over ne fait pas perdre les niveaux déjà débloqués.

> **Note :** en navigation privée, ou si le fichier est ouvert via `file://` sur certains navigateurs, le stockage local peut être désactivé. Dans ce cas, le jeu reste jouable mais la progression n'est pas conservée. Servi depuis un vrai hébergement (HTTP/HTTPS), tout fonctionne normalement.

---

## 📱 Installer l'application (PWA)

Super Carré est une **Progressive Web App** : on peut l'installer sur son téléphone comme une vraie application, la lancer en plein écran (sans barre de navigateur) et y jouer **hors-ligne**.

### Installation
1. Ouvrir https://laurent-67370.github.io/super-carre/ dans le navigateur.
2. **Android (Chrome)** : un bandeau « Installer » apparaît, ou menu ⋮ → « Ajouter à l'écran d'accueil ».
3. **iOS (Safari)** : bouton Partager → « Sur l'écran d'accueil ».
4. Lancer le jeu depuis l'icône ajoutée : il s'ouvre en plein écran.

### Hors-ligne
Après une première ouverture (qui met le jeu en cache), l'application reste jouable sans connexion. La progression et les scores sont conservés dans le navigateur.

### Fichiers de la PWA
| Fichier | Rôle |
|---|---|
| `index.html` | le jeu complet |
| `manifest.json` | nom, icônes, plein écran, couleurs |
| `sw.js` | Service Worker (cache hors-ligne) |
| `icons/` | icônes (192, 512, maskable, apple-touch) |

> Pour publier une nouvelle version du jeu, il suffit d'incrémenter `CACHE_VERSION` dans `sw.js` : les anciens fichiers en cache sont alors remplacés au prochain lancement.

---

## 🛠️ Caractéristiques techniques

- **Source modulaire** (`src/` : entités, niveaux, audio, jeu, éditeur, contrôles, UI) assemblée par **Vite** ; build = **`index.html` unique** (JS + CSS inlinés et minifiés, ~46 ko gzip).
- **PWA** installable et jouable hors-ligne (manifest + Service Worker réseau-d'abord + `updateViaCache:'none'`).
- Boucle de jeu à **pas de temps fixe (60 Hz)** : vitesse identique quel que soit le taux de rafraîchissement de l'écran.
- Rendu adapté à la **densité de pixels** (`devicePixelRatio`) : net sur écrans Retina / haute résolution.
- **Caméra avec scrolling** fluide et parallaxe, bornée aux limites du monde.
- Personnage **animé** dessiné au canvas (yeux, casquette, animation de course et de saut).
- Pause (avec auto-pause quand l'onglet passe en arrière-plan).
- Audio entièrement généré par la **Web Audio API** (bruitages et **4 ambiances musicales** au choix, aucun fichier son).
- **Checkpoints** à mi-parcours dans les grands niveaux, et **système d'étoiles** (1 à 3 par niveau) avec progression sauvegardée.
- **Combats de boss** tous les 6 niveaux (boss à 3 points de vie, écrasable sur la tête).
- Contrôles tactiles multi-points et clavier.

### ✨ v28 — migration modulaire + build Vite

Le projet passe d'un `index.html` monolithe (4124 lignes, JS inline) à une **source modulaire ES modules** assemblée par **Vite**. Le moteur canvas reste impératif (pas de React — anti-pattern pour un jeu canvas). Le build (`vite-plugin-singlefile`) produit un **`index.html` unique** (JS + CSS inlinés et minifiés, **182 ko / 46 ko gzip** vs 272 ko avant, −33 %), déployé via **GitHub Actions CI** (`.github/workflows/deploy.yml` : `npm ci && npm run build` → deploy-pages). La source est découpée en 12 modules (`src/` : `entities`, `player`, `levels`, `game`, `audio`, `storage`, `nameentry`, `editor`, `controls`, `ui`, `main`, `style.css`). Comportement strictement identique (vérifié runtime via smoke test Playwright : démarrage, boucle, éditeur, tous les menus, 0 erreur). `sw.js` v36, manifest corrigé (« 24 niveaux »).

### 🤖 v33 — mode démo (« attract mode »)

Le bouton **🎬 DÉMO** du menu lance le jeu en pilote automatique sur une playlist de 4 niveaux : L'Éveil, Invasion (écrasement d'ennemis), La Grande Traversée (grand monde + caméra) et **La Nuit des Pics avec son 👑 boss en final**. Le bot (`src/demo.js`) vise le boss ou la pièce la plus proche, grimpe par plateformes relais, contourne les plateformes au lieu de se cogner la tête dessous (point de passage avec hystérésis anti-oscillation), saute les trous et les pics avec élan, et écrase les ennemis sur son passage. Pixou est invincible en démo (aucun impact sur la progression sauvegardée), un bandeau 🎬 clignote à l'écran, et chaque niveau dure au plus 60 s (passage anticipé après 15 s sans pièce). **Le moindre toucher ou touche clavier rend la main** et ramène au menu — comme une borne d'arcade. Validé par simulation headless Node : boss vaincu en 1,6 s, 10/10 pièces sur La Grande Traversée.

### 🎬 v32 — aide à jour + générique façon Star Wars

- **Aide intégrée (❓) mise à jour** : nouvelle carte **⏱️ Contre-la-montre** (médailles, records, affichage sur les tuiles) et nouvelle carte **💾 Sauvegarde** (export/import).
- **🎬 INTRO** : un bouton dans l'en-tête de l'aide lance un **générique façon Star Wars** — « Il y a bien longtemps, dans un navigateur lointain, très lointain… » puis l'histoire de Pixou défile en perspective vers un champ de 110 étoiles scintillantes. Fermeture automatique à la fin, bouton ✕ PASSER, ou un simple toucher n'importe où. Pur CSS (perspective + rotateX), aucune bibliothèque.

### ⏱️ v30 — contre-la-montre + sauvegarde exportable

- **Contre-la-montre** : le meilleur temps de chaque niveau est mémorisé (`supercarre_temps`, ne régresse jamais). Des médailles 🥇🥈🥉 récompensent les temps rapides — les seuils sont calculés automatiquement selon la taille du monde, le nombre de pièces et la présence d'un boss (argent = or×1,6, bronze = or×2,4). L'écran de fin de niveau affiche le chrono, la médaille, la mention **🔥 RECORD !** et le prochain objectif à battre ; le sélecteur de niveaux affiche la médaille en haut à droite de chaque tuile.
- **Sauvegarde exportable** : bouton 💾 SAUVEGARDE au menu (export JSON téléchargé / import avec validation) — voir la section Sauvegarde ci-dessus.
- Le **coyote time** (6 frames) et le **jump buffer** (6 frames) étaient déjà en place dans `player.js` depuis la refonte — vérifiés, aucun changement nécessaire.

### 🔧 Correctif v29 — sélecteur de niveaux cassé (régression v28)

La migration modulaire v28 a cassé l'accès direct aux niveaux (« 🎯 CHOISIR UN NIVEAU » restait vide / ne se remplissait pas) : `remplirSelecteurNiveaux()` (dans `main.js`) utilise `NIVEAUX`, mais `main.js` ne l'importait pas → `ReferenceError` au clic (le `NIVEAUX.forEach` qui remplit la grille ne s'exécutait pas). Corrigé en ajoutant `import { NIVEAUX } from './levels.js'` à `main.js`. (Le contrôle exhaustif des imports avait sauté `main.js` — désormais inclus.)

### 🔧 Correctif v25 — défilement de l'aide bloqué sur mobile après avoir joué

Le guide d'aide (et la sélection de niveaux, l'éditeur) devenait impossible à faire défiler au toucher **après avoir lancé une partie**. Cause : un écouteur `touchmove` au niveau du document appelait `preventDefault()` sur *tous* les glissements tactiles (installé au 1er lancement via `setupControls`) — il bloquait donc le scroll de tous les overlays, pas seulement celui du jeu. Le blocage du scroll/zoom pendant le jeu est déjà garanti en CSS (`touch-action:none` sur `body`/canvas/contrôles + `overscroll-behavior:none`), le `preventDefault` JS était donc redondant pour le jeu et nuisible aux overlays. Désormais, il ne s'applique qu'aux touches effectuées sur la zone de jeu (`#game-wrapper`), laissant tous les menus et overlays défiler normalement à tout moment.

### 🔧 Correctif v26 — particules & popups persistants entre niveaux + mort par chute invisible

Deux petits bugs visuels :

1. **Particules et popups qui fuyaient d'un niveau à l'autre.** `_initNiveau` (appelé à chaque chargement de niveau) ne vidait pas `effets` (confettis des paliers de 5 000 points, débris de mort) ni `scorePopups` (`+100`, `BOSS VAINCU !`, `🚩 Checkpoint !`). Contrairement au constructeur et à `_resetPartie` qui les réinitialisent. Bilan : des particules ou popups encore animés pouvais clignoter brièvement au tout début du niveau suivant. Corrigé en vidant `effets` et `scorePopups` dans `_initNiveau`.

2. **Mort par chute dans un trou invisible à la dernière vie.** Quand on tombe dans un trou en perdant sa dernière vie, le joueur est déjà sorti de l'écran par le bas (`y > hauteurMonde + 50`) : les débris de Pixou apparaissaient hors caméra et l'animation de mort jouait 45 frames sur une scène figée vide avant le game over. Désormais, sur une mort par chute (`'trou'`), les débris apparaissent en bas de la zone visible (caméra) — l'explosion de Pixou reste visible. Le comportement pour une mort par ennemi/pic (`'degat'`, joueur à l'écran) est inchangé.

### 🔧 Correctif v27 — le boss semblait demander plus de 3 écrasements

Le boss a bien **3 points de vie**, mais il donnait l'impression d'en demander plus : après chaque coup sur la tête, il restait invincible **45 frames** (0,75 s), alors que le rebond du joueur (`vy = forceSaut × 0,8 ≈ -8,4`) le ramenait sur lui en **~28 frames**. Le joueur atterrissait donc souvent sur le boss *pendant* son invincibilité : le coup ne comptait pas, mais le joueur rebondissait quand même (et le compteur de cœurs ne bougeait pas). L'enchaînement réel était ~5 rebonds pour 3 coups effectifs — d'où la sensation « plus de 3 fois ». Corrigé en ramenant l'invincibilité du boss à **20 frames** (< durée d'un arc de rebond) : chaque écrasement atterrit après la fin de l'invincibilité, donc **exactement 3 écrasements = boss vaincu**, conformément à l'aide. Aucun risque de double-coup (le rebond dégage le joueur du boss en 1 frame, et la condition de saut `vy > 2` devient fausse immédiatement) ; le clignotement de dégât reste visible.

---

## 🚀 Déploiement

**Production (GitHub Pages via CI)** : à chaque `push` sur `main`, le workflow `.github/workflows/deploy.yml` fait `npm ci && npm run build` puis déploie `dist/` sur GitHub Pages (Source : « GitHub Actions » dans Settings → Pages). Le build produit un **`dist/index.html` unique** (JS + CSS inlinés/minifiés) + `sw.js` + `manifest.json` + `icons/`.

**Dev / test local** :

```bash
npm install        # installer Vite + vite-plugin-singlefile
npm run dev        # serveur de dev Vite (http://localhost:5173, hot reload)
npm run build      # build de prod -> dist/index.html (fichier unique inliné)
npm run preview    # prévisualiser le build
```

Le `dist/` généré peut aussi être déposé tel quel sur n'importe quel hébergement statique en **HTTPS** (le Service Worker exige HTTPS, sauf en `localhost`).

