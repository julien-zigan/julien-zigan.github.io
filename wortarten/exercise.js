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
const difficultyButton = document.querySelector('#difficulty');
let difficulty = 'leicht';
const writtenAnswers = new Map();
let selected = null;

function makeSlot(id, label, type, parent = null) {
  labels.set(id, { label, type, parent });
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `slot ${type}`;
  button.dataset.id = id;
  button.dataset.type = type;
  button.setAttribute('aria-describedby', 'hint');
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
  if (!labels.has(id) || !slots.has(target)) return;
  if (difficulty === 'leicht' && labels.get(id).type !== labels.get(target).type) {
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
  bank.hidden = difficulty === 'schwer';
  const used = new Set(assignments.values());
  order.filter(id => difficulty !== 'schwer' && !used.has(id)).forEach(id => {
    const { label, type } = labels.get(id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `token ${type}`;
    button.textContent = label;
    button.setAttribute('aria-label', difficulty === 'mittel' ? label : `${label}, ${type === 'node' ? 'Verzweigung' : 'Wortart'}`);
    button.setAttribute('aria-describedby', 'hint');
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
  let position = 0;
  slots.forEach((button, id) => {
    const hard = difficulty === 'schwer';
    if ((button.tagName === 'INPUT') !== hard) {
      const previous = button;
      if (hard) {
        button = document.createElement('input');
        button.type = 'text';
        button.autocomplete = 'off';
        button.spellcheck = false;
        button.setAttribute('aria-describedby', 'hint');
        button.addEventListener('input', () => {
          writtenAnswers.set(id, button.value);
          button.classList.remove('correct', 'incorrect');
          button.removeAttribute('aria-invalid');
          button.setAttribute('aria-label', button.dataset.field);
          status.textContent = '';
        });
        button.addEventListener('keydown', event => {
          if (event.key === 'Enter') document.querySelector('#check').click();
        });
      } else button = makeSlot(id, labels.get(id).label, labels.get(id).type, labels.get(id).parent);
      previous.replaceWith(button);
      slots.set(id, button);
    }
    const value = assignments.get(id);
    const type = labels.get(id).type;
    const number = type === 'node' ? ++node : ++leaf;
    const field = difficulty === 'mittel' ? `Feld ${++position}` : `${type === 'node' ? 'Verzweigung' : 'Wortart'} ${number}`;
    button.dataset.field = field;
    if (hard) button.value = writtenAnswers.get(id) || '';
    else button.textContent = value ? labels.get(value).label : '';
    button.setAttribute('aria-label', hard ? field : `${field}: ${value ? labels.get(value).label : 'leer'}`);
    button.removeAttribute('aria-invalid');
    if (hard) button.removeAttribute('aria-pressed');
    else button.setAttribute('aria-pressed', String(Boolean(value && value === selected)));
    button.className = `slot ${type}${value ? ' filled' : ''}`;
    button.draggable = !hard && Boolean(value);
    if (value) button.dataset.label = value;
    else delete button.dataset.label;
  });
}

document.querySelector('#check').addEventListener('click', () => {
  selected = null;
  render();
  if (difficulty === 'schwer') { checkWrittenAnswers(); return; }
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

const acceptedNames = {
  substantive: ['Substantiv', 'Nomen', 'Nomina', 'Namenwort', 'Namenwörter', 'Hauptwort', 'Hauptwörter'],
  adjektive: ['Adjektiv', 'Eigenschaftswort', 'Eigenschaftswörter'],
  artikel: ['Begleiter'],
  pronomen: ['Fürwort', 'Fürwörter', 'Pronomina'],
  verben: ['Verb', 'Zeitwort', 'Zeitwörter', 'Tunwort', 'Tunwörter', 'Tätigkeitswort', 'Tätigkeitswörter'],
  konjunktionen: ['Konjunktion', 'Bindewort', 'Bindewörter'],
  präpositionen: ['Präposition', 'Verhältniswort', 'Verhältniswörter'],
  adverben: ['Adverb', 'Umstandswort', 'Umstandswörter'],
  partikeln: ['Partikel'],
  interjektionen: ['Interjektion', 'Ausrufewort', 'Ausrufewörter'],
  'nicht-flektierbar': ['unflektierbar', 'nicht flektierbare', 'unveränderlich'],
  flektierbar: ['flektierbare', 'veränderlich'],
  deklinierbar: ['deklinierbare'],
  konjugierbar: ['konjugierbare']
};

function normalizeAnswer(value) {
  return value.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue').replace(/ß/g, 'ss').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
}

// Edit distance includes adjacent letter swaps, a common typing mistake.
function spellingDistance(a, b) {
  const table = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) table[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1,
        table[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        table[i][j] = Math.min(table[i][j], table[i - 2][j - 2] + 1);
      }
    }
  }
  return table[a.length][b.length];
}

function recognizeAnswer(value) {
  const normalized = normalizeAnswer(value);
  if (!normalized) return null;
  const scores = [...labels].map(([id, { label }]) => {
    const names = [label, ...(acceptedNames[id] || [])].map(normalizeAnswer);
    return { id, distance: Math.min(...names.map(name => spellingDistance(normalized, name))) };
  }).sort((a, b) => a.distance - b.distance);
  const best = scores[0];
  const tolerance = normalized.length <= 5 ? 1 : normalized.length < 12 ? 2 : 3;
  // Resolve against all labels first: a correctly spelled wrong category must fail.
  if (best.distance > tolerance || best.distance === scores[1].distance) return null;
  return best.id;
}

function checkWrittenAnswers() {
  let correct = 0;
  let filled = 0;
  const used = new Set();
  slots.forEach((input, id) => {
    const raw = writtenAnswers.get(id) || '';
    if (!raw.trim()) return;
    filled++;
    const recognized = recognizeAnswer(raw);
    const target = labels.get(id);
    const answer = labels.get(recognized);
    const right = Boolean(answer && !used.has(recognized) && (target.type === 'leaf'
      ? answer.type === 'leaf' && answer.parent === target.parent : recognized === id));
    if (right) { correct++; used.add(recognized); }
    input.classList.add(right ? 'correct' : 'incorrect');
    input.setAttribute('aria-invalid', String(!right));
    input.setAttribute('aria-label', `${input.dataset.field}: ${right ? 'richtig' : 'noch nicht richtig'}`);
  });
  status.textContent = correct === labels.size
    ? 'Alles richtig! Du hast alle Wortarten eingetragen.'
    : `${correct} von ${labels.size} richtig. ${labels.size - filled} Felder sind noch frei. Doppelrahmen: richtig. Gestrichelter Rahmen: noch nicht richtig. Prüfe auch, ob ein Begriff doppelt vorkommt.`;
}

function reset() {
  assignments.clear();
  writtenAnswers.clear();
  selected = null;
  order = [...labels.keys()];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  render();
  status.textContent = '';
}
document.querySelector('#reset').addEventListener('click', reset);
reset();

function setDifficulty(level, announce = true) {
  const levels = ['leicht', 'mittel', 'schwer'];
  difficulty = levels.includes(level) ? level : 'leicht';
  const name = difficulty[0].toUpperCase() + difficulty.slice(1);
  const next = levels[(levels.indexOf(difficulty) + 1) % levels.length];
  document.querySelector('.card').dataset.difficulty = difficulty;
  document.querySelector('#difficulty-label').textContent = `${name} · ${difficulty === 'schwer' ? 'Eintragen' : 'Zuordnen'}`;
  difficultyButton.removeAttribute('aria-pressed');
  difficultyButton.setAttribute('aria-label', `Schwierigkeit wählen: zu ${next} wechseln`);
  selected = null;
  render();
  hideHint();
  hint.textContent = difficulty === 'schwer'
    ? 'Trage die Begriffe in die Felder ein. Kleine Tippfehler werden verziehen. Mit Enter überprüfst du deine Antworten.'
    : 'Ziehe einen Begriff in ein passendes Feld oder klicke zuerst den Begriff und dann das Feld an.';
  status.textContent = announce ? `${name}: ${difficulty === 'schwer' ? 'Begriffe selbst eintragen' : difficulty === 'mittel' ? 'ohne Farbhilfen' : 'mit Farbhilfen'}.` : '';
  requestAnimationFrame(syncBoxSize);
}
difficultyButton.addEventListener('click', () => {
  const levels = ['leicht', 'mittel', 'schwer'];
  setDifficulty(levels[(levels.indexOf(difficulty) + 1) % levels.length]);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (selected) select(selected);
    hideHint();
  }
});

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
      line([start, end]);
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
function syncBoxSize() {
  if (difficulty === 'schwer') {
    tree.style.removeProperty('--item-width');
    tree.style.removeProperty('--item-height');
  }
  const token = bank.querySelector('.token');
  if (token) {
    const rect = token.getBoundingClientRect();
    tree.style.setProperty('--item-width', `${rect.width}px`);
    tree.style.setProperty('--item-height', `${rect.height}px`);
  }
  drawConnectors();
}
new ResizeObserver(syncBoxSize).observe(bank);
new ResizeObserver(drawConnectors).observe(tree);

const hint = document.querySelector('#hint');
let hintTimer;
let hintAppearances = 0;
let hintVisible = false;
function hideHint() {
  clearTimeout(hintTimer);
  hint.classList.add('visually-hidden');
  hintVisible = false;
}
function scheduleHint() {
  clearTimeout(hintTimer);
  if (hintVisible || hintAppearances >= 3) return;
  hintTimer = setTimeout(() => {
    hint.classList.remove('visually-hidden');
    hintVisible = true;
    hintAppearances++;
  }, 1200);
}
function leaveHint() {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(hideHint, 200);
}
for (const region of [bank, document.querySelector('.diagram-scroll')]) {
  region.addEventListener('pointerenter', scheduleHint);
  region.addEventListener('pointerleave', leaveHint);
  region.addEventListener('focusin', scheduleHint);
  region.addEventListener('focusout', event => {
    if (!region.contains(event.relatedTarget)) leaveHint();
  });
  region.addEventListener('dragstart', hideHint);
  region.addEventListener('pointerdown', hideHint);
}
hint.addEventListener('pointerenter', () => clearTimeout(hintTimer));
hint.addEventListener('pointerleave', leaveHint);

setDifficulty(new URLSearchParams(window.location.search).get('difficulty'), false);
