/**
 * positius.js
 * ---------------------------------------------------------------
 * Tota la "feina" de l'aplicació: saber quina classe toca ara,
 * dibuixar la graella d'alumnes amb la disposició de l'aula, i
 * assignar positius (amb el límit per tram horari).
 *
 * Els positius es guarden per "tram": un dia concret + una hora
 * concreta (p. ex. "2026-08-03" + "1a hora"). Així, si un mateix
 * grup té dues classes el mateix dia, cada hora té el seu propi
 * comptador i el seu propi límit — no se sumen entre elles.
 *
 * Depèn de les dades definides a tres fitxers, que s'han de
 * carregar abans que aquest:
 *   - alumnes.js  (GRUPS: noms de classe i llista d'alumnes)
 *   - seients.js  (DISPOSICIO_AULA, SEIENTS: on seu cada alumne)
 *   - horari.js   (HORARI, MAX_POSITIUS_DIA)
 *
 * Persistència: els positius es desen al localStorage del navegador,
 * així que es mantenen encara que es recarregui la pàgina. No hi ha
 * cap servidor: tot viu al navegador del professor.
 *
 * El full de càlcul en si NO es mostra en aquesta pàgina: es
 * descarrega dia a dia com a Excel des del bloc "Baixada" (vegeu
 * exportar.js), per enganxar-lo directament al full de qualificacions.
 * ---------------------------------------------------------------
 */

const CLAU_EMMAGATZEMATGE = "positius-app-v1";

/**
 * Identificador de tram horari que fem servir quan es consulta
 * l'aplicació fora de l'horari de classe (p. ex. un cap de setmana,
 * o per repassar). Els positius assignats en aquest moment es
 * guarden en un tram propi per no barrejar-los amb cap hora real.
 */
const HORA_FORA_HORARI = "fora d'horari";

/* ----------------------------------------------------------------
 * Estat en memòria
 * ------------------------------------------------------------- */

// Estructura: dades[grupId][tramId][alumneId] = nombre de positius
// tramId té la forma "AAAA-MM-DD__<hora>", vegeu crearTramId().
let dades = carregarDades();

// Grup que s'està mostrant ara mateix a la pantalla
let grupActiu = null;

/* ----------------------------------------------------------------
 * Persistència (localStorage)
 * ------------------------------------------------------------- */

function carregarDades() {
  try {
    const desat = localStorage.getItem(CLAU_EMMAGATZEMATGE);
    return desat ? JSON.parse(desat) : {};
  } catch (error) {
    console.error("No s'han pogut carregar els positius desats:", error);
    return {};
  }
}

function desarDades() {
  try {
    localStorage.setItem(CLAU_EMMAGATZEMATGE, JSON.stringify(dades));
  } catch (error) {
    console.error("No s'han pogut desar els positius:", error);
  }
}

/* ----------------------------------------------------------------
 * Utilitats de data i horari
 * ------------------------------------------------------------- */

/**
 * Retorna la data d'avui en format "AAAA-MM-DD", que és la clau que
 * fem servir per identificar el dia (equival a una columna del full
 * de càlcul).
 */
function dataAvuiISO() {
  const ara = new Date();
  const y = ara.getFullYear();
  const m = String(ara.getMonth() + 1).padStart(2, "0");
  const d = String(ara.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Retorna la llista de trams de classe d'avui, segons HORARI.
 * Cada tram és { hora, grup }.
 */
function tramsHoraris_avui() {
  const diaSetmana = new Date().getDay(); // 0=diumenge ... 6=dissabte
  return HORARI[diaSetmana] || [];
}

/**
 * Retorna un text llegible del dia d'avui, p. ex. "dilluns 3 d'agost".
 */
function textDataAvui() {
  const ara = new Date();
  return ara.toLocaleDateString("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}

/**
 * Construeix l'identificador únic d'un tram (dia + hora concrets),
 * que és la clau que fem servir per desar i llegir els positius.
 */
function crearTramId(dataISO, hora) {
  return `${dataISO}__${hora}`;
}

/**
 * Desfà crearTramId(): retorna { dataISO, hora } a partir d'un tramId.
 */
function descompondreTramId(tramId) {
  const separadorIdx = tramId.indexOf("__");
  return {
    dataISO: tramId.slice(0, separadorIdx),
    hora: tramId.slice(separadorIdx + 2)
  };
}

/**
 * Retorna el tram horari "actiu" ara mateix per a un grup concret:
 * si avui l'horari té una classe d'aquest grup que ja ha començat i
 * encara no s'ha acabat el dia... en un prototip senzill, ens fixem
 * només en si avui hi ha alguna classe d'aquest grup, i fem servir
 * la primera que trobem. Si no n'hi ha cap, els positius es desen
 * sota HORA_FORA_HORARI, per no barrejar-los amb cap hora real.
 */
function tramActiuPerGrup(grupId) {
  const trams = tramsHoraris_avui().filter(t => t.grup === grupId);
  const hora = trams[0]?.hora || HORA_FORA_HORARI;
  return crearTramId(dataAvuiISO(), hora);
}

/* ----------------------------------------------------------------
 * Accés als positius d'un alumne
 * ------------------------------------------------------------- */

function positiusDelTram(grupId, alumneId, tramId) {
  return dades?.[grupId]?.[tramId]?.[alumneId] || 0;
}

/**
 * Afegeix un positiu a un alumne en el tram horari actiu ara mateix,
 * respectant el límit MAX_POSITIUS_DIA (per tram, no per dia sencer).
 * Retorna true si s'ha afegit, false si ja s'havia arribat al màxim.
 */
function afegirPositiu(grupId, alumneId) {
  const tram = tramActiuPerGrup(grupId);

  if (!dades[grupId]) dades[grupId] = {};
  if (!dades[grupId][tram]) dades[grupId][tram] = {};

  const actual = dades[grupId][tram][alumneId] || 0;
  if (actual >= MAX_POSITIUS_DIA) {
    return false;
  }

  dades[grupId][tram][alumneId] = actual + 1;
  desarDades();
  return true;
}

/**
 * Treu un positiu del tram horari actiu a un alumne (per corregir un
 * clic per error). Retorna true si s'ha tret, false si ja era a 0.
 */
function treurePositiu(grupId, alumneId) {
  const tram = tramActiuPerGrup(grupId);
  const actual = dades?.[grupId]?.[tram]?.[alumneId] || 0;

  if (actual <= 0) return false;

  dades[grupId][tram][alumneId] = actual - 1;
  desarDades();
  return true;
}

/* ----------------------------------------------------------------
 * Selecció del grup a mostrar
 * ------------------------------------------------------------- */

/**
 * Omple el selector de grup amb: primer els grups que toquen avui
 * segons l'horari (marcats), i després la resta de grups per si el
 * professor vol consultar-los igualment.
 */
function inicialitzarSelectorGrups() {
  const selector = document.getElementById("selector-grup");
  selector.innerHTML = "";

  const grupsAvui = new Set(tramsHoraris_avui().map(tram => tram.grup));

  for (const grupId in GRUPS) {
    const opcio = document.createElement("option");
    opcio.value = grupId;
    const marca = grupsAvui.has(grupId) ? "● " : "";
    opcio.textContent = `${marca}${GRUPS[grupId].nom}`;
    selector.appendChild(opcio);
  }

  // Per defecte, seleccionem el primer grup que toca avui, si n'hi ha.
  const primerGrupAvui = tramsHoraris_avui()[0]?.grup;
  selector.value = primerGrupAvui || Object.keys(GRUPS)[0];

  selector.addEventListener("change", () => {
    mostrarGrup(selector.value);
  });
}

/**
 * Mostra a la capçalera quins trams de classe té el professor avui
 * amb aquest grup (pot no tenir-ne cap, si el consulta fora d'hora).
 */
function actualitzarInfoHorari() {
  const contenidor = document.getElementById("info-horari");
  const trams = tramsHoraris_avui();

  contenidor.textContent = "";
  const capçalera = document.createElement("span");
  capçalera.className = "info-horari-dia";
  capçalera.textContent = `Avui és ${textDataAvui()}.`;
  contenidor.appendChild(capçalera);

  if (trams.length === 0) {
    const sense = document.createElement("span");
    sense.textContent = " Avui no hi ha cap classe a l'horari.";
    contenidor.appendChild(sense);
    return;
  }

  const detall = document.createElement("span");
  detall.textContent = " Classes d'avui: " +
    trams.map(t => `${GRUPS[t.grup].nom} (${t.hora})`).join(" · ");
  contenidor.appendChild(detall);
}

/* ----------------------------------------------------------------
 * Renderitzat de la graella d'alumnes (disposició de l'aula)
 * ------------------------------------------------------------- */

/**
 * Agrupa els seients d'un grup per fila i taula, per poder dibuixar
 * cada alumne a la mateixa posició física que ocupa a l'aula.
 * Retorna { [fila]: { [taula]: { esquerra: alumneId, dreta: alumneId } } }.
 */
function agruparSeientsPerFilaITaula(grupId) {
  const seients = SEIENTS[grupId] || [];
  const files = {};

  for (const seient of seients) {
    if (!files[seient.fila]) files[seient.fila] = {};
    if (!files[seient.fila][seient.taula]) files[seient.fila][seient.taula] = {};
    files[seient.fila][seient.taula][seient.costat] = seient.alumneId;
  }

  return files;
}

/**
 * Retorna l'objecte alumne { id, nom } a partir del seu id, cercant
 * dins la llista d'alumnes del grup (alumnes.js).
 */
function trobarAlumne(grupId, alumneId) {
  return GRUPS[grupId].alumnes.find(a => a.id === alumneId);
}

function crearTargetaAlumne(grupId, alumne) {
  const targeta = document.createElement("button");
  targeta.type = "button";
  targeta.className = "alumne";
  targeta.dataset.alumneId = alumne.id;

  const nom = document.createElement("span");
  nom.className = "alumne-nom";
  nom.textContent = alumne.nom;

  const comptador = document.createElement("span");
  comptador.className = "alumne-comptador";

  targeta.appendChild(nom);
  targeta.appendChild(comptador);

  function refrescar() {
    const tram = tramActiuPerGrup(grupId);
    const positius = positiusDelTram(grupId, alumne.id, tram);
    comptador.textContent = "+".repeat(positius);
    targeta.classList.toggle("alumne--maxim", positius >= MAX_POSITIUS_DIA);
    targeta.setAttribute(
      "aria-label",
      `${alumne.nom}: ${positius} de ${MAX_POSITIUS_DIA} positius en aquesta hora`
    );
  }

  targeta.addEventListener("click", () => {
    const afegit = afegirPositiu(grupId, alumne.id);
    refrescar();
    actualitzarDependentsDeDades(grupId);

    if (!afegit) {
      targeta.classList.add("alumne--rebot");
      setTimeout(() => targeta.classList.remove("alumne--rebot"), 220);
    }
  });

  // Clic dret (o long-press amb el botó secundari) per desfer un positiu.
  targeta.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    treurePositiu(grupId, alumne.id);
    refrescar();
    actualitzarDependentsDeDades(grupId);
  });

  refrescar();
  return targeta;
}

/**
 * Dibuixa la graella d'alumnes del grup indicat, amb 3 columnes de
 * taules (parelles) i tantes files com calgui, tal com estan asseguts
 * a l'aula. Els alumnes sense seient assignat (per exemple, un grup
 * acabat de donar d'alta amb alta.html i encara sense passar per
 * setup.html) simplement deixen la seva taula buida.
 */
function renderitzarGraella(grupId) {
  const contenidor = document.getElementById("graella-aula");
  contenidor.innerHTML = "";
  contenidor.style.setProperty("--taules-per-fila", DISPOSICIO_AULA.parelles_per_fila);

  const filesAgrupades = agruparSeientsPerFilaITaula(grupId);

  for (let f = 1; f <= DISPOSICIO_AULA.files; f++) {
    const filaEl = document.createElement("div");
    filaEl.className = "fila-aula";

    for (let t = 1; t <= DISPOSICIO_AULA.parelles_per_fila; t++) {
      const taulaEl = document.createElement("div");
      taulaEl.className = "taula-parella";

      const parella = filesAgrupades[f]?.[t] || {};

      const alumneEsquerra = parella.esquerra ? trobarAlumne(grupId, parella.esquerra) : null;
      const alumneDreta = parella.dreta ? trobarAlumne(grupId, parella.dreta) : null;

      taulaEl.appendChild(
        alumneEsquerra ? crearTargetaAlumne(grupId, alumneEsquerra) : buitAlumne()
      );
      taulaEl.appendChild(
        alumneDreta ? crearTargetaAlumne(grupId, alumneDreta) : buitAlumne()
      );

      filaEl.appendChild(taulaEl);
    }

    contenidor.appendChild(filaEl);
  }
}

function buitAlumne() {
  const buit = document.createElement("div");
  buit.className = "alumne alumne--buit";
  return buit;
}

/* ----------------------------------------------------------------
 * Trams amb dades: usat des d'exportar.js per omplir el selector
 * de "quin dia i hora vull descarregar".
 * ------------------------------------------------------------- */

/**
 * Retorna, ordenats cronològicament, tots els tramId que tenen algun
 * positiu registrat per aquest grup.
 */
function tramsAmbDades(grupId) {
  const perTram = dades[grupId] || {};
  return Object.keys(perTram).sort(); // "AAAA-MM-DD__hora" ordena bé per data
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

/**
 * Actualitza tot allò que depèn de les dades de positius d'un grup
 * (per ara, només el selector d'exportació). Es crida després de
 * cada clic i en canviar de grup.
 */
function actualitzarDependentsDeDades(grupId) {
  // Definida a exportar.js: refresca el selector de dia+hora a exportar.
  if (typeof actualitzarSelectorExportacio === "function") {
    actualitzarSelectorExportacio(grupId);
  }
}

function mostrarGrup(grupId) {
  grupActiu = grupId;
  document.getElementById("titol-grup").textContent = GRUPS[grupId].nom;
  renderitzarGraella(grupId);
  actualitzarDependentsDeDades(grupId);
}

function iniciarApp() {
  inicialitzarSelectorGrups();
  actualitzarInfoHorari();

  const grupInicial = document.getElementById("selector-grup").value;
  mostrarGrup(grupInicial);
}

document.addEventListener("DOMContentLoaded", iniciarApp);
