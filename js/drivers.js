/*
 * Les cinq drivers (messages contraignants) de l'analyse transactionnelle.
 * Saisie des scores, profil trié, mise en avant du driver dominant et de
 * sa « permission » (l'antidote).
 */

const CLE = "drivers";

const DRIVERS = [
  {
    id: "sois-parfait",
    nom: "Sois parfait(e)",
    croyance: "« Je n'ai pas droit à l'erreur. »",
    forces: "Rigueur, qualité, fiabilité, sens du détail.",
    stress: "Perfectionnisme paralysant, contrôle excessif, difficulté à déléguer.",
    permission: "Tu as le droit à l'erreur — le « suffisamment bon » suffit.",
  },
  {
    id: "sois-fort",
    nom: "Sois fort(e)",
    croyance: "« Montrer ses émotions est une faiblesse. »",
    forces: "Sang-froid, solidité dans la tempête, autonomie.",
    stress: "Isolement, ne demande jamais d'aide, paraît froid ou distant.",
    permission: "Tu peux exprimer tes besoins et demander de l'aide.",
  },
  {
    id: "fais-plaisir",
    nom: "Fais plaisir",
    croyance: "« Je ne dois décevoir personne. »",
    forces: "Empathie, qualité relationnelle, sens du collectif.",
    stress: "Difficulté à dire non, suradaptation, rancune accumulée.",
    permission: "Tu peux penser à toi et dire non — on t'apprécie pour ce que tu es.",
  },
  {
    id: "fais-des-efforts",
    nom: "Fais des efforts",
    croyance: "« Ma valeur vient de l'effort, pas du résultat. »",
    forces: "Persévérance, engagement, courage devant la difficulté.",
    stress: "Complique les choses, commence beaucoup, finit peu.",
    permission: "Tu peux réussir simplement — terminer, c'est suffisant.",
  },
  {
    id: "depeche-toi",
    nom: "Dépêche-toi",
    croyance: "« Je dois aller vite pour être efficace. »",
    forces: "Réactivité, énergie, capacité à absorber la charge.",
    stress: "Précipitation, erreurs, impatience avec les plus lents.",
    permission: "Prends ton temps — bien faire prend le temps que ça prend.",
  },
];

const scores = Object.assign(
  Object.fromEntries(DRIVERS.map((d) => [d.id, 0])),
  Storage.charger(CLE, {})
);

function sauvegarder() { Storage.sauvegarder(CLE, scores); }

/* --- Cartes --- */

const grille = document.getElementById("grille-drivers");

for (const d of DRIVERS) {
  const carte = document.createElement("article");
  carte.className = "carte-section carte-driver";
  carte.id = "carte-" + d.id;

  const titre = document.createElement("h2");
  titre.textContent = d.nom;
  const badge = document.createElement("span");
  badge.className = "badge-dominant";
  badge.textContent = "dominant";
  titre.appendChild(badge);

  const croyance = document.createElement("p");
  croyance.className = "croyance";
  croyance.textContent = d.croyance;

  const ligneScore = document.createElement("label");
  ligneScore.className = "ligne-score";
  ligneScore.textContent = "Mon score";
  const champ = document.createElement("input");
  champ.type = "range";
  champ.min = "0";
  champ.max = "10";
  champ.value = scores[d.id];
  const sortie = document.createElement("output");
  sortie.textContent = scores[d.id];
  ligneScore.append(champ, sortie);
  champ.addEventListener("input", () => {
    scores[d.id] = Number(champ.value);
    sortie.textContent = champ.value;
    sauvegarder();
    majProfil();
  });

  const detail = document.createElement("dl");
  detail.innerHTML =
    "<dt>Forces</dt><dd></dd>" +
    "<dt>Sous stress</dt><dd></dd>" +
    "<dt>Permission</dt><dd class='permission'></dd>";
  const dd = detail.querySelectorAll("dd");
  dd[0].textContent = d.forces;
  dd[1].textContent = d.stress;
  dd[2].textContent = d.permission;

  carte.append(titre, croyance, ligneScore, detail);
  grille.appendChild(carte);
}

/* --- Profil --- */

const barres = document.getElementById("barres-profil");
const encartDominant = document.getElementById("encart-dominant");
const dominantTitre = document.getElementById("dominant-titre");
const dominantPermission = document.getElementById("dominant-permission");

function majProfil() {
  barres.innerHTML = "";
  const tries = [...DRIVERS].sort((a, b) => scores[b.id] - scores[a.id]);
  const max = Math.max(...Object.values(scores));

  for (const d of tries) {
    const ligne = document.createElement("div");
    ligne.className = "ligne-barre";

    const nom = document.createElement("span");
    nom.className = "barre-nom";
    nom.textContent = d.nom;

    const piste = document.createElement("span");
    piste.className = "barre-piste";
    const remplissage = document.createElement("span");
    remplissage.className = "barre-remplissage";
    remplissage.style.width = (scores[d.id] / 10) * 100 + "%";
    piste.appendChild(remplissage);

    const valeur = document.createElement("span");
    valeur.className = "barre-valeur";
    valeur.textContent = scores[d.id];

    ligne.append(nom, piste, valeur);
    barres.appendChild(ligne);
  }

  const dominants = DRIVERS.filter((d) => max > 0 && scores[d.id] === max);
  encartDominant.hidden = dominants.length === 0;
  for (const d of DRIVERS) {
    document
      .getElementById("carte-" + d.id)
      .classList.toggle("dominant", max > 0 && scores[d.id] === max);
  }
  if (dominants.length) {
    dominantTitre.textContent =
      (dominants.length > 1 ? "Drivers dominants : " : "Driver dominant : ") +
      dominants.map((d) => d.nom).join(" et ");
    dominantPermission.textContent =
      "Permission : " + dominants.map((d) => d.permission).join(" — ");
  }
}

majProfil();
