/**
 * setup.js
 * ---------------------------------------------------------------
 * Lògica de setup.html: assignar cada alumne d'un grup a una taula
 * concreta de l'aula (fila, taula, costat) i, al final, descarregar
 * un config.js nou amb aquestes posicions ja escrites.
 *
 * Depèn de les dades definides a config.js (GRUPS, DISPOSICIO_AULA),
 * que s'han de carregar abans que aquest fitxer.
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

// Text font original de config.js, carregat amb fetch. El fem
// servir com a plantilla per generar el fitxer final: només hi
// reemplacem els números de fila/taula/costat, i deixem la resta
// (comentaris, ordre, HORARI, MAX_POSITIUS_DIA...) exactament igual.
let textConfigOriginal = null;

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
 * de les posicions que ja tingui el grup a config.js (si en té) i
 * dibuixa la graella de seients.
 */
function carregarGrup(grupId) {
  grupSetup = grupId;
  assignacions = {};

  for (const alumne of GRUPS[grupId].alumnes) {
    const tePosicio = alumne.fila && alumne.taula && alumne.costat;
    if (tePosicio) {
      const seientId = crearSeientId(alumne.fila, alumne.taula, alumne.costat);
      assignacions[seientId] = alumne.id;
    }
  }

  renderitzarGraella();
  actualitzarComptador();
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

  refrescarSeientEl(seientEl, seientId);
  return seientEl;
}

function refrescarSeientEl(seientEl, seientId) {
  const alumneId = assignacions[seientId];
  const alumne = alumneId
    ? GRUPS[grupSetup].alumnes.find(a => a.id === alumneId)
    : null;

  seientEl.classList.toggle("seient--buit", !alumne);
  seientEl.textContent = alumne ? alumne.nom : "+ assigna";
  seientEl.setAttribute(
    "aria-label",
    alumne ? `${alumne.nom}. Clica per canviar.` : "Seient buit. Clica per assignar un alumne."
  );
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
    opcioActual.textContent = alumneActual.nom;
    select.appendChild(opcioActual);
  }

  for (const alumne of disponibles) {
    const opcio = document.createElement("option");
    opcio.value = alumne.id;
    opcio.textContent = alumne.nom;
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

  renderitzarGraella();
  actualitzarComptador();
}

/* ----------------------------------------------------------------
 * Comptador d'alumnes pendents d'assignar
 * ------------------------------------------------------------- */

function actualitzarComptador() {
  const contenidor = document.getElementById("comptador-pendents");
  const pendents = alumnesSenseAssignar(grupSetup);
  const boto = document.getElementById("boto-descarregar-config");

  if (pendents.length === 0) {
    contenidor.textContent = "Tots els alumnes tenen seient assignat.";
    contenidor.classList.add("comptador--complet");
  } else {
    contenidor.textContent =
      `Falten ${pendents.length} alumnes per assignar: ` +
      pendents.map(a => a.nom).join(", ");
    contenidor.classList.remove("comptador--complet");
  }

  boto.disabled = pendents.length > 0;
}

/* ----------------------------------------------------------------
 * Generació del config.js final
 * ------------------------------------------------------------- */

/**
 * Carrega el text font original de config.js (una sola vegada) per
 * fer-lo servir de plantilla en generar el fitxer final.
 */
async function carregarTextConfigOriginal() {
  const resposta = await fetch("config.js");
  textConfigOriginal = await resposta.text();
}

/**
 * Retorna el codi per a un únic alumne amb les seves noves
 * posicions, amb el mateix estil que ja fem servir a config.js:
 * { id: "1A-01", nom: "Martina",  fila: 1, taula: 1, costat: "esquerra" }
 *
 * amplariaNom és l'amplada (en caràcters) del "nom": "X", camp més
 * llarg, per alinear la columna "fila:" de totes les línies del
 * grup, tal com ja fa el fitxer original escrit a mà.
 */
function generarLiniaAlumne(alumne, fila, taula, costat, amplariaNom) {
  const idText = JSON.stringify(alumne.id);
  const nomText = (JSON.stringify(alumne.nom) + ",").padEnd(amplariaNom + 1);
  return `{ id: ${idText}, nom: ${nomText} fila: ${fila}, taula: ${taula}, costat: ${JSON.stringify(costat)} }`;
}

/**
 * Substitueix, dins el text original de config.js, l'objecte de
 * cada alumne del grup configurat per una versió amb la seva nova
 * posició. La resta del fitxer (comentaris, altres grups, HORARI...)
 * queda intacta.
 */
function generarTextConfigActualitzat(grupId) {
  let text = textConfigOriginal;

  // Amplada del "nom": més llarg del grup, per alinear la columna
  // "fila:" de totes les línies igual que a l'original.
  const amplariaNom = Math.max(
    ...GRUPS[grupId].alumnes.map(a => (JSON.stringify(a.nom) + ",").length)
  );

  for (const alumne of GRUPS[grupId].alumnes) {
    // Localitzem la línia sencera d'aquest alumne buscant el seu id
    // literal, tal com apareix escrit a config.js.
    const idText = JSON.stringify(alumne.id);
    const patroLinia = new RegExp(
      String.raw`\{\s*id:\s*${idText}\s*,[^\n]*\}`
    );

    const seientId = Object.keys(assignacions).find(
      sid => assignacions[sid] === alumne.id
    );

    if (!seientId) continue; // no hauria de passar (el botó està desactivat si en falta algun)

    const [fila, taula, costat] = seientId.split("-");
    const novaLinia = generarLiniaAlumne(alumne, Number(fila), Number(taula), costat, amplariaNom);

    if (!patroLinia.test(text)) {
      console.error(`No s'ha trobat l'alumne ${alumne.id} al text de config.js`);
      continue;
    }

    text = text.replace(patroLinia, novaLinia);
  }

  return text;
}

async function descarregarConfigActualitzat() {
  if (!textConfigOriginal) {
    await carregarTextConfigOriginal();
  }

  const text = generarTextConfigActualitzat(grupSetup);
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const enllaç = document.createElement("a");
  enllaç.href = url;
  enllaç.download = "config.js";
  document.body.appendChild(enllaç);
  enllaç.click();
  document.body.removeChild(enllaç);

  URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

async function iniciarSetup() {
  inicialitzarSelectorGrups();

  const grupInicial = document.getElementById("selector-grup-setup").value;
  carregarGrup(grupInicial);

  await carregarTextConfigOriginal();

  document
    .getElementById("boto-descarregar-config")
    .addEventListener("click", descarregarConfigActualitzat);

  // Tanca el desplegable flotant si es clica fora de qualsevol seient.
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".seient")) {
      tancarSelectorObert();
    }
  });
}

document.addEventListener("DOMContentLoaded", iniciarSetup);
