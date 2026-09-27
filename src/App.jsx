/* =============================================================================
   Agent Harness Lab — carnet visuel en trois modules.
   Navigation par ancre (#/principes, #/kyc, #/securite) : chaque module est
   une vue complète, partageable par lien.
   ============================================================================= */

import { useEffect, useState } from 'react';
import { Nav } from './ui/Nav.jsx';
import { Principles } from './modules/Principles.jsx';
import { KycCase } from './modules/KycCase.jsx';
import { SecurityChallenge } from './modules/SecurityChallenge.jsx';

export const MODULES = [
  { id: 'principes', n: 1, name: 'Les principes', short: 'Principes', Component: Principles },
  { id: 'kyc', n: 2, name: 'Cas d’usage KYC', short: 'KYC', Component: KycCase },
  { id: 'securite', n: 3, name: 'Challenge sécurité', short: 'Sécurité', Component: SecurityChallenge },
];

const fromHash = () => {
  const id = window.location.hash.replace(/^#\/?/, '');
  return MODULES.some((m) => m.id === id) ? id : 'principes';
};

export default function App() {
  const [current, setCurrent] = useState(fromHash);

  useEffect(() => {
    const onHash = () => {
      setCurrent(fromHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const mod = MODULES.find((m) => m.id === current);
  const next = MODULES[MODULES.indexOf(mod) + 1];

  return (
    <>
      <Nav modules={MODULES} current={current} />
      <main className="page" key={current}>
        <mod.Component />
        {next && (
          <a className="next-module" href={`#/${next.id}`}>
            <span className="note-font">module suivant</span>
            <b>
              {next.n} · {next.name} →
            </b>
          </a>
        )}
      </main>
      <footer className="foot">
        <span>Agent Harness Lab · carnet de formation pour consultants IA en banque privée</span>
        <span className="note-font">noms, montants et attaques sont fictifs et stylisés</span>
      </footer>
    </>
  );
}
