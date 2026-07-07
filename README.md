# 🟥 Super Pixou

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
Tu incarnes **Pixou**, un petit personnage rouge à casquette turquoise, au design original. Il est animé : ses yeux suivent la direction du regard, il cligne des yeux, ses pieds se balancent à la course et il fait une petite tête de surprise en plein saut. Petit plus : **tape la mascotte sur l'écran d'accueil**, elle fait un bond cartoon avec son et vibration — et **fais-la glisser horizontalement** : elle **tourne sur elle-même en vrai volume 3D** (boîte CSS avec tranches latérales et dos aux couleurs du skin), suit ton doigt, continue sur l'inertie d'une pichenette (petit clic sonore à chaque quart de tour) puis se stabilise face à toi.

### 🎚️ Difficulté
Trois modes, sélectionnables sous le menu de l'accueil (mémorisés, appliqués à la prochaine partie) :
- **😊 Facile** : 6 vies, ennemis et boss ralentis (×0,75), invincibilité prolongée après un dégât (2,5 s), **checkpoint automatique dans tous les niveaux** ;
- **😐 Normal** : le jeu d'origine — 5 vies, checkpoint auto dans les grands mondes ;
- **😈 Difficile** : 3 vies, ennemis et boss accélérés (×1,25), invincibilité raccourcie, **aucun checkpoint automatique** (celui posé dans l'éditeur reste)… mais chaque pièce **crédite le double 🪙** au portefeuille — le risque paie.

Par équité, **étoiles et médailles gardent les mêmes règles et seuils** dans tous les modes ; la démo reste sur les réglages standard.

### 🎬 Démo & 🍿 Intro
- **🎬 DÉMO** : le jeu se joue tout seul (« attract mode ») sur 4 niveaux — dont le 👑 boss en final — grâce à un pilote automatique qui planifie ses routes (graphe des plateformes + BFS), dose ses sauts et utilise les ressorts. Pixou y est invincible et la progression sauvegardée n'est jamais touchée. **Le moindre toucher rend la main** et ramène au menu.
- **🍿 INTRO** : un générique façon Star Wars — « Il y a bien longtemps, dans un navigateur lointain… » puis l'histoire de Pixou défile en perspective vers un champ d'étoiles, au son d'une **fanfare orchestrale originale** (timbales, cuivres, nappes — générée par le moteur WebAudio). La mascotte en apesanteur est un **clone en direct du Pixou personnalisé** (couleur, chapeau, costume, lunettes, chaussures). ✕ PASSER ou un simple toucher pour sortir.
- La **démo comme l'intro respectent la personnalisation** équipée dans la 🎨 Boutique.

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

Sur ordinateur, le nom du Hall of Fame se saisit aussi **au clavier** : ↑/↓ fait défiler la lettre, ←/→ change de position, frappe directe A-Z/0-9 (avancée automatique), Entrée valide.

### ⏱️ Contre-la-montre & médailles
Le **meilleur temps** de chaque niveau est mémorisé (il ne peut que s'améliorer). Trois médailles récompensent la vitesse — 🥇 or, 🥈 argent, 🥉 bronze — avec des seuils calculés automatiquement selon la taille du monde, le nombre de pièces et la présence d'un boss. L'écran de fin de niveau affiche ton chrono, ta médaille, la mention **🔥 RECORD !** et le temps à battre pour la médaille supérieure ; le sélecteur « 🎯 NIVEAUX » affiche ta médaille en haut à droite de chaque tuile. Étoiles et médailles sont indépendantes : les ⭐ récompensent la prudence, les 🥇 la vitesse.

📤 **Partage tes scores** : depuis le Hall of Fame, le bouton **« 📤 PARTAGER »** ouvre la feuille de partage native du système (Web Share API) avec le classement top 5 et un lien vers le jeu. Sur les navigateurs sans feuille de partage (ordinateur), le classement est copié dans le presse-papier d'un seul appui — plus qu'à le coller wherever tu veux.

---

## 🎨 Boutique de skins

Chaque pièce ramassée en partie normale (ni démo, ni test de l'éditeur) alimente un **portefeuille 🪙 persistant**. Le bouton **🎨 BOUTIQUE** du menu permet de le dépenser pour habiller Pixou :
- **14 couleurs de corps** : Rouge (défaut), Bleu, Vert, Orange et Turquoise (60 🪙), Violet, Rose, Menthe et Lavande (90), Corail (120), Océan, Chocolat et Nuit (150), Or (250) ;
- **9 chapeaux** : Casquette turquoise (défaut), Tête nue (gratuit), cône de Fête (80), Bandana de pirate à pois (100), Cowboy (120), Magicien étoilé (120), Mortier de diplômé avec pompon (150), Casque de viking à cornes (180), Couronne à joyaux (200) ;
- **8 costumes** : Nœud papillon (80), Étoile de shérif (100 — assortie au chapeau cowboy !), Écharpe avec pan flottant (120), Collier hawaïen à 6 fleurs (120), Ceinture de karatéka (150), Sac à dos d'aventurier (150), **Cape de héros** (200) — dessinée derrière Pixou, elle **ondule selon sa vitesse de course** —, et le **Jetpack** (250) dont les **flammes ne s'allument qu'en pleine ascension** ;
- **4 paires de lunettes** : rondes de Savant (80), de Soleil avec reflet (100), 3D rétro rouge/cyan (100), Étoiles de star dorées (150) ;
- **4 paires de chaussures** (en plus des pieds Basiques recolorables) : Baskets blanches à bande rouge et semelle grise (100), Santiags à tige, talon et surpiqûre dorée (120), Palmes de plongée striées orientées dans le sens de la course (150), Rollers violets à roues turquoise (200) — l'animation de balancement des pieds est conservée pour chaque modèle ;
- **🌈 Studio de couleurs** (300) : des **sélecteurs de couleur libres** pour le corps (dégradé et contour dérivés automatiquement de la teinte choisie), la **casquette** (visière et pompon nuancés) et les **pieds** — appliqués en jeu comme sur la mascotte, avec bouton ↺ retour aux couleurs d'origine.

Acheter équipe automatiquement ; taper un article possédé l'équipe. Le skin s'applique **partout** : en jeu (avec toutes les expressions et animations de Pixou), et la mascotte de l'accueil prend la couleur choisie. Les joueurs existants reçoivent un **bonus de bienvenue** de 30 🪙 par niveau déjà débloqué. Le tout est couvert par la sauvegarde exportable (clés `supercarre_skins` et `supercarre_portefeuille`).

## 👑 Les 4 boss

Un boss garde chaque palier — et chacun a **sa personnalité** :
- **👑 Le Gardien** (niv. 6, 3 PV) : patrouille et charge, de plus en plus vite à mesure qu'il encaisse — le boss d'apprentissage ;
- **🔮 Le Sorcier** (niv. 12, 3 PV) : coiffé d'un chapeau étoilé, il lance des **salves de boules magiques en cloche** visant ta position — esquive, puis saute-lui dessus entre deux salves ;
- **🌋 Le Colosse** (niv. 18, 4 PV) : massif, épaulettes à pics — il **bondit sur toi et son impact déclenche deux ondes de choc** qui courent au sol (saute-les !), puis reste **étourdi** quelques secondes : c'est ta fenêtre ;
- **🌀 Le Roi Fantôme** (niv. 24, 5 PV) : il **se téléporte** (intangible pendant le fondu), charge à grande vitesse, et à mi-vie chaque téléportation s'accompagne d'une **étoile de projectiles**. Le boss final mérite son trône.

Dans tous les cas : **saute sur la tête** pour infliger un coup, la barre de vie est affichée au-dessus, et la colère monte avec les dégâts (teinte rougissante, attaques accélérées).

## 🏅 Les 12 succès

Des accomplissements à débloquer au fil du jeu, chacun rapportant **+10 🪙** : vaincre chacun des 4 boss (👑🔮🌋🌀), terminer les 24 niveaux 🏆, décrocher une médaille d'or 🥇, finir un niveau en Difficile 😈, relever un défi du jour 📅, enchaîner **3 défis sur 3 jours consécutifs** 🔥, sauvegarder un niveau ✏️, le faire certifier par le bot 🤖, et détenir 200 🪙 💰. La **galerie** (débloqués dorés, verrouillés grisés avec leur indice) vit dans l'écran 🏆 Hall of Fame. Détection événementielle (`succes.js` : le moteur, l'éditeur et la boutique signalent), déblocage idempotent avec toast et vibration.

## 📅 Défi du jour

En tête du sélecteur « 🎯 NIVEAUX » : **un niveau généré avec la date comme graine** (PRNG mulberry32) — le monde entier joue exactement le même niveau le même jour. La difficulté de génération tourne sur trois jours (équilibré → intense → doux), le fond d'ambiance est tiré de la date, et le générateur **auto-valide** chaque niveau (sauts faisables, pièces à portée). Chrono, médailles à seuils automatiques et **record du jour** mémorisé (la tuile affiche ton temps et t'invite à revenir demain). Analyse statique vérifiée sur une semaine de défis : zéro pièce à dégât garanti, tout à portée de saut.

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
- **🔗 Partager** : génère un **lien cliquable** (`…/super-carre/?n=PIXOU1.…` — le niveau compressé sans perte voyage dans l'URL) et ouvre le partage natif du téléphone (WhatsApp, SMS, mail…). **Le destinataire clique : le jeu s'ouvre et lui propose ▶ JOUER (avec chrono et médailles) ou ✏️ ÉDITEUR** — zéro copier-coller. L'URL est nettoyée après réception (pas de re-déclenchement au rafraîchissement).
- **📥 Coller un code** : le secours universel — colle un **lien**, un message entier ou un ancien code PIXOU nu : tout est détecté automatiquement (le paramètre `?n=` des liens est décodé avant analyse).
- **🤖 Vérifier le niveau** : le pilote de la démo joue le niveau en simulation accélérée (jusqu'à 90 s de jeu, sans rendu) et confirme que toutes les pièces sont atteignables — les pièces ratées clignotent en rouge 6 s sur le canvas. Un passage très acrobatique peut dépasser le bot, le message le précise.
- **🏁 Checkpoint** : pose un drapeau à damier (un seul par niveau, le nouveau remplace l'ancien) — il devient le point de réapparition une fois touché, **prioritaire sur le checkpoint automatique** des grands mondes.
- **📋 Dupliquer** : clone l'objet sélectionné avec un léger décalage — les escaliers de plateformes se construisent en quelques appuis.
- **🎨 Fond** : 10 ambiances de ciel au choix (☀️ Jour, 🌅 Aube, 🌇 Coucher, 🌙 Nuit, 🌌 Espace, 🌲 Forêt, 🌋 Lave, 🌊 Océan, 🔮 Mystique, 🍃 Menthe) — aperçu en direct sur le canvas de l'éditeur, appliqué en test et dans 📝 Mes niveaux, transporté par les codes 🔗 PIXOU et les fichiers .json (les anciens codes retombent sur Jour).
- **💾 Télécharger .json** / **📂 Charger .json** : exporter ou importer un niveau sous forme de **fichier `.json`**, pratique pour le sauvegarder hors du navigateur ou le partager. Le format JSON est sans perte (contrairement au copier-coller de code).

**🎯 Jouer ses créations** : chaque niveau sauvegardé dans l'éditeur apparaît dans le sélecteur « 🎯 NIVEAUX », section **📝 Mes niveaux** — jouable comme un vrai niveau avec chrono, **médailles 🥇🥈🥉 à seuils automatiques** (calculés d'après le nombre de pièces et la taille du monde) et **meilleur temps mémorisé** (affiché sur la tuile). Fin de niveau : écran dédié avec 🔄 REJOUER / 🏠 MENU. Par équité, les niveaux persos ne créditent pas le portefeuille 🪙 et n'alimentent ni les étoiles ni le Hall of Fame (réservés à l'aventure).

Les niveaux créés sont stockés localement dans le navigateur. Pour les partager : **🔗 code de partage** (recommandé, un message suffit) ou fichier **`.json`** (archivage hors navigateur). L'ancien « ⤓ Exporter le code » (format développeur) a été retiré du menu en v54 — il faisait double emploi ; les vieux codes restent importables via 📥.

---

## 💾 Sauvegarde

**Trois protections contre le « tout local »** :
- **🔒 Stockage persistant** : au démarrage, le jeu demande `navigator.storage.persist()` — le navigateur s'engage à ne pas évincer les données du site sous pression de stockage (l'état est affiché dans l'écran 💾).
- **📲 Transfert entre appareils par lien** : la sauvegarde complète est compressée en code `PIXSAVE1.…` et voyage dans une URL (`?s=…`) via le partage natif — l'autre appareil clique, confirme (avec avertissement de remplacement) et tout est restauré en un clic, puis le jeu redémarre. Repli fichier conseillé au-delà de ~12 000 caractères (nombreux niveaux créés).
- **💾 Rappel intelligent** : après chaque boss vaincu (paliers 6/12/18/24), un toast rappelle d'exporter ou de transférer.

Le jeu utilise le stockage local du navigateur (`localStorage`) :

| Donnée | Clé |
|---|---|
| Meilleur niveau débloqué | `supercarre_progress` |
| Étoiles obtenues par niveau | `supercarre_stars` |
| Hall of Fame (top scores) | `supercarre_highscores` |
| Niveaux de l'éditeur | `supercarre_editor_levels` |
| Meilleurs temps (contre-la-montre) | `supercarre_temps` |
| Records des niveaux persos 📝 | `supercarre_temps_perso` |
| Portefeuille 🪙 de la boutique | `supercarre_portefeuille` |
| Skins possédés et équipés | `supercarre_skins` |
| Difficulté choisie 🎚️ | `supercarre_difficulte` |
| Succès débloqués 🏅 | `supercarre_succes` |
| Défis du jour terminés 📅 | `supercarre_defis_faits` |
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

Super Pixou est une **Progressive Web App** : on peut l'installer sur son téléphone comme une vraie application, la lancer en plein écran (sans barre de navigateur) et y jouer **hors-ligne**.

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

- **Source modulaire** (`src/` : jeu, **rendu** (`rendujeu`), **combat de boss** (`combat`), entités, joueur, niveaux, audio, éditeur, bot de démo, skins, stockage, contrôles, UI) assemblée par **Vite** ; build = **`index.html` unique** (JS + CSS inlinés et minifiés, ~71 ko gzip).
- **PWA** installable et jouable hors-ligne (manifest + Service Worker réseau-d'abord + `updateViaCache:'none'`).
- Boucle de jeu à **pas de temps fixe (60 Hz)** : vitesse identique quel que soit le taux de rafraîchissement de l'écran.
- Rendu adapté à la **densité de pixels** (`devicePixelRatio`) : net sur écrans Retina / haute résolution.
- **Caméra avec scrolling** fluide et parallaxe, bornée aux limites du monde.
- Personnage **animé** dessiné au canvas (yeux, expressions, animation de course et de saut) et **entièrement personnalisable** : 43 articles de boutique (couleurs, Studio 🌈 libre, chapeaux, costumes — dont cape et jetpack animés —, lunettes, chaussures) rendus en canvas (jeu) et SVG (mascotte).
- Pause (avec auto-pause quand l'onglet passe en arrière-plan).
- Audio entièrement généré par la **Web Audio API** (bruitages, **4 ambiances musicales** au choix et **fanfare orchestrale d'intro**, aucun fichier son).
- **Checkpoints** à mi-parcours dans les grands niveaux (ou posés à la main dans l'éditeur), **système d'étoiles** (1 à 3 par niveau) et **contre-la-montre** (meilleurs temps + médailles 🥇🥈🥉 à seuils automatiques), progression sauvegardée, **exportable/importable** (fichier JSON) et **transférable entre appareils par lien** (`PIXSAVE1.…` compressé dans l'URL) — avec **stockage persistant** demandé au navigateur contre l'éviction automatique.
- **Combats de boss** tous les 6 niveaux (boss à 3 points de vie, écrasable sur la tête).
- Contrôles tactiles multi-points et clavier (jeu ET saisie du nom).
- **Mode démo** « attract mode » : pilote automatique planifié (graphe des plateformes + BFS, sauts dosés, ressorts), invincible, sortie au moindre toucher.
- **Éditeur de niveaux complet** : palette de 16 outils (dont 🏁 checkpoint posable), annuler/rétablir, niveau aléatoire, **🤖 vérification par le bot** (simulation accélérée garantissant que toutes les pièces sont atteignables), duplication d'objet — et les créations sauvegardées sont **jouables depuis le sélecteur** (📝 Mes niveaux : chrono, médailles, records).
- **📱 QR codes de partage** : chaque partage (niveau, sauvegarde, lien du jeu depuis l'aide) affiche un **QR stylé** — points arrondis, correction d'erreur élevée, **mini-Pixou aux couleurs du skin équipé** sur pastille centrale. Scanner remplace l'envoi du lien entre appareils proches. Le bouton d'envoi tente aussi de partager **l'image du QR** (PNG) via `navigator.share({ files })` quand l'appareil le permet, avec repli sur le texte seul sinon.
- **Partage de niveaux par lien cliquable** : le niveau (tuples compacts + deflate + **base64url**, format `PIXOU2.…` — **~45 % plus court** que l'ancien, zéro caractère encodé dans l'URL) voyage dans l'URL (`?n=…`) — le destinataire clique et choisit ▶ JOUER ou ✏️ ÉDITEUR ; import de secours universel (lien, message entier, code nu).
- **📅 Défi du jour** : niveau quotidien identique pour tous (PRNG mulberry32 semé par la date, difficulté en rotation, générateur auto-validé), record quotidien — de la rétention sans serveur.
- **Trois difficultés** (😊/😐/😈) mémorisées : vies, vitesse des ennemis, invincibilité, checkpoints et crédit 🪙 modulés — étoiles et médailles identiques partout.
- **10 fonds de niveau** sélectionnables dans l'éditeur, transportés par le partage.
- **Architecture modulaire** : moteur découpé en modules dédiés (game, rendujeu, combat, entities, player, levels, editor, demo, skins, storage, audio, ui) — le rendu est en fonctions pures, les séquences de dégât sont dédupliquées.
- **Audit de jouabilité outillé** : `analyse-pieces.mjs` (analyse statique pièce/pics/vide + simulation bot) a validé les 24 niveaux officiels — aucune pièce ne coûte une vie d'office.
- **Boutique** alimentée par un portefeuille 🪙 persistant (1 pièce ramassée = 1 pièce créditée, hors démo/test).

### ✨ v28 — migration modulaire + build Vite

Le projet passe d'un `index.html` monolithe (4124 lignes, JS inline) à une **source modulaire ES modules** assemblée par **Vite**. Le moteur canvas reste impératif (pas de React — anti-pattern pour un jeu canvas). Le build (`vite-plugin-singlefile`) produit un **`index.html` unique** (JS + CSS inlinés et minifiés, **182 ko / 46 ko gzip** vs 272 ko avant, −33 %), déployé via **GitHub Actions CI** (`.github/workflows/deploy.yml` : `npm ci && npm run build` → deploy-pages). La source est découpée en 12 modules (`src/` : `entities`, `player`, `levels`, `game`, `audio`, `storage`, `nameentry`, `editor`, `controls`, `ui`, `main`, `style.css`). Comportement strictement identique (vérifié runtime via smoke test Playwright : démarrage, boucle, éditeur, tous les menus, 0 erreur). `sw.js` v36, manifest corrigé (« 24 niveaux »).

### 📤 v80 — partage du QR code en image

Le bouton **📤 ENVOYER LE LIEN** de l'overlay QR (jeu, niveau, sauvegarde) tente désormais d'inclure **l'image du QR code** dans le partage natif, en plus du texte/lien : le canvas est converti en PNG (`canvas.toBlob`) et transmis via `navigator.share({ files })` quand l'appareil le permet (`navigator.canShare({ files })`). Sur les navigateurs sans partage de fichiers (courant sur ordinateur), repli automatique et transparent sur le partage texte seul, comme avant.

### 🔧 Correctif v79 — bouton QR du jeu manquant dans l'aide

Le module `main.js` reliait déjà un clic sur `#btn-qr-jeu` à l'affichage du QR code du jeu (`document.getElementById('btn-qr-jeu').addEventListener(...)`), mais ce bouton n'existait pas dans `index.html` : `getElementById` renvoyait `null`, provoquant une `TypeError` au chargement. Corrigé en ajoutant une carte **📱 Partager le jeu** en fin de l'aide (`#help-content`), avec le bouton `btn-qr-jeu` manquant.

### 📱 v78 — QR codes de partage avec Pixou au centre

Chaque partage gagne un **QR code stylé** (module `qrpixou.js`, bibliothèque `qrcode-generator` inlinée au build — la philosophie fichier-unique hors-ligne est préservée) : points arrondis, yeux de détection aux coins adoucis, et **mini-Pixou dessiné au centre aux couleurs du skin équipé** (casquette comprise) sur pastille blanche. La sur-impression reste ≤ 8 % des modules, très sous la tolérance de la correction d'erreur (ECC H à 30 %, bascule M au-delà de 520 caractères). Branché sur les trois partages : **🔗 niveau** (overlay « Scanne pour jouer » + bouton d'envoi du lien), **📲 sauvegarde** (scan direct entre appareils, garde-fou > 1 200 caractères → envoi classique), et **lien du jeu** (nouveau bouton 📱 dans l'aide ❓ — fais scanner tes amis !). Trois tests : QR de niveau (ECC H), texte long (bascule M), couleurs par défaut.

### 🔗 v77 — liens de partage 45 % plus courts

Nouveau format **PIXOU2** : le modèle du niveau passe en **tuples compacts** (table de types figée, champs facultatifs élagués) avant compression, et le base64 devient **base64url** (`-_` au lieu de `+/=`) — plus aucun caractère à encoder en `%XX` dans l'URL. Résultat mesuré sur un niveau type de 22 objets : **626 → 357 caractères** de lien (−43 %), et un niveau complet exploitant les 15 types tient en 262 caractères de code. **Rétro-compatibilité totale** : les anciens liens et codes PIXOU0/PIXOU1 s'importent toujours (le décodeur accepte les deux alphabets base64), et le PIXOU2 repasse par la même validation que tout import. Six tests : format, sûreté URL, fidélité sur les 15 types (emoji, dist/vit compris), import d'un ancien lien encodé, gain mesuré, rejet des codes corrompus.

### ✅ v76 — audit de mise en production

Vérification complète avant production, sans aucune correction nécessaire : **15/15 modules** syntaxiquement valides, **zéro reste de debug** (console.log, debugger, TODO), versions cohérentes (HTML/package/service worker), **zéro id DOM référencé en JS absent du HTML** (contrôle croisé automatisé — la famille de bugs historique), **24/24 niveaux** balayés à 120 frames avec entrées simulées, benchmarks **0,14 ms/frame** sur le niveau le plus dense et **0,27 ms/frame** sur le boss final (60× de marge sous le budget 60 fps), zéro fuite mémoire (projectiles et effets purgés), manifest PWA valide (4 icônes, fullscreen), **cache du service worker intégralement présent dans le build**, et régression express (import par lien, transfert de sauvegarde avec records par difficulté et succès, défi déterministe). Build final : **75,5 ko gzip**. Le jeu est prêt pour la production.

### 📖 v75 — README à jour

Le tableau des clés de sauvegarde gagne `supercarre_succes` et `supercarre_defis_faits` (11 clés couvertes par l'export, le transfert 📲 et le fichier). Les sections Succès, records par difficulté et l'historique v74 étaient déjà en place.

### 🏅 v74 — succès et records équitables

Deux points faibles corrigés d'un coup. **Records par difficulté** : `supercarre_temps` passe de `{niveau: temps}` à `{niveau: {f, n, d}}` avec **migration automatique** des anciens records vers Normal (idem pour les records persos et du défi du jour) ; l'enregistrement, la médaille et l'affichage suivent le mode en cours, l'infobulle des tuiles liste les trois chronos avec badges. **Système de succès** : nouveau module `succes.js` — 12 accomplissements événementiels (4 boss, 24 niveaux, or, Difficile, défi, série de 3 jours consécutifs, éditeur, certification bot, fortune à 200 🪙), **+10 🪙 par déblocage**, toast + vibration, galerie dans le Hall of Fame (compteur x/12, verrouillés grisés avec indice). Tests : 6/6 records (migration, indépendance des modes, meilleur global), 10/10 succès (idempotence, série dans le désordre, seuils), intégration boss vaincu → succès en conditions moteur.

### 📖 v73 — README à jour

Le pilier **📅 Défi du jour** rejoint les Caractéristiques techniques (la section descriptive et l'entrée v72 étaient déjà en place).

### 📅 v72 — le défi du jour

Un niveau quotidien **identique pour tous** : le générateur aléatoire de l'éditeur accepte désormais une source d'aléa injectable (`genererAleatoire(diff, alea)`), alimentée par un **PRNG mulberry32 semé par la date** (`infosDefiDuJour()` dans levels.js : graine AAAAMMJJ, difficulté en rotation sur 3 jours, fond dérivé de la graine). Tuile dédiée dorée en tête du sélecteur avec record du jour, lancement via le mode perso (chrono, médailles, clé de record datée — un record par jour, naturellement archivé). Validations : même graine → niveau identique, jours différents → niveaux différents, déterminisme préservé malgré la boucle de retry interne, 60 frames de jeu, et **analyse statique d'une semaine de défis** (0 pièce à dégât garanti, 0 hors de portée de saut — le générateur auto-valide déjà chemins et pièces).

### 📖 v71 — README à jour

Le pilier « Source modulaire » des Caractéristiques techniques intègre les modules `rendujeu` et `combat` issus du refactoring v70, et le poids du build est actualisé (~71 ko gzip).

### 🧱 v70 — refactoring : game.js dégraissé d'un tiers

Le monolithe game.js (1061 lignes) est découpé **sans aucun changement de comportement** : le rendu (dessin du monde, tutoriel, HUD, ~290 lignes) part dans **`rendujeu.js`** (fonctions pures de lecture d'état, palette du ciel en constante de module), et la gestion des boss côté moteur (~90 lignes) dans **`combat.js`** — dont `degatJoueur()` qui **déduplique les deux séquences de dégât identiques** (contact latéral et projectiles/ondes). game.js retombe à **724 lignes** avec des délégués fins ; aucun site d'appel externe ne change. Validation : 60 frames update+rendu sur les niveaux 1, 6, 12, 18, 24 et un niveau perso, plus trois tests de mécanique (écrasement de boss, contact latéral, projectile) au comportement identique — 9/9. Deux pièges attrapés par le harnais strict : une référence orpheline à `Game` (palette du ciel) et une collision de noms sur les locales `g` des dégradés.

### 👑 v69 — quatre boss, quatre personnalités

La plus grosse faiblesse du bilan est corrigée : les 4 boss partagent une base commune (PV, écrasement, colère, barre de vie) mais chacun a **son comportement, sa silhouette et sa teinte**. Le **Gardien** (niv. 6) garde la patrouille d'origine — la démo n'est pas affectée. Le **Sorcier** (12) tire des salves de 2 boules en cloche **calculées pour viser le joueur** (résolution balistique du vy initial). Le **Colosse** (18, 72×60, 4 PV) enchaîne bond avec suivi aérien → impact (secousse d'écran) → **deux ondes de choc au sol** → phase étourdie vulnérable. Le **Roi Fantôme** (24, 5 PV) alterne charges dirigées et **téléportations** (fondu avec intangibilité, réapparition à distance moyenne côté aléatoire) et tire une **étoile de 4 boules** à mi-vie. Nouvelles entités projectiles (gravité paramétrable, halo lumineux) et ondes (arcs de feu s'atténuant sur leur portée), collisions et dégâts intégrés au moteur, vitesses modulées par la difficulté 🎚️. Validation : simulation des 4 comportements (salves, phases sol/air/étourdi, 6 téléportations, étoile à mi-vie) et rendu du cycle complet des 4 boss.

### 📖 v68 — documentation à jour

Le pilier « progression » des Caractéristiques techniques intègre le **transfert entre appareils par lien** et le **stockage persistant** (v67). L'aide intégrée était déjà complète (cartes Sauvegarde 📲🔒, Éditeur, Difficulté 🎚️, mascotte 3D 🧊).

### 🔒 v67 — le « tout local » sécurisé

Trois parades sans backend : **stockage persistant** demandé au navigateur (`navigator.storage.persist()`, état affiché dans l'écran 💾 — fini l'éviction silencieuse), **📲 transfert entre appareils par lien** (sauvegarde complète compressée `PIXSAVE1.…` dans l'URL `?s=…`, overlay de confirmation avec avertissement de remplacement, rechargement propre après restauration, garde-fou fichier au-delà de 12 000 caractères), et **rappel d'export après chaque boss** vaincu. Import universel testé (lien, message, code nu, rejet propre). Pour de vrais classements en ligne, l'étape suivante serait un petit backend (Supabase).

### 📖 v66 — README consolidé

Les Caractéristiques techniques rattrapent les v58-65 : partage **par lien cliquable** (le pilier « code compact » est réécrit), pilier **trois difficultés**, et **fonds de niveau** de l'éditeur ; le tableau des clés de sauvegarde gagne `supercarre_difficulte`. Les sections descriptives (Difficulté, Éditeur, Démo & Intro, héros 3D) étaient déjà à jour au fil des versions.

### 🔧 Correctif v65 — écran noir au lancement d'un niveau par lien

La boucle de rendu n était démarrée que par le chemin des niveaux officiels (demarrerAuNiveau) : lancer un **niveau reçu par lien** ou un niveau de **📝 Mes niveaux** comme premier geste de la session laissait un écran noir (tout était prêt, mais rien ne dessinait). Le démarrage de la boucle est extrait en _lancerBoucle(), appelé aussi par demarrerPerso et par le mode ▶ Test de l éditeur (même risque), avec garde d idempotence. Vérifié en headless : 0 → 1 appel rAF au lancement à froid, pas de double boucle au REJOUER.

### 📬 v64 — partage par lien cliquable

Fini le copier-coller : **🔗 Partager génère un lien** (`?n=PIXOU1.…`, code compressé encodé dans l'URL, ~370 caractères). À l'ouverture du lien, le jeu détecte le paramètre, importe le niveau et affiche **« 📬 Niveau reçu ! »** avec deux choix : **▶ JOUER** (lancé comme un niveau perso, chrono et médailles compris) ou **✏️ ÉDITEUR** (déjà chargé) — plus « ✕ Plus tard » (le niveau reste dans l'éditeur). L'URL est nettoyée immédiatement (`history.replaceState`). **📥 Coller un code** accepte désormais aussi les liens (décodage `?n=` avant détection), en plus des messages entiers et des anciens codes nus — 4 chemins d'import validés par tests Node.

### 🎚️ v63 — trois niveaux de difficulté

Le jeu gagne un **sélecteur de difficulté** persistant sous le menu (😊 Facile / 😐 Normal / 😈 Difficile) : vies (6/5/3), vitesse des ennemis et boss (×0,75/×1/×1,25), durée d'invincibilité après dégât (150/90/70 frames), politique de checkpoint automatique (partout / grands mondes / jamais) et **crédit 🪙 doublé en Difficile** (le risque paie). Le mode Normal est strictement le jeu d'origine ; étoiles et médailles restent identiques partout ; la démo n'est pas affectée ; les niveaux persos 📝 suivent la difficulté choisie. Toast explicatif au changement, réglage appliqué à la prochaine partie.

### 🧊 v62 — la mascotte prend du volume

La rotation 3D de la v61 tournait une carte plate : la mascotte devient une **vraie boîte 3D CSS** (`transform-style: preserve-3d`). La face avant reste le SVG habillé complet ; s'y ajoutent **deux tranches latérales** de 24 px (dégradé dérivé de la couleur de contour du skin, via `nuancer()`) positionnées sur les flancs du corps, et un **panneau dorsal** aux couleurs du corps équipé avec bord assorti — recolorés en direct par la boutique comme le reste. En tournant, on voit désormais l'épaisseur de Pixou passer devant la caméra ; le bond 🦘 anime la boîte entière (tranches comprises).

### 🌀 v61 — la mascotte tourne en 3D

Nouvelle interaction sur l'accueil : **glisser la mascotte horizontalement la fait tourner sur elle-même** (rotation 3D CSS `rotateY` avec perspective). Elle suit le doigt, une **pichenette la lance sur l'inertie** (frottement à 0,955 par frame), un **clic sonore + micro-vibration** ponctue chaque quart de tour, puis elle **se stabilise face au joueur** avec un léger rebond (transition élastique vers le multiple de 360° le plus proche). Le tap simple garde son bond 🦘 (discrimination tap/drag à 7 px, pointer capture). Cinématique validée par test headless : suivi du doigt (200 px → 180°), clics aux quarts de tour, inertie 80 frames → stabilisation à 720°.

### 🥋 v60 — le Karatéka gagne son kimono

Le costume Karatéka ne se résumait qu à une ceinture noire, peu lisible sur les corps sombres : il gagne des **revers de kimono blancs en V** au-dessus de la ceinture (sans masquer le visage de Pixou), une bande plus épaisse et un nœud renforcé — en jeu comme sur la mascotte. 45 rendus combinés validés.

### 🔧 Correctif v59 — costumes visibles sur la mascotte

Les costumes portés sur le torse (ceinture de karatéka, nœud papillon, écharpe, étoile de shérif, collier hawaïen) étaient partiellement **masqués par le sourire et les joues de la mascotte** (dessinés après eux dans l ordre SVG) : les cinq groupes passent après le sourire — la ceinture noire s affiche désormais entière, nœud et pans compris. Le rendu en jeu n était pas concerné.

### 🌇 v58 — fond du niveau au choix dans l éditeur

Nouveau réglage **🎨 Fond** dans l'éditeur : 10 ambiances de ciel nommées (issues de la palette des 24 niveaux officiels — Jour, Aube, Coucher, Nuit, Espace, Forêt, Lave, Océan, Mystique, Menthe), avec **aperçu en dégradé directement sur le canvas de l'éditeur**. Le fond choisi s'applique en mode ▶ Test comme dans 📝 Mes niveaux (priorité sur la palette indexée du moteur, cache du dégradé invalidé proprement), voyage dans les codes 🔗 PIXOU et les .json (champ optionnel : anciens codes → Jour, fond inconnu → Jour). Tests Node : transport du fond, rétro-compatibilité, rejet des valeurs invalides.

### 📖 v57 — documentation consolidée

Les Caractéristiques techniques gagnent un pilier **Éditeur complet** (16 outils, vérification bot, checkpoint, Mes niveaux jouables) et mentionnent l audit de jouabilité outillé ; le tableau des clés de sauvegarde est complété (meilleurs temps, records persos, portefeuille, skins). L aide intégrée était déjà à jour.

### 🎯 v56 — jouer ses niveaux créés depuis le menu

Les créations de l'éditeur deviennent de **vrais niveaux jouables** : le sélecteur « 🎯 NIVEAUX » gagne une section **📝 Mes niveaux** listant les sauvegardes de l'éditeur, avec meilleur temps sur la tuile. En jeu : chrono, **médailles à seuils automatiques** (la formule des niveaux officiels, extraite en `seuilsDepuis()`), **record par niveau** (clé `supercarre_temps_perso`), écran de fin dédié 🎉/💀 avec REJOUER / MENU. Garde-fous : pas de crédit 🪙 (anti-farming), ni étoiles ni Hall of Fame. Trois vies, comme l'aventure.

### 🪙 v55 — jouabilité : plus aucune pièce « à dégât garanti »

Audit complet des 24 niveaux avec un nouvel outil d analyse (analyse-pieces.mjs, commité dans le dépôt) combinant **analyse statique** (que trouve-t-on sous chaque pièce en retombant : plateforme sûre, pics, ou vide ?) et **simulation par le bot**. Six pièces forçaient un dégât quasi systématique et ont été déplacées : Niv.14 (580,980) à 10 px au-dessus de pics → (635,950) au-dessus du bout libre de la plateforme ; Niv.15 (400,300) au-dessus du vide pur entre deux plateformes hautes (arc de ressort exigeant, chute = lave) → (455,300) au-dessus d une plateforme ; Niv.18 (425,500) → (455,500) et (895,400) — coincée dans un couloir de 30 px entre plafond et pics ! — → (920,412) ; Niv.19 (755,620) → (780,610) et (1150,420) → (1175,410), chacune décalée au-dessus de la partie libre de sa plateforme. Contrôle final : **0 alerte statique sur les 24 niveaux**. Les pièces volontairement acrobatiques (arcs de ressorts du Saut de la Foi) restent, mais rater son coup ramène désormais sur une surface sûre.

### 🤖 v54 — éditeur : vérification par le bot, checkpoint, duplication

L'éditeur gagne trois outils majeurs. **🤖 Vérifier le niveau** : le pilote automatique de la démo joue le niveau en simulation accélérée (≤ 90 s de jeu simulé, quasi instantané) et garantit que toutes les pièces sont atteignables — celles qu'il rate clignotent en rouge sur le canvas. **🏁 Checkpoint posable** dans la palette (unique, prioritaire sur l'automatique des grands mondes, transporté par les codes PIXOU et les .json). **📋 Dupliquer** l'objet sélectionné. Ménage : le bouton « ⤓ Exporter le code » (format développeur, partiellement lossy) quitte le menu — le code PIXOU et le .json couvrent tous les usages, les anciens codes restent importables. Deux bugs latents corrigés au passage : le téléchargement .json était cassé depuis la v39 (référence `m.nom` orpheline), et **l'import perdait silencieusement les abeilles 🐝 et les sauteurs 🦘** (absents de la liste blanche des types). Validation : 4 tests Node (aller-retour PIXOU complet, checkpoint transmis au moteur, pièce inaccessible identifiée, niveau complet validé).

### 📖 v53 — documentation remise à niveau

Les sections descriptives du README rattrapent les versions 50 à 52 : la présentation Démo & Intro mentionne la **fanfare orchestrale** et le **clone du Pixou personnalisé**, la section Score documente la **saisie du nom au clavier**, et les **Caractéristiques techniques** (figées à la v28) reflètent enfin l'état réel : build ~65 ko gzip, personnage personnalisable (43 articles canvas + SVG), contre-la-montre et sauvegarde exportable, mode démo planifié (graphe + BFS), partage de niveaux `PIXOU1`, portefeuille 🪙, fanfare WebAudio. L'aide intégrée (12 cartes) était déjà à jour.

### ⌨️👢 v52 — saisie du nom au clavier + chaussures bien visibles

**Clavier physique pour le Hall of Fame** : ↑/↓ fait défiler la lettre active (avec l'animation de flip et le son), ←/→ change de position, **frappe directe A-Z/0-9** avec avancée automatique, Entrée valide, Retour arrière efface et recule — le tactile existant est inchangé. **Correctif chaussures** : les modèles à tige (santiags, rollers, baskets, palmes) étaient dessinés derrière le corps qui masquait leur partie montante ; ils passent devant (en jeu comme sur la mascotte SVG), tandis que les pieds Basiques gardent leur look d'origine derrière le corps. Vérifié par un test d'ordre de rendu (la tige des santiags est bien tracée après le contour du corps).

### 🎺 v51 — fanfare orchestrale dans l'intro

Le générique a désormais sa musique : une **fanfare épique 100 % originale** générée par le moteur WebAudio du jeu (aucun fichier audio, aucune œuvre existante reproduite — le thème de Star Wars étant protégé, la composition est propre au jeu). Appel de timbales en roulement montant, cuivres héroïques en dents de scie doublés à l'octave, nappes de quintes sinusoïdales, structure élan → réponse → sommet → résolution (~19 s en boucle). La fanfare respecte le réglage muet 🔇, démarre avec le générique et se coupe en fondu à la fermeture (✕ PASSER, toucher ou fin du défilement).

### 👟 v50 — catégorie Chaussures

**43 articles !** Nouvelle catégorie 👟 avec 4 modèles dessinés autour de l'animation de balancement des pieds (préservée) : Baskets blanches à bande rouge, Santiags à tige et surpiqûre dorée avec talon orienté selon la direction, Palmes de plongée striées qui pointent dans le sens de la course, et Rollers violets à roues turquoise. Les pieds Basiques restent gratuits et recolorables via le Studio 🌈 ; sur la mascotte, les pieds de base se masquent quand un modèle est porté. Validation : 90 rendus chaussures × costumes × directions + rétro-compatibilité des anciennes sauvegardes.

### 🚀 v49 — encore plus de costumes et de lunettes

Le catalogue passe à **38 articles**. Quatre nouveaux costumes : étoile de shérif ⭐ (l'assortiment parfait du chapeau cowboy), collier hawaïen 🌺 à six fleurs, sac à dos d'aventurier 🎒 porté dans le dos, et le **jetpack 🚀 dont les flammes ne s'allument qu'en pleine ascension** (saut ou ressort). Trois nouvelles lunettes typées : rondes de savant 🤓, 3D rétro rouge/cyan 🎬, étoiles de star dorées 🤩 — le champ lunettes passe d'un booléen à un identifiant, avec rétro-compatibilité des anciennes sauvegardes. Versions canvas (jeu) et SVG (mascotte) pour chaque article. Validation : **407 combinaisons** chapeau × costume × lunettes rendues sans erreur, rétro-compatibilité comprise.

### 🔧 Correctif v48 — solde 🪙 du bouton Boutique rafraîchi au retour du jeu

Les pièces gagnées créditaient bien le portefeuille (sauvegarde immédiate à chaque pièce), mais le solde affiché sur le bouton 🎨 BOUTIQUE ne se rafraîchissait qu à l ouverture de la boutique : il est désormais mis à jour dans rafraichirMenu(), donc à chaque retour au menu.

### 🪞 v47 — l intro et la démo respectent la personnalisation

Le Pixou en apesanteur du générique est désormais un **clone en direct de la mascotte personnalisée** (couleur — y compris Studio 🌈 —, chapeau, costume, lunettes), avec renommage des ids SVG clonés (dégradé, clipPath) pour rester valides. Le texte du générique devient neutre (« courageux petit carré dans sa tenue du jour »). La **démo utilisait déjà le skin** (le joueur est créé à un seul endroit du moteur) — vérifié.

### 🦸 v46 — nouveaux chapeaux et costumes

Le catalogue passe à **31 articles** : 4 nouveaux chapeaux (bandana de pirate à pois avec nœud flottant, cowboy à larges bords, mortier de diplômé avec pompon orienté selon la direction, casque de viking à cornes) et une **nouvelle catégorie Costumes** — nœud papillon, écharpe au pan flottant animé, ceinture de karatéka, et la **cape de héros** dessinée derrière Pixou dont l'ondulation s'amplifie avec la vitesse de course. Chaque article existe en version canvas (jeu) et SVG (mascotte de l'accueil). Validation : 90 combinaisons chapeau × costume × lunettes rendues sans erreur.

### 🌈 v45 — palette élargie + Studio de couleurs

La garde-robe de Pixou explose : **14 couleurs de corps** prédéfinies (7 nouvelles : Orange, Turquoise, Menthe, Lavande, Corail, Océan, Chocolat) et surtout le **🌈 Studio de couleurs** (300 🪙) — trois sélecteurs de couleur **totalement libres** pour le corps (dégradé clair/sombre et contour dérivés automatiquement de la teinte via une fonction `nuancer()`), la casquette (visière/pompon nuancés) et les pieds. Les couleurs libres s'appliquent en jeu, sur la mascotte de l'accueil, et survivent au rechargement ; bouton ↺ pour revenir aux couleurs d'origine. Validation : 8 tests du Studio (hex invalide refusé, dérivation du dégradé, persistance, retombée sécurisée sans possession) et **146 combinaisons de skins** rendues sans erreur.

### 🕶️ v44 — la mascotte porte le skin complet

La mascotte de l'''accueil ne changeait que de couleur : elle porte désormais **tout le skin équipé** — les lunettes de soleil (avec reflets) et chacun des chapeaux en version SVG (casquette, couronne à joyaux, cône de fête rayé, chapeau de magicien étoilé, ou tête nue), mis à jour en direct à la sortie de la boutique.

### 💅 v43 — bouton Retour de la boutique stylé

Le ◀ RETOUR de la boutique héritait lui aussi du style navigateur par défaut (il manquait dans la liste des boutons retour) : il rejoint le style pilule translucide des autres écrans, avec une marge basse respectant la barre de navigation Android (safe-area).

### 💅 v42 — bouton Boutique stylé + aide complétée

Le bouton 🎨 BOUTIQUE (qui héritait du style navigateur par défaut) devient une **pilule pleine largeur au dégradé violet-rose** du jeu, liseré doré et **solde 🪙 affiché en permanence** dessus. Le bouton « Nouvelle partie » raccourci en **🔄 RECOMMENCER** (il débordait de sa demi-colonne). L'aide gagne une **carte 🎨 Boutique** (portefeuille, catalogue, achat = équipé).

### 🎨 v41 — boutique de skins

Les pièces servent enfin ! **Portefeuille 🪙 persistant** (chaque pièce ramassée hors démo/test), **boutique** au menu avec 14 articles en 3 catégories (7 couleurs de corps, 5 chapeaux dessinés au canvas — couronne à joyaux, cône de fête rayé, chapeau de magicien étoilé —, lunettes de soleil à reflet), achat = équipé, bonus de bienvenue de 30 🪙 par niveau débloqué pour les joueurs existants, mascotte de l'accueil recolorée en direct, et compatibilité totale avec la sauvegarde exportable. Validation : 9 tests unitaires du gestionnaire (achat, refus, persistance, sécurité) et rendu des **70 combinaisons de skins** sans erreur.

### 📖 v40 — aide et documentation à jour

L'aide intégrée (❓) gagne deux cartes : **✏️ Éditeur & partage** (création, niveau aléatoire, code 🔗 PIXOU, import du message entier) et **🎬 Démo & intro** (attract mode, sortie au toucher, générique — avec l'easter egg de la mascotte 🦘). Le README complète ses sections descriptives : contre-la-montre & médailles dans Score, boutons 🔗 Partager / 📥 Coller un code dans l'Éditeur, présentation Démo/Intro dans Comment jouer.

### 🔗 v39 — partage de niveaux créés

Les niveaux de l'éditeur se partagent enfin ! Le bouton **🔗 Partager** (menu de l'éditeur, section « Partage ») génère un code compact `PIXOU1.xxxx` — le modèle lossless du niveau (même forme que le fichier .json) compressé en deflate puis encodé en base64 (~380 caractères pour un niveau de 10 objets, emoji du nom compris) — et ouvre le **partage natif Android** (WhatsApp, SMS, mail…) avec un message d'instructions prêt à l'emploi, ou copie dans le presse-papiers sur ordinateur. Côté destinataire, **📥 Coller un code** reconnaît automatiquement un code PIXOU même noyé dans le message entier copié-collé (l'ancien format texte reste accepté). Variante `PIXOU0` non compressée en repli pour les navigateurs sans CompressionStream. Validé par tests aller-retour Node : import depuis message complet, préservation exacte des 10 objets et de l'emoji, rejet propre des codes corrompus.

### 🏠 v38 — accueil sur 2 colonnes + Pixou interactif

Le menu tenait de moins en moins dans l'écran (9 boutons empilés). Les boutons secondaires passent en **grille 2 colonnes** (Nouvelle partie | Niveaux, Hall of Fame | Éditeur, Démo | Intro, Musique | Sauvegarde) : le menu tient d'un coup à l'écran et **▶ CONTINUER garde seul toute la largeur** — la hiérarchie saute aux yeux. Libellés raccourcis en conséquence (🎯 NIVEAUX, ✏️ ÉDITEUR, 🎵 nom de l'ambiance). Et pour la convivialité : **taper la mascotte Pixou la fait sauter** — petit bond cartoon écrase-étire, son de saut et vibration. Zéro utilité, 100 % plaisir.

### 🍿 v37 — l'intro s'installe à l'accueil, avec Pixou en apesanteur

Le bouton **🍿 INTRO** quitte l'écran d'aide pour rejoindre le **menu d'accueil** (style pilule comme les autres). Et pour le fun : **la mascotte Pixou flotte en apesanteur** à travers le champ d'étoiles pendant le générique — traversée diagonale lente de l'écran en 26 s, rotation douce, halo rouge, yeux qui clignent, apparition après la phrase d'introduction. Pur SVG + CSS, aucune image téléchargée.

### 🧠 v36 — pilotage intelligent du mode démo (pathfinding)

Le bot passe du réactif au **planifié** : à chaque niveau il construit le **graphe de navigation des plateformes** (arêtes = sauts physiquement possibles selon la portée mesurée : ~190 px de haut maintenu, ~150 px de large en course, plus les arêtes « ressort » pour les super sauts) et calcule par **BFS le chemin complet** vers chaque pièce, suivi étape par étape. S'y ajoutent : le **saut dosé** (maintien 5 à 13 frames proportionnel à la hauteur à gagner — fini les sauts maximaux systématiques), la **descente maîtrisée** (cible en dessous → sortir par le bord et piloter la chute), le blocage plafond **ciblé** (n'interdit un saut que si la cible est au-delà du plafond), et pas de chasse à l'ennemi en pleine manœuvre de descente. Les heuristiques v34-v35 restent en filet de sécurité si aucun chemin n'existe. Résultats simulateur (fenêtre 60 s) : L'Éveil 6/6, La Grande Traversée 10/10 en 19,6 s sans dégât, **La Nuit des Pics 6/6 en 5,7 s** (contre 4/6 bloqué), boss vaincu.

### 🚀 v35 — Super Pixou + super saut pour le bot démo

- **Le jeu s'appelle désormais Super Pixou** (titre, menu, PWA installée, générique, partages). Tous les identifiants techniques (`supercarre_*`, format des sauvegardes et des niveaux, dépôt GitHub) sont inchangés : les progressions et fichiers existants restent 100 % compatibles.
- **Le bot démo maîtrise le super saut** : il maintient le saut pendant l'ascension tant que la cible est plus haute (gravité réduite du saut variable = vol nettement plus haut, comme un vrai joueur) et relâche à hauteur de cible pour ne pas sur-sauter. Quand une pièce résiste (2 abandons ou cible très haute), il prend la route du **ressort** (force -19 ≈ 3× un saut) et pilote vers la pièce en plein vol. Résultats simulateur : L'Éveil **6/6 en 6,5 s** (contre 5/6 bloqué), Grande Traversée 10/10 en 19 s **sans aucun dégât**, Invasion 7/7, boss toujours vaincu.

### 🔧 Correctif v34 — le bot démo se cognait la tête en boucle

En démo, Pixou pouvait rester bloqué à sauter sous une plateforme en continu : le bot ne vérifiait que la plateforme de sa cible, pas les plafonds quelconques au-dessus de sa tête. Le bot détecte désormais tout plafond à portée de saut : il se décale latéralement pour s'en dégager avant de sauter, continue d'avancer si le plafond se termine avant un obstacle, et ne recule devant des pics sous plafond qu'au contact imminent. Validation simulateur : Invasion 7/7 pièces en 31 s (contre 2/7 bloqué), zéro boucle de cognement sur la playlist.

### 🤖 v33 — mode démo (« attract mode »)

Le bouton **🎬 DÉMO** du menu lance le jeu en pilote automatique sur une playlist de 4 niveaux : L'Éveil, Invasion (écrasement d'ennemis), La Grande Traversée (grand monde + caméra) et **La Nuit des Pics avec son 👑 boss en final**. Le bot (`src/demo.js`) vise le boss ou la pièce la plus proche, grimpe par plateformes relais, contourne les plateformes au lieu de se cogner la tête dessous (point de passage avec hystérésis anti-oscillation), saute les trous et les pics avec élan, et écrase les ennemis sur son passage. Pixou est invincible en démo (aucun impact sur la progression sauvegardée), un bandeau 🎬 clignote à l'écran, et chaque niveau dure au plus 60 s (passage anticipé après 15 s sans pièce). **Le moindre toucher ou touche clavier rend la main** et ramène au menu — comme une borne d'arcade. Validé par simulation headless Node : boss vaincu en 1,6 s, 10/10 pièces sur La Grande Traversée.

### 🎬 v32 — aide à jour + générique façon Star Wars

- **Aide intégrée (❓) mise à jour** : nouvelle carte **⏱️ Contre-la-montre** (médailles, records, affichage sur les tuiles) et nouvelle carte **💾 Sauvegarde** (export/import).
- **🎬 INTRO** : un bouton dans l'en-tête de l'aide lance un **générique façon Star Wars** — « Il y a bien longtemps, dans un navigateur lointain, très lointain… » puis l'histoire de Pixou défile en perspective vers un champ de 110 étoiles scintillantes. Fermeture automatique à la fin, bouton ✕ PASSER, ou un simple toucher n'importe où. Pur CSS (perspective + rotateX), aucune bibliothèque.

### ⏱️ v30 — contre-la-montre + sauvegarde exportable

- **Records séparés par difficulté** (v74) : chaque niveau mémorise jusqu'à trois chronos (😊/😐/😈) — les anciens records migrent automatiquement vers Normal ; la médaille reflète le meilleur temps du mode en cours, l'infobulle des tuiles liste les trois.
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

