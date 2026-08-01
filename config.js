/**
 * config.js
 * ---------------------------------------------------------------
 * Aquí hi ha TOTES les dades que canvien cada curs: l'horari
 * (quin grup toca cada dia i hora) i la llista d'alumnes de cada
 * grup, amb la seva posició física a l'aula.
 *
 * Aquest fitxer és l'únic que el professor hauria de tocar per
 * adaptar l'eina a un curs real. La lògica de l'aplicació (com
 * es calculen els positius, com es dibuixa la taula...) viu a
 * positius.js i no cal tocar-la.
 * ---------------------------------------------------------------
 */

/**
 * Nombre màxim de positius que un alumne pot rebre en un mateix dia.
 */
const MAX_POSITIUS_DIA = 3;

/**
 * Disposició física de l'aula.
 * files: nombre de files de taules (normalment 5)
 * parelles_per_fila: nombre de taules per fila (normalment 3, de 2 alumnes cada una)
 * Amb els valors per defecte: 5 files x 3 taules x 2 alumnes = 30 alumnes.
 */
const DISPOSICIO_AULA = {
  files: 5,
  parelles_per_fila: 3
};

/**
 * Els grups classe. Cada grup té un identificador únic (id) i una
 * llista d'alumnes. Cada alumne ocupa una posició {fila, taula, costat}:
 *   - fila:   1..DISPOSICIO_AULA.files (de davant a darrere)
 *   - taula:  1..DISPOSICIO_AULA.parelles_per_fila (d'esquerra a dreta)
 *   - costat: "esquerra" o "dreta" (els dos alumnes de la mateixa taula)
 *
 * "nom" és només el nom de pila (mai el cognom), tal com es mostrarà
 * a la interfície.
 */
const GRUPS = {
  "1A": {
    nom: "1r ESO A",
    alumnes: [
      { id: "1A-01", nom: "Martina",  fila: 1, taula: 1, costat: "esquerra" },
      { id: "1A-02", nom: "Youssef",  fila: 1, taula: 1, costat: "dreta" },
      { id: "1A-03", nom: "Laia",     fila: 1, taula: 2, costat: "esquerra" },
      { id: "1A-04", nom: "Bruno",    fila: 1, taula: 2, costat: "dreta" },
      { id: "1A-05", nom: "Ariadna",  fila: 1, taula: 3, costat: "esquerra" },
      { id: "1A-06", nom: "Pol",      fila: 1, taula: 3, costat: "dreta" },

      { id: "1A-07", nom: "Nerea",    fila: 2, taula: 1, costat: "esquerra" },
      { id: "1A-08", nom: "Marc",     fila: 2, taula: 1, costat: "dreta" },
      { id: "1A-09", nom: "Judit",    fila: 2, taula: 2, costat: "esquerra" },
      { id: "1A-10", nom: "Adam",     fila: 2, taula: 2, costat: "dreta" },
      { id: "1A-11", nom: "Emma",     fila: 2, taula: 3, costat: "esquerra" },
      { id: "1A-12", nom: "Biel",     fila: 2, taula: 3, costat: "dreta" },

      { id: "1A-13", nom: "Sara",     fila: 3, taula: 1, costat: "esquerra" },
      { id: "1A-14", nom: "Oriol",    fila: 3, taula: 1, costat: "dreta" },
      { id: "1A-15", nom: "Fatima",   fila: 3, taula: 2, costat: "esquerra" },
      { id: "1A-16", nom: "Jan",      fila: 3, taula: 2, costat: "dreta" },
      { id: "1A-17", nom: "Carla",    fila: 3, taula: 3, costat: "esquerra" },
      { id: "1A-18", nom: "Enzo",     fila: 3, taula: 3, costat: "dreta" },

      { id: "1A-19", nom: "Aina",     fila: 4, taula: 1, costat: "esquerra" },
      { id: "1A-20", nom: "Hugo",     fila: 4, taula: 1, costat: "dreta" },
      { id: "1A-21", nom: "Mariona",  fila: 4, taula: 2, costat: "esquerra" },
      { id: "1A-22", nom: "Leo",      fila: 4, taula: 2, costat: "dreta" },
      { id: "1A-23", nom: "Txell",    fila: 4, taula: 3, costat: "esquerra" },
      { id: "1A-24", nom: "Iker",     fila: 4, taula: 3, costat: "dreta" },

      { id: "1A-25", nom: "Noa",      fila: 5, taula: 1, costat: "esquerra" },
      { id: "1A-26", nom: "Dídac",    fila: 5, taula: 1, costat: "dreta" },
      { id: "1A-27", nom: "Alba",     fila: 5, taula: 2, costat: "esquerra" },
      { id: "1A-28", nom: "Rayan",    fila: 5, taula: 2, costat: "dreta" },
      { id: "1A-29", nom: "Clàudia",  fila: 5, taula: 3, costat: "esquerra" },
      { id: "1A-30", nom: "Gerard",   fila: 5, taula: 3, costat: "dreta" }
    ]
  },

  "2B": {
    nom: "2n ESO B",
    alumnes: [
      { id: "2B-01", nom: "Elena",    fila: 1, taula: 1, costat: "esquerra" },
      { id: "2B-02", nom: "Ivan",     fila: 1, taula: 1, costat: "dreta" },
      { id: "2B-03", nom: "Paula",    fila: 1, taula: 2, costat: "esquerra" },
      { id: "2B-04", nom: "David",    fila: 1, taula: 2, costat: "dreta" },
      { id: "2B-05", nom: "Nora",     fila: 1, taula: 3, costat: "esquerra" },
      { id: "2B-06", nom: "Guiu",     fila: 1, taula: 3, costat: "dreta" },

      { id: "2B-07", nom: "Berta",    fila: 2, taula: 1, costat: "esquerra" },
      { id: "2B-08", nom: "Max",      fila: 2, taula: 1, costat: "dreta" },
      { id: "2B-09", nom: "Ona",      fila: 2, taula: 2, costat: "esquerra" },
      { id: "2B-10", nom: "Roc",      fila: 2, taula: 2, costat: "dreta" },
      { id: "2B-11", nom: "Rita",     fila: 2, taula: 3, costat: "esquerra" },
      { id: "2B-12", nom: "Toni",     fila: 2, taula: 3, costat: "dreta" },

      { id: "2B-13", nom: "Julia",    fila: 3, taula: 1, costat: "esquerra" },
      { id: "2B-14", nom: "Eric",     fila: 3, taula: 1, costat: "dreta" },
      { id: "2B-15", nom: "Mar",      fila: 3, taula: 2, costat: "esquerra" },
      { id: "2B-16", nom: "Aleix",    fila: 3, taula: 2, costat: "dreta" },
      { id: "2B-17", nom: "Iris",     fila: 3, taula: 3, costat: "esquerra" },
      { id: "2B-18", nom: "Dani",     fila: 3, taula: 3, costat: "dreta" },

      { id: "2B-19", nom: "Lola",     fila: 4, taula: 1, costat: "esquerra" },
      { id: "2B-20", nom: "Nil",      fila: 4, taula: 1, costat: "dreta" },
      { id: "2B-21", nom: "Vera",     fila: 4, taula: 2, costat: "esquerra" },
      { id: "2B-22", nom: "Arnau",    fila: 4, taula: 2, costat: "dreta" },
      { id: "2B-23", nom: "Amina",    fila: 4, taula: 3, costat: "esquerra" },
      { id: "2B-24", nom: "Ferran",   fila: 4, taula: 3, costat: "dreta" },

      { id: "2B-25", nom: "Zoe",      fila: 5, taula: 1, costat: "esquerra" },
      { id: "2B-26", nom: "Quim",     fila: 5, taula: 1, costat: "dreta" },
      { id: "2B-27", nom: "Anna",     fila: 5, taula: 2, costat: "esquerra" },
      { id: "2B-28", nom: "Bernat",   fila: 5, taula: 2, costat: "dreta" },
      { id: "2B-29", nom: "Ines",     fila: 5, taula: 3, costat: "esquerra" },
      { id: "2B-30", nom: "Otger",    fila: 5, taula: 3, costat: "dreta" }
    ]
  }
};

/**
 * Horari setmanal: per a cada dia (1=diumenge...6=divendres, com
 * getDay() de JavaScript) i cada hora de classe, quin grup toca.
 * Només cal omplir els trams en què el professor fa classe.
 *
 * "hora" és un identificador lliure (p. ex. "1a hora", "09:00"...);
 * es mostra tal qual a la interfície.
 */
const HORARI = {
  1: [ // Dilluns
    { hora: "1a hora (8:00–8:55)", grup: "1A" },
    { hora: "3a hora (9:50–10:45)", grup: "2B" }
  ],
  2: [ // Dimarts
    { hora: "2a hora (8:55–9:50)", grup: "2B" }
  ],
  3: [ // Dimecres
    { hora: "1a hora (8:00–8:55)", grup: "1A" },
    { hora: "4a hora (11:15–12:10)", grup: "2B" }
  ],
  4: [ // Dijous
    { hora: "3a hora (9:50–10:45)", grup: "1A" }
  ],
  5: [ // Divendres
    { hora: "2a hora (8:55–9:50)", grup: "1A" },
    { hora: "5a hora (12:10–13:05)", grup: "2B" }
  ]
};
