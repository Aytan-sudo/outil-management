/*
 * Matrice d'Eisenhower.
 * Les tâches sont positionnées dans la matrice par leurs scores
 * (x = urgence, y = importance) ; les glisser met à jour les scores.
 */

const CLE = "eisenhower";
const SEUIL = 10;

let taches = Storage.charger(CLE, []);
let idEnEdition = null;
let drag = null;

const matrice = document.getElementById("matrice");
const calque = document.getElementById("calque-vignettes");
const matriceVide = document.getElementById("matrice-vide");
const listeTaches = document.getElementById("liste-taches");
const formulaire = document.getElementById("formulaire-tache");
const champTitre = document.getElementById("champ-titre");
const champImportance = document.getElementById("champ-importance");
const champUrgence = document.getElementById("champ-urgence");
const valeurImportance = document.getElementById("valeur-importance");
const valeurUrgence = document.getElementById("valeur-urgence");
const titreFormulaire = document.getElementById("titre-formulaire");
const boutonValider = document.getElementById("bouton-valider");
const boutonAnnuler = document.getElementById("bouton-annuler");
const boutonPurge = document.getElementById("bouton-purge");

/* Marges pour que les vignettes (centrées sur leur point) restent lisibles
   dans la matrice, y compris aux scores extrêmes. */
function margeX() { return matrice.clientWidth < 500 ? 58 : 72; }
function margeY() { return 32; }

function sauvegarder() { Storage.sauvegarder(CLE, taches); }

function borner(v) { return Math.min(20, Math.max(0, v)); }

function quadrantDe(t) {
  if (t.importance >= SEUIL) return t.urgence >= SEUIL ? "faire" : "planifier";
  return t.urgence >= SEUIL ? "deleguer" : "abandonner";
}

function nouvelId() {
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* --- Rendu --- */

function render() {
  renderMatrice();
  renderListe();
}

function positionner(el, t) {
  const l = matrice.clientWidth;
  const h = matrice.clientHeight;
  const mx = margeX();
  const my = margeY();
  el.style.left = mx + (t.urgence / 20) * (l - 2 * mx) + "px";
  el.style.top = h - my - (t.importance / 20) * (h - 2 * my) + "px";
}

function classesVignette(t) {
  return "vignette q-" + quadrantDe(t) + (t.faite ? " faite" : "");
}

function texteScores(t) {
  return "I " + Math.round(t.importance) + " · U " + Math.round(t.urgence);
}

function renderMatrice() {
  calque.innerHTML = "";
  matriceVide.hidden = taches.length > 0;
  for (const t of taches) {
    const v = document.createElement("div");
    v.className = classesVignette(t);
    v.dataset.id = t.id;

    const titre = document.createElement("span");
    titre.className = "vignette-titre";
    titre.textContent = t.titre;
    const scores = document.createElement("span");
    scores.className = "vignette-scores";
    scores.textContent = texteScores(t);

    v.append(titre, scores);
    positionner(v, t);
    v.addEventListener("pointerdown", surPointerDown);
    calque.appendChild(v);
  }

  const nbAbandon = taches.filter((t) => quadrantDe(t) === "abandonner").length;
  boutonPurge.disabled = nbAbandon === 0;
  boutonPurge.textContent =
    "🗑 Tout supprimer" + (nbAbandon ? " (" + nbAbandon + ")" : "");
}

function renderListe() {
  listeTaches.innerHTML = "";
  const triees = [...taches].sort(
    (a, b) => (a.faite - b.faite) ||
      (b.importance + b.urgence) - (a.importance + a.urgence)
  );
  for (const t of triees) {
    const li = document.createElement("li");
    li.className = "tache" + (t.faite ? " faite" : "");

    const caseFaite = document.createElement("input");
    caseFaite.type = "checkbox";
    caseFaite.checked = t.faite;
    caseFaite.title = "Marquer comme faite";
    caseFaite.addEventListener("change", () => {
      t.faite = caseFaite.checked;
      sauvegarder();
      render();
    });

    const pastille = document.createElement("span");
    pastille.className = "pastille q-" + quadrantDe(t);

    const corps = document.createElement("span");
    corps.className = "tache-corps";
    const titre = document.createElement("span");
    titre.className = "tache-titre";
    titre.textContent = t.titre;
    const scores = document.createElement("span");
    scores.className = "tache-scores";
    scores.textContent = texteScores(t);
    corps.append(titre, scores);

    const boutonEditer = document.createElement("button");
    boutonEditer.type = "button";
    boutonEditer.textContent = "✎";
    boutonEditer.title = "Modifier";
    boutonEditer.addEventListener("click", () => editerTache(t.id));

    const boutonSupprimer = document.createElement("button");
    boutonSupprimer.type = "button";
    boutonSupprimer.textContent = "✕";
    boutonSupprimer.title = "Supprimer";
    boutonSupprimer.addEventListener("click", () => {
      if (confirm("Supprimer « " + t.titre + " » ?")) {
        taches = taches.filter((x) => x.id !== t.id);
        if (idEnEdition === t.id) reinitialiserFormulaire();
        sauvegarder();
        render();
      }
    });

    li.append(caseFaite, pastille, corps, boutonEditer, boutonSupprimer);
    listeTaches.appendChild(li);
  }
}

/* --- Glisser-déposer (pointer events : souris et tactile) --- */

function surPointerDown(e) {
  const el = e.currentTarget;
  const t = taches.find((x) => x.id === el.dataset.id);
  if (!t) return;
  drag = { el, t, x0: e.clientX, y0: e.clientY, deplace: false };
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
  drag.t.urgence = borner(((e.clientX - r.left - mx) / (r.width - 2 * mx)) * 20);
  drag.t.importance = borner(((r.height - my - (e.clientY - r.top)) / (r.height - 2 * my)) * 20);
  positionner(drag.el, drag.t);
  drag.el.className = classesVignette(drag.t) + " en-cours";
  drag.el.querySelector(".vignette-scores").textContent = texteScores(drag.t);
}

function surPointerUp() {
  if (!drag) return;
  const { el, t, deplace } = drag;
  el.classList.remove("en-cours");
  el.removeEventListener("pointermove", surPointerMove);
  el.removeEventListener("pointerup", surPointerUp);
  el.removeEventListener("pointercancel", surPointerUp);
  drag = null;
  if (deplace) {
    t.importance = Math.round(t.importance);
    t.urgence = Math.round(t.urgence);
    sauvegarder();
    render();
  } else {
    editerTache(t.id);
  }
}

/* --- Formulaire --- */

function editerTache(id) {
  const t = taches.find((x) => x.id === id);
  if (!t) return;
  idEnEdition = id;
  champTitre.value = t.titre;
  champImportance.value = t.importance;
  champUrgence.value = t.urgence;
  valeurImportance.textContent = t.importance;
  valeurUrgence.textContent = t.urgence;
  titreFormulaire.textContent = "Modifier la tâche";
  boutonValider.textContent = "Enregistrer";
  boutonAnnuler.hidden = false;
  champTitre.focus();
  formulaire.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function reinitialiserFormulaire() {
  idEnEdition = null;
  formulaire.reset();
  valeurImportance.textContent = champImportance.value;
  valeurUrgence.textContent = champUrgence.value;
  titreFormulaire.textContent = "Nouvelle tâche";
  boutonValider.textContent = "Ajouter";
  boutonAnnuler.hidden = true;
}

champImportance.addEventListener("input", () => {
  valeurImportance.textContent = champImportance.value;
});
champUrgence.addEventListener("input", () => {
  valeurUrgence.textContent = champUrgence.value;
});

formulaire.addEventListener("submit", (e) => {
  e.preventDefault();
  const titre = champTitre.value.trim();
  if (!titre) return;
  const importance = Number(champImportance.value);
  const urgence = Number(champUrgence.value);
  if (idEnEdition) {
    const t = taches.find((x) => x.id === idEnEdition);
    if (t) Object.assign(t, { titre, importance, urgence });
  } else {
    taches.push({ id: nouvelId(), titre, importance, urgence, faite: false });
  }
  sauvegarder();
  reinitialiserFormulaire();
  render();
});

boutonAnnuler.addEventListener("click", reinitialiserFormulaire);

/* Purge du quadrant « Abandonner » : les vignettes s'évaporent, puis on supprime. */
boutonPurge.addEventListener("click", () => {
  const ids = taches
    .filter((t) => quadrantDe(t) === "abandonner")
    .map((t) => t.id);
  if (!ids.length) return;
  boutonPurge.disabled = true;
  for (const el of calque.children) {
    if (ids.includes(el.dataset.id)) el.classList.add("purgee");
  }
  setTimeout(() => {
    taches = taches.filter((t) => !ids.includes(t.id));
    if (ids.includes(idEnEdition)) reinitialiserFormulaire();
    sauvegarder();
    render();
  }, 470);
});

window.addEventListener("resize", renderMatrice);

render();
