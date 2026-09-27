/* Barre de navigation : marque, trois onglets (soulignés au feutre), retour portail. */
import { Line } from '../sketch/Sketch.jsx';
import { C } from '../sketch/palette.js';

export function Nav({ modules, current }) {
  return (
    <header className="nav">
      <a className="brand" href="#/principes">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="10" fill="none" stroke={C.ink} strokeWidth="1.8" />
          <circle cx="16" cy="16" r="4.5" fill={C.blue} />
        </svg>
        <span>
          Agent Harness Lab <em>le carnet du harnessing</em>
        </span>
      </a>
      <nav className="tabs" aria-label="Modules">
        {modules.map((m) => {
          const on = m.id === current;
          return (
            <a key={m.id} href={`#/${m.id}`} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
              <span className="num">{m.n}</span>
              <span className="full">{m.name}</span>
              <span className="short">{m.short}</span>
              {on && (
                <svg className="underline" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true">
                  <Line x1={2} y1={6} x2={118} y2={4} o={{ stroke: C.blue, strokeWidth: 2.6, roughness: 1.4 }} draw />
                </svg>
              )}
            </a>
          );
        })}
      </nav>
      <a className="portal" href="http://192.168.1.38" title="Retour au portail">
        ⊞ Portail
      </a>
    </header>
  );
}
