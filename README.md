# Agent Harness Lab — le carnet du harnessing

Un site pédagogique en 2D, style carnet technique dessiné à la main, pour aider les consultants IA à comprendre et expliquer le **harnessing** d’agents (LangGraph) en banque privée.

React + SVG + [rough.js](https://roughjs.com) — aucune bibliothèque 3D, aucune image externe.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:5173 (et sur le réseau local)
npm test        # tests de la logique (node, sans navigateur)
npm run build   # site statique dans dist/
```

## Les trois modules

| Onglet | Contenu |
|---|---|
| **1 · Les principes** (`#/principes`) | Schéma central « LLM brut ↔ agent harnaché ». Cinq couches à activer ou retirer : état & mémoire, outils & permissions, garde-fous entrée/sortie, humain dans la boucle, observabilité. Une couche retirée passe au crayon gris, barrée, et son risque s’écrit en rouge. Analogie bancaire pour chaque couche. |
| **2 · Cas d’usage KYC** (`#/kyc`) | L’« Assistant KYC Light » : graphe LangGraph dessiné, exécution pas à pas (« Étape suivante » ou lecture auto), fiche « État » qui se remplit, fiche détaillée au clic sur un nœud. Trois dossiers : complet, pièce manquante, cas sensible (PEP), où c’est **vous** qui validez à l’interruption. Code couleur : bleu = le LLM propose, noir = le harness contrôle, ambre = un humain décide. |
| **3 · Challenge sécurité** (`#/securite`) | Deux colonnes : l’agent KYC harnaché et un agent affaibli dont vous choisissez les couches. Un agent attaquant (modèle abliterated) lance 4 attaques : injection de prompt, extraction de données, abus d’outil, jailbreak. L’attaque descend la pile de défenses, un tampon « BLOQUÉ » ou « COMPROMIS » s’affiche, et un journal manuscrit s’écrit. En bas : 8 règles pour utiliser un modèle abliterated sans qu’il dérive. |

## Organisation du code

```
src/
  data/         tout le contenu pédagogique (textes FR, analogies, scénarios)
    layers.js     module 1 — les 5 couches
    kyc.js        module 2 — nœuds, arêtes, 3 dossiers
    security.js   module 3 — couches de défense, attaques, règles
  engine/       logique pure : exécution du graphe KYC, simulation d’attaque
  sketch/       identité visuelle : primitives rough.js (Sketch.jsx), pictos, palette
  modules/      les trois vues
  ui/           navigation et petits composants partagés
tests/engine.test.mjs
```

**Les données décrivent, le moteur calcule, les schémas dessinent.** Pour ajouter une attaque, un dossier KYC ou une couche, on édite `src/data/` ; `npm test` vérifie la cohérence (arêtes existantes, défense en profondeur : retirer une seule couche ne laisse jamais passer une attaque).

## Déploiement sur le Raspberry Pi (Nginx)

```bash
cd ~/projects/agent-harness-lab-2d && npm install && npm run build
```

Dans `/etc/nginx/sites-available/portail` :

```nginx
location /harness/ {
    alias /home/pi/projects/agent-harness-lab-2d/dist/;
    try_files $uri $uri/ /harness/index.html;
}
```

Puis `sudo systemctl reload nginx` et ajout de la carte dans le portail. Le lien **⊞ Portail** (en haut à droite) ramène à `http://192.168.1.38`.

Les noms, montants et attaques sont fictifs et volontairement stylisés : on montre la mécanique, jamais une recette.
