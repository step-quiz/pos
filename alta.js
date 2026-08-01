/**
 * alta.js
 * ---------------------------------------------------------------
 * Lògica d'alta.html: donar d'alta (o substituir per complet) la
 * llista d'alumnes d'un grup, enganxant els noms des del full de
 * càlcul del professor, i descarregar un alumnes.js nou amb aquesta
 * llista ja escrita.
 *
 * Depèn de les dades definides a alumnes.js (GRUPS), que s'ha de
 * carregar abans que aquest fitxer, només per poder mostrar quins
 * grups ja existeixen i quants alumnes tenen ara.
 *
 * Important: quan es dona d'alta un grup, els identificadors dels
 * seus alumnes es regeneren des de zero amb un sufix únic d'aquesta
 * alta (grupId-XXXX-01, grupId-XXXX-02...), perquè mai coincideixin
 * amb els d'una alta anterior del mateix grup. Això vol dir que
 * qualsevol seients.js existent per a aquest grup queda
 * desactualitzat: cal tornar a fer setup.html per tornar a assignar
 * seients. Aquesta pàgina no toca seients.js per res.
 * ---------------------------------------------------------------
 */

// Els tres grups disponibles. Coincideixen amb els que ja existeixen
// a alumnes.js — aquesta llista només decideix què es mostra al
// selector, no d'on surten les dades.
const GRUPS_DISPONIBLES = ["1ESOA", "1ESOB", "4ESO"];

// Text font original d'alumnes.js, carregat amb fetch, usat com a
// plantilla per generar el fitxer final (vegeu setup.js per al
// mateix patró amb seients.js).
let textAlumnesOriginal = null;

/* ----------------------------------------------------------------
 * Selecció del grup a donar d'alta
 * ------------------------------------------------------------- */

function inicialitzarSelectorGrups() {
  const selector = document.getElementById("selector-grup-alta");
  selector.innerHTML = "";

  for (const grupId of GRUPS_DISPONIBLES) {
    const opcio = document.createElement("option");
    opcio.value = grupId;
    const nomActual = GRUPS[grupId]?.nom || grupId;
    opcio.textContent = nomActual;
    selector.appendChild(opcio);
  }

  selector.addEventListener("change", actualitzarEstatGrupActual);
}

/**
 * Mostra sota el selector quants alumnes té ara mateix el grup
 * triat, com a referència abans de substituir-los.
 */
function actualitzarEstatGrupActual() {
  const grupId = document.getElementById("selector-grup-alta").value;
  const contenidor = document.getElementById("estat-grup-actual");

  const grup = GRUPS[grupId];
  const nAlumnesActuals = grup ? grup.alumnes.length : 0;

  if (nAlumnesActuals === 0) {
    contenidor.textContent = `${grup?.nom || grupId} encara no té cap alumne donat d'alta.`;
  } else {
    contenidor.textContent =
      `${grup.nom} té ara mateix ${nAlumnesActuals} alumnes. ` +
      `Si continues, es SUBSTITUIRAN completament per la llista nova.`;
  }
}

/* ----------------------------------------------------------------
 * Parsejar la llista enganxada
 * ------------------------------------------------------------- */

/**
 * Parseja el text enganxat a un array de noms nets: una línia per
 * alumne, sense línies buides ni espais sobrants als extrems.
 * Admet que s'hagi enganxat amb tabulacions al darrere (per exemple,
 * si l'usuari ha copiat més d'una columna del full de càlcul per
 * error): només es queda amb la primera columna de cada línia.
 */
function parsejarNoms(text) {
  return text
    .split("\n")
    .map(linia => linia.split("\t")[0].trim())
    .filter(nom => nom.length > 0);
}

/**
 * Refresca la previsualització de la llista d'alumnes a partir del
 * contingut actual del textarea.
 */
function actualitzarPrevisualitzacio() {
  const text = document.getElementById("textarea-noms").value;
  const noms = parsejarNoms(text);

  const contenidor = document.getElementById("previsualitzacio-llista");
  const comptador = document.getElementById("previsualitzacio-comptador");
  const boto = document.getElementById("boto-descarregar-alumnes");

  contenidor.innerHTML = "";

  if (noms.length === 0) {
    comptador.textContent = "Encara no has enganxat cap nom.";
    boto.disabled = true;
    return;
  }

  comptador.textContent = `${noms.length} alumnes detectats, en aquest ordre:`;
  boto.disabled = false;

  noms.forEach((nom, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${nom}`;
    contenidor.appendChild(item);
  });
}

/* ----------------------------------------------------------------
 * Generació de l'alumnes.js final
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
 * Retorna un sufix curt (4 xifres) que identifica aquesta alta en
 * concret, perquè els ids generats ara no coincideixin per atzar
 * amb els d'una alta anterior del mateix grup (per exemple, si
 * abans hi havia 30 alumnes i ara se'n donen d'alta 5, els nous ids
 * "1ESOA-01".."1ESOA-05" no han de coincidir amb els 5 primers
 * alumnes de l'alta anterior: si coincidissin, setup.html podria
 * mostrar erròniament seients "ja assignats" que en realitat
 * pertanyien a un altre alumne).
 */
function generarSufixAlta() {
  return String(Date.now()).slice(-4);
}

/**
 * Retorna el codi (cos de l'array, sense claudàtors) amb un alumne
 * per línia, en el mateix estil que ja fem servir a alumnes.js:
 *   { id: "1ESOA-7042-01", nom: "Martina" },
 *
 * Els identificadors es regeneren des de zero a cada alta, numerats
 * segons l'ordre en què s'han enganxat els noms i marcats amb el
 * sufix d'aquesta alta perquè no coincideixin amb els d'una alta
 * anterior (vegeu generarSufixAlta).
 */
function generarCosArrayAlumnes(grupId, noms) {
  const sufixAlta = generarSufixAlta();

  const linies = noms.map((nom, index) => {
    const numero = String(index + 1).padStart(2, "0");
    const id = `${grupId}-${sufixAlta}-${numero}`;
    return `      { id: ${JSON.stringify(id)}, nom: ${JSON.stringify(nom)} }`;
  });

  return linies.join(",\n");
}

/**
 * Substitueix, dins el text original d'alumnes.js, el bloc
 * "grupId": { nom: ..., alumnes: [ ... ] } pel de la llista nova
 * (mantenint el mateix "nom" de grup que ja hi hagués). La resta
 * del fitxer (comentaris, altres grups...) queda intacta.
 */
function generarTextAlumnesActualitzat(grupId, noms) {
  const idText = JSON.stringify(grupId);
  const nomGrup = GRUPS[grupId]?.nom || grupId;

  const patroBloc = new RegExp(
    String.raw`${idText}\s*:\s*\{[\s\S]*?alumnes\s*:\s*\[[\s\S]*?\]\s*\}(?=\s*[,}])`
  );

  if (!patroBloc.test(textAlumnesOriginal)) {
    console.error(`No s'ha trobat el bloc GRUPS[${idText}] a alumnes.js`);
    return textAlumnesOriginal;
  }

  const nouBloc =
    `${idText}: {\n` +
    `    nom: ${JSON.stringify(nomGrup)},\n` +
    `    alumnes: [\n${generarCosArrayAlumnes(grupId, noms)}\n    ]\n` +
    `  }`;

  return textAlumnesOriginal.replace(patroBloc, nouBloc);
}

async function descarregarAlumnesActualitzat() {
  if (!textAlumnesOriginal) {
    try {
      await carregarTextAlumnesOriginal();
    } catch (error) {
      console.error("No s'ha pogut carregar alumnes.js:", error);
      alert(
        "No s'ha pogut llegir alumnes.js del servidor, així que no es pot " +
        "generar la descàrrega. Comprova que la pàgina s'obre per http(s) " +
        "(amb un servidor local), no fent doble clic sobre el fitxer."
      );
      return;
    }
  }

  const grupId = document.getElementById("selector-grup-alta").value;
  const noms = parsejarNoms(document.getElementById("textarea-noms").value);
  if (noms.length === 0) return;

  const text = generarTextAlumnesActualitzat(grupId, noms);
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const enllaç = document.createElement("a");
  enllaç.href = url;
  enllaç.download = "alumnes.js";
  document.body.appendChild(enllaç);
  enllaç.click();
  document.body.removeChild(enllaç);

  URL.revokeObjectURL(url);
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

async function iniciarAlta() {
  inicialitzarSelectorGrups();
  actualitzarEstatGrupActual();
  actualitzarPrevisualitzacio();

  // Els listeners es registren SEMPRE, encara que la càrrega del
  // text original falli — així la pàgina segueix sent interactiva
  // (escriure, veure la previsualització) independentment que el
  // fetch d'alumnes.js vagi bé o no.
  document
    .getElementById("textarea-noms")
    .addEventListener("input", actualitzarPrevisualitzacio);

  document
    .getElementById("boto-descarregar-alumnes")
    .addEventListener("click", descarregarAlumnesActualitzat);

  try {
    await carregarTextAlumnesOriginal();
  } catch (error) {
    console.error("No s'ha pogut carregar alumnes.js:", error);
    const contenidor = document.getElementById("estat-grup-actual");
    contenidor.textContent =
      "No s'ha pogut llegir alumnes.js del servidor. Comprova que el fitxer " +
      "és a la mateixa carpeta i que la pàgina s'obre per http(s), no com a fitxer local.";
  }
}

document.addEventListener("DOMContentLoaded", iniciarAlta);
