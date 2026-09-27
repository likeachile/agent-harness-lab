/* =============================================================================
   Petits composants partagés du carnet : en-tête de module, consigne
   manuscrite « à faire », case à cocher dessinée, légende des couleurs.
   ============================================================================= */

import { Rect, Check, Arrow } from '../sketch/Sketch.jsx';
import { C } from '../sketch/palette.js';

/** En-tête d'un module : surtitre, titre, chapeau. */
export function ModuleHead({ n, title, lead, children }) {
  return (
    <header className="mod-head">
      <span className="kicker">Module {n}</span>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {children}
    </header>
  );
}

/** Consigne manuscrite avec petite flèche : dit au lecteur quoi faire maintenant. */
export function Todo({ children, dir = 'down' }) {
  return (
    <p className="todo">
      <span className="note-font">{children}</span>
      <svg width="46" height="34" viewBox="0 0 46 34" aria-hidden="true" className={'todo-arrow ' + dir}>
        <Arrow from={[4, 6]} to={[40, 28]} bend={-10} o={{ stroke: C.blue, strokeWidth: 1.8 }} />
      </svg>
    </p>
  );
}

/** Case à cocher dessinée. La coche est retracée à chaque activation. */
export function SkCheck({ on, color = C.ink, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="skcheck">
      <Rect x={2} y={3} w={19} h={18} o={{ stroke: C.ink, strokeWidth: 1.5, roughness: 1.3 }} />
      {on && (
        <g key="on">
          <Check x={12} y={12} s={8} color={color} w={2.4} />
        </g>
      )}
    </svg>
  );
}

/** Légende des couleurs : qui décide quoi. */
export function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map(([color, label]) => (
        <li key={label}>
          <i style={{ background: color }} />
          {label}
        </li>
      ))}
    </ul>
  );
}
