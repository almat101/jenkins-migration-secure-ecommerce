## Cos'è Jest?
"Jest è un framework di testing 'all-in-one' per JavaScript.

Il suo vantaggio principale è che include tutto il necessario per testare, pronto all'uso:

- Un Test Runner: L'esecutore che trova i file di test e li lancia.

- Una Libreria di Assertions: Le funzioni (come expect) per verificare che i risultati siano corretti.

- Un Framework di Mocking: Gli strumenti (come jest.fn e jest.mock) per "isolare" il codice e simulare le dipendenze, come le chiamate al database.

A differenza di altri setup (come Mocha + Chai + Sinon), con Jest non devi installare e configurare tre librerie diverse. È una soluzione unica che punta alla semplicità e a una configurazione quasi nulla ('zero-config')."

## Le Funzioni Principali (Cosa fa cosa)
Ecco i mattoncini fondamentali che usi per costruire un test.

1. La Struttura del Test (describe, test, beforeEach)
- describe('Nome Gruppo', ...) È un contenitore, un blocco logico. Lo usi per raggruppare test correlati. Per esempio, describe('Test del Repository Utenti', ...) raggruppa tutti i test per quel file.

- test('Descrizione del test', ...) (o it(...) che è un sinonimo) È il test case vero e proprio. La descrizione dovrebbe dire cosa ti aspetti che succeda, come test('dovrebbe trovare un utente valido', ...) (proprio come hai fatto tu).

- beforeEach(...) È un "hook". È una funzione che Jest esegue prima di ogni singolo test all'interno dello stesso describe. È il posto perfetto per pulire e resettare i mock, come hai fatto tu con mockQuery.mockReset().

2. Le Verifiche (expect e i Matchers)
- expect(valore) Questa funzione da sola non fa nulla. È il tuo modo di dire a Jest: "Ok, ora guarda questo valore...". Restituisce un oggetto su cui puoi usare i "Matchers".

- I Matchers (es. .toBe(), .toEqual()) I Matchers sono le verifiche vere e proprie. Sono le funzioni che colleghi a expect per dire a Jest cosa deve essere vero.

    - .toBe(valoreAtteso): Controlla l'identità (===). È per valori primitivi (numeri, stringhe, booleani).

    Esempio: expect(risultato.rowCount).toBe(1); (Controlla che sia esattamente il numero 1).

    - .toEqual(valoreAtteso): Controlla il contenuto (deep equality). È fondamentale per oggetti e array.

    Esempio: expect(risultato.rows[0]).toEqual(mockUser); (Controlla che l'oggetto utente abbia le stesse proprietà e valori di mockUser, anche se non sono lo stesso oggetto in memoria).

    - .toHaveBeenCalledWith(...): Un Matcher speciale per i mock. Controlla che una funzione mock sia stata chiamata con quegli specifici argomenti.

    Esempio: expect(mockQuery).toHaveBeenCalledWith('SELECT...', [email]); (È la tua "Assert" nel test).

3. Il Mocking (Isolare il codice)
Questo è il concetto più importante per lo unit testing.

- jest.fn() Crea una funzione "spia" (uno spy). È un mock basilare. Non fa nulla, ma registra tutte le chiamate che riceve. Ti permette di controllare se è stata chiamata, quante volte e con quali argomenti.

    - È quello che hai usato per creare mockQuery. Poi gli hai dato un finto valore di ritorno con .mockResolvedValueOnce(mockQueryResult).

- jest.mock('nome-modulo', ...) (o jest.unstable_mockModule) Questo è molto più potente. Sostituisce un intero modulo (un file o una libreria, come 'pg') con una tua versione finta.

    - È quello che hai usato per dire a Jest: "Quando il authRepository prova a importare 'pg', non dargli il vero pg, dagli questo oggetto finto che ho creato io con la mia mockQuery".

    - È essenziale per isolare il tuo codice dalle dipendenze esterne (database, API, file system) e rendere il test unitario puro e veloce.


---


Jest and ESM :
https://jestjs.io/docs/ecmascript-modules

To use ESM (ECMAScript Modules) with Node.js, Express, and Jest for testing, several configuration steps and considerations are required due to Jest's experimental support for ESM. The primary challenge lies in module mocking, as the standard jest.mock() function does not work reliably with ESM due to its static import evaluation and immutable nature.  Instead, Jest provides the jest.unstable_mockModule() API for mocking ESM modules, which requires the factory function to be explicitly defined and must be called before importing the module using dynamic import().  For a project using TypeScript with ESM, the ts-jest transformer can be configured to emit ESM by setting useESM: true in the tsconfig.json and ensuring the transform property in Jest is set to an empty object (transform: {}) to prevent unwanted code transformation.  This allows Jest to directly execute ESM files. The package.json must also include "type": "module" to enable ESM mode in Node.js.  To run tests, Node.js must be started with the --experimental-vm-modules flag, which can be added to the test script in package.json as node --experimental-vm-modules node_modules

JEST + supertest configuration + examples
https://www.albertgao.com/2017/05/24/how-to-test-expressjs-with-jest-and-supertest/

jest.unstable_mockModule
https://jestjs.io/docs/ecmascript-modules