# 🟥 Super Carré

Jeu de plateforme HTML5 autonome, jouable au clavier comme au tactile. Tout le jeu tient dans un seul fichier `index.html` (aucune dépendance, aucun serveur requis) : il suffit de l'ouvrir dans un navigateur ou de le déposer sur un hébergement statique.

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

Le score final ajoute un bonus pour les vies restantes et les niveaux franchis, moins une légère pénalité de temps. Les meilleurs scores sont enregistrés dans le **Hall of Fame** (avec saisie d'un pseudo).

📤 **Partage tes scores** : depuis le Hall of Fame, le bouton **« 📤 PARTAGER »** ouvre la feuille de partage native du système (Web Share API) avec le classement top 5 et un lien vers le jeu. Sur les navigateurs sans feuille de partage (ordinateur), le classement est copié dans le presse-papier d'un seul appui — plus qu'à le coller wherever tu veux.

---

## 🗺️ Les 24 niveaux

La difficulté monte progressivement. À partir du niveau 9, les mondes deviennent **plus grands que l'écran** : la caméra suit le joueur (scrolling horizontal et/ou vertical).

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

- **Jeu en un seul fichier**, sans dépendance externe ni build.
- **PWA** installable et jouable hors-ligne (manifest + Service Worker).
- Boucle de jeu à **pas de temps fixe (60 Hz)** : vitesse identique quel que soit le taux de rafraîchissement de l'écran.
- Rendu adapté à la **densité de pixels** (`devicePixelRatio`) : net sur écrans Retina / haute résolution.
- **Caméra avec scrolling** fluide et parallaxe, bornée aux limites du monde.
- Personnage **animé** dessiné au canvas (yeux, casquette, animation de course et de saut).
- Pause (avec auto-pause quand l'onglet passe en arrière-plan).
- Audio entièrement généré par la **Web Audio API** (bruitages et **4 ambiances musicales** au choix, aucun fichier son).
- **Checkpoints** à mi-parcours dans les grands niveaux, et **système d'étoiles** (1 à 3 par niveau) avec progression sauvegardée.
- Contrôles tactiles multi-points et clavier.

---

## 🚀 Déploiement

Aucune compilation. Pour héberger le jeu, déposer les fichiers (`index.html`, `manifest.json`, `sw.js` et le dossier `icons/`) sur n'importe quel hébergement statique en **HTTPS** (le Service Worker exige HTTPS, sauf en `localhost`).

Pour jouer ou tester en local, lancer un petit serveur plutôt que d'ouvrir le fichier en `file://` (nécessaire pour la PWA et la sauvegarde) :

```bash
# depuis le dossier contenant les fichiers
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/
```

