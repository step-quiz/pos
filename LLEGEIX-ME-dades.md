# Les llistes de classe ja no són al repositori

Fins ara els noms de l'alumnat eren a `alumnes.js`, dins del projecte. Amb el repositori públic això vol dir publicar-los, i el nom de pila més el grup més el centre ja identifica una persona.

Ara viuen en un fitxer teu, fora del projecte, que carregues des de la pàgina.

---

## Què ha canviat, en una taula

| Abans | Ara |
|---|---|
| `alumnes.js` dins del repositori | `profdani.js` al teu ordinador o al teu Drive |
| Un fitxer per curs, commitejat | Un fitxer per docent i curs, mai commitejat |
| Els noms es publicaven amb la web | Els noms no surten mai del teu navegador |
| `alta.html` descarregava `alumnes.js` per substituir-lo | `alta.html` desa al navegador i descarrega el teu fitxer |

`alumnes.js` ha desaparegut. El substitueix `dades.js`, que defineix `GRUPS` exactament amb la mateixa forma. **`positius.js`, `setup.js`, `seients.js`, `exportar.js`, `horari.js` i `horari-app.js` no s'han hagut de tocar**, més enllà d'actualitzar-ne els comentaris de capçalera.

---

## El primer dia

1. Obre `index.html`. Com que no hi ha cap fitxer carregat, surt la pantalla de càrrega.
2. Clica **Comença de zero**. Et porta a `alta.html`.
3. Escriu-hi el teu nom i el curs. Amb això el fitxer es dirà `profdani-2627.js`.
4. Crea el primer grup amb **+ Grup nou…**: l'identificador (`1ESOA`) i com vols que es vegi (`1r ESO A`).
5. Enganxa els noms del full de qualificacions, un per línia.
6. **Desa i descarrega.** Guarda el fitxer on el puguis tornar a trobar.
7. Repeteix des del pas 4 per a cada grup. Tots van al mateix fitxer.

Després, `horari.html` per a l'horari i `setup.html` per als seients. Aquests dos també han passat al mateix model que `dades.js`: la configuració es desa al navegador (`pos-seients-v1`, `pos-horari-v1`) i els fitxers `seients.js` i `horari.js` del repositori ja només són els carregadors. Vegeu la secció "On es guarden les dades" del README. Els tres carregadors accepten també els fitxers del format antic (`const GRUPS`, `const SEIENTS`, `const HORARI`), de manera que un `alumnes.js` d'abans es pot carregar tal qual, sense convertir-lo.

## Els altres dies

No has de fer res. Les dades queden al navegador i la pàgina s'obre directament.

## En un altre ordinador

Obre la pàgina, **Tria el fitxer…**, i tries el teu `profdani-2627.js`. Un cop per ordinador.

## En un ordinador compartit

A baix a la dreta hi ha **Oblida-ho aquí**. Esborra les llistes d'aquell navegador. El teu fitxer no es toca.

---

## El fitxer

Un sol fitxer amb tots els teus grups:

```js
window.DOCENT = {
  format: 1,
  docent: 'Dani',
  curs: '2026-27',
  actualitzat: '2026-09-05',
  grups: {
    '1ESOA': { nom: '1r ESO A', alumnes: [ … ] },
    '1ESOB': { nom: '1r ESO B', alumnes: [ … ] },
    '4ESO':  { nom: '4t ESO',   alumnes: [ … ] }
  }
};
```

`docent` i `curs` no els fa servir l'aplicació. Serveixen perquè puguis distingir tres fitxers a la carpeta de baixades, i decideixen com es dirà el que generis.

Cada alumne té els mateixos tres camps de sempre: `id` (identificador estable, no el toquis a mà — els seients hi estan lligats), `numero` (dues xifres, el que teclejes al mode M2) i `nom` (només el nom de pila).

**Per què `.js` i no `.json`:** perquè així també el pots deixar al costat de l'`index.html` i carregar-lo amb `<script src="profdani.js">`, sense passar per la pantalla de càrrega. Útil si treballes amb una còpia local del projecte. Si hi és, mana sobre el que hi hagi desat al navegador.

---

## Convertir el teu `alumnes.js` d'ara

Si tens un `alumnes.js` amb dades que vols conservar, obre'l al navegador amb la consola (F12) i executa-hi això. Descarrega el fitxer nou i importa'l.

```js
copy('window.DOCENT = ' + JSON.stringify({
  format: 1,
  docent: 'Dani',
  curs: '2026-27',
  actualitzat: new Date().toISOString().slice(0,10),
  grups: GRUPS
}, null, 2) + ';');
```

Enganxa el que hagi quedat al porta-retalls en un fitxer de text i desa'l com a `profdani-2627.js`.

---

## Dues coses que han millorat de retruc

**`alta.html` ja no necessita servidor.** Abans llegia `alumnes.js` amb `fetch()` i hi substituïa el bloc del grup amb una expressió regular, cosa que obligava a servir el projecte per http i es trencava si algú havia retocat el format del fitxer. Ara el fitxer es genera des de l'objecte que ja hi ha a memòria: funciona igual obrint la pàgina amb doble clic.

**Els grups ja no estan escrits al codi.** `alta.js` tenia `GRUPS_DISPONIBLES = ["1ESOA", "1ESOB", "4ESO"]`. Per tenir grups diferents calia editar el fitxer. Ara la llista surt de les teves dades i hi ha un **+ Grup nou…** al selector.

---

## Comprovat

He passat 34 comprovacions automàtiques sobre les pàgines reals amb jsdom, i totes passen:

- `GRUPS` té la mateixa forma que tenia amb `alumnes.js`, i `positius.js` omple el selector i pinta el títol sense cap canvi.
- El fitxer generat es torna a llegir i conserva ids, números i noms exactament (comparació byte a byte de l'estructura).
- En tornar a donar d'alta un grup, els alumnes que continuen (encara que se'ls corregeixi el nom o canviïn de posició) conserven l'id i, per tant, el seient i els positius. Només els alumnes nous reben id nou, amb un sufix que no repeteix cap id existent.
- La previsualització neteja línies buides i columnes de més enganxades del full de càlcul.
- Es rebutgen amb un missatge clar: un `alumnes.js` antic, un fitxer sense grups i un fitxer amb un alumne incomplet.
- Sense dades, l'aplicació espera en comptes de petar. `dades.js` atura la inicialització de la resta amb `stopImmediatePropagation()`, per no haver de posar comprovacions a cinc fitxers.

---

## Pendent, quan vulguis

**`config.js` és codi mort.** Cap HTML el carrega, i declara `GRUPS`, `DISPOSICIO_AULA`, `HORARI` i `MAX_POSITIUS_DIA` duplicant el que ja hi ha a `dades.js`, `seients.js` i `horari.js`. És el mateix cas que l'`auth.js` de `m`. Val més esborrar-lo: si algun dia algú l'afegeix a un HTML, el seu `const GRUPS` taparia el de `dades.js` i costaria d'entendre per què l'aplicació ignora el fitxer carregat.

**El peu de `index.html`** encara diu «Prototip amb dades inventades — cap alumne ni horari reals». Quan hi posis dades de debò, canvia'l.

**L'historial.** `pos` és privat ara. Si algun dia el tornes a fer públic, recorda que les dades d'abans són a tots els commits anteriors: convé publicar-lo com a repositori nou sense historial, no reobrir aquest.
