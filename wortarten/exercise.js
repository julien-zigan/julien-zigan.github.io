const groups = [
  { id: 'flektierbar', label: 'flektierbar', children: [
    { id: 'deklinierbar', label: 'deklinierbar', leaves: ['Substantive', 'Adjektive', 'Artikel', 'Pronomen'] },
    { id: 'konjugierbar', label: 'konjugierbar', leaves: ['Verben'] }
  ] },
  { id: 'nicht-flektierbar', label: 'nicht flektierbar', leaves: ['Konjunktionen', 'Präpositionen', 'Adverben', 'Partikeln', 'Interjektionen'] }
];
const labels = new Map();
const slots = new Map();
const assignments = new Map();
const bank = document.querySelector('#bank');
const status = document.querySelector('#status');
let selected = null;

function makeSlot(id, label, type, parent = null) {
  labels.set(id, { label, type, parent });
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `slot ${type}`;
  button.dataset.id = id;
  button.dataset.type = type;
  button.addEventListener('click', () => {
    if (selected) place(selected, id);
    else if (assignments.has(id)) select(assignments.get(id));
    else status.textContent = 'Wähle zuerst einen Begriff aus.';
  });
  button.addEventListener('dragover', event => {
    event.preventDefault();
    button.classList.add('dragover');
  });
  button.addEventListener('dragleave', () => button.classList.remove('dragover'));
  button.addEventListener('drop', event => {
    event.preventDefault();
    button.classList.remove('dragover');
    place(event.dataTransfer.getData('text/plain'), id);
  });
  button.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', assignments.get(id));
    event.dataTransfer.effectAllowed = 'move';
  });
  slots.set(id, button);
  return button;
}

function branch(group) {
  const container = document.createElement('div');
  container.className = 'branch';
  container.dataset.group = group.id;
  container.append(makeSlot(group.id, group.label, 'node'));
  if (group.children) {
    const children = document.createElement('div');
    children.className = 'branches';
    group.children.forEach(child => children.append(branch(child)));
    container.append(children);
  } else {
    const leaves = document.createElement('ul');
    leaves.className = 'leaves';
    group.leaves.forEach(label => {
      const item = document.createElement('li');
      item.append(makeSlot(label.toLowerCase(), label, 'leaf', group.id));
      leaves.append(item);
    });
    container.append(leaves);
  }
  return container;
}

const root = document.createElement('div');
root.className = 'root';
root.textContent = 'Wort';
const branches = document.createElement('div');
branches.className = 'branches';
groups.forEach(group => branches.append(branch(group)));
document.querySelector('#tree').append(root, branches);
let order = [];

function select(id) {
  selected = selected === id ? null : id;
  render();
  status.textContent = selected ? `${labels.get(id).label} ausgewählt. Wähle ein passendes Feld.` : 'Auswahl aufgehoben.';
  const active = [...document.querySelectorAll('[data-label]')].find(button => button.dataset.label === id);
  active?.focus();
}

function place(id, target) {
  if (!labels.has(id)) return;
  if (labels.get(id).type !== labels.get(target).type) {
    status.textContent = 'Achte auf die Farbe: Verzweigungen gehören in blaue Felder, Wortarten in gelbe.';
    return;
  }
  const previous = [...assignments].find(([, value]) => value === id)?.[0];
  const displaced = assignments.get(target);
  if (previous) assignments.delete(previous);
  if (previous && displaced && displaced !== id) assignments.set(previous, displaced);
  assignments.set(target, id);
  selected = null;
  render();
  slots.get(target).focus();
  status.textContent = `${assignments.size} von ${labels.size} Begriffen zugeordnet.`;
}

function render() {
  bank.replaceChildren();
  const used = new Set(assignments.values());
  order.filter(id => !used.has(id)).forEach(id => {
    const { label, type } = labels.get(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `token ${type}`;
    button.textContent = label;
    button.dataset.label = id;
    button.draggable = true;
    button.setAttribute('aria-pressed', String(selected === id));
    button.addEventListener('click', () => select(id));
    button.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', id);
      event.dataTransfer.effectAllowed = 'move';
    });
    bank.append(button);
  });
  let node = 0;
  let leaf = 0;
  slots.forEach((button, id) => {
    const value = assignments.get(id);
    const type = labels.get(id).type;
    const number = type === 'node' ? ++node : ++leaf;
    const field = `${type === 'node' ? 'Verzweigung' : 'Wortart'} ${number}`;
    button.textContent = value ? labels.get(value).label : '';
    button.setAttribute('aria-label', `${field}: ${value ? labels.get(value).label : 'leer'}`);
    button.setAttribute('aria-pressed', String(Boolean(value && value === selected)));
    button.className = `slot ${type}${value ? ' filled' : ''}`;
    button.draggable = Boolean(value);
    if (value) button.dataset.label = value;
    else delete button.dataset.label;
  });
}

document.querySelector('#check').addEventListener('click', () => {
  selected = null;
  render();
  let correct = 0;
  slots.forEach((button, id) => {
    const value = assignments.get(id);
    const target = labels.get(id);
    const answer = labels.get(value);
    const right = Boolean(answer && (target.type === 'leaf'
      ? answer.type === 'leaf' && answer.parent === target.parent
      : value === id));
    if (right) correct++;
    if (value) {
      button.classList.add(right ? 'correct' : 'incorrect');
      button.textContent += right ? ' ✓' : ' ✕';
      button.setAttribute('aria-label', `${button.getAttribute('aria-label')}, ${right ? 'richtig' : 'noch nicht richtig'}`);
    }
  });
  status.textContent = correct === labels.size
    ? 'Alles richtig! Du hast alle Wortarten zugeordnet.'
    : `${correct} von ${labels.size} richtig. ${labels.size - assignments.size} Felder sind noch frei. Du kannst Begriffe auswählen und versetzen; belegte Felder tauschen ihre Begriffe.`;
});

function reset() {
  assignments.clear();
  selected = null;
  order = [...labels.keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  render();
  status.textContent = 'Ordne alle 14 Begriffe zu. „Wort“ ist bereits vorgegeben.';
}
document.querySelector('#reset').addEventListener('click', reset);
reset();

// Draw connectors from the actual box positions, including after resizing.
const tree = document.querySelector('#tree');
const connectors = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
connectors.classList.add('connectors');
connectors.setAttribute('aria-hidden', 'true');
tree.prepend(connectors);

function drawConnectors() {
  connectors.replaceChildren();
  const bounds = tree.getBoundingClientRect();
  connectors.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
  function point(element, bottom = false) {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - bounds.left,
      y: (bottom ? rect.bottom : rect.top) - bounds.top };
  }
  function line(points) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    path.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(' '));
    connectors.append(path);
  }
  function connectNodes(parent, children) {
    const start = point(parent, true);
    children.forEach(child => {
      const end = point(child);
      const middle = (start.y + end.y) / 2;
      line([start, { x: start.x, y: middle }, { x: end.x, y: middle }, end]);
    });
  }
  connectNodes(root, groups.map(group => slots.get(group.id)));
  function connectGroup(group) {
    const parent = slots.get(group.id);
    if (group.children) {
      connectNodes(parent, group.children.map(child => slots.get(child.id)));
      group.children.forEach(connectGroup);
    } else {
      const start = point(parent, true);
      const children = group.leaves.map(label => slots.get(label.toLowerCase()));
      // The centered boxes cover the line, leaving straight links in each gap.
      const end = point(children[children.length - 1]);
      line([start, { x: start.x, y: end.y }]);
    }
  }
  groups.forEach(connectGroup);
}
new ResizeObserver(drawConnectors).observe(tree);
