

const $ = (id) => document.getElementById(id);

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey() {
  return dateKey(new Date());
}

function mondayOf(d) {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const dow = day.getDay();
  const diff = (dow === 0 ? -6 : 1 - dow);
  day.setDate(day.getDate() + diff);
  return day;
}

function weekDays(anchor) {
  const mon = mondayOf(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

const DAY_NAMES  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtWeekLabel(days) {
  const s = days[0], e = days[6];
  const sm = MONTH_ABBR[s.getMonth()], em = MONTH_ABBR[e.getMonth()];
  if (sm === em) return `${sm} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${e.getFullYear()}`;
}

// ── Storage ───────────────────────────────────────────────
const STORAGE_KEY = 'habitflow_v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { habits: [], checks: {} };
  } catch {
    return { habits: [], checks: {} };
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = load();
let viewAnchor = new Date();

// ── Streak ────────────────────────────────────────────────
function calcStreak(habitId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const cur = new Date(today);
  while (true) {
    const k = `${habitId}_${dateKey(cur)}`;
    if (state.checks[k]) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ── Render ────────────────────────────────────────────────
function render() {
  const days = weekDays(viewAnchor);
  const today = todayKey();
  const isCurrentWeek = days.some(d => dateKey(d) === today);

  $('weekLabel').textContent = fmtWeekLabel(days);
  $('todayBtn').classList.toggle('is-current', isCurrentWeek);

  const hasHabits = state.habits.length > 0;
  $('emptyState').style.display  = hasHabits ? 'none'  : 'block';
  $('gridWrapper').style.display = hasHabits ? 'block' : 'none';

  if (!hasHabits) return;
  renderHeader(days, today);
  renderBody(days, today);
}

function renderHeader(days, today) {
  const row = $('gridHeader');
  [...row.querySelectorAll('.day-head, .streak-head, .actions-head')].forEach(el => el.remove());

  days.forEach((d, i) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.className = 'day-head' + (dateKey(d) === today ? ' is-today' : '');
    th.innerHTML = `<span class="day-name">${DAY_NAMES[i]}</span><span class="day-num">${d.getDate()}</span>`;
    row.appendChild(th);
  });

  const thStreak = document.createElement('th');
  thStreak.scope = 'col';
  thStreak.className = 'streak-head';
  thStreak.textContent = 'Streak';
  row.appendChild(thStreak);

  const thAct = document.createElement('th');
  thAct.scope = 'col';
  thAct.className = 'actions-head';
  row.appendChild(thAct);
}

function renderBody(days, today) {
  const tbody = $('gridBody');
  tbody.innerHTML = '';

  state.habits.forEach(habit => {
    const tr = document.createElement('tr');
    tr.className = 'habit-row';
    tr.dataset.id = habit.id;

    const tdName = document.createElement('td');
    tdName.className = 'habit-name-cell';
    tdName.innerHTML = `<span class="habit-name-text" title="${escHtml(habit.name)}">${escHtml(habit.name)}</span>`;
    tr.appendChild(tdName);

    days.forEach(d => {
      const key = `${habit.id}_${dateKey(d)}`;
      const dk = dateKey(d);
      const isToday  = dk === today;
      const isFuture = dk > today;
      const checked  = !!state.checks[key];

      const td = document.createElement('td');
      td.className = 'check-cell' +
        (isToday  ? ' is-today'  : '') +
        (isFuture ? ' is-future' : '');

      const btn = document.createElement('button');
      btn.className = 'check-btn' + (checked ? ' checked' : '');
      btn.setAttribute('aria-pressed', checked ? 'true' : 'false');
      btn.innerHTML = checked ? '&#10003;' : '';
      if (isFuture) btn.disabled = true;

      btn.addEventListener('click', () => toggleCheck(habit.id, dk, btn, tr));
      td.appendChild(btn);
      tr.appendChild(td);
    });

    const streak = calcStreak(habit.id);
    const tdStreak = document.createElement('td');
    tdStreak.className = 'streak-cell';
    tdStreak.innerHTML = renderStreakBadge(streak);
    tr.appendChild(tdStreak);

    const tdAct = document.createElement('td');
    tdAct.className = 'actions-cell';
    tdAct.innerHTML = `
      <div class="row-actions">
        <button class="icon-btn rename" title="Rename">&#9998;</button>
        <button class="icon-btn del"    title="Delete">&#10005;</button>
      </div>`;
    tdAct.querySelector('.rename').addEventListener('click', () => openRenameModal(habit.id, habit.name));
    tdAct.querySelector('.del').addEventListener('click',    () => deleteHabit(habit.id));
    tr.appendChild(tdAct);

    tbody.appendChild(tr);
  });
}

function renderStreakBadge(n) {
  if (n === 0) return `<span class="streak-badge">—</span>`;
  const cls = n >= 3 ? 'streak-badge hot fire' : 'streak-badge hot check-mark';
  return `<span class="${cls}">${n}d</span>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Actions ───────────────────────────────────────────────
function toggleCheck(habitId, dk, btn, tr) {
  const key = `${habitId}_${dk}`;
  const nowChecked = !state.checks[key];
  if (nowChecked) {
    state.checks[key] = true;
  } else {
    delete state.checks[key];
  }
  save();
  btn.classList.toggle('checked', nowChecked);
  btn.innerHTML = nowChecked ? '&#10003;' : '';
  btn.setAttribute('aria-pressed', nowChecked ? 'true' : 'false');
  tr.querySelector('.streak-cell').innerHTML = renderStreakBadge(calcStreak(habitId));
}

function addHabit() {
  const input = $('habitInput');
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }
  const id = 'h_' + Date.now();
  state.habits.push({ id, name });
  save();
  input.value = '';
  render();
}

function deleteHabit(id) {
  if (!confirm('Delete this habit and all its history?')) return;
  state.habits = state.habits.filter(h => h.id !== id);
  Object.keys(state.checks).forEach(k => {
    if (k.startsWith(id + '_')) delete state.checks[k];
  });
  save();
  render();
}

// ── Rename Modal ──────────────────────────────────────────
let _renameId = null;

function openRenameModal(id, currentName) {
  _renameId = id;
  $('renameInput').value = currentName;
  $('modalBackdrop').style.display = 'flex';
  setTimeout(() => $('renameInput').focus(), 50);
}

function closeModal() {
  _renameId = null;
  $('modalBackdrop').style.display = 'none';
}

function saveRename() {
  const name = $('renameInput').value.trim();
  if (!name || !_renameId) { $('renameInput').focus(); return; }
  const habit = state.habits.find(h => h.id === _renameId);
  if (habit) {
    habit.name = name;
    save();
    render();
  }
  closeModal();
}

// ── Week Navigation ───────────────────────────────────────
function shiftWeek(delta) {
  viewAnchor = new Date(viewAnchor);
  viewAnchor.setDate(viewAnchor.getDate() + delta * 7);
  render();
}

function goToday() {
  viewAnchor = new Date();
  render();
}

// ── Event Listeners ───────────────────────────────────────
$('addHabitBtn').addEventListener('click', addHabit);
$('habitInput').addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });

$('prevWeek').addEventListener('click', () => shiftWeek(-1));
$('nextWeek').addEventListener('click', () => shiftWeek(+1));
$('todayBtn').addEventListener('click', goToday);

$('modalCancel').addEventListener('click', closeModal);
$('modalSave').addEventListener('click', saveRename);
$('renameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter')  saveRename();
  if (e.key === 'Escape') closeModal();
});
$('modalBackdrop').addEventListener('click', e => {
  if (e.target === $('modalBackdrop')) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('modalBackdrop').style.display === 'flex') closeModal();
});

// ── Init ──────────────────────────────────────────────────
render();
