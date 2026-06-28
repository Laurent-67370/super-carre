import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build = un SEUL index.html (JS + CSS inlinés/minifiés) → préserve le déploiement
// "fichier unique" + la PWA (sw.js / manifest / icons restent des fichiers séparés
// dans public/, copiés tels quels à la racine de dist/).
export default defineConfig({
  plugins: [viteSingleFile()],
  base: './',                 // chemins relatifs (GitHub Pages sous-chemin /super-carre/)
  build: {
    target: 'es2019',
    outDir: 'dist',
    emptyOutDir: true,
  },
});