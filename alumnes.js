/**
 * alumnes.js
 * ---------------------------------------------------------------
 * ⚠️ DADES D'EXEMPLE — cap alumne real.
 * Substitueix cada grup amb alta.html (o editant aquest fitxer a
 * mà) tan aviat com puguis, abans de fer servir l'eina de debò.
 *
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
      { id: "1ESOA-01", nom: "Alumne 1" },
      { id: "1ESOA-02", nom: "Alumne 2" },
      { id: "1ESOA-03", nom: "Alumne 3" }
    ]
  },

  "1ESOB": {
    nom: "1r ESO B",
    alumnes: [
      { id: "1ESOB-01", nom: "Alumne 1" },
      { id: "1ESOB-02", nom: "Alumne 2" },
      { id: "1ESOB-03", nom: "Alumne 3" }
    ]
  },

  "4ESO": {
    nom: "4t ESO",
    alumnes: [
      { id: "4ESO-01", nom: "Alumne 1" },
      { id: "4ESO-02", nom: "Alumne 2" },
      { id: "4ESO-03", nom: "Alumne 3" }
    ]
  }
};
