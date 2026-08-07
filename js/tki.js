/*
 * Modèle TKI : saisie des scores personnels et assistant de situation.
 * Recommandation selon le double souci enjeu (assertivité) × relation
 * (coopération), modulé par l'urgence.
 */

const CLE = "tki";

const NOMS = {
  competition: "Rivaliser",
  collaboration: "Collaborer",
  compromis: "Chercher un compromis",
  evitement: "Éviter",
  accommodation: "Céder",
};

const DEFAUT = {
  scores: {
    competition: 0,
    collaboration: 0,
    compromis: 0,
    evitement: 0,
    accommodation: 0,
  },
  situation: { enjeu: "fort", relation: "forte", temps: "temps" },
};

const memorise = Storage.charger(CLE, {});
const etat = {
  scores: Object.assign({}, DEFAUT.scores, memorise.scores),
  situation: Object.assign({}, DEFAUT.situation, memorise.situation),
};

function sauvegarder() { Storage.sauvegarder(CLE, etat); }

/* --- Recommandation --- */

function recommander(s) {
  if (s.enjeu === "fort" && s.relation === "forte") {
    return s.temps === "urgent" ? "compromis" : "collaboration";
  }
  if (s.enjeu === "fort") return "competition";
  if (s.relation === "forte") return "accommodation";
  return "evitement";
}

function explication(mode, s) {
  switch (mode) {
    case "collaboration":
      return "Enjeu fort et relation importante : cherchez la solution " +
        "gagnant-gagnant. Cela demande du temps — vous l'avez.";
    case "compromis":
      return "Enjeu fort et relation importante, mais le temps presse : " +
        "visez un accord acceptable pour les deux parties, quitte à " +
        "approfondir à froid plus tard.";
    case "competition":
      return s.temps === "urgent"
        ? "Enjeu fort, relation secondaire et urgence : tranchez, décidez, " +
          "assumez. C'est votre rôle."
        : "Enjeu fort, relation secondaire : défendez fermement votre " +
          "position, la négociation reste ouverte.";
    case "accommodation":
      return "L'enjeu est faible pour vous mais la relation compte : céder " +
        "ici est un investissement dans la relation, pas une défaite.";
    case "evitement":
      return "Enjeu faible, relation secondaire : ne pas traiter ce conflit " +
        "est parfaitement rationnel. Gardez votre énergie pour ce qui compte.";
  }
}

function notePersonnelle(mode) {
  const valeurs = Object.values(etat.scores);
  if (!valeurs.some((v) => v > 0)) return "";
  const score = etat.scores[mode];
  const max = Math.max(...valeurs);
  const min = Math.min(...valeurs);
  if (score === max) {
    return "Bonne nouvelle : c'est votre mode dominant (" + score +
      "/12), vous y viendrez naturellement.";
  }
  if (score === min) {
    return "Vigilance : c'est votre mode le moins naturel (" + score +
      "/12) — préparez-vous consciemment avant l'échange.";
  }
  return "Votre score sur ce mode : " + score + "/12.";
}

/* --- Rendu --- */

const profilTki = document.getElementById("profil-tki");
const resultatMode = document.getElementById("resultat-mode");
const resultatExplication = document.getElementById("resultat-explication");
const resultatNote = document.getElementById("resultat-note");

function majProfil() {
  const entrees = Object.entries(etat.scores);
  if (!entrees.some(([, v]) => v > 0)) {
    profilTki.textContent =
      "Renseignez vos scores pour voir votre profil et personnaliser les conseils.";
    return;
  }
  const max = Math.max(...entrees.map(([, v]) => v));
  const min = Math.min(...entrees.map(([, v]) => v));
  const dominants = entrees.filter(([, v]) => v === max).map(([m]) => NOMS[m]);
  const moindres = entrees.filter(([, v]) => v === min).map(([m]) => NOMS[m]);
  profilTki.innerHTML = "";
  const ligne1 = document.createElement("span");
  ligne1.innerHTML = "Mode dominant : <strong></strong> (" + max + "/12)";
  ligne1.querySelector("strong").textContent = dominants.join(", ");
  const ligne2 = document.createElement("span");
  ligne2.innerHTML = " · le moins mobilisé : <strong></strong> (" + min + "/12)";
  ligne2.querySelector("strong").textContent = moindres.join(", ");
  profilTki.append(ligne1, ligne2);
}

function majResultat() {
  const mode = recommander(etat.situation);
  resultatMode.textContent = "→ " + NOMS[mode];
  resultatExplication.textContent = explication(mode, etat.situation);
  resultatNote.textContent = notePersonnelle(mode);

  const valeurs = Object.values(etat.scores);
  const max = Math.max(...valeurs);
  for (const m of Object.keys(NOMS)) {
    const groupe = document.getElementById("mode-" + m);
    groupe.classList.toggle("recommande", m === mode);
    groupe.classList.toggle("dominant", max > 0 && etat.scores[m] === max);
  }
}

/* --- Branchements --- */

for (const mode of Object.keys(NOMS)) {
  const champ = document.getElementById("score-" + mode);
  const sortie = document.getElementById("sortie-" + mode);
  champ.value = etat.scores[mode];
  sortie.textContent = etat.scores[mode];
  champ.addEventListener("input", () => {
    etat.scores[mode] = Number(champ.value);
    sortie.textContent = champ.value;
    sauvegarder();
    majProfil();
    majResultat();
  });
}

/* --- Auto-questionnaire ---
   Trois affirmations par mode (0–4 chacune), total ramené sur 0–12 comme les
   curseurs. Items originaux, entrelacés pour ne pas trahir leur mode. */

const ITEMS_TKI = [
  { cle: "competition", texte: "Quand je suis convaincu d'avoir raison, je défends ma position jusqu'au bout, même si l'échange devient tendu." },
  { cle: "collaboration", texte: "Face à un désaccord, je cherche d'abord à comprendre les besoins réels de l'autre avant de proposer une solution." },
  { cle: "compromis", texte: "Couper la poire en deux me semble souvent la façon la plus efficace de sortir d'un blocage." },
  { cle: "evitement", texte: "Je laisse volontiers passer l'orage avant d'aborder un sujet qui fâche." },
  { cle: "accommodation", texte: "Je préfère céder plutôt que d'abîmer une relation qui compte pour moi." },
  { cle: "competition", texte: "Dans une négociation, je cherche d'abord à faire adopter ma solution." },
  { cle: "collaboration", texte: "Je suis prêt à passer du temps pour construire une solution qui convienne vraiment aux deux parties." },
  { cle: "compromis", texte: "Je lâche une partie de mes demandes sans difficulté si l'autre en fait autant." },
  { cle: "evitement", texte: "Certains désaccords ne méritent tout simplement pas qu'on s'y attarde." },
  { cle: "accommodation", texte: "Les souhaits des autres passent souvent avant les miens." },
  { cle: "competition", texte: "Trancher vite, quitte à déplaire, ne me pose pas de problème." },
  { cle: "collaboration", texte: "Un conflit bien mené est souvent l'occasion d'améliorer notre façon de travailler ensemble." },
  { cle: "compromis", texte: "Un accord imparfait mais rapide vaut souvent mieux qu'une longue négociation." },
  { cle: "evitement", texte: "Je remets volontiers une discussion difficile à plus tard." },
  { cle: "accommodation", texte: "Pour apaiser une tension, je fais facilement le premier pas, même si j'y perds un peu." },
];

const detailsQuestionnaire = document.getElementById("questionnaire-tki");

Questionnaire.monter({
  conteneur: document.getElementById("items-tki"),
  progres: document.getElementById("progres-tki"),
  bouton: document.getElementById("bouton-quest-tki"),
  items: ITEMS_TKI,
  surValidation(totaux) {
    for (const mode of Object.keys(NOMS)) {
      etat.scores[mode] = totaux[mode];
      const champ = document.getElementById("score-" + mode);
      const sortie = document.getElementById("sortie-" + mode);
      champ.value = totaux[mode];
      sortie.textContent = totaux[mode];
    }
    sauvegarder();
    majProfil();
    majResultat();
    detailsQuestionnaire.open = false;
    profilTki.scrollIntoView({ behavior: "smooth", block: "nearest" });
  },
});

for (const nom of ["enjeu", "relation", "temps"]) {
  for (const radio of document.querySelectorAll('input[name="' + nom + '"]')) {
    radio.checked = radio.value === etat.situation[nom];
    radio.addEventListener("change", () => {
      etat.situation[nom] = radio.value;
      sauvegarder();
      majResultat();
    });
  }
}

majProfil();
majResultat();
