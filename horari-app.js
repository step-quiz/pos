/**
 * horari-app.js
 * ---------------------------------------------------------------
 * Lògica d'horari.html: enganxar la graella d'hores i grups tal com
 * surt de l'Excel oficial del centre, i descarregar un horari.js
 * nou amb el bloc HORARI actualitzat.
 *
 * Depèn de les dades definides a dades.js (GRUPS) i horari.js
 * (FRANGES_HORARIES, textFranjaHoraria), que s'han de carregar
 * abans que aquest fitxer.
 *
 * Aquesta pàgina només regenera el bloc HORARI. FRANGES_HORARIES i
 * MAX_POSITIUS_DIA es preserven exactament tal com estiguin al
 * horari.js original — es toquen a mà si mai calgués.
 *
 * Format esperat del text enganxat: files = franges horàries
 * (1..6, en l'ordre que siguin — es reconeixen pel número, no per
 * la posició), columnes = dies de la setmana. S'accepta enganxar-ho
 * amb o sense la fila de capçalera i amb o sense les columnes
 * "hora"/"inici" inicials (tal com surt de seleccionar tot el rang
 * a l'Excel): es detecten i s'ignoren soles.
 * ---------------------------------------------------------------
 */

// Dies que es reconeixen a la capçalera, en l'ordre en què HORARI
// els indexa amb getDay() (1=dilluns...5=divendres). No es dona
// suport a caps de setmana perquè HORARI tampoc els fa servir.
const DIES_SETMANA = [
  { nom: "dilluns", getDay: 1 },
  { nom: "dimarts", getDay: 2 },
  { nom: "dimecres", getDay: 3 },
  { nom: "dijous", getDay: 4 },
  { nom: "divendres", getDay: 5 }
];

/* ----------------------------------------------------------------
 * Estat mostrat sobre l'horari actual (abans de substituir-lo)
 * ------------------------------------------------------------- */

function actualitzarEstatHorariActual() {
  const contenidor = document.getElementById("estat-horari-actual");
  const nTrams = Object.values(HORARI).reduce((total, trams) => total + trams.length, 0);

  const textOrigen = {
    navegador: `desat en aquest navegador el ${CONFIG_HORARI.actualitzat()}`,
    fitxer: "carregat des d'un fitxer",
    exemple: "encara és el d'exemple, no el teu"
  };

  if (nTrams === 0) {
    contenidor.textContent =
      "Encara no hi ha cap classe a l'horari. Enganxa la graella de l'Excel " +
      "aquí sota i clica «Desa aquest horari».";
    return;
  }

  contenidor.textContent =
    `Ara mateix hi ha ${nTrams} classes a l'horari (${textOrigen[CONFIG_HORARI.origen()]}). ` +
    `Si en deses un de nou, es SUBSTITUIRAN totes.`;
}

/* ----------------------------------------------------------------
 * Fer coincidir un nom de grup del text enganxat amb un grup real
 * ------------------------------------------------------------- */

/**
 * Normalitza un text per comparar-lo sense distingir majúscules,
 * accents ni espais: "1r ESO A", "1ESO A" i "1 eso a" es converteixen
 * tots en "1esoa". Així el matching és tolerant a petites
 * inconsistències d'escriptura entre cel·les de l'Excel.
 */
function normalitzarNomGrup(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // treu accents
    .replace(/[^a-zA-Z0-9]/g, "")    // treu espais i puntuació
    .toLowerCase();
}

/**
 * Retorna l'identificador de grup (clau de GRUPS) que coincideix amb
 * el text donat, tolerant petites diferències d'escriptura. Retorna
 * null si el text és buit (cel·la sense classe) i undefined si el
 * text no és buit però no coincideix amb cap grup conegut.
 */
function trobarGrupPerText(text) {
  const net = (text || "").trim();
  if (net.length === 0) return null;

  const netNormalitzat = normalitzarNomGrup(net);
  for (const grupId in GRUPS) {
    const nomGrup = GRUPS[grupId].nom || "";
    if (normalitzarNomGrup(grupId) === netNormalitzat) return grupId;
    if (normalitzarNomGrup(nomGrup) === netNormalitzat) return grupId;
  }
  return undefined;
}

/* ----------------------------------------------------------------
 * Parsejar el text enganxat
 * ------------------------------------------------------------- */

/**
 * Retorna true si una línia de columnes sembla la fila de capçalera
 * de l'Excel (conté "dilluns" en alguna columna) en lloc de dades.
 */
function esFilaCapcalera(columnes) {
  return columnes.some(c => normalitzarNomGrup(c) === "dilluns");
}

/**
 * Retorna true si el primer valor d'una fila és un número de franja
 * vàlid (1..6): serveix per identificar quina és la columna del
 * número de franja abans de decidir quantes columnes ens saltem.
 */
function extreureNumeroFranja(primeraColumna) {
  const net = (primeraColumna || "").trim();
  const numero = parseInt(net, 10);
  return Number.isInteger(numero) && String(numero) === net ? numero : null;
}

/**
 * Retorna true si un text sembla una hora en format "H:MM" o
 * "HH:MM" (com la columna "inici" de l'Excel, p. ex. "8:15").
 * Serveix per detectar si s'ha enganxat aquesta columna o no.
 */
function semblaHora(text) {
  return /^\d{1,2}:\d{2}$/.test((text || "").trim());
}

/**
 * Parseja el text enganxat a una estructura intermèdia:
 *   { files: [{ numeroFranja, columnesGrups: [...5 columnes...] }],
 *     avisos: [...text d'avisos per mostrar a l'usuari...] }
 *
 * columnesGrups té sempre 5 posicions (dilluns..divendres), amb el
 * text tal com s'ha enganxat a cada cel·la (encara sense fer el
 * matching contra GRUPS, això es fa a part).
 */
function parsejarGraella(text) {
  const avisos = [];
  const liniesBrutes = text
    .split("\n")
    .map(l => l.replace(/\r$/, ""))
    .filter(l => l.trim().length > 0);

  if (liniesBrutes.length === 0) {
    return { files: [], avisos: [] };
  }

  const totesLesFiles = liniesBrutes.map(l => l.split("\t"));

  // Ens saltem la fila de capçalera si n'hi ha una.
  const primeraEsCapcalera = esFilaCapcalera(totesLesFiles[0]);
  const filesDades = primeraEsCapcalera ? totesLesFiles.slice(1) : totesLesFiles;

  const files = [];

  filesDades.forEach((columnes, index) => {
    const numeroLiniaOriginal = index + 1 + (primeraEsCapcalera ? 1 : 0);

    // La primera columna sempre és el número de franja: nosaltres
    // sempre ens la saltem. A més, si la segona columna sembla una
    // hora ("8:15"), és la columna "inici" de l'Excel i també ens la
    // saltem; si no, ja comença directament la columna "dilluns".
    const numeroFranja = extreureNumeroFranja(columnes[0]);
    if (numeroFranja === null) {
      avisos.push(
        `Línia ${numeroLiniaOriginal}: no hi trobo un número de franja vàlid ` +
        `a la primera columna ("${columnes[0] || ""}"). S'ha ignorat aquesta línia.`
      );
      return;
    }

    const inici = semblaHora(columnes[1]) ? 2 : 1;

    const columnesGrups = columnes.slice(inici, inici + 5);
    while (columnesGrups.length < 5) columnesGrups.push("");

    files.push({ numeroFranja, columnesGrups, numeroLiniaOriginal });
  });

  return { files, avisos };
}

/**
 * A partir de l'estructura intermèdia de parsejarGraella, construeix
 * el HORARI final (per getDay()) i acumula avisos de qualsevol
 * cel·la que no s'hagi pogut identificar com un grup conegut.
 */
function construirHorariIAvisos(files) {
  const horari = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  const avisos = [];

  for (const fila of files) {
    DIES_SETMANA.forEach((dia, columnaIndex) => {
      const textCella = fila.columnesGrups[columnaIndex] || "";
      const grupId = trobarGrupPerText(textCella);

      if (grupId === null) return; // cel·la buida: sense classe, correcte
      if (grupId === undefined) {
        avisos.push(
          `Franja ${fila.numeroFranja}, ${dia.nom}: "${textCella}" no coincideix ` +
          `amb cap grup conegut (1r ESO A, 1r ESO B, 4t ESO). S'ha ignorat aquesta cel·la.`
        );
        return;
      }

      horari[dia.getDay].push({
        hora: textFranjaHoraria(fila.numeroFranja),
        grup: grupId
      });
    });
  }

  // Cada dia, ordenem els trams per número de franja (l'ordre en què
  // s'han enganxat les files pot no coincidir amb l'ordre horari).
  for (const getDayKey in horari) {
    horari[getDayKey].sort((a, b) => {
      const numA = FRANGES_HORARIES.find(f => textFranjaHoraria(f.numero) === a.hora)?.numero || 0;
      const numB = FRANGES_HORARIES.find(f => textFranjaHoraria(f.numero) === b.hora)?.numero || 0;
      return numA - numB;
    });
  }

  return { horari, avisos };
}

/* ----------------------------------------------------------------
 * Previsualització
 * ------------------------------------------------------------- */

/**
 * Dibuixa una graella (6 franges x 5 dies) amb el resultat del
 * parsing actual, i mostra els avisos acumulats. Habilita el botó
 * de descàrrega només si hi ha almenys una classe reconeguda.
 */
function actualitzarPrevisualitzacio() {
  const text = document.getElementById("textarea-horari").value;
  const { files, avisos: avisosParsing } = parsejarGraella(text);
  const { horari, avisos: avisosMatching } = construirHorariIAvisos(files);
  const avisos = [...avisosParsing, ...avisosMatching];

  const nClasses = Object.values(horari).reduce((total, trams) => total + trams.length, 0);

  const comptador = document.getElementById("previsualitzacio-comptador");
  const contenidorGraella = document.getElementById("previsualitzacio-graella");
  const contenidorAvisos = document.getElementById("previsualitzacio-avisos");

  contenidorGraella.innerHTML = "";
  contenidorAvisos.innerHTML = "";

  if (text.trim().length === 0) {
    comptador.textContent = "Encara no has enganxat cap horari.";
    horariPrevisualitzat = null;
    actualitzarBotons();
    return;
  }

  comptador.textContent = `${nClasses} classes detectades.`;
  horariPrevisualitzat = nClasses > 0 ? horari : null;
  actualitzarBotons();

  dibuixarGraellaPrevisualitzacio(contenidorGraella, horari);

  for (const avis of avisos) {
    const item = document.createElement("li");
    item.textContent = avis;
    contenidorAvisos.appendChild(item);
  }
}

function dibuixarGraellaPrevisualitzacio(contenidor, horari) {
  const taula = document.createElement("table");

  const capçalera = document.createElement("tr");
  capçalera.appendChild(document.createElement("th"));
  for (const dia of DIES_SETMANA) {
    const th = document.createElement("th");
    th.textContent = dia.nom.slice(0, 3);
    capçalera.appendChild(th);
  }
  taula.appendChild(capçalera);

  for (const franja of FRANGES_HORARIES) {
    const fila = document.createElement("tr");

    const thHora = document.createElement("th");
    thHora.textContent = `${franja.numero}a`;
    thHora.title = textFranjaHoraria(franja.numero);
    fila.appendChild(thHora);

    for (const dia of DIES_SETMANA) {
      const td = document.createElement("td");
      const tram = (horari[dia.getDay] || []).find(
        t => t.hora === textFranjaHoraria(franja.numero)
      );
      if (tram) {
        td.textContent = GRUPS[tram.grup]?.nom || tram.grup;
        td.classList.add("cella-ocupada");
      }
      fila.appendChild(td);
    }

    taula.appendChild(fila);
  }

  contenidor.appendChild(taula);
}

// Últim HORARI parsejat correctament, llest per descarregar.
let horariPrevisualitzat = null;

/* ----------------------------------------------------------------
 * Desar, exportar i importar l'horari
 * ---------------------------------------------------------------
 * L'horari NO viu a horari.js: es desa en aquest navegador (vegeu
 * horari.js, que és només el carregador). Per això el botó important
 * d'aquesta pàgina és "Desa", no la descàrrega: desant-lo ja queda
 * actiu a la resta de pàgines, i hi continua després de tancar la
 * pestanya. La descàrrega és una còpia de seguretat.
 * ------------------------------------------------------------- */

/**
 * Desa l'horari previsualitzat i el deixa actiu immediatament. No
 * cal recarregar res: HORARI apunta al mateix objecte que acabem de
 * substituir.
 */
function desarHorari() {
  if (!horariPrevisualitzat) return;

  const nTrams = Object.values(horariPrevisualitzat)
    .reduce((total, trams) => total + trams.length, 0);

  const confirmat = confirm(
    `Vols substituir l'horari actual per aquest, amb ${nTrams} classes?\n\n` +
    `Quedarà desat en aquest navegador i actiu de seguida a la resta de ` +
    `pàgines. L'horari anterior no es pot recuperar.`
  );
  if (!confirmat) return;

  const desat = CONFIG_HORARI.desaHorari(horariPrevisualitzat);
  const contenidor = document.getElementById("estat-horari-actual");

  if (!desat) {
    contenidor.textContent =
      "El navegador no ha deixat desar l'horari. Si estàs en una finestra " +
      "privada, prova-ho en una de normal.";
    return;
  }

  actualitzarEstatHorariActual();
  actualitzarBotons();

  document.getElementById("estat-horari-actual").textContent +=
    " Descarrega'n una còpia si vols poder-lo recuperar en un altre ordinador.";
}

function descarregarCopiaHorari() {
  const nom = CONFIG_HORARI.descarrega();
  document.getElementById("estat-horari-actual").textContent =
    `S'ha descarregat ${nom}. Guarda'l per poder recuperar aquest horari ` +
    `en un altre ordinador o si esborres les dades del navegador.`;
}

/**
 * Carrega un fitxer d'horari descarregat abans (o un horari.js d'una
 * versió anterior). No cal recarregar: el carregador republica
 * HORARI i aquí només hem de refrescar el que es veu.
 */
function importarHorari(fitxer) {
  const contenidor = document.getElementById("estat-horari-actual");

  CONFIG_HORARI.importa(fitxer).then((dades) => {
    if (!CONFIG_HORARI.desaTot(dades)) {
      contenidor.textContent =
        "El navegador no ha deixat desar l'horari. Si estàs en una finestra " +
        "privada, prova-ho en una de normal.";
      return;
    }
    actualitzarEstatHorariActual();
    contenidor.textContent =
      `S'ha carregat ${fitxer.name} i ja és l'horari actiu. ` +
      contenidor.textContent;
  }).catch((error) => {
    contenidor.textContent = error.message;
  });
}

function inicialitzarCarregaHorari() {
  const boto = document.getElementById("boto-carregar-horari");
  const entrada = document.getElementById("fitxer-horari");
  if (!boto || !entrada) return;

  boto.addEventListener("click", () => entrada.click());

  entrada.addEventListener("change", () => {
    const fitxer = entrada.files && entrada.files[0];
    if (!fitxer) return;
    importarHorari(fitxer);
    entrada.value = "";
  });
}

/**
 * "Desa" només té sentit si hi ha una graella vàlida enganxada; la
 * descàrrega, en canvi, sempre serveix (exporta l'horari actiu).
 */
function actualitzarBotons() {
  const desar = document.getElementById("boto-desar-horari");
  if (desar) desar.disabled = horariPrevisualitzat === null;
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

function iniciarHorariApp() {
  actualitzarEstatHorariActual();
  actualitzarPrevisualitzacio();
  actualitzarBotons();
  inicialitzarCarregaHorari();

  document
    .getElementById("textarea-horari")
    .addEventListener("input", () => {
      actualitzarPrevisualitzacio();
      actualitzarBotons();
    });

  document
    .getElementById("boto-desar-horari")
    .addEventListener("click", desarHorari);

  document
    .getElementById("boto-descarregar-horari")
    .addEventListener("click", descarregarCopiaHorari);
}

document.addEventListener("DOMContentLoaded", iniciarHorariApp);
