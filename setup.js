/**
 * setup.js
 * ---------------------------------------------------------------
 * Lògica de setup.html: assignar cada alumne d'un grup a una taula
 * concreta de l'aula (fila, taula, costat) i, al final, descarregar
 * un seients.js nou amb aquestes posicions ja escrites.
 *
 * Depèn de les dades definides a alumnes.js (GRUPS) i a seients.js
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

// Text font original de seients.js, carregat amb fetch. El fem
// servir com a plantilla per generar el fitxer final: només hi
// reemplacem el bloc SEIENTS[grupId], i deixem la resta
// (comentaris, DISPOSICIO_AULA, altres grups...) exactament igual.
let textSeientsOriginal = null;

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
 * de les posicions que ja tingui el grup a seients.js (si en té) i
 * dibuixa la graella de seients.
 */
function carregarGrup(grupId) {
  grupSetup = grupId;
  assignacions = {};

  const seientsGrup = SEIENTS[grupId] || [];
  for (const seient of seientsGrup) {
    const seientId = crearSeientId(seient.fila, seient.taula, seient.costat);
    assignacions[seientId] = seient.alumneId;
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
 * Generació del seients.js final
 * ------------------------------------------------------------- */

/**
 * Carrega el text font original de seients.js (una sola vegada) per
 * fer-lo servir de plantilla en generar el fitxer final.
 */
async function carregarTextSeientsOriginal() {
  const resposta = await fetch("seients.js");
  textSeientsOriginal = await resposta.text();
}

/**
 * Retorna el codi per a un únic seient ocupat, amb el mateix estil
 * que ja fem servir a seients.js:
 * { alumneId: "1ESOA-01", fila: 1, taula: 1, costat: "esquerra" }
 */
function generarLiniaSeient(alumneId, fila, taula, costat) {
  return `    { alumneId: ${JSON.stringify(alumneId)}, fila: ${fila}, taula: ${taula}, costat: ${JSON.stringify(costat)} }`;
}

/**
 * Retorna el codi del bloc SEIENTS[grupId] = [ ... ], amb un seient
 * per línia, ordenats per fila/taula/costat (mateix ordre que ja
 * feia servir el fitxer original escrit a mà).
 */
function generarBlocSeients(grupId) {
  const ordreCostat = { esquerra: 0, dreta: 1 };
  const seientsOrdenats = Object.entries(assignacions)
    .map(([seientId, alumneId]) => {
      const [fila, taula, costat] = seientId.split("-");
      return { fila: Number(fila), taula: Number(taula), costat, alumneId };
    })
    .sort((a, b) =>
      a.fila - b.fila ||
      a.taula - b.taula ||
      ordreCostat[a.costat] - ordreCostat[b.costat]
    );

  if (seientsOrdenats.length === 0) {
    return `"${grupId}": []`;
  }

  const linies = seientsOrdenats.map(s =>
    generarLiniaSeient(s.alumneId, s.fila, s.taula, s.costat)
  );

  return `"${grupId}": [\n${linies.join(",\n")}\n  ]`;
}

/**
 * Substitueix, dins el text original de seients.js, el bloc
 * "GRUPID": [ ... ] del grup configurat per la llista nova de
 * seients. La resta del fitxer (comentaris, DISPOSICIO_AULA, altres
 * grups) queda intacta. Es localitza el grup pel seu identificador
 * literal (p. ex. "1ESOA":) i es reemplaça tot el bloc "[...]" que
 * hi apareix a continuació, comptant claudàtors per trobar-ne el
 * tancament correcte.
 */
function generarTextSeientsActualitzat(grupId) {
  const text = textSeientsOriginal;
  const idText = JSON.stringify(grupId);

  const patroIniciGrup = new RegExp(String.raw`${idText}\s*:\s*\[`);
  const matchInici = patroIniciGrup.exec(text);

  if (!matchInici) {
    throw new Error(`No s'ha trobat el grup ${grupId} a seients.js`);
  }

  const inicíClaudator = matchInici.index + matchInici[0].length;
  let profunditat = 1;
  let posicio = inicíClaudator;

  while (profunditat > 0 && posicio < text.length) {
    const caracter = text[posicio];
    if (caracter === "[") profunditat++;
    if (caracter === "]") profunditat--;
    posicio++;
  }

  if (profunditat !== 0) {
    throw new Error(`No s'ha pogut tancar la llista de seients del grup ${grupId} a seients.js`);
  }

  const abans = text.slice(0, matchInici.index);
  const despres = text.slice(posicio);
  const blocNou = generarBlocSeients(grupId);

  return `${abans}${blocNou}${despres}`;
}

async function descarregarSeientsActualitzat() {
  if (!textSeientsOriginal) {
    await carregarTextSeientsOriginal();
  }

  const text = generarTextSeientsActualitzat(grupSetup);
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const enllaç = document.createElement("a");
  enllaç.href = url;
  enllaç.download = "seients.js";
  document.body.appendChild(enllaç);
  enllaç.click();
  document.body.removeChild(enllaç);

  URL.revokeObjectURL(url);
}

/**
 * Buida totes les assignacions del grup que s'està editant (deixa
 * totes les taules buides). Demana confirmació abans, ja que no es
 * pot desfer.
 */
function esborrarTotesLesAssignacions() {
  const teAlgunaAssignacio = Object.keys(assignacions).length > 0;
  if (!teAlgunaAssignacio) return;

  const confirmat = confirm(
    `Segur que vols esborrar les ${Object.keys(assignacions).length} assignacions de ${GRUPS[grupSetup].nom}? Aquesta acció no es pot desfer.`
  );
  if (!confirmat) return;

  assignacions = {};
  renderitzarGraella();
  actualitzarComptador();
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

async function iniciarSetup() {
  inicialitzarSelectorGrups();

  const grupInicial = document.getElementById("selector-grup-setup").value;
  carregarGrup(grupInicial);

  // Els listeners es registren SEMPRE, encara que la càrrega del
  // text original falli — així la pàgina és interactiva (assignar
  // seients, veure comptadors) independentment que el fetch vagi bé.
  document
    .getElementById("boto-descarregar-config")
    .addEventListener("click", descarregarSeientsActualitzat);

  document
    .getElementById("boto-esborrar-tot")
    .addEventListener("click", esborrarTotesLesAssignacions);

  // Tanca el desplegable flotant si es clica fora de qualsevol seient.
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".seient")) {
      tancarSelectorObert();
    }
  });

  try {
    await carregarTextSeientsOriginal();
  } catch (error) {
    console.error("No s'ha pogut carregar seients.js:", error);
    const contenidor = document.getElementById("comptador-pendents");
    contenidor.textContent =
      "No s'ha pogut llegir seients.js del servidor. Comprova que el fitxer " +
      "és a la mateixa carpeta i que la pàgina s'obre per http(s), no com a fitxer local.";
    contenidor.classList.remove("comptador--complet");
  }
}

document.addEventListener("DOMContentLoaded", iniciarSetup);
