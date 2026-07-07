#!/usr/bin/env node
/* controle-ids.mjs — contrôle croisé des ids DOM (CI)
   Vérifie que chaque id référencé dans le JS (getElementById / querySelector('#…'))
   existe bien dans index.html OU est créé dynamiquement par le JS lui-même
   (littéral id="…" dans un template, ou affectation .id = '…').
   La famille de bugs v29 / v59 / v65 / v79 devient impossible à déployer. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const html = readFileSync('index.html', 'utf8');
const fichiersJS = readdirSync('src').filter(f => f.endsWith('.js')).map(f => join('src', f));

// --- 1. ids DÉFINIS ---
const idsDefinis = new Set();
// a) dans index.html : id="…" ou id='…'
for (const m of html.matchAll(/\bid\s*=\s*["']([\w-]+)["']/g)) idsDefinis.add(m[1]);

let jsTotal = '';
for (const f of fichiersJS) jsTotal += readFileSync(f, 'utf8') + '\n';
// b) créés par le JS : id="…" dans des templates HTML, ou .id = '…'
for (const m of jsTotal.matchAll(/\bid\s*=\s*\\?["']([\w-]+)\\?["']/g)) idsDefinis.add(m[1]);
for (const m of jsTotal.matchAll(/\.id\s*=\s*["'`]([\w-]+)["'`]/g)) idsDefinis.add(m[1]);

// --- 2. ids RÉFÉRENCÉS par le JS ---
const references = new Map(); // id -> [fichier:ligne, …]
for (const f of fichiersJS) {
    const lignes = readFileSync(f, 'utf8').split('\n');
    lignes.forEach((ligne, i) => {
        for (const m of ligne.matchAll(/getElementById\(\s*["']([\w-]+)["']\s*\)/g)) {
            if (!references.has(m[1])) references.set(m[1], []);
            references.get(m[1]).push(`${f}:${i + 1}`);
        }
        for (const m of ligne.matchAll(/querySelector(?:All)?\(\s*["']#([\w-]+)["']\s*\)/g)) {
            if (!references.has(m[1])) references.set(m[1], []);
            references.get(m[1]).push(`${f}:${i + 1}`);
        }
    });
}

// --- 3. verdict ---
const manquants = [...references.keys()].filter(id => !idsDefinis.has(id)).sort();
if (manquants.length) {
    console.error(`❌ ${manquants.length} id(s) référencé(s) en JS mais introuvable(s) dans le HTML :`);
    for (const id of manquants) {
        console.error(`   #${id}  ← ${references.get(id).join(', ')}`);
    }
    process.exit(1);
}
console.log(`✅ Contrôle des ids DOM : ${references.size} ids référencés, tous présents (${idsDefinis.size} définis).`);
