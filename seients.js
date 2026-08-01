/**
 * seients.js
 * ---------------------------------------------------------------
 * On seu cada alumne a l'aula. Separat d'alumnes.js perquè aquest
 * fitxer el regenera setup.html (quan decideixes qui seu on) i no
 * s'hauria de tocar quan dones d'alta un grup nou amb alta.html.
 *
 * ⚠️ Buit expressament: com que alumnes.js s'ha hagut de
 * reconstruir amb dades d'exemple, els ids antics d'aquest fitxer
 * ja no coincidien amb ningú. Entra a setup.html per assignar
 * seients tan aviat com hagis donat d'alta els grups reals amb
 * alta.html.
 *
 * DISPOSICIO_AULA descriu la graella física de taules, igual per a
 * tots els grups:
 *   files: nombre de files de taules (normalment 5)
 *   parelles_per_fila: nombre de taules per fila (normalment 3, de
 *     2 alumnes cada una)
 * Amb els valors per defecte: 5 files x 3 taules x 2 alumnes = 30
 * seients com a màxim per grup.
 *
 * SEIENTS té una entrada per grup (mateixos identificadors que a
 * alumnes.js) amb la llista de seients ocupats. Cada seient és
 * { alumneId, fila, taula, costat }:
 *   - fila:   1..DISPOSICIO_AULA.files (de davant a darrere)
 *   - taula:  1..DISPOSICIO_AULA.parelles_per_fila (d'esquerra a dreta)
 *   - costat: "esquerra" o "dreta" (els dos alumnes de la mateixa taula)
 *
 * Un grup pot tenir menys entrades que alumnes (si encara no has
 * fet setup.html per a tots, o si el grup té menys de 30 alumnes);
 * els alumnes sense seient assignat simplement no apareixen a la
 * graella d'index.html fins que els assignis.
 * ---------------------------------------------------------------
 */

const DISPOSICIO_AULA = {
  files: 5,
  parelles_per_fila: 3
};

const SEIENTS = {
  "1ESOA": [],
  "1ESOB": [],
  "4ESO": []
};
