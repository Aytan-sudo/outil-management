/*
 * Moteur commun des matrices à vignettes glissables (Eisenhower, conflits).
 * Les vignettes sont positionnées par deux scores 0–20 ; les glisser met à
 * jour les scores, un clic sans déplacement ouvre l'édition.
 *
 * config :
 *   matrice, calque, matriceVide   éléments DOM
 *   proprieteX, proprieteY         noms des scores (ex. "urgence", "importance")
 *   margeEtroite, margeLarge       marge horizontale (px) selon la largeur
 *   objets()                       liste courante des objets à afficher
 *   classeVignette(o)              classes CSS de la vignette
 *   titreVignette(o), texteScores(o)
 *   surDepot()                     après un glisser terminé (scores arrondis)
 *   surClic(o)                     clic sans déplacement
 *   apresRendu()                   optionnel, en fin de rendu
 */
function creerMatrice(config) {
  const { matrice, calque, matriceVide } = config;
  const MARGE_Y = 32;
  let drag = null;

  function margeX() {
    return matrice.clientWidth < 500 ? config.margeEtroite : config.margeLarge;
  }

  function borner(v) { return Math.min(20, Math.max(0, v)); }

  function positionner(el, o) {
    const l = matrice.clientWidth;
    const h = matrice.clientHeight;
    const mx = margeX();
    el.style.left = mx + (o[config.proprieteX] / 20) * (l - 2 * mx) + "px";
    el.style.top = h - MARGE_Y - (o[config.proprieteY] / 20) * (h - 2 * MARGE_Y) + "px";
  }

  function render() {
    const objets = config.objets();
    calque.innerHTML = "";
    matriceVide.hidden = objets.length > 0;
    for (const o of objets) {
      const v = document.createElement("div");
      v.className = config.classeVignette(o);
      v.dataset.id = o.id;

      const titre = document.createElement("span");
      titre.className = "vignette-titre";
      titre.textContent = config.titreVignette(o);
      const scores = document.createElement("span");
      scores.className = "vignette-scores";
      scores.textContent = config.texteScores(o);

      v.append(titre, scores);
      positionner(v, o);
      v.addEventListener("pointerdown", surPointerDown);
      calque.appendChild(v);
    }
    if (config.apresRendu) config.apresRendu();
  }

  /* Glisser-déposer (pointer events : souris et tactile). */

  function surPointerDown(e) {
    const el = e.currentTarget;
    const o = config.objets().find((x) => x.id === el.dataset.id);
    if (!o) return;
    drag = { el, o, x0: e.clientX, y0: e.clientY, deplace: false };
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
    drag.o[config.proprieteX] =
      borner(((e.clientX - r.left - mx) / (r.width - 2 * mx)) * 20);
    drag.o[config.proprieteY] =
      borner(((r.height - MARGE_Y - (e.clientY - r.top)) / (r.height - 2 * MARGE_Y)) * 20);
    positionner(drag.el, drag.o);
    drag.el.className = config.classeVignette(drag.o) + " en-cours";
    drag.el.querySelector(".vignette-scores").textContent = config.texteScores(drag.o);
  }

  function surPointerUp() {
    if (!drag) return;
    const { el, o, deplace } = drag;
    el.classList.remove("en-cours");
    el.removeEventListener("pointermove", surPointerMove);
    el.removeEventListener("pointerup", surPointerUp);
    el.removeEventListener("pointercancel", surPointerUp);
    drag = null;
    if (deplace) {
      o[config.proprieteX] = Math.round(o[config.proprieteX]);
      o[config.proprieteY] = Math.round(o[config.proprieteY]);
      config.surDepot();
    } else {
      config.surClic(o);
    }
  }

  window.addEventListener("resize", render);

  return { render };
}
