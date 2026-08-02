/**
 * horari.js
 * ---------------------------------------------------------------
 * Dues coses ben diferents conviuen en aquest fitxer:
 *
 *   - FRANGES_HORARIES: les 6 franges horàries de l'institut (número
 *     + hora d'inici). Són fixes i defineixen el funcionament
 *     general del centre, així que no canvien d'un curs a l'altre.
 *     Es toquen aquí, a mà, si mai canviessin.
 *
 *   - HORARI: quin grup toca a cada dia i franja. Això SÍ canvia
 *     cada curs (fins i tot no es coneix amb certesa fins que
 *     comencen les classes), així que es regenera des de
 *     horari.html: hi enganxes la graella tal com la tens a l'Excel
 *     del centre i es descarrega aquest fitxer actualitzat.
 *
 * MAX_POSITIUS_DIA tampoc canvia gaire, així que es queda aquí
 * també, a mà.
 * ---------------------------------------------------------------
 */

/**
 * Nombre màxim de positius que un alumne pot rebre en un mateix
 * tram (dia + franja concrets).
 */
const MAX_POSITIUS_DIA = 3;

/**
 * Les 6 franges horàries de l'institut. "numero" és l'1..6 tal com
 * apareix a l'Excel oficial del centre; "inici" és l'hora en què
 * comença, en format "HH:MM". No cal indicar l'hora de fi: es dona
 * per fet que cada franja acaba quan comença la següent.
 */
const FRANGES_HORARIES = [
  { numero: 1, inici: "8:15" },
  { numero: 2, inici: "9:10" },
  { numero: 3, inici: "10:05" },
  { numero: 4, inici: "12:00" },
  { numero: 5, inici: "12:55" },
  { numero: 6, inici: "13:50" }
];

/**
 * Retorna el text llegible d'una franja horària concreta, p. ex.
 * "3a hora (10:05)". S'utilitza per generar el camp "hora" de
 * HORARI a partir d'un número de franja (vegeu horari.js/horari.html).
 */
function textFranjaHoraria(numeroFranja) {
  const franja = FRANGES_HORARIES.find(f => f.numero === numeroFranja);
  return franja ? `${franja.numero}a hora (${franja.inici})` : `Franja ${numeroFranja}`;
}

/**
 * Horari setmanal: per a cada dia (0=diumenge...6=dissabte, com
 * getDay() de JavaScript) i cada franja de classe, quin grup toca.
 * Només cal omplir els trams en què el professor fa classe.
 *
 * Aquest bloc el regenera horari.html — no cal editar-lo a mà. El
 * "grup" ha de coincidir amb un identificador de GRUPS a alumnes.js.
 */
const HORARI = {
  1: [ // Dilluns
    { hora: textFranjaHoraria(1), grup: "1ESOA" },
    { hora: textFranjaHoraria(3), grup: "4ESO" }
  ],
  2: [ // Dimarts
    { hora: textFranjaHoraria(1), grup: "1ESOB" }
  ],
  3: [ // Dimecres
    { hora: textFranjaHoraria(1), grup: "4ESO" },
    { hora: textFranjaHoraria(4), grup: "1ESOB" }
  ],
  4: [ // Dijous
    { hora: textFranjaHoraria(1), grup: "1ESOB" },
    { hora: textFranjaHoraria(2), grup: "1ESOA" }
  ],
  5: [ // Divendres
    { hora: textFranjaHoraria(3), grup: "4ESO" }
  ]
};

