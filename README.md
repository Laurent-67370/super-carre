# 🟥 Super Carré

Jeu de plateforme HTML5 autonome, jouable au clavier comme au tactile. Tout tient dans un seul fichier `jeuv2.html` (aucune dépendance, aucun serveur requis) : il suffit de l'ouvrir dans un navigateur ou de le déposer sur un hébergement statique.

**16 niveaux**, un éditeur de niveaux intégré, une sauvegarde de progression et un Hall of Fame.

---

## 🎮 Comment jouer

| Action | Clavier | Tactile |
|---|---|---|
| Aller à gauche | ← ou Q | bouton ◀ |
| Aller à droite | → ou D | bouton ▶ |
| Sauter | Espace, ↑ ou Z | bouton 🦘 |
| Pause | Échap ou P | bouton ⏸ |

Le saut est **dynamique** : maintenir la touche saute plus haut, relâcher tôt fait un petit saut. Une tolérance de saut (*coyote time*) et une mémorisation de l'appui (*jump buffer*) rendent les sauts plus pardonnants, surtout sur mobile.

### But
Ramasse **toutes les pièces** 🪙 d'un niveau pour débloquer le suivant. Tu démarres avec **5 vies** ❤️. Tomber dans un trou ou toucher un ennemi/pic sans protection coûte une vie. À court de vies, c'est le Game Over.

### Astuces
- **Saute sur les ennemis** 👾 pour les écraser (et gagner des points).
- Les **ressorts** 🔴 propulsent très haut.
- Les **pics** 🔺 sont mortels au contact.

---

## ⚡ Power-ups

Chaque power-up dure environ 10 secondes (visible via l'aura autour du joueur).

| Power-up | Effet |
|---|---|
| 🔵 Double saut | un second saut en l'air |
| 🟡 Bouclier | immunité temporaire aux dégâts |
| 🟢 Vitesse | déplacement accéléré |

---

## 🏆 Score

| Action | Points |
|---|---|
| Ramasser une pièce | +100 |
| Écraser un ennemi | +150 |
| Ramasser un power-up | +250 |

Le score final ajoute un bonus pour les vies restantes et les niveaux franchis, moins une légère pénalité de temps. Les meilleurs scores sont enregistrés dans le **Hall of Fame** (avec saisie d'un pseudo).

---

## 🗺️ Les 16 niveaux

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
| 16 | 🏰 La Forteresse | 2000×1100 | **Niveau final géant** (29 pièces, 9 ennemis) |

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
| 👾 | Ennemi |
| 🔺 | Pics |
| 🔴 | Ressort |
| 🔵 | Power-up double saut |
| 🟡 | Power-up bouclier |

### Fonctions
- **Monde L / Monde H** : règle la largeur et la hauteur du monde (pour des niveaux qui scrollent).
- **▶ Tester** : jouer immédiatement son niveau, puis « ◀ Retour éditeur » pour revenir à l'édition.
- **💾 Sauvegarder** : conserve le niveau dans le navigateur.
- **⤓ Export** : récupère le code du niveau (pour l'intégrer au jeu ou le partager).

Les niveaux créés sont stockés localement dans le navigateur.

---

## 💾 Sauvegarde

Le jeu utilise le stockage local du navigateur (`localStorage`) :

| Donnée | Clé |
|---|---|
| Meilleur niveau débloqué | `supercarre_progress` |
| Hall of Fame (top scores) | `supercarre_highscores` |
| Niveaux de l'éditeur | `supercarre_editor_levels` |

Au lancement, si une progression existe, le menu propose **▶ CONTINUER** (reprendre au niveau débloqué) en plus de **🔄 NOUVELLE PARTIE** (repartir de zéro, ce qui efface la progression). Terminer un niveau débloque le suivant ; un Game Over ne fait pas perdre les niveaux déjà débloqués.

> **Note :** en navigation privée, ou si le fichier est ouvert via `file://` sur certains navigateurs, le stockage local peut être désactivé. Dans ce cas, le jeu reste jouable mais la progression n'est pas conservée. Servi depuis un vrai hébergement (HTTP/HTTPS), tout fonctionne normalement.

---

## 🛠️ Caractéristiques techniques

- **Un seul fichier**, sans dépendance externe ni build.
- Boucle de jeu à **pas de temps fixe (60 Hz)** : vitesse identique quel que soit le taux de rafraîchissement de l'écran.
- Rendu adapté à la **densité de pixels** (`devicePixelRatio`) : net sur écrans Retina / haute résolution.
- **Caméra avec scrolling** fluide et parallaxe, bornée aux limites du monde.
- Pause (avec auto-pause quand l'onglet passe en arrière-plan).
- Audio généré par la **Web Audio API** (pas de fichiers son).
- Contrôles tactiles multi-points et clavier.

---

## 🚀 Déploiement

Aucune installation. Pour mettre le jeu en ligne, déposer `jeuv2.html` sur n'importe quel hébergement de fichiers statiques (par exemple un dossier servi par Nginx). On peut le renommer `index.html` pour qu'il s'ouvre directement.

Pour jouer en local, ouvrir le fichier dans un navigateur — de préférence via un petit serveur local plutôt qu'en `file://` pour que la sauvegarde fonctionne :

```bash
# depuis le dossier contenant le fichier
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/jeuv2.html
```
