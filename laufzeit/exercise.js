import { buildSteps } from './model.mjs';

let a = [1, 2, 3];
let b = ['A', 'B'];
let steps = buildSteps(a, b);
const byId = id => document.getElementById(id);
const format = value => typeof value === 'string' ? `'${value}'` : String(value);
const pairText = pair => `(${pair.map(format).join(', ')})`;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let position = -1;
let generation = 0;

function emphasize(element) {
  if (reducedMotion.matches) return;
  element.animate([
    { backgroundColor: '#ffe39a', outline: '3px solid #845000', transform: 'translateY(-4px)' },
    { backgroundColor: 'transparent', outline: '3px solid transparent', transform: 'translateY(0)' }
  ], { duration: 650, easing: 'ease-out' });
}

function highlightCode(state) {
  document.querySelectorAll('[data-line]').forEach(line => {
    const active = Number(line.dataset.line) === state?.line;
    line.classList.toggle('active', active);
    if (active) line.setAttribute('aria-current', 'step');
    else line.removeAttribute('aria-current');
  });
}

function updateValues(state) {
  for (const [index, name, values] of [[1, 'a', a], [2, 'b', b]]) {
    const argument = byId(`argument-${name}`);
    const bound = state?.argumentsBound >= index;
    if (!bound) {
      argument.textContent = name;
      delete argument.dataset.bound;
      continue;
    }
    if (!argument.dataset.bound) {
      argument.dataset.bound = 'true';
      argument.replaceChildren(document.createTextNode(`${name} = [`));
      values.forEach((value, i) => {
        if (i) argument.append(document.createTextNode(', '));
        const item = document.createElement('span');
        item.className = 'list-value';
        item.dataset.variable = name === 'a' ? 'x' : 'y';
        item.textContent = format(value);
        argument.append(item);
      });
      argument.append(document.createTextNode(']'));
      emphasize(argument);
    }
    argument.querySelectorAll('.list-value').forEach((item, i) => {
      const selected = values[i] === state[name === 'a' ? 'x' : 'y'];
      const changed = selected && !item.classList.contains('selected');
      item.classList.toggle('selected', selected);
      if (selected) {
        item.setAttribute('aria-current', 'true');
        item.setAttribute('aria-label', `${item.dataset.variable} = ${format(values[i])}`);
      } else {
        item.removeAttribute('aria-current');
        item.removeAttribute('aria-label');
      }
      if (changed) emphasize(item);
    });
  }

}

function updateVariables(state) {
  const area = byId('variables');
  if (!state) {
    area.replaceChildren();
    return;
  }
  const values = [
    ['a', state.argumentsBound >= 1 ? `[${a.map(format).join(', ')}]` : null],
    ['b', state.argumentsBound >= 2 ? `[${b.map(format).join(', ')}]` : null],
    ['prod', state.prod === null ? null : `[${state.prod.map(pairText).join(', ')}]`],
    ['x', state.x === undefined ? null : format(state.x)],
    ['y', state.y === undefined ? null : format(state.y)],
    ['result', state.result === null ? null : `[${state.result.map(pairText).join(', ')}]`]
  ];
  for (const [name, value] of values) {
    if (value === null) continue;
    let row = byId(`variable-${name}`);
    if (!row) {
      row = document.createElement('p');
      row.id = `variable-${name}`;
      row.className = 'variable-row';
      area.append(row);
    }
    const text = `${name} = ${value}`;
    if (row.textContent !== text) {
      row.textContent = text;
      emphasize(row);
    }
  }
}

async function typeTerminal(id, text, token) {
  const element = byId(id);
  if (reducedMotion.matches) {
    element.textContent = text;
    return;
  }
  for (let length = 1; length <= text.length; length += 1) {
    if (token !== generation) return;
    element.textContent = text.slice(0, length);
    await new Promise(resolve => setTimeout(resolve, 22));
  }
}

byId('next').addEventListener('click', async () => {
  if (position >= steps.length - 1 || byId('next').disabled) return;
  const token = generation;
  byId('next').disabled = true;
  const state = steps[++position];
  if (position === 0) {
    byId('status').textContent = 'Das Python-Programm wird im Terminal gestartet.';
    await typeTerminal('terminal-command', 'python3 kartesisches_produkt.py', token);
    if (token !== generation) return;
  }
  highlightCode(state);
  byId('status').textContent = `Schritt ${position + 1}/${steps.length}: ${state.message}`;
  // Highlight the executed line before animating its values and comments.
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 150 : 700));
  if (token !== generation) return;
  updateValues(state);
  updateVariables(state);
  updateRuntime(state);
  if (state.printed) {
    await typeTerminal('terminal-output', `\n[${state.result.map(pairText).join(', ')}]\n$ `, token);
    if (token !== generation) return;
  }
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 650));
  if (token !== generation) return;
  byId('next').disabled = position === steps.length - 1;
});

function reset() {
  generation += 1;
  position = -1;
  highlightCode(null);
  updateValues(null);
  updateVariables(null);
  updateRuntime(null);
  byId('terminal-command').textContent = '';
  byId('terminal-output').textContent = '';
  byId('status').textContent = 'Bereit für den Funktionsaufruf.';
  byId('next').disabled = false;

}
byId('reset').addEventListener('click', reset);

function updateRuntime(state) {
  const count = state?.prod?.length ?? 0;
  const counter = byId('operation-count');
  const changed = counter.textContent !== String(count);
  counter.textContent = count;
  if (changed && state?.line === 5) emphasize(counter);
  byId('operation-total').textContent = `von ${a.length * b.length} append-Aufrufen ausgeführt`;
  byId('runtime-formula').textContent = `T(n, m) = n · m = ${a.length} · ${b.length} = ${a.length * b.length}`;
  byId('runtime-explanation').textContent = a.length === 0 || b.length === 0
    ? 'Eine Liste ist leer: Es entstehen keine Paare, also gibt es 0 append-Aufrufe.'
    : `Die äußere Schleife hat ${a.length} Durchläufe. Pro Durchlauf durchläuft die innere Schleife alle ${b.length} Elemente von b: jeweils ${b.length} append-Aufrufe.`;
  byId('growth-explanation').textContent = `Verdoppeln wir nur n oder nur m, verdoppelt sich die Anzahl. Verdoppeln wir beide, vervierfacht sie sich: (2n) · (2m) = 4nm. Für n = m gilt T(n, n) = n².`;
  const bars = byId('runtime-bars');
  if (bars.children.length !== a.length) {
    bars.replaceChildren(...a.map((value, index) => {
      const row = document.createElement('div');
      row.className = 'runtime-row';
      const label = document.createElement('span');
      label.textContent = `x = ${value}`;
      const progress = document.createElement('progress');
      progress.max = Math.max(1, b.length);
      progress.value = 0;
      progress.setAttribute('aria-label', `append-Aufrufe im äußeren Durchlauf ${index + 1}`);
      const number = document.createElement('span');
      row.append(label, progress, number);
      return row;
    }));
  }
  [...bars.children].forEach((row, index) => {
    const done = Math.max(0, Math.min(b.length, count - index * b.length));
    const progress = row.querySelector('progress');
    const previous = progress.value;
    progress.max = Math.max(1, b.length);
    progress.value = done;
    row.lastElementChild.textContent = `${done} / ${b.length}`;
    if (done !== previous && state?.line === 5) emphasize(row);
  });
}

for (const [id, initial] of [['size-a', a.length], ['size-b', b.length]]) {
  const select = byId(id);
  for (let size = 0; size <= 8; size += 1) {
    select.add(new Option(String(size), String(size), false, size === initial));
  }
  select.addEventListener('change', () => {
    a = Array.from({ length: Number(byId('size-a').value) }, (_, i) => i + 1);
    b = Array.from({ length: Number(byId('size-b').value) }, (_, i) => String.fromCharCode(65 + i));
    steps = buildSteps(a, b);
    const call = byId('function-call');
    call.replaceChildren(document.createTextNode('result = '));
    const name = document.createElement('span');
    name.className = 'function';
    name.textContent = 'cart_product';
    call.append(name, document.createTextNode(`([${a.map(format).join(', ')}], [${b.map(format).join(', ')}])`));
    reset();
    reserveCodeWidth();
  });
}

function reserveCodeWidth() {
  // Measure the widest signature before any execution step changes the layout.
  const source = document.querySelector('.label-area > pre');
  const measuring = source.cloneNode(true);
  measuring.setAttribute('aria-hidden', 'true');
  measuring.removeAttribute('tabindex');
  measuring.style.cssText = 'position:fixed;visibility:hidden;width:max-content;max-width:none;pointer-events:none;';
  for (const [name, values] of [['a', a], ['b', b]]) {
    const argument = measuring.querySelector(`#argument-${name}`);
    argument.replaceChildren(document.createTextNode(`${name} = [`));
    values.forEach((value, index) => {
      if (index) argument.append(document.createTextNode(', '));
      const item = document.createElement('span');
      item.className = `list-value${index === 0 ? ' selected' : ''}`;
      item.textContent = format(value);
      argument.append(item);
    });
    argument.append(document.createTextNode(']'));
  }
  measuring.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  document.body.append(measuring);
  const areaStyle = getComputedStyle(document.querySelector('.label-area'));
  const width = measuring.getBoundingClientRect().width
    + parseFloat(areaStyle.paddingLeft) + parseFloat(areaStyle.paddingRight);
  document.querySelector('.card').style.setProperty('--code-width', `${Math.ceil(width)}px`);
  measuring.remove();
}
reserveCodeWidth();
window.addEventListener('resize', reserveCodeWidth);
document.fonts.ready.then(reserveCodeWidth);
reset();
