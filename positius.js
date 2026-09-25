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
 * Gestos de M1: el botó esquerre és sempre per als positius i el dret
 * sempre per als negatius — clic suma, Ctrl+clic (amb el mateix botó)
 * en resta un (per corregir un clic per error). Gestos de M2: escriure
 * el "numero" de l'alumne assigna un positiu; prement "-" abans (amb
 * el buffer buit) el pròxim codi s'aplica com a negatiu en comptes de
 * positiu (prémer "-" un altre cop, encara sense cap dígit, ho desfà).
 *
 * Els positius i negatius es guarden per "tram": un dia concret + una
 * hora concreta (p. ex. "2026-08-03" + "1a hora"). Així, si un mateix
 * grup té dues classes el mateix dia, cada hora té el seu propi
 * comptador i el seu propi límit — no se sumen entre elles. Això val
 * igual per M1 i per M2: totes dues criden les mateixes
 * afegirPositiu()/afegirNegatiu().
 *
 * El tram que es veu i s'edita el decideix el selector de dia i franja
 * de la capçalera de la graella. Per defecte és el d'avui (i la
 * primera classe que l'horari digui d'aquest grup), però es pot moure
 * a qualsevol dia passat per repassar-lo o corregir-lo; mentre no
 * s'estigui a avui, la pàgina ho avisa de manera ben visible. Cap a
 * endavant no s'hi pot anar.
 *
 * Depèn de les dades definides a tres fitxers, que s'han de
 * carregar abans que aquest:
 *   - dades.js    (GRUPS: noms de classe i llista d'alumnes, cada
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

// Tram que s'està consultant i editant ara mateix. Per defecte és el
// d'avui, però amb el selector de dia i hora de la capçalera es pot
// moure a qualsevol tram passat per repassar-lo o corregir-lo.
//
//   dataActiva: "AAAA-MM-DD"
//   horaActiva: text de la franja ("1a hora (8:15)") o HORA_FORA_HORARI.
//               Si val null, es calcula sol a partir de l'horari del dia
//               (vegeu horaPerDefecte).
let dataActiva = dataAvuiISO();
let horaActiva = null;

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
 * Converteix una data "AAAA-MM-DD" en un objecte Date local (a
 * migdia, per evitar sorpreses amb canvis d'hora). Fem servir sempre
 * aquesta funció en comptes de `new Date("AAAA-MM-DD")`, que
 * s'interpreta com a UTC i pot desplaçar el dia.
 */
function dataDesDeISO(dataISO) {
  const [y, m, d] = dataISO.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/**
 * Retorna la llista de trams de classe d'un dia concret, segons
 * HORARI. Cada tram és { hora, grup }.
 */
function tramsHorarisDelDia(dataISO) {
  const diaSetmana = dataDesDeISO(dataISO).getDay(); // 0=diumenge ... 6=dissabte
  return HORARI[diaSetmana] || [];
}

/**
 * Retorna la llista de trams de classe d'avui, segons HORARI.
 */
function tramsHoraris_avui() {
  return tramsHorarisDelDia(dataAvuiISO());
}

/**
 * Retorna un text llegible d'una data, p. ex. "dilluns 3 d'agost".
 */
function textDataLlegible(dataISO) {
  return dataDesDeISO(dataISO).toLocaleDateString("ca-ES", {
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
 * Franges d'un dia en què aquest grup té classe segons HORARI, en
 * l'ordre en què apareixen a l'horari.
 */
function horesSegonsHorari(grupId, dataISO) {
  return tramsHorarisDelDia(dataISO)
    .filter(t => t.grup === grupId)
    .map(t => t.hora);
}

/**
 * Quin grup té classe en una franja i un dia concrets, segons
 * HORARI. Retorna null si aquell dia ningú hi té classe en aquesta
 * hora (p. ex. HORA_FORA_HORARI, o un forat de l'horari).
 */
function grupPerHora(hora, dataISO) {
  const tram = tramsHorarisDelDia(dataISO).find(t => t.hora === hora);
  return tram ? tram.grup : null;
}

/**
 * Franges d'un dia en què aquest grup ja té algun registre desat.
 * Serveix per no amagar mai un tram antic: encara que l'horari hagi
 * canviat des de llavors (o que es desés sota HORA_FORA_HORARI), la
 * franja segueix sent accessible des del selector.
 */
function horesAmbDades(grupId, dataISO) {
  return tramsAmbDades(grupId)
    .map(descompondreTramId)
    .filter(t => t.dataISO === dataISO)
    .map(t => t.hora);
}

/**
 * Totes les franges horàries del centre per a un dia (1a hora, 2a
 * hora, etc., segons FRANGES_HORARIES), en el mateix format de text
 * que fa servir la resta de l'aplicació. Independent del grup: surt
 * de la configuració del centre, no de qui té classe.
 */
function horesDelCentre() {
  return FRANGES_HORARIES.map(f => textFranjaHoraria(f.numero));
}

/**
 * Totes les franges que té sentit oferir per a un grup i un dia: les
 * del centre (independentment de si aquest grup hi té classe),
 * seguides de les que ja tenen dades desades i no hi surten (per si
 * l'horari del centre ha canviat des de llavors), i sempre
 * HORA_FORA_HORARI al final. Mostrar totes les del centre —no només
 * les pròpies del grup— permet consultar o corregir un tram encara
 * que aquell dia el grup no hi tingui classe.
 */
function horesDisponibles(grupId, dataISO) {
  return [...new Set([
    ...horesDelCentre(),
    ...horesAmbDades(grupId, dataISO),
    HORA_FORA_HORARI
  ])];
}

/**
 * Retorna l'hora actual en minuts des de mitjanit (p. ex. 8:15 -> 495),
 * per poder-la comparar amb l'"inici" de FRANGES_HORARIES.
 */
function araEnMinuts() {
  const ara = new Date();
  return ara.getHours() * 60 + ara.getMinutes();
}

/**
 * Converteix un "HH:MM" (com els d'"inici" a FRANGES_HORARIES) a
 * minuts des de mitjanit, per poder-lo comparar amb araEnMinuts().
 */
function horaAMinuts(horaHHMM) {
  const [h, m] = horaHHMM.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Donada una franja tal com surt de l'horari (el seu text llegible,
 * p. ex. "3a hora (10:05)"), retorna els minuts des de mitjanit en
 * què comença, buscant-la a FRANGES_HORARIES pel seu "numero". Si no
 * es troba (p. ex. HORA_FORA_HORARI), retorna null.
 */
function iniciFranjaEnMinuts(hora) {
  const franja = FRANGES_HORARIES.find(f => textFranjaHoraria(f.numero) === hora);
  return franja ? horaAMinuts(franja.inici) : null;
}

/**
 * D'entre tots els trams d'avui (de qualsevol grup, no d'un en
 * concret), retorna el que toca ara: el primer que encara no hagi
 * començat; si tots ja han començat, el darrer del dia. És qui
 * "mana" en obrir l'app — primer es decideix la franja horària i
 * després, a partir d'ella, el grup que hi toca (mostrarGrup crida
 * horaPerDefecte, que ja coincidirà amb aquesta franja perquè és la
 * pròpia d'aquest grup en aquesta hora). Retorna null si avui no hi
 * ha cap classe a l'horari.
 */
function tramMesProperAvui() {
  const trams = tramsHoraris_avui();
  if (trams.length === 0) return null;

  const araMin = araEnMinuts();
  const proper = trams.find(tram => {
    const iniciMin = iniciFranjaEnMinuts(tram.hora);
    return iniciMin !== null && iniciMin > araMin;
  });

  return proper || trams[trams.length - 1];
}

/**
 * Quina franja s'ha de mostrar per defecte en obrir un dia.
 *
 * Si el dia és avui: d'entre les franges de l'horari d'avui, la
 * primera que encara no hagi començat (mirant l'hora del rellotge);
 * si totes ja han començat, la darrera del dia (la classe que toca
 * ara mateix o la més recent). Així, en obrir l'app entre hores, ja
 * surt seleccionat el tram on tocarà posar positius.
 *
 * Si el dia no és avui (o l'horari d'avui no diu res): la primera
 * classe que l'horari diu que hi havia; si tampoc n'hi ha, la
 * primera que tingui dades desades; i si no hi ha res de res,
 * HORA_FORA_HORARI (el mateix comportament que tenia l'aplicació
 * abans d'existir el selector de dia).
 */
function horaPerDefecte(grupId, dataISO) {
  const deHorari = horesSegonsHorari(grupId, dataISO);

  if (deHorari.length > 0) {
    if (dataISO === dataAvuiISO()) {
      const araMin = araEnMinuts();
      const properaFutura = deHorari.find(hora => {
        const iniciMin = iniciFranjaEnMinuts(hora);
        return iniciMin !== null && iniciMin > araMin;
      });
      if (properaFutura) return properaFutura;

      // Totes les franges d'avui ja han començat: ens quedem amb la
      // darrera (la que toca ara mateix o la més recent).
      return deHorari[deHorari.length - 1];
    }
    return deHorari[0];
  }

  const ambDades = horesAmbDades(grupId, dataISO);
  if (ambDades.length > 0) return ambDades[0];

  return HORA_FORA_HORARI;
}

/**
 * Retorna el tram que s'està consultant i editant ara mateix per a un
 * grup: el dia i la franja triats al selector de la capçalera, que
 * per defecte són els d'avui.
 *
 * Tots els positius i negatius (tant per clic com per teclat) es
 * llegeixen i s'escriuen sempre en aquest tram, de manera que el
 * selector de dia serveix alhora per repassar el passat i per
 * corregir-lo.
 */
function tramActiuPerGrup(grupId) {
  // `horaActiva` és l'estat del selector, que sempre correspon al
  // grup que es veu en pantalla. Si es demana el tram d'un altre
  // grup, calculem la franja que li tocaria aquell dia.
  const hora = (grupId === grupActiu && horaActiva)
    ? horaActiva
    : horaPerDefecte(grupId, dataActiva);

  return crearTramId(dataActiva, hora);
}

/**
 * Diu si un tram concret ja té algun registre desat (encara que sigui
 * a zero). Es fa servir per marcar amb ✓ les franges del selector
 * que ja tenen alguna cosa escrita.
 */
function tramTeDades(grupId, tramId) {
  const registres = dades?.[grupId]?.[tramId];
  return Boolean(registres) && Object.keys(registres).length > 0;
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
 * Ctrl+clic per error). Retorna true si s'ha tret, false si ja era a 0.
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
 * Ctrl+clic dret per error). Retorna true si s'ha tret, false si ja era a 0.
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

  // Per defecte, seleccionem el grup que toca ara mateix segons
  // l'horari d'avui (la franja més propera, vegeu tramMesProperAvui).
  const grupAra = tramMesProperAvui()?.grup;
  selector.value = grupAra || Object.keys(GRUPS)[0];

  selector.addEventListener("change", () => {
    // En triar un grup a mà, saltem sempre a la seva pròpia franja
    // del dia actiu (no només quan l'hora que hi havia no sigui
    // vàlida): si triem "1ESO-B", volem anar a la seva hora d'avui,
    // encara que "10:05" també fos una opció vàlida del desplegable.
    horaActiva = horaPerDefecte(selector.value, dataActiva);
    mostrarGrup(selector.value);
  });
}

/* ----------------------------------------------------------------
 * Selector de dia i franja (consultar i corregir trams passats)
 * ---------------------------------------------------------------
 * La graella sempre mostra UN tram: el que diuen `dataActiva` i
 * `horaActiva`. En obrir l'aplicació són els d'avui, i tot funciona
 * com sempre; movent el selector cap enrere es veuen i s'editen els
 * positius d'un dia anterior, amb un avís ben visible perquè no es
 * confongui amb el dia d'avui.
 *
 * No es pot anar cap endavant: posar positius a un dia futur no té
 * sentit i seria fàcil de fer sense adonar-se'n.
 * ------------------------------------------------------------- */

function inicialitzarSelectorTram() {
  const inputData = document.getElementById("selector-data");
  const selectorHora = document.getElementById("selector-hora");
  const botoAvui = document.getElementById("boto-avui");
  if (!inputData || !selectorHora || !botoAvui) return;

  inputData.max = dataAvuiISO();
  inputData.value = dataActiva;

  inputData.addEventListener("change", () => {
    // El camp es pot buidar o rebre una data futura escrivint-hi a
    // mà: en tots dos casos tornem al valor que hi havia.
    if (!inputData.value || inputData.value > dataAvuiISO()) {
      inputData.value = dataActiva;
      return;
    }
    canviarData(inputData.value);
  });

  selectorHora.addEventListener("change", () => {
    horaActiva = selectorHora.value;

    // Si en aquesta franja i dia hi ha un grup amb classe, hi
    // saltem (com passa amb el "Grup:", és el tram qui mana). Si no
    // n'hi ha cap (forat de l'horari, o HORA_FORA_HORARI), ens
    // quedem amb el grup que ja hi havia i només canviem l'hora.
    const grup = grupPerHora(horaActiva, dataActiva);
    if (grup && grup !== grupActiu) {
      const selectorGrup = document.getElementById("selector-grup");
      if (selectorGrup) selectorGrup.value = grup;
      mostrarGrup(grup);
      return;
    }

    mostrarTramActiu();
  });

  botoAvui.addEventListener("click", () => canviarData(dataAvuiISO()));
}

/**
 * Canvia el dia que s'està consultant. La franja es recalcula sola
 * (horaActiva = null), perquè la que hi hagués triada pot no existir
 * el dia nou.
 */
function canviarData(dataISO) {
  dataActiva = dataISO;
  horaActiva = null;

  const inputData = document.getElementById("selector-data");
  if (inputData) inputData.value = dataISO;

  refrescarSelectorHora();
  mostrarTramActiu();
}

/**
 * Reomple el desplegable de franges amb les del grup i el dia
 * actuals, marcant amb ✓ les que ja tenen alguna cosa desada. Si la
 * franja triada fins ara no existeix en aquesta combinació, se'n
 * tria la que toca per defecte.
 */
function refrescarSelectorHora() {
  const selector = document.getElementById("selector-hora");
  if (!selector || !grupActiu) return;

  const hores = horesDisponibles(grupActiu, dataActiva);

  if (!horaActiva || !hores.includes(horaActiva)) {
    horaActiva = horaPerDefecte(grupActiu, dataActiva);
  }

  selector.innerHTML = "";
  for (const hora of hores) {
    const opcio = document.createElement("option");
    opcio.value = hora;
    const teDades = tramTeDades(grupActiu, crearTramId(dataActiva, hora));
    opcio.textContent = teDades ? `${hora} ✓` : hora;
    selector.appendChild(opcio);
  }

  selector.value = horaActiva;
}

/**
 * Mostra (o amaga) l'avís que el que es veu en pantalla NO és el dia
 * d'avui. És deliberadament cridaner: el risc real d'aquesta funció
 * és apuntar positius al dia equivocat sense adonar-se'n.
 */
function actualitzarAvisTram() {
  const avis = document.getElementById("avis-tram");
  if (!avis) return;

  const esAvui = dataActiva === dataAvuiISO();
  document.body.classList.toggle("mode-tram-passat", !esAvui);

  if (esAvui) {
    avis.hidden = true;
    avis.textContent = "";
    return;
  }

  avis.hidden = false;
  avis.textContent =
    `Estàs consultant ${textDataLlegible(dataActiva)} — ${horaActiva}. ` +
    `Tot el que cliquis o teclegis s'apunta en aquest tram, no al d'avui.`;
}

/**
 * Redibuixa tot el que depèn del tram triat (graella, avís i
 * selector de baixada).
 */
function mostrarTramActiu() {
  renderitzarGraella(grupActiu);
  actualitzarAvisTram();
  actualitzarDependentsDeDades(grupActiu);
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
 * dins la llista d'alumnes del grup.
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

/**
 * Quants símbols (positius + negatius junts) caben a la targeta abans
 * que se'n surtin. Per sota d'aquest nombre es dibuixen un per un
 * ("+++ -"), que és el que es llegeix millor d'un cop d'ull; a partir
 * d'aquí es passa a la forma compacta ("7+ 3-"), perquè amb els
 * símbols repetits el comptador sortia fora de la targeta i es
 * trepitjava amb la fila de sota.
 *
 * El límit per tram és sobre el VALOR (positius - 2 × negatius), no
 * sobre el nombre de símbols, així que aquestes acumulacions són
 * perfectament possibles: 7 positius i 3 negatius donen valor +1.
 */
const MAX_SIMBOLS_COMPTADOR = 5;

/**
 * Text d'un dels dos grups del comptador. Un grup a zero no escriu
 * res, per no ocupar espai quan només hi ha positius.
 */
function textComptador(quantitat, simbol, compacte) {
  if (quantitat === 0) return "";
  return compacte ? `${quantitat}${simbol}` : simbol.repeat(quantitat);
}

function crearTargetaAlumne(grupId, alumne) {
  const targeta = document.createElement("button");
  targeta.type = "button";
  targeta.className = "alumne";
  targeta.dataset.alumneId = alumne.id;

  // El número de llista va davant del nom, tant en M1 com en M2. En
  // M2 és el codi que s'ha de teclejar, i tenir-lo a la vista estalvia
  // haver-se'l de saber de memòria; en M1 serveix igualment per
  // localitzar l'alumne a la llista de classe. A setup.html, en canvi,
  // no hi surt: allà només interessa on seu cadascú.
  const nom = document.createElement("span");
  nom.className = "alumne-nom";

  const numero = document.createElement("span");
  numero.className = "alumne-numero";
  numero.textContent = `${alumne.numero}.`;

  nom.appendChild(numero);
  nom.appendChild(document.createTextNode(" " + alumne.nom));

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

    const compacte = positius + negatius > MAX_SIMBOLS_COMPTADOR;

    comptadorPositius.textContent = textComptador(positius, "+", compacte);
    comptadorNegatius.textContent = textComptador(negatius, "-", compacte);

    targeta.classList.toggle("alumne--maxim", valor >= MAX_POSITIUS_DIA);
    targeta.classList.toggle("alumne--minim", valor <= VALOR_MINIM_TRAM);

    targeta.setAttribute(
      "aria-label",
      `${alumne.numero}. ${alumne.nom}: ${positius} positius i ${negatius} negatius ` +
      `(valor ${valor}) en aquesta hora`
    );
  }

  // Botó esquerre = positius, botó dret = negatius: cada botó és
  // sempre el mateix tipus. Ctrl amb el mateix botó vol dir "desfés"
  // (corregeix un clic per error), independentment de quin botó sigui.
  targeta.addEventListener("click", (event) => {
    // En mode M2 els clics a la graella no fan res (M2 anul·la M1):
    // les targetes ja es veuen "no clicables" (vegeu aplicarModeAGraella),
    // però guardem també aquesta comprovació aquí per si de cas.
    if (modeActual !== "M1") return;

    const esDesfer = event.ctrlKey || event.metaKey;
    const ok = esDesfer
      ? treurePositiu(grupId, alumne.id)
      : afegirPositiu(grupId, alumne.id);

    refrescar();
    actualitzarDependentsDeDades(grupId);

    if (!ok) {
      targeta.classList.add("alumne--rebot");
      setTimeout(() => targeta.classList.remove("alumne--rebot"), 220);
    }
  });

  targeta.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (modeActual !== "M1") return;

    const esDesfer = event.ctrlKey || event.metaKey;
    const ok = esDesfer
      ? treureNegatiu(grupId, alumne.id)
      : afegirNegatiu(grupId, alumne.id);

    refrescar();
    actualitzarDependentsDeDades(grupId);

    if (!ok) {
      targeta.classList.add("alumne--rebot");
      setTimeout(() => targeta.classList.remove("alumne--rebot"), 220);
    }
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
 * clic esquerre o el clic dret equivalent.
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

  // Un clic pot haver estrenat un tram que abans no existia: refem el
  // desplegable de franges perquè hi aparegui la marca ✓.
  refrescarSelectorHora();
}

function mostrarGrup(grupId) {
  grupActiu = grupId;
  document.getElementById("titol-grup").textContent = GRUPS[grupId].nom;

  // Les franges disponibles depenen del grup (cada grup té les seves
  // hores a l'horari), així que el selector es refà en canviar-lo.
  refrescarSelectorHora();

  renderitzarGraella(grupId);
  actualitzarAvisTram();
  actualitzarDependentsDeDades(grupId);
}

function iniciarApp() {
  inicialitzarSelectorGrups();
  inicialitzarToggleM2();
  inicialitzarSelectorTram();

  // La franja horària mana sobre el grup: primer es decideix quina
  // classe toca ara (tramMesProperAvui), i d'aquí surten tant el
  // grup inicial com l'hora inicial. Es fixa horaActiva abans de
  // mostrarGrup perquè refrescarSelectorHora() no la recalculi.
  const tramActual = tramMesProperAvui();
  if (tramActual) horaActiva = tramActual.hora;

  const grupInicial = document.getElementById("selector-grup").value;
  mostrarGrup(grupInicial);
}

document.addEventListener("DOMContentLoaded", iniciarApp);
