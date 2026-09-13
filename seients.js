/**
 * seients.js
 * ---------------------------------------------------------------
 * On seu cada alumne a l'aula. Segueix exactament el mateix patró que
 * dades.js: aquest fitxer NO conté la teva distribució, sinó el codi
 * que la carrega, la desa en aquest navegador i la deixa exportar.
 *
 * ── D'ON SURTEN LES DADES, PER ORDRE ────────────────────────────
 *
 *   1. window.SEIENTS_FITXER, si has posat el teu els-meus-seients.js
 *      al costat de l'index.html i l'has carregat amb una etiqueta
 *      <script src="els-meus-seients.js">.
 *
 *   2. El navegador, si ja has fet servir setup.html en aquest
 *      ordinador. És el cas habitual: setup.html desa cada canvi
 *      automàticament, així que no cal descarregar res per treballar
 *      del dia a dia.
 *
 *   3. Una distribució d'exemple, per poder veure com funciona la
 *      graella abans d'haver configurat res.
 *
 * La descàrrega d'els-meus-seients.js és, doncs, una còpia de
 * seguretat (o la manera de passar la teva distribució a un altre
 * ordinador), no un pas obligatori.
 *
 * DISPOSICIO_AULA descriu la graella física de taules, igual per a
 * tots els grups:
 *   files: nombre de files de taules (normalment 5)
 *   parelles_per_fila: nombre de taules per fila (normalment 3, de
 *     2 alumnes cada una)
 *
 * SEIENTS té una entrada per grup (mateixos identificadors que al
 * fitxer del docent) amb la llista de seients ocupats. Cada seient és
 * { alumneId, fila, taula, costat }:
 *   - fila:   1..DISPOSICIO_AULA.files (de davant a darrere)
 *   - taula:  1..DISPOSICIO_AULA.parelles_per_fila (d'esquerra a dreta)
 *   - costat: "esquerra" o "dreta" (els dos alumnes de la mateixa taula)
 *
 * Un grup pot tenir menys entrades que alumnes: els alumnes sense
 * seient assignat simplement no apareixen a la graella d'index.html.
 * ---------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const CLAU = 'pos-seients-v1';
  const FORMAT = 1;

  /* ================================================================
   * Distribució d'exemple
   *
   * Només s'utilitza mentre no hi hagi res desat ni cap fitxer
   * carregat. Fa referència als identificadors de grup d'exemple; si
   * els teus grups es diuen d'una altra manera, la graella surt
   * buida fins que passis per setup.html, que és el que toca.
   * ============================================================= */

  const PER_DEFECTE = {
    format: FORMAT,
    actualitzat: '2026-01-01',
    disposicio: {
      files: 5,
      parelles_per_fila: 3
    },
    seients: {
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
        { alumneId: "1ESOA-27", fila: 5, taula: 2, costat: "esquerra" },
        { alumneId: "1ESOA-28", fila: 5, taula: 2, costat: "dreta" },
        { alumneId: "1ESOA-29", fila: 5, taula: 3, costat: "esquerra" },
        { alumneId: "1ESOA-30", fila: 5, taula: 3, costat: "dreta" }
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
        { alumneId: "1ESOB-27", fila: 5, taula: 2, costat: "esquerra" },
        { alumneId: "1ESOB-28", fila: 5, taula: 2, costat: "dreta" },
        { alumneId: "1ESOB-29", fila: 5, taula: 3, costat: "esquerra" },
        { alumneId: "1ESOB-30", fila: 5, taula: 3, costat: "dreta" }
      ],

      // 4t ESO encara no té seients assignats: entra a setup.html per
      // decidir qui seu on. Fins que ho facis, els seus alumnes no
      // apareixeran a la graella d'index.html.
      "4ESO": []
    }
  };

  /* ================================================================
   * Validació
   *
   * Un fitxer importat pot ser qualsevol cosa: un seients.js d'una
   * versió antiga, el fitxer d'un company, o un fitxer que no toca.
   * Val més dir què falla que carregar mitges dades i petar més tard
   * enmig d'una classe.
   * ============================================================= */

  function valida(dades) {
    if (!dades || typeof dades !== 'object') {
      return 'El fitxer no defineix cap dada.';
    }

    const disposicio = dades.disposicio;
    if (!disposicio ||
        !Number.isInteger(disposicio.files) ||
        !Number.isInteger(disposicio.parelles_per_fila) ||
        disposicio.files < 1 || disposicio.parelles_per_fila < 1) {
      return 'El fitxer no diu com és l\'aula (files i parelles_per_fila).';
    }

    if (!dades.seients || typeof dades.seients !== 'object') {
      return 'El fitxer no té cap llista de seients. Si és un seients.js ' +
             'd\'una versió anterior, torna a fer la distribució a setup.html.';
    }

    for (const clau of Object.keys(dades.seients)) {
      const llista = dades.seients[clau];
      if (!Array.isArray(llista)) {
        return `El grup "${clau}" no té una llista de seients.`;
      }
      for (const seient of llista) {
        if (!seient || !seient.alumneId ||
            !Number.isInteger(seient.fila) ||
            !Number.isInteger(seient.taula) ||
            (seient.costat !== 'esquerra' && seient.costat !== 'dreta')) {
          return `Hi ha un seient incomplet al grup "${clau}". Cada seient ` +
                 'necessita alumneId, fila, taula i costat.';
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
      console.error('[seients] No s\'ha pogut desar:', error);
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
      console.warn('[seients] Hi havia dades malmeses desades; s\'ignoren.');
      return null;
    }
  }

  function oblida() {
    localStorage.removeItem(CLAU);
    location.reload();
  }

  /* ================================================================
   * Importar un fitxer de seients
   *
   * El fitxer és JavaScript, no JSON, perquè així també es pot deixar
   * al costat de l'index.html i carregar-lo amb una etiqueta
   * <script>. Per llegir-lo aquí l'executem dins d'un new Function,
   * i no amb una etiqueta <script> temporal, per dos motius:
   *
   *   1. Dins d'una funció, un `const SEIENTS = {...}` de dalt de tot
   *      del fitxer SÍ que és visible des del codi que hi afegim al
   *      final. Això ens deixa llegir també els seients.js del format
   *      antic, que és el que molta gent té descarregat.
   *
   *   2. El que declari el fitxer queda dins la funció i no embruta
   *      l'objecte global, de manera que podem aplicar les dades noves
   *      sense haver de recarregar la pàgina.
   * ============================================================= */

  /**
   * Executa el text del fitxer i en treu les dades, tant si és del
   * format nou (window.SEIENTS_FITXER) com de l'antic (const
   * DISPOSICIO_AULA / const SEIENTS). Retorna undefined si no hi
   * troba ni una cosa ni l'altra.
   */
  function extreu(textFitxer) {
    const cos = textFitxer + `
      ;if (typeof SEIENTS_FITXER !== 'undefined' && SEIENTS_FITXER) {
         return SEIENTS_FITXER;
       }
       if (typeof SEIENTS !== 'undefined' && SEIENTS) {
         return {
           format: 0,
           actualitzat: null,
           disposicio: (typeof DISPOSICIO_AULA !== 'undefined')
             ? DISPOSICIO_AULA
             : undefined,
           seients: SEIENTS
         };
       }
       return undefined;
    `;
    return new Function(cos)();
  }

  function importa(fitxer) {
    return fitxer.text().then(function (text) {
      let dades;

      // Dins del new Function, un nom que el fitxer NO declari es
      // resol per la cadena d'àmbits fins a l'objecte global. Com que
      // nosaltres hi publiquem SEIENTS i DISPOSICIO_AULA, un fitxer
      // qualsevol (o un de buit) semblaria vàlid i "importaria" el
      // que ja hi havia carregat. Els amaguem mentre dura la lectura
      // perquè només es pugui veure el que declari el fitxer.
      const amagats = {
        SEIENTS_FITXER: global.SEIENTS_FITXER,
        SEIENTS: global.SEIENTS,
        DISPOSICIO_AULA: global.DISPOSICIO_AULA
      };
      global.SEIENTS_FITXER = undefined;
      global.SEIENTS = undefined;
      global.DISPOSICIO_AULA = undefined;

      try {
        dades = extreu(text);
      } catch (error) {
        throw new Error(
          'El fitxer té un error de sintaxi i no s\'ha pogut llegir. ' +
          'Si l\'has editat a mà, revisa les comes.'
        );
      } finally {
        global.SEIENTS_FITXER = amagats.SEIENTS_FITXER;
        global.SEIENTS = amagats.SEIENTS;
        global.DISPOSICIO_AULA = amagats.DISPOSICIO_AULA;
      }

      if (!dades) {
        throw new Error(
          'El fitxer s\'ha llegit però no hi ha cap llista de seients a ' +
          'dins. Assegura\'t que és un els-meus-seients.js baixat des de ' +
          'setup.html, o un seients.js d\'una versió anterior.'
        );
      }

      // Un fitxer antic no porta disposició si es va editar a mà:
      // més val la de sempre que no pas fallar.
      if (!dades.disposicio) {
        dades.disposicio = JSON.parse(JSON.stringify(PER_DEFECTE.disposicio));
      }
      if (!dades.actualitzat) dades.actualitzat = avui();

      const error = valida(dades);
      if (error) throw new Error(error);

      return dades;
    });
  }

  /* ================================================================
   * Generar el fitxer per descarregar
   *
   * Es construeix a partir de l'objecte que tenim a memòria. La
   * versió anterior llegia seients.js amb fetch i hi feia una
   * substitució amb expressions regulars, cosa que obligava a servir
   * el projecte per http i es trencava si algú retocava el format del
   * fitxer a mà. Generant-lo des de l'objecte, ni una cosa ni l'altra.
   * ============================================================= */

  function generaText(dades) {
    const capçalera = [
      '/**',
      ' * els-meus-seients.js',
      ' * ─────────────────────────────────────────────────────────',
      ' * Qui seu on, a cada grup.',
      ' *',
      ' * Generat per setup.html el ' + dades.actualitzat + '.',
      ' * Per tornar-lo a carregar: obre setup.html i tria aquest fitxer.',
      ' * ─────────────────────────────────────────────────────────',
      ' */',
      'window.SEIENTS_FITXER = {',
      '',
      '  format: ' + FORMAT + ',',
      '  actualitzat: ' + JSON.stringify(dades.actualitzat) + ',',
      '',
      '  disposicio: {',
      '    files: ' + dades.disposicio.files + ',',
      '    parelles_per_fila: ' + dades.disposicio.parelles_per_fila,
      '  },',
      '',
      '  seients: {'
    ];

    const blocs = Object.keys(dades.seients).map(function (clau) {
      const llista = dades.seients[clau];
      if (llista.length === 0) {
        return '    ' + JSON.stringify(clau) + ': []';
      }
      const linies = llista.map(function (s) {
        return '      { alumneId: ' + JSON.stringify(s.alumneId) +
               ', fila: ' + s.fila +
               ', taula: ' + s.taula +
               ', costat: ' + JSON.stringify(s.costat) + ' }';
      });
      return '    ' + JSON.stringify(clau) + ': [\n' +
             linies.join(',\n') + '\n    ]';
    });

    return capçalera.join('\n') + '\n' +
           blocs.join(',\n\n') + '\n' +
           '  }\n};\n';
  }

  function descarrega(dades) {
    const nom = 'els-meus-seients.js';
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

  if (global.SEIENTS_FITXER && !valida(global.SEIENTS_FITXER)) {
    // Fitxer carregat amb <script src>: mana sobre el desat.
    dades = global.SEIENTS_FITXER;
    origen = 'fitxer';
    desa(dades);
  } else {
    dades = recupera();
    if (dades) {
      origen = 'navegador';
    } else {
      // Còpia de l'exemple: així, si es desa, no s'altera la constant.
      dades = JSON.parse(JSON.stringify(PER_DEFECTE));
    }
  }

  // Els altres fitxers llegeixen DISPOSICIO_AULA i SEIENTS com a
  // identificadors solts; una propietat de l'objecte global es resol
  // igual. Com que són el MATEIX objecte que hi ha dins `dades`,
  // qualsevol canvi fet des de setup.html es veu a l'instant sense
  // haver de recarregar la pàgina.
  global.DISPOSICIO_AULA = dades.disposicio;
  global.SEIENTS = dades.seients;

  global.CONFIG_SEIENTS = {
    origen: function () { return origen; },
    actualitzat: function () { return dades.actualitzat; },
    tot: function () { return dades; },

    /**
     * Desa la distribució d'UN grup i la deixa immediatament visible
     * a SEIENTS. Ho crida setup.html a cada canvi, de manera que la
     * feina no es perd encara que es tanqui la pestanya.
     */
    desaGrup: function (grupId, llista) {
      dades.seients[grupId] = llista;
      dades.actualitzat = avui();
      origen = 'navegador';
      return desa(dades);
    },

    /**
     * Substitueix la configuració sencera (disposició de l'aula i
     * tots els grups) i la deixa immediatament activa a
     * DISPOSICIO_AULA i SEIENTS. Ho crida setup.html quan s'importa
     * un fitxer; com que aquí republiquem els globals, qui ho faci
     * només ha de tornar a pintar la pàgina, no recarregar-la.
     */
    desaTot: function (noves) {
      const error = valida(noves);
      if (error) return false;

      dades = noves;
      origen = 'fitxer';
      global.DISPOSICIO_AULA = dades.disposicio;
      global.SEIENTS = dades.seients;
      return desa(dades);
    },

    importa: importa,
    descarrega: function () { return descarrega(dades); },
    oblida: oblida
  };

})(window);
