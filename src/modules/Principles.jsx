/* =============================================================================
   Module 1 — Les principes du harnessing.
   Un schéma central : la demande entre, traverse le LLM, la réponse sort.
   Autour, cinq couches que l'on active ou retire. Une couche retirée passe
   au crayon gris, barrée, et son risque s'écrit au feutre rouge.
   ============================================================================= */

import { useState } from 'react';
import { LAYERS, allOn, allOff, harnessTitle } from '../data/layers.js';
import { Rect, Ellipse, Circle, Arrow, Cross, Note, Label, Highlight } from '../sketch/Sketch.jsx';
import { DocIcon, ShieldIcon, BrainIcon, NotebookIcon, ToolIcon, PersonIcon, EyeIcon } from '../sketch/Icons.jsx';
import { C } from '../sketch/palette.js';
import { ModuleHead, Todo, SkCheck } from '../ui/Bits.jsx';

export function Principles() {
  const [layers, setLayers] = useState(allOn);
  const [focus, setFocus] = useState(null);
  const head = harnessTitle(layers);
  const count = Object.values(layers).filter(Boolean).length;

  const toggle = (id) => {
    setLayers((l) => ({ ...l, [id]: !l[id] }));
    setFocus(id);
  };

  return (
    <section className="module">
      <ModuleHead
        n={1}
        title="Les principes du harnessing"
        lead="Harnacher un agent, c’est entourer un modèle de langage de structures qui le rendent fiable : il garde sa capacité à raisonner, mais chaque action passe par des règles, des contrôles et des personnes."
      />

      <div className="principles">
        <div className="diagram-wrap">
          <div className="diagram-head">
            <div>
              <h2 key={head.title} className="swap">
                {head.title}
              </h2>
              <p className="muted">{head.sub}</p>
            </div>
            <Meter value={count} max={LAYERS.length} />
          </div>
          <Diagram layers={layers} focus={focus} onPick={setFocus} />
          <p className="caption note-font">Cliquez sur un élément du schéma pour le détailler.</p>
        </div>

        <aside className="side">
          <Todo>À faire : retirez une couche et regardez le risque apparaître</Todo>
          <div className="seg">
            <button className={count === 0 ? 'on' : ''} onClick={() => (setLayers(allOff()), setFocus(null))}>
              LLM brut
            </button>
            <button className={count === LAYERS.length ? 'on' : ''} onClick={() => (setLayers(allOn()), setFocus(null))}>
              Agent harnaché
            </button>
          </div>

          <ul className="layer-list">
            {LAYERS.map((l) => (
              <li key={l.id}>
                <button className={'layer-row' + (focus === l.id ? ' focus' : '') + (layers[l.id] ? '' : ' off')} onClick={() => toggle(l.id)} aria-pressed={layers[l.id]}>
                  <SkCheck on={layers[l.id]} color={C.green} />
                  <span>
                    <b>
                      {l.n}. {l.name}
                    </b>
                    <small>{l.short}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <LayerCard layer={LAYERS.find((l) => l.id === focus)} on={focus ? layers[focus] : true} />
        </aside>
      </div>
    </section>
  );
}

/** Jauge de maîtrise dessinée : une case par couche. */
function Meter({ value, max }) {
  return (
    <div className="meter" aria-label={`Maîtrise : ${value} sur ${max}`}>
      <span className="note-font">maîtrise</span>
      <svg width={max * 22 + 4} height="26" viewBox={`0 0 ${max * 22 + 4} 26`}>
        {Array.from({ length: max }, (_, i) => (
          <Rect
            key={i + (i < value ? 'on' : 'off')}
            x={3 + i * 22}
            y={4}
            w={17}
            h={17}
            o={i < value ? { stroke: C.ink, fill: C.green, fillStyle: 'hachure', hachureGap: 3 } : { stroke: C.pencil }}
          />
        ))}
      </svg>
    </div>
  );
}

function LayerCard({ layer, on }) {
  if (!layer)
    return (
      <div className="card soft">
        <p className="note-font big">Le modèle ne change pas d’une configuration à l’autre.</p>
        <p>Ce qui change, c’est tout ce qui l’entoure : ce qu’il voit, ce qu’il peut faire, qui vérifie, qui signe, qui trace.</p>
      </div>
    );
  return (
    <div className={'card layer-card' + (on ? '' : ' risk')} key={layer.id + on}>
      <span className="kicker">
        Couche {layer.n} · {on ? 'active' : 'retirée'}
      </span>
      <h3>{layer.name}</h3>
      {on ? (
        <p>
          <b>Ce qu’elle apporte.</b> {layer.gives}
        </p>
      ) : (
        <p className="risk-text">
          <b>Sans elle :</b> {layer.risk}
        </p>
      )}
      <p className="analogy">
        <span className="note-font">en langage bancaire —</span> {layer.analogy}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ schéma */

const INK = { stroke: C.ink };
const OFF = { stroke: C.pencil, strokeLineDash: [6, 6] };

function Diagram({ layers, focus, onPick }) {
  const L = layers;
  const pick = (id) => () => onPick(id);
  const riskOf = (id) => LAYERS.find((l) => l.id === id).riskShort;

  return (
    <svg className="diagram" viewBox="0 0 960 600" role="img" aria-label="Schéma du harness autour d’un LLM">
      {/* --- surlignage de l'élément inspecté */}
      {focus === 'memory' && <Highlight x={80} y={418} w={232} h={108} />}
      {focus === 'tools' && <Highlight x={640} y={428} w={296} h={130} />}
      {focus === 'human' && <Highlight x={556} y={352} w={88} h={100} />}
      {focus === 'observe' && <Highlight x={38} y={52} w={330} h={38} />}
      {focus === 'guards' && (
        <>
          <Highlight x={186} y={205} w={48} h={152} />
          <Highlight x={716} y={205} w={48} h={152} />
        </>
      )}

      {/* --- 5 · observabilité : un cadre pointillé autour de tout le système */}
      <g className="hit" onClick={pick('observe')} key={'obs' + L.observe}>
        {L.observe ? (
          <>
            <Rect x={24} y={36} w={912} h={548} o={{ stroke: C.ink, strokeWidth: 1.1, strokeLineDash: [9, 8], roughness: 0.7 }} draw />
            <EyeIcon x={66} y={71} />
            <Note x={96} y={79} size={24}>
              tout est tracé, daté, rejouable
            </Note>
          </>
        ) : (
          <>
            <EyeIcon x={66} y={71} c={C.pencil} />
            <Cross x={66} y={71} s={14} />
            <Note x={96} y={79} size={24} color={C.red}>
              {riskOf('observe').replace('\n', ' ')}
            </Note>
          </>
        )}
      </g>

      {/* --- flux principal : demande → garde-fou → LLM → garde-fou → réponse */}
      <DocIcon x={78} y={280} />
      <Label x={78} y={328} size={16}>
        Demande
      </Label>
      <Note x={78} y={352} size={20} anchor="middle" color={C.pencil}>
        + pièce jointe
      </Note>

      <Arrow from={[106, 280]} to={[190, 280]} />
      <Arrow from={[232, 280]} to={[355, 280]} />
      <Arrow from={[597, 280]} to={[716, 280]} />
      <Arrow from={[764, 280]} to={[850, 280]} />

      <Gate x={210} on={L.guards} onClick={pick('guards')} label={'garde-fou\nd’entrée'} risk={'instructions cachées\nexécutées'} />
      <Gate x={740} on={L.guards} onClick={pick('guards')} label={'garde-fou\nde sortie'} risk={'données sensibles\nqui sortent'} />

      <g>
        <Ellipse cx={476} cy={280} w={236} h={142} o={{ stroke: C.blue, strokeWidth: 2, fill: C.blueSoft, fillStyle: 'hachure', hachureGap: 10 }} />
        <BrainIcon x={476} y={258} />
        <Label x={476} y={298} size={20} weight={600} color={C.blue}>
          LLM
        </Label>
        <Note x={476} y={328} size={21} anchor="middle" color={C.blue}>
          raisonne et propose
        </Note>
      </g>

      <DocIcon x={880} y={280} />
      <Label x={880} y={328} size={16}>
        Réponse
      </Label>

      {/* --- 1 · état & mémoire */}
      <g className="hit" onClick={pick('memory')} key={'mem' + L.memory}>
        <Rect x={90} y={428} w={212} h={88} o={L.memory ? INK : OFF} draw={L.memory} />
        <NotebookIcon x={128} y={472} c={L.memory ? C.ink : C.pencil} />
        <Label x={222} y={456} size={16} color={L.memory ? C.ink : C.pencil}>
          État & mémoire
        </Label>
        <Note x={222} y={488} size={20} anchor="middle" color={L.memory ? C.ink : C.pencil}>
          dossier + historique
        </Note>
        {L.memory ? (
          <>
            <Arrow from={[392, 340]} to={[276, 424]} bend={12} />
            <Arrow from={[292, 432]} to={[406, 348]} bend={12} />
          </>
        ) : (
          <>
            <Cross x={196} y={472} s={20} />
            <Note x={92} y={546} size={22} color={C.red}>
              {riskOf('memory')}
            </Note>
          </>
        )}
      </g>

      {/* --- 4 · humain dans la boucle (point de passage vers les outils) */}
      <g className="hit" onClick={pick('human')} key={'hum' + L.human}>
        {L.human ? (
          <>
            <Arrow from={[548, 340]} to={[574, 368]} />
            <Circle cx={600} cy={397} d={64} o={{ stroke: C.amber, strokeWidth: 1.8, fill: C.amberSoft, fillStyle: 'hachure', hachureGap: 6 }} draw />
            <PersonIcon x={600} y={400} c={C.amber} />
            <Label x={600} y={443} size={15} color={C.amber}>
              Conseiller
            </Label>
            <Arrow from={[628, 420]} to={[650, 448]} o={{ stroke: C.amber }} />
            <Note x={430} y={470} size={21} color={C.amber} anchor="middle">
              {'signe les actions\nsensibles'}
            </Note>
          </>
        ) : (
          <>
            <PersonIcon x={600} y={400} c={C.pencil} />
            <Cross x={600} y={400} s={16} />
            <Arrow from={[540, 344]} to={[650, 452]} bend={-22} o={{ stroke: C.red, strokeWidth: 2 }} draw />
            <Note x={350} y={470} size={21} color={C.red}>
              {riskOf('human')}
            </Note>
          </>
        )}
      </g>

      {/* --- 2 · outils & permissions */}
      <g className="hit" onClick={pick('tools')} key={'tools' + L.tools}>
        <Rect x={650} y={440} w={276} h={108} o={L.tools ? INK : { stroke: C.red, strokeWidth: 1.8 }} draw />
        <ToolIcon x={674} y={468} c={L.tools ? C.ink : C.red} />
        {L.tools ? (
          <>
            <Label x={698} y={464} size={15} anchor="start">
              lire_dossier · lecture seule
            </Label>
            <Label x={698} y={490} size={15} anchor="start">
              brouillon_email · interne
            </Label>
            <Label x={698} y={516} size={15} anchor="start">
              maj_statut · 🔒 signature
            </Label>
          </>
        ) : (
          <>
            <Label x={698} y={464} size={15} anchor="start" color={C.red}>
              base clients complète
            </Label>
            <Label x={698} y={490} size={15} anchor="start" color={C.red}>
              e-mail vers n’importe qui
            </Label>
            <Label x={698} y={516} size={15} anchor="start" color={C.red}>
              écriture directe des statuts
            </Label>
            <Note x={652} y={574} size={22} color={C.red}>
              {riskOf('tools').replace('\n', ' ')}
            </Note>
          </>
        )}
      </g>
    </svg>
  );
}

/** Porte de garde-fou : barrière hachurée verte, ou tracé au crayon barré. */
function Gate({ x, on, onClick, label, risk }) {
  return (
    <g className="hit" onClick={onClick} key={'gate' + x + on}>
      {on ? (
        <>
          <Rect x={x - 15} y={215} w={30} h={130} o={{ stroke: C.ink, fill: C.greenSoft, fillStyle: 'hachure', hachureGap: 5 }} draw />
          <ShieldIcon x={x} y={195} c={C.green} fill={C.greenSoft} />
        </>
      ) : (
        <>
          <Rect x={x - 15} y={215} w={30} h={130} o={OFF} />
          <Cross x={x} y={280} s={16} />
          <Note x={x} y={164} size={21} anchor="middle" color={C.red}>
            {risk}
          </Note>
        </>
      )}
      <Label x={x} y={380} size={15} color={on ? C.ink : C.pencil}>
        {label}
      </Label>
    </g>
  );
}
