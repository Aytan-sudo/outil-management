/*
 * Matrice des conflits par acteurs (grille accord × confiance).
 * Matrice 2D (moteur commun js/matrice.js) : x = accord sur le fond,
 * y = confiance dans la relation.
 */

const CLE = "conflits";
const SEUIL = 10;

let acteurs = Storage.charger(CLE, []);

const listeActeurs = document.getElementById("liste-acteurs");

function sauvegarder() { Storage.sauvegarder(CLE, acteurs); }

function quadrantDe(a) {
  if (a.confiance >= SEUIL) return a.accord >= SEUIL ? "allies" : "adversaires";
  return a.accord >= SEUIL ? "opportunistes" : "ennemis";
}

const NOMS_QUADRANTS = {
  allies: "Allié",
  adversaires: "Adversaire",
  opportunistes: "Opportuniste",
  ennemis: "Ennemi",
};

function texteScores(a) {
  return "Accord " + Math.round(a.accord) + " · Confiance " + Math.round(a.confiance);
}

/* --- Rendu --- */

function render() {
  matriceActeurs.render();
  renderListe();
}

const matriceActeurs = creerMatrice({
  matrice: document.getElementById("matrice"),
  calque: document.getElementById("calque-vignettes"),
  matriceVide: document.getElementById("matrice-vide"),
  proprieteX: "accord",
  proprieteY: "confiance",
  margeEtroite: 56,
  margeLarge: 68,
  objets: () => acteurs,
  classeVignette: (a) => "vignette q-" + quadrantDe(a),
  titreVignette: (a) => a.nom,
  texteScores,
  surDepot() { sauvegarder(); render(); },
  surClic(a) { editeur.editer(a); },
});

function renderListe() {
  listeActeurs.innerHTML = "";
  for (const a of acteurs) {
    const q = quadrantDe(a);
    const li = document.createElement("li");
    li.className = "ligne-fiche";
    li.append(
      elementPastille("q-" + q, NOMS_QUADRANTS[q]),
      corpsFiche(a.nom + " — " + NOMS_QUADRANTS[q], texteScores(a)),
      boutonIcone("✎", "Modifier", () => editeur.editer(a)),
      boutonIcone("✕", "Supprimer", confirmerSuppression(a.nom, () => {
        acteurs = acteurs.filter((x) => x.id !== a.id);
        editeur.annulerEditionDe(a.id);
        sauvegarder();
        render();
      }))
    );
    listeActeurs.appendChild(li);
  }
}

/* --- Formulaire --- */

const editeur = creerEditeur({
  formulaire: document.getElementById("formulaire-acteur"),
  titreFormulaire: document.getElementById("titre-formulaire"),
  boutonValider: document.getElementById("bouton-valider"),
  boutonAnnuler: document.getElementById("bouton-annuler"),
  champTexte: document.getElementById("champ-nom"),
  proprieteTexte: "nom",
  curseurs: [
    { champ: document.getElementById("champ-accord"),
      sortie: document.getElementById("valeur-accord"), propriete: "accord" },
    { champ: document.getElementById("champ-confiance"),
      sortie: document.getElementById("valeur-confiance"), propriete: "confiance" },
  ],
  libelleNouveau: "Nouvel acteur",
  libelleModifier: (a) => "Modifier « " + a.nom + " »",
  surValidation(valeurs, idEnEdition) {
    if (idEnEdition) {
      const a = acteurs.find((x) => x.id === idEnEdition);
      if (a) Object.assign(a, valeurs);
    } else {
      acteurs.push(Object.assign({ id: nouvelId("a") }, valeurs));
    }
    sauvegarder();
    render();
  },
});

render();
