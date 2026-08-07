/*
 * Aides communes aux fiches : formulaire d'ajout/édition (champ texte +
 * curseurs liés à leur sortie) et briques des lignes de liste (pastille,
 * corps nom/scores, boutons ✎ ✕ avec confirmation).
 * Utilisées par Eisenhower, conflits, DISC et SMART.
 */

function nouvelId(prefixe) {
  return prefixe + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/*
 * config :
 *   formulaire, titreFormulaire, boutonValider, boutonAnnuler, champTexte
 *   proprieteTexte                 propriété du champ texte ("titre", "nom")
 *   curseurs                       [{ champ, sortie, propriete }]
 *   libelleNouveau, libelleModifier(objet)
 *   surValidation(valeurs, idEnEdition)   push/assign + save + render côté outil
 *   apresReinitialisation()        optionnel
 */
function creerEditeur(config) {
  let idEnEdition = null;

  for (const c of config.curseurs) {
    c.champ.addEventListener("input", () => {
      c.sortie.textContent = c.champ.value;
    });
  }

  function reinitialiser() {
    idEnEdition = null;
    config.formulaire.reset();
    for (const c of config.curseurs) c.sortie.textContent = c.champ.value;
    config.titreFormulaire.textContent = config.libelleNouveau;
    config.boutonValider.textContent = "Ajouter";
    config.boutonAnnuler.hidden = true;
    if (config.apresReinitialisation) config.apresReinitialisation();
  }

  function editer(objet) {
    idEnEdition = objet.id;
    config.champTexte.value = objet[config.proprieteTexte];
    for (const c of config.curseurs) {
      c.champ.value = objet[c.propriete];
      c.sortie.textContent = objet[c.propriete];
    }
    config.titreFormulaire.textContent = config.libelleModifier(objet);
    config.boutonValider.textContent = "Enregistrer";
    config.boutonAnnuler.hidden = false;
    config.champTexte.focus();
    config.formulaire.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  config.formulaire.addEventListener("submit", (e) => {
    e.preventDefault();
    const texte = config.champTexte.value.trim();
    if (!texte) return;
    const valeurs = { [config.proprieteTexte]: texte };
    for (const c of config.curseurs) valeurs[c.propriete] = Number(c.champ.value);
    config.surValidation(valeurs, idEnEdition);
    reinitialiser();
  });

  config.boutonAnnuler.addEventListener("click", reinitialiser);

  return {
    editer,
    reinitialiser,
    get idEnEdition() { return idEnEdition; },
    annulerEditionDe(id) { if (idEnEdition === id) reinitialiser(); },
  };
}

/* --- Briques des lignes de liste --- */

function boutonIcone(symbole, titre, action) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = symbole;
  b.title = titre;
  b.addEventListener("click", action);
  return b;
}

function confirmerSuppression(nom, action) {
  return () => {
    if (confirm("Supprimer « " + nom + " » ?")) action();
  };
}

function elementPastille(classes, titre) {
  const s = document.createElement("span");
  s.className = "pastille " + classes;
  if (titre) s.title = titre;
  return s;
}

function corpsFiche(nom, scores) {
  const corps = document.createElement("span");
  corps.className = "fiche-corps";
  const n = document.createElement("span");
  n.className = "fiche-nom";
  n.textContent = nom;
  const s = document.createElement("span");
  s.className = "fiche-scores";
  s.textContent = scores;
  corps.append(n, s);
  return corps;
}
