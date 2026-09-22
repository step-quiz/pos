# pos

Gestor per assignar positius i negatius a classe, pensat per fer-se servir
des d'un ordinador portàtil amb ratolí mentre es fa classe: es clica (o es
tecleja) sobre la disposició real de l'aula i, al final del dia, s'exporta
a Excel per enganxar-ho al full de qualificacions.

No hi ha servidor ni base de dades: és una aplicació estàtica (HTML + JS +
CSS, sense frameworks ni build), i tot el que es desa viu al `localStorage`
del navegador.

## Índex

- [Pàgines de l'aplicació](#pàgines-de-laplicació)
- [Assignar positius i negatius: M1 (clic) i M2 (teclat)](#assignar-positius-i-negatius-m1-clic-i-m2-teclat)
- [Assignar seients: clic o arrossegar](#assignar-seients-clic-o-arrossegar)
- [El límit per tram: entre -4 i +3, no per dia](#el-límit-per-tram-entre--4-i-3-no-per-dia)
- [Consultar i corregir dies passats](#consultar-i-corregir-dies-passats)
- [Exportar a Excel](#exportar-a-excel)
- [On es guarden les dades](#on-es-guarden-les-dades)
- [Identificadors d'alumne](#identificadors-dalumne)
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

Totes quatre comparteixen les mateixes dades, desades al navegador
(llistes d'alumnat, seients i horari), i es naveguen entre elles amb els
enllaços de la capçalera. Vegeu
[On es guarden les dades](#on-es-guarden-les-dades).

## Assignar positius i negatius: M1 (clic) i M2 (teclat)

La graella d'`index.html` no porta cap text d'ajuda: els dos modes i els
límits estan documentats aquí, i la pantalla queda per a la feina. El grup
que toca ara es marca amb un punt (●) al selector de grups.

A la graella d'`index.html`, cada targeta porta el **número de llista**
davant del nom (`05. Mohamed`). En M2 és exactament el codi que s'ha de
teclejar, i per això allà es ressalta en blau; en M1 serveix igualment
per localitzar l'alumne a la llista de classe. El número es mostra tal
com està desat, amb les dues xifres, perquè M2 espera sempre dos dígits.

A `setup.html` els números hi surten igualment: als seients, a les fitxes
de la banqueta i al desplegable d'assignació. Amb només el nom de pila
costava de casar cada fitxa amb la llista de classe.

El comptador de cada targeta dibuixa els símbols un per un (`+++ -`)
mentre en caben; a partir de sis passa a la forma compacta (`7+ 3-`).
Com que el límit per tram és sobre el valor i no sobre el nombre de
símbols, acumulacions com 7 positius i 3 negatius (valor +1) són
possibles i abans se sortien de la targeta.

Hi ha dues maneres complementàries d'assignar un positiu o un negatiu a un
alumne, seleccionables amb un interruptor a la capçalera de `index.html`.
**Només una està activa alhora**: activar M2 desactiva M1, i viceversa. En
carregar la pàgina, sempre es comença en M1.

Un negatiu compta el doble que un positiu en sentit contrari (vegeu
`PES_NEGATIU` a `horari.js`): per exemple, tres positius i un negatiu
(`+++-`) donen un valor final de `3 - (2×1) = +1`; dos negatius sols
(`--`) donen `-4`.

**M1 — clic a la taula (mode per defecte)**
Cada taula de la graella mostra dos alumnes (un a cada costat). Cada botó
del ratolí és sempre per a un tipus, i Ctrl amb el mateix botó sempre vol
dir "desfés" (per corregir un clic per error):
- **Botó esquerre**: suma un positiu. **Ctrl+clic esquerre**: en resta un.
- **Botó dret**: suma un negatiu. **Ctrl+clic dret**: en resta un.

**M2 — teclat, sense clicar ni prémer Intro**
Pensat per quan el professor es coneix de memòria el número de cada
alumne (la seva posició al full de qualificacions: `01`, `02`... `30`).
Amb M2 activa, escriure els dos dígits del número —per exemple `1` i
`7`— assigna a l'instant un positiu a l'alumne número 17 del grup que es
veu en pantalla, sense necessitat de prémer Intro ni clicar cap botó
("estil MS-DOS"). Per això els números de l'1 al 9 s'escriuen sempre amb
zero davant (`01`, `02`...): el sistema necessita rebre sempre dos dígits
per saber que el codi ja està complet.

Per assignar un **negatiu** per teclat, es prem la tecla `-` abans
d'escriure els dos dígits (per exemple `-`, `1`, `7`): el pròxim codi
complet s'aplica com a negatiu en comptes de positiu. Prement `-` una
segona vegada, encara sense cap dígit escrit, es desfà (torna a mode
positiu). Un cop resolt un codi (trobat o no), sempre es torna a mode
positiu per al següent.

Un indicador petit, al costat de l'interruptor, mostra l'estat de M2 en
tot moment:
- buit → esperant el primer dígit (`-` → esperant el primer dígit d'un
  negatiu)
- `1…` → el primer dígit s'ha rebut, esperant el segon (`-1…` si és un
  negatiu)
- el nom de l'alumne, un instant → codi reconegut i positiu (en verd) o
  negatiu (en un altre color) assignat
- `35 no trobat`, en ambre → cap alumne del grup té aquest número

Després d'un codi complet, el teclat de M2 queda momentàniament
"pausat" abans de tornar a acceptar entrada: **0.4 segons** si el codi ha
trobat un alumne, o **2 segons sencers** si no n'ha trobat cap (perquè
l'error es noti abans de poder-ne teclejar un altre) — igual per
positius que per negatius. Mentre el focus estigui dins d'un
desplegable, una casella de text o un camp de cerca, M2 ignora el
teclat per no interferir amb l'ús normal d'aquests controls.

A cada targeta es veuen sempre dos grups de símbols per separat —els
positius en verd, els negatius en un altre color—, mai barrejats per
ordre d'entrada, només agrupats per tipus (per exemple, `+++` i, a
part, `- -`).

Els positius i negatius assignats per M2 compten exactament igual que
els de M1: mateix límit, mateix desat, mateixa exportació — l'exportació
no distingeix per quin dels dos mètodes s'ha arribat a cada valor.

## Assignar seients: clic o arrossegar

A `setup.html` hi ha dues maneres de decidir qui seu on. **No cal
triar-ne cap**: totes dues estan sempre actives i es poden barrejar
lliurement dins la mateixa sessió, perquè escriuen sobre les mateixes
assignacions.

**Clic a la taula**
Es clica un seient i s'obre un desplegable amb els alumnes que encara no
seuen enlloc (i, a dalt de tot, `— Seient buit —` per alliberar-lo).
Còmode per a canvis puntuals i quan se sap exactament quin nom es busca.

**Arrossegar i deixar anar (ratolí)**
Sota la graella hi ha la **banqueta**: una fila de fitxes amb els
alumnes que encara no tenen seient. Des d'allà:

- **Banqueta → taula**: arrossegar un nom fins a una taula l'hi asseu.
  Si la taula ja estava ocupada, qui hi seia torna a la banqueta.
- **Taula → banqueta**: arrossegar un alumne assignat fins a la banqueta
  li allibera el lloc i el deixa pendent altra vegada.
- **Taula → taula**: si la taula de destí és buida, l'alumne s'hi mou;
  si està ocupada, **els dos alumnes s'intercanvien el lloc** (útil per
  separar o ajuntar parelles sense haver de buidar res primer).

Per fer una distribució nova de zero, el botó **Buida l'aula** (al costat
de la banqueta) treu de cop tots els alumnes del grup del seu lloc i els
hi torna, sense haver-los d'anar arrossegant un per un. Només afecta el
grup que estiguis editant.

Cada canvi queda desat al navegador immediatament: no cal descarregar res
per no perdre la feina.

Mentre es porta un alumne pel damunt, les taules lliures es marquen en
blau i la banqueta en ambre, per veure d'un cop d'ull on es pot deixar
anar. Si es deixa anar fora de qualsevol diana (per exemple, al marge),
no passa res i tot queda com estava.

Està pensat per a **ratolí**: fa servir l'arrossegament natiu del
navegador i no s'ha preparat per a pantalles tàctils. En una tauleta o
un mòbil, cal fer servir el clic i el desplegable.

## El límit per tram: entre -4 i +3, no per dia

`MAX_POSITIUS_DIA` i `VALOR_MINIM_TRAM` (a `horari.js`) valen `3` i `-4`
per defecte, però els noms són una mica enganyosos: el límit s'aplica
**per tram horari** (dia + hora concrets), no per dia sencer. Si un mateix
grup té classe amb el mateix professor dues vegades en un dia, cada hora
té el seu propi comptador independent — no se sumen entre elles.

El que es limita és el **valor combinat** d'un alumne en aquell tram
(positius menys el doble dels negatius, vegeu la secció anterior), no els
comptadors de positius i negatius per separat: es pot arribar a tenir més
de 3 positius o més de 4 negatius en un mateix tram, sempre que el valor
final es mantingui entre -4 i +3. Per exemple, amb el valor ja al mínim
(-4), calen **dos** positius de marge —no n'hi ha prou amb un— abans que
es pugui afegir un negatiu més sense sortir del rang.

## Consultar i corregir dies passats

A la capçalera de la graella hi ha un selector de **dia** i de **franja
horària**. Per defecte marquen avui i la primera classe que l'horari
digui d'aquest grup, i llavors tot funciona com sempre. Movent-lo cap
enrere, la graella passa a mostrar els positius d'aquell tram, i **els
clics i les tecles hi escriuen a sobre**: serveix tant per repassar què
vas posar el dia 10 com per corregir un positiu que vas apuntar per
error.

Mentre no s'estigui mirant el dia d'avui, la targeta de la graella es
marca en ambre i hi surt un avís explícit a dalt, perquè el risc real
d'aquesta funció és apuntar positius al dia equivocat sense adonar-se'n.
El botó **Avui** torna al tram d'ara en un clic. Cap endavant no s'hi pot
anar: el camp de data té el topall a avui.

El desplegable de franges mostra, per al dia triat:

- les hores que l'horari diu que hi havia classe d'aquest grup,
- qualsevol hora que ja tingui dades desades encara que l'horari actual
  no la prevegi (per exemple, perquè l'horari ha canviat des de llavors),
- i sempre `fora d'horari`, que és on van a parar els positius posats un
  dia sense classe.

Les franges que ja tenen alguna cosa escrita es marquen amb un ✓. Això
també resol el cas d'un grup amb **dues classes el mateix dia**: per
defecte s'escriu a la primera, però es pot triar la segona a mà.

El selector de baixada s'hi sincronitza: si estàs mirant el dia 10, el
botó d'Excel ja apunta a aquell tram.

## Exportar a Excel

El bloc "Baixada" d'`index.html` no genera un `.csv`, sinó un fitxer
**`.xlsx` d'Excel real** (via la llibreria [SheetJS], carregada des d'un
CDN a `index.html`), amb dues columnes: `Alumne` i `Positius`. Aquesta
segona columna porta el **valor net** de l'alumne en aquell tram
(positius menys el doble dels negatius) — el número final a punt
d'enganxar al full de qualificacions, no el desglossament de positius i
negatius per separat. S'exporta **un tram a la vegada**: es tria dia +
hora en un desplegable i es baixa aquest full — no hi ha un botó
d'"exporta-ho tot" de cop. El nom del fitxer descarregat inclou el grup i
el tram, per no confondre'l amb el d'una altra hora.

[SheetJS]: https://sheetjs.com/

## On es guarden les dades

No hi ha backend. **Les tres coses que canvien cada curs es desen al
`localStorage` d'aquest navegador**, cadascuna amb el seu carregador:

| Què | Carregador | Clau | On es crea |
|---|---|---|---|
| Llistes d'alumnat | `dades.js` | `pos-docent-v1` | `alta.html` |
| Qui seu on | `seients.js` | `pos-seients-v1` | `setup.html` |
| Horari del curs | `horari.js` | `pos-horari-v1` | `horari.html` |

Els tres fitxers `.js` del repositori **no contenen les teves dades**:
són només el codi que les carrega, les valida, les desa i les deixa
exportar. Cadascun busca, per ordre: un fitxer teu carregat amb
`<script src>`, el que hi hagi desat al navegador, i finalment unes
dades d'exemple.

**Desar és automàtic.** `setup.html` desa a cada canvi de seient i
`horari.html` desa quan cliques «Desa aquest horari». No cal descarregar
res per treballar del dia a dia: canvia de pestanya, tanca el navegador
o apaga l'ordinador i ho retrobaràs igual.

**Descarregar és la còpia de seguretat.** Cada pàgina té un botó que
genera un fitxer (`els-meus-seients.js`, `el-meu-horari.js`, el teu
`profdani.js`) i un altre per tornar-lo a carregar. Serveix per passar
la configuració a un altre ordinador, o per recuperar-la si esborres les
dades de navegació. Aquests fitxers es poden llegir i editar a mà, però
són generats: el format normal és crear-los des de l'aplicació. La
descàrrega està sempre disponible, encara que la configuració estigui a
mitges.

**També s'accepten els fitxers antics.** Un `seients.js`, `horari.js` o
`alumnes.js` d'una versió anterior (dels que declaraven `const SEIENTS =
{...}`) es pot carregar directament, sense convertir-lo a mà. Els
carregadors executen el fitxer dins d'un `new Function` i n'agafen tant
el format nou (`window.SEIENTS_FITXER`) com el vell. Mentre el
llegeixen, amaguen els seus propis globals, perquè si no un fitxer que
no toqués semblaria vàlid i "importaria" el que ja hi havia carregat.

Importar no recarrega la pàgina: el carregador torna a publicar
`SEIENTS` / `HORARI` i la pàgina es repinta sola.

Si treballes amb una còpia local del projecte, també pots deixar els
fitxers al costat de l'`index.html` i carregar-los amb una etiqueta
`<script src="els-meus-seients.js">`: llavors manen sobre el que hi hagi
desat al navegador.

En un **ordinador compartit**, recorda «Oblida-ho aquí» (a baix a la
dreta) quan acabis.

## Identificadors d'alumne

Cada alumne té tres camps:

```js
{ id: "1ESOA-7042-01", numero: "01", nom: "Martina" }
```

- **`id`**: identificador intern i estable. El fan servir `seients.js`
  i les dades de positius desades. Quan es torna a donar d'alta un grup,
  cada alumne que continua a la llista **conserva el seu `id`** (vegeu
  més avall); només els alumnes nous en reben un de nou, amb un sufix
  que no col·lideix mai amb cap `id` existent.
- **`numero`**: cadena de dues xifres (`"01"`–`"30"`), la posició de
  l'alumne dins la llista tal com el professor se la sap de memòria.
  A diferència de l'`id`, **mai canvia de forma imprevisible**: sempre
  és la posició (01, 02...) en l'ordre en què s'han enganxat els noms.
  És el número que fa servir M2.
- **`nom`**: només el nom de pila (mai el cognom), tal com es mostra a
  la graella.

**Tornar a donar d'alta un grup no desfà el Setup.** A `alta.html`,
cada nom de la llista nova s'emparella amb un alumne de l'antiga:

1. mateix nom (sense comptar majúscules, accents ni espais) → es manté;
2. nom molt semblant (una o dues lletres de diferència, o «Maria» →
   «Maria José») → es considera una correcció del nom;
3. res semblant → alumne nou.

La previsualització marca cada cas («abans: Martna», «nou») i, amb un
desplegable, deixa corregir l'emparellament a mà (per exemple «Pep» →
«Josep»). Els alumnes emparellats conserven `id`, seient i positius; el
`numero` es recalcula segons la nova posició. Els que no s'emparellen
amb ningú surten del grup (es demana confirmació) i el seu seient queda
lliure. Després només cal passar per `setup.html` per seure els nous.

## Fitxers del projecte

| Fitxer | Contingut |
|---|---|
| `dades.js` | Carregador de les llistes d'alumnat: les llegeix del teu fitxer o del navegador i publica `GRUPS`. |
| `seients.js` | Carregador de la disposició de l'aula: publica `DISPOSICIO_AULA` i `SEIENTS`, i exposa `CONFIG_SEIENTS` per desar, importar i exportar. Conté una distribució d'exemple com a alternativa. |
| `horari.js` | Carregador de l'horari: publica `HORARI` i exposa `CONFIG_HORARI`. També hi viuen les constants del centre (`FRANGES_HORARIES`, `MAX_POSITIUS_DIA`, `VALOR_MINIM_TRAM`, `PES_NEGATIU`), que sí que es toquen a mà. |
| `positius.js` | Lògica principal: graella, positius i negatius (M1 i M2), trams horaris. |
| `alta.js` | Lògica de `alta.html`. |
| `setup.js` | Lògica de `setup.html`. |
| `horari-app.js` | Lògica de `horari.html` (enganxar l'horari des de l'Excel del centre, amb detecció de capçalera i coincidència aproximada de noms de grup). |
| `exportar.js` | Genera i descarrega el `.xlsx` de positius per tram. |
| `index.html`, `alta.html`, `setup.html`, `horari.html` | Les quatre pàgines. |
| `style.css`, `alta.css`, `setup.css`, `horari.css` | Estils, un full per pàgina més els estils compartits a `style.css`. |
| `config.js` | **No es fa servir enlloc.** Cap pàgina el carrega — sembla una primera versió de la configuració (amb grups `"1A"`/`"2B"`, diferents dels grups reals `1ESOA`/`1ESOB`/`4ESO`) que va quedar obsoleta però mai es va esborrar. Es manté al repositori per si es vol recuperar-ne alguna cosa, però no té cap efecte sobre l'aplicació. |

## Com posar-ho en marxa

Cap pàgina fa `fetch` de res: tot es llegeix del navegador o dels fitxers
que hi carregues, així que obrir `index.html` amb doble clic hauria de
funcionar. Si t'hi falla la càrrega d'un fitxer (alguns navegadors
restringeixen què es pot executar des de `file://`), serveix la carpeta
per http:

```
python3 -m http.server 8000
```

i obre `http://localhost:8000/index.html`.

La primera vegada, l'ordre és: **Alta** (crea o carrega les llistes
d'alumnat) → **Horari** (enganxa la graella de l'Excel i desa-la) →
**Setup** (decideix qui seu on) → **Positius** (el dia a dia). A partir
d'aquí ja no cal tornar-hi si no canvia res.

## Limitacions conegudes

- **Tot es desa al `localStorage` del navegador**: no hi ha núvol ni
  sincronització entre dispositius. Canviar de navegador, d'ordinador, o
  esborrar dades de navegació esborra els positius no exportats i la
  configuració que no hagis descarregat com a còpia de seguretat.
- Els positius s'exporten **un tram a la vegada**, no tots de cop.
- Reassignar un grup a `alta.html` **desfà les assignacions de seients**
  d'aquell grup (vegeu més amunt).
- `config.js` és mort i no s'ha d'editar esperant que faci res.

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
