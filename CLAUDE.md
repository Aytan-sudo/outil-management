# Outil Management — Boîte à outils leadership

## Le projet

Site 100 % statique (HTML/CSS/JS vanilla) qui centralise des outils d'aide au
leadership et au management issus d'une formation. Page d'accueil avec un bouton
par outil, chaque outil vit sur sa propre page. La spec d'origine est dans
`projet.md` ; les pistes d'évolution sont dans `EVOLUTIONS.md`.

Les 6 outils : matrice d'Eisenhower, SMART & délégation, modèle TKI,
matrice des conflits par acteurs, profil DISC, drivers (messages contraignants).

## Contraintes techniques

- **Statique uniquement** : pas de serveur, pas de Node, pas de bundler, pas de
  framework. Si une bibliothèque JS est vraiment nécessaire, la vendorer dans
  `lib/` (pas de CDN — le site doit marcher hors ligne).
- **Données utilisateur** : `localStorage` uniquement, toujours via
  `js/storage.js`. Clés préfixées `om:` (ex. `om:eisenhower`).
- **Interface en français.**
- **Responsive** : utilisable sur Mac (navigateur) et sur smartphone.

## Structure

```
index.html          Accueil : grille de boutons vers les outils + export/import JSON
outils/*.html       Une page par outil
css/style.css       Styles partagés (variables + palette globale, layout,
                    composants : matrices, formulaires-fiches, lignes de liste,
                    questionnaires)
css/<outil>.css     Styles propres à chaque outil (couleurs, layout, exceptions)
js/storage.js       Accès centralisé au localStorage (+ export/import global)
js/matrice.js       Moteur commun des matrices à vignettes glissables
js/fiches.js        Formulaire d'ajout/édition + briques des lignes de liste
js/questionnaire.js Rendu des auto-questionnaires Likert (TKI, DISC)
js/accueil.js       Export/import depuis l'accueil
js/<outil>.js       Logique propre à chaque outil
lib/                Bibliothèques vendorées (si besoin)
```

## Lancer en local

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000 (ouvrir `index.html` directement marche aussi).

## Déploiement

Push sur `main` → GitHub Pages publie automatiquement sur
https://aytan-sudo.github.io/outil-management/
