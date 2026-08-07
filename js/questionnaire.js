/*
 * Auto-questionnaires : rendu d'une liste d'affirmations à évaluer sur une
 * échelle de Likert (0–4) et calcul des totaux par clé.
 * Les items sont des questions originales inspirées des modèles — aucun item
 * de questionnaire commercial (TKI officiel, DISC édité…) n'est reproduit.
 */
const Questionnaire = {
  ECHELLE: ["Pas du tout", "Plutôt non", "Entre les deux", "Plutôt oui", "Tout à fait"],

  /* config : { conteneur, progres, bouton, items: [{ texte, cle }],
     surValidation(totaux) } — totaux[cle] = somme des réponses 0–4. */
  monter(config) {
    const reponses = new Array(config.items.length).fill(null);

    const majEtat = () => {
      const repondus = reponses.filter((r) => r !== null).length;
      config.progres.textContent = repondus + " / " + config.items.length;
      config.bouton.disabled = repondus !== config.items.length;
    };

    config.items.forEach((item, n) => {
      const bloc = document.createElement("fieldset");
      bloc.className = "item-quest";
      const legende = document.createElement("legend");
      legende.textContent = (n + 1) + ". " + item.texte;
      bloc.appendChild(legende);

      const pilules = document.createElement("div");
      pilules.className = "pilules-likert";
      this.ECHELLE.forEach((libelle, valeur) => {
        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "quest-" + n;
        radio.value = valeur;
        radio.addEventListener("change", () => {
          reponses[n] = valeur;
          majEtat();
        });
        const span = document.createElement("span");
        span.textContent = libelle;
        label.append(radio, span);
        pilules.appendChild(label);
      });
      bloc.appendChild(pilules);
      config.conteneur.appendChild(bloc);
    });

    config.bouton.addEventListener("click", () => {
      const totaux = {};
      for (const [n, item] of config.items.entries()) {
        totaux[item.cle] = (totaux[item.cle] || 0) + reponses[n];
      }
      config.surValidation(totaux);
    });

    majEtat();
  },
};
