/**
 * horari.js
 * ---------------------------------------------------------------
 * Horari setmanal: per a cada dia (0=diumenge...6=dissabte, com
 * getDay() de JavaScript) i cada hora de classe, quin grup toca.
 * Només cal omplir els trams en què el professor fa classe.
 *
 * "hora" és un identificador lliure (p. ex. "1a hora", "09:00"...);
 * es mostra tal qual a la interfície.
 *
 * MAX_POSITIUS_DIA és el nombre màxim de positius que un alumne pot
 * rebre en un mateix tram horari (no en un dia sencer: si un grup
 * té dues classes el mateix dia, cada hora té el seu propi límit).
 *
 * Aquest fitxer es toca a mà, ja que gairebé no canvia durant el
 * curs (a diferència d'alumnes.js i seients.js, que es regeneren
 * des d'alta.html i setup.html).
 * ---------------------------------------------------------------
 */

const MAX_POSITIUS_DIA = 3;

const HORARI = {
  1: [ // Dilluns
    { hora: "1a hora (8:00–8:55)", grup: "1ESOA" },
    { hora: "3a hora (9:50–10:45)", grup: "1ESOB" }
  ],
  2: [ // Dimarts
    { hora: "2a hora (8:55–9:50)", grup: "1ESOB" },
    { hora: "4a hora (11:15–12:10)", grup: "4ESO" }
  ],
  3: [ // Dimecres
    { hora: "1a hora (8:00–8:55)", grup: "1ESOA" },
    { hora: "3a hora (9:50–10:45)", grup: "4ESO" }
  ],
  4: [ // Dijous
    { hora: "2a hora (8:55–9:50)", grup: "1ESOA" },
    { hora: "5a hora (12:10–13:05)", grup: "1ESOB" }
  ],
  5: [ // Divendres
    { hora: "1a hora (8:00–8:55)", grup: "4ESO" },
    { hora: "3a hora (9:50–10:45)", grup: "1ESOA" }
  ]
};
