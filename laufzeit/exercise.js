import { buildSteps } from './model.mjs';

const a = [1, 2, 3];
const b = ['A', 'B'];
const steps = buildSteps(a, b);
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

function updateCode(state) {
  byId('function-call').hidden = !state;
  for (const [index, name, values] of [[1, 'a', a], [2, 'b', b]]) {
    const argument = byId(`argument-${name}`);
    const bound = state?.argumentsBound >= index;
    const text = bound ? `${name} = [${values.map(format).join(', ')}]` : name;
    if (argument.textContent !== text) {
      argument.textContent = text;
      if (bound) emphasize(argument);
    }
  }
  for (const name of ['x', 'y']) {
    const annotation = byId(`code-${name}`);
    const text = state?.[name] === undefined ? '' : ` # ${name} = ${format(state[name])}`;
    if (annotation.textContent !== text) {
      annotation.textContent = text;
      if (text) emphasize(annotation);
    }
  }
  document.querySelectorAll('[data-line]').forEach(line => {
    const active = Number(line.dataset.line) === state?.line;
    line.classList.toggle('active', active);
    if (active) line.setAttribute('aria-current', 'step');
    else line.removeAttribute('aria-current');
  });
}

function renderList(id, values, current) {
  const list = byId(id);
  if (!list.querySelector('.list-value')) {
    list.append(document.createTextNode('['));
    values.forEach((value, index) => {
      if (index) list.append(document.createTextNode(', '));
      const item = document.createElement('span');
      item.className = 'list-value';
      item.textContent = format(value);
      list.append(item);
    });
    list.append(document.createTextNode(']'));
  }
  list.querySelectorAll('.list-value').forEach((item, index) => {
    const selected = values[index] === current;
    const wasSelected = item.classList.contains('selected');
    item.classList.toggle('selected', selected);
    if (selected) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
    if (selected && !wasSelected) emphasize(item);
  });
}

function updatePanel(name, visible, update) {
  const panel = byId(`panel-${name}`);
  const wasHidden = panel.hidden;
  const before = panel.textContent;
  panel.hidden = !visible;
  if (!visible) return;
  update();
  if (wasHidden || panel.textContent !== before) emphasize(panel);
}

function updateMain(state) {
  updatePanel('a', state?.argumentsBound >= 1, () => renderList('list-a', a, state?.x));
  updatePanel('b', state?.argumentsBound >= 2, () => renderList('list-b', b, state?.y));
  for (const name of ['x', 'y']) {
    updatePanel(name, state?.[name] !== undefined, () => {
      byId(name).textContent = format(state[name]);
    });
  }
  updatePanel('product', state?.prod != null, () => {
    byId('product').textContent = `[${state.prod.map(pairText).join(', ')}]`;
  });
}

byId('next').addEventListener('click', async () => {
  if (position >= steps.length - 1 || byId('next').disabled) return;
  const token = generation;
  byId('next').disabled = true;
  const state = steps[++position];
  if (state.line === 7) {
    const call = byId('function-call');
    call.hidden = false;
    if (!reducedMotion.matches) {
      call.animate([{ opacity: 0, transform: 'translateY(.4rem)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 400, easing: 'ease-out' });
    }
    await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 400));
    if (token !== generation) return;
  }
  updateCode(state);
  byId('status').textContent = `Schritt ${position + 1}/${steps.length}: ${state.message}`;
  // Give the code change its own moment before updating the visualization.
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 150 : 700));
  if (token !== generation) return;
  updateMain(state);
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 650));
  if (token !== generation) return;
  byId('next').disabled = position === steps.length - 1;
});

function reset() {
  generation += 1;
  position = -1;
  updateCode(null);
  updateMain(null);
  byId('status').textContent = 'Bereit für den Funktionsaufruf.';
  byId('next').disabled = false;
  // Remove old list selections so restarting also animates their first use.
  byId('list-a').replaceChildren();
  byId('list-b').replaceChildren();
}
byId('reset').addEventListener('click', reset);
reset();
