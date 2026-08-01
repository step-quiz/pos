/**
 * alta.js
 * ---------------------------------------------------------------
 * Lògica d'alta.html: donar d'alta (o substituir per complet) la
 * llista d'alumnes d'un grup a partir d'un copy-paste de noms, un
 * per línia, i descarregar un alumnes.js nou amb aquesta llista ja
 * escrita.
 *
 * Depèn de les dades definides a alumnes.js (GRUPS), que s'ha de
 * carregar abans que aquest fitxer.
 *
 * Igual que setup.js amb seients.js: aquesta pàgina llegeix el text
 * font ORIGINAL d'alumnes.js amb fetch i, en descarregar, hi
 * substitueix únicament el bloc del grup triat — la resta del
 * fitxer (comentaris, altres grups) queda intacta.
 *
 * Important: substituir la llista d'un grup li assigna ids nous a
 * tots els seus alumnes (GRUPID-01, GRUPID-02...). Per això, després
 * de fer una alta, cal tornar a passar per setup.html per assignar
 * seients a aquest grup — els seients vells (seients.js) fan
 * referència a ids que ja no existeixen i simplement deixaran de
 * mostrar-se, tal com ja preveu positius.js.
 * ---------------------------------------------------------------
 */

/* ----------------------------------------------------------------
 * Estat en memòria
 * ------------------------------------------------------------- */

// Grup que s'està donant d'alta ara mateix
let grupAlta = null;

// Llista de noms ja netejada (sense línies buides), tal com es farà
// servir per generar el fitxer final
let nomsActuals = [];

// Text font original d'alumnes.js, carregat amb fetch. Fet servir
// com a plantilla per generar el fitxer final.
let textAlumnesOriginal = null;

/* ----------------------------------------------------------------
 * Selecció del grup a donar d'alta
 * ------------------------------------------------------------- */

function inicialitzarSelectorGrups() {
  const selector = document.getElementById("selector-grup-alta");
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
 * Canvia de grup: no toca el textarea (l'usuari pot voler enganxar
 * la mateixa llista a un altre grup, o simplement l'ha canviat sense
 * voler), només actualitza el títol de previsualització i tornar a
 * validar/comptar amb el grup nou.
 */
function carregarGrup(grupId) {
  grupAlta = grupId;

  document.getElementById("etiqueta-previsualitzacio").textContent =
    `Previsualització — així quedarà ${GRUPS[grupId].nom}`;

  processarText();
}

/* ----------------------------------------------------------------
 * Processament del textarea: noms → previsualització
 * ------------------------------------------------------------- */

/**
 * Neteja el text enganxat: una línia per nom, treu espais sobrants
 * a cada línia i descarta les línies completament buides (per si hi
 * ha salts de línia de més en enganxar des d'un full de càlcul).
 */
function netejarNoms(textCru) {
  return textCru
    .split("\n")
    .map(linia => linia.trim())
    .filter(linia => linia.length > 0);
}

/**
 * Es crida cada vegada que canvia el text o el grup seleccionat:
 * recalcula la llista de noms, la previsualització, els avisos i
 * l'estat del botó de descàrrega.
 */
function processarText() {
  const textarea = document.getElementById("text-alumnes");
  nomsActuals = netejarNoms(textarea.value);

  renderitzarPrevisualitzacio();
  actualitzarAvisos();
}

function renderitzarPrevisualitzacio() {
  const llista = document.getElementById("previsualitzacio-alumnes");
  llista.innerHTML = "";

  for (const nom of nomsActuals) {
    const item = document.createElement("li");
    item.textContent = nom;
    llista.appendChild(item);
  }
}

/**
 * Mostra avisos no bloquejants (massa alumnes per a l'aula) i
 * l'estat del comptador, i activa/desactiva el botó de descàrrega.
 * Un grup buit és vàlid per descarregar (per exemple, si vols
 * deixar el grup momentàniament sense alumnes), però mai amb el
 * textarea completament buit d'entrada — per evitar buidar un grup
 * per error amb un clic accidental.
 */
function actualitzarAvisos() {
  const avis = document.getElementById("avis-alta");
  const comptador = document.getElementById("comptador-alta");
  const boto = document.getElementById("boto-descarregar-alumnes");
  const capacitatMaxima = DISPOSICIO_AULA?.files * DISPOSICIO_AULA?.parelles_per_fila * 2 || null;

  comptador.textContent = nomsActuals.length === 1
    ? "1 alumne."
    : `${nomsActuals.length} alumnes.`;

  if (nomsActuals.length === 0) {
    avis.textContent = "Enganxa almenys un nom per poder descarregar.";
    avis.classList.remove("alta-avis--error");
    boto.disabled = true;
    return;
  }

  if (capacitatMaxima && nomsActuals.length > capacitatMaxima) {
    avis.textContent =
      `Atenció: ${nomsActuals.length} alumnes superen les ${capacitatMaxima} places de l'aula ` +
      `(${DISPOSICIO_AULA.files} files × ${DISPOSICIO_AULA.parelles_per_fila} taules × 2). ` +
      `Es descarregarà igualment, però a setup.html en quedaran alguns sense seient.`;
    avis.classList.remove("alta-avis--error");
  } else {
    avis.textContent = "";
    avis.classList.remove("alta-avis--error");
  }

  boto.disabled = false;
}

/* ----------------------------------------------------------------
 * Generació del alumnes.js final
 * ------------------------------------------------------------- */

/**
 * Carrega el text font original d'alumnes.js (una sola vegada) per
 * fer-lo servir de plantilla en generar el fitxer final.
 */
async function carregarTextAlumnesOriginal() {
  const resposta = await fetch("alumnes.js");
  textAlumnesOriginal = await resposta.text();
}

/**
 * Genera els ids nous per al grup: GRUPID-01, GRUPID-02... en el
 * mateix ordre en què s'han enganxat els noms. Substituir la llista
 * sempre regenera els ids (encara que un nom coincideixi amb un
 * alumne anterior), ja que no hi ha manera fiable de saber si és
 * "el mateix" alumne o un de nou amb el mateix nom.
 */
function generarIdsNous(grupId, noms) {
  const xifres = String(noms.length).length < 2 ? 2 : String(noms.length).length;
  return noms.map((nom, index) => ({
    id: `${grupId}-${String(index + 1).padStart(xifres, "0")}`,
    nom
  }));
}

/**
 * Retorna el codi del bloc d'alumnes d'un grup, amb el mateix estil
 * que ja fem servir a alumnes.js:
 *   alumnes: [
 *     { id: "1ESOA-01", nom: "Martina" },
 *     ...
 *   ]
 */
function generarBlocAlumnes(alumnesNous) {
  if (alumnesNous.length === 0) {
    return "alumnes: []";
  }
  const linies = alumnesNous.map(
    a => `      { id: ${JSON.stringify(a.id)}, nom: ${JSON.stringify(a.nom)} }`
  );
  return `alumnes: [\n${linies.join(",\n")}\n    ]`;
}

/**
 * Substitueix, dins el text original d'alumnes.js, el bloc
 * "alumnes: [ ... ]" del grup triat per la llista nova. La resta
 * del fitxer (comentaris, "nom" del grup, altres grups) queda
 * intacta. Es localitza el grup pel seu identificador literal
 * (p. ex. "1ESOA":) i es reemplaça només el primer bloc
 * "alumnes: [...]" que hi apareix a continuació.
 */
function generarTextAlumnesActualitzat(grupId, alumnesNous) {
  const text = textAlumnesOriginal;
  const idText = JSON.stringify(grupId);

  // Localitza on comença la definició d'aquest grup: "1ESOA": {
  const patroIniciGrup = new RegExp(String.raw`${idText}\s*:\s*\{`);
  const matchInici = patroIniciGrup.exec(text);

  if (!matchInici) {
    throw new Error(`No s'ha trobat el grup ${grupId} a alumnes.js`);
  }

  // A partir d'aquí, localitza el bloc "alumnes: [ ... ]" complet,
  // comptant claudàtors per trobar-ne el tancament correcte encara
  // que els noms continguin caràcters especials.
  const inici = matchInici.index;
  const patroAlumnes = /alumnes\s*:\s*\[/;
  const matchAlumnes = patroAlumnes.exec(text.slice(inici));

  if (!matchAlumnes) {
    throw new Error(`No s'ha trobat la llista d'alumnes del grup ${grupId} a alumnes.js`);
  }

  const inicíClaudator = inici + matchAlumnes.index + matchAlumnes[0].length;
  let profunditat = 1;
  let posicio = inicíClaudator;

  while (profunditat > 0 && posicio < text.length) {
    const caracter = text[posicio];
    if (caracter === "[") profunditat++;
    if (caracter === "]") profunditat--;
    posicio++;
  }

  if (profunditat !== 0) {
    throw new Error(`No s'ha pogut tancar la llista d'alumnes del grup ${grupId} a alumnes.js`);
  }

  const abans = text.slice(0, inici + matchAlumnes.index);
  const despres = text.slice(posicio);
  const blocNou = generarBlocAlumnes(alumnesNous);

  return `${abans}${blocNou}${despres}`;
}

async function descarregarAlumnesActualitzat() {
  if (!textAlumnesOriginal) {
    await carregarTextAlumnesOriginal();
  }

  const alumnesNous = generarIdsNous(grupAlta, nomsActuals);

  let text;
  try {
    text = generarTextAlumnesActualitzat(grupAlta, alumnesNous);
  } catch (error) {
    console.error(error);
    const avis = document.getElementById("avis-alta");
    avis.textContent = "Hi ha hagut un error generant el fitxer. Revisa la consola.";
    avis.classList.add("alta-avis--error");
    return;
  }

  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const enllaç = document.createElement("a");
  enllaç.href = url;
  enllaç.download = "alumnes.js";
  document.body.appendChild(enllaç);
  enllaç.click();
  document.body.removeChild(enllaç);

  URL.revokeObjectURL(url);

  mostrarAvisPostDescarrega();
}

/**
 * Recordatori important després de descarregar: com que els ids dels
 * alumnes d'aquest grup han canviat, els seients antics d'aquest
 * grup a seients.js ja no correspondran a ningú. Cal substituir
 * alumnes.js pel nou i tornar a fer setup.html per a aquest grup.
 */
function mostrarAvisPostDescarrega() {
  const avis = document.getElementById("avis-alta");
  avis.textContent =
    `Descarregat. Substitueix alumnes.js pel nou fitxer i, com que els ids de ` +
    `${GRUPS[grupAlta].nom} han canviat, torna a fer setup.html per assignar-li seients.`;
  avis.classList.remove("alta-avis--error");
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

async function iniciarAlta() {
  inicialitzarSelectorGrups();

  const grupInicial = document.getElementById("selector-grup-alta").value;
  carregarGrup(grupInicial);

  await carregarTextAlumnesOriginal();

  document.getElementById("text-alumnes").addEventListener("input", processarText);

  document
    .getElementById("boto-descarregar-alumnes")
    .addEventListener("click", descarregarAlumnesActualitzat);
}

document.addEventListener("DOMContentLoaded", iniciarAlta);
