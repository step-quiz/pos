/**
 * alumnes.js
 * ---------------------------------------------------------------
 * Aquí hi ha els grups classe i la llista d'alumnes de cadascun,
 * en l'ordre en què el professor els té a la seva pròpia llista
 * (per exemple, l'ordre alfabètic del full de qualificacions).
 *
 * Aquest fitxer NO conté on seu cada alumne (això és seients.js) ni
 * quan toca classe amb cada grup (això és horari.js). Separar-ho
 * permet que cada part es pugui regenerar independentment:
 *   - alta.html regenera aquest fitxer (alumnes.js) quan dones
 *     d'alta o actualitzes la llista d'un grup.
 *   - setup.html regenera seients.js quan assignes qui seu on.
 *   - horari.js el toques tu a mà, ja que gairebé no canvia.
 *
 * Cada alumne només té "id" (identificador únic i estable) i "nom"
 * (només el nom de pila, mai el cognom, tal com es mostra a la
 * interfície). Quan alta.html reemplaça la llista d'un grup, els id
 * es regeneren; per això cal tornar a fer setup.html dels seients
 * després de donar d'alta un grup de nou.
 * ---------------------------------------------------------------
 */

const GRUPS = {
  "1ESOA": {
    nom: "1r ESO A",
    alumnes: [
      { id: "1ESOA-01", nom: "Adam" },
      { id: "1ESOA-02", nom: "Alba" },
      { id: "1ESOA-03", nom: "Amina" },
      { id: "1ESOA-04", nom: "Arnau" },
      { id: "1ESOA-05", nom: "Berenguera" },
      { id: "1ESOA-06", nom: "Camila" },
      { id: "1ESOA-07", nom: "Carla" },
      { id: "1ESOA-08", nom: "Dani" },
      { id: "1ESOA-09", nom: "Elena" },
      { id: "1ESOA-10", nom: "Georgina" },
      { id: "1ESOA-11", nom: "Ignasi" },
      { id: "1ESOA-12", nom: "Kenji" },
      { id: "1ESOA-13", nom: "Leo" },
      { id: "1ESOA-14", nom: "Malak" },
      { id: "1ESOA-15", nom: "Marc" },
      { id: "1ESOA-16", nom: "Marti" },
      { id: "1ESOA-17", nom: "Mateo" },
      { id: "1ESOA-18", nom: "Nora" },
      { id: "1ESOA-19", nom: "Ona" },
      { id: "1ESOA-20", nom: "Otger" },
      { id: "1ESOA-21", nom: "Paula" },
      { id: "1ESOA-22", nom: "Pere" },
      { id: "1ESOA-23", nom: "Queralt" },
      { id: "1ESOA-24", nom: "Sana" },
      { id: "1ESOA-25", nom: "Thiago" },
      { id: "1ESOA-26", nom: "Valentina" },
      { id: "1ESOA-27", nom: "Youssef" }
    ]
  },

  "1ESOB": {
    nom: "1r ESO B",
    alumnes: [
      { id: "1ESOB-01", nom: "Abril" },
      { id: "1ESOB-02", nom: "Aina" },
      { id: "1ESOB-03", nom: "Ainhoa" },
      { id: "1ESOB-04", nom: "Andreu" },
      { id: "1ESOB-05", nom: "Cristina" },
      { id: "1ESOB-06", nom: "Ekhi" },
      { id: "1ESOB-07", nom: "Iris" },
      { id: "1ESOB-08", nom: "Judit" },
      { id: "1ESOB-09", nom: "Julia" },
      { id: "1ESOB-10", nom: "Laia" },
      { id: "1ESOB-11", nom: "Leila" },
      { id: "1ESOB-12", nom: "Marcel" },
      { id: "1ESOB-13", nom: "Nerea" },
      { id: "1ESOB-14", nom: "Neus" },
      { id: "1ESOB-15", nom: "Nil" },
      { id: "1ESOB-16", nom: "Noa" },
      { id: "1ESOB-17", nom: "Ot" },
      { id: "1ESOB-18", nom: "Ramon" },
      { id: "1ESOB-19", nom: "Sergi" },
      { id: "1ESOB-20", nom: "Sofia" },
      { id: "1ESOB-21", nom: "Tomas" },
      { id: "1ESOB-22", nom: "Toni" },
      { id: "1ESOB-23", nom: "Txell" },
      { id: "1ESOB-24", nom: "Unai" },
      { id: "1ESOB-25", nom: "Valeria" },
      { id: "1ESOB-26", nom: "Vera" },
      { id: "1ESOB-27", nom: "Ximena" }
    ]
  },

  "4ESO": {
    nom: "4t ESO",
    alumnes: [
      { id: "4ESO-01", nom: "Aisha" },
      { id: "4ESO-02", nom: "Aleix" },
      { id: "4ESO-03", nom: "Anna" },
      { id: "4ESO-04", nom: "Berta" },
      { id: "4ESO-05", nom: "David" },
      { id: "4ESO-06", nom: "Elna" },
      { id: "4ESO-07", nom: "Emma" },
      { id: "4ESO-08", nom: "Eric" },
      { id: "4ESO-09", nom: "Genis" },
      { id: "4ESO-10", nom: "Hugo" },
      { id: "4ESO-11", nom: "Iker" },
      { id: "4ESO-12", nom: "Ines" },
      { id: "4ESO-13", nom: "Jan" },
      { id: "4ESO-14", nom: "Lola" },
      { id: "4ESO-15", nom: "Maialen" },
      { id: "4ESO-16", nom: "Mar" },
      { id: "4ESO-17", nom: "Max" },
      { id: "4ESO-18", nom: "Mireia" },
      { id: "4ESO-19", nom: "Nuria" },
      { id: "4ESO-20", nom: "Pol" },
      { id: "4ESO-21", nom: "Quim" },
      { id: "4ESO-22", nom: "Rita" },
      { id: "4ESO-23", nom: "Roc" },
      { id: "4ESO-24", nom: "Sara" },
      { id: "4ESO-25", nom: "Victor" },
      { id: "4ESO-26", nom: "Xavi" },
      { id: "4ESO-27", nom: "Yasmin" }
    ]
  }
};
