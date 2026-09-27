/* Tests du moteur : node tests/engine.test.mjs */
import assert from 'node:assert/strict';
import { CASES, NODES, EDGES } from '../src/data/kyc.js';
import { ATTACKS, GUARDS, STRONG, WEAK_DEFAULT } from '../src/data/security.js';
import { LAYERS } from '../src/data/layers.js';
import { kycSteps, stateAt, simulate } from '../src/engine/engine.js';

let n = 0;
const test = (name, fn) => {
  fn();
  n++;
  console.log('  ✓', name);
};

const nodeIds = new Set(NODES.map((x) => x.id));
const edges = new Set(EDGES.map((e) => `${e.from}>${e.to}`));
const guardIds = new Set(GUARDS.map((g) => g.id));

test('module 1 : cinq couches, chacune avec un risque et une analogie', () => {
  assert.equal(LAYERS.length, 5);
  for (const l of LAYERS) assert.ok(l.risk && l.analogy && l.gives, l.id);
});

test('module 2 : les arêtes relient des nœuds existants', () => {
  for (const e of EDGES) assert.ok(nodeIds.has(e.from) && nodeIds.has(e.to), `${e.from}>${e.to}`);
});

test('module 2 : chaque parcours suit des arêtes du graphe et finit sur « fin »', () => {
  for (const c of CASES) {
    const variants = c.branches ? Object.keys(c.branches) : [null];
    for (const d of variants) {
      const steps = kycSteps(c.id, d);
      for (let i = 1; i < steps.length; i++) assert.ok(edges.has(`${steps[i - 1].node}>${steps[i].node}`), `${c.id}/${d} : ${steps[i - 1].node}>${steps[i].node}`);
      assert.equal(steps.at(-1).node, 'fin', `${c.id}/${d}`);
    }
  }
});

test('module 2 : le cas sensible s’arrête sur la revue humaine tant qu’on n’a pas décidé', () => {
  const steps = kycSteps('sensible');
  assert.equal(steps.at(-1).node, 'humain');
  assert.ok(steps.at(-1).interrupt);
});

test('module 2 : l’état se cumule étape après étape', () => {
  const steps = kycSteps('complet');
  const { state, changed } = stateAt(steps, 2);
  assert.ok(state.document && state.identite);
  assert.ok(!state.decision);
  assert.deepEqual(changed.sort(), ['adresse', 'fonds', 'identite']);
});

test('module 3 : chaque attaque vise au moins deux couches existantes (défense en profondeur)', () => {
  for (const a of ATTACKS) {
    const ids = Object.keys(a.stages);
    assert.ok(ids.length >= 2, a.id);
    for (const id of ids) assert.ok(guardIds.has(id), `${a.id} → ${id}`);
  }
});

test('module 3 : l’agent harnaché bloque toutes les attaques', () => {
  for (const a of ATTACKS) assert.equal(simulate(a, STRONG).outcome, 'blocked', a.id);
});

test('module 3 : retirer une seule couche ne suffit jamais', () => {
  for (const a of ATTACKS)
    for (const g of GUARDS) assert.equal(simulate(a, { ...STRONG, [g.id]: false }).outcome, 'blocked', `${a.id} sans ${g.id}`);
});

test('module 3 : le prototype affaibli laisse passer injection et extraction, l’humain arrête le reste', () => {
  const r = Object.fromEntries(ATTACKS.map((a) => [a.id, simulate(a, WEAK_DEFAULT)]));
  assert.equal(r.injection.outcome, 'breach');
  assert.equal(r.exfiltration.outcome, 'breach');
  assert.equal(r.toolabuse.blockedBy, 'humain');
  assert.equal(r.jailbreak.blockedBy, 'humain');
});

test('module 3 : la trace couvre toute la pile, rien après un blocage', () => {
  const r = simulate(ATTACKS[0], STRONG);
  assert.equal(r.trail.length, GUARDS.length);
  const i = r.trail.findIndex((t) => t.status === 'blocked');
  assert.ok(r.trail.slice(i + 1).every((t) => t.status === 'unreached'));
});

console.log(`\n${n} tests réussis.`);
