/*
 * Profil DISC : des personnes avec un score par axe (0–100), positionnées
 * sur le disque. La position se déduit des quatre scores :
 *   horizontal = orientation relations (I+S) vs tâches (D+C)
 *   vertical   = énergie active (D+I) vs réservée (S+C)
 */

const CLE = "disc";
const CENTRE_X = 240;
const CENTRE_Y = 260;
const RAYON = 195;

const DIMENSIONS = ["d", "i", "s", "c"];

let personnes = Storage.charger(CLE, []);

const calque = document.getElementById("calque-personnes");
const listePersonnes = document.getElementById("liste-personnes");
const formulaire = document.getElementById("formulaire-personne");
const champNom = document.getElementById("champ-nom");
const titreFormulaire = document.getElementById("titre-formulaire");
const champs = {};
const sorties = {};
for (const dim of DIMENSIONS) {
  champs[dim] = document.getElementById("champ-" + dim);
  sorties[dim] = document.getElementById("valeur-" + dim);
}

function sauvegarder() { Storage.sauvegarder(CLE, personnes); }

function dominante(p) {
  return DIMENSIONS.reduce((meilleure, dim) =>
    p[dim] > p[meilleure] ? dim : meilleure
  );
}

/* Position sur le disque, bornée à l'intérieur du cercle. */
function position(p) {
  let x = (p.i + p.s - p.d - p.c) / 200;
  let y = (p.d + p.i - p.s - p.c) / 200;
  const r = Math.hypot(x, y);
  const rMax = 0.88;
  if (r > rMax) {
    x = (x / r) * rMax;
    y = (y / r) * rMax;
  }
  return {
    x: CENTRE_X + x * RAYON,
    y: CENTRE_Y - y * RAYON,
  };
}

const SVG_NS = "http://www.w3.org/2000/svg";
const COULEURS = { d: "#d03b3b", i: "#eda100", s: "#1baf7a", c: "#2a78d6" };

function render() {
  renderDisque();
  renderListe();
}

function renderDisque() {
  calque.innerHTML = "";
  for (const p of personnes) {
    const { x, y } = position(p);
    const groupe = document.createElementNS(SVG_NS, "g");
    groupe.setAttribute("class", "personne");

    const cercle = document.createElementNS(SVG_NS, "circle");
    cercle.setAttribute("cx", x);
    cercle.setAttribute("cy", y);
    cercle.setAttribute("r", 9);
    cercle.setAttribute("fill", COULEURS[dominante(p)]);

    const texte = document.createElementNS(SVG_NS, "text");
    texte.setAttribute("x", x);
    texte.setAttribute("y", y + 24);
    texte.setAttribute("text-anchor", "middle");
    texte.textContent = p.nom;

    groupe.append(cercle, texte);
    groupe.addEventListener("click", () => editeur.editer(p));
    calque.appendChild(groupe);
  }
}

function texteScores(p) {
  return "D " + p.d + " · I " + p.i + " · S " + p.s + " · C " + p.c;
}

function renderListe() {
  listePersonnes.innerHTML = "";
  for (const p of personnes) {
    const li = document.createElement("li");
    li.className = "ligne-fiche";

    const dim = dominante(p);
    const badge = document.createElement("span");
    badge.className = "badge-dim dim-" + dim;
    badge.textContent = dim.toUpperCase();
    badge.title = "Dimension dominante";

    li.append(
      badge,
      corpsFiche(p.nom, texteScores(p)),
      boutonIcone("✎", "Modifier", () => editeur.editer(p)),
      boutonIcone("✕", "Supprimer", confirmerSuppression(p.nom, () => {
        personnes = personnes.filter((x) => x.id !== p.id);
        editeur.annulerEditionDe(p.id);
        sauvegarder();
        render();
      }))
    );
    listePersonnes.appendChild(li);
  }
}

/* --- Formulaire --- */

const editeur = creerEditeur({
  formulaire,
  titreFormulaire,
  boutonValider: document.getElementById("bouton-valider"),
  boutonAnnuler: document.getElementById("bouton-annuler"),
  champTexte: champNom,
  proprieteTexte: "nom",
  curseurs: DIMENSIONS.map((dim) => ({
    champ: champs[dim],
    sortie: sorties[dim],
    propriete: dim,
  })),
  libelleNouveau: "Nouvelle personne",
  libelleModifier: (p) => "Modifier « " + p.nom + " »",
  surValidation(valeurs, idEnEdition) {
    if (idEnEdition) {
      const p = personnes.find((x) => x.id === idEnEdition);
      if (p) Object.assign(p, valeurs);
    } else {
      personnes.push(Object.assign({ id: nouvelId("p") }, valeurs));
    }
    sauvegarder();
    render();
  },
});

/* --- Auto-questionnaire ---
   Quatre affirmations par dimension (0–4 chacune) ; le total 0–16 est ramené
   sur 0–100 puis reporté dans les curseurs du formulaire. Items originaux. */

const ITEMS_DISC = [
  { cle: "d", texte: "Je vais droit au but, même si cela peut paraître brusque." },
  { cle: "i", texte: "Je convaincs plus par l'enthousiasme que par les arguments techniques." },
  { cle: "s", texte: "Je préfère un environnement prévisible aux changements permanents." },
  { cle: "c", texte: "Je vérifie les détails avant de valider un travail." },
  { cle: "d", texte: "J'aime prendre les décisions et garder la main sur la situation." },
  { cle: "i", texte: "Parler devant un groupe me donne de l'énergie." },
  { cle: "s", texte: "On me décrit comme quelqu'un de calme et de fiable." },
  { cle: "c", texte: "Les règles et les procédures existent pour de bonnes raisons : je les respecte." },
  { cle: "d", texte: "Les objectifs ambitieux me stimulent plus qu'ils ne m'inquiètent." },
  { cle: "i", texte: "Je noue facilement le contact, même avec des inconnus." },
  { cle: "s", texte: "J'écoute longuement avant de donner mon avis." },
  { cle: "c", texte: "J'ai besoin de données solides avant de me faire une opinion." },
  { cle: "d", texte: "Dans un groupe qui hésite, je prends naturellement les commandes." },
  { cle: "i", texte: "J'aime lancer des idées nouvelles et embarquer les autres avec moi." },
  { cle: "s", texte: "Je tiens mes engagements dans la durée, sans faire de bruit." },
  { cle: "c", texte: "Mieux vaut un travail exact rendu un peu plus tard qu'un travail approximatif rendu vite." },
];

const detailsQuestionnaire = document.getElementById("questionnaire-disc");

Questionnaire.monter({
  conteneur: document.getElementById("items-disc"),
  progres: document.getElementById("progres-disc"),
  bouton: document.getElementById("bouton-quest-disc"),
  items: ITEMS_DISC,
  surValidation(totaux) {
    for (const dim of DIMENSIONS) {
      const score = Math.round((totaux[dim] / 16) * 100);
      champs[dim].value = score;
      sorties[dim].textContent = score;
    }
    detailsQuestionnaire.open = false;
    titreFormulaire.textContent = "Profil calculé — qui est-ce ?";
    champNom.focus();
    formulaire.scrollIntoView({ behavior: "smooth", block: "nearest" });
  },
});

render();
