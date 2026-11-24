// Each snapshot describes the state after the highlighted line executes.
export function buildSteps(a, b) {
  const steps = [];
  let x;
  let y;
  let prod = null;
  let argumentsBound = 0;
  let result = null;
  let printed = false;
  const add = (line, message, pair = null) => steps.push({
    line, message, x, y, pair, argumentsBound, printed,
    result: result === null ? null : result.map(value => [...value]),
    prod: prod === null ? null : prod.map(value => [...value])
  });
  add(7, 'Die Funktion cart_product wird mit zwei Listen aufgerufen.');
  argumentsBound = 1;
  add(1, 'Das Argument a wird übergeben.');
  argumentsBound = 2;
  add(1, 'Das Argument b wird übergeben.');
  prod = [];
  add(2, 'Die leere Ergebnisliste prod wird angelegt.');
  for (x of a) {
    add(3, `Die äußere Schleife setzt x auf ${x}.`);
    for (y of b) {
      add(4, `Die innere Schleife setzt y auf ${y}.`, [x, y]);
      prod.push([x, y]);
      add(5, `Das Paar (${x}, ${y}) wird an prod angehängt.`, [x, y]);
    }
    add(4, 'Die Liste b ist durchlaufen. Weiter geht es mit der äußeren Schleife.');
  }
  add(3, 'Die Liste a ist durchlaufen. Die äußere Schleife endet.');
  add(6, `Die Funktion gibt prod mit ${prod.length} Paaren zurück.`);
  result = prod;
  add(7, 'Der Rückgabewert wird in result gespeichert.');
  printed = true;
  add(8, 'print(result) gibt das Ergebnis im Terminal aus.');
  return steps;
}
