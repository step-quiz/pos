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
 * Cada alumne té "id" (identificador únic i estable), "numero"
 * (cadena de 2 xifres "01".."30", la posició de l'alumne en aquesta
 * llista, tal com el professor se la sap de memòria del seu full de
 * qualificacions) i "nom" (només el nom de pila, mai el cognom, tal
 * com es mostra a la interfície).
 *
 * "numero" s'utilitza pel mode M2 de positius.js (entrada per
 * teclat: escriure dos dígits assigna un positiu directament, sense
 * clicar). Es desa com a cadena de 2 xifres, no com a enter, perquè
 * la comparació amb els dígits teclejats sigui directa.
 *
 * Quan alta.html reemplaça la llista d'un grup, els id es regeneren
 * amb un sufix únic d'aquella alta (per exemple "1ESOA-7042-01"),
 * perquè mai coincideixin per atzar amb els d'una alta anterior del
 * mateix grup. Per això cal tornar a fer setup.html dels seients
 * després de donar d'alta un grup de nou. En canvi, "numero" sempre
 * es regenera simplement segons la posició (01, 02...) en l'ordre
 * en què s'han enganxat els noms — no depèn de l'id ni del sufix.
 * ---------------------------------------------------------------
 */

const GRUPS = {
  "1ESOA": {
    nom: "1r ESO A",
    alumnes: [
      { id: "1ESOA-01", numero: "01", nom: "Martina" },
      { id: "1ESOA-02", numero: "02", nom: "Youssef" },
      { id: "1ESOA-03", numero: "03", nom: "Laia" },
      { id: "1ESOA-04", numero: "04", nom: "Bruno" },
      { id: "1ESOA-05", numero: "05", nom: "Ariadna" },
      { id: "1ESOA-06", numero: "06", nom: "Pol" },
      { id: "1ESOA-07", numero: "07", nom: "Nerea" },
      { id: "1ESOA-08", numero: "08", nom: "Marc" },
      { id: "1ESOA-09", numero: "09", nom: "Judit" },
      { id: "1ESOA-10", numero: "10", nom: "Adam" },
      { id: "1ESOA-11", numero: "11", nom: "Emma" },
      { id: "1ESOA-12", numero: "12", nom: "Biel" },
      { id: "1ESOA-13", numero: "13", nom: "Sara" },
      { id: "1ESOA-14", numero: "14", nom: "Oriol" },
      { id: "1ESOA-15", numero: "15", nom: "Fatima" },
      { id: "1ESOA-16", numero: "16", nom: "Jan" },
      { id: "1ESOA-17", numero: "17", nom: "Carla" },
      { id: "1ESOA-18", numero: "18", nom: "Enzo" },
      { id: "1ESOA-19", numero: "19", nom: "Aina" },
      { id: "1ESOA-20", numero: "20", nom: "Hugo" },
      { id: "1ESOA-21", numero: "21", nom: "Mariona" },
      { id: "1ESOA-22", numero: "22", nom: "Leo" },
      { id: "1ESOA-23", numero: "23", nom: "Txell" },
      { id: "1ESOA-24", numero: "24", nom: "Iker" },
      { id: "1ESOA-25", numero: "25", nom: "Noa" },
      { id: "1ESOA-26", numero: "26", nom: "Dídac" },
      { id: "1ESOA-27", numero: "27", nom: "Alba" },
      { id: "1ESOA-28", numero: "28", nom: "Rayan" },
      { id: "1ESOA-29", numero: "29", nom: "Clàudia" },
      { id: "1ESOA-30", numero: "30", nom: "Gerard" }
    ]
  },

  "1ESOB": {
    nom: "1r ESO B",
    alumnes: [
      { id: "1ESOB-01", numero: "01", nom: "Elena" },
      { id: "1ESOB-02", numero: "02", nom: "Ivan" },
      { id: "1ESOB-03", numero: "03", nom: "Paula" },
      { id: "1ESOB-04", numero: "04", nom: "David" },
      { id: "1ESOB-05", numero: "05", nom: "Nora" },
      { id: "1ESOB-06", numero: "06", nom: "Guiu" },
      { id: "1ESOB-07", numero: "07", nom: "Berta" },
      { id: "1ESOB-08", numero: "08", nom: "Max" },
      { id: "1ESOB-09", numero: "09", nom: "Ona" },
      { id: "1ESOB-10", numero: "10", nom: "Roc" },
      { id: "1ESOB-11", numero: "11", nom: "Rita" },
      { id: "1ESOB-12", numero: "12", nom: "Toni" },
      { id: "1ESOB-13", numero: "13", nom: "Julia" },
      { id: "1ESOB-14", numero: "14", nom: "Eric" },
      { id: "1ESOB-15", numero: "15", nom: "Mar" },
      { id: "1ESOB-16", numero: "16", nom: "Aleix" },
      { id: "1ESOB-17", numero: "17", nom: "Iris" },
      { id: "1ESOB-18", numero: "18", nom: "Dani" },
      { id: "1ESOB-19", numero: "19", nom: "Lola" },
      { id: "1ESOB-20", numero: "20", nom: "Nil" },
      { id: "1ESOB-21", numero: "21", nom: "Vera" },
      { id: "1ESOB-22", numero: "22", nom: "Arnau" },
      { id: "1ESOB-23", numero: "23", nom: "Amina" },
      { id: "1ESOB-24", numero: "24", nom: "Ferran" },
      { id: "1ESOB-25", numero: "25", nom: "Zoe" },
      { id: "1ESOB-26", numero: "26", nom: "Quim" },
      { id: "1ESOB-27", numero: "27", nom: "Anna" },
      { id: "1ESOB-28", numero: "28", nom: "Bernat" },
      { id: "1ESOB-29", numero: "29", nom: "Ines" },
      { id: "1ESOB-30", numero: "30", nom: "Otger" }
    ]
  },

  "4ESO": {
    nom: "4t ESO",
    alumnes: [
      { id: "4ESO-01", numero: "01", nom: "Abril" },
      { id: "4ESO-02", numero: "02", nom: "Ramon" },
      { id: "4ESO-03", numero: "03", nom: "Sofia" },
      { id: "4ESO-04", numero: "04", nom: "Pere" },
      { id: "4ESO-05", numero: "05", nom: "Julieta" },
      { id: "4ESO-06", numero: "06", nom: "Marti" },
      { id: "4ESO-07", numero: "07", nom: "Cristina" },
      { id: "4ESO-08", numero: "08", nom: "Andreu" },
      { id: "4ESO-09", numero: "09", nom: "Neus" },
      { id: "4ESO-10", numero: "10", nom: "Jordi" },
      { id: "4ESO-11", numero: "11", nom: "Georgina" },
      { id: "4ESO-12", numero: "12", nom: "Pau" },
      { id: "4ESO-13", numero: "13", nom: "Mireia" },
      { id: "4ESO-14", numero: "14", nom: "Victor" },
      { id: "4ESO-15", numero: "15", nom: "Queralt" },
      { id: "4ESO-16", numero: "16", nom: "Bernat" },
      { id: "4ESO-17", numero: "17", nom: "Roser" },
      { id: "4ESO-18", numero: "18", nom: "Sergi" },
      { id: "4ESO-19", numero: "19", nom: "Elisenda" },
      { id: "4ESO-20", numero: "20", nom: "Ignasi" },
      { id: "4ESO-21", numero: "21", nom: "Berenguera" },
      { id: "4ESO-22", numero: "22", nom: "Genis" },
      { id: "4ESO-23", numero: "23", nom: "Alexia" },
      { id: "4ESO-24", numero: "24", nom: "Tomas" }
    ]
  }
};
