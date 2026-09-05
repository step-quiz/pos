/**
 * profdani.js  ──  Llistes de classe d'un docent
 * ═══════════════════════════════════════════════════════════════════
 *
 * AQUEST FITXER NO VA MAI AL REPOSITORI.
 *
 * Conté els noms de l'alumnat de tots els grups que porta un docent.
 * Es guarda al teu ordinador, o al teu Drive del centre, i s'importa
 * des de la pàgina amb el botó «Carrega les meves classes».
 *
 * Un fitxer per docent i curs. Si l'any que ve tens grups nous, en
 * fas un de nou: profdani-2627.js. Així conserves el de l'any passat
 * per si has de consultar res.
 *
 * ── COM ES FA SERVIR ───────────────────────────────────────────────
 *
 *   Opció A (habitual)
 *     Obres la pàgina, cliques «Carrega les meves classes» i tries
 *     aquest fitxer. Queda desat al navegador i no cal repetir-ho.
 *
 *   Opció B (al teu ordinador)
 *     Si tens una còpia del projecte al disc, deixa aquest fitxer al
 *     costat de l'index.html i es carregarà sol.
 *
 * ── ESTRUCTURA ─────────────────────────────────────────────────────
 *
 *   docent      Per identificar el fitxer quan en tinguis diversos.
 *   curs        Idem. Surt a la pantalla perquè vegis què has carregat.
 *   actualitzat Data de l'última alta. Si importes un fitxer més antic
 *               que el que ja tens, la pàgina t'avisa.
 *   grups       Un objecte per grup classe. La clau (p. ex. "1ESOA")
 *               és l'identificador intern; "nom" és el que es mostra.
 *
 *   Cada alumne té tres camps:
 *     id      Identificador únic i estable. El genera alta.html i pot
 *             dur un sufix (p. ex. "1ESOA-7042-01"). No el toquis a mà:
 *             els positius i els seients hi estan lligats.
 *     numero  Cadena de dues xifres. És la posició a la teva llista de
 *             qualificacions, i és el que teclejes al mode M2.
 *     nom     Només el nom de pila. Mai cognoms.
 *
 * ── PER QUÈ NOMÉS EL NOM DE PILA ───────────────────────────────────
 *
 * Perquè amb el nom de pila i el número ja saps de qui parles, i
 * afegir-hi el cognom no et fa cap servei que no tinguis ja al full
 * de qualificacions. Menys dades, menys problemes.
 *
 * Els noms d'aquest fitxer d'exemple són inventats.
 * ═══════════════════════════════════════════════════════════════════
 */
window.DOCENT = {

  format: 1,
  docent: 'Dani',
  curs: '2026-27',
  actualitzat: '2026-09-05',

  grups: {

    '1ESOA': {
      nom: '1r ESO A',
      alumnes: [
        { id: '1ESOA-01', numero: '01', nom: 'Martina' },
        { id: '1ESOA-02', numero: '02', nom: 'Youssef' },
        { id: '1ESOA-03', numero: '03', nom: 'Laia' },
        { id: '1ESOA-04', numero: '04', nom: 'Bruno' },
        { id: '1ESOA-05', numero: '05', nom: 'Ariadna' },
        { id: '1ESOA-06', numero: '06', nom: 'Pol' },
        { id: '1ESOA-07', numero: '07', nom: 'Nerea' },
        { id: '1ESOA-08', numero: '08', nom: 'Marc' },
        { id: '1ESOA-09', numero: '09', nom: 'Judit' },
        { id: '1ESOA-10', numero: '10', nom: 'Adam' },
        { id: '1ESOA-11', numero: '11', nom: 'Emma' },
        { id: '1ESOA-12', numero: '12', nom: 'Biel' },
        { id: '1ESOA-13', numero: '13', nom: 'Sara' },
        { id: '1ESOA-14', numero: '14', nom: 'Oriol' },
        { id: '1ESOA-15', numero: '15', nom: 'Fatima' },
        { id: '1ESOA-16', numero: '16', nom: 'Jan' },
        { id: '1ESOA-17', numero: '17', nom: 'Carla' }
      ]
    },

    '1ESOB': {
      nom: '1r ESO B',
      alumnes: [
        { id: '1ESOB-19', numero: '19', nom: 'Lola' },
        { id: '1ESOB-20', numero: '20', nom: 'Nil' },
        { id: '1ESOB-21', numero: '21', nom: 'Vera' },
        { id: '1ESOB-22', numero: '22', nom: 'Arnau' },
        { id: '1ESOB-23', numero: '23', nom: 'Amina' },
        { id: '1ESOB-24', numero: '24', nom: 'Ferran' },
        { id: '1ESOB-25', numero: '25', nom: 'Zoe' },
        { id: '1ESOB-26', numero: '26', nom: 'Quim' },
        { id: '1ESOB-27', numero: '27', nom: 'Anna' },
        { id: '1ESOB-28', numero: '28', nom: 'Bernat' },
        { id: '1ESOB-29', numero: '29', nom: 'Ines' },
        { id: '1ESOB-30', numero: '30', nom: 'Otger' }
      ]
    },

    '4ESO': {
      nom: '4t ESO',
      alumnes: [
        { id: '4ESO-01', numero: '01', nom: 'Abril' },
        { id: '4ESO-02', numero: '02', nom: 'Ramon' },
        { id: '4ESO-03', numero: '03', nom: 'Sofia' },
        { id: '4ESO-04', numero: '04', nom: 'Pere' },
        { id: '4ESO-05', numero: '05', nom: 'Julieta' },
        { id: '4ESO-06', numero: '06', nom: 'Marti' },
        { id: '4ESO-07', numero: '07', nom: 'Cristina' },
        { id: '4ESO-08', numero: '08', nom: 'Andreu' },
        { id: '4ESO-09', numero: '09', nom: 'Neus' },
        { id: '4ESO-10', numero: '10', nom: 'Jordi' },
        { id: '4ESO-11', numero: '11', nom: 'Georgina' },
        { id: '4ESO-12', numero: '12', nom: 'Pau' },
        { id: '4ESO-13', numero: '13', nom: 'Mireia' },
        { id: '4ESO-14', numero: '14', nom: 'Victor' },
        { id: '4ESO-15', numero: '15', nom: 'Queralt' },
        { id: '4ESO-16', numero: '16', nom: 'Bernat' },
        { id: '4ESO-17', numero: '17', nom: 'Roser' },
        { id: '4ESO-18', numero: '18', nom: 'Sergi' },
        { id: '4ESO-19', numero: '19', nom: 'Elisenda' },
        { id: '4ESO-20', numero: '20', nom: 'Ignasi' },
        { id: '4ESO-21', numero: '21', nom: 'Berenguera' },
        { id: '4ESO-22', numero: '22', nom: 'Genis' },
        { id: '4ESO-23', numero: '23', nom: 'Alexia' },
        { id: '4ESO-24', numero: '24', nom: 'Tomas' }
      ]
    }

  }
};
