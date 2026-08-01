/**
 * seients.js
 * ---------------------------------------------------------------
 * On seu cada alumne a l'aula. Separat d'alumnes.js perquè aquest
 * fitxer el regenera setup.html (quan decideixes qui seu on) i no
 * s'hauria de tocar quan dones d'alta un grup nou amb alta.html.
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
 * Cada grup té 27 alumnes assignats sobre 30 seients possibles;
 * les 3 últimes cadires de cada grup queden buides. Reassigna-les
 * com vulguis des de setup.html.
 * ---------------------------------------------------------------
 */

const DISPOSICIO_AULA = {
  files: 5,
  parelles_per_fila: 3
};

const SEIENTS = {
  "1ESOA": [
    { alumneId: "1ESOA-01", fila: 1, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOA-02", fila: 1, taula: 1, costat: "dreta" },
    { alumneId: "1ESOA-03", fila: 1, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOA-04", fila: 1, taula: 2, costat: "dreta" },
    { alumneId: "1ESOA-05", fila: 1, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOA-06", fila: 1, taula: 3, costat: "dreta" },
    { alumneId: "1ESOA-07", fila: 2, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOA-08", fila: 2, taula: 1, costat: "dreta" },
    { alumneId: "1ESOA-09", fila: 2, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOA-10", fila: 2, taula: 2, costat: "dreta" },
    { alumneId: "1ESOA-11", fila: 2, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOA-12", fila: 2, taula: 3, costat: "dreta" },
    { alumneId: "1ESOA-13", fila: 3, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOA-14", fila: 3, taula: 1, costat: "dreta" },
    { alumneId: "1ESOA-15", fila: 3, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOA-16", fila: 3, taula: 2, costat: "dreta" },
    { alumneId: "1ESOA-17", fila: 3, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOA-18", fila: 3, taula: 3, costat: "dreta" },
    { alumneId: "1ESOA-19", fila: 4, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOA-20", fila: 4, taula: 1, costat: "dreta" },
    { alumneId: "1ESOA-21", fila: 4, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOA-22", fila: 4, taula: 2, costat: "dreta" },
    { alumneId: "1ESOA-23", fila: 4, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOA-24", fila: 4, taula: 3, costat: "dreta" },
    { alumneId: "1ESOA-25", fila: 5, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOA-26", fila: 5, taula: 1, costat: "dreta" },
    { alumneId: "1ESOA-27", fila: 5, taula: 2, costat: "esquerra" }
  ],

  "1ESOB": [
    { alumneId: "1ESOB-01", fila: 1, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOB-02", fila: 1, taula: 1, costat: "dreta" },
    { alumneId: "1ESOB-03", fila: 1, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOB-04", fila: 1, taula: 2, costat: "dreta" },
    { alumneId: "1ESOB-05", fila: 1, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOB-06", fila: 1, taula: 3, costat: "dreta" },
    { alumneId: "1ESOB-07", fila: 2, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOB-08", fila: 2, taula: 1, costat: "dreta" },
    { alumneId: "1ESOB-09", fila: 2, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOB-10", fila: 2, taula: 2, costat: "dreta" },
    { alumneId: "1ESOB-11", fila: 2, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOB-12", fila: 2, taula: 3, costat: "dreta" },
    { alumneId: "1ESOB-13", fila: 3, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOB-14", fila: 3, taula: 1, costat: "dreta" },
    { alumneId: "1ESOB-15", fila: 3, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOB-16", fila: 3, taula: 2, costat: "dreta" },
    { alumneId: "1ESOB-17", fila: 3, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOB-18", fila: 3, taula: 3, costat: "dreta" },
    { alumneId: "1ESOB-19", fila: 4, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOB-20", fila: 4, taula: 1, costat: "dreta" },
    { alumneId: "1ESOB-21", fila: 4, taula: 2, costat: "esquerra" },
    { alumneId: "1ESOB-22", fila: 4, taula: 2, costat: "dreta" },
    { alumneId: "1ESOB-23", fila: 4, taula: 3, costat: "esquerra" },
    { alumneId: "1ESOB-24", fila: 4, taula: 3, costat: "dreta" },
    { alumneId: "1ESOB-25", fila: 5, taula: 1, costat: "esquerra" },
    { alumneId: "1ESOB-26", fila: 5, taula: 1, costat: "dreta" },
    { alumneId: "1ESOB-27", fila: 5, taula: 2, costat: "esquerra" }
  ],

  "4ESO": [
    { alumneId: "4ESO-01", fila: 1, taula: 1, costat: "esquerra" },
    { alumneId: "4ESO-02", fila: 1, taula: 1, costat: "dreta" },
    { alumneId: "4ESO-03", fila: 1, taula: 2, costat: "esquerra" },
    { alumneId: "4ESO-04", fila: 1, taula: 2, costat: "dreta" },
    { alumneId: "4ESO-05", fila: 1, taula: 3, costat: "esquerra" },
    { alumneId: "4ESO-06", fila: 1, taula: 3, costat: "dreta" },
    { alumneId: "4ESO-07", fila: 2, taula: 1, costat: "esquerra" },
    { alumneId: "4ESO-08", fila: 2, taula: 1, costat: "dreta" },
    { alumneId: "4ESO-09", fila: 2, taula: 2, costat: "esquerra" },
    { alumneId: "4ESO-10", fila: 2, taula: 2, costat: "dreta" },
    { alumneId: "4ESO-11", fila: 2, taula: 3, costat: "esquerra" },
    { alumneId: "4ESO-12", fila: 2, taula: 3, costat: "dreta" },
    { alumneId: "4ESO-13", fila: 3, taula: 1, costat: "esquerra" },
    { alumneId: "4ESO-14", fila: 3, taula: 1, costat: "dreta" },
    { alumneId: "4ESO-15", fila: 3, taula: 2, costat: "esquerra" },
    { alumneId: "4ESO-16", fila: 3, taula: 2, costat: "dreta" },
    { alumneId: "4ESO-17", fila: 3, taula: 3, costat: "esquerra" },
    { alumneId: "4ESO-18", fila: 3, taula: 3, costat: "dreta" },
    { alumneId: "4ESO-19", fila: 4, taula: 1, costat: "esquerra" },
    { alumneId: "4ESO-20", fila: 4, taula: 1, costat: "dreta" },
    { alumneId: "4ESO-21", fila: 4, taula: 2, costat: "esquerra" },
    { alumneId: "4ESO-22", fila: 4, taula: 2, costat: "dreta" },
    { alumneId: "4ESO-23", fila: 4, taula: 3, costat: "esquerra" },
    { alumneId: "4ESO-24", fila: 4, taula: 3, costat: "dreta" },
    { alumneId: "4ESO-25", fila: 5, taula: 1, costat: "esquerra" },
    { alumneId: "4ESO-26", fila: 5, taula: 1, costat: "dreta" },
    { alumneId: "4ESO-27", fila: 5, taula: 2, costat: "esquerra" }
  ]
};
