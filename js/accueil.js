/*
 * Accueil : export / import JSON de toutes les données.
 * Sert de sauvegarde (le localStorage peut être effacé par un nettoyage du
 * navigateur) et de transfert entre appareils (Mac ↔ téléphone).
 */

const boutonExport = document.getElementById("bouton-export");
const boutonImport = document.getElementById("bouton-import");
const champImport = document.getElementById("champ-import");
const messageDonnees = document.getElementById("message-donnees");

let effacementMessage = null;

function afficherMessage(texte, erreur) {
  messageDonnees.textContent = texte;
  messageDonnees.classList.toggle("erreur", Boolean(erreur));
  clearTimeout(effacementMessage);
  effacementMessage = setTimeout(() => {
    messageDonnees.textContent = "";
  }, 6000);
}

boutonExport.addEventListener("click", () => {
  const donnees = Storage.exporterTout();
  const nb = Object.keys(donnees).length;
  if (!nb) {
    afficherMessage("Rien à exporter pour l'instant : les outils sont vides.", true);
    return;
  }
  const contenu = {
    application: "outil-management",
    version: 1,
    exporteLe: new Date().toISOString(),
    donnees,
  };
  const blob = new Blob([JSON.stringify(contenu, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "outils-management-" + contenu.exporteLe.slice(0, 10) + ".json";
  lien.click();
  URL.revokeObjectURL(url);
  afficherMessage("Sauvegarde téléchargée (" + nb + " outil" + (nb > 1 ? "s" : "") + ").");
});

boutonImport.addEventListener("click", () => champImport.click());

champImport.addEventListener("change", async () => {
  const fichier = champImport.files[0];
  champImport.value = "";
  if (!fichier) return;

  let contenu;
  try {
    contenu = JSON.parse(await fichier.text());
  } catch {
    afficherMessage("Ce fichier n'est pas un JSON lisible.", true);
    return;
  }
  const donnees = contenu && contenu.application === "outil-management" && contenu.donnees;
  if (!donnees || typeof donnees !== "object") {
    afficherMessage("Ce fichier ne ressemble pas à une sauvegarde des outils.", true);
    return;
  }
  const nb = Object.keys(donnees).length;
  if (!nb) {
    afficherMessage("La sauvegarde est vide, rien à importer.", true);
    return;
  }
  const ok = confirm(
    "Importer cette sauvegarde ?\n\nLes données actuelles de " + nb +
    " outil" + (nb > 1 ? "s" : "") + " seront remplacées par celles du fichier."
  );
  if (!ok) return;
  Storage.importerTout(donnees);
  afficherMessage("Import réussi — " + nb + " outil" + (nb > 1 ? "s" : "") + " restauré" +
    (nb > 1 ? "s" : "") + ". 🎉");
});
