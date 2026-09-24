/**
 * horari.js
 * ---------------------------------------------------------------
 * Dues coses ben diferents conviuen en aquest fitxer:
 *
 *   - Les constants del centre (FRANGES_HORARIES, MAX_POSITIUS_DIA,
 *     VALOR_MINIM_TRAM, PES_NEGATIU). Són fixes i defineixen el
 *     funcionament general, així que es toquen aquí, a mà, si mai
 *     canviessin.
 *
 *   - HORARI: quin grup toca a cada dia i franja. Això SÍ canvia cada
 *     curs, i per tant NO viu en aquest fitxer: es crea a horari.html
 *     enganxant-hi la graella de l'Excel del centre, i queda desat en
 *     aquest navegador. Aquest fitxer només és el codi que el carrega.
 *
 * ── D'ON SURT L'HORARI, PER ORDRE ───────────────────────────────
 *
 *   1. window.HORARI_FITXER, si has posat el teu el-meu-horari.js al
 *      costat de l'index.html i l'has carregat amb una etiqueta
 *      <script src="el-meu-horari.js">.
 *
 *   2. El navegador, si ja has fet servir horari.html en aquest
 *      ordinador. És el cas habitual.
 *
 *   3. Un horari d'exemple, per poder veure com funciona la pàgina
 *      abans d'haver-hi enganxat res.
 *
 * La descàrrega d'el-meu-horari.js és, doncs, una còpia de seguretat
 * (o la manera de passar l'horari a un altre ordinador), no un pas
 * obligatori: el botó "Desa" d'horari.html ja el deixa actiu.
 * ---------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const CLAU = 'pos-horari-v1';
  const FORMAT = 1;

  /* ================================================================
   * Constants del centre (no depenen del curs)
   * ============================================================= */

  /**
   * Valor màxim (el més positiu) que pot arribar a tenir un alumne en
   * un mateix tram (dia + franja concrets). El "valor" d'un alumne en
   * un tram és positius - PES_NEGATIU × negatius (vegeu PES_NEGATIU):
   * amb 0 negatius, aquest límit equival simplement al nombre màxim de
   * positius d'un tram, que és l'ús original d'aquesta constant.
   */
  const MAX_POSITIUS_DIA = 10;

  /**
   * Valor mínim (el més negatiu) que pot arribar a tenir un alumne en
   * un mateix tram. Amb els valors per defecte, dos negatius sense cap
   * positiu ("- -", és a dir -4) ja hi arriben: no se'n poden afegir
   * més fins que algun positiu compensi el valor cap amunt.
   */
  const VALOR_MINIM_TRAM = -4;

  /**
   * Quants punts resta UN negatiu al valor combinat d'un tram. Amb el
   * valor per defecte (2), cada negatiu val el doble d'un positiu en
   * sentit contrari: "+++-" són 3 positius i 1 negatiu, és a dir
   * 3 - (2×1) = +1.
   */
  const PES_NEGATIU = 2;

  /**
   * Les 6 franges horàries de l'institut. "numero" és l'1..6 tal com
   * apareix a l'Excel oficial del centre; "inici" és l'hora en què
   * comença, en format "HH:MM". No cal indicar l'hora de fi: es dona
   * per fet que cada franja acaba quan comença la següent.
   */
  const FRANGES_HORARIES = [
    { numero: 1, inici: '8:15' },
    { numero: 2, inici: '9:10' },
    { numero: 3, inici: '10:05' },
    { numero: 4, inici: '12:00' },
    { numero: 5, inici: '12:55' },
    { numero: 6, inici: '13:50' }
  ];

  /**
   * Retorna el text llegible d'una franja horària concreta, p. ex.
   * "3a hora (10:05)". És el text que es desa dins de cada tram de
   * HORARI i, de retruc, dins de l'identificador de cada tram de
   * positius.
   */
  function textFranjaHoraria(numeroFranja) {
    const franja = FRANGES_HORARIES.find(f => f.numero === numeroFranja);
    return franja ? `${franja.numero}a hora (${franja.inici})` : `Franja ${numeroFranja}`;
  }

  /* ================================================================
   * Horari d'exemple
   *
   * Només s'utilitza mentre no hi hagi res desat ni cap fitxer
   * carregat. Fa referència als identificadors de grup d'exemple.
   * ============================================================= */

  const PER_DEFECTE = {
    format: FORMAT,
    actualitzat: '2026-01-01',
    horari: {
      1: [ // Dilluns
        { hora: textFranjaHoraria(1), grup: '1ESOA' },
        { hora: textFranjaHoraria(3), grup: '4ESO' }
      ],
      2: [ // Dimarts
        { hora: textFranjaHoraria(1), grup: '1ESOB' }
      ],
      3: [ // Dimecres
        { hora: textFranjaHoraria(1), grup: '4ESO' },
        { hora: textFranjaHoraria(4), grup: '1ESOB' }
      ],
      4: [ // Dijous
        { hora: textFranjaHoraria(1), grup: '1ESOB' },
        { hora: textFranjaHoraria(2), grup: '1ESOA' }
      ],
      5: [ // Divendres
        { hora: textFranjaHoraria(3), grup: '4ESO' }
      ]
    }
  };

  /* ================================================================
   * Validació
   * ============================================================= */

  function valida(dades) {
    if (!dades || typeof dades !== 'object') {
      return 'El fitxer no defineix cap dada.';
    }
    if (!dades.horari || typeof dades.horari !== 'object') {
      return 'El fitxer no té cap horari. Si és un horari.js d\'una versió ' +
             'anterior, torna a enganxar la graella a horari.html.';
    }

    for (const dia of Object.keys(dades.horari)) {
      const trams = dades.horari[dia];
      if (!Array.isArray(trams)) {
        return `El dia "${dia}" no té una llista de classes.`;
      }
      for (const tram of trams) {
        if (!tram || !tram.hora || !tram.grup) {
          return `Hi ha una classe incompleta al dia "${dia}". ` +
                 'Cada classe necessita hora i grup.';
        }
      }
    }
    return null;
  }

  /* ================================================================
   * Desar i recuperar
   * ============================================================= */

  function desa(dades) {
    try {
      localStorage.setItem(CLAU, JSON.stringify(dades));
      return true;
    } catch (error) {
      console.error('[horari] No s\'ha pogut desar:', error);
      return false;
    }
  }

  function recupera() {
    try {
      const text = localStorage.getItem(CLAU);
      if (!text) return null;
      const dades = JSON.parse(text);
      return valida(dades) ? null : dades;
    } catch (error) {
      console.warn('[horari] Hi havia dades malmeses desades; s\'ignoren.');
      return null;
    }
  }

  function oblida() {
    localStorage.removeItem(CLAU);
    location.reload();
  }

  /* ================================================================
   * Importar un fitxer d'horari
   *
   * Mateix mecanisme que seients.js: s'executa el text dins d'un
   * new Function en comptes d'una etiqueta <script> temporal. Així
   * es poden llegir també els horari.js del format antic (que
   * declaraven `const HORARI = {...}`) i el que declari el fitxer no
   * embruta l'objecte global, de manera que no cal recarregar.
   * ============================================================= */

  /**
   * Executa el text del fitxer i en treu les dades, tant del format
   * nou (window.HORARI_FITXER) com de l'antic (const HORARI).
   */
  function extreu(textFitxer) {
    const cos = textFitxer + `
      ;if (typeof HORARI_FITXER !== 'undefined' && HORARI_FITXER) {
         return HORARI_FITXER;
       }
       if (typeof HORARI !== 'undefined' && HORARI) {
         return { format: 0, actualitzat: null, horari: HORARI };
       }
       return undefined;
    `;
    return new Function(cos)();
  }

  function importa(fitxer) {
    return fitxer.text().then(function (text) {
      let dades;

      // Amaguem els globals que publiquem nosaltres mentre dura la
      // lectura: si no, un fitxer qualsevol veuria el HORARI que ja
      // hi ha carregat i semblaria vàlid. Vegeu seients.js.
      const amagats = {
        HORARI_FITXER: global.HORARI_FITXER,
        HORARI: global.HORARI
      };
      global.HORARI_FITXER = undefined;
      global.HORARI = undefined;

      try {
        dades = extreu(text);
      } catch (error) {
        throw new Error(
          'El fitxer té un error de sintaxi i no s\'ha pogut llegir. ' +
          'Si l\'has editat a mà, revisa les comes.'
        );
      } finally {
        global.HORARI_FITXER = amagats.HORARI_FITXER;
        global.HORARI = amagats.HORARI;
      }

      if (!dades) {
        throw new Error(
          'El fitxer s\'ha llegit però no hi ha cap horari a dins. ' +
          'Assegura\'t que és un el-meu-horari.js baixat des d\'horari.html, ' +
          'o un horari.js d\'una versió anterior.'
        );
      }

      if (!dades.actualitzat) dades.actualitzat = avui();

      const error = valida(dades);
      if (error) throw new Error(error);

      dades.horari = normalitza(dades.horari);
      return dades;
    });
  }

  /**
   * Garanteix que els cinc dies lectius existeixin sempre com a
   * llista, encara que el fitxer importat en salti algun. Evita
   * haver de comprovar-ho a cada lloc que recorre l'horari.
   */
  function normalitza(horari) {
    const net = {};
    for (const dia of [1, 2, 3, 4, 5]) {
      net[dia] = Array.isArray(horari[dia]) ? horari[dia] : [];
    }
    // Qualsevol altre dia que hi hagués (caps de setmana) es manté.
    for (const dia of Object.keys(horari)) {
      if (!(dia in net)) net[dia] = horari[dia];
    }
    return net;
  }

  /* ================================================================
   * Generar el fitxer per descarregar
   * ============================================================= */

  function generaText(dades) {
    const nomsDies = {
      0: 'Diumenge', 1: 'Dilluns', 2: 'Dimarts', 3: 'Dimecres',
      4: 'Dijous', 5: 'Divendres', 6: 'Dissabte'
    };

    const capçalera = [
      '/**',
      ' * el-meu-horari.js',
      ' * ─────────────────────────────────────────────────────────',
      ' * Quin grup toca a cada dia i franja.',
      ' *',
      ' * Generat per horari.html el ' + dades.actualitzat + '.',
      ' * Per tornar-lo a carregar: obre horari.html i tria aquest fitxer.',
      ' * ─────────────────────────────────────────────────────────',
      ' */',
      'window.HORARI_FITXER = {',
      '',
      '  format: ' + FORMAT + ',',
      '  actualitzat: ' + JSON.stringify(dades.actualitzat) + ',',
      '',
      '  horari: {'
    ];

    const dies = Object.keys(dades.horari).sort();
    const blocs = dies.map(function (dia) {
      const trams = dades.horari[dia];
      const comentari = nomsDies[dia] ? ' // ' + nomsDies[dia] : '';

      if (trams.length === 0) {
        return '    ' + dia + ': [],' + comentari;
      }

      const linies = trams.map(function (t) {
        return '      { hora: ' + JSON.stringify(t.hora) +
               ', grup: ' + JSON.stringify(t.grup) + ' }';
      });
      return '    ' + dia + ': [' + comentari + '\n' +
             linies.join(',\n') + '\n    ]';
    });

    return capçalera.join('\n') + '\n' +
           blocs.join(',\n') + '\n' +
           '  }\n};\n';
  }

  function descarrega(dades) {
    const nom = 'el-meu-horari.js';
    const blob = new Blob([generaText(dades)], {
      type: 'text/javascript;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const enllaç = document.createElement('a');
    enllaç.href = url;
    enllaç.download = nom;
    document.body.appendChild(enllaç);
    enllaç.click();
    enllaç.remove();
    URL.revokeObjectURL(url);
    return nom;
  }

  function avui() {
    return new Date().toISOString().slice(0, 10);
  }

  /* ================================================================
   * Arrencada
   * ============================================================= */

  let dades = null;
  let origen = 'exemple';

  if (global.HORARI_FITXER && !valida(global.HORARI_FITXER)) {
    dades = global.HORARI_FITXER;
    origen = 'fitxer';
    desa(dades);
  } else {
    dades = recupera();
    if (dades) {
      origen = 'navegador';
    } else {
      dades = JSON.parse(JSON.stringify(PER_DEFECTE));
    }
  }

  global.MAX_POSITIUS_DIA = MAX_POSITIUS_DIA;
  global.VALOR_MINIM_TRAM = VALOR_MINIM_TRAM;
  global.PES_NEGATIU = PES_NEGATIU;
  global.FRANGES_HORARIES = FRANGES_HORARIES;
  global.textFranjaHoraria = textFranjaHoraria;

  // HORARI és el MATEIX objecte que hi ha dins `dades`: desar-ne un
  // de nou des d'horari.html es veu a l'instant, sense recarregar.
  dades.horari = normalitza(dades.horari);
  global.HORARI = dades.horari;

  global.CONFIG_HORARI = {
    origen: function () { return origen; },
    actualitzat: function () { return dades.actualitzat; },
    tot: function () { return dades; },

    /**
     * Substitueix l'horari sencer i el deixa immediatament actiu a
     * HORARI. Ho crida el botó "Desa" d'horari.html.
     */
    desaHorari: function (horari) {
      dades.horari = normalitza(horari);
      dades.actualitzat = avui();
      origen = 'navegador';
      global.HORARI = dades.horari;
      return desa(dades);
    },

    /**
     * Substitueix l'horari a partir d'un fitxer importat, conservant
     * d'on ve. Igual que desaHorari, queda actiu de seguida.
     */
    desaTot: function (noves) {
      const error = valida(noves);
      if (error) return false;

      dades = noves;
      dades.horari = normalitza(dades.horari);
      origen = 'fitxer';
      global.HORARI = dades.horari;
      return desa(dades);
    },

    importa: importa,
    descarrega: function () { return descarrega(dades); },
    oblida: oblida
  };

})(window);
