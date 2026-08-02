/**
 * horari-app.js
 * ---------------------------------------------------------------
 * Lògica d'horari.html: enganxar la graella d'hores i grups tal com
 * surt de l'Excel oficial del centre, i descarregar un horari.js
 * nou amb el bloc HORARI actualitzat.
 *
 * Depèn de les dades definides a alumnes.js (GRUPS) i horari.js
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

// Text font original d'horari.js, carregat amb fetch, usat com a
// plantilla per generar el fitxer final (mateix patró que alta.js
// amb alumnes.js i setup.js amb seients.js).
let textHorariOriginal = null;

/* ----------------------------------------------------------------
 * Estat mostrat sobre l'horari actual (abans de substituir-lo)
 * ------------------------------------------------------------- */

function actualitzarEstatHorariActual() {
  const contenidor = document.getElementById("estat-horari-actual");
  const nTrams = Object.values(HORARI).reduce((total, trams) => total + trams.length, 0);

  if (nTrams === 0) {
    contenidor.textContent = "Encara no hi ha cap classe a l'horari.";
  } else {
    contenidor.textContent =
      `Ara mateix hi ha ${nTrams} classes repartides a l'horari. ` +
      `Si continues, es SUBSTITUIRAN completament per la graella nova.`;
  }
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
  const boto = document.getElementById("boto-descarregar-horari");
  const contenidorGraella = document.getElementById("previsualitzacio-graella");
  const contenidorAvisos = document.getElementById("previsualitzacio-avisos");

  contenidorGraella.innerHTML = "";
  contenidorAvisos.innerHTML = "";

  if (text.trim().length === 0) {
    comptador.textContent = "Encara no has enganxat cap horari.";
    boto.disabled = true;
    horariPrevisualitzat = null;
    return;
  }

  comptador.textContent = `${nClasses} classes detectades.`;
  boto.disabled = nClasses === 0;
  horariPrevisualitzat = horari;

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
 * Generació de l'horari.js final
 * ------------------------------------------------------------- */

async function carregarTextHorariOriginal() {
  const resposta = await fetch("horari.js");
  textHorariOriginal = await resposta.text();
}

/**
 * Genera el codi del bloc "const HORARI = { ... };" a partir de
 * l'estructura horariPrevisualitzat, amb el mateix estil que ja fem
 * servir a horari.js (una línia per tram, comentari amb el nom del
 * dia, textFranjaHoraria(...) en lloc d'hora escrita a mà).
 */
function generarBlocHorari(horari) {
  const nomsDies = {
    1: "Dilluns", 2: "Dimarts", 3: "Dimecres", 4: "Dijous", 5: "Divendres"
  };

  const filesDies = [1, 2, 3, 4, 5].map(getDayKey => {
    const trams = horari[getDayKey] || [];
    const comentari = nomsDies[getDayKey];

    if (trams.length === 0) {
      return `  ${getDayKey}: [], // ${comentari}`;
    }

    const numerosFranja = trams.map(t =>
      FRANGES_HORARIES.find(f => textFranjaHoraria(f.numero) === t.hora)?.numero
    );

    const liniesTrams = trams.map((t, i) =>
      `    { hora: textFranjaHoraria(${numerosFranja[i]}), grup: ${JSON.stringify(t.grup)} }`
    );

    return `  ${getDayKey}: [ // ${comentari}\n${liniesTrams.join(",\n")}\n  ]`;
  });

  return `const HORARI = {\n${filesDies.join(",\n")}\n};`;
}

/**
 * Substitueix, dins el text original d'horari.js, el bloc
 * "const HORARI = { ... };" pel generat a partir de la
 * previsualització actual. FRANGES_HORARIES i MAX_POSITIUS_DIA
 * queden intactes.
 */
function generarTextHorariActualitzat(horari) {
  const patroBloc = /const HORARI = \{[\s\S]*?\n\};/;

  if (!patroBloc.test(textHorariOriginal)) {
    console.error("No s'ha trobat el bloc 'const HORARI = { ... };' a horari.js");
    return textHorariOriginal;
  }

  return textHorariOriginal.replace(patroBloc, generarBlocHorari(horari));
}

async function descarregarHorariActualitzat() {
  if (!horariPrevisualitzat) return;

  if (!textHorariOriginal) {
    try {
      await carregarTextHorariOriginal();
    } catch (error) {
      console.error("No s'ha pogut carregar horari.js:", error);
      alert(
        "No s'ha pogut llegir horari.js del servidor, així que no es pot " +
        "generar la descàrrega. Comprova que la pàgina s'obre per http(s) " +
        "(amb un servidor local), no fent doble clic sobre el fitxer."
      );
      return;
    }
  }

  const text = generarTextHorariActualitzat(horariPrevisualitzat);
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const enllaç = document.createElement("a");
  enllaç.href = url;
  enllaç.download = "horari.js";
  document.body.appendChild(enllaç);
  enllaç.click();
  document.body.removeChild(enllaç);

  URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

async function iniciarHorariApp() {
  actualitzarEstatHorariActual();
  actualitzarPrevisualitzacio();

  document
    .getElementById("textarea-horari")
    .addEventListener("input", actualitzarPrevisualitzacio);

  document
    .getElementById("boto-descarregar-horari")
    .addEventListener("click", descarregarHorariActualitzat);

  try {
    await carregarTextHorariOriginal();
  } catch (error) {
    console.error("No s'ha pogut carregar horari.js:", error);
    const contenidor = document.getElementById("estat-horari-actual");
    contenidor.textContent =
      "No s'ha pogut llegir horari.js del servidor. Comprova que el fitxer " +
      "és a la mateixa carpeta i que la pàgina s'obre per http(s), no com a fitxer local.";
  }
}

document.addEventListener("DOMContentLoaded", iniciarHorariApp);
