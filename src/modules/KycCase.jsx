/* =============================================================================
   Module 2 — Cas d'usage concret : l'Assistant KYC Light.
   Graphe LangGraph dessiné à la main, exécution pas à pas (« Étape suivante »),
   un petit document voyage d'un nœud à l'autre et la fiche « État » se remplit.
   Couleurs : bleu = le LLM propose · noir = le harness contrôle · ambre = l'humain.
   ============================================================================= */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NODES, EDGES, CASES, STATE_FIELDS, nodeById, edgeKey } from '../data/kyc.js';
import { kycSteps, stateAt } from '../engine/engine.js';
import { Rect, Poly, Circle, Arrow, Note, Label, Highlight, arrowPath } from '../sketch/Sketch.jsx';
import { DocIcon, LockIcon, PersonIcon, BrainIcon } from '../sketch/Icons.jsx';
import { C } from '../sketch/palette.js';
import { ModuleHead, Todo, Legend } from '../ui/Bits.jsx';

const W = 1000;
const VY = 60; // cadrage vertical du schéma (le graphe occupe y 60 → 500)
const VH = 440;
const NW = 132; // largeur d'un nœud
const NH = 64; // hauteur d'un nœud
const TRAVEL_MS = 850;

export function KycCase() {
  const [caseId, setCaseId] = useState('complet');
  const [i, setI] = useState(-1);
  const [decision, setDecision] = useState(null);
  const [auto, setAuto] = useState(false);
  const [card, setCard] = useState(null);

  const steps = kycSteps(caseId, decision);
  const step = steps[i];
  const { state, changed } = stateAt(steps, i);
  const waiting = !!step?.interrupt && !decision;
  const done = i === steps.length - 1 && step?.node === 'fin';
  const canNext = !waiting && !done;

  const visited = new Set(steps.slice(0, i + 1).map((s) => s.node));
  const traversed = new Set(steps.slice(1, i + 1).map((s, k) => `${steps[k].node}>${s.node}`));
  const liveEdge = i > 0 ? `${steps[i - 1].node}>${step.node}` : null;

  const next = () => canNext && setI((k) => k + 1);
  const reset = (id = caseId) => {
    setCaseId(id);
    setI(-1);
    setDecision(null);
    setAuto(false);
    setCard(null);
  };
  const decide = (d) => {
    setDecision(d);
    setTimeout(() => setI((k) => k + 1), 350);
  };

  // Lecture automatique : une étape toutes les 1,8 s, pause sur l'interruption humaine
  useEffect(() => {
    if (!auto || !canNext) return;
    const t = setTimeout(next, i < 0 ? 300 : 1800);
    return () => clearTimeout(t);
  });
  useEffect(() => {
    if (done) setAuto(false);
  }, [done]);

  return (
    <section className="module">
      <ModuleHead
        n={2}
        title="Cas d’usage : l’Assistant KYC Light"
        lead="Un agent reçoit la pièce d’un nouveau client. Il doit extraire les informations clés, repérer ce qui manque, et décider s’il faut faire intervenir un humain. Suivez un dossier, étape par étape."
      />

      <div className="cases">
        {CASES.map((c) => (
          <button key={c.id} className={'folder' + (c.id === caseId ? ' on' : '')} onClick={() => reset(c.id)}>
            <span className="tab" />
            <b>{c.name}</b>
            <span>{c.client}</span>
            <small className="note-font">{c.blurb}</small>
          </button>
        ))}
      </div>

      <div className="controls">
        <button className="btn primary" onClick={next} disabled={!canNext}>
          {i < 0 ? 'Démarrer' : 'Étape suivante'} →
        </button>
        <button className="btn" onClick={() => setAuto((a) => !a)} disabled={!canNext && !auto}>
          {auto ? '❚❚ Pause' : '▶ Lecture auto'}
        </button>
        <button className="btn ghost" onClick={() => reset()} disabled={i < 0}>
          ↺ Recommencer
        </button>
        <span className="progress note-font">{i < 0 ? 'prêt' : done ? 'terminé ✓' : `étape ${i + 1}`}</span>
        <Legend
          items={[
            [C.blue, 'le LLM propose'],
            [C.ink, 'le harness contrôle'],
            [C.amber, 'un humain décide'],
          ]}
        />
      </div>

      <div className="kyc">
        <div className="graph-wrap">
          {i < 0 && <Todo>Cliquez « Démarrer », puis « Étape suivante »</Todo>}
          <svg className="graph" viewBox={`0 ${VY} ${W} ${VH}`} role="img" aria-label="Graphe LangGraph de l’assistant KYC">
            {EDGES.map((e) => (
              <Edge key={edgeKey(e)} e={e} state={liveEdge === edgeKey(e) ? 'live' : traversed.has(edgeKey(e)) ? 'done' : 'idle'} />
            ))}
            {NODES.map((n) => (
              <Node key={n.id} n={n} current={step?.node === n.id} visited={visited.has(n.id)} waiting={waiting && step?.node === n.id} onClick={() => setCard(card === n.id ? null : n.id)} />
            ))}
            {liveEdge && <Token key={liveEdge + i} d={edgeD(EDGES.find((e) => edgeKey(e) === liveEdge))} />}
            {i === 0 && <Token key="start" d={`M ${nodeById('start').x} ${nodeById('start').y - 60} L ${nodeById('start').x} ${nodeById('start').y}`} />}
          </svg>
          {card && <NodeCard n={nodeById(card)} onClose={() => setCard(null)} />}
          <p className="caption note-font">Cliquez sur un nœud pour savoir ce qui s’y passe.</p>
        </div>

        <aside className="kyc-cards">
          <StepCard step={step} i={i} waiting={waiting} done={done} onDecide={decide} />
          <StateSheet state={state} changed={changed} />
        </aside>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ géométrie */

/** Point de bord d'un nœud dans la direction (dx, dy) : les flèches partent du contour. */
function border(n, dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const hw = n.shape === 'diamond' ? 52 : n.kind === 'io' ? 40 : NW / 2 + 4;
  const hh = n.shape === 'diamond' ? 38 : n.kind === 'io' ? 40 : NH / 2 + 4;
  const t = Math.min(hw / Math.abs(ux || 1e-6), hh / Math.abs(uy || 1e-6));
  return [n.x + ux * t, n.y + uy * t];
}

function edgeEnds(e) {
  const a = nodeById(e.from);
  const b = nodeById(e.to);
  return [border(a, b.x - a.x, b.y - a.y), border(b, a.x - b.x, a.y - b.y)];
}

const edgeD = (e) => {
  const [p, q] = edgeEnds(e);
  return arrowPath(p, q, e.bend || 0);
};

/* ------------------------------------------------------------------ arêtes */

function Edge({ e, state }) {
  const [p, q] = edgeEnds(e);
  const color = state === 'idle' ? C.pencil : state === 'live' ? C.blue : C.ink;
  const w = state === 'idle' ? 1.3 : 2;
  // position approximative du milieu de la courbe, pour l'étiquette
  const d = arrowPath(p, q, e.bend || 0);
  const [, , cx, cy] = d.match(/-?\d+(\.\d+)?/g).map(Number);
  const mx = (p[0] + 2 * cx + q[0]) / 4;
  const my = (p[1] + 2 * cy + q[1]) / 4;
  return (
    <g key={state}>
      <Arrow from={p} to={q} bend={e.bend || 0} o={{ stroke: color, strokeWidth: w }} draw={state === 'live'} />
      {e.label && (
        <Note
          x={e.from === 'routeur' && e.to === 'complement' ? mx - 10 : mx + 6}
          y={my - 6}
          size={20}
          color={state === 'idle' ? C.pencil : C.ink}
          anchor={e.from === 'routeur' && e.to === 'complement' ? 'end' : 'middle'}
        >
          {e.label}
        </Note>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ nœuds */

const KIND = {
  llm: { stroke: C.blue, fill: C.blueSoft, text: C.blue, tag: 'LLM' },
  harness: { stroke: C.ink, fill: null, text: C.ink, tag: 'harness' },
  human: { stroke: C.amber, fill: C.amberSoft, text: '#9a5f0e', tag: 'humain' },
  io: { stroke: C.ink, fill: null, text: C.ink, tag: '' },
};

function Node({ n, current, visited, waiting, onClick }) {
  const k = KIND[n.kind];
  const sw = current ? 2.6 : 1.7;
  const o = { stroke: k.stroke, strokeWidth: sw, ...(k.fill ? { fill: k.fill, fillStyle: 'hachure', hachureGap: 9, fillWeight: 0.8 } : {}) };
  return (
    <g className={'node hit' + (waiting ? ' waiting' : '')} onClick={onClick} role="button" aria-label={n.name.replace('\n', ' ')}>
      {current && <Highlight x={n.x - NW / 2 - 12} y={n.y - NH / 2 - 12} w={NW + 24} h={NH + 24} />}
      {n.kind === 'io' ? (
        <>
          <Circle cx={n.x} cy={n.y} d={78} o={{ stroke: C.ink, strokeWidth: sw }} />
          {n.id === 'fin' && <Circle cx={n.x} cy={n.y} d={66} o={{ stroke: C.ink, strokeWidth: 1.2 }} />}
          <Label x={n.x} y={n.y} size={13.5}>
            {n.name}
          </Label>
        </>
      ) : n.shape === 'diamond' ? (
        <>
          <Poly points={[[n.x, n.y - 40], [n.x + 56, n.y], [n.x, n.y + 40], [n.x - 56, n.y]]} o={o} />
          <Label x={n.x} y={n.y} size={13} color={k.text}>
            {n.name}
          </Label>
          <LockIcon x={n.x + 40} y={n.y - 34} s={0.6} />
        </>
      ) : (
        <>
          <Rect x={n.x - NW / 2} y={n.y - NH / 2} w={NW} h={NH} o={o} />
          {k.fill && <rect x={n.x - NW / 2 + 12} y={n.y - 19} width={NW - 24} height={38} rx={6} fill={C.paper} opacity={0.92} />}
          <Label x={n.x} y={n.y + 1} size={14.5} color={k.text} weight={current ? 600 : 500}>
            {n.name}
          </Label>
          {n.kind === 'harness' && <LockIcon x={n.x + NW / 2 - 12} y={n.y - NH / 2 - 4} s={0.6} />}
          {n.kind === 'llm' && <BrainIcon x={n.x + NW / 2 - 12} y={n.y - NH / 2 - 2} s={0.5} />}
          {n.kind === 'human' && <PersonIcon x={n.x + NW / 2 - 12} y={n.y - NH / 2 - 4} s={0.55} c={C.amber} />}
        </>
      )}
      {visited && !current && n.kind !== 'io' && <circle cx={n.x - NW / 2 + 8} cy={n.y - NH / 2 + 8} r={3.5} fill={C.green} />}
    </g>
  );
}

/** Le document qui voyage le long de l'arête active. */
function Token({ d }) {
  const path = useRef();
  const g = useRef();
  useLayoutEffect(() => {
    const p = path.current;
    const len = p.getTotalLength();
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / TRAVEL_MS);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const pt = p.getPointAtLength(len * e);
      g.current?.setAttribute('transform', `translate(${pt.x} ${pt.y - 4})`);
      if (k < 1) raf = requestAnimationFrame(tick);
      else g.current?.setAttribute('opacity', '0');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d]);
  return (
    <g pointerEvents="none">
      <path ref={path} d={d} fill="none" stroke="none" />
      <g ref={g}>
        <rect x={-13} y={-16} width={26} height={32} fill={C.paper} />
        <DocIcon x={0} y={0} s={0.7} c={C.blue} />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ fiches */

function NodeCard({ n, onClose }) {
  const k = KIND[n.kind];
  const left = (n.x / W) * 100;
  const top = ((n.y - VY) / VH) * 100;
  const flip = n.x > W * 0.6;
  const below = n.y < VY + VH / 2;
  return (
    <div
      className={'node-card card' + (flip ? ' flip' : '') + (below ? ' below' : ' above')}
      style={{ left: `${left}%`, top: `${top}%` }}
      role="dialog"
      aria-label={n.name.replace('\n', ' ')}
    >
      <button className="x" onClick={onClose} aria-label="Fermer">
        ×
      </button>
      <span className="kicker" style={{ color: k.text }}>
        {k.tag || 'graphe'} · {n.component}
      </span>
      <h3>{n.name.replace('\n', ' ')}</h3>
      <p>{n.what}</p>
      <div className="who">
        <div className="llm">
          <b>🧠 Le LLM décide</b>
          <p>{n.llm || '— rien : cette étape est du code.'}</p>
        </div>
        <div className="harness">
          <b>🔒 Le harness contrôle</b>
          <p>{n.harness}</p>
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, i, waiting, done, onDecide }) {
  if (!step)
    return (
      <div className="card soft">
        <span className="kicker">Exécution</span>
        <p className="note-font big">Choisissez un dossier, puis cliquez « Démarrer ».</p>
        <p>À chaque étape, vous verrez ce que le modèle décide et ce que le harness contrôle.</p>
      </div>
    );
  const n = nodeById(step.node);
  return (
    <div className="card step-card" key={i}>
      <span className="kicker">
        Étape {i + 1} · {n.component}
      </span>
      <h3>{n.name.replace('\n', ' ')}</h3>
      <p>{step.note || n.what}</p>
      <div className="who">
        <div className="llm">
          <b>🧠 Le LLM</b>
          <p>{n.llm || 'N’intervient pas : du code s’en charge.'}</p>
        </div>
        <div className="harness">
          <b>🔒 Le harness</b>
          <p>{n.harness}</p>
        </div>
      </div>
      {waiting && (
        <div className="decide">
          <p className="note-font big">À vous : vous êtes le responsable conformité.</p>
          <div className="row">
            <button className="btn primary" onClick={() => onDecide('approve')}>
              Accepter sous vigilance
            </button>
            <button className="btn danger" onClick={() => onDecide('reject')}>
              Refuser
            </button>
          </div>
        </div>
      )}
      {done && <p className="note-font done">Dossier traité. Toute la trace est archivée.</p>}
    </div>
  );
}

function StateSheet({ state, changed }) {
  return (
    <div className="card sheet">
      <span className="kicker">État (State) · la fiche qui circule</span>
      <dl>
        {STATE_FIELDS.map(([k, label]) => (
          <div key={k} className={(state[k] ? '' : 'empty ') + (changed.includes(k) ? 'changed' : '')}>
            <dt>{label}</dt>
            <dd>
              <span key={state[k]}>{state[k] || '—'}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
