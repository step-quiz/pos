/**
 * setup.js
 * ---------------------------------------------------------------
 * Lògica de setup.html: assignar cada alumne d'un grup a una taula
 * concreta de l'aula (fila, taula, costat) i, al final, descarregar
 * un seients.js nou amb aquestes posicions ja escrites.
 *
 * Hi ha dues maneres d'assignar, sempre totes dues actives alhora:
 *   1. Clic sobre un seient → desplegable amb els alumnes disponibles.
 *   2. Arrossegar i deixar anar (drag-and-drop amb ratolí) entre la
 *      banqueta d'alumnes sense seient i les taules de l'aula.
 * Totes dues escriuen al mateix objecte `assignacions`.
 *
 * Depèn de les dades definides a dades.js (GRUPS) i seients.js
 * (DISPOSICIO_AULA, SEIENTS), que s'han de carregar abans que
 * aquest fitxer.
 *
 * Aquesta pàgina NO toca el localStorage de positius ni res
 * relacionat amb positius.js: només serveix per decidir on seu
 * cada alumne. El resultat final és un fitxer per descarregar, no
 * res que es desi automàticament.
 * ---------------------------------------------------------------
 */

/* ----------------------------------------------------------------
 * Estat en memòria
 * ------------------------------------------------------------- */

// Grup que s'està configurant ara mateix
let grupSetup = null;

// Assignacions en curs: seientId -> alumneId
// seientId té la forma "fila-taula-costat", p. ex. "1-2-esquerra"
let assignacions = {};

// Arrossegament en curs, o null si no s'està arrossegant res:
//   { alumneId, origen }
// on `origen` és el seientId d'on surt l'alumne, o null si surt de la
// banqueta (alumnes encara sense seient).
let arrossegant = null;

/* ----------------------------------------------------------------
 * Seients: identificador i utilitats
 * ------------------------------------------------------------- */

function crearSeientId(fila, taula, costat) {
  return `${fila}-${taula}-${costat}`;
}

/**
 * Retorna la llista de tots els seients de l'aula, en l'ordre en
 * què s'han de dibuixar, segons DISPOSICIO_AULA.
 */
function totsElsSeients() {
  const seients = [];
  for (let f = 1; f <= DISPOSICIO_AULA.files; f++) {
    for (let t = 1; t <= DISPOSICIO_AULA.parelles_per_fila; t++) {
      seients.push({ fila: f, taula: t, costat: "esquerra" });
      seients.push({ fila: f, taula: t, costat: "dreta" });
    }
  }
  return seients;
}

/**
 * Retorna els alumnes del grup que encara no tenen seient assignat.
 */
function alumnesSenseAssignar(grupId) {
  const assignatsIds = new Set(Object.values(assignacions));
  return GRUPS[grupId].alumnes.filter(a => !assignatsIds.has(a.id));
}

/* ----------------------------------------------------------------
 * Selecció del grup a configurar
 * ------------------------------------------------------------- */

function inicialitzarSelectorGrups() {
  const selector = document.getElementById("selector-grup-setup");
  selector.innerHTML = "";

  for (const grupId in GRUPS) {
    const opcio = document.createElement("option");
    opcio.value = grupId;
    opcio.textContent = GRUPS[grupId].nom;
    selector.appendChild(opcio);
  }

  selector.addEventListener("change", () => {
    carregarGrup(selector.value);
  });
}

/**
 * Carrega un grup a l'editor: inicialitza `assignacions` a partir
 * dels seients que ja tingui el grup a seients.js (si en té) i
 * dibuixa la graella de seients.
 */
function carregarGrup(grupId) {
  grupSetup = grupId;
  assignacions = {};

  const seientsExistents = SEIENTS[grupId] || [];
  for (const seient of seientsExistents) {
    const seientId = crearSeientId(seient.fila, seient.taula, seient.costat);
    assignacions[seientId] = seient.alumneId;
  }

  renderitzarTot();
}

/* ----------------------------------------------------------------
 * Graella de seients
 * ------------------------------------------------------------- */

function renderitzarGraella() {
  const contenidor = document.getElementById("graella-setup");
  contenidor.innerHTML = "";
  contenidor.style.setProperty("--taules-per-fila", DISPOSICIO_AULA.parelles_per_fila);

  for (let f = 1; f <= DISPOSICIO_AULA.files; f++) {
    const filaEl = document.createElement("div");
    filaEl.className = "fila-aula";

    for (let t = 1; t <= DISPOSICIO_AULA.parelles_per_fila; t++) {
      const taulaEl = document.createElement("div");
      taulaEl.className = "taula-parella";

      taulaEl.appendChild(crearSeientEl(f, t, "esquerra"));
      taulaEl.appendChild(crearSeientEl(f, t, "dreta"));

      filaEl.appendChild(taulaEl);
    }

    contenidor.appendChild(filaEl);
  }
}

function crearSeientEl(fila, taula, costat) {
  const seientId = crearSeientId(fila, taula, costat);

  const seientEl = document.createElement("button");
  seientEl.type = "button";
  seientEl.className = "seient";
  seientEl.dataset.seientId = seientId;

  seientEl.addEventListener("click", () => obrirSelectorSeient(seientEl, seientId));

  // Un seient ocupat es pot agafar i portar a una altra taula o a la
  // banqueta; un seient buit només pot rebre.
  seientEl.addEventListener("dragstart", (event) => {
    const alumneId = assignacions[seientId];
    if (!alumneId) {
      event.preventDefault();
      return;
    }
    iniciarArrossegament(event, alumneId, seientId);
  });

  seientEl.addEventListener("dragend", finalitzarArrossegament);

  seientEl.addEventListener("dragover", (event) => {
    if (!arrossegant) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    seientEl.classList.add("seient--diana");
  });

  seientEl.addEventListener("dragleave", () => {
    seientEl.classList.remove("seient--diana");
  });

  seientEl.addEventListener("drop", (event) => {
    event.preventDefault();
    deixarAnarASeient(seientId);
  });

  refrescarSeientEl(seientEl, seientId);
  return seientEl;
}

/**
 * Text pla d'un alumne, amb el número de llista davant ("03. Saif").
 * Es fa servir allà on no es pot posar marcatge, com als <option> del
 * desplegable. El número es mostra tal com està desat, amb les dues
 * xifres, perquè és el mateix que es tecleja a la graella de positius
 * en mode M2.
 */
function etiquetaAlumne(alumne) {
  return `${alumne.numero}. ${alumne.nom}`;
}

/**
 * Escriu "03. Saif" dins d'un element, amb el número en un <span>
 * propi perquè es pugui pintar més fluix que el nom (.alumne-numero,
 * compartit amb la graella de positius).
 */
function escriureNomAmbNumero(element, alumne) {
  element.textContent = "";

  const numero = document.createElement("span");
  numero.className = "alumne-numero";
  numero.textContent = `${alumne.numero}.`;

  element.appendChild(numero);
  element.appendChild(document.createTextNode(" " + alumne.nom));
}

function refrescarSeientEl(seientEl, seientId) {
  const alumneId = assignacions[seientId];
  const alumne = alumneId
    ? GRUPS[grupSetup].alumnes.find(a => a.id === alumneId)
    : null;

  seientEl.classList.toggle("seient--buit", !alumne);
  if (alumne) {
    escriureNomAmbNumero(seientEl, alumne);
  } else {
    seientEl.textContent = "+ assigna";
  }
  seientEl.draggable = Boolean(alumne);
  seientEl.setAttribute(
    "aria-label",
    alumne
      ? `${etiquetaAlumne(alumne)}. Clica per canviar, o arrossega'l a una altra taula.`
      : "Seient buit. Clica per assignar un alumne, o arrossega-hi un nom."
  );
}

/* ----------------------------------------------------------------
 * Banqueta: alumnes del grup que encara no seuen enlloc
 * ------------------------------------------------------------- */

/**
 * Dibuixa, sota la graella, una fitxa per cada alumne sense seient.
 * Cada fitxa es pot arrossegar fins a una taula; i la banqueta
 * sencera accepta que hi deixis anar un alumne que ara seu en algun
 * lloc, cosa que li allibera la taula.
 */
function renderitzarBanqueta() {
  const llista = document.getElementById("llista-banqueta");
  llista.innerHTML = "";

  const pendents = alumnesSenseAssignar(grupSetup);

  if (pendents.length === 0) {
    const buida = document.createElement("span");
    buida.className = "banqueta-buida";
    buida.textContent = "Ningú: tots els alumnes seuen en alguna taula.";
    llista.appendChild(buida);
    return;
  }

  for (const alumne of pendents) {
    llista.appendChild(crearFitxaAlumne(alumne));
  }
}

function crearFitxaAlumne(alumne) {
  const fitxa = document.createElement("div");
  fitxa.className = "fitxa-alumne";
  escriureNomAmbNumero(fitxa, alumne);
  fitxa.draggable = true;
  fitxa.dataset.alumneId = alumne.id;
  fitxa.setAttribute("aria-label",
    `${etiquetaAlumne(alumne)}, sense seient. Arrossega'l fins a una taula.`);

  fitxa.addEventListener("dragstart", (event) => {
    iniciarArrossegament(event, alumne.id, null);
  });

  fitxa.addEventListener("dragend", finalitzarArrossegament);

  return fitxa;
}

/* ----------------------------------------------------------------
 * Arrossegar i deixar anar
 * ------------------------------------------------------------- */

/**
 * Comença un arrossegament. `origen` és el seient d'on surt l'alumne,
 * o null si ve de la banqueta.
 */
function iniciarArrossegament(event, alumneId, origen) {
  tancarSelectorObert();

  arrossegant = { alumneId, origen };

  // Encara que la informació que fem servir de debò és `arrossegant`,
  // cal posar alguna cosa al dataTransfer perquè Firefox consideri
  // l'arrossegament vàlid.
  event.dataTransfer.setData("text/plain", alumneId);
  event.dataTransfer.effectAllowed = "move";

  event.currentTarget.classList.add("arrossegant");
  document.body.classList.add("arrossegament-actiu");
}

/**
 * Neteja les marques visuals de l'arrossegament. Es crida tant en
 * acabar bé (drop) com si es deixa anar en un lloc que no accepta
 * res (dragend).
 */
function finalitzarArrossegament() {
  arrossegant = null;
  document.body.classList.remove("arrossegament-actiu");
  document.getElementById("banqueta").classList.remove("banqueta--diana");

  for (const el of document.querySelectorAll(".arrossegant, .seient--diana")) {
    el.classList.remove("arrossegant", "seient--diana");
  }
}

/**
 * Deixa anar l'alumne que s'està arrossegant sobre un seient.
 *
 * - Si el seient de destí és buit, l'alumne hi va i prou.
 * - Si el destí ja està ocupat i l'alumne ve de la banqueta, qui hi
 *   seia torna a la banqueta.
 * - Si el destí ja està ocupat i l'alumne ve d'un altre seient, els
 *   dos alumnes s'intercanvien el lloc.
 */
function deixarAnarASeient(seientDesti) {
  if (!arrossegant) return;

  const { alumneId, origen } = arrossegant;
  finalitzarArrossegament();

  if (origen === seientDesti) return;

  const ocupantDesti = assignacions[seientDesti] || null;

  if (origen) {
    delete assignacions[origen];
    if (ocupantDesti) assignacions[origen] = ocupantDesti;
  }

  assignacions[seientDesti] = alumneId;

  aplicarCanvis();
}

/**
 * Deixa anar l'alumne sobre la banqueta: si venia d'un seient, el
 * seient queda lliure i l'alumne passa a la llista de pendents. Si ja
 * venia de la banqueta, no hi ha res a fer.
 */
function deixarAnarABanqueta() {
  if (!arrossegant) return;

  const { origen } = arrossegant;
  finalitzarArrossegament();

  if (!origen) return;

  delete assignacions[origen];
  aplicarCanvis();
}

function inicialitzarBanquetaComADiana() {
  const banqueta = document.getElementById("banqueta");

  banqueta.addEventListener("dragover", (event) => {
    // Només té sentit deixar-hi anar algú que ara seu en una taula.
    if (!arrossegant || !arrossegant.origen) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    banqueta.classList.add("banqueta--diana");
  });

  banqueta.addEventListener("dragleave", (event) => {
    // `dragleave` també salta en passar per sobre de les fitxes de
    // dins; només comptem la sortida real del bloc.
    if (banqueta.contains(event.relatedTarget)) return;
    banqueta.classList.remove("banqueta--diana");
  });

  banqueta.addEventListener("drop", (event) => {
    event.preventDefault();
    deixarAnarABanqueta();
  });
}

/**
 * Redibuixa tot el que depèn de `assignacions`, sense desar res.
 */
function renderitzarTot() {
  renderitzarGraella();
  renderitzarBanqueta();
  actualitzarComptador();
}

/**
 * Desa la distribució del grup que s'està editant i redibuixa la
 * pàgina. És el que crida QUALSEVOL canvi (clic, arrossegament,
 * buidar l'aula): la feina queda desada al navegador a l'instant, de
 * manera que tancar la pestanya o canviar de pàgina no la perd.
 *
 * La descàrrega d'els-meus-seients.js és, per tant, una còpia de
 * seguretat, no el mecanisme per guardar.
 */
function aplicarCanvis() {
  const desat = CONFIG_SEIENTS.desaGrup(grupSetup, llistaSeientsDelGrup(grupSetup));
  renderitzarTot();
  actualitzarEstatDesat(desat);
}

/**
 * Text discret sota la graella que diu d'on surt la distribució que
 * s'està veient i quan es va desar per última vegada.
 */
function actualitzarEstatDesat(desatCorrectament = true) {
  const contenidor = document.getElementById("estat-seients");
  if (!contenidor) return;

  if (desatCorrectament === false) {
    contenidor.textContent =
      "El navegador no ha deixat desar la distribució. Si estàs en una " +
      "finestra privada, prova-ho en una de normal.";
    contenidor.classList.add("estat-seients--error");
    return;
  }

  contenidor.classList.remove("estat-seients--error");

  const textOrigen = {
    navegador: "Desat en aquest navegador",
    fitxer: "Carregat des d'un fitxer",
    exemple: "Distribució d'exemple (encara no has desat res)"
  };

  contenidor.textContent =
    `${textOrigen[CONFIG_SEIENTS.origen()]} · ${CONFIG_SEIENTS.actualitzat()}`;
}

/* ----------------------------------------------------------------
 * Desplegable d'assignació (un únic <select> flotant reutilitzat)
 * ------------------------------------------------------------- */

/**
 * Mostra, al costat del seient clicat, un desplegable amb els
 * alumnes encara no assignats (i, en primer lloc, l'alumne que ja
 * hi hagués en aquest seient, per poder-lo deixar tal com estava o
 * buidar el seient).
 */
function obrirSelectorSeient(seientEl, seientId) {
  tancarSelectorObert();

  const alumneActualId = assignacions[seientId] || "";
  const disponibles = alumnesSenseAssignar(grupSetup);
  const alumneActual = alumneActualId
    ? GRUPS[grupSetup].alumnes.find(a => a.id === alumneActualId)
    : null;

  const select = document.createElement("select");
  select.className = "seient-select";

  const opcioBuida = document.createElement("option");
  opcioBuida.value = "";
  opcioBuida.textContent = "— Seient buit —";
  select.appendChild(opcioBuida);

  // L'alumne que ja seia aquí es mostra encara que "disponibles" no
  // el contingui (perquè està assignat precisament a aquest seient).
  if (alumneActual) {
    const opcioActual = document.createElement("option");
    opcioActual.value = alumneActual.id;
    opcioActual.textContent = etiquetaAlumne(alumneActual);
    select.appendChild(opcioActual);
  }

  for (const alumne of disponibles) {
    const opcio = document.createElement("option");
    opcio.value = alumne.id;
    opcio.textContent = etiquetaAlumne(alumne);
    select.appendChild(opcio);
  }

  select.value = alumneActualId;

  select.addEventListener("change", () => {
    assignarSeient(seientId, select.value || null);
    tancarSelectorObert();
  });

  // Tanca el desplegable si es clica fora, sense assignar res.
  select.addEventListener("blur", () => tancarSelectorObert());

  seientEl.appendChild(select);
  select.focus();
  // Alguns navegadors necessiten un clic explícit per obrir el
  // desplegable en el mateix gest que li ha donat el focus.
  if (typeof select.showPicker === "function") {
    try { select.showPicker(); } catch { /* no disponible: no passa res */ }
  }
}

function tancarSelectorObert() {
  const obert = document.querySelector(".seient-select");
  if (obert) obert.remove();
}

/**
 * Assigna (o buida, si alumneId és null) un seient, refresca tota
 * la graella (perquè l'alumne pot haver desaparegut d'un altre
 * seient si ja hi era) i el comptador de pendents.
 */
function assignarSeient(seientId, alumneId) {
  if (alumneId) {
    // Si l'alumne ja seia en un altre seient, el buidem d'allà.
    for (const [altreSeientId, id] of Object.entries(assignacions)) {
      if (id === alumneId && altreSeientId !== seientId) {
        delete assignacions[altreSeientId];
      }
    }
    assignacions[seientId] = alumneId;
  } else {
    delete assignacions[seientId];
  }

  aplicarCanvis();
}

/* ----------------------------------------------------------------
 * Comptador d'alumnes pendents d'assignar
 * ------------------------------------------------------------- */

function actualitzarComptador() {
  const contenidor = document.getElementById("comptador-pendents");
  const pendents = alumnesSenseAssignar(grupSetup);

  if (pendents.length === 0) {
    contenidor.textContent = "Tots els alumnes tenen seient assignat.";
    contenidor.classList.add("comptador--complet");
  } else {
    // Els noms concrets ja es veuen a la banqueta, aquí només el compte.
    contenidor.textContent = pendents.length === 1
      ? "Falta 1 alumne per assignar."
      : `Falten ${pendents.length} alumnes per assignar.`;
    contenidor.classList.remove("comptador--complet");
  }
}

/* ----------------------------------------------------------------
 * Generació del seients.js final
 * ------------------------------------------------------------- */

/**
 * Converteix les assignacions en curs en la llista de seients que
 * es desa i s'exporta:
 *   { alumneId: "1ESOA-01", fila: 1, taula: 1, costat: "esquerra" }
 *
 * Es genera ordenada per fila/taula/costat (l'ordre en què estan
 * físicament a l'aula), no per l'ordre en què s'han anat clicant,
 * perquè el fitxer descarregat quedi llegible.
 */
function llistaSeientsDelGrup(grupId) {
  return totsElsSeients()
    .map(({ fila, taula, costat }) => {
      const seientId = crearSeientId(fila, taula, costat);
      const alumneId = assignacions[seientId];
      return alumneId ? { alumneId, fila, taula, costat } : null;
    })
    .filter(Boolean);
}

/**
 * Descarrega una còpia de seguretat amb la distribució de TOTS els
 * grups, no només del que s'està editant. Serveix per guardar-la
 * fora del navegador o per passar-la a un altre ordinador.
 */
function descarregarCopiaSeients() {
  const nom = CONFIG_SEIENTS.descarrega();
  mostrarEstatSeients(`S'ha descarregat ${nom}. Guarda'l per poder recuperar ` +
                      `aquesta distribució en un altre ordinador.`);
}

/**
 * Carrega un fitxer de seients descarregat abans (o un seients.js
 * d'una versió anterior). No cal recarregar la pàgina: el carregador
 * republica DISPOSICIO_AULA i SEIENTS, i aquí només hem de tornar a
 * pintar el grup que s'estava editant.
 */
function importarSeients(fitxer) {
  CONFIG_SEIENTS.importa(fitxer).then((dades) => {
    // El fitxer substitueix la configuració sencera: disposició de
    // l'aula i tots els grups que hi hagi a dins.
    if (!CONFIG_SEIENTS.desaTot(dades)) {
      mostrarEstatSeients(
        "El navegador no ha deixat desar la configuració. Si estàs en " +
        "una finestra privada, prova-ho en una de normal.", true);
      return;
    }

    carregarGrup(grupSetup);
    mostrarEstatSeients(`S'ha carregat ${fitxer.name}.`);
  }).catch((error) => {
    mostrarEstatSeients(error.message, true);
  });
}

function mostrarEstatSeients(missatge, esError) {
  const contenidor = document.getElementById("estat-seients");
  if (!contenidor) return;
  contenidor.textContent = missatge;
  contenidor.classList.toggle("estat-seients--error", Boolean(esError));
}

function inicialitzarCarregaSeients() {
  const boto = document.getElementById("boto-carregar-seients");
  const entrada = document.getElementById("fitxer-seients");
  if (!boto || !entrada) return;

  boto.addEventListener("click", () => entrada.click());

  entrada.addEventListener("change", () => {
    const fitxer = entrada.files && entrada.files[0];
    if (!fitxer) return;
    importarSeients(fitxer);
    entrada.value = "";
  });
}

/**
 * Buida totes les assignacions del grup que s'està editant (deixa
 * totes les taules buides). Demana confirmació abans, ja que no es
 * pot desfer.
 */
function buidarAula() {
  const quants = Object.keys(assignacions).length;
  if (quants === 0) return;

  const confirmat = confirm(
    `Vols treure del seu lloc els ${quants} alumnes de ${GRUPS[grupSetup].nom}?\n\n` +
    `Tots tornaran a la banqueta i l'aula quedarà buida, a punt per fer una ` +
    `distribució nova. Els altres grups no es toquen.`
  );
  if (!confirmat) return;

  assignacions = {};
  aplicarCanvis();
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

function iniciarSetup() {
  inicialitzarSelectorGrups();
  inicialitzarBanquetaComADiana();
  inicialitzarCarregaSeients();

  const grupInicial = document.getElementById("selector-grup-setup").value;
  carregarGrup(grupInicial);
  actualitzarEstatDesat();

  document
    .getElementById("boto-descarregar-config")
    .addEventListener("click", descarregarCopiaSeients);

  document
    .getElementById("boto-buidar-aula")
    .addEventListener("click", buidarAula);

  // Tanca el desplegable flotant si es clica fora de qualsevol seient.
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".seient")) {
      tancarSelectorObert();
    }
  });
}

document.addEventListener("DOMContentLoaded", iniciarSetup);
