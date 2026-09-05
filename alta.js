/**
 * alta.js
 * ---------------------------------------------------------------
 * Lògica d'alta.html: donar d'alta (o substituir per complet) la
 * llista d'alumnes d'un grup, enganxant els noms des del full de
 * càlcul del professor.
 *
 * Depèn de dades.js, que s'ha de carregar abans i que hi posa GRUPS.
 *
 * ── QUÈ HA CANVIAT RESPECTE DE LA VERSIÓ ANTERIOR ───────────────
 *
 * Abans això llegia alumnes.js amb fetch() i hi substituïa el bloc
 * del grup amb una expressió regular. Tenia dos inconvenients: només
 * funcionava servint el projecte per http (no obrint el fitxer amb
 * doble clic), i es trencava si algú havia retocat el format del
 * fitxer a mà.
 *
 * Ara el fitxer es genera des de l'objecte que ja tenim a memòria,
 * així que no cal ni fetch ni expressions regulars, i funciona
 * igual obrint la pàgina com a fitxer local.
 *
 * ── ELS IDENTIFICADORS ──────────────────────────────────────────
 *
 * Es manté el comportament d'abans: quan es dona d'alta un grup, els
 * ids dels seus alumnes es regeneren des de zero amb un sufix únic
 * (grupId-XXXX-01, grupId-XXXX-02...) perquè mai coincideixin amb
 * els d'una alta anterior del mateix grup. Això vol dir que els
 * seients d'aquell grup queden desactualitzats i cal refer el Setup.
 * Aquesta pàgina no toca seients.js per res.
 * ---------------------------------------------------------------
 */

/* ----------------------------------------------------------------
 * Selecció del grup a donar d'alta
 * ------------------------------------------------------------- */

/**
 * Omple el selector amb els grups que hi ha ara al fitxer del
 * docent, més una entrada per crear-ne un de nou. Abans la llista
 * estava escrita al codi (["1ESOA", "1ESOB", "4ESO"]), cosa que
 * volia dir que per tenir un grup diferent calia editar aquest
 * fitxer. Ara surt de les dades.
 */
function inicialitzarSelectorGrups() {
  const selector = document.getElementById("selector-grup-alta");
  const seleccioPrevia = selector.value;
  selector.innerHTML = "";

  for (const grupId of Object.keys(GRUPS)) {
    const opcio = document.createElement("option");
    opcio.value = grupId;
    opcio.textContent = GRUPS[grupId].nom || grupId;
    selector.appendChild(opcio);
  }

  const nou = document.createElement("option");
  nou.value = "__nou__";
  nou.textContent = "+ Grup nou…";
  selector.appendChild(nou);

  if (seleccioPrevia && selector.querySelector(`option[value="${seleccioPrevia}"]`)) {
    selector.value = seleccioPrevia;
  }

  selector.onchange = canviarGrupSeleccionat;
}

function canviarGrupSeleccionat() {
  const selector = document.getElementById("selector-grup-alta");

  if (selector.value === "__nou__") {
    crearGrupNou();
    return;
  }

  actualitzarEstatGrupActual();
  precarregarTextareaAmbGrupActual();
}

/**
 * Demana identificador i nom visible del grup nou. L'identificador
 * és el que apareixerà a horari.js i a seients.js, per això es
 * normalitza (majúscules, sense espais): així no acaben coexistint
 * "1ESO A" i "1esoa" com si fossin grups diferents.
 */
function crearGrupNou() {
  const selector = document.getElementById("selector-grup-alta");
  const grupsExistents = Object.keys(GRUPS);

  const brut = prompt(
    "Identificador del grup, curt i sense espais.\n" +
    "És el que faràs servir a horari.js. Per exemple: 1ESOA, 2ESOC, 4ESOAPL"
  );

  if (brut === null) {
    selector.value = grupsExistents[0] || "";
    canviarGrupSeleccionat();
    return;
  }

  const grupId = brut.trim().toUpperCase().replace(/\s+/g, "");

  if (!grupId) {
    selector.value = grupsExistents[0] || "";
    canviarGrupSeleccionat();
    return;
  }

  if (GRUPS[grupId]) {
    alert(`El grup ${grupId} ja existeix. Tria'l al selector.`);
    selector.value = grupId;
    canviarGrupSeleccionat();
    return;
  }

  const nomVisible = prompt(
    "Com vols que es vegi a la pantalla?\nPer exemple: 1r ESO A",
    grupId
  );

  GRUPS[grupId] = {
    nom: (nomVisible || grupId).trim(),
    alumnes: []
  };

  DADES.desa();
  inicialitzarSelectorGrups();
  selector.value = grupId;
  canviarGrupSeleccionat();
}

function precarregarTextareaAmbGrupActual() {
  const grupId = document.getElementById("selector-grup-alta").value;
  const grup = GRUPS[grupId];
  const noms = grup ? grup.alumnes.map(a => a.nom) : [];

  document.getElementById("textarea-noms").value = noms.join("\n");
  actualitzarPrevisualitzacio();
}

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
 * Dades del docent
 * ------------------------------------------------------------- */

/**
 * El nom del docent i el curs no serveixen a l'aplicació: serveixen
 * per distingir els fitxers quan en tens tres a la carpeta de
 * baixades. També decideixen com es dirà el fitxer generat.
 */
function inicialitzarCampsDocent() {
  const dades = DADES.tot();
  const campDocent = document.getElementById("camp-docent");
  const campCurs = document.getElementById("camp-curs");

  campDocent.value = dades.docent || "";
  campCurs.value = dades.curs || "";

  function actualitzar() {
    dades.docent = campDocent.value.trim();
    dades.curs = campCurs.value.trim();
    DADES.desa();
    actualitzarNomFitxer();
  }

  campDocent.addEventListener("input", actualitzar);
  campCurs.addEventListener("input", actualitzar);
  actualitzarNomFitxer();
}

function actualitzarNomFitxer() {
  const etiqueta = document.getElementById("nom-fitxer");
  if (etiqueta) etiqueta.textContent = DADES.anomena();
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

function actualitzarPrevisualitzacio() {
  const text = document.getElementById("textarea-noms").value;
  const noms = parsejarNoms(text);

  const contenidor = document.getElementById("previsualitzacio-llista");
  const comptador = document.getElementById("previsualitzacio-comptador");
  const botoDesa = document.getElementById("boto-desa-descarrega");
  const botoNomes = document.getElementById("boto-desa-nomes");

  contenidor.innerHTML = "";

  if (noms.length === 0) {
    comptador.textContent = "Encara no has enganxat cap nom.";
    botoDesa.disabled = true;
    botoNomes.disabled = true;
    return;
  }

  comptador.textContent = `${noms.length} alumnes detectats, en aquest ordre:`;
  botoDesa.disabled = false;
  botoNomes.disabled = false;

  noms.forEach((nom, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${nom}`;
    contenidor.appendChild(item);
  });
}

/* ----------------------------------------------------------------
 * Aplicar l'alta
 * ------------------------------------------------------------- */

/**
 * Sufix curt (4 xifres) que identifica aquesta alta, perquè els ids
 * generats ara no coincideixin per atzar amb els d'una alta anterior
 * del mateix grup. Si coincidissin, setup.html podria mostrar com a
 * "ja assignat" un seient que en realitat era d'un altre alumne.
 */
function generarSufixAlta() {
  return String(Date.now()).slice(-4);
}

/**
 * Escriu la llista nova al grup seleccionat. "numero" es regenera
 * segons la posició (01, 02...) i NO porta el sufix, perquè és el
 * número que el professor es coneix del full de qualificacions i
 * l'utilitza el mode M2 de positius.js.
 */
function aplicarAlta() {
  const grupId = document.getElementById("selector-grup-alta").value;
  const noms = parsejarNoms(document.getElementById("textarea-noms").value);
  if (noms.length === 0 || !GRUPS[grupId]) return false;

  const sufix = generarSufixAlta();

  GRUPS[grupId].alumnes = noms.map((nom, index) => {
    const posicio = String(index + 1).padStart(2, "0");
    return {
      id: `${grupId}-${sufix}-${posicio}`,
      numero: posicio,
      nom: nom
    };
  });

  if (!DADES.desa()) {
    alert(
      "No s'han pogut desar les dades en aquest navegador. Descarrega el " +
      "fitxer per no perdre la feina."
    );
  }

  actualitzarEstatGrupActual();
  return true;
}

function desaIDescarrega() {
  if (!aplicarAlta()) return;
  const nom = DADES.descarrega();
  avisar(`Desat. S'ha descarregat ${nom} — guarda'l en lloc segur.`);
}

function desaNomesAqui() {
  if (!aplicarAlta()) return;
  avisar(
    "Desat en aquest navegador. Recorda descarregar el fitxer abans de " +
    "canviar d'ordinador."
  );
}

function avisar(missatge) {
  const contenidor = document.getElementById("estat-alta");
  if (!contenidor) return;
  contenidor.textContent = missatge;
  contenidor.hidden = false;
}

/* ----------------------------------------------------------------
 * Punt d'entrada
 * ------------------------------------------------------------- */

function iniciarAlta() {
  inicialitzarCampsDocent();
  inicialitzarSelectorGrups();

  // Si encara no hi ha cap grup, l'única acció útil és crear-ne un.
  if (Object.keys(GRUPS).length === 0) {
    crearGrupNou();
  } else {
    canviarGrupSeleccionat();
  }

  document
    .getElementById("textarea-noms")
    .addEventListener("input", actualitzarPrevisualitzacio);

  document
    .getElementById("boto-desa-descarrega")
    .addEventListener("click", desaIDescarrega);

  document
    .getElementById("boto-desa-nomes")
    .addEventListener("click", desaNomesAqui);
}

document.addEventListener("DOMContentLoaded", iniciarAlta);
