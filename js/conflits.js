/*
 * Matrice des conflits par acteurs (grille accord × confiance).
 * Chaque acteur est positionné par ses scores (x = accord sur le fond,
 * y = confiance dans la relation) ; le glisser met à jour les scores.
 */

const CLE = "conflits";
const SEUIL = 10;

let acteurs = Storage.charger(CLE, []);
let idEnEdition = null;
let drag = null;

const matrice = document.getElementById("matrice");
const calque = document.getElementById("calque-vignettes");
const matriceVide = document.getElementById("matrice-vide");
const listeActeurs = document.getElementById("liste-acteurs");
const formulaire = document.getElementById("formulaire-acteur");
const champNom = document.getElementById("champ-nom");
const champAccord = document.getElementById("champ-accord");
const champConfiance = document.getElementById("champ-confiance");
const valeurAccord = document.getElementById("valeur-accord");
const valeurConfiance = document.getElementById("valeur-confiance");
const titreFormulaire = document.getElementById("titre-formulaire");
const boutonValider = document.getElementById("bouton-valider");
const boutonAnnuler = document.getElementById("bouton-annuler");

function margeX() { return matrice.clientWidth < 500 ? 56 : 68; }
function margeY() { return 32; }

function sauvegarder() { Storage.sauvegarder(CLE, acteurs); }

function borner(v) { return Math.min(20, Math.max(0, v)); }

function quadrantDe(a) {
  if (a.confiance >= SEUIL) return a.accord >= SEUIL ? "allies" : "adversaires";
  return a.accord >= SEUIL ? "opportunistes" : "ennemis";
}

function nouvelId() {
  return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* --- Rendu --- */

function render() {
  renderMatrice();
  renderListe();
}

function positionner(el, a) {
  const l = matrice.clientWidth;
  const h = matrice.clientHeight;
  const mx = margeX();
  const my = margeY();
  el.style.left = mx + (a.accord / 20) * (l - 2 * mx) + "px";
  el.style.top = h - my - (a.confiance / 20) * (h - 2 * my) + "px";
}

function texteScores(a) {
  return "Accord " + Math.round(a.accord) + " · Confiance " + Math.round(a.confiance);
}

function renderMatrice() {
  calque.innerHTML = "";
  matriceVide.hidden = acteurs.length > 0;
  for (const a of acteurs) {
    const v = document.createElement("div");
    v.className = "vignette q-" + quadrantDe(a);
    v.dataset.id = a.id;

    const titre = document.createElement("span");
    titre.className = "vignette-titre";
    titre.textContent = a.nom;
    const scores = document.createElement("span");
    scores.className = "vignette-scores";
    scores.textContent = texteScores(a);

    v.append(titre, scores);
    positionner(v, a);
    v.addEventListener("pointerdown", surPointerDown);
    calque.appendChild(v);
  }
}

const NOMS_QUADRANTS = {
  allies: "Allié",
  adversaires: "Adversaire",
  opportunistes: "Opportuniste",
  ennemis: "Ennemi",
};

function renderListe() {
  listeActeurs.innerHTML = "";
  for (const a of acteurs) {
    const li = document.createElement("li");
    li.className = "acteur";

    const q = quadrantDe(a);
    const pastille = document.createElement("span");
    pastille.className = "pastille q-" + q;
    pastille.title = NOMS_QUADRANTS[q];

    const corps = document.createElement("span");
    corps.className = "acteur-corps";
    const nom = document.createElement("span");
    nom.className = "acteur-nom";
    nom.textContent = a.nom + " — " + NOMS_QUADRANTS[q];
    const scores = document.createElement("span");
    scores.className = "acteur-scores";
    scores.textContent = texteScores(a);
    corps.append(nom, scores);

    const boutonEditer = document.createElement("button");
    boutonEditer.type = "button";
    boutonEditer.textContent = "✎";
    boutonEditer.title = "Modifier";
    boutonEditer.addEventListener("click", () => editerActeur(a.id));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.type = "button";
    boutonSupprimer.textContent = "✕";
    boutonSupprimer.title = "Supprimer";
    boutonSupprimer.addEventListener("click", () => {
      if (confirm("Supprimer « " + a.nom + " » ?")) {
        acteurs = acteurs.filter((x) => x.id !== a.id);
        if (idEnEdition === a.id) reinitialiserFormulaire();
        sauvegarder();
        render();
      }
    });

    li.append(pastille, corps, boutonEditer, boutonSupprimer);
    listeActeurs.appendChild(li);
  }
}

/* --- Glisser-déposer --- */

function surPointerDown(e) {
  const el = e.currentTarget;
  const a = acteurs.find((x) => x.id === el.dataset.id);
  if (!a) return;
  drag = { el, a, x0: e.clientX, y0: e.clientY, deplace: false };
  el.setPointerCapture(e.pointerId);
  el.addEventListener("pointermove", surPointerMove);
  el.addEventListener("pointerup", surPointerUp);
  el.addEventListener("pointercancel", surPointerUp);
  e.preventDefault();
}

function surPointerMove(e) {
  if (!drag) return;
  if (!drag.deplace) {
    if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 5) return;
    drag.deplace = true;
    drag.el.classList.add("en-cours");
  }
  const r = matrice.getBoundingClientRect();
  const mx = margeX();
  const my = margeY();
  drag.a.accord = borner(((e.clientX - r.left - mx) / (r.width - 2 * mx)) * 20);
  drag.a.confiance = borner(((r.height - my - (e.clientY - r.top)) / (r.height - 2 * my)) * 20);
  positionner(drag.el, drag.a);
  drag.el.className = "vignette q-" + quadrantDe(drag.a) + " en-cours";
  drag.el.querySelector(".vignette-scores").textContent = texteScores(drag.a);
}

function surPointerUp() {
  if (!drag) return;
  const { el, a, deplace } = drag;
  el.classList.remove("en-cours");
  el.removeEventListener("pointermove", surPointerMove);
  el.removeEventListener("pointerup", surPointerUp);
  el.removeEventListener("pointercancel", surPointerUp);
  drag = null;
  if (deplace) {
    a.accord = Math.round(a.accord);
    a.confiance = Math.round(a.confiance);
    sauvegarder();
    render();
  } else {
    editerActeur(a.id);
  }
}

/* --- Formulaire --- */

function editerActeur(id) {
  const a = acteurs.find((x) => x.id === id);
  if (!a) return;
  idEnEdition = id;
  champNom.value = a.nom;
  champAccord.value = a.accord;
  champConfiance.value = a.confiance;
  valeurAccord.textContent = a.accord;
  valeurConfiance.textContent = a.confiance;
  titreFormulaire.textContent = "Modifier « " + a.nom + " »";
  boutonValider.textContent = "Enregistrer";
  boutonAnnuler.hidden = false;
  champNom.focus();
  formulaire.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function reinitialiserFormulaire() {
  idEnEdition = null;
  formulaire.reset();
  valeurAccord.textContent = champAccord.value;
  valeurConfiance.textContent = champConfiance.value;
  titreFormulaire.textContent = "Nouvel acteur";
  boutonValider.textContent = "Ajouter";
  boutonAnnuler.hidden = true;
}

champAccord.addEventListener("input", () => {
  valeurAccord.textContent = champAccord.value;
});
champConfiance.addEventListener("input", () => {
  valeurConfiance.textContent = champConfiance.value;
});

formulaire.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = champNom.value.trim();
  if (!nom) return;
  const accord = Number(champAccord.value);
  const confiance = Number(champConfiance.value);
  if (idEnEdition) {
    const a = acteurs.find((x) => x.id === idEnEdition);
    if (a) Object.assign(a, { nom, accord, confiance });
  } else {
    acteurs.push({ id: nouvelId(), nom, accord, confiance });
  }
  sauvegarder();
  reinitialiserFormulaire();
  render();
});

boutonAnnuler.addEventListener("click", reinitialiserFormulaire);
window.addEventListener("resize", renderMatrice);

render();
