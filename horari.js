/**
 * horari.js
 * ---------------------------------------------------------------
 * L'horari setmanal (quin grup toca cada dia i hora) i el nombre
 * màxim de positius per alumne i tram. És el fitxer que menys
 * canvia durant el curs, així que no té cap pantalla dedicada a
 * regenerar-lo: es toca directament aquí, a mà.
 * ---------------------------------------------------------------
 */

/**
 * Nombre màxim de positius que un alumne pot rebre en un mateix
 * tram (dia + hora concrets).
 */
const MAX_POSITIUS_DIA = 3;

/**
 * Horari setmanal: per a cada dia (0=diumenge...6=dissabte, com
 * getDay() de JavaScript) i cada hora de classe, quin grup toca.
 * Només cal omplir els trams en què el professor fa classe.
 *
 * "hora" és un identificador lliure (p. ex. "1a hora", "09:00"...);
 * es mostra tal qual a la interfície. "grup" ha de coincidir amb un
 * identificador de GRUPS a alumnes.js.
 */
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
    { hora: "4a hora (11:15–12:10)", grup: "1ESOB" }
  ],
  4: [ // Dijous
    { hora: "3a hora (9:50–10:45)", grup: "1ESOA" },
    { hora: "5a hora (12:10–13:05)", grup: "4ESO" }
  ],
  5: [ // Divendres
    { hora: "2a hora (8:55–9:50)", grup: "1ESOA" },
    { hora: "5a hora (12:10–13:05)", grup: "1ESOB" }
  ]
};
