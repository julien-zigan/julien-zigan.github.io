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

function highlightCode(state) {
  byId('function-call').hidden = !state;
  document.querySelectorAll('[data-line]').forEach(line => {
    const active = Number(line.dataset.line) === state?.line;
    line.classList.toggle('active', active);
    if (active) line.setAttribute('aria-current', 'step');
    else line.removeAttribute('aria-current');
  });
}

function updateComment(id, text) {
  const comment = byId(id);
  if (comment.textContent === text) return;
  comment.textContent = text;
  if (text) emphasize(comment);
}

function updateValues(state) {
  for (const [index, name, values] of [[1, 'a', a], [2, 'b', b]]) {
    const argument = byId(`argument-${name}`);
    const bound = state?.argumentsBound >= index;
    if (!bound) {
      argument.textContent = name;
      continue;
    }
    if (!argument.querySelector('.list-value')) {
      argument.replaceChildren(document.createTextNode(`${name} = [`));
      values.forEach((value, i) => {
        if (i) argument.append(document.createTextNode(', '));
        const item = document.createElement('span');
        item.className = 'list-value';
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
      if (selected) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
      if (changed) emphasize(item);
    });
  }
  for (const name of ['x', 'y']) {
    updateComment(`code-${name}`, state?.[name] === undefined ? '' : ` # ${name} = ${format(state[name])}`);
  }
  updateComment('code-init', state?.prod == null ? '' : ' # prod = []');
  const product = state?.prod == null ? '' : `[${state.prod.map(pairText).join(', ')}]`;
  updateComment('code-product', state?.prod?.length ? ` # prod = ${product}` : '');
  updateComment('code-return', state?.line === 6 ? ` # Ergebnis: ${product}` : '');
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
  highlightCode(state);
  byId('status').textContent = `Schritt ${position + 1}/${steps.length}: ${state.message}`;
  // Highlight the executed line before animating its values and comments.
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 150 : 700));
  if (token !== generation) return;
  updateValues(state);
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 650));
  if (token !== generation) return;
  byId('next').disabled = position === steps.length - 1;
});

function reset() {
  generation += 1;
  position = -1;
  highlightCode(null);
  updateValues(null);
  byId('status').textContent = 'Bereit für den Funktionsaufruf.';
  byId('next').disabled = false;

}
byId('reset').addEventListener('click', reset);
reset();
