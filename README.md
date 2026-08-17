# pos

Gestor per assignar positius a classe, pensat per fer-se servir des del mòbil
o la tauleta mentre es fa classe: es clica (o es tecleja) sobre la disposició
real de l'aula i, al final del dia, s'exporta a Excel per enganxar-ho al full
de qualificacions.

No hi ha servidor ni base de dades: és una aplicació estàtica (HTML + JS +
CSS, sense frameworks ni build), i tot el que es desa viu al `localStorage`
del navegador.

## Índex

- [Pàgines de l'aplicació](#pàgines-de-laplicació)
- [Assignar positius: M1 (clic) i M2 (teclat)](#assignar-positius-m1-clic-i-m2-teclat)
- [El límit de 3 positius: per tram, no per dia](#el-límit-de-3-positius-per-tram-no-per-dia)
- [Exportar a Excel](#exportar-a-excel)
- [Estructura de dades i el patró "regenera i descarrega"](#estructura-de-dades-i-el-patró-regenera-i-descarrega)
- [Fitxers del projecte](#fitxers-del-projecte)
- [Com posar-ho en marxa](#com-posar-ho-en-marxa)
- [Limitacions conegudes](#limitacions-conegudes)

## Pàgines de l'aplicació

| Pàgina | Per a què serveix |
|---|---|
| `index.html` | Pantalla principal: graella de l'aula, assignar positius, exportar. |
| `alta.html` | Donar d'alta o reemplaçar la llista d'alumnes d'un grup. |
| `setup.html` | Assignar quin alumne seu a quina taula/costat. |
| `horari.html` | Enganxar l'horari oficial del centre (copiat des d'un Excel) perquè l'app sàpiga quin grup toca a cada hora. |

Totes quatre comparteixen la mateixa base de dades (`alumnes.js`,
`seients.js`, `horari.js`) i es naveguen entre elles amb els enllaços de la
capçalera.

## Assignar positius: M1 (clic) i M2 (teclat)

Hi ha dues maneres complementàries d'assignar un positiu a un alumne,
seleccionables amb un interruptor a la capçalera de `index.html`. **Només
una està activa alhora**: activar M2 desactiva M1, i viceversa. En carregar
la pàgina, sempre es comença en M1.

**M1 — clic a la taula (mode per defecte)**
Cada taula de la graella mostra dos alumnes (un a cada costat). Un clic
suma un positiu; un clic dret en resta un (per corregir un clic per error).

**M2 — teclat, sense clicar ni prémer Intro**
Pensat per quan el professor es coneix de memòria el número de cada
alumne (la seva posició al full de qualificacions: `01`, `02`... `30`).
Amb M2 activa, escriure els dos dígits del número —per exemple `1` i
`7`— assigna l'instant un positiu a l'alumne número 17 del grup que es
veu en pantalla, sense necessitat de prémer Intro ni clicar cap botó
("estil MS-DOS"). Per això els números de l'1 al 9 s'escriuen sempre amb
zero davant (`01`, `02`...): el sistema necessita rebre sempre dos dígits
per saber que el codi ja està complet.

Un indicador petit, al costat de l'interruptor, mostra l'estat de M2 en
tot moment:
- buit → esperant el primer dígit
- `1…` → el primer dígit s'ha rebut, esperant el segon
- el nom de l'alumne, en verd, un instant → codi reconegut i positiu
  assignat
- `35 no trobat`, en vermell → cap alumne del grup té aquest número

Després d'un codi complet, el teclat de M2 queda momentàniament
"pausat" abans de tornar a acceptar entrada: **0.4 segons** si el codi ha
trobat un alumne, o **2 segons sencers** si no n'ha trobat cap (perquè
l'error es noti abans de poder-ne teclejar un altre). Mentre el focus
estigui dins d'un desplegable, una casella de text o un camp de cerca,
M2 ignora el teclat per no interferir amb l'ús normal d'aquests controls.

Els positius assignats per M2 compten exactament igual que els de M1:
mateix límit, mateix desat, mateixa exportació — l'exportació no distingeix
per quin dels dos mètodes s'ha arribat a cada positiu.

## El límit de 3 positius: per tram, no per dia

`MAX_POSITIUS_DIA` (a `horari.js`) val 3 per defecte, però el nom és una
mica enganyós: el límit s'aplica **per tram horari** (dia + hora concrets),
no per dia sencer. Si un mateix grup té classe amb el mateix professor dues
vegades en un dia, cada hora té el seu propi comptador independent de 0 a
3 — no se sumen entre elles.

## Exportar a Excel

El bloc "Baixada" d'`index.html` no genera un `.csv`, sinó un fitxer
**`.xlsx` d'Excel real** (via la llibreria [SheetJS], carregada des d'un
CDN a `index.html`), amb dues columnes: `Alumne` i `Positius`. S'exporta
**un tram a la vegada**: es tria dia + hora en un desplegable i es baixa
aquest full — no hi ha un botó d'"exporta-ho tot" de cop. El nom del
fitxer descarregat inclou el grup i el tram, per no confondre'l amb el
d'una altra hora.

[SheetJS]: https://sheetjs.com/

## Estructura de dades i el patró "regenera i descarrega"

Com que no hi ha backend, `alta.html` i `setup.html` no "guarden" els
canvis enlloc: en comptes d'això, **regeneren el fitxer de dades sencer
(`alumnes.js` o `seients.js`) com a text i el descarreguen**, i és el
professor qui l'ha de desar manualment sobre el fitxer del mateix nom
dins la carpeta del projecte, substituint-lo. És per això que cal tornar
a obrir el projecte des d'un servidor local després de fer canvis (vegeu
[Com posar-ho en marxa](#com-posar-ho-en-marxa)): la pàgina llegeix el seu
propi fitxer de dades amb `fetch` per saber què ha de regenerar.

Cada alumne, a `alumnes.js`, té tres camps:

```js
{ id: "1ESOA-7042-01", numero: "01", nom: "Martina" }
```

- **`id`**: identificador intern, estable dins d'una mateixa alta però
  que canvia si es torna a donar d'alta el grup (porta un sufix únic de
  cada alta, per no col·lidir mai amb l'anterior). El fan servir
  `seients.js` i les dades de positius desades.
- **`numero`**: cadena de dues xifres (`"01"`–`"30"`), la posició de
  l'alumne dins la llista tal com el professor se la sap de memòria.
  A diferència de l'`id`, **mai canvia de forma imprevisible**: sempre
  és la posició (01, 02...) en l'ordre en què s'han enganxat els noms.
  És el número que fa servir M2.
- **`nom`**: només el nom de pila (mai el cognom), tal com es mostra a
  la graella.

**Conseqüència pràctica important:** si es torna a donar d'alta un grup
(nova llista d'alumnes des d'`alta.html`), els `id` canvien i, per tant,
**cal tornar a fer `setup.html`** per assignar seients de nou — les
assignacions antigues queden òrfenes silenciosament (l'alumne simplement
apareix com a "sense seient assignat", sense donar error).

## Fitxers del projecte

| Fitxer | Contingut |
|---|---|
| `alumnes.js` | Dades: grups i llistat d'alumnes (`id`, `numero`, `nom`). Es regenera des d'`alta.html`. |
| `seients.js` | Dades: disposició de l'aula i quin alumne seu on. Es regenera des de `setup.html`. |
| `horari.js` | Dades: horari del centre i `MAX_POSITIUS_DIA`. Es regenera des de `horari.html`. |
| `positius.js` | Lògica principal: graella, positius (M1 i M2), trams horaris. |
| `alta.js` | Lògica de `alta.html`. |
| `setup.js` | Lògica de `setup.html`. |
| `horari-app.js` | Lògica de `horari.html` (enganxar l'horari des de l'Excel del centre, amb detecció de capçalera i coincidència aproximada de noms de grup). |
| `exportar.js` | Genera i descarrega el `.xlsx` de positius per tram. |
| `index.html`, `alta.html`, `setup.html`, `horari.html` | Les quatre pàgines. |
| `style.css`, `alta.css`, `setup.css`, `horari.css` | Estils, un full per pàgina més els estils compartits a `style.css`. |
| `config.js` | **No es fa servir enlloc.** Cap pàgina el carrega — sembla una primera versió de la configuració (amb grups `"1A"`/`"2B"`, diferents dels grups reals `1ESOA`/`1ESOB`/`4ESO`) que va quedar obsoleta però mai es va esborrar. Es manté al repositori per si es vol recuperar-ne alguna cosa, però no té cap efecte sobre l'aplicació. |

## Com posar-ho en marxa

Com que `alta.js` i `setup.js` fan `fetch` del propi fitxer de dades per
poder regenerar-lo, **cal servir els fitxers des d'un servidor local**
(obrir `index.html` directament amb doble clic no funcionarà per aquestes
dues pàgines, per les restriccions de `fetch` sobre `file://`). Per
exemple, des de la carpeta del projecte:

```
python3 -m http.server 8000
```

i obrir `http://localhost:8000/index.html` al navegador.

## Limitacions conegudes

- **Tot es desa al `localStorage` del navegador**: no hi ha núvol ni
  sincronització entre dispositius. Canviar de navegador, d'ordinador, o
  esborrar dades de navegació esborra els positius no exportats.
- Els positius s'exporten **un tram a la vegada**, no tots de cop.
- Reassignar un grup a `alta.html` **desfà les assignacions de seients**
  d'aquell grup (vegeu més amunt).
- `config.js` és mort i no s'ha d'editar esperant que faci res.
