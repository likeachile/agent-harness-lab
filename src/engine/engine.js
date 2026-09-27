/* =============================================================================
   Logique pure (sans React) : exécution du graphe KYC et simulation d'attaque.
   Testée par tests/engine.test.mjs — l'interface ne fait qu'animer ces résultats.
   ============================================================================= */

import { caseById } from '../data/kyc.js';
import { GUARDS } from '../data/security.js';

/* ------------------------------------------------------------------ module 2 */

/**
 * Étapes d'un dossier. Tant qu'aucune décision humaine n'est prise, le parcours
 * s'arrête sur l'étape d'interruption ; ensuite la branche choisie s'ajoute.
 */
export function kycSteps(caseId, decision = null) {
  const c = caseById(caseId);
  if (!c.branches || !decision) return c.steps;
  return [...c.steps, ...c.branches[decision]];
}

/** État cumulé après l'étape i (incluse), et champs modifiés par cette étape. */
export function stateAt(steps, i) {
  const state = {};
  for (let k = 0; k <= i && k < steps.length; k++) Object.assign(state, steps[k].set);
  return { state, changed: i >= 0 && steps[i] ? Object.keys(steps[i].set) : [] };
}

/* ------------------------------------------------------------------ module 3 */

/**
 * L'attaque descend la pile GUARDS. Pour chaque couche :
 *   'na'       la couche n'est pas concernée par cette attaque
 *   'blocked'  couche concernée et active → l'attaque s'arrête ici
 *   'bypassed' couche concernée mais retirée → l'attaque passe
 * Couches non atteintes (après un blocage) : 'unreached'.
 */
export function simulate(attack, config) {
  const trail = [];
  let blockedBy = null;
  for (const g of GUARDS) {
    if (blockedBy) {
      trail.push({ guard: g.id, status: 'unreached' });
      continue;
    }
    const text = attack.stages[g.id];
    if (!text) trail.push({ guard: g.id, status: 'na' });
    else if (config[g.id]) {
      trail.push({ guard: g.id, status: 'blocked', text });
      blockedBy = g.id;
    } else trail.push({ guard: g.id, status: 'bypassed', text });
  }
  return {
    outcome: blockedBy ? 'blocked' : 'breach',
    blockedBy,
    trail,
    observed: !!config.observe,
    // profondeur : combien de couches concernées auraient pu arrêter l'attaque
    depth: Object.keys(attack.stages).filter((id) => config[id]).length,
    total: Object.keys(attack.stages).length,
  };
}
