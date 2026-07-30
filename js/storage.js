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
};
