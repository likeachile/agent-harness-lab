/* =============================================================================
   Module 2 — Assistant KYC Light.
   Un agent reçoit une pièce client, extrait les informations, vérifie ce qui
   manque et décide s'il faut escalader à un humain.

   kind : 'llm'     → le modèle propose (stylo bleu)
          'harness' → du code, des règles, des contrôles (encre noire)
          'human'   → une personne décide (ambre)
          'io'      → début / fin du graphe
   Positions : repère du schéma SVG (1000 × 540).
   ============================================================================= */

export const NODES = [
  {
    id: 'start',
    kind: 'io',
    x: 70,
    y: 140,
    name: 'Document\nreçu',
    what: 'Un conseiller dépose la pièce d’un client (PDF scanné). Un nouvel état est créé pour ce dossier.',
    component: 'Point d’entrée du graphe (START)',
    llm: null,
    harness: 'Un fil de travail unique par dossier : rien d’un autre client n’y entre.',
  },
  {
    id: 'reception',
    kind: 'harness',
    x: 215,
    y: 140,
    name: 'Réception\n& filtrage',
    what: 'Vérification du fichier avant toute lecture par le modèle.',
    component: 'Garde-fou d’entrée',
    llm: null,
    harness: 'Format et taille contrôlés, recherche d’instructions cachées dans le texte, données personnelles masquées dans les journaux.',
  },
  {
    id: 'extraction',
    kind: 'llm',
    x: 380,
    y: 140,
    name: 'Extraction\ndes champs',
    what: 'Le modèle lit le document et propose les informations clés : identité, adresse, origine des fonds.',
    component: 'LLM + validation de schéma',
    llm: 'Interprète le document, même mal scanné, et propose une fiche structurée.',
    harness: 'La fiche doit respecter un schéma strict : champ inconnu, format de date invalide ou valeur inventée → rejet et nouvelle tentative.',
  },
  {
    id: 'controle',
    kind: 'harness',
    x: 545,
    y: 140,
    name: 'Contrôle\ndes pièces',
    what: 'Des règles déterministes vérifient la complétude du dossier.',
    component: 'Règles métier (code)',
    llm: null,
    harness: 'Pièces obligatoires présentes, passeport non expiré, justificatif de moins de 3 mois, comparaison à la liste PEP interne.',
  },
  {
    id: 'evaluation',
    kind: 'llm',
    x: 710,
    y: 140,
    name: 'Évaluation\ndu risque',
    what: 'Le modèle synthétise le profil et propose un niveau de risque, avec sa justification.',
    component: 'LLM + sortie bornée',
    llm: 'Raisonne sur l’ensemble : activité, pays, montants, cohérence. Rédige une justification lisible.',
    harness: 'Seules trois valeurs sont acceptées (faible / moyen / élevé). La justification est conservée pour l’audit.',
  },
  {
    id: 'routeur',
    kind: 'harness',
    shape: 'diamond',
    x: 875,
    y: 140,
    name: 'Routeur',
    what: 'Choisit la suite du parcours. C’est une fonction, pas le modèle.',
    component: 'Arête conditionnelle (code)',
    llm: null,
    harness: 'Pièce manquante → demande de complément · risque élevé ou PEP → humain · sinon → pré-validation. Le modèle ne peut pas changer ces règles.',
  },
  {
    id: 'complement',
    kind: 'llm',
    x: 875,
    y: 400,
    name: 'Demande de\ncomplément',
    what: 'Le modèle rédige un message au client listant les pièces manquantes.',
    component: 'Outil en mode brouillon',
    llm: 'Rédige un e-mail clair, courtois, adapté au client.',
    harness: 'L’outil ne fait qu’un brouillon, déposé dans la file du conseiller. Aucun envoi direct au client.',
  },
  {
    id: 'humain',
    kind: 'human',
    x: 620,
    y: 400,
    name: 'Revue\nconformité',
    what: 'Le graphe s’interrompt. Un responsable conformité reçoit la synthèse et décide.',
    component: 'Humain dans la boucle · interrupt()',
    llm: 'A préparé la synthèse que lit l’humain — il ne décide pas.',
    harness: 'L’état est figé et sauvegardé. Rien ne bouge sans la décision signée d’une personne habilitée.',
  },
  {
    id: 'dossier',
    kind: 'harness',
    x: 365,
    y: 400,
    name: 'Mise à jour\ndu dossier',
    what: 'Le statut du dossier client est écrit dans le système de la banque.',
    component: 'Outil d’écriture limité',
    llm: null,
    harness: 'L’outil n’accepte que des statuts autorisés (« pré-validé », « accepté sous vigilance »…) et journalise chaque écriture.',
  },
  {
    id: 'fin',
    kind: 'io',
    x: 120,
    y: 400,
    name: 'Fin',
    what: 'Le parcours est terminé. L’état final et toute la trace sont archivés.',
    component: 'Fin du graphe (END) + checkpoint',
    llm: null,
    harness: 'Chaque étape a été sauvegardée : la décision peut être rejouée et expliquée à un auditeur.',
  },
];

export const nodeById = (id) => NODES.find((n) => n.id === id);

/** Arêtes : bend = courbure du trait (px). */
export const EDGES = [
  { from: 'start', to: 'reception' },
  { from: 'reception', to: 'extraction' },
  { from: 'extraction', to: 'controle' },
  { from: 'controle', to: 'evaluation' },
  { from: 'evaluation', to: 'routeur' },
  { from: 'routeur', to: 'complement', label: 'pièces manquantes' },
  { from: 'routeur', to: 'humain', label: 'risque élevé / PEP', bend: -30 },
  { from: 'routeur', to: 'dossier', label: 'risque faible', bend: -70 },
  { from: 'humain', to: 'dossier', label: 'approuvé' },
  { from: 'humain', to: 'fin', label: 'refusé', bend: -115 },
  { from: 'dossier', to: 'fin' },
  { from: 'complement', to: 'fin', bend: -120 },
];

export const edgeKey = (e) => `${e.from}>${e.to}`;

/** Champs de l'état affichés dans la fiche « State ». */
export const STATE_FIELDS = [
  ['document', 'Document'],
  ['identite', 'Identité'],
  ['adresse', 'Adresse'],
  ['fonds', 'Origine des fonds'],
  ['manquants', 'Éléments manquants'],
  ['risque', 'Risque'],
  ['decision', 'Décision'],
  ['validation', 'Validé par'],
];

const S = (node, set = {}, extra = {}) => ({ node, set, ...extra });

export const CASES = [
  {
    id: 'complet',
    name: 'Dossier complet',
    client: 'M. Laurent Weber',
    blurb: 'Toutes les pièces, profil clair.',
    steps: [
      S('start', { document: 'Passeport · facture · déclaration des fonds' }),
      S('reception', {}, { note: 'Fichier conforme, aucune instruction cachée.' }),
      S('extraction', {
        identite: 'Laurent Weber · 12/03/1971 · passeport valide 2031',
        adresse: 'Genève · facture du 02/09/2026',
        fonds: 'Vente d’entreprise · 2,1 M CHF',
      }),
      S('controle', { manquants: 'Aucun' }, { note: 'Toutes les règles passent.' }),
      S('evaluation', { risque: 'Faible — origine des fonds documentée' }),
      S('routeur', {}, { note: 'Rien ne manque, risque faible, pas de PEP.' }),
      S('dossier', { decision: 'Pré-validé', validation: 'Revue par échantillonnage' }, { via: 'risque faible' }),
      S('fin'),
    ],
  },
  {
    id: 'manquant',
    name: 'Pièce manquante',
    client: 'Mme Giulia Rossi',
    blurb: 'Passeport seul, adresse absente.',
    steps: [
      S('start', { document: 'Passeport seul' }),
      S('reception', {}, { note: 'Fichier conforme.' }),
      S('extraction', {
        identite: 'Giulia Rossi · 04/11/1985 · passeport valide 2029',
        adresse: '— non fourni',
        fonds: 'Salaire + héritage (déclaratif)',
      }),
      S('controle', { manquants: 'Justificatif de domicile · preuve de l’héritage' }, { note: 'Deux pièces obligatoires manquent.' }),
      S('evaluation', { risque: 'Moyen — informations incomplètes' }),
      S('routeur', {}, { note: 'Pièces manquantes : la règle impose une demande de complément.' }),
      S('complement', { decision: 'En attente de pièces · brouillon d’e-mail prêt' }, { via: 'pièces manquantes' }),
      S('fin'),
    ],
  },
  {
    id: 'sensible',
    name: 'Cas sensible',
    client: 'M. Tunde Adeyemi',
    blurb: 'Ancien ministre, 4,5 M USD.',
    steps: [
      S('start', { document: 'Passeport · facture · déclaration des fonds' }),
      S('reception', {}, { note: 'Fichier conforme.' }),
      S('extraction', {
        identite: 'Tunde Adeyemi · ancien vice-ministre de l’énergie',
        adresse: 'Londres · relevé du 20/08/2026',
        fonds: 'Honoraires de conseil · 4,5 M USD',
      }),
      S('controle', { manquants: 'Aucun · correspondance liste PEP' }, { note: 'Dossier complet, mais personne politiquement exposée.' }),
      S('evaluation', { risque: 'Élevé — PEP, secteur sensible, montant' }),
      S('routeur', {}, { note: 'PEP ⇒ revue humaine : règle codée, non négociable.' }),
      S('humain', { validation: 'En attente · responsable conformité' }, { via: 'risque élevé / PEP', interrupt: true }),
    ],
    branches: {
      approve: [
        S('dossier', { decision: 'Accepté sous vigilance renforcée', validation: 'Signé · C. Favre, conformité' }, { via: 'approuvé' }),
        S('fin'),
      ],
      reject: [S('fin', { decision: 'Refusé · analyse de soupçon ouverte', validation: 'Signé · C. Favre, conformité' }, { via: 'refusé' })],
    },
  },
];

export const caseById = (id) => CASES.find((c) => c.id === id);
