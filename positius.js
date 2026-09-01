/**
 * positius.js
 * ---------------------------------------------------------------
 * Tota la "feina" de l'aplicació: saber quina classe toca ara,
 * dibuixar la graella d'alumnes amb la disposició de l'aula, i
 * assignar positius i negatius (amb el límit per tram horari), de
 * dues maneres complementàries:
 *   - M1 (per defecte): clic/Ctrl+clic a la targeta de l'alumne.
 *   - M2 (activable amb el toggle de la capçalera): teclejant el
 *     "numero" de 2 xifres de l'alumne (p. ex. "17"), sense clicar
 *     ni prémer Intro. M2 anul·la M1 mentre està activa: els clics
 *     a la graella deixen de fer res. Vegeu la secció "Mode M2" més
 *     avall per al detall del comportament.
 *
 * Un alumne pot rebre positius i negatius, i cada negatiu val
 * PES_NEGATIU punts en contra (vegeu horari.js): el "valor" d'un
 * alumne en un tram és sempre positius - PES_NEGATIU × negatius, i
 * és aquest valor combinat el que es limita entre VALOR_MINIM_TRAM i
 * MAX_POSITIUS_DIA — no els comptadors de positius i negatius per
 * separat.
 *
 * Gestos de M1: clic suma un positiu, clic dret en resta un (per
 * corregir un clic per error); Ctrl+clic suma un negatiu, Ctrl+clic
 * dret en resta un. Gestos de M2: escriure el "numero" de l'alumne
 * assigna un positiu; prement "-" abans (amb el buffer buit) el
 * pròxim codi s'aplica com a negatiu en comptes de positiu (prémer
 * "-" un altre cop, encara sense cap dígit, ho desfà).
 *
 * Els positius i negatius es guarden per "tram": un dia concret + una
 * hora concreta (p. ex. "2026-08-03" + "1a hora"). Així, si un mateix
 * grup té dues classes el mateix dia, cada hora té el seu propi
 * comptador i el seu propi límit — no se sumen entre elles. Això val
 * igual per M1 i per M2: totes dues criden les mateixes
 * afegirPositiu()/afegirNegatiu().
 *
 * Depèn de les dades definides a tres fitxers, que s'han de
 * carregar abans que aquest:
 *   - alumnes.js  (GRUPS: noms de classe i llista d'alumnes, cada
 *                  alumne amb el seu "numero" de 2 xifres per M2)
 *   - seients.js  (DISPOSICIO_AULA, SEIENTS: on seu cada alumne)
 *   - horari.js   (HORARI, MAX_POSITIUS_DIA, VALOR_MINIM_TRAM,
 *                  PES_NEGATIU)
 *
 * Persistència: els positius i negatius es desen al localStorage del
 * navegador, així que es mantenen encara que es recarregui la
 * pàgina. No hi ha cap servidor: tot viu al navegador del professor.
 * El mode M1/M2, en canvi, NO es desa: cada recàrrega comença en M1.
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

/**
 * Temps de bloqueig del mode M2 (teclat) després de formar-se un
 * codi de 2 dígits, en mil·lisegons. Són dos casos ben diferents:
 *   - ENCERT (l'alumne existeix): bloqueig curt, només perquè dos
 *     clics/codis consecutius no es trepitgin.
 *   - ERROR (cap alumne amb aquest número al grup actiu): bloqueig
 *     llarg, perquè el professor s'adoni que el codi no ha funcionat
 *     abans de poder-ne teclejar un altre.
 */
// En cas d'encert, aquest mateix temps és també el que el nom de
// l'alumne queda visible a l'indicador abans de netejar-se: els dos
// comparteixen un únic temporitzador (vegeu processarDigitM2).
const M2_BLOQUEIG_ENCERT_MS = 400;
const M2_BLOQUEIG_ERROR_MS = 2000;

/* ----------------------------------------------------------------
 * Estat en memòria
 * ------------------------------------------------------------- */

// Estructura: dades[grupId][tramId][alumneId] = { positius, negatius }
// tramId té la forma "AAAA-MM-DD__<hora>", vegeu crearTramId().
//
// Abans d'afegir els negatius, aquest valor era directament un
// número (el comptador de positius). registreDelTram() normalitza
// aquest format antic en llegir-lo, així que localStorage desat amb
// una versió anterior de l'app segueix funcionant sense migració.
let dades = carregarDades();

// Grup que s'està mostrant ara mateix a la pantalla
let grupActiu = null;

// Mapa alumneId -> { targeta, refrescar } de la graella actualment
// dibuixada, per poder-hi accedir des de fora de crearTargetaAlumne
// (per exemple, des del mode M2, que no clica cap targeta però
// necessita el mateix flaix visual que un clic normal). Es
// reconstrueix sencer a cada renderitzarGraella().
let targetesPerAlumneId = new Map();

/* ----------------------------------------------------------------
 * Mode d'entrada: M1 (clic a la graella) o M2 (teclat, dos dígits)
 * ------------------------------------------------------------- */

// "M1" (per defecte, clic a les targetes) o "M2" (teclat, sense
// clicar). Mai es desa entre sessions: cada recàrrega comença en M1.
let modeActual = "M1";

// Dígits acumulats del codi que s'està escrivint en mode M2 (0, 1 o
// 2 caràcters). Es buida en formar-se un codi complet (èxit o error)
// i durant el període de bloqueig posterior.
let buffM2 = "";

// Mentre val true, el mode M2 ignora qualsevol tecla nova: és el
// "cadenat" que implementa tant el cooldown curt (0.4s) d'un codi
// encertat com la penalització llarga (2s) d'un codi que no
// correspon a cap alumne.
let bloquejatM2 = false;

// Identificador del setTimeout actiu que desbloquejarà bloquejatM2,
// per poder-lo cancel·lar si cal (per exemple si es desactiva M2 a
// mig bloqueig). Sempre hi ha com a màxim un temporitzador actiu.
let timeoutBloquejM2 = null;

// Quan val true, el pròxim codi complet de 2 dígits s'aplicarà com a
// negatiu en comptes de positiu. S'activa prement "-" amb el buffer
// buit (buffM2 === ""); prement "-" una segona vegada, encara sense
// cap dígit, ho desfà. Es reinicia a false en resoldre's un codi
// (encert o error, vegeu processarDigitM2) i també en canviar de
// mode (vegeu establirMode).
let m2PendentNegatiu = false;

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
 * Accés als positius i negatius d'un alumne
 * ------------------------------------------------------------- */

/**
 * Retorna el registre brut { positius, negatius } d'un alumne en un
 * tram concret. Normalitza el format antic (un únic número, d'abans
 * d'afegir els negatius) a la forma nova sense tocar les dades
 * desades — només en la lectura, així que localStorage vell no cal
 * migrar-lo a mà.
 */
function registreDelTram(grupId, alumneId, tramId) {
  const valor = dades?.[grupId]?.[tramId]?.[alumneId];
  if (valor === undefined || valor === null) return { positius: 0, negatius: 0 };
  if (typeof valor === "number") return { positius: valor, negatius: 0 }; // format antic
  return { positius: valor.positius || 0, negatius: valor.negatius || 0 };
}

function positiusDelTram(grupId, alumneId, tramId) {
  return registreDelTram(grupId, alumneId, tramId).positius;
}

function negatiusDelTram(grupId, alumneId, tramId) {
  return registreDelTram(grupId, alumneId, tramId).negatius;
}

/**
 * Valor combinat d'un alumne en un tram: positius - PES_NEGATIU ×
 * negatius (vegeu horari.js). És el número que s'exporta a l'Excel.
 */
function valorDelTram(grupId, alumneId, tramId) {
  const { positius, negatius } = registreDelTram(grupId, alumneId, tramId);
  return positius - PES_NEGATIU * negatius;
}

/**
 * Desa un nou registre { positius, negatius } per a un alumne en el
 * tram indicat, creant les entrades intermèdies de `dades` si cal.
 * Ús intern: afegirPositiu/treurePositiu/afegirNegatiu/treureNegatiu
 * ja validen els límits abans de cridar-la.
 */
function escriureRegistreDelTram(grupId, tramId, alumneId, registre) {
  if (!dades[grupId]) dades[grupId] = {};
  if (!dades[grupId][tramId]) dades[grupId][tramId] = {};
  dades[grupId][tramId][alumneId] = registre;
  desarDades();
}

/**
 * Afegeix un positiu a un alumne en el tram horari actiu ara mateix,
 * sense deixar que el valor combinat superi MAX_POSITIUS_DIA (per
 * tram, no per dia sencer). Retorna true si s'ha afegit, false si ja
 * s'havia arribat al màxim.
 */
function afegirPositiu(grupId, alumneId) {
  const tram = tramActiuPerGrup(grupId);
  const { positius, negatius } = registreDelTram(grupId, alumneId, tram);

  const nouValor = (positius + 1) - PES_NEGATIU * negatius;
  if (nouValor > MAX_POSITIUS_DIA) return false;

  escriureRegistreDelTram(grupId, tram, alumneId, { positius: positius + 1, negatius });
  return true;
}

/**
 * Treu un positiu del tram horari actiu a un alumne (per corregir un
 * clic per error). Retorna true si s'ha tret, false si ja era a 0.
 */
function treurePositiu(grupId, alumneId) {
  const tram = tramActiuPerGrup(grupId);
  const { positius, negatius } = registreDelTram(grupId, alumneId, tram);

  if (positius <= 0) return false;

  escriureRegistreDelTram(grupId, tram, alumneId, { positius: positius - 1, negatius });
  return true;
}

/**
 * Afegeix un negatiu a un alumne en el tram horari actiu ara mateix,
 * sense deixar que el valor combinat baixi de VALOR_MINIM_TRAM.
 * Retorna true si s'ha afegit, false si ja s'havia arribat al mínim.
 */
function afegirNegatiu(grupId, alumneId) {
  const tram = tramActiuPerGrup(grupId);
  const { positius, negatius } = registreDelTram(grupId, alumneId, tram);

  const nouValor = positius - PES_NEGATIU * (negatius + 1);
  if (nouValor < VALOR_MINIM_TRAM) return false;

  escriureRegistreDelTram(grupId, tram, alumneId, { positius, negatius: negatius + 1 });
  return true;
}

/**
 * Treu un negatiu del tram horari actiu a un alumne (per corregir un
 * Ctrl+clic per error). Retorna true si s'ha tret, false si ja era a 0.
 */
function treureNegatiu(grupId, alumneId) {
  const tram = tramActiuPerGrup(grupId);
  const { positius, negatius } = registreDelTram(grupId, alumneId, tram);

  if (negatius <= 0) return false;

  escriureRegistreDelTram(grupId, tram, alumneId, { positius, negatius: negatius - 1 });
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

/**
 * Retorna l'objecte alumne a partir del seu "numero" (cadena de 2
 * xifres, p. ex. "17"), cercant dins la llista d'alumnes del grup.
 * Retorna undefined si cap alumne del grup té aquest número (mode
 * M2: codi teclejat que no correspon a ningú).
 */
function trobarAlumnePerNumero(grupId, numero) {
  return GRUPS[grupId].alumnes.find(a => a.numero === numero);
}

function crearTargetaAlumne(grupId, alumne) {
  const targeta = document.createElement("button");
  targeta.type = "button";
  targeta.className = "alumne";
  targeta.dataset.alumneId = alumne.id;

  const nom = document.createElement("span");
  nom.className = "alumne-nom";
  nom.textContent = alumne.nom;

  // Dos grups de símbols dins del mateix comptador (mai barrejats
  // per ordre d'entrada, només agrupats per tipus): els positius
  // sempre en verd, els negatius sempre en un altre color, perquè es
  // distingeixin d'un cop d'ull.
  const comptador = document.createElement("span");
  comptador.className = "alumne-comptador";
  const comptadorPositius = document.createElement("span");
  comptadorPositius.className = "alumne-comptador-positius";
  const comptadorNegatius = document.createElement("span");
  comptadorNegatius.className = "alumne-comptador-negatius";
  comptador.appendChild(comptadorPositius);
  comptador.appendChild(comptadorNegatius);

  targeta.appendChild(nom);
  targeta.appendChild(comptador);

  function refrescar() {
    const tram = tramActiuPerGrup(grupId);
    const { positius, negatius } = registreDelTram(grupId, alumne.id, tram);
    const valor = positius - PES_NEGATIU * negatius;

    comptadorPositius.textContent = "+".repeat(positius);
    comptadorNegatius.textContent = "-".repeat(negatius);

    targeta.classList.toggle("alumne--maxim", valor >= MAX_POSITIUS_DIA);
    targeta.classList.toggle("alumne--minim", valor <= VALOR_MINIM_TRAM);

    targeta.setAttribute(
      "aria-label",
      `${alumne.nom}: ${positius} positius i ${negatius} negatius ` +
      `(valor ${valor}) en aquesta hora`
    );
  }

  targeta.addEventListener("click", (event) => {
    // En mode M2 els clics a la graella no fan res (M2 anul·la M1):
    // les targetes ja es veuen "no clicables" (vegeu aplicarModeAGraella),
    // però guardem també aquesta comprovació aquí per si de cas.
    if (modeActual !== "M1") return;

    const esNegatiu = event.ctrlKey || event.metaKey;
    const afegit = esNegatiu
      ? afegirNegatiu(grupId, alumne.id)
      : afegirPositiu(grupId, alumne.id);

    refrescar();
    actualitzarDependentsDeDades(grupId);

    if (!afegit) {
      targeta.classList.add("alumne--rebot");
      setTimeout(() => targeta.classList.remove("alumne--rebot"), 220);
    }
  });

  // Clic dret per desfer un positiu (com fins ara); Ctrl+clic dret
  // per desfer un negatiu.
  targeta.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (modeActual !== "M1") return;

    if (event.ctrlKey || event.metaKey) {
      treureNegatiu(grupId, alumne.id);
    } else {
      treurePositiu(grupId, alumne.id);
    }
    refrescar();
    actualitzarDependentsDeDades(grupId);
  });

  refrescar();
  targetesPerAlumneId.set(alumne.id, { targeta, refrescar });
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

  // Cada renderitzat crea targetes noves: buidem el mapa d'abans
  // perquè no quedin referències a targetes ja fora del DOM.
  targetesPerAlumneId.clear();

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

  // Un renderitzat nou (canvi de grup, per exemple) crea targetes amb
  // aspecte "normal" per defecte: cal reaplicar-hi l'aspecte del mode
  // vigent, especialment si M2 ja estava activa.
  aplicarModeAGraella();
}

function buitAlumne() {
  const buit = document.createElement("div");
  buit.className = "alumne alumne--buit";
  return buit;
}

/* ----------------------------------------------------------------
 * Mode M2: assignar positius i negatius per teclat (sense clicar)
 * ---------------------------------------------------------------
 * Quan s'activa el mode M2 (toggle a la capçalera), M2 anul·la M1:
 * els clics a la graella deixen de fer res (vegeu els guards a
 * crearTargetaAlumne) i les targetes es veuen "no clicables".
 *
 * Escrivint dos dígits seguits (p. ex. "1" i després "7") s'aplica
 * un positiu a l'alumne amb numero "17" del grup actiu, sense Intro
 * ni cap clic — estil "teclat MS-DOS". Prement "-" abans, amb el
 * buffer encara buit, el pròxim codi de 2 dígits s'aplica com a
 * negatiu en comptes de positiu (vegeu m2PendentNegatiu); prement
 * "-" una segona vegada, encara sense cap dígit, ho desfà. Després
 * de cada codi complet de 2 dígits, el teclat queda bloquejat una
 * estona (curt si s'ha trobat l'alumne, llarg si no) abans de tornar
 * a escoltar — igual per positius que per negatius.
 * ------------------------------------------------------------- */

/**
 * Activa o desactiva el mode M2. Es crida des del listener del
 * checkbox/toggle de la capçalera (vegeu inicialitzarToggleM2).
 */
function establirMode(nouMode) {
  modeActual = nouMode;

  // Canviar de mode a mig codi o a mig bloqueig no ha de deixar
  // l'aplicació en un estat estrany: sempre es comença de zero.
  buffM2 = "";
  bloquejatM2 = false;
  m2PendentNegatiu = false;
  if (timeoutBloquejM2 !== null) {
    clearTimeout(timeoutBloquejM2);
    timeoutBloquejM2 = null;
  }

  aplicarModeAGraella();
  actualitzarIndicadorM2();
}

/**
 * Reflecteix el mode actual a la graella: en M2, les targetes
 * d'alumne es veuen (i són) no clicables. Es crida en canviar de
 * mode i també just després de cada renderitzarGraella(), perquè un
 * grup nou dibuixat mentre M2 ja estava activa hereti el mateix
 * aspecte sense haver de tornar a clicar el toggle.
 */
function aplicarModeAGraella() {
  const contenidor = document.getElementById("graella-aula");
  if (!contenidor) return;
  contenidor.classList.toggle("graella-aula--m2", modeActual === "M2");
}

/* ----------------------------------------------------------------
 * Indicador d'estat de M2 (capçalera)
 * ------------------------------------------------------------- */

/**
 * Estats possibles de l'indicador:
 *   - M2 desactivada: indicador buit.
 *   - Cap dígit encara: buit ("-" si s'ha premut "-" per marcar
 *     negatiu, vegeu m2PendentNegatiu).
 *   - Un dígit escrit: "1…" (o "-1…" si és negatiu).
 *   - Codi complet, alumne trobat: el nom, un instant (en verd si ha
 *     estat un positiu, en un altre color si ha estat un negatiu).
 *   - Codi complet, alumne NO trobat: "35 no trobat", en ambre,
 *     durant tot el bloqueig llarg.
 */
function actualitzarIndicadorM2(text, tipus) {
  const indicador = document.getElementById("indicador-m2");
  if (!indicador) return;

  if (modeActual !== "M2") {
    indicador.textContent = "";
    indicador.classList.remove("indicador-m2--error", "indicador-m2--exit", "indicador-m2--exit-negatiu");
    return;
  }

  indicador.textContent = text || "";
  indicador.classList.toggle("indicador-m2--error", tipus === "error");
  indicador.classList.toggle("indicador-m2--exit", tipus === "exit");
  indicador.classList.toggle("indicador-m2--exit-negatiu", tipus === "exit-negatiu");
}

/* ----------------------------------------------------------------
 * Entrada de teclat
 * ------------------------------------------------------------- */

/**
 * Retorna true si l'element on és el focus ara mateix és un camp on
 * l'usuari pugui estar escrivint normalment (select, input,
 * textarea): en aquest cas, M2 no ha d'interceptar els dígits.
 */
function focusEnCampDEntrada() {
  const actiu = document.activeElement;
  if (!actiu) return false;
  const tag = actiu.tagName;
  return tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA";
}

/**
 * Processa un dígit rebut en mode M2. Acumula fins a 2 dígits al
 * buffer; en arribar al segon, resol el codi (busca l'alumne, aplica
 * el positiu o el negatiu segons m2PendentNegatiu) i bloqueja
 * l'entrada l'estona que correspongui segons si ha estat encert o
 * error.
 */
function processarDigitM2(digit) {
  buffM2 += digit;

  if (buffM2.length === 1) {
    const prefix = m2PendentNegatiu ? "-" : "";
    actualitzarIndicadorM2(`${prefix}${buffM2}…`, m2PendentNegatiu ? "exit-negatiu" : undefined);
    return;
  }

  // buffM2.length === 2: codi complet, el resolem ara.
  const codi = buffM2;
  const esNegatiu = m2PendentNegatiu;
  buffM2 = "";
  m2PendentNegatiu = false;

  const alumne = grupActiu ? trobarAlumnePerNumero(grupActiu, codi) : undefined;

  if (alumne) {
    aplicarPositiuONegatiuPerM2(grupActiu, alumne, esNegatiu);
    actualitzarIndicadorM2(alumne.nom, esNegatiu ? "exit-negatiu" : "exit");
    bloquejarEntradaM2(M2_BLOQUEIG_ENCERT_MS, () => actualitzarIndicadorM2());
  } else {
    actualitzarIndicadorM2(`${codi} no trobat`, "error");
    bloquejarEntradaM2(M2_BLOQUEIG_ERROR_MS, () => actualitzarIndicadorM2());
  }
}

/**
 * Bloqueja l'entrada de M2 durant `ms` mil·lisegons; en acabar,
 * desbloqueja i executa `enAcabar` (típicament, netejar l'indicador).
 * Substitueix qualsevol bloqueig anterior encara pendent (no hauria
 * de passar-ne dos alhora, però per seguretat es cancel·la l'antic).
 */
function bloquejarEntradaM2(ms, enAcabar) {
  bloquejatM2 = true;
  if (timeoutBloquejM2 !== null) clearTimeout(timeoutBloquejM2);

  timeoutBloquejM2 = setTimeout(() => {
    bloquejatM2 = false;
    timeoutBloquejM2 = null;
    if (enAcabar) enAcabar();
  }, ms);
}

/**
 * Aplica un positiu o un negatiu des de M2 (segons `esNegatiu`):
 * crida la mateixa afegirPositiu()/afegirNegatiu() que fa servir M1
 * (mateix límit, mateix localStorage), i després refresca la targeta
 * corresponent i el selector d'exportació, exactament com faria el
 * clic o Ctrl+clic equivalent.
 */
function aplicarPositiuONegatiuPerM2(grupId, alumne, esNegatiu) {
  if (esNegatiu) {
    afegirNegatiu(grupId, alumne.id);
  } else {
    afegirPositiu(grupId, alumne.id);
  }

  const entrada = targetesPerAlumneId.get(alumne.id);
  if (entrada) {
    entrada.refrescar();
    entrada.targeta.classList.add("alumne--flaix-m2");
    setTimeout(() => entrada.targeta.classList.remove("alumne--flaix-m2"), 300);
  }
  // Si l'alumne no té seient assignat (no apareix a la graella), no
  // hi ha targeta que refrescar, però el positiu/negatiu ja s'ha
  // desat igual i sortirà correctament a l'exportació.

  actualitzarDependentsDeDades(grupId);
}

/**
 * Listener global de teclat per al mode M2. Només actua si el mode
 * actual és M2, no hi ha bloqueig actiu i el focus no és a
 * select/input/textarea. Dues tecles reben tractament especial:
 *   - "-": amb el buffer buit, marca/desmarca el pròxim codi com a
 *     negatiu (vegeu m2PendentNegatiu); s'ignora si ja s'ha escrit
 *     algun dígit del codi.
 *   - dígits del 0 al 9: es passen a processarDigitM2.
 * Qualsevol altra tecla s'ignora.
 */
function gestionarTeclaM2(event) {
  if (modeActual !== "M2") return;
  if (bloquejatM2) return;
  if (focusEnCampDEntrada()) return;

  if (event.key === "-") {
    if (buffM2.length === 0) {
      m2PendentNegatiu = !m2PendentNegatiu;
      actualitzarIndicadorM2(m2PendentNegatiu ? "-" : "", m2PendentNegatiu ? "exit-negatiu" : undefined);
    }
    return;
  }

  if (!/^[0-9]$/.test(event.key)) return;

  processarDigitM2(event.key);
}

/**
 * Inicialitza el toggle M1/M2 de la capçalera: en canviar el
 * checkbox, commuta el mode. Comença sempre en M1 (el checkbox
 * comença destriat), independentment de sessions anteriors.
 */
function inicialitzarToggleM2() {
  const toggle = document.getElementById("toggle-m2");
  if (!toggle) return;

  toggle.checked = false;
  toggle.addEventListener("change", () => {
    establirMode(toggle.checked ? "M2" : "M1");
  });

  document.addEventListener("keydown", gestionarTeclaM2);
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
  inicialitzarToggleM2();

  const grupInicial = document.getElementById("selector-grup").value;
  mostrarGrup(grupInicial);
}

document.addEventListener("DOMContentLoaded", iniciarApp);
