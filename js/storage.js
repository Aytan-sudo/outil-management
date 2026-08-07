/*
 * Accès centralisé au localStorage.
 * Toutes les pages passent par ces fonctions — jamais localStorage directement.
 */
const Storage = {
  PREFIXE: "om:",

  charger(cle, valeurParDefaut) {
    try {
      const brut = localStorage.getItem(this.PREFIXE + cle);
      return brut === null ? valeurParDefaut : JSON.parse(brut);
    } catch {
      return valeurParDefaut;
    }
  },

  sauvegarder(cle, valeur) {
    localStorage.setItem(this.PREFIXE + cle, JSON.stringify(valeur));
  },

  supprimer(cle) {
    localStorage.removeItem(this.PREFIXE + cle);
  },

  /* Toutes les données de l'application, sans le préfixe, pour l'export. */
  exporterTout() {
    const donnees = {};
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i);
      if (!cle.startsWith(this.PREFIXE)) continue;
      try {
        donnees[cle.slice(this.PREFIXE.length)] = JSON.parse(localStorage.getItem(cle));
      } catch {
        /* entrée illisible : on ne l'exporte pas */
      }
    }
    return donnees;
  },

  /* Écrit chaque clé d'une sauvegarde ; renvoie le nombre de clés importées. */
  importerTout(donnees) {
    let n = 0;
    for (const [cle, valeur] of Object.entries(donnees)) {
      this.sauvegarder(cle, valeur);
      n++;
    }
    return n;
  },
};
