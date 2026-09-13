/**
 * dades.js
 * ---------------------------------------------------------------
 * Substitueix alumnes.js. Els noms de l'alumnat ja no viuen al
 * repositori: viuen en un fitxer teu (profdani.js) que carregues des
 * de la pàgina i que queda desat en aquest navegador.
 *
 * Aquest fitxer defineix GRUPS exactament amb la mateixa forma que
 * tenia alumnes.js, de manera que positius.js, setup.js, exportar.js
 * i horari-app.js funcionen sense cap canvi.
 *
 * ── D'ON SURTEN LES DADES, PER ORDRE ────────────────────────────
 *
 *   1. window.DOCENT, si has posat el profdani.js al costat de
 *      l'index.html i l'has carregat amb <script src="profdani.js">.
 *      És el cas de qui treballa amb una còpia local del projecte.
 *
 *   2. El navegador, si ja vas importar el fitxer un altre dia.
 *      És el cas habitual.
 *
 *   3. Res. Llavors surt la pantalla de càrrega i l'aplicació espera.
 *
 * ── PER QUÈ ES RECARREGA LA PÀGINA EN IMPORTAR ──────────────────
 *
 * positius.js i companyia llegeixen GRUPS mentre es carreguen, no
 * després. Si esperéssim el fitxer per començar, caldria convertir
 * tota l'aplicació en asíncrona. Desar i recarregar fa que, a partir
 * del segon segon, tot torni a ser síncron i no calgui tocar res
 * més. Es fa una sola vegada per navegador.
 *
 * ── ORDINADORS COMPARTITS ───────────────────────────────────────
 *
 * El que es desa queda en aquest navegador fins que l'esborris. Si
 * fas servir l'ordinador de l'aula, clica «Oblida-ho aquí» quan
 * acabis. El botó és a baix a la dreta.
 * ---------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const CLAU = 'pos-docent-v1';
  const FORMAT = 1;

  /* ================================================================
   * Validació
   *
   * Un fitxer importat pot ser qualsevol cosa: el d'un altre curs,
   * el d'un company, o un fitxer que no toca. Val més dir què falla
   * que carregar mitges dades i fallar més tard amb un error
   * incomprensible enmig d'una classe.
   * ============================================================= */

  function valida(dades) {
    if (!dades || typeof dades !== 'object') {
      return 'El fitxer no defineix cap dada.';
    }
    if (!dades.grups || typeof dades.grups !== 'object') {
      return 'El fitxer no té cap grup a dins.';
    }

    for (const clau of Object.keys(dades.grups)) {
      const grup = dades.grups[clau];
      if (!grup || !Array.isArray(grup.alumnes)) {
        return `El grup "${clau}" no té cap llista d'alumnes.`;
      }
      for (const alumne of grup.alumnes) {
        if (!alumne || !alumne.id || !alumne.numero || !alumne.nom) {
          return `Hi ha un alumne incomplet al grup "${clau}". ` +
                 'Cada alumne necessita id, numero i nom.';
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
      console.error('[dades] No s\'ha pogut desar:', error);
      return false;
    }
  }

  function recupera() {
    try {
      const text = localStorage.getItem(CLAU);
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.warn('[dades] Hi havia dades malmeses desades; s\'ignoren.');
      return null;
    }
  }

  function oblida() {
    localStorage.removeItem(CLAU);
    location.reload();
  }

  /* ================================================================
   * Importar un fitxer de classes
   *
   * El fitxer és JavaScript, no JSON, perquè així també es pot
   * deixar al costat de l'index.html i carregar-lo amb una etiqueta
   * <script>. Per llegir-lo aquí l'executem dins d'un new Function:
   * a diferència d'una etiqueta <script> temporal, això ens deixa
   * veure un `const GRUPS = {...}` de dalt de tot del fitxer, que és
   * com estaven fets els alumnes.js antics. Així no cal convertir-los
   * a mà per poder-los recuperar.
   * ============================================================= */

  /**
   * Executa el text del fitxer i en treu les dades, tant del format
   * actual (window.DOCENT) com d'un alumnes.js antic (const GRUPS).
   */
  function extreu(textFitxer) {
    const cos = textFitxer + `
      ;if (typeof DOCENT !== 'undefined' && DOCENT) {
         return DOCENT;
       }
       if (typeof GRUPS !== 'undefined' && GRUPS) {
         return { format: 0, docent: '', curs: '', actualitzat: null, grups: GRUPS };
       }
       return undefined;
    `;
    return new Function(cos)();
  }

  function importa(fitxer) {
    return fitxer.text().then(function (text) {
      let dades;

      // Amaguem els globals que publiquem nosaltres mentre dura la
      // lectura: si no, un fitxer qualsevol veuria el GRUPS que ja hi
      // ha carregat i semblaria vàlid. Vegeu seients.js.
      const amagats = { DOCENT: global.DOCENT, GRUPS: global.GRUPS };
      global.DOCENT = undefined;
      global.GRUPS = undefined;

      try {
        dades = extreu(text);
      } catch (error) {
        throw new Error(
          'El fitxer té un error de sintaxi i no s\'ha pogut llegir. ' +
          'Si l\'has editat a mà, revisa les comes.'
        );
      } finally {
        global.DOCENT = amagats.DOCENT;
        global.GRUPS = amagats.GRUPS;
      }

      if (!dades) {
        throw new Error(
          'El fitxer s\'ha llegit però no hi ha cap llista de classes a ' +
          'dins. Assegura\'t que és el teu fitxer de docent, o un ' +
          'alumnes.js d\'una versió anterior.'
        );
      }

      if (!dades.actualitzat) {
        dades.actualitzat = new Date().toISOString().slice(0, 10);
      }

      const error = valida(dades);
      if (error) throw new Error(error);

      return dades;
    });
  }

  /* ================================================================
   * Generar el fitxer per descarregar
   *
   * Es construeix a partir de l'objecte que tenim a memòria. La
   * versió anterior (alta.js) llegia alumnes.js amb fetch i hi feia
   * una substitució amb expressions regulars, cosa que obligava a
   * servir el projecte per http i es trencava si algú retocava el
   * format del fitxer a mà. Generant-lo des de l'objecte, ni una
   * cosa ni l'altra.
   * ============================================================= */

  function generaText(dades) {
    const capçalera = [
      '/**',
      ' * ' + (dades.fitxer || 'profdani.js'),
      ' * ─────────────────────────────────────────────────────────',
      ' * Llistes de classe de ' + (dades.docent || 'un docent') +
        (dades.curs ? ' · curs ' + dades.curs : ''),
      ' *',
      ' * AQUEST FITXER NO VA AL REPOSITORI.',
      ' *',
      ' * Generat per alta.html el ' + dades.actualitzat + '.',
      ' * Per tornar-lo a carregar: obre la pàgina i tria aquest fitxer.',
      ' * ─────────────────────────────────────────────────────────',
      ' */',
      'window.DOCENT = {',
      '',
      '  format: ' + FORMAT + ',',
      '  docent: ' + JSON.stringify(dades.docent || '') + ',',
      '  curs: ' + JSON.stringify(dades.curs || '') + ',',
      '  actualitzat: ' + JSON.stringify(dades.actualitzat) + ',',
      '',
      '  grups: {'
    ];

    const blocs = Object.keys(dades.grups).map(function (clau) {
      const grup = dades.grups[clau];
      const linies = grup.alumnes.map(function (a) {
        return '        { id: ' + JSON.stringify(a.id) +
               ', numero: ' + JSON.stringify(a.numero) +
               ', nom: ' + JSON.stringify(a.nom) + ' }';
      });
      return '    ' + JSON.stringify(clau) + ': {\n' +
             '      nom: ' + JSON.stringify(grup.nom || clau) + ',\n' +
             '      alumnes: [\n' + linies.join(',\n') + '\n      ]\n' +
             '    }';
    });

    return capçalera.join('\n') + '\n' +
           blocs.join(',\n\n') + '\n' +
           '  }\n};\n';
  }

  function descarrega(dades) {
    dades.actualitzat = new Date().toISOString().slice(0, 10);
    const nom = anomena(dades);
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

  /**
   * "Dani" + "2026-27"  →  "profdani-2627.js"
   * Sense docent        →  "profe.js"
   */
  function anomena(dades) {
    const docent = String(dades.docent || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const curs = String(dades.curs || '').replace(/[^0-9]/g, '').slice(-4);
    if (!docent) return 'profe.js';
    return 'prof' + docent + (curs ? '-' + curs : '') + '.js';
  }

  /* ================================================================
   * Pantalla de càrrega
   *
   * Surt només quan no hi ha dades. Dues sortides: carregar un
   * fitxer que ja tens, o començar de zero (que porta a l'alta, on
   * es crea el primer grup).
   * ============================================================= */

  function estils() {
    if (document.getElementById('dades-estils')) return;
    const css = document.createElement('style');
    css.id = 'dades-estils';
    css.textContent = [
      '.dades-vel{position:fixed;inset:0;z-index:9999;display:flex;',
      '  align-items:center;justify-content:center;padding:24px;',
      '  background:var(--bg-base,#f4f6f6)}',
      '.dades-quadre{width:100%;max-width:26rem;background:var(--surface,#fff);',
      '  border-radius:var(--r-card,14px);box-shadow:var(--sh-card,0 4px 14px rgba(20,30,40,.1));',
      '  padding:28px 26px}',
      '.dades-quadre h2{font-size:1.15rem;color:var(--text-1,#1c2114);margin-bottom:8px}',
      '.dades-quadre p{font-size:.9rem;line-height:1.5;color:var(--text-2,#545e5e);',
      '  margin-bottom:18px}',
      '.dades-accions{display:flex;flex-direction:column;gap:10px}',
      '.dades-btn{font:inherit;font-size:.92rem;padding:11px 18px;cursor:pointer;',
      '  border-radius:var(--r-btn,100px);border:1px solid transparent;',
      '  background:var(--blau,#2f5d8a);color:#fff;text-align:center}',
      '.dades-btn:hover{background:var(--blau-fosc,#1c3a57)}',
      '.dades-btn:focus-visible{outline:2px solid var(--blau,#2f5d8a);outline-offset:2px}',
      '.dades-btn-2{background:transparent;color:var(--text-2,#545e5e);',
      '  border-color:var(--border,rgba(20,30,40,.1))}',
      '.dades-btn-2:hover{background:var(--blau-suau,#eaf1f8);color:var(--blau-fosc,#1c3a57)}',
      '.dades-error{font-size:.86rem;line-height:1.45;color:var(--vermell,#b23a3a);',
      '  background:var(--vermell-suau,#f7e8e8);border-radius:10px;padding:10px 12px;',
      '  margin-bottom:14px}',
      '.dades-marca{position:fixed;right:12px;bottom:10px;z-index:60;display:flex;',
      '  align-items:center;gap:9px;font-size:.76rem;color:var(--text-3,#8a9494)}',
      '.dades-marca button{font:inherit;font-size:.76rem;background:none;border:none;',
      '  padding:2px 4px;color:var(--text-2,#545e5e);cursor:pointer;',
      '  text-decoration:underline;text-underline-offset:2px}',
      '.dades-marca button:hover{color:var(--vermell,#b23a3a)}',
      '@media (prefers-reduced-motion:no-preference){',
      '  .dades-quadre{animation:dades-entra .18s ease-out}}',
      '@keyframes dades-entra{from{opacity:0;transform:translateY(6px)}}'
    ].join('');
    document.head.appendChild(css);
  }

  function pantallaCarrega() {
    estils();

    const vel = document.createElement('div');
    vel.className = 'dades-vel';
    vel.innerHTML =
      '<div class="dades-quadre">' +
        '<h2>Carrega les teves classes</h2>' +
        '<p>Els noms de l\'alumnat no són en aquesta pàgina: són al teu ' +
        'fitxer. Tria\'l i quedarà desat en aquest navegador.</p>' +
        '<div class="dades-error" hidden></div>' +
        '<div class="dades-accions">' +
          '<button type="button" class="dades-btn" data-fitxer>Tria el fitxer…</button>' +
          '<button type="button" class="dades-btn dades-btn-2" data-zero>Comença de zero</button>' +
        '</div>' +
      '</div>';

    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = '.js,text/javascript';
    entrada.hidden = true;

    const error = vel.querySelector('.dades-error');

    function mostraError(missatge) {
      error.textContent = missatge;
      error.hidden = false;
    }

    vel.querySelector('[data-fitxer]').addEventListener('click', function () {
      entrada.click();
    });

    entrada.addEventListener('change', function () {
      const fitxer = entrada.files && entrada.files[0];
      if (!fitxer) return;
      error.hidden = true;

      importa(fitxer).then(function (dades) {
        if (!desa(dades)) {
          mostraError('El navegador no ha deixat desar les dades. Si ' +
                      'estàs en finestra privada, prova-ho en una de normal.');
          return;
        }
        location.reload();
      }).catch(function (e) {
        mostraError(e.message);
        entrada.value = '';
      });
    });

    vel.querySelector('[data-zero]').addEventListener('click', function () {
      const buit = {
        format: FORMAT,
        docent: '',
        curs: '',
        actualitzat: new Date().toISOString().slice(0, 10),
        grups: {}
      };
      desa(buit);
      location.href = 'alta.html';
    });

    document.body.appendChild(entrada);
    document.body.appendChild(vel);
  }

  /**
   * Marca discreta a baix a la dreta: quin fitxer hi ha carregat i
   * com treure'l. Important en un ordinador compartit.
   */
  function marca(dades) {
    estils();
    const barra = document.createElement('div');
    barra.className = 'dades-marca';

    const etiqueta = document.createElement('span');
    etiqueta.textContent = (dades.docent || 'Sense nom') +
                           (dades.curs ? ' · ' + dades.curs : '');

    const boto = document.createElement('button');
    boto.type = 'button';
    boto.textContent = 'Oblida-ho aquí';
    boto.addEventListener('click', function () {
      const segur = confirm(
        'S\'esborraran les llistes de classe d\'aquest navegador.\n\n' +
        'El teu fitxer no es toca: el podràs tornar a carregar quan vulguis.'
      );
      if (segur) oblida();
    });

    barra.appendChild(etiqueta);
    barra.appendChild(boto);
    document.body.appendChild(barra);
  }

  /* ================================================================
   * Arrencada
   * ============================================================= */

  let dades = null;

  if (global.DOCENT && !valida(global.DOCENT)) {
    // profdani.js carregat amb <script src>: mana sobre el desat.
    dades = global.DOCENT;
    desa(dades);
  } else {
    dades = recupera();
  }

  // GRUPS amb la mateixa forma que tenia alumnes.js. Els altres
  // fitxers el llegeixen com a identificador solt (GRUPS[...]), i
  // una propietat de l'objecte global es resol igual.
  global.GRUPS = dades ? dades.grups : {};

  global.DADES = {
    hiHaDades: function () { return dades !== null; },
    info: function () {
      return dades ? {
        docent: dades.docent,
        curs: dades.curs,
        actualitzat: dades.actualitzat,
        nGrups: Object.keys(dades.grups).length
      } : null;
    },
    tot: function () { return dades; },
    importa: importa,
    desa: function () { return dades ? desa(dades) : false; },
    descarrega: function () { return dades ? descarrega(dades) : null; },
    anomena: function () { return dades ? anomena(dades) : null; },
    oblida: oblida
  };

  /**
   * Sense dades, positius.js i setup.js petarien intentant pintar un
   * grup que no existeix. Com que aquest fitxer es carrega abans que
   * ells, el seu escoltador de DOMContentLoaded es registra primer, i
   * stopImmediatePropagation() evita que s'executin els altres. Així
   * no cal posar cap comprovació a la resta de fitxers.
   */
  document.addEventListener('DOMContentLoaded', function (event) {
    if (dades) {
      marca(dades);
      return;
    }
    event.stopImmediatePropagation();
    pantallaCarrega();
  });

})(window);
