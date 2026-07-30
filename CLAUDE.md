# Outil Management — Boîte à outils leadership

## Le projet

Site 100 % statique (HTML/CSS/JS vanilla) qui centralise des outils d'aide au
leadership et au management issus d'une formation. Page d'accueil avec un bouton
par outil, chaque outil vit sur sa propre page. La spec d'origine est dans
`projet.md`.

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
index.html        Accueil : grille de boutons vers les outils
outils/*.html     Une page par outil
css/style.css     Styles partagés (variables, layout, composants)
js/storage.js     Accès centralisé au localStorage
js/<outil>.js     Logique propre à chaque outil
lib/              Bibliothèques vendorées (si besoin)
```

## Lancer en local

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000 (ouvrir `index.html` directement marche aussi).

## Déploiement

Push sur `main` → GitHub Pages publie automatiquement sur
https://aytan-sudo.github.io/outil-management/
