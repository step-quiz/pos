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
 * Els seients (seients.js) i els positius desats van lligats a l'id
 * de cada alumne. Abans, cada alta regenerava TOTS els ids des de
 * zero, de manera que afegir un alumne o corregir una falta
 * d'ortografia deixava l'aula buida i calia refer el Setup sencer.
 *
 * Ara, en tornar a donar d'alta un grup, cada nom de la llista nova
 * s'emparella amb un alumne de la llista antiga i en CONSERVA l'id:
 *
 *   1. Mateix nom (sense tenir en compte majúscules, accents ni
 *      espais repetits)           → es conserva, sense més.
 *   2. Nom molt semblant (una o dues lletres de diferència, o un nom
 *      que n'amplia un altre: «Maria» → «Maria José»)
 *                                 → es considera una correcció.
 *   3. Cap semblança              → alumne nou, amb id nou.
 *
 * Els alumnes antics que no s'han emparellat amb ningú surten del
 * grup, i només ells perden el seient. La previsualització ensenya
 * què passarà amb cada nom i deixa corregir l'emparellament a mà
 * (per exemple, «Pep» → «Josep», que no s'assemblen prou per
 * endevinar-ho).
 *
 * El "numero" (01, 02...) continua sent sempre la posició a la
 * llista, com abans.
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

  emparellamentsManuals = {};
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
      `${grup.nom} té ara mateix ${nAlumnesActuals} alumnes. Pots afegir, ` +
      `treure, reordenar o corregir noms: qui continuï al grup conserva ` +
      `el seient i els positius.`;
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

/* ----------------------------------------------------------------
 * Emparellar la llista nova amb l'antiga
 * ------------------------------------------------------------- */

/**
 * Forma "neta" d'un nom per comparar: minúscules, sense accents,
 * sense punts ni guions i amb els espais col·lapsats.
 * «  Núria  M. » → «nuria m»
 */
function normalitzarNom(nom) {
  return String(nom)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\-·'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Distància d'edició (Levenshtein): nombre mínim d'insercions,
 * esborrats o substitucions de lletres per passar d'una cadena a
 * l'altra. Programació dinàmica clàssica amb dues files.
 */
function distanciaEdicio(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(
        anterior[j] + 1,        // esborrar
        actual[j - 1] + 1,      // inserir
        anterior[j - 1] + cost  // substituir
      );
    }
    anterior = actual;
  }
  return anterior[b.length];
}

/**
 * Diu si dos noms (ja normalitzats) són prou semblants per ser el
 * mateix alumne amb el nom corregit. Retorna una puntuació (com més
 * baixa, més semblants) o Infinity si no s'assemblen prou.
 *
 *   - Una o dues lletres de diferència, sempre que no sigui més
 *     d'un terç del nom: «Martna»→«Martina», «Yousef»→«Youssef».
 *     (Amb noms de 3 lletres, «Pau»→«Leo» NO passa.)
 *   - Un nom que és el començament de l'altre, acabant en paraula
 *     sencera: «Maria»→«Maria José», «Joan C»→«Joan».
 */
function puntuacioSemblanca(a, b) {
  const d = distanciaEdicio(a, b);
  const llarg = Math.max(a.length, b.length);
  if (d <= 2 && d / llarg <= 0.34) return d;

  const [curt, llargNom] = a.length <= b.length ? [a, b] : [b, a];
  if (curt.length >= 3 && llargNom.startsWith(curt + " ")) return 3;

  return Infinity;
}

/**
 * Emparella els noms de la llista nova amb els alumnes que el grup ja
 * té, per poder conservar-ne l'id (i, amb l'id, el seient i els
 * positius).
 *
 * `manuals` són els emparellaments decidits a mà a la
 * previsualització: { nomNormalitzat: idAntic | null }. Un null vol
 * dir «és un alumne nou, no l'emparellis amb ningú».
 *
 * Retorna:
 *   {
 *     files: [{ nom, idAntic, nomAntic, tipus }]   // una per nom nou
 *     baixes: [alumneAntic, ...]                     // no emparellats
 *   }
 * on tipus és "igual", "corregit", "manual" o "nou".
 */
function emparellarAmbLlistaAntiga(antics, nomsNous, manuals = {}) {
  const usats = new Set();
  const files = nomsNous.map(nom => ({
    nom, clau: normalitzarNom(nom), idAntic: null, nomAntic: null, tipus: null
  }));

  function vincula(fila, antic, tipus) {
    fila.idAntic = antic.id;
    fila.nomAntic = antic.nom;
    fila.tipus = tipus;
    usats.add(antic.id);
  }

  // 0. Decisions fetes a mà: manen sobre qualsevol endevinalla.
  for (const fila of files) {
    if (!(fila.clau in manuals)) continue;
    const idTriat = manuals[fila.clau];
    if (idTriat === null) {
      fila.tipus = "nou";
      continue;
    }
    const antic = antics.find(a => a.id === idTriat);
    if (antic && !usats.has(antic.id)) vincula(fila, antic, "manual");
  }

  // 1. Mateix nom (normalitzat). Si hi ha dos alumnes amb el mateix
  //    nom, s'aparellen per ordre d'aparició.
  for (const fila of files) {
    if (fila.tipus) continue;
    const antic = antics.find(a => !usats.has(a.id) && normalitzarNom(a.nom) === fila.clau);
    if (antic) vincula(fila, antic, "igual");
  }

  // 2. Noms semblants. Es calculen totes les parelles candidates i es
  //    trien de la més semblant a la menys (voraç). A igual semblança,
  //    guanya la que tenia una posició més propera a la llista.
  const candidates = [];
  files.forEach((fila, i) => {
    if (fila.tipus) return;
    antics.forEach((antic, j) => {
      if (usats.has(antic.id)) return;
      const p = puntuacioSemblanca(fila.clau, normalitzarNom(antic.nom));
      if (p !== Infinity) candidates.push({ fila, antic, p, dist: Math.abs(i - j) });
    });
  });
  candidates.sort((x, y) => x.p - y.p || x.dist - y.dist);
  for (const { fila, antic } of candidates) {
    if (fila.tipus || usats.has(antic.id)) continue;
    vincula(fila, antic, "corregit");
  }

  // 3. La resta són alumnes nous.
  for (const fila of files) {
    if (!fila.tipus) fila.tipus = "nou";
  }

  const baixes = antics.filter(a => !usats.has(a.id));
  return { files, baixes };
}

/* ----------------------------------------------------------------
 * Previsualització
 * ------------------------------------------------------------- */

// Emparellaments corregits a mà a la previsualització, per al grup
// que hi ha seleccionat: { nomNormalitzat: idAntic | null }.
// Es buida en canviar de grup i després de desar.
let emparellamentsManuals = {};

function alumnesActuals() {
  const grupId = document.getElementById("selector-grup-alta").value;
  return GRUPS[grupId] ? GRUPS[grupId].alumnes : [];
}

function calcularEmparellament() {
  const noms = parsejarNoms(document.getElementById("textarea-noms").value);
  return emparellarAmbLlistaAntiga(alumnesActuals(), noms, emparellamentsManuals);
}

/**
 * Desplegable petit per corregir un emparellament: «és el mateix que
 * X» o «és un alumne nou». Només ofereix alumnes antics que no estiguin
 * ja emparellats amb un altre nom (més el que té ara, si en té).
 */
function crearSelectorEmparellament(fila, baixes) {
  const select = document.createElement("select");
  select.className = "previsualitzacio-vincle";
  select.setAttribute("aria-label", `Qui és ${fila.nom} a la llista anterior`);

  const opcioNou = document.createElement("option");
  opcioNou.value = "";
  opcioNou.textContent = "alumne nou";
  select.appendChild(opcioNou);

  const disponibles = [];
  if (fila.idAntic) disponibles.push({ id: fila.idAntic, nom: fila.nomAntic });
  for (const a of baixes) disponibles.push(a);

  for (const a of disponibles) {
    const opcio = document.createElement("option");
    opcio.value = a.id;
    opcio.textContent = `és ${a.nom}`;
    select.appendChild(opcio);
  }

  select.value = fila.idAntic || "";
  select.addEventListener("change", () => {
    emparellamentsManuals[fila.clau] = select.value || null;
    actualitzarPrevisualitzacio();
  });

  return select;
}

function actualitzarPrevisualitzacio() {
  const { files, baixes } = calcularEmparellament();
  const hiHaviaAlumnes = alumnesActuals().length > 0;

  const contenidor = document.getElementById("previsualitzacio-llista");
  const comptador = document.getElementById("previsualitzacio-comptador");
  const resumBaixes = document.getElementById("previsualitzacio-baixes");
  const botoDesa = document.getElementById("boto-desa-descarrega");
  const botoNomes = document.getElementById("boto-desa-nomes");

  contenidor.innerHTML = "";
  resumBaixes.hidden = true;
  resumBaixes.textContent = "";

  if (files.length === 0) {
    comptador.textContent = "Encara no has enganxat cap nom.";
    botoDesa.disabled = true;
    botoNomes.disabled = true;
    return;
  }

  botoDesa.disabled = false;
  botoNomes.disabled = false;

  files.forEach((fila, index) => {
    const item = document.createElement("li");
    item.className = `previsualitzacio-${fila.tipus}`;

    const text = document.createElement("span");
    text.className = "previsualitzacio-nom";
    text.textContent = `${String(index + 1).padStart(2, "0")}. ${fila.nom}`;
    item.appendChild(text);

    // En una alta de zero tots són nous: no cal cap etiqueta.
    if (hiHaviaAlumnes && fila.tipus !== "igual") {
      const etiqueta = document.createElement("span");
      etiqueta.className = "previsualitzacio-etiqueta";
      etiqueta.textContent =
        fila.tipus === "nou" ? "nou" : `abans: ${fila.nomAntic}`;
      item.appendChild(etiqueta);

      if (fila.idAntic || baixes.length > 0) {
        item.appendChild(crearSelectorEmparellament(fila, baixes));
      }
    }

    contenidor.appendChild(item);
  });

  if (!hiHaviaAlumnes) {
    comptador.textContent = `${files.length} alumnes detectats, en aquest ordre:`;
    return;
  }

  const n = tipus => files.filter(f => f.tipus === tipus).length;
  const plural = (k, u, m) => `${k} ${k === 1 ? u : m}`;
  const parts = [plural(n("igual"), "es manté", "es mantenen")];
  const corregits = n("corregit") + n("manual");
  if (corregits) parts.push(`${corregits} amb el nom corregit`);
  if (n("nou")) parts.push(plural(n("nou"), "nou", "nous"));
  if (baixes.length) parts.push(plural(baixes.length, "surt", "surten"));
  comptador.textContent = `${files.length} alumnes: ${parts.join(", ")}.`;

  if (baixes.length) {
    resumBaixes.textContent =
      "Surten del grup (i perden el seient): " +
      baixes.map(a => a.nom).join(", ") + ".";
    resumBaixes.hidden = false;
  }
}

/* ----------------------------------------------------------------
 * Aplicar l'alta
 * ------------------------------------------------------------- */

/**
 * Sufix curt (4 xifres) per als ids dels alumnes NOUS d'aquesta alta,
 * perquè no coincideixin per atzar amb cap id que ja existeixi (ni
 * d'aquesta alta ni d'una d'anterior). Si coincidissin, setup.html
 * podria mostrar com a "ja assignat" un seient d'un altre alumne.
 */
function generarSufixAlta() {
  return String(Date.now()).slice(-4);
}

function generarIdNou(grupId, posicio, idsOcupats) {
  let sufix = generarSufixAlta();
  let id = `${grupId}-${sufix}-${posicio}`;
  while (idsOcupats.has(id)) {
    sufix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    id = `${grupId}-${sufix}-${posicio}`;
  }
  idsOcupats.add(id);
  return id;
}

/**
 * Treu de seients.js els seients dels alumnes que han sortit del
 * grup, perquè aquella taula quedi lliure a setup.html. Només es
 * toquen els ids d'aquests alumnes: la resta de la distribució queda
 * exactament igual.
 */
function alliberarSeients(grupId, baixes) {
  if (typeof CONFIG_SEIENTS === "undefined" || baixes.length === 0) return;

  const idsBaixa = new Set(baixes.map(a => a.id));
  const actuals = SEIENTS[grupId] || [];
  const restants = actuals.filter(s => !idsBaixa.has(s.alumneId));

  if (restants.length !== actuals.length) {
    CONFIG_SEIENTS.desaGrup(grupId, restants);
  }
}

/**
 * Escriu la llista nova al grup seleccionat.
 *
 * - Cada alumne emparellat amb un de la llista antiga CONSERVA el seu
 *   id: així conserva el seient i els positius.
 * - Els alumnes nous reben un id nou.
 * - "numero" es regenera segons la posició (01, 02...), perquè és el
 *   número que el professor es coneix del full de qualificacions i
 *   l'utilitza el mode M2 de positius.js.
 */
function aplicarAlta() {
  const grupId = document.getElementById("selector-grup-alta").value;
  if (!GRUPS[grupId]) return false;

  const { files, baixes } = calcularEmparellament();
  if (files.length === 0) return false;

  if (baixes.length > 0) {
    const segur = confirm(
      `Aquests alumnes sortiran de ${GRUPS[grupId].nom || grupId} i perdran el seient:\n\n` +
      baixes.map(a => `  • ${a.nom}`).join("\n") +
      `\n\nSi algun d'ells només ha canviat de nom, cancel·la i ` +
      `indica-ho al desplegable de la previsualització.`
    );
    if (!segur) return false;
  }

  const idsOcupats = new Set(files.filter(f => f.idAntic).map(f => f.idAntic));

  GRUPS[grupId].alumnes = files.map((fila, index) => {
    const posicio = String(index + 1).padStart(2, "0");
    return {
      id: fila.idAntic || generarIdNou(grupId, posicio, idsOcupats),
      numero: posicio,
      nom: fila.nom
    };
  });

  if (!DADES.desa()) {
    alert(
      "No s'han pogut desar les dades en aquest navegador. Descarrega el " +
      "fitxer per no perdre la feina."
    );
  }

  alliberarSeients(grupId, baixes);

  emparellamentsManuals = {};
  actualitzarEstatGrupActual();
  actualitzarPrevisualitzacio();
  return true;
}

function desaIDescarrega() {
  if (!aplicarAlta()) return;
  const nom = DADES.descarrega();
  avisar(`Desat. S'ha descarregat ${nom} — guarda'l en lloc segur. ` +
         `Els seients dels alumnes que continuen es mantenen.`);
}

function desaNomesAqui() {
  if (!aplicarAlta()) return;
  avisar(
    "Desat en aquest navegador. Els seients dels alumnes que continuen es " +
    "mantenen. Recorda descarregar el fitxer abans de canviar d'ordinador."
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
