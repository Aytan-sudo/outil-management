/*
 * Objectifs SMART (grille de vérification) et délégation : profil du
 * collaborateur (compétence × motivation) → style de management conseillé.
 */

const CLE = "smart";

const CRITERES = [
  { c: "s", lettre: "S", nom: "Spécifique", aide: "Précis, sans ambiguïté : une seule interprétation possible." },
  { c: "m", lettre: "M", nom: "Mesurable", aide: "Un indicateur dira s'il est atteint : chiffre, livrable…" },
  { c: "a", lettre: "A", nom: "Atteignable", aide: "Réaliste avec les moyens et le temps disponibles." },
  { c: "r", lettre: "R", nom: "Relié", aide: "Pertinent : il sert vos priorités et celles de l'équipe." },
  { c: "t", lettre: "T", nom: "Temporel", aide: "Une échéance datée est posée." },
];

const STYLES = {
  directif: {
    nom: "Directif",
    conseil: "Motivation présente, compétence en construction : cadrez précisément, " +
      "donnez des consignes claires et des points de contrôle rapprochés.",
  },
  persuasif: {
    nom: "Persuasif",
    conseil: "Compétence et motivation fragiles : expliquez le pourquoi, formez, " +
      "encouragez — accompagnement rapproché sur les deux plans.",
  },
  participatif: {
    nom: "Participatif",
    conseil: "Compétent mais peu motivé : associez aux décisions, écoutez, " +
      "redonnez du sens. La compétence est là, la motivation doit revenir.",
  },
  delegatif: {
    nom: "Délégatif",
    conseil: "Compétent et motivé : déléguez ! Confiez l'objectif, convenez de " +
      "jalons, laissez la main sur le « comment ».",
  },
};

const memorise = Storage.charger(CLE, {});
const etat = {
  objectifs: memorise.objectifs || [],
  collaborateurs: memorise.collaborateurs || [],
};
let idEnEdition = null;
let idSelection = null;

function sauvegarder() { Storage.sauvegarder(CLE, etat); }

function nouvelId(prefixe) {
  return prefixe + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function styleDe(p) {
  if (p.competence >= 10) return p.motivation >= 10 ? "delegatif" : "participatif";
  return p.motivation >= 10 ? "directif" : "persuasif";
}

/* --- Objectifs SMART --- */

const listeObjectifs = document.getElementById("liste-objectifs");
const formulaireObjectif = document.getElementById("formulaire-objectif");
const champObjectif = document.getElementById("champ-objectif");

function classeScore(score) {
  if (score === 5) return "score-ok";
  if (score >= 3) return "score-moyen";
  return "score-faible";
}

function renderObjectifs() {
  listeObjectifs.innerHTML = "";
  for (const o of etat.objectifs) {
    const score = CRITERES.filter((cr) => o.criteres[cr.c]).length;

    const carte = document.createElement("article");
    carte.className = "carte-section objectif";

    const entete = document.createElement("div");
    entete.className = "objectif-entete";
    const titre = document.createElement("h3");
    titre.textContent = o.titre;
    const badge = document.createElement("span");
    badge.className = "badge-score " + classeScore(score);
    badge.textContent = score + "/5";
    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.type = "button";
    boutonSupprimer.textContent = "✕";
    boutonSupprimer.title = "Supprimer";
    boutonSupprimer.addEventListener("click", () => {
      if (confirm("Supprimer « " + o.titre + " » ?")) {
        etat.objectifs = etat.objectifs.filter((x) => x.id !== o.id);
        sauvegarder();
        renderObjectifs();
      }
    });
    entete.append(titre, badge, boutonSupprimer);
    carte.appendChild(entete);

    for (const cr of CRITERES) {
      const ligne = document.createElement("label");
      ligne.className = "critere";
      const caseCoche = document.createElement("input");
      caseCoche.type = "checkbox";
      caseCoche.checked = Boolean(o.criteres[cr.c]);
      caseCoche.addEventListener("change", () => {
        o.criteres[cr.c] = caseCoche.checked;
        sauvegarder();
        renderObjectifs();
      });
      const texte = document.createElement("span");
      texte.innerHTML = "<strong></strong> <small></small>";
      texte.querySelector("strong").textContent = cr.lettre + " — " + cr.nom;
      texte.querySelector("small").textContent = cr.aide;
      ligne.append(caseCoche, texte);
      carte.appendChild(ligne);
    }

    listeObjectifs.appendChild(carte);
  }
}

formulaireObjectif.addEventListener("submit", (e) => {
  e.preventDefault();
  const titre = champObjectif.value.trim();
  if (!titre) return;
  etat.objectifs.push({
    id: nouvelId("o"),
    titre,
    criteres: { s: false, m: false, a: false, r: false, t: false },
  });
  champObjectif.value = "";
  sauvegarder();
  renderObjectifs();
});

/* --- Collaborateurs et délégation --- */

const miniMatrice = document.getElementById("mini-matrice");
const calqueCollabs = document.getElementById("calque-collabs");
const listeCollabs = document.getElementById("liste-collabs");
const conseil = document.getElementById("conseil");
const conseilTitre = document.getElementById("conseil-titre");
const conseilTexte = document.getElementById("conseil-texte");
const formulaireCollab = document.getElementById("formulaire-collab");
const champNom = document.getElementById("champ-nom");
const champCompetence = document.getElementById("champ-competence");
const champMotivation = document.getElementById("champ-motivation");
const valeurCompetence = document.getElementById("valeur-competence");
const valeurMotivation = document.getElementById("valeur-motivation");
const titreFormulaire = document.getElementById("titre-formulaire");
const boutonValider = document.getElementById("bouton-valider");
const boutonAnnuler = document.getElementById("bouton-annuler");

function renderCollabs() {
  const MARGE = 30;
  const l = miniMatrice.clientWidth;
  const h = miniMatrice.clientHeight;

  calqueCollabs.innerHTML = "";
  for (const p of etat.collaborateurs) {
    const point = document.createElement("span");
    point.className = "point-collab s-" + styleDe(p) +
      (p.id === idSelection ? " selection" : "");
    point.style.left = MARGE + (p.competence / 20) * (l - 2 * MARGE) + "px";
    point.style.top = h - MARGE - (p.motivation / 20) * (h - 2 * MARGE) + "px";
    const nom = document.createElement("small");
    nom.textContent = p.nom;
    point.appendChild(nom);
    point.addEventListener("click", () => selectionner(p.id));
    calqueCollabs.appendChild(point);
  }

  listeCollabs.innerHTML = "";
  for (const p of etat.collaborateurs) {
    const s = styleDe(p);
    const li = document.createElement("li");
    li.className = "collab" + (p.id === idSelection ? " selection" : "");

    const pastille = document.createElement("span");
    pastille.className = "pastille s-" + s;
    pastille.title = STYLES[s].nom;

    const corps = document.createElement("span");
    corps.className = "collab-corps";
    const nom = document.createElement("span");
    nom.className = "collab-nom";
    nom.textContent = p.nom + " — " + STYLES[s].nom;
    const scores = document.createElement("span");
    scores.className = "collab-scores";
    scores.textContent = "Compétence " + p.competence + " · Motivation " + p.motivation;
    corps.append(nom, scores);
    corps.addEventListener("click", () => selectionner(p.id));

    const boutonEditer = document.createElement("button");
    boutonEditer.type = "button";
    boutonEditer.textContent = "✎";
    boutonEditer.title = "Modifier";
    boutonEditer.addEventListener("click", () => editerCollab(p.id));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.type = "button";
    boutonSupprimer.textContent = "✕";
    boutonSupprimer.title = "Supprimer";
    boutonSupprimer.addEventListener("click", () => {
      if (confirm("Supprimer « " + p.nom + " » ?")) {
        etat.collaborateurs = etat.collaborateurs.filter((x) => x.id !== p.id);
        if (idEnEdition === p.id) reinitialiserFormulaire();
        if (idSelection === p.id) idSelection = null;
        sauvegarder();
        renderCollabs();
        majConseil();
      }
    });

    li.append(pastille, corps, boutonEditer, boutonSupprimer);
    listeCollabs.appendChild(li);
  }
}

function selectionner(id) {
  idSelection = id;
  renderCollabs();
  majConseil();
}

function majConseil() {
  const p = etat.collaborateurs.find((x) => x.id === idSelection);
  conseil.hidden = !p;
  if (!p) return;
  const s = styleDe(p);
  conseilTitre.textContent = p.nom + " → style " + STYLES[s].nom.toLowerCase();
  conseilTexte.textContent = STYLES[s].conseil;
  conseil.className = "conseil s-" + s;
}

function editerCollab(id) {
  const p = etat.collaborateurs.find((x) => x.id === id);
  if (!p) return;
  idEnEdition = id;
  champNom.value = p.nom;
  champCompetence.value = p.competence;
  champMotivation.value = p.motivation;
  valeurCompetence.textContent = p.competence;
  valeurMotivation.textContent = p.motivation;
  titreFormulaire.textContent = "Modifier « " + p.nom + " »";
  boutonValider.textContent = "Enregistrer";
  boutonAnnuler.hidden = false;
  champNom.focus();
}

function reinitialiserFormulaire() {
  idEnEdition = null;
  formulaireCollab.reset();
  valeurCompetence.textContent = champCompetence.value;
  valeurMotivation.textContent = champMotivation.value;
  titreFormulaire.textContent = "À qui déléguer ?";
  boutonValider.textContent = "Ajouter";
  boutonAnnuler.hidden = true;
}

champCompetence.addEventListener("input", () => {
  valeurCompetence.textContent = champCompetence.value;
});
champMotivation.addEventListener("input", () => {
  valeurMotivation.textContent = champMotivation.value;
});

formulaireCollab.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = champNom.value.trim();
  if (!nom) return;
  const competence = Number(champCompetence.value);
  const motivation = Number(champMotivation.value);
  if (idEnEdition) {
    const p = etat.collaborateurs.find((x) => x.id === idEnEdition);
    if (p) Object.assign(p, { nom, competence, motivation });
    idSelection = idEnEdition;
  } else {
    const p = { id: nouvelId("c"), nom, competence, motivation };
    etat.collaborateurs.push(p);
    idSelection = p.id;
  }
  sauvegarder();
  reinitialiserFormulaire();
  renderCollabs();
  majConseil();
});

boutonAnnuler.addEventListener("click", reinitialiserFormulaire);
window.addEventListener("resize", renderCollabs);

renderObjectifs();
renderCollabs();
majConseil();
