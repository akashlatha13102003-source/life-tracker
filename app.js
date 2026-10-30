import { createStore } from './store.js';

/* ================= Helpers ================= */

const app = document.getElementById('app');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
const rupees = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const shortRupees = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L`
  : n >= 1000 ? `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : rupees(n));

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const isToday = (t) => sameDay(t, new Date());
const sameMonth = (a, b) => {
  const x = new Date(a); const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
};
const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
};
const sameWeek = (t) => startOfWeek(t).getTime() === startOfWeek().getTime();
const last7 = () => Array.from({ length: 7 }, (_, i) => {
  const d = startOfDay(); d.setDate(d.getDate() - (6 - i)); return d;
});
const weekday = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'narrow' });
const fmtDate = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmtLongDate = (t) => new Date(t).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const toLocalInput = (t) => {
  const d = new Date(t); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const toDateInput = (t) => toLocalInput(t).slice(0, 10);
const fromLocalInput = (s) => { const t = new Date(s).getTime(); return Number.isFinite(t) ? t : Date.now(); };
const clean = (s, max = 200) => String(s ?? '').trim().slice(0, max);

/* ================= Catalog ================= */

const WORKOUT_TYPES = [
  { name: 'Gym', icon: '🏋️' }, { name: 'Run', icon: '🏃' }, { name: 'Walk', icon: '🚶' },
  { name: 'Yoga', icon: '🧘' }, { name: 'Cycling', icon: '🚴' }, { name: 'Sports', icon: '⚽' },
  { name: 'Swim', icon: '🏊' }, { name: 'Other', icon: '🤸' },
];
const INTENSITIES = ['Easy', 'Medium', 'Hard'];
const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#ff9f0a' },
  { name: 'Travel', icon: '🚗', color: '#0a84ff' },
  { name: 'Shopping', icon: '🛍️', color: '#bf5af2' },
  { name: 'Bills', icon: '🧾', color: '#ff453a' },
  { name: 'Entertainment', icon: '🎬', color: '#ff375f' },
  { name: 'Health', icon: '💊', color: '#30d158' },
  { name: 'Others', icon: '📦', color: '#8e8e93' },
];
const PAYMENTS = ['UPI', 'Cash', 'Card', 'Bank'];
const GOAL_TYPES = ['Fitness', 'Money', 'Other'];
const GOAL_UNITS = ['kg', '₹', 'km', 'workouts', 'days', 'steps'];

const typeIcon = (t) => WORKOUT_TYPES.find((x) => x.name === t)?.icon ?? '🤸';
const cat = (c) => CATEGORIES.find((x) => x.name === c) ?? CATEGORIES[CATEGORIES.length - 1];
const goalValue = (v, unit) => (unit === '₹' ? rupees(v) : `${Math.round(v * 10) / 10} ${unit}`);

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'workout', label: 'Workout', icon: '💪' },
  { id: 'money', label: 'Money', icon: '💰' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'goals', label: 'Goals', icon: '🎯' },
];

/* ================= State ================= */

let store;
let signedIn = false;
let route = TABS.some((t) => t.id === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
let moneyMonth = new Date();

const data = () => store.data;
const write = (promise, okMessage) => {
  if (okMessage) toast(okMessage);
  Promise.resolve(promise).catch((err) => toast(`Could not save: ${err?.message ?? err}`));
};

/* ================= Small UI pieces ================= */

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

const stat = (icon, label, value) => `
  <div class="stat"><div class="stat-icon">${icon}</div>
  <div class="stat-value">${esc(value)}</div><div class="stat-label">${esc(label)}</div></div>`;

const progress = (frac, cls) => `<div class="progress"><div class="${cls}" style="width:${Math.max(0, Math.min(frac, 1)) * 100}%"></div></div>`;

function bars(values, days, cls, fmt) {
  const max = Math.max(...values, 1);
  return `<div class="bars">${values.map((v, i) => `
    <div class="bar-col">
      <div class="bar-val">${v ? esc(fmt(v)) : ''}</div>
      <div class="bar-track"><div class="bar ${v ? cls : 'empty'}" style="height:${v ? (v / max) * 100 : 2}%"></div></div>
      <div class="bar-label">${weekday(days[i])}</div>
    </div>`).join('')}</div>`;
}

function donut(items) {
  const total = sum(items, (i) => i.total);
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segs = items.map((i) => {
    const len = (i.total / total) * c;
    const gap = items.length > 1 ? Math.min(1.2, len / 3) : 0;
    const s = `<circle r="${r}" cx="50" cy="50" fill="none" stroke="${i.color}" stroke-width="14"
      stroke-dasharray="${Math.max(len - gap, 0.01)} ${c}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)"/>`;
    offset += len;
    return s;
  }).join('');
  return `<div class="donut-wrap"><svg viewBox="0 0 100 100" class="donut" role="img" aria-label="Spending by category">
    ${segs}<text x="50" y="51" text-anchor="middle" class="donut-total">${esc(shortRupees(total))}</text>
    <text x="50" y="61" text-anchor="middle" class="donut-sub">this month</text></svg></div>`;
}

function streak(workouts) {
  const days = new Set(workouts.map((w) => startOfDay(w.at).getTime()));
  const day = startOfDay();
  if (!days.has(day.getTime())) day.setDate(day.getDate() - 1);
  let n = 0;
  while (days.has(day.getTime())) { n += 1; day.setDate(day.getDate() - 1); }
  return n;
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function budgetCard(spent, budget, extra = '') {
  const pct = budget > 0 ? spent / budget : 0;
  const cls = pct > 1 ? 'red' : pct > 0.8 ? 'orange' : 'green';
  const msg = pct > 1 ? `⚠️ Over budget by ${rupees(spent - budget)}`
    : pct > 0.8 ? `Heads up: ${Math.round(pct * 100)}% of your budget used`
      : `${rupees(budget - spent)} left this month`;
  const msgCls = pct > 1 ? 'text-red' : pct > 0.8 ? 'text-orange' : 'muted';
  return `<div class="big">${rupees(spent)} <span class="muted">of ${rupees(budget)}</span></div>
    ${progress(pct, cls)}<p class="small ${msgCls}">${msg}</p>${extra}`;
}

const sortedGoals = () => [...data().goals].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
const goalProgress = (g) => (g.target > 0 ? Math.max(0, Math.min(g.current / g.target, 1)) : 0);

/* ================= Views ================= */

function homeView() {
  const d = data();
  const s = d.settings;
  const days = last7();
  const workedToday = d.workouts.some((w) => isToday(w.at));
  const spentToday = sum(d.expenses.filter((e) => isToday(e.at)), (e) => e.amount);
  const spentMonth = sum(d.expenses.filter((e) => sameMonth(e.at, Date.now())), (e) => e.amount);
  const waterToday = sum(d.water.filter((w) => isToday(w.at)), (w) => w.ml);
  const mins = days.map((day) => sum(d.workouts.filter((w) => sameDay(w.at, day)), (w) => w.minutes));
  const spend = days.map((day) => sum(d.expenses.filter((e) => sameDay(e.at, day)), (e) => e.amount));

  return `
    <div class="grid2">
      ${stat('🏃', 'Workout today', workedToday ? 'Done ✅' : 'Not yet')}
      ${(() => { const n = streak(d.workouts); return stat('🔥', 'Workout streak', `${n} ${n === 1 ? 'day' : 'days'}`); })()}
      ${stat('💸', 'Spent today', rupees(spentToday))}
      ${stat('💧', 'Water today', `${waterToday} / ${s.waterGoal} ml`)}
    </div>
    <div class="quick">
      <button class="quick-btn orange" data-action="add-workout">＋ Workout</button>
      <button class="quick-btn green" data-action="add-expense">＋ Expense</button>
      <button class="quick-btn blue" data-action="water-add" data-ml="250">💧 250 ml</button>
    </div>
    <section class="card"><h3>This month's budget</h3>${budgetCard(spentMonth, s.budget)}</section>
    <section class="card"><h3>Workout minutes · last 7 days</h3>${bars(mins, days, 'orange', (v) => v)}</section>
    <section class="card"><h3>Spending · last 7 days</h3>${bars(spend, days, 'green', shortRupees)}</section>
    ${d.goals.length ? `<section class="card"><h3>Goals</h3>${sortedGoals().map((g) => `
      <div class="goal"><div class="goal-top"><span>${esc(g.title)}</span><span class="muted">${Math.round(goalProgress(g) * 100)}%</span></div>
      ${progress(goalProgress(g), g.type === 'Money' ? 'green' : 'orange')}</div>`).join('')}</section>` : ''}`;
}

function workoutView() {
  const ws = [...data().workouts].sort((a, b) => b.at - a.at);
  const week = ws.filter((w) => sameWeek(w.at));
  const best = {};
  for (const w of ws) {
    for (const e of w.exercises ?? []) {
      if (!(e.kg > 0)) continue;
      const key = clean(e.name).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
      best[key] = Math.max(best[key] ?? 0, e.kg);
    }
  }
  const pbs = Object.entries(best).sort(([a], [b]) => a.localeCompare(b));

  return `
    <section class="card">
      <h3>This week</h3>
      <div class="summary">
        <div><b>${week.length}</b><span>sessions</span></div>
        <div><b>${sum(week, (w) => w.minutes)}</b><span>minutes</span></div>
        <div><b>${sum(week, (w) => w.calories)}</b><span>kcal</span></div>
      </div>
      <div class="dots">${last7().map((day) => {
        const done = ws.some((w) => sameDay(w.at, day));
        return `<div class="dot-col"><div class="dot ${done ? 'done' : ''}">${done ? '✓' : ''}</div><span>${weekday(day)}</span></div>`;
      }).join('')}</div>
    </section>
    <button class="primary orange-bg" data-action="add-workout">＋ Log workout</button>
    ${pbs.length ? `<section class="card"><h3>Personal bests 🏆</h3>${pbs.map(([name, kg]) => `
      <div class="row"><span>${esc(name)}</span><b>${kg} kg</b></div>`).join('')}</section>` : ''}
    <section class="card list"><h3>History</h3>
      ${ws.length ? ws.map((w) => `
        <button class="item" data-action="workout-open" data-id="${esc(w.id)}">
          <span class="item-icon">${typeIcon(w.type)}</span>
          <span class="item-main"><b>${esc(w.type)}</b><small>${fmtDate(w.at)} · ${fmtTime(w.at)}</small></span>
          <span class="item-end"><b>${w.minutes} min</b><small>${esc(w.intensity)}</small></span>
        </button>`).join('') : '<p class="muted">No workouts yet. Log your first one 💪</p>'}
    </section>`;
}

function moneyView() {
  const d = data();
  const budget = d.settings.budget;
  const isCurrent = sameMonth(moneyMonth, Date.now());
  const list = d.expenses.filter((e) => sameMonth(e.at, moneyMonth)).sort((a, b) => b.at - a.at);
  const total = sum(list, (e) => e.amount);
  const byCat = CATEGORIES
    .map((c) => ({ ...c, total: sum(list.filter((e) => cat(e.category).name === c.name), (e) => e.amount) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const extra = isCurrent ? `<div class="mini">
      <div><b>${rupees(sum(d.expenses.filter((e) => isToday(e.at)), (e) => e.amount))}</b><span>Today</span></div>
      <div><b>${rupees(sum(d.expenses.filter((e) => sameWeek(e.at)), (e) => e.amount))}</b><span>This week</span></div>
    </div>` : '';

  let lastDay = '';
  const rows = list.map((e) => {
    const day = fmtLongDate(e.at);
    const head = day !== lastDay ? `<p class="day-head">${esc(isToday(e.at) ? 'Today' : day)}</p>` : '';
    lastDay = day;
    return `${head}<button class="item" data-action="expense-open" data-id="${esc(e.id)}">
      <span class="item-icon">${cat(e.category).icon}</span>
      <span class="item-main"><b>${esc(e.note || e.category)}</b><small>${esc(e.category)} · ${esc(e.payment)} · ${fmtTime(e.at)}</small></span>
      <span class="item-end"><b>${rupees(e.amount)}</b></span></button>`;
  }).join('');

  return `
    <section class="card">
      <div class="month-nav">
        <button data-action="month-prev" aria-label="Previous month">‹</button>
        <h3 style="margin:0">${moneyMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
        <button data-action="month-next" aria-label="Next month" ${isCurrent ? 'disabled' : ''}>›</button>
      </div>
      ${budgetCard(total, budget, extra)}
    </section>
    <button class="primary green-bg" data-action="add-expense">＋ Add expense</button>
    ${byCat.length ? `<section class="card"><h3>Where your money went</h3>${donut(byCat)}
      ${byCat.map((c) => `<div class="row"><span><span class="swatch" style="background:${c.color}"></span>${c.icon} ${esc(c.name)}</span>
        <span><b>${rupees(c.total)}</b> <span class="muted small">${Math.round((c.total / total) * 100)}%</span></span></div>`).join('')}
    </section>` : ''}
    <section class="card list"><h3>Expenses</h3>
      ${rows || '<p class="muted">Nothing spent this month yet.</p>'}
    </section>`;
}

function waterView() {
  const d = data();
  const goal = d.settings.waterGoal;
  const today = d.water.filter((w) => isToday(w.at)).sort((a, b) => b.at - a.at);
  const total = sum(today, (w) => w.ml);
  const frac = goal > 0 ? Math.min(total / goal, 1) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;

  return `
    <section class="card">
      <div class="ring-wrap"><svg viewBox="0 0 100 100" class="ring" role="img" aria-label="${total} of ${goal} ml">
        <circle class="ring-track" r="${r}" cx="50" cy="50" fill="none" stroke-width="9"/>
        <circle class="ring-fill" r="${r}" cx="50" cy="50" fill="none" stroke-width="9" stroke-linecap="round"
          stroke-dasharray="${frac * c} ${c}" transform="rotate(-90 50 50)"/>
        <text x="50" y="48" text-anchor="middle" class="ring-big">${total} ml</text>
        <text x="50" y="60" text-anchor="middle" class="ring-small">${total >= goal ? 'Goal reached 🎉' : `of ${goal} ml`}</text>
      </svg></div>
      <div class="water-btns">
        <button data-action="water-add" data-ml="150">+150</button>
        <button data-action="water-add" data-ml="250">+250</button>
        <button data-action="water-add" data-ml="500">+500</button>
        <button data-action="water-custom">Other</button>
      </div>
    </section>
    <section class="card">
      <h3>Daily goal</h3>
      <div class="stepper">
        <button data-action="water-goal" data-step="-250" aria-label="Decrease goal">−</button>
        <b>${goal} ml</b>
        <button data-action="water-goal" data-step="250" aria-label="Increase goal">＋</button>
      </div>
    </section>
    <section class="card">
      <h3>⏰ Reminders</h3>
      <p class="muted" style="margin:0 0 10px">Get a “drink water” alert on your iPhone every day, even when this app is closed. It uses the free Shortcuts app on your phone.</p>
      <button class="secondary" data-action="water-reminders">How to set up reminders</button>
    </section>
    <section class="card list"><h3>Today</h3>
      ${today.length ? today.map((w) => `
        <div class="row"><span>💧 ${w.ml} ml</span>
        <span><span class="muted">${fmtTime(w.at)}</span>
        <button class="x-btn" data-action="water-del" data-id="${esc(w.id)}" aria-label="Remove">✕</button></span></div>`).join('')
        : '<p class="muted">No water logged yet today.</p>'}
    </section>`;
}

function goalsView() {
  const goals = sortedGoals();
  return `
    <button class="primary" data-action="goal-add">＋ New goal</button>
    <section class="card list">
      ${goals.length ? goals.map((g) => {
        const p = goalProgress(g);
        const daysLeft = Math.round((startOfDay(g.deadline) - startOfDay()) / 86400000);
        const icon = g.type === 'Money' ? '💰' : g.type === 'Fitness' ? '💪' : '⭐';
        return `<button class="goal" data-action="goal-open" data-id="${esc(g.id)}">
          <div class="goal-top"><span>${icon} ${esc(g.title)}</span>${p >= 1 ? '<span class="text-green">Done 🎉</span>' : `<span class="muted">${Math.round(p * 100)}%</span>`}</div>
          ${progress(p, g.type === 'Money' ? 'green' : 'orange')}
          <div class="goal-meta"><span>${esc(goalValue(g.current, g.unit))} of ${esc(goalValue(g.target, g.unit))}</span>
          <span>${daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Deadline passed'}</span></div>
        </button>`;
      }).join('') : `<h3>No goals yet</h3><p class="muted" style="margin:0">Ideas: “Lose 5 kg by March”, “Save ₹20,000 this month”, “Work out 20 times this month”.</p>`}
    </section>`;
}

const VIEWS = { home: homeView, workout: workoutView, money: moneyView, water: waterView, goals: goalsView };

/* ================= Shell & rendering ================= */

function renderShell() {
  app.innerHTML = `
    <header class="topbar"><h1 id="title"></h1>
      <button class="icon-btn" data-action="settings" aria-label="Settings">⚙️</button></header>
    ${store.mode === 'local' ? '<div class="banner">Test mode: data is saved in this browser only.</div>' : ''}
    <main id="view"></main>
    <nav class="tabbar">${TABS.map((t) => `<button data-tab="${t.id}"><span class="tab-icon">${t.icon}</span><span>${t.label}</span></button>`).join('')}</nav>
    <div id="sheet-root"></div>
    <div id="toast" role="status" aria-live="polite"></div>`;
}

function render() {
  if (!signedIn) return;
  const view = document.getElementById('view');
  if (!view) return;
  const tab = TABS.find((t) => t.id === route) ?? TABS[0];
  document.getElementById('title').textContent = tab.id === 'home' ? greeting() : tab.label;
  view.innerHTML = VIEWS[tab.id]();
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab.id));
}

function go(tab) {
  route = tab;
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  render();
  window.scrollTo(0, 0);
}

/* ================= Sheets ================= */

function openSheet(title, body, onSave, saveLabel = 'Save') {
  const root = document.getElementById('sheet-root');
  root.innerHTML = `
    <div class="backdrop" data-action="sheet-close"></div>
    <form class="sheet" novalidate autocomplete="off">
      <div class="sheet-head">
        <button type="button" class="link" data-action="sheet-close">${onSave ? 'Cancel' : 'Close'}</button>
        <h2>${esc(title)}</h2>
        ${onSave ? `<button type="submit" class="link bold">${esc(saveLabel)}</button>` : '<span></span>'}
      </div>
      <div class="sheet-body">${body}</div>
    </form>`;
  const form = root.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (onSave && onSave(form, new FormData(form)) !== false) closeSheet();
  });
  return form;
}

function closeSheet() {
  const root = document.getElementById('sheet-root');
  if (root) root.innerHTML = '';
}

const radios = (name, options, checked) => `<div class="segmented">${options.map((o) => `
  <label><input type="radio" name="${name}" value="${esc(o)}" ${o === checked ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;

const field = (label, input) => `<div class="field"><label>${label}</label>${input}</div>`;

function workoutForm() {
  openSheet('Log workout', `
    <span class="field-label">Type</span>
    <div class="chips">${WORKOUT_TYPES.map((t, i) => `
      <label class="chip"><input type="radio" name="type" value="${t.name}" ${i === 0 ? 'checked' : ''}><span>${t.icon} ${t.name}</span></label>`).join('')}</div>
    <span class="field-label">Details</span>
    ${field('When', `<input type="datetime-local" name="at" value="${toLocalInput(Date.now())}">`)}
    ${field('Duration (minutes)', '<input type="number" name="minutes" inputmode="numeric" value="45" min="1" max="600">')}
    ${radios('intensity', INTENSITIES, 'Medium')}
    <span class="field-label">Exercises (optional)</span>
    <div id="exercises"></div>
    <button type="button" class="secondary" data-action="add-exercise">＋ Add exercise</button>
    <span class="field-label">Extras (optional)</span>
    ${field('Calories burned', '<input type="number" name="calories" inputmode="numeric" min="0">')}
    ${field('Steps', '<input type="number" name="steps" inputmode="numeric" min="0">')}
    ${field('Notes', '<textarea name="notes" rows="2" maxlength="500"></textarea>')}
  `, (form, f) => {
    const exercises = [...form.querySelectorAll('.exercise')].map((row) => ({
      name: clean(row.querySelector('[name=ex-name]').value, 60),
      sets: Math.max(1, Math.round(num(row.querySelector('[name=ex-sets]').value))),
      reps: Math.max(1, Math.round(num(row.querySelector('[name=ex-reps]').value))),
      kg: Math.max(0, num(row.querySelector('[name=ex-kg]').value)),
    })).filter((e) => e.name);
    write(store.add('workouts', {
      at: fromLocalInput(f.get('at')),
      type: f.get('type') || 'Other',
      minutes: Math.max(1, Math.round(num(f.get('minutes')) || 1)),
      intensity: f.get('intensity') || 'Medium',
      calories: Math.max(0, Math.round(num(f.get('calories')))),
      steps: Math.max(0, Math.round(num(f.get('steps')))),
      notes: clean(f.get('notes'), 500),
      exercises,
    }), 'Workout saved 💪');
  });
}

function addExerciseRow() {
  document.getElementById('exercises')?.insertAdjacentHTML('beforeend', `
    <div class="exercise">
      <input name="ex-name" placeholder="Exercise, e.g. Bench press" maxlength="60">
      <div class="ex-nums">
        <label>Sets<input name="ex-sets" type="number" inputmode="numeric" value="3" min="1"></label>
        <label>Reps<input name="ex-reps" type="number" inputmode="numeric" value="10" min="1"></label>
        <label>Weight (kg)<input name="ex-kg" type="number" inputmode="decimal" step="0.5" min="0" placeholder="0"></label>
      </div>
      <button type="button" class="link text-red" data-action="remove-exercise">Remove</button>
    </div>`);
  document.querySelector('#exercises .exercise:last-child input')?.focus();
}

function workoutDetail(id) {
  const w = data().workouts.find((x) => x.id === id);
  if (!w) return;
  openSheet(`${typeIcon(w.type)} ${w.type}`, `
    <section class="card">
      <div class="row"><span class="muted">When</span><span>${fmtLongDate(w.at)}, ${fmtTime(w.at)}</span></div>
      <div class="row"><span class="muted">Duration</span><span>${w.minutes} min</span></div>
      <div class="row"><span class="muted">Intensity</span><span>${esc(w.intensity)}</span></div>
      ${w.calories ? `<div class="row"><span class="muted">Calories</span><span>${w.calories} kcal</span></div>` : ''}
      ${w.steps ? `<div class="row"><span class="muted">Steps</span><span>${w.steps.toLocaleString('en-IN')}</span></div>` : ''}
    </section>
    ${(w.exercises ?? []).length ? `<span class="field-label">Exercises</span><section class="card">${w.exercises.map((e) => `
      <div class="row"><b>${esc(e.name)}</b><span>${e.sets} × ${e.reps}${e.kg ? ` @ ${e.kg} kg` : ''}</span></div>`).join('')}</section>` : ''}
    ${w.notes ? `<span class="field-label">Notes</span><section class="card">${esc(w.notes)}</section>` : ''}
    <button type="button" class="danger" data-action="delete" data-col="workouts" data-id="${esc(w.id)}">Delete workout</button>
  `);
}

function expenseForm() {
  openSheet('Add expense', `
    <div class="amount"><span>₹</span><input name="amount" inputmode="decimal" placeholder="0" aria-label="Amount" autofocus></div>
    <span class="field-label">Category</span>
    <div class="chips grid4">${CATEGORIES.map((c, i) => `
      <label class="chip"><input type="radio" name="category" value="${c.name}" ${i === 0 ? 'checked' : ''}><span><i>${c.icon}</i>${c.name}</span></label>`).join('')}</div>
    <span class="field-label">Paid with</span>
    ${radios('payment', PAYMENTS, 'UPI')}
    <span class="field-label">Details</span>
    ${field('When', `<input type="datetime-local" name="at" value="${toLocalInput(Date.now())}">`)}
    ${field('Note (optional)', '<input name="note" maxlength="80" placeholder="e.g. Lunch with friends">')}
  `, (form, f) => {
    const amount = Math.round(num(f.get('amount')) * 100) / 100;
    if (!(amount > 0)) { toast('Enter an amount first'); form.querySelector('[name=amount]').focus(); return false; }
    write(store.add('expenses', {
      at: fromLocalInput(f.get('at')),
      amount,
      category: f.get('category') || 'Others',
      payment: f.get('payment') || 'UPI',
      note: clean(f.get('note'), 80),
    }), `Saved ${rupees(amount)}`);
  });
  setTimeout(() => document.querySelector('.amount input')?.focus(), 50);
}

function expenseDetail(id) {
  const e = data().expenses.find((x) => x.id === id);
  if (!e) return;
  openSheet('Expense', `
    <section class="card">
      <div class="big">${rupees(e.amount)}</div>
      <div class="row"><span class="muted">Category</span><span>${cat(e.category).icon} ${esc(e.category)}</span></div>
      <div class="row"><span class="muted">Paid with</span><span>${esc(e.payment)}</span></div>
      <div class="row"><span class="muted">When</span><span>${fmtLongDate(e.at)}, ${fmtTime(e.at)}</span></div>
      ${e.note ? `<div class="row"><span class="muted">Note</span><span>${esc(e.note)}</span></div>` : ''}
    </section>
    <button type="button" class="danger" data-action="delete" data-col="expenses" data-id="${esc(e.id)}">Delete expense</button>
  `);
}

function waterCustom() {
  openSheet('Add water', field('Amount (ml)', '<input name="ml" type="number" inputmode="numeric" min="10" max="3000" placeholder="e.g. 300" autofocus>'),
    (form, f) => {
      const ml = Math.round(num(f.get('ml')));
      if (!(ml > 0 && ml <= 3000)) { toast('Enter between 1 and 3000 ml'); return false; }
      write(store.add('water', { at: Date.now(), ml }), `Logged ${ml} ml 💧`);
    }, 'Add');
  setTimeout(() => document.querySelector('[name=ml]')?.focus(), 50);
}

function remindersHelp() {
  const times = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];
  openSheet('Water reminders', `
    <p class="muted" style="margin-top:0">Your iPhone's free <b>Shortcuts</b> app can alert you at fixed times every day. Do this once per reminder time (about 1 minute each).</p>
    <ol class="steps">
      <li>Open the <b>Shortcuts</b> app → tap <b>Automation</b> at the bottom.</li>
      <li>Tap <b>＋</b> (or <b>New Automation</b>) → choose <b>Time of Day</b>.</li>
      <li>Set the time (e.g. <b>8:00 AM</b>), choose <b>Daily</b>, and select <b>Run Immediately</b>. Turn <b>off</b> “Notify When Run”. Tap <b>Next</b>.</li>
      <li>Tap <b>New Blank Automation</b> → <b>Add Action</b> → search <b>Show Notification</b> and add it.</li>
      <li>Tap the word <b>Hello World!</b> and type: <b>Time to drink water 💧</b> → tap <b>Done</b>.</li>
      <li>Repeat for your other times.</li>
    </ol>
    <span class="field-label">Suggested times</span>
    <section class="card">${times.map((t) => `<div class="row"><span>⏰ ${t}</span><span class="muted">💧 250 ml</span></div>`).join('')}</section>
    <p class="muted small">Tip: when the alert comes, open Life Tracker and tap <b>+250</b> to log it.</p>
  `);
}

function goalForm(id) {
  const g = id ? data().goals.find((x) => x.id === id) : null;
  const deadline = g?.deadline ?? (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.getTime(); })();
  openSheet(g ? 'Update goal' : 'New goal', `
    ${field('Goal', `<input name="title" maxlength="80" placeholder="e.g. Save for a trip" value="${esc(g?.title ?? '')}">`)}
    ${radios('type', GOAL_TYPES, g?.type ?? 'Fitness')}
    <span class="field-label">Target</span>
    ${field('Target amount', `<input name="target" inputmode="decimal" value="${g ? esc(g.target) : ''}" placeholder="e.g. 20000">`)}
    ${field('Unit', `<select name="unit">${GOAL_UNITS.map((u) => `<option ${u === (g?.unit ?? 'kg') ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`)}
    ${field('Deadline', `<input type="date" name="deadline" value="${toDateInput(deadline)}">`)}
    <span class="field-label">Progress so far</span>
    ${field('Current', `<input name="current" inputmode="decimal" value="${esc(g?.current ?? 0)}">`)}
    ${g ? `<button type="button" class="danger" data-action="delete" data-col="goals" data-id="${esc(g.id)}">Delete goal</button>` : ''}
  `, (form, f) => {
    const title = clean(f.get('title'), 80);
    const target = num(f.get('target'));
    if (!title) { toast('Give your goal a name'); return false; }
    if (!(target > 0)) { toast('Enter a target amount'); return false; }
    const values = {
      title,
      type: f.get('type') || 'Other',
      target,
      current: Math.max(0, num(f.get('current'))),
      unit: f.get('unit') || 'kg',
      deadline: fromLocalInput(`${f.get('deadline')}T23:59`),
    };
    if (g) write(store.update('goals', g.id, values), 'Goal updated');
    else write(store.add('goals', { ...values, createdAt: Date.now() }), 'Goal added 🎯');
  });
}

function settingsSheet() {
  const s = data().settings;
  const user = store.user;
  openSheet('Settings', `
    <span class="field-label">Money</span>
    ${field('Monthly budget (₹)', `<input name="budget" inputmode="numeric" value="${esc(s.budget)}">`)}
    <span class="field-label">Water</span>
    ${field('Daily water goal (ml)', `<input name="waterGoal" inputmode="numeric" value="${esc(s.waterGoal)}">`)}
    <span class="field-label">Account</span>
    <section class="card">
      <div class="row"><span class="muted">Signed in as</span><span>${esc(user?.email ?? '—')}</span></div>
      ${store.mode === 'cloud' ? `<div class="row"><span class="muted">User ID</span><span class="small" style="margin:0;word-break:break-all">${esc(user?.uid)}</span></div>` : ''}
      <div class="row"><span class="muted">Data saved</span><span>${store.mode === 'cloud' ? '☁️ Your private Firebase database' : '📱 This browser only'}</span></div>
    </section>
    ${store.mode === 'cloud' ? '<button type="button" class="secondary" data-action="copy-uid">Copy my User ID</button>' : ''}
    <button type="button" class="secondary" data-action="export">Download a backup of my data</button>
    ${store.mode === 'cloud' ? '<button type="button" class="danger" data-action="signout">Sign out</button>' : ''}
  `, (form, f) => {
    const budget = Math.round(num(f.get('budget')));
    const waterGoal = Math.round(num(f.get('waterGoal')));
    if (!(budget > 0)) { toast('Enter a budget above ₹0'); return false; }
    if (!(waterGoal >= 500 && waterGoal <= 8000)) { toast('Water goal should be 500 – 8000 ml'); return false; }
    write(store.saveSettings({ budget, waterGoal }), 'Settings saved');
  });
}

function exportBackup() {
  const d = data();
  const backup = { exportedAt: new Date().toISOString(), settings: d.settings, workouts: d.workouts, expenses: d.expenses, water: d.water, goals: d.goals };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `life-tracker-backup-${toDateInput(Date.now())}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ================= Events ================= */

const ACTIONS = {
  'settings': () => settingsSheet(),
  'sheet-close': () => closeSheet(),
  'add-workout': () => workoutForm(),
  'add-exercise': () => addExerciseRow(),
  'remove-exercise': (el) => el.closest('.exercise')?.remove(),
  'workout-open': (el) => workoutDetail(el.dataset.id),
  'add-expense': () => expenseForm(),
  'expense-open': (el) => expenseDetail(el.dataset.id),
  'month-prev': () => { moneyMonth = new Date(moneyMonth.getFullYear(), moneyMonth.getMonth() - 1, 1); render(); },
  'month-next': () => { moneyMonth = new Date(moneyMonth.getFullYear(), moneyMonth.getMonth() + 1, 1); render(); },
  'water-add': (el) => write(store.add('water', { at: Date.now(), ml: Number(el.dataset.ml) }), `Logged ${el.dataset.ml} ml 💧`),
  'water-custom': () => waterCustom(),
  'water-del': (el) => write(store.remove('water', el.dataset.id)),
  'water-goal': (el) => {
    const next = Math.min(8000, Math.max(500, data().settings.waterGoal + Number(el.dataset.step)));
    write(store.saveSettings({ waterGoal: next }));
  },
  'water-reminders': () => remindersHelp(),
  'goal-add': () => goalForm(),
  'goal-open': (el) => goalForm(el.dataset.id),
  'delete': (el) => {
    if (!confirm('Delete this? This cannot be undone.')) return;
    write(store.remove(el.dataset.col, el.dataset.id), 'Deleted');
    closeSheet();
  },
  'copy-uid': async () => {
    try { await navigator.clipboard.writeText(store.user.uid); toast('User ID copied'); } catch { toast('Could not copy. Select it and copy manually.'); }
  },
  'export': () => exportBackup(),
  'signout': async () => { closeSheet(); await store.signOut(); },
};

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { go(tab.dataset.tab); return; }
  const el = e.target.closest('[data-action]');
  if (el && ACTIONS[el.dataset.action]) {
    e.preventDefault();
    ACTIONS[el.dataset.action](el);
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (TABS.some((t) => t.id === tab) && tab !== route) go(tab);
});

/* ================= Sign in ================= */

const AUTH_ERRORS = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Use a stronger password (at least 8 characters).',
  'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
  'auth/network-request-failed': 'No internet connection.',
  'auth/admin-restricted-operation': 'New accounts are turned off for this app.',
  'auth/operation-not-allowed': 'Email sign-in isn’t turned on in Firebase yet.',
};
const authMessage = (err) => AUTH_ERRORS[err?.code] ?? err?.message ?? 'Something went wrong.';

function renderLogin(message = '') {
  signedIn = false;
  app.innerHTML = `
    <div class="login">
      <div class="login-logo">💪💰💧</div>
      <h1>Life Tracker</h1>
      <p class="muted">Sign in to see your data</p>
      <form id="login-form" novalidate>
        <div class="field"><label>Email</label><input name="email" type="email" autocomplete="username" inputmode="email" required></div>
        <div class="field"><label>Password</label><input name="password" type="password" autocomplete="current-password" required></div>
        <p class="error" id="login-error">${esc(message)}</p>
        <button class="primary" type="submit">Sign in</button>
        <button class="secondary" type="button" id="signup-btn">Create my account</button>
        <button class="link" type="button" id="reset-btn" style="width:100%;margin-top:8px">Forgot password?</button>
      </form>
    </div>
    <div id="toast" role="status" aria-live="polite"></div>`;

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const values = () => ({ email: clean(form.email.value, 120), password: form.password.value });
  const busy = (on) => form.querySelectorAll('button').forEach((b) => { b.disabled = on; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = values();
    if (!email || !password) { errorEl.textContent = 'Enter your email and password.'; return; }
    busy(true);
    try { await store.signIn(email, password); } catch (err) { errorEl.textContent = authMessage(err); busy(false); }
  });

  document.getElementById('signup-btn').addEventListener('click', async () => {
    const { email, password } = values();
    if (!email) { errorEl.textContent = 'Enter your email first.'; return; }
    if (password.length < 8) { errorEl.textContent = 'Choose a password with at least 8 characters.'; return; }
    busy(true);
    try { await store.signUp(email, password); } catch (err) { errorEl.textContent = authMessage(err); busy(false); }
  });

  document.getElementById('reset-btn').addEventListener('click', async () => {
    const { email } = values();
    if (!email) { errorEl.textContent = 'Enter your email, then tap “Forgot password?” again.'; return; }
    try { await store.resetPassword(email); errorEl.textContent = ''; toast('Password reset email sent'); } catch (err) { errorEl.textContent = authMessage(err); }
  });
}

/* ================= Quick add from a link (e.g. ?water=250) ================= */

function handleLinkActions() {
  const params = new URLSearchParams(location.search);
  const ml = Math.round(num(params.get('water')));
  if (!params.has('water')) return;
  history.replaceState(null, '', `${location.pathname}#water`);
  route = 'water';
  if (ml > 0 && ml <= 3000) write(store.add('water', { at: Date.now(), ml }), `Logged ${ml} ml 💧`);
  render();
}

/* ================= Start ================= */

async function boot() {
  try {
    store = await createStore(() => render());
  } catch (err) {
    app.innerHTML = `<div class="login"><h1>Couldn’t start</h1><p class="muted">${esc(err?.message ?? err)}</p>
      <p class="muted">Check your internet connection and reload.</p></div>`;
    return;
  }
  store.watchUser((user) => {
    if (user) {
      signedIn = true;
      renderShell();
      render();
      handleLinkActions();
    } else {
      renderLogin();
    }
  });
}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Re-render once a minute so "today" rolls over at midnight.
setInterval(() => { if (signedIn && !document.querySelector('.sheet')) render(); }, 60000);

boot();
