/* =============================================================================
   Pictogrammes dessinés à la main, composés des primitives rough.js.
   Tous centrés sur (x, y), taille nominale ~40 px, `c` = couleur du trait.
   ============================================================================= */

import { Sk, Rect, Circle, Line, Ellipse, Path } from './Sketch.jsx';
import { C } from './palette.js';

const t = (c, w = 1.6) => ({ stroke: c, strokeWidth: w });

/** Feuille de document avec coin corné et lignes de texte. */
export function DocIcon({ x, y, c = C.ink, s = 1 }) {
  const w = 30 * s;
  const h = 38 * s;
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  return (
    <g>
      <Sk kind="linearPath" args={[[[x0 + w - 9 * s, y0], [x0, y0], [x0, y0 + h], [x0 + w, y0 + h], [x0 + w, y0 + 9 * s], [x0 + w - 9 * s, y0], [x0 + w - 9 * s, y0 + 9 * s], [x0 + w, y0 + 9 * s]]]} o={t(c)} />
      {[14, 21, 28].map((dy) => (
        <Line key={dy} x1={x0 + 6 * s} y1={y0 + dy * s} x2={x0 + w - 7 * s} y2={y0 + dy * s} o={{ ...t(c, 1.1), roughness: 0.8 }} />
      ))}
    </g>
  );
}

/** Cadenas (fermé par défaut, ouvert si open). */
export function LockIcon({ x, y, c = C.ink, s = 1, open = false }) {
  const w = 20 * s;
  const h = 15 * s;
  const arc = open
    ? `M ${x - 6 * s} ${y - 2 * s} C ${x - 6 * s} ${y - 16 * s}, ${x + 6 * s} ${y - 16 * s}, ${x + 6 * s} ${y - 10 * s}`
    : `M ${x - 6 * s} ${y - 2 * s} C ${x - 6 * s} ${y - 15 * s}, ${x + 6 * s} ${y - 15 * s}, ${x + 6 * s} ${y - 2 * s}`;
  return (
    <g>
      <Path d={arc} o={t(c)} />
      <Rect x={x - w / 2} y={y - 2 * s} w={w} h={h} o={{ ...t(c), fill: c, fillStyle: 'hachure', hachureGap: 3.5 }} />
    </g>
  );
}

/** Œil (observabilité). */
export function EyeIcon({ x, y, c = C.ink, s = 1 }) {
  return (
    <g>
      <Path d={`M ${x - 18 * s} ${y} Q ${x} ${y - 16 * s} ${x + 18 * s} ${y} Q ${x} ${y + 16 * s} ${x - 18 * s} ${y}`} o={t(c)} />
      <Circle cx={x} cy={y} d={11 * s} o={{ ...t(c), fill: c, fillStyle: 'solid' }} />
    </g>
  );
}

/** Carnet à spirale (mémoire / état). */
export function NotebookIcon({ x, y, c = C.ink, s = 1 }) {
  const w = 30 * s;
  const h = 36 * s;
  return (
    <g>
      <Rect x={x - w / 2} y={y - h / 2} w={w} h={h} o={t(c)} />
      {[0, 1, 2, 3].map((i) => (
        <Circle key={i} cx={x - w / 2} cy={y - h / 2 + 7 * s + i * 8 * s} d={5 * s} o={t(c, 1.2)} />
      ))}
      <Line x1={x - 6 * s} y1={y - 6 * s} x2={x + 10 * s} y2={y - 6 * s} o={t(c, 1.1)} />
      <Line x1={x - 6 * s} y1={y + 2 * s} x2={x + 10 * s} y2={y + 2 * s} o={t(c, 1.1)} />
    </g>
  );
}

/** Personnage stylisé (humain dans la boucle). */
export function PersonIcon({ x, y, c = C.ink, s = 1 }) {
  return (
    <g>
      <Circle cx={x} cy={y - 12 * s} d={13 * s} o={t(c)} />
      <Path d={`M ${x - 13 * s} ${y + 15 * s} Q ${x - 12 * s} ${y - 2 * s} ${x} ${y - 2 * s} Q ${x + 12 * s} ${y - 2 * s} ${x + 13 * s} ${y + 15 * s}`} o={t(c)} />
    </g>
  );
}

/** Bouclier (garde-fou). */
export function ShieldIcon({ x, y, c = C.ink, s = 1, fill }) {
  const d = `M ${x} ${y - 16 * s} L ${x + 13 * s} ${y - 11 * s} Q ${x + 13 * s} ${y + 8 * s} ${x} ${y + 16 * s} Q ${x - 13 * s} ${y + 8 * s} ${x - 13 * s} ${y - 11 * s} Z`;
  return <Path d={d} o={{ ...t(c), ...(fill ? { fill, fillStyle: 'hachure', hachureGap: 4 } : {}) }} />;
}

/** Clé plate (outil). */
export function ToolIcon({ x, y, c = C.ink, s = 1 }) {
  return (
    <g>
      <Line x1={x - 12 * s} y1={y + 12 * s} x2={x + 5 * s} y2={y - 5 * s} o={t(c, 2.2)} />
      <Path d={`M ${x + 2 * s} ${y - 8 * s} A ${8 * s} ${8 * s} 0 1 1 ${x + 8 * s} ${y - 2 * s}`} o={t(c)} />
    </g>
  );
}

/** Tête de robot aux yeux rouges (agent attaquant). */
export function BotIcon({ x, y, c = C.red, s = 1 }) {
  return (
    <g>
      <Rect x={x - 16 * s} y={y - 12 * s} w={32 * s} h={26 * s} o={t(c, 1.8)} />
      <Line x1={x} y1={y - 12 * s} x2={x} y2={y - 20 * s} o={t(c)} />
      <Circle cx={x} cy={y - 22 * s} d={5 * s} o={{ ...t(c), fill: c, fillStyle: 'solid' }} />
      <Circle cx={x - 7 * s} cy={y - 1 * s} d={6 * s} o={{ ...t(c), fill: c, fillStyle: 'solid' }} />
      <Circle cx={x + 7 * s} cy={y - 1 * s} d={6 * s} o={{ ...t(c), fill: c, fillStyle: 'solid' }} />
      <Path d={`M ${x - 8 * s} ${y + 8 * s} L ${x - 4 * s} ${y + 6 * s} L ${x} ${y + 8 * s} L ${x + 4 * s} ${y + 6 * s} L ${x + 8 * s} ${y + 8 * s}`} o={t(c, 1.3)} />
    </g>
  );
}

/** Nuage de pensée « LLM » : cerveau stylisé en ellipses. */
export function BrainIcon({ x, y, c = C.blue, s = 1 }) {
  return (
    <g>
      <Ellipse cx={x - 6 * s} cy={y} w={22 * s} h={26 * s} o={t(c)} />
      <Ellipse cx={x + 6 * s} cy={y} w={22 * s} h={26 * s} o={t(c)} />
      <Path d={`M ${x} ${y - 11 * s} Q ${x - 3 * s} ${y} ${x} ${y + 11 * s}`} o={t(c, 1.1)} />
    </g>
  );
}
