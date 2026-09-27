/* =============================================================================
   Module 3 — Challenge sécurité.
   Le même agent KYC, deux fois : à gauche pleinement harnaché, à droite avec
   des couches retirées (réglables). Un agent attaquant lance la même attaque
   sur les deux ; on la voit descendre la pile de défenses, s'arrêter… ou pas.
   ============================================================================= */

import { useEffect, useState } from 'react';
import { ATTACKS, ATTACKER, GUARDS, OBSERVE, STRONG, WEAK_DEFAULT, RULES, attackById, guardById } from '../data/security.js';
import { simulate } from '../engine/engine.js';
import { Rect, Circle, Line, Note, Label, Stamp, Check } from '../sketch/Sketch.jsx';
import { BotIcon, EyeIcon, DocIcon } from '../sketch/Icons.jsx';
import { C } from '../sketch/palette.js';
import { ModuleHead, Todo, SkCheck } from '../ui/Bits.jsx';

const STEP_MS = 850;
const BAND_Y = (i) => 78 + i * 82; // haut de la bande i
const BAND_H = 58;
const CORE_Y = 500;

export function SecurityChallenge() {
  const [attackId, setAttackId] = useState('injection');
  const [weak, setWeak] = useState(WEAK_DEFAULT);
  const [run, setRun] = useState(null); // { attack, strong, weak }
  const [tick, setTick] = useState(-1);

  const attack = attackById(attackId);
  const stopOf = (r) => (r.blockedBy ? GUARDS.findIndex((g) => g.id === r.blockedBy) : GUARDS.length);
  const last = run ? Math.max(stopOf(run.strong), stopOf(run.weak)) : 0;
  const finished = run && tick > last;

  // Horloge commune aux deux colonnes : une bande franchie toutes les STEP_MS
  useEffect(() => {
    if (!run || tick > last) return;
    const t = setTimeout(() => setTick((k) => k + 1), tick < 0 ? 350 : STEP_MS);
    return () => clearTimeout(t);
  }, [run, tick, last]);

  const launch = () => {
    setRun({ attack, strong: simulate(attack, STRONG), weak: simulate(attack, weak) });
    setTick(-1);
  };
  const changeWeak = (id) => {
    setWeak((w) => ({ ...w, [id]: !w[id] }));
    setRun(null);
  };
  const pickAttack = (id) => {
    setAttackId(id);
    setRun(null);
  };

  return (
    <section className="module">
      <ModuleHead
        n={3}
        title="Challenge sécurité"
        lead="Même modèle, même tâche KYC, même attaque. Seule différence : les couches du harness. À gauche, l’agent complet. À droite, un agent « prototype » dont vous choisissez les défenses."
      />

      <div className="attacker card">
        <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true" className="bot">
          <Circle cx={42} cy={44} d={74} o={{ stroke: C.red, strokeWidth: 1.4, fill: C.redSoft, fillStyle: 'hachure', hachureGap: 7 }} />
          <BotIcon x={42} y={48} s={1.1} />
        </svg>
        <div className="who-atk">
          <span className="kicker red">{ATTACKER.model}</span>
          <h3>{ATTACKER.name}</h3>
          <p>{ATTACKER.desc}</p>
        </div>
        <div className="attack-picker">
          <span className="note-font">choisissez une attaque</span>
          <div className="attack-list">
            {ATTACKS.map((a) => (
              <button key={a.id} className={'chip atk' + (a.id === attackId ? ' on' : '')} onClick={() => pickAttack(a.id)}>
                <span aria-hidden="true">{a.icon}</span> {a.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="attack-brief">
        <div className="postit">
          <span className="kicker">Objectif</span>
          <p>{attack.goal}</p>
          <span className="kicker">Charge (stylisée)</span>
          <p className="payload">{attack.payload}</p>
        </div>
        <p className="thought note-font">« {attack.thought} »</p>
        <div className="launch">
          {!run && <Todo>À faire : lancez l’attaque</Todo>}
          <button className="btn primary big" onClick={launch} disabled={run && !finished}>
            {run ? '↻ Relancer' : '⚡ Lancer l’attaque'}
          </button>
        </div>
      </div>

      <div className="duel">
        <Column title="Agent KYC harnaché" sub="toutes les couches actives" config={STRONG} locked result={run?.strong} tick={tick} run={run} stop={run && stopOf(run.strong)} />
        <Column title="Agent KYC affaibli" sub="cliquez pour retirer ou remettre une couche" config={weak} onToggle={changeWeak} result={run?.weak} tick={tick} run={run} stop={run && stopOf(run.weak)} />
      </div>

      {finished && <Verdict run={run} />}

      <Rules />
    </section>
  );
}

/* ------------------------------------------------------------------ colonne */

function Column({ title, sub, config, locked, onToggle, result, tick, run, stop }) {
  const reached = run ? Math.min(tick, stop) : -1; // bande (ou cœur = 5) atteinte par le jeton
  const over = run && tick > stop;
  const breach = over && result.outcome === 'breach';
  const tokenY = !run || tick < 0 ? 34 : reached >= GUARDS.length ? CORE_Y - 8 : BAND_Y(reached) + BAND_H / 2;

  return (
    <div className={'column card' + (locked ? ' strong' : ' weak') + (breach ? ' breached' : '')}>
      <header>
        <h3>{title}</h3>
        <p className="muted">{sub}</p>
      </header>

      <div className="toggles">
        {[...GUARDS, OBSERVE].map((g) => (
          <button key={g.id} className={'chip' + (config[g.id] ? ' on' : ' off')} disabled={locked} onClick={() => onToggle?.(g.id)} title={g.short}>
            <SkCheck on={config[g.id]} color={C.green} size={18} />
            {g.name}
          </button>
        ))}
      </div>

      <svg className="stack" viewBox="0 0 420 590" role="img" aria-label={`Pile de défenses — ${title}`}>
        {/* entrée */}
        <Note x={210} y={22} size={18} anchor="middle" color={C.red}>
          l’attaque arrive
        </Note>

        {/* observabilité : colonne pointillée sur la droite */}
        <g key={'obs' + config.observe}>
          {config.observe ? (
            <>
              <Line x1={400} y1={78} x2={400} y2={570} o={{ stroke: C.ink, strokeLineDash: [6, 7], roughness: 0.6 }} />
              <EyeIcon x={400} y={56} s={0.75} />
            </>
          ) : (
            <>
              <Line x1={400} y1={78} x2={400} y2={570} o={{ stroke: C.pencil, strokeLineDash: [2, 9], roughness: 0.6 }} />
              <EyeIcon x={400} y={56} s={0.75} c={C.pencil} />
            </>
          )}
        </g>

        {GUARDS.map((g, i) => (
          <Band key={g.id + config[g.id]} g={g} i={i} on={config[g.id]} trail={result?.trail[i]} revealed={run && tick >= i && i <= stop} />
        ))}

        {/* cœur : le dossier client et les systèmes */}
        <g key={'core' + (over ? result.outcome : '')}>
          <Rect
            x={24}
            y={CORE_Y}
            w={350}
            h={70}
            o={breach ? { stroke: C.red, strokeWidth: 2.2, fill: C.redSoft, fillStyle: 'hachure', hachureGap: 9, fillWeight: 0.8 } : { stroke: C.ink, strokeWidth: 1.8 }}
          />
          <DocIcon x={62} y={CORE_Y + 35} s={0.8} c={breach ? C.red : C.ink} />
          <Label x={90} y={CORE_Y + 28} size={13.5} anchor="start">
            Dossier client & systèmes
          </Label>
          <Note x={90} y={CORE_Y + 52} size={17} color={C.pencil}>
            ce que l’attaquant veut atteindre
          </Note>
          {breach && (
            <>
              
              <Stamp x={296} y={CORE_Y + 42} text="COMPROMIS" color={C.red} rotate={-9} />
            </>
          )}
          {over && !breach && <Check x={345} y={CORE_Y + 32} s={13} />}
        </g>

        {/* jeton de l'attaque */}
        {run && (
          <g className="token" style={{ transform: `translate(210px, ${tokenY}px)` }}>
            <Circle cx={0} cy={0} d={26} o={{ stroke: C.red, strokeWidth: 2, fill: C.red, fillStyle: 'solid', roughness: 1.4 }} />
            <text x={0} y={5} textAnchor="middle" className="token-text">
              ⚡
            </text>
          </g>
        )}
      </svg>

      <Log result={result} tick={tick} stop={stop} run={run} observed={config.observe} />
    </div>
  );
}

function Band({ g, i, on, trail, revealed }) {
  const y = BAND_Y(i);
  const st = revealed ? trail?.status : null;
  return (
    <g>
      <Rect
        x={24}
        y={y}
        w={350}
        h={BAND_H}
        o={on ? { stroke: C.ink, strokeWidth: 1.6, fill: '#cfe8d8', fillStyle: 'hachure', hachureGap: 11, fillWeight: 0.6 } : { stroke: C.pencil, strokeLineDash: [7, 6] }}
      />
      <Label x={42} y={y + 21} size={13.5} anchor="start" color={on ? C.ink : C.pencil}>
        {g.name}
      </Label>
      <Note x={42} y={y + 44} size={16} color={C.pencil}>
        {on ? g.short : 'retirée'}
      </Note>
      {st === 'blocked' && <Stamp x={300} y={y + 29} text="BLOQUÉ" color={C.green} />}
      {st === 'bypassed' && (
        <Note x={362} y={y + 24} size={20} color={C.red} anchor="end">
          ✖ passe !
        </Note>
      )}
      {st === 'na' && (
        <Note x={362} y={y + 24} size={17} color={C.pencil} anchor="end">
          non concerné
        </Note>
      )}
    </g>
  );
}

/** Journal « manuscrit » : les lignes apparaissent au rythme du jeton. */
function Log({ result, tick, stop, run, observed }) {
  if (!run) return <p className="log empty note-font">Le journal s’écrira ici pendant l’attaque.</p>;
  const lines = [];
  result.trail.forEach((t, i) => {
    if (i > Math.min(tick, stop)) return;
    const g = guardById(t.guard);
    if (t.status === 'blocked') lines.push({ c: 'ok', t: `✔ ${g.name} — ${t.text}` });
    if (t.status === 'bypassed') lines.push({ c: 'bad', t: `✖ ${g.name} retirée — l’attaque passe.` });
  });
  if (tick > stop) {
    if (result.outcome === 'breach') lines.push({ c: 'bad strong', t: `IMPACT — ${run.attack.impact}` });
    else lines.push({ c: 'ok strong', t: 'Attaque contenue. Le dossier est intact.' });
    lines.push(
      observed
        ? { c: 'ink', t: '👁 Incident tracé, alerte envoyée à la conformité.' }
        : { c: 'bad', t: '∅ Aucune trace : personne n’est prévenu.' },
    );
  }
  return (
    <ol className="log">
      {lines.map((l, k) => (
        <li key={k} className={l.c}>
          <time>+{((k + 1) * 0.85).toFixed(1).replace('.', ',')} s</time>
          <span>{l.t}</span>
        </li>
      ))}
    </ol>
  );
}

function Verdict({ run }) {
  const s = run.strong;
  const w = run.weak;
  const name = (id) => guardById(id).name.toLowerCase();
  return (
    <div className={'verdict card' + (w.outcome === 'breach' ? ' bad' : ' ok')}>
      <p className="note-font big">Même modèle. Même attaque.</p>
      <p>
        L’agent harnaché l’arrête dès la couche <b>{name(s.blockedBy)}</b>
        {s.depth > 1 && <> — et {s.depth - 1} autre{s.depth > 2 ? 's' : ''} couche{s.depth > 2 ? 's' : ''} l’aurai{s.depth > 2 ? 'ent' : 't'} encore arrêtée</>}.{' '}
        {w.outcome === 'breach' ? (
          <>
            L’agent affaibli, lui, est <b className="red">compromis</b> : aucune des couches concernées n’était en place.
          </>
        ) : (
          <>
            L’agent affaibli tient grâce à la couche <b>{name(w.blockedBy)}</b> — il suffit d’une couche bien placée, mais c’est la seule qui le sépare de l’incident.
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ règles */

function Rules() {
  return (
    <section className="rules">
      <h2>Comment utiliser un modèle abliterated sans qu’il dérive</h2>
      <p className="lead">
        Un modèle abliterated a perdu sa capacité à refuser. Il reste précieux — analyse de fraude, typologies de blanchiment, tests de vos propres défenses — à
        condition que toute la maîtrise vienne du harness.
      </p>
      <ol className="rule-grid">
        {RULES.map((r, i) => (
          <li key={r.title} className="card rule">
            <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
              <Circle cx={19} cy={19} d={32} o={{ stroke: C.blue, strokeWidth: 1.6 }} />
              <text x={19} y={25} textAnchor="middle" className="rule-num">
                {i + 1}
              </text>
            </svg>
            <div>
              <h4>{r.title}</h4>
              <p>{r.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
