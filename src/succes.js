/* SUCCÈS 🏅 — accomplissements débloqués au fil du jeu.
   Chaque succès rapporte 10 🪙. Détection événementielle : le moteur,
   l'éditeur et la boutique appellent signaler(evenement, contexte). */
import { afficherToast } from './ui.js';

export const SUCCES = {
    gardien:   { emoji: '👑', nom: 'Tombeur du Gardien',  desc: 'Vaincre le boss du niveau 6' },
    sorcier:   { emoji: '🔮', nom: 'Chasse-Sorcier',      desc: 'Vaincre le boss du niveau 12' },
    colosse:   { emoji: '🌋', nom: 'David contre Colosse', desc: 'Vaincre le boss du niveau 18' },
    roi:       { emoji: '🌀', nom: 'Régicide',            desc: 'Vaincre le Roi Fantôme (niveau 24)' },
    complet:   { emoji: '🏆', nom: 'Grand Voyageur',      desc: 'Terminer les 24 niveaux' },
    or:        { emoji: '🥇', nom: 'Éclair',              desc: 'Décrocher une médaille d\'or' },
    intrepide: { emoji: '😈', nom: 'Intrépide',           desc: 'Finir un niveau en mode Difficile' },
    defi:      { emoji: '📅', nom: 'Défi relevé',         desc: 'Terminer un défi du jour' },
    serie3:    { emoji: '🔥', nom: 'Série de 3',          desc: '3 défis du jour, 3 jours d\'affilée' },
    architecte:{ emoji: '✏️', nom: 'Architecte',          desc: 'Sauvegarder un niveau dans l\'éditeur' },
    certifie:  { emoji: '🤖', nom: 'Certifié par le bot', desc: 'Faire valider un niveau par la vérification' },
    fortune:   { emoji: '💰', nom: 'Fortune',             desc: 'Détenir 200 🪙 en même temps' }
};

const CLE = 'supercarre_succes';
const CLE_DEFIS = 'supercarre_defis_faits';
let _crediter = null; // branché au démarrage (main.js)

export function configurerSucces(crediterFn) { _crediter = crediterFn; }

export function succesDebloques() {
    try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; }
}
export function estDebloque(id) { return !!succesDebloques()[id]; }

export function debloquer(id) {
    if (!SUCCES[id] || estDebloque(id)) return false;
    const tous = succesDebloques();
    tous[id] = Date.now();
    try { localStorage.setItem(CLE, JSON.stringify(tous)); } catch (e) {}
    const s = SUCCES[id];
    if (_crediter) _crediter(10);
    afficherToast(`🏅 Succès débloqué : ${s.emoji} ${s.nom} (+10 🪙)`);
    if (navigator.vibrate) navigator.vibrate([40, 30, 40, 30, 80]);
    return true;
}

// Dates (ISO) des défis du jour terminés
function defisFaits() {
    try { return JSON.parse(localStorage.getItem(CLE_DEFIS)) || []; } catch (e) { return []; }
}
function _serieDe3(dates) {
    const set = new Set(dates);
    for (const d of dates) {
        const [y, m, j] = d.split('-').map(Number);
        const base = new Date(y, m - 1, j);
        let ok = true;
        for (let k = 1; k < 3; k++) {
            const dd = new Date(base); dd.setDate(base.getDate() + k);
            const iso = `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
            if (!set.has(iso)) { ok = false; break; }
        }
        if (ok) return true;
    }
    return false;
}

export function signaler(evenement, ctx = {}) {
    switch (evenement) {
        case 'boss':
            debloquer({ 1: 'gardien', 2: 'sorcier', 3: 'colosse', 4: 'roi' }[ctx.type]);
            break;
        case 'medaille':
            if (ctx.medaille === '🥇') debloquer('or');
            break;
        case 'niveau_fini':
            if (ctx.difficulte === 'difficile') debloquer('intrepide');
            if (ctx.idx === 23) debloquer('complet');
            break;
        case 'defi_fini': {
            const dates = defisFaits();
            if (ctx.iso && !dates.includes(ctx.iso)) {
                dates.push(ctx.iso);
                try { localStorage.setItem(CLE_DEFIS, JSON.stringify(dates)); } catch (e) {}
            }
            debloquer('defi');
            if (_serieDe3(dates)) debloquer('serie3');
            break;
        }
        case 'niveau_sauve': debloquer('architecte'); break;
        case 'bot_valide': debloquer('certifie'); break;
        case 'solde':
            if (ctx.valeur >= 200) debloquer('fortune');
            break;
    }
}
