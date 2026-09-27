/* =============================================================================
   Module 1 — Les cinq couches du harness.
   gives : ce que la couche apporte · risk : ce qui apparaît quand on la retire.
   ============================================================================= */

export const LAYERS = [
  {
    id: 'memory',
    n: 1,
    name: 'État & mémoire',
    short: 'Un dossier structuré qui suit toute la conversation.',
    gives: 'L’agent sait où il en est : pièces reçues, décisions prises, qui a validé quoi. Chaque étape est sauvegardée et peut être reprise.',
    risk: 'L’agent oublie le dossier d’un message à l’autre et se contredit. Impossible de reprendre ou de rejouer une décision.',
    riskShort: 'oublie, se contredit,\naucune reprise possible',
    analogy: 'Le dossier client papier, avec son historique : on ne repart jamais d’une feuille blanche.',
  },
  {
    id: 'tools',
    n: 2,
    name: 'Outils & permissions',
    short: 'Des actions précises, chacune avec son périmètre.',
    gives: 'L’agent n’agit qu’à travers des outils déclarés : lecture du dossier en cours, brouillon d’e-mail… Chaque outil a un périmètre strict.',
    risk: 'L’agent peut tout lire et tout faire : accès aux autres clients, envoi d’e-mails à n’importe qui, modification directe des statuts.',
    riskShort: 'accès à tout,\nactions sans limite',
    analogy: 'Les habilitations informatiques : un stagiaire consulte, il ne signe pas.',
  },
  {
    id: 'guards',
    n: 3,
    name: 'Garde-fous entrée / sortie',
    short: 'Filtrer ce qui entre, vérifier ce qui sort.',
    gives: 'À l’entrée : détection des instructions cachées et des demandes hors périmètre. À la sortie : format vérifié, données sensibles masquées.',
    risk: 'Une instruction cachée dans un document est exécutée. Des données personnelles sortent dans la réponse.',
    riskShort: 'injections exécutées,\nfuites de données',
    analogy: 'L’accueil qui vérifie les visiteurs, et la conformité qui relit le courrier sortant.',
  },
  {
    id: 'human',
    n: 4,
    name: 'Humain dans la boucle',
    short: 'Les décisions engageantes attendent une signature.',
    gives: 'Pour tout ce qui engage la banque (accepter un client sensible, modifier un dossier), le graphe s’arrête et un conseiller décide.',
    risk: 'Le modèle accepte seul un client à risque ou valide un dossier incomplet. Personne n’a signé.',
    riskShort: 'décisions sensibles\nsans signature',
    analogy: 'Le principe des quatre yeux : deux signatures pour les opérations importantes.',
  },
  {
    id: 'observe',
    n: 5,
    name: 'Observabilité',
    short: 'Tout est tracé, daté, rejouable.',
    gives: 'Chaque appel au modèle, chaque outil, chaque décision humaine est journalisé. Les anomalies déclenchent une alerte.',
    risk: 'Personne ne voit ce qui se passe. Un incident est découvert des mois plus tard, sans pouvoir l’expliquer au régulateur.',
    riskShort: 'boîte noire :\nincidents invisibles',
    analogy: 'La piste d’audit : chaque opération laisse une trace datée et signée.',
  },
];

export const allOn = () => Object.fromEntries(LAYERS.map((l) => [l.id, true]));
export const allOff = () => Object.fromEntries(LAYERS.map((l) => [l.id, false]));

/** Titre du schéma selon le nombre de couches actives. */
export function harnessTitle(layers) {
  const n = Object.values(layers).filter(Boolean).length;
  if (n === 0) return { title: 'LLM brut', sub: 'Un modèle seul, branché directement sur le monde.' };
  if (n === LAYERS.length) return { title: 'Agent harnaché', sub: 'Le modèle propose, le harness décide, trace et protège.' };
  return { title: 'Agent partiellement harnaché', sub: `${n} couche${n > 1 ? 's' : ''} sur ${LAYERS.length} — chaque couche absente ouvre un risque.` };
}
