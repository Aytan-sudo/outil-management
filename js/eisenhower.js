/*
 * Matrice d'Eisenhower.
 * Matrice 2D (moteur commun js/matrice.js) : x = urgence, y = importance.
 * Mode 3D expérimental : troisième axe « charge de travail », cube en
 * projection orthographique (SVG maison), liste triée par priorité
 * ⚡ = urgence + importance + rapidité (20 − charge).
 */

const CLE = "eisenhower";
const CLE_MODE = "eisenhower-3d";
const SEUIL = 10;

let taches = Storage.charger(CLE, []);
for (const t of taches) {
  if (typeof t.charge !== "number") t.charge = 10;
}
let mode3d = Storage.charger(CLE_MODE, false) === true;

const matrice = document.getElementById("matrice");
const listeTaches = document.getElementById("liste-taches");
const boutonPurge = document.getElementById("bouton-purge");
const boutonMode3d = document.getElementById("bouton-mode3d");
const scene3d = document.getElementById("scene3d");
const cube3d = document.getElementById("cube3d");
const cubeVide = document.getElementById("cube-vide");
const ligneCharge = document.getElementById("ligne-charge");
const noteTri = document.getElementById("note-tri");

function sauvegarder() { Storage.sauvegarder(CLE, taches); }

function quadrantDe(t) {
  if (t.importance >= SEUIL) return t.urgence >= SEUIL ? "faire" : "planifier";
  return t.urgence >= SEUIL ? "deleguer" : "abandonner";
}

/* Score de tri du mode 3D : plus c'est urgent, important et vite fait,
   plus la tâche remonte. Maximum 60. */
function priorite(t) {
  return t.urgence + t.importance + (20 - t.charge);
}

function texteScores(t) {
  const base = "I " + Math.round(t.importance) + " · U " + Math.round(t.urgence);
  if (!mode3d) return base;
  return "⚡ " + Math.round(priorite(t)) + " · " + base +
    " · C " + Math.round(t.charge);
}

/* --- Rendu --- */

function render() {
  if (mode3d) renderCube();
  else matrice2d.render();
  renderListe();
}

const matrice2d = creerMatrice({
  matrice,
  calque: document.getElementById("calque-vignettes"),
  matriceVide: document.getElementById("matrice-vide"),
  proprieteX: "urgence",
  proprieteY: "importance",
  margeEtroite: 58,
  margeLarge: 72,
  objets: () => taches,
  classeVignette: (t) => "vignette q-" + quadrantDe(t) + (t.faite ? " faite" : ""),
  titreVignette: (t) => t.titre,
  texteScores,
  surDepot() { sauvegarder(); render(); },
  surClic(t) { editeur.editer(t); },
  apresRendu() {
    const nbAbandon = taches.filter((t) => quadrantDe(t) === "abandonner").length;
    boutonPurge.disabled = nbAbandon === 0;
    boutonPurge.textContent =
      "🗑 Tout supprimer" + (nbAbandon ? " (" + nbAbandon + ")" : "");
  },
});

function renderListe() {
  listeTaches.innerHTML = "";
  const triees = [...taches].sort(
    (a, b) => (a.faite - b.faite) ||
      (mode3d
        ? priorite(b) - priorite(a)
        : (b.importance + b.urgence) - (a.importance + a.urgence))
  );
  for (const t of triees) {
    const li = document.createElement("li");
    li.className = "ligne-fiche tache" + (t.faite ? " faite" : "");

    const caseFaite = document.createElement("input");
    caseFaite.type = "checkbox";
    caseFaite.checked = t.faite;
    caseFaite.title = "Marquer comme faite";
    caseFaite.addEventListener("change", () => {
      t.faite = caseFaite.checked;
      sauvegarder();
      render();
    });

    li.append(
      caseFaite,
      elementPastille("q-" + quadrantDe(t)),
      corpsFiche(t.titre, texteScores(t)),
      boutonIcone("✎", "Modifier", () => editeur.editer(t)),
      boutonIcone("✕", "Supprimer", confirmerSuppression(t.titre, () => {
        taches = taches.filter((x) => x.id !== t.id);
        editeur.annulerEditionDe(t.id);
        sauvegarder();
        render();
      }))
    );
    listeTaches.appendChild(li);
  }
}

/* --- Formulaire --- */

const editeur = creerEditeur({
  formulaire: document.getElementById("formulaire-tache"),
  titreFormulaire: document.getElementById("titre-formulaire"),
  boutonValider: document.getElementById("bouton-valider"),
  boutonAnnuler: document.getElementById("bouton-annuler"),
  champTexte: document.getElementById("champ-titre"),
  proprieteTexte: "titre",
  curseurs: [
    { champ: document.getElementById("champ-importance"),
      sortie: document.getElementById("valeur-importance"), propriete: "importance" },
    { champ: document.getElementById("champ-urgence"),
      sortie: document.getElementById("valeur-urgence"), propriete: "urgence" },
    { champ: document.getElementById("champ-charge"),
      sortie: document.getElementById("valeur-charge"), propriete: "charge" },
  ],
  libelleNouveau: "Nouvelle tâche",
  libelleModifier: () => "Modifier la tâche",
  surValidation(valeurs, idEnEdition) {
    if (idEnEdition) {
      const t = taches.find((x) => x.id === idEnEdition);
      if (t) Object.assign(t, valeurs);
    } else {
      taches.push(Object.assign({ id: nouvelId("t"), faite: false }, valeurs));
    }
    sauvegarder();
    render();
  },
});

/* Purge du quadrant « Abandonner » : les vignettes s'évaporent, puis on supprime. */
boutonPurge.addEventListener("click", () => {
  const ids = taches
    .filter((t) => quadrantDe(t) === "abandonner")
    .map((t) => t.id);
  if (!ids.length) return;
  boutonPurge.disabled = true;
  for (const el of document.getElementById("calque-vignettes").children) {
    if (ids.includes(el.dataset.id)) el.classList.add("purgee");
  }
  setTimeout(() => {
    taches = taches.filter((t) => !ids.includes(t.id));
    if (ids.includes(editeur.idEnEdition)) editeur.reinitialiser();
    sauvegarder();
    render();
  }, 470);
});

/* --- Mode 3D : cube en projection orthographique --- */

const SVG_NS = "http://www.w3.org/2000/svg";
const COULEURS_QUADRANT = {
  faire: "#d03b3b",
  planifier: "#2a78d6",
  deleguer: "#eda100",
  abandonner: "#898781",
};
const CX3D = 320;
const CY3D = 280;
const ECHELLE_3D = 14.5;

/* Angles de vue, modifiés par glisser-tourner (non persistés). */
const vue = { lacet: 0.62, tangage: 0.42 };

/* (urgence, importance, charge) → point écran + profondeur.
   Lacet autour de l'axe vertical, puis tangage autour de l'axe écran-x. */
function projeter(u, i, c) {
  const px = u - 10;
  const py = i - 10;
  const pz = c - 10;
  const cl = Math.cos(vue.lacet);
  const sl = Math.sin(vue.lacet);
  const ct = Math.cos(vue.tangage);
  const st = Math.sin(vue.tangage);
  const x1 = px * cl + pz * sl;
  const z1 = -px * sl + pz * cl;
  const y2 = py * ct - z1 * st;
  const prof = py * st + z1 * ct;
  return { x: CX3D + x1 * ECHELLE_3D, y: CY3D - y2 * ECHELLE_3D, prof };
}

function svgElement(nom, attrs) {
  const el = document.createElementNS(SVG_NS, nom);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function ligne3d(a, b, attrs) {
  const p1 = projeter(...a);
  const p2 = projeter(...b);
  return svgElement("line", Object.assign(
    { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }, attrs
  ));
}

function texte3d(pos, contenu, attrs) {
  const p = projeter(...pos);
  const el = svgElement("text", Object.assign(
    { x: p.x, y: p.y, "text-anchor": "middle", class: "texte-3d" }, attrs || {}
  ));
  el.textContent = contenu;
  return el;
}

const ARETES_CUBE = (() => {
  const coins = [];
  for (const u of [0, 20]) for (const i of [0, 20]) for (const c of [0, 20]) {
    coins.push([u, i, c]);
  }
  const aretes = [];
  for (let a = 0; a < coins.length; a++) {
    for (let b = a + 1; b < coins.length; b++) {
      const diff = coins[a].filter((v, k) => v !== coins[b][k]).length;
      if (diff === 1) aretes.push([coins[a], coins[b]]);
    }
  }
  return aretes;
})();

function renderCube() {
  cube3d.innerHTML = "";
  cubeVide.hidden = taches.length > 0;

  /* Arêtes : les plus proches du regard un peu plus marquées. */
  for (const [a, b] of ARETES_CUBE) {
    const prof = (projeter(...a).prof + projeter(...b).prof) / 2;
    cube3d.appendChild(ligne3d(a, b, {
      stroke: prof > 0 ? "#b7bdc4" : "#dde1e5",
      "stroke-width": prof > 0 ? 1.5 : 1,
    }));
  }

  /* Diagonale de priorité : du coin « à faire d'abord » (urgent, important,
     vite fait) au coin opposé. */
  cube3d.appendChild(ligne3d([20, 20, 0], [0, 0, 20], {
    stroke: "#2563eb",
    "stroke-width": 1.5,
    "stroke-dasharray": "6 5",
    opacity: 0.45,
  }));
  cube3d.appendChild(texte3d([22.5, 22.5, -2.5], "⚡ à faire d'abord",
    { class: "texte-3d texte-priorite" }));
  cube3d.appendChild(texte3d([-2.5, -2.5, 22.5], "🐌 plus tard",
    { class: "texte-3d texte-priorite" }));

  /* Étiquettes des trois axes, au-delà des arêtes issues de l'origine. */
  cube3d.appendChild(texte3d([25, 0, 0], "Urgence"));
  cube3d.appendChild(texte3d([0, 24, 0], "Importance"));
  cube3d.appendChild(texte3d([0, 0, 25], "Charge"));

  /* Tâches, dessinées du plus loin au plus près. */
  const projetees = taches
    .map((t) => ({ t, p: projeter(t.urgence, t.importance, t.charge) }))
    .sort((a, b) => a.p.prof - b.p.prof);

  for (const { t, p } of projetees) {
    const groupe = svgElement("g", {
      class: "point3d" + (t.faite ? " faite" : ""),
    });
    const rayon = Math.max(4, 8 + p.prof * 0.22);
    groupe.appendChild(svgElement("circle", {
      cx: p.x,
      cy: p.y,
      r: rayon,
      fill: COULEURS_QUADRANT[quadrantDe(t)],
    }));
    const etiquette = svgElement("text", {
      x: p.x,
      y: p.y - rayon - 5,
      "text-anchor": "middle",
      class: "titre-3d",
    });
    etiquette.textContent =
      t.titre.length > 16 ? t.titre.slice(0, 15) + "…" : t.titre;
    groupe.appendChild(etiquette);
    /* stopPropagation : ne pas déclencher la rotation du cube. */
    groupe.addEventListener("pointerdown", (e) => e.stopPropagation());
    groupe.addEventListener("click", () => editeur.editer(t));
    cube3d.appendChild(groupe);
  }
}

/* Rotation du cube au pointeur (souris et tactile). */
let rotation = null;

cube3d.addEventListener("pointerdown", (e) => {
  rotation = {
    x0: e.clientX,
    y0: e.clientY,
    lacet0: vue.lacet,
    tangage0: vue.tangage,
  };
  cube3d.setPointerCapture(e.pointerId);
  e.preventDefault();
});
cube3d.addEventListener("pointermove", (e) => {
  if (!rotation) return;
  vue.lacet = rotation.lacet0 + (e.clientX - rotation.x0) * 0.008;
  vue.tangage = Math.max(-1.35, Math.min(1.35,
    rotation.tangage0 + (e.clientY - rotation.y0) * 0.008));
  renderCube();
});
cube3d.addEventListener("pointerup", () => { rotation = null; });
cube3d.addEventListener("pointercancel", () => { rotation = null; });

/* --- Bascule 2D / 3D --- */

function appliquerMode() {
  matrice.hidden = mode3d;
  scene3d.hidden = !mode3d;
  ligneCharge.hidden = !mode3d;
  noteTri.hidden = !mode3d;
  boutonMode3d.textContent = mode3d ? "▦ Mode 2D" : "🧊 Mode 3D";
  boutonMode3d.title = mode3d
    ? "Revenir à la matrice classique"
    : "Essayer le cube 3D (expérimental) : l'axe charge de travail en plus";
  render();
}

boutonMode3d.addEventListener("click", () => {
  mode3d = !mode3d;
  Storage.sauvegarder(CLE_MODE, mode3d);
  appliquerMode();
});

appliquerMode();
