# Pistes d'évolution

Document de réflexion pour les prochaines sessions de travail sur le projet.
État au 7 août 2026 : les 6 outils sont construits, déployés sur GitHub
Pages, données en `localStorage` uniquement.

**Réalisé le 7 août 2026 :**
- ✅ Export/import JSON depuis l'accueil (axe 1 niveau 0) ;
- ✅ Refactorisation (axe 3) : `js/matrice.js` (moteur des matrices glissables,
  utilisé par Eisenhower et conflits), `js/fiches.js` (formulaires d'édition et
  lignes de liste, utilisé par 4 outils), CSS communs et palette centralisés
  dans `style.css`. La mini-matrice SMART reste à part (pas de glisser, points
  cliquables : le moteur commun n'apporterait rien) ;
- ✅ Eisenhower : mode 3D expérimental (axe « charge de travail », cube SVG
  rotatif sans bibliothèque, tri par priorité ⚡ = urgence + importance +
  rapidité) ;
- ✅ TKI et DISC : auto-questionnaires à items originaux (aucun item des
  questionnaires commerciaux — voir l'avertissement affiché sur les pages),
  module partagé `js/questionnaire.js`.

## 1. Gestion d'utilisateurs et synchronisation entre appareils

Aujourd'hui chaque navigateur a ses propres données : le Mac et le téléphone ne
partagent rien. Trois niveaux de réponse, du plus léger au plus lourd :

**Niveau 0 — Export / import manuel (recommandé comme première étape).**
Un bouton « Exporter mes données » qui télécharge un JSON de tout le
`localStorage`, et « Importer » qui le recharge. Transfert Mac → téléphone via
AirDrop / mail. ~1 h de travail, zéro infrastructure, zéro risque. Couvre aussi
le besoin de **sauvegarde** (le localStorage peut être effacé par un nettoyage
du navigateur — c'est aujourd'hui le vrai point de fragilité).

**Niveau 1 — Backend-as-a-service (Supabase, Firebase…).**
Comptes utilisateurs + base de données sur leur offre gratuite, sans serveur à
administrer. Le site reste statique sur Pages, seul le JS appelle leur API.
Points d'attention : dépendance à un tiers, SDK à intégrer (la règle « pas de
CDN » du CLAUDE.md devra être amendée ou le SDK vendoré dans `lib/`).

**Niveau 2 — Serveur maison (Flask + SQLite sur Fly.io / VPS).**
Contrôle total, cohérent avec les connaissances Flask existantes, mais c'est un
vrai service à maintenir (auth, sauvegardes, mises à jour de sécurité).

⚠️ **Point de vigilance commun aux niveaux 1 et 2** : les données du projet sont
sensibles — noms de collègues associés à des scores de confiance, des profils
psychologiques, des catégories « ennemi »… Le « tout reste dans votre
navigateur » actuel est une vraie qualité du produit (aucun enjeu RGPD, aucune
fuite possible). Ne mettre ces données sur un serveur que si le besoin de sync
est avéré à l'usage, et alors avec authentification sérieuse et minimisation
(pseudonymes ?).

## 2. Autres outils envisageables

L'architecture rend l'ajout d'un outil peu coûteux (une page HTML + un CSS + un
JS + une carte sur l'accueil). Candidats issus des boîtes à outils classiques de
formation au leadership, à trier selon le contenu de la formation :

- **Feedback DESC** — assistant de préparation d'un feedback (Décrire les faits,
  Exprimer son ressenti, Spécifier la demande, Conséquences positives).
- **Fenêtre de Johari** — zones connue/aveugle/cachée/inconnue, pour préparer
  des feedbacks croisés.
- **Analyse de champ de forces (Lewin)** — forces motrices vs freins autour d'un
  changement, avec poids ; réutiliserait le mécanisme de vignettes.
- **Courbe du changement (Kübler-Ross)** — positionner ses collaborateurs sur la
  courbe pendant une transformation.
- **RACI** — grille responsabilités × activités pour un projet.
- **Échelle d'autonomie / matrice de compétences d'équipe** — prolongement
  naturel de la partie délégation de l'outil SMART.
- **Positions de vie (analyse transactionnelle, OK/OK)** — compléterait les
  drivers.
- **Préparation d'entretien 1:1** — trame + historique par collaborateur (là,
  la question des données sensibles se pose encore plus).

## 3. Refactorisation pour simplifier le code

Constats actuels (dette assumée pendant la construction rapide) :

- **Trois matrices quasi identiques** : `eisenhower.js`, `conflits.js` et la
  mini-matrice de `smart.js` partagent la logique quadrants / positionnement /
  drag & drop. → Extraire un module `js/matrice.js` (config : axes, seuil,
  couleurs, libellés, drag oui/non) ; chaque outil deviendrait ~50 lignes de
  configuration.
- **Formulaires et listes dupliqués** : le trio « formulaire d'ajout/édition +
  liste avec ✎/✕ + confirmation de suppression » existe en 4 exemplaires. →
  Helper commun.
- **CSS dupliqué** : `.formulaire-*`, `.pastille`, `.actions-formulaire`,
  `.ligne-score` sont copiés dans 4 fichiers. → Les remonter dans `style.css` ;
  centraliser aussi la palette (les hex `#2a78d6`, `#d03b3b`… sont répétés
  partout) dans des variables CSS globales.

Gain attendu : environ un tiers de code en moins, et surtout un seul endroit à
corriger par comportement. Risque faible mais pas de tests automatisés : faire
la refonte outil par outil avec une checklist de test manuel (ajout, édition,
drag, suppression, rechargement de page, mobile).

## 4. GitHub Pages : limites et alternatives

**Ce qui convient très bien aujourd'hui** : gratuit, HTTPS, déploiement
automatique à chaque push, aucune maintenance, largement dimensionné pour cet
usage (~100 Go/mois de bande passante, bien au-delà du besoin).

**Limites réelles à connaître :**
- *Pas de backend* : aucun code serveur ne peut y tourner — c'est le blocage
  pour le niveau 1/2 de l'axe 1 (mais pas pour le niveau 0).
- *Site public* : l'URL est accessible à quiconque la connaît (les données,
  elles, restent locales à chaque navigateur — personne ne voit tes saisies).
  Pas de contrôle d'accès possible sur l'offre gratuite.
- *Dépôt public obligatoire* (offre gratuite) : le code est visible — sans
  enjeu ici.

**Faut-il migrer ?** Non tant que le site est statique. Si l'axe 1 passe au
niveau 1 ou 2 : **Cloudflare Pages** (+ Workers/KV pour le backend léger) ou
**Netlify/Vercel** (fonctions serverless) permettent de garder le confort
« push = déploiement » en ajoutant du code serveur ; un serveur Flask (niveau 2)
impliquerait plutôt Fly.io ou un petit VPS. La migration du statique lui-même
est triviale (ce sont des fichiers) — aucun enfermement, donc aucune urgence à
décider.

## Ordre suggéré pour la suite

1. Nouveaux outils (axe 2) selon la formation — l'ajout est encore moins
   coûteux depuis la refactorisation.
2. Sync serveur (axe 1 niveaux 1-2) et hébergement (axe 4) seulement si le
   besoin se confirme à l'usage.
