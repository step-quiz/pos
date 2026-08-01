/**
 * exportar.js
 * ---------------------------------------------------------------
 * Genera i descarrega un fitxer .xlsx amb els positius d'UN sol
 * tram horari (un dia + una hora concrets) d'un grup, perquè es
 * pugui enganxar directament com una columna més al full de càlcul
 * real del professor.
 *
 * Fa servir la llibreria SheetJS (xlsx), carregada des d'un CDN a
 * index.html. Tota la generació passa al navegador: no hi ha cap
 * servidor ni s'envien dades enlloc.
 *
 * Depèn de config.js (GRUPS, HORARI) i de positius.js (dades,
 * tramsAmbDades, crearTramId, descompondreTramId, positiusDelTram).
 * ---------------------------------------------------------------
 */

/**
 * Omple el selector "Dia i hora a exportar" amb tots els trams que
 * tenen algun positiu registrat per al grup indicat, el més recent
 * primer. Es crida cada vegada que es canvia de grup a la pantalla
 * principal (vegeu mostrarGrup a positius.js).
 */
function actualitzarSelectorExportacio(grupId) {
  const selector = document.getElementById("selector-tram-exportar");
  const boto = document.getElementById("boto-exportar");
  if (!selector || !boto) return; // exportar.js carregat sense el bloc HTML

  const trams = tramsAmbDades(grupId).slice().reverse(); // més recent primer
  selector.innerHTML = "";

  if (trams.length === 0) {
    const opcio = document.createElement("option");
    opcio.textContent = "Encara no hi ha positius per exportar";
    opcio.disabled = true;
    selector.appendChild(opcio);
    selector.disabled = true;
    boto.disabled = true;
    return;
  }

  for (const tram of trams) {
    const opcio = document.createElement("option");
    opcio.value = tram;
    opcio.textContent = formatarTramLlarg(tram);
    selector.appendChild(opcio);
  }

  selector.disabled = false;
  boto.disabled = false;
}

/**
 * Text llarg per al selector: "dissabte 1 d'agost — 1a hora (8:00–8:55)".
 */
function formatarTramLlarg(tramId) {
  const { dataISO, hora } = descompondreTramId(tramId);
  const [y, m, d] = dataISO.split("-").map(Number);
  const dataLlegible = new Date(y, m - 1, d).toLocaleDateString("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return `${dataLlegible} — ${hora}`;
}

/**
 * Construeix les files de la columna a exportar: una fila per
 * alumne, en el mateix ordre que a config.js, amb el seu nombre de
 * positius en aquest tram concret.
 */
function construirFilesExportacio(grupId, tramId) {
  const grup = GRUPS[grupId];
  return grup.alumnes.map(alumne => ({
    Alumne: alumne.nom,
    Positius: positiusDelTram(grupId, alumne.id, tramId)
  }));
}

/**
 * Genera el fitxer .xlsx del tram seleccionat i en dispara la
 * descàrrega al navegador.
 */
function exportarTramAXlsx() {
  const selector = document.getElementById("selector-tram-exportar");
  const tramId = selector.value;
  if (!tramId || !grupActiu) return;

  const files = construirFilesExportacio(grupActiu, tramId);

  const fullDeCalcul = XLSX.utils.json_to_sheet(files);
  fullDeCalcul["!cols"] = [{ wch: 18 }, { wch: 10 }]; // amplada llegible

  const llibre = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(llibre, fullDeCalcul, "Positius");

  const { dataISO, hora } = descompondreTramId(tramId);
  const horaPerNomFitxer = hora.replace(/[^\w-]+/g, "_");
  const nomFitxer = `positius_${GRUPS[grupActiu].nom}_${dataISO}_${horaPerNomFitxer}.xlsx`
    .replace(/\s+/g, "_");

  XLSX.writeFile(llibre, nomFitxer);
}

function inicialitzarExportacio() {
  const boto = document.getElementById("boto-exportar");
  if (!boto) return;
  boto.addEventListener("click", exportarTramAXlsx);
}

document.addEventListener("DOMContentLoaded", inicialitzarExportacio);
