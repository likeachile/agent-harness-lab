/* =============================================================================
   Primitives « dessinées à la main » pour SVG, construites sur rough.js.

   - Les tracés sont générés par rough.generator() puis rendus en <path> React :
     pas de manipulation du DOM, compatible avec le rendu déclaratif.
   - Chaque forme reçoit une graine stable (dérivée de ses paramètres) :
     le trait tremble joliment mais ne « danse » pas à chaque rendu.
   - `draw` : le trait apparaît comme tracé au crayon (animation CSS).
   ============================================================================= */

import { useMemo } from 'react';
import rough from 'roughjs';
import { C } from './palette.js';

const gen = rough.generator();

const BASE = {
  roughness: 1.15,
  bowing: 0.9,
  stroke: C.ink,
  strokeWidth: 1.6,
  fillStyle: 'hachure',
  hachureGap: 6,
  hachureAngle: -41,
  fillWeight: 1.1,
  preserveVertices: true,
};

/** Hachage déterministe → graine rough.js stable pour une forme donnée. */
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (Math.abs(h) % 2 ** 31) + 1;
}

const cache = new Map();
function pathsFor(kind, args, opts) {
  const key = kind + JSON.stringify(args) + JSON.stringify(opts);
  let p = cache.get(key);
  if (!p) {
    const o = { ...BASE, ...opts, seed: opts.seed ?? seedOf(key) };
    p = gen.toPaths(gen[kind](...args, o));
    if (cache.size > 2000) cache.clear();
    cache.set(key, p);
  }
  return p;
}

/** Forme générique : kind = rectangle | ellipse | circle | line | linearPath | polygon | curve | path */
export function Sk({ kind, args, o = {}, draw = false, className = '', style, delay = 0 }) {
  const paths = useMemo(() => pathsFor(kind, args, o), [kind, JSON.stringify(args), JSON.stringify(o)]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <g className={className} style={style}>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
          fill={p.fill || 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={draw ? 1 : undefined}
          className={draw ? 'draw' : undefined}
          style={draw ? { animationDelay: `${delay}s` } : undefined}
        />
      ))}
    </g>
  );
}

export const Rect = ({ x, y, w, h, ...p }) => <Sk kind="rectangle" args={[x, y, w, h]} {...p} />;
export const Ellipse = ({ cx, cy, w, h, ...p }) => <Sk kind="ellipse" args={[cx, cy, w, h]} {...p} />;
export const Circle = ({ cx, cy, d, ...p }) => <Sk kind="circle" args={[cx, cy, d]} {...p} />;
export const Line = ({ x1, y1, x2, y2, ...p }) => <Sk kind="line" args={[x1, y1, x2, y2]} {...p} />;
export const Poly = ({ points, ...p }) => <Sk kind="polygon" args={[points]} {...p} />;
export const Path = ({ d, ...p }) => <Sk kind="path" args={[d]} {...p} />;

/* ------------------------------------------------------------------ flèches */

/**
 * Chemin d'une flèche courbe de `a` vers `b`. `bend` décale le point de contrôle
 * perpendiculairement (en px) : 0 = droite. Renvoie le « d » SVG (réutilisable
 * pour faire voyager un jeton le long de la flèche).
 */
export function arrowPath([x1, y1], [x2, y2], bend = 0) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - (dy / len) * bend;
  const cy = my + (dx / len) * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

/** Pointe de flèche : deux traits à ±26° de la tangente d'arrivée. */
function headPoints(d, size = 11) {
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number);
  const [cx, cy, x2, y2] = n.slice(-4);
  const a = Math.atan2(y2 - cy, x2 - cx);
  const s = 0.45;
  return [
    [x2 - size * Math.cos(a - s), y2 - size * Math.sin(a - s)],
    [x2, y2],
    [x2 - size * Math.cos(a + s), y2 - size * Math.sin(a + s)],
  ];
}

export function Arrow({ from, to, bend = 0, o = {}, draw, delay, className, head = true }) {
  const d = arrowPath(from, to, bend);
  return (
    <g className={className}>
      <Path d={d} o={{ roughness: 0.9, bowing: 0.4, ...o }} draw={draw} delay={delay} />
      {head && <Sk kind="linearPath" args={[headPoints(d)]} o={{ roughness: 0.6, ...o }} draw={draw} delay={delay ? delay + 0.3 : 0.3} />}
    </g>
  );
}

/* ------------------------------------------------------------------ marques */

/** Croix au feutre (bloqué / supprimé). */
export function Cross({ x, y, s = 18, color = C.red, w = 2.6, draw = true }) {
  return (
    <g>
      <Line x1={x - s} y1={y - s} x2={x + s} y2={y + s} o={{ stroke: color, strokeWidth: w, roughness: 1.6 }} draw={draw} />
      <Line x1={x + s} y1={y - s} x2={x - s} y2={y + s} o={{ stroke: color, strokeWidth: w, roughness: 1.6 }} draw={draw} delay={0.15} />
    </g>
  );
}

/** Coche au feutre. */
export function Check({ x, y, s = 14, color = C.green, w = 2.6, draw = true }) {
  return <Sk kind="linearPath" args={[[[x - s, y], [x - s * 0.3, y + s * 0.7], [x + s, y - s * 0.8]]]} o={{ stroke: color, strokeWidth: w, roughness: 1.2 }} draw={draw} />;
}

/** Gribouillis de rature, sur une largeur donnée. */
export function Scribble({ x, y, w, h = 14, color = C.red }) {
  const pts = [];
  const n = Math.max(4, Math.round(w / 14));
  for (let i = 0; i <= n; i++) pts.push([x + (w * i) / n, y + (i % 2 ? h : -h) / 2]);
  return <Sk kind="curve" args={[pts]} o={{ stroke: color, strokeWidth: 2, roughness: 1.4 }} draw />;
}

/** Tampon encré incliné (« BLOQUÉ », « COMPROMIS »…). */
export function Stamp({ x, y, text, color = C.green, rotate = -8, w }) {
  const width = w ?? text.length * 11 + 28;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} className="stamp">
      <Rect x={-width / 2} y={-17} w={width} h={34} o={{ stroke: color, strokeWidth: 2.2, roughness: 1.5 }} />
      <text x={0} y={6} textAnchor="middle" className="stamp-text" fill={color}>
        {text}
      </text>
    </g>
  );
}

/** Surlignage au marqueur jaune derrière une zone de texte. */
export function Highlight({ x, y, w, h = 16, color = C.yellow }) {
  return <Rect x={x} y={y} w={w} h={h} o={{ stroke: 'none', fill: color, fillStyle: 'solid', roughness: 2 }} className="hl" />;
}

/** Texte manuscrit (Caveat) — annotations dans les schémas. */
export function Note({ x, y, children, color = C.ink, size = 20, anchor = 'start', className = '' }) {
  const lines = String(children).split('\n');
  return (
    <text x={x} y={y} className={'note ' + className} fill={color} fontSize={size} textAnchor={anchor}>
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i ? size * 1.02 : 0}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

/** Libellé net (Inter) sur une ou plusieurs lignes, centré. */
export function Label({ x, y, children, size = 14, weight = 500, color = C.ink, anchor = 'middle' }) {
  const lines = String(children).split('\n');
  const y0 = y - ((lines.length - 1) * size * 1.2) / 2;
  return (
    <text x={x} y={y0} className="label" fill={color} fontSize={size} fontWeight={weight} textAnchor={anchor} dominantBaseline="middle">
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i ? size * 1.2 : 0}>
          {l}
        </tspan>
      ))}
    </text>
  );
}
