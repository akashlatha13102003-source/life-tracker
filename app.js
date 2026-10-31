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
const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
const rupees = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const shortRupees = (n) => {
  const v = Math.round(n || 0);
  if (v >= 100000) return `₹${(v / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `₹${v}`;
};
const litres = (ml) => (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1);

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const isToday = (t) => sameDay(t, new Date());
const sameMonth = (a, b) => {
  const x = new Date(a); const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
};
const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const sameWeek = (t) => startOfWeek(t).getTime() === startOfWeek().getTime();
const last7 = () => Array.from({ length: 7 }, (_, i) => {
  const d = startOfDay(); d.setDate(d.getDate() - (6 - i)); return d;
});
const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const weekday = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'narrow' });
const fmtDay = (t) => new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
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
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= Icons (simple line set) ================= */

const ICONS = {
  today: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  train: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  money: '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10h18M16.5 14.5h.01"/>',
  water: '<path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
  goals: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  settings: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  x: '<path d="M17 7L7 17M7 7l10 10"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  flame: '<path d="M12 3c1 3.5 5 5.6 5 10.2a5 5 0 0 1-10 0c0-2.6 1.4-4.1 2.4-5.1.3 1.5 1 2.6 2 3.1 0-3 .6-5.4.6-8.2z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3.6M16 6h2.5a2.5 2.5 0 0 1-2.6 3.6M12 13v4M8.5 20h7M10 17h4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>',
  logout: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M4 15.5V6.5A2.5 2.5 0 0 1 6.5 4h9"/>',
  bolt: '<path d="M13 3L5 13.5h6.5L11 21l8-10.5h-6.5z"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  // Workout types
  gym: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  run: '<circle cx="15" cy="4.5" r="1.8"/><path d="M7 21l3.5-6 3 2.5V21M5.5 11.5l3.5-3.5 4 1 2.5 3.5 3 1M10.5 15l-.5-4.5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-7 2.5 2.5V21M8.5 12l2.5-4h3l2 4 2 1"/>',
  yoga: '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 8v6M5 10.5l7 3.5 7-3.5M7.5 20l4.5-6 4.5 6"/>',
  cycle: '<circle cx="6" cy="16.5" r="3.5"/><circle cx="18" cy="16.5" r="3.5"/><path d="M6 16.5l4-7.5h5l3 7.5M10 9l2.5 7.5M14 5.5h2.5"/>',
  sports: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.3 3.8 8.5S14.6 18.1 12 20.5M12 3.5C9.4 5.9 8.2 8.8 8.2 12s1.2 6.1 3.8 8.5"/>',
  swim: '<path d="M3 17c2 0 2-1.5 4.5-1.5S10 17 12 17s2-1.5 4.5-1.5S19 17 21 17M3 12.5c2 0 2-1.5 4.5-1.5S10 12.5 12 12.5s2-1.5 4.5-1.5 2.5 1.5 4.5 1.5"/><circle cx="15.5" cy="6" r="1.8"/>',
  // Expense categories
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.6.8-2.5 3-2.5 6.5H18V3zM18 9.5V21"/>',
  travel: '<path d="M4.5 15.5l1.8-5.5a2 2 0 0 1 1.9-1.5h7.6a2 2 0 0 1 1.9 1.5l1.8 5.5v3h-15z"/><path d="M4.5 15.5h15M7.5 18.5V20M16.5 18.5V20"/>',
  shopping: '<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  bills: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  fun: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5v5l4-2.5z"/>',
  health: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  other: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
};
const icon = (name, size = 20, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.other}</svg>`;

/* ================= Catalog ================= */

const WORKOUT_TYPES = [
  { name: 'Gym', icon: 'gym' }, { name: 'Run', icon: 'run' }, { name: 'Walk', icon: 'walk' },
  { name: 'Yoga', icon: 'yoga' }, { name: 'Cycling', icon: 'cycle' }, { name: 'Sports', icon: 'sports' },
  { name: 'Swim', icon: 'swim' }, { name: 'Other', icon: 'bolt' },
];
const INTENSITIES = ['Easy', 'Medium', 'Hard'];
// Fixed colour per category (colour follows the category, never its rank).
const CATEGORIES = [
  { name: 'Food', icon: 'food', color: '#3987e5' },
  { name: 'Travel', icon: 'travel', color: '#d95926' },
  { name: 'Shopping', icon: 'shopping', color: '#199e70' },
  { name: 'Bills', icon: 'bills', color: '#c98500' },
  { name: 'Entertainment', icon: 'fun', color: '#d55181' },
  { name: 'Health', icon: 'health', color: '#008300' },
  { name: 'Others', icon: 'other', color: '#9085e9' },
];
const PAYMENTS = ['UPI', 'Cash', 'Card', 'Bank'];
const GOAL_TYPES = ['Fitness', 'Money', 'Other'];
const GOAL_UNITS = ['kg', '₹', 'km', 'workouts', 'days', 'steps'];

// Gym sessions: muscle groups and a starter exercise library for each.
const MUSCLES = ['Chest', 'Back', 'Biceps', 'Triceps', 'Shoulders', 'Legs', 'Abs', 'Forearms', 'Cardio'];
const LIBRARY = {
  Chest: ['Bench press', 'Incline bench press', 'Dumbbell press', 'Incline dumbbell press', 'Cable fly', 'Pec deck', 'Chest dips', 'Push-ups'],
  Back: ['Deadlift', 'Lat pulldown', 'Pull-ups', 'Barbell row', 'Seated cable row', 'One-arm dumbbell row', 'T-bar row'],
  Biceps: ['Barbell curl', 'Dumbbell curl', 'Hammer curl', 'Preacher curl', 'Cable curl', 'Concentration curl'],
  Triceps: ['Tricep pushdown', 'Overhead extension', 'Skull crushers', 'Close-grip bench press', 'Bench dips', 'Kickbacks'],
  Shoulders: ['Overhead press', 'Dumbbell shoulder press', 'Lateral raise', 'Front raise', 'Rear delt fly', 'Upright row', 'Shrugs'],
  Legs: ['Squat', 'Leg press', 'Romanian deadlift', 'Lunges', 'Leg extension', 'Leg curl', 'Calf raise'],
  Abs: ['Crunches', 'Hanging leg raise', 'Cable crunch', 'Russian twist', 'Ab wheel', 'Plank'],
  Forearms: ['Wrist curl', 'Reverse wrist curl', 'Reverse curl', "Farmer's walk"],
  Cardio: ['Treadmill', 'Cycling', 'Rowing', 'Elliptical', 'Stair climber', 'Jump rope'],
};
const QUICK_TYPES = WORKOUT_TYPES.filter((t) => t.name !== 'Gym');

/* ---------- Session helpers ---------- */
const isActive = (w) => w.status === 'active';
const doneWorkouts = () => data().workouts.filter((w) => !isActive(w));
const activeSession = () => data().workouts.filter(isActive).sort((a, b) => b.at - a.at)[0] ?? null;
/** Sets of an exercise. Older entries stored "3 sets × 10 reps @ kg" as numbers. */
const exSets = (e) => (Array.isArray(e.sets) ? e.sets
  : Array.from({ length: Math.max(1, Number(e.sets) || 1) }, () => ({ kg: Number(e.kg) || 0, reps: Number(e.reps) || 0 })));
const isCardio = (e) => e.muscle === 'Cardio';
const exVolume = (e) => (isCardio(e) ? 0 : sum(exSets(e), (s) => (s.kg || 0) * (s.reps || 0)));
const workoutSets = (w) => sum(w.exercises ?? [], (e) => exSets(e).length);
const workoutVolume = (w) => sum(w.exercises ?? [], exVolume);
const normName = (n) => clean(n).toLowerCase();
const titleCase = (n) => clean(n).toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
const fmtKg = (v) => `${Math.round(v * 10) / 10}`;
const setText = (e, s) => (isCardio(e) ? `${s.reps} min` : s.kg > 0 ? `${fmtKg(s.kg)} kg × ${s.reps}` : `${s.reps} reps`);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
/** "4 × 8 @ 60 kg, 1 × 6 @ 65 kg": groups back-to-back identical sets. */
function summariseSets(e, sets) {
  const groups = [];
  for (const s of sets) {
    const g = groups[groups.length - 1];
    if (g && g.kg === s.kg && g.reps === s.reps) g.n += 1; else groups.push({ kg: s.kg, reps: s.reps, n: 1 });
  }
  return groups.slice(0, 3).map((g) => (isCardio(e) ? `${g.reps} min`
    : g.kg > 0 ? `${g.n} × ${g.reps} @ ${fmtKg(g.kg)} kg` : `${g.n} × ${g.reps}`)).join(', ');
}
const fmtClock = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600); const m = Math.floor((t % 3600) / 60); const s = t % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
};
/** Heaviest kg ever lifted per exercise, optionally ignoring one workout. */
function bestLifts(excludeId) {
  const best = {};
  for (const w of doneWorkouts()) {
    if (w.id === excludeId) continue;
    for (const e of w.exercises ?? []) {
      if (isCardio(e)) continue;
      for (const s of exSets(e)) {
        if (s.kg > 0) best[normName(e.name)] = Math.max(best[normName(e.name)] ?? 0, s.kg);
      }
    }
  }
  return best;
}
/** The most recent finished session's sets for an exercise ("last time"). */
function lastPerformance(name, excludeId) {
  const key = normName(name);
  const ws = doneWorkouts().filter((w) => w.id !== excludeId).sort((a, b) => b.at - a.at);
  for (const w of ws) {
    const e = (w.exercises ?? []).find((x) => normName(x.name) === key);
    if (e) return { at: w.at, sets: exSets(e), ex: e };
  }
  return null;
}

const typeIcon = (t) => WORKOUT_TYPES.find((x) => x.name === t)?.icon ?? 'bolt';
const cat = (c) => CATEGORIES.find((x) => x.name === c) ?? CATEGORIES[CATEGORIES.length - 1];
const goalValue = (v, unit) => (unit === '₹' ? rupees(v) : `${Math.round(v * 10) / 10} ${unit}`);
const goalColor = (g) => (g.type === 'Money' ? 'var(--money)' : g.type === 'Fitness' ? 'var(--train)' : 'var(--goal)');

const TABS = [
  { id: 'today', label: 'Today', icon: 'today', color: 'var(--text)' },
  { id: 'train', label: 'Train', icon: 'train', color: 'var(--train)' },
  { id: 'money', label: 'Money', icon: 'money', color: 'var(--money)' },
  { id: 'water', label: 'Hydrate', icon: 'water', color: 'var(--water)' },
  { id: 'goals', label: 'Goals', icon: 'goals', color: 'var(--goal)' },
];
const OLD_ROUTES = { home: 'today', workout: 'train' };

/* ================= State ================= */

let store;
let signedIn = false;
const initialHash = location.hash.slice(1);
const ROUTES = [...TABS.map((t) => t.id), 'session'];
let route = ROUTES.includes(initialHash) ? initialHash : (OLD_ROUTES[initialHash] ?? 'today');
let moneyMonth = new Date();
let animateNext = true;
// Unsaved kg/reps typed into a session exercise card, kept across re-renders.
const drafts = {};

const data = () => store.data;
const settings = () => ({ trainGoal: 45, ...data().settings });
const write = (promise, okMessage) => {
  if (okMessage) toast(okMessage);
  Promise.resolve(promise).catch((err) => toast(`Couldn't save: ${err?.message ?? err}`, true));
};

/* ================= Small UI pieces ================= */

function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.innerHTML = isError ? icon('alert', 18) : icon('check', 18, 2.4);
  el.querySelector('svg').style.color = isError ? 'var(--critical)' : 'var(--good)';
  el.append(document.createTextNode(msg));
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

/** Circular progress dial. Animates in from empty when `animateNext` is set. */
function dial(frac, color, { size = 220, stroke = 14, gradient = true, id = 'g' } = {}) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const target = c * (1 - clamp01(frac));
  const start = animateNext && !reduceMotion() ? c : target;
  const gid = `dg-${id}`;
  return `<svg viewBox="0 0 ${size} ${size}" role="presentation">
    ${gradient ? `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity="0.65"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>` : ''}
    <circle class="dial-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
    <circle class="dial-arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${gradient ? `url(#${gid})` : color}"
      stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c} ${c}"
      stroke-dashoffset="${start}" data-target="${target}" transform="rotate(-90 ${size / 2} ${size / 2})"
      ${frac <= 0 ? 'opacity="0"' : ''}/>
  </svg>`;
}

function runEntryAnimations(root) {
  // Read layout once so the starting values are committed, then set the targets:
  // the CSS transitions take it from there (works even when frames are throttled).
  void root.getBoundingClientRect();
  root.querySelectorAll('.dial-arc[data-target]').forEach((arc) => { arc.style.strokeDashoffset = arc.dataset.target; });
  root.querySelectorAll('.meter > div[data-scale]').forEach((bar) => { bar.style.transform = `scaleX(${bar.dataset.scale})`; });
}

const meter = (frac, color) => {
  const f = clamp01(frac);
  const start = animateNext && !reduceMotion() ? 0 : f;
  return `<div class="meter" style="--c:${color}"><div style="transform:scaleX(${start})" data-scale="${f}"></div></div>`;
};

/** Seven-day column chart (single series: title names it, no legend). */
function columns(values, days, color, fmt, unit) {
  const max = Math.max(...values, 0);
  const maxIdx = values.indexOf(max);
  const cols = values.map((v, i) => {
    const h = max > 0 && v > 0 ? Math.max((v / max) * 100, 4) : 0;
    const label = `${fmt(v)}${unit ? ` ${unit}` : ''}`;
    return `<div class="col" tabindex="0" role="listitem" aria-label="${esc(fmtDay(days[i]))}: ${esc(label)}"
        data-tip="${esc(label)}" data-sub="${esc(i === 6 ? 'Today' : fmtDay(days[i]))}">
      <div class="col-val">${i === maxIdx && v > 0 ? esc(fmt(v)) : ''}</div>
      <div class="col-track"><div class="col-bar ${i === 6 ? 'now' : ''}" style="height:${h}%;--c:${color}"></div></div>
    </div>`;
  }).join('');
  return `<div class="cols" role="list">${cols}${max === 0 ? '<div class="chart-empty">No data yet this week</div>' : ''}</div>
    <div class="col-days">${days.map((d, i) => `<span class="${i === 6 ? 'today' : ''}">${weekday(d)}</span>`).join('')}</div>
    <div class="tip" hidden><strong></strong><span></span></div>`;
}

function donut(items, total) {
  const size = 196; const stroke = 22; const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = items.length > 1 ? 3 : 0; // surface gap between segments
  let offset = 0;
  const segs = items.map((it, i) => {
    const len = (it.total / total) * c;
    const seg = `<circle class="donut-seg" tabindex="0" data-i="${i}" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none"
      stroke="${it.color}" stroke-width="${stroke}" stroke-dasharray="${Math.max(len - gap, 0.5)} ${c}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${size / 2} ${size / 2})"
      aria-label="${esc(it.name)}: ${esc(rupees(it.total))}"/>`;
    offset += len;
    return seg;
  }).join('');
  return `<div class="donut-wrap"><svg viewBox="0 0 ${size} ${size}">${segs}</svg>
    <div class="donut-center"><strong class="num">${esc(shortRupees(total))}</strong><span>this month</span></div></div>`;
}

/** Daily target pill: a check when done, a cross when not (icon + label, never colour alone). */
const target = (label, done) => `<span class="target ${done ? 'done' : ''}">${icon(done ? 'check' : 'x', 13, 2.6)}${label}<span class="sr-only">${done ? ' done' : ' not done'}</span></span>`;

function tierFor(score) {
  if (score >= 80) return { label: 'Strong day', color: 'var(--good)', icon: 'check' };
  if (score >= 45) return { label: 'On track', color: 'var(--warning)', icon: 'up' };
  return { label: 'Just getting started', color: 'var(--text-3)', icon: 'bolt' };
}

function streak(workouts) {
  const days = new Set(workouts.map((w) => startOfDay(w.at).getTime()));
  const day = startOfDay();
  if (!days.has(day.getTime())) day.setDate(day.getDate() - 1);
  let n = 0;
  while (days.has(day.getTime())) { n += 1; day.setDate(day.getDate() - 1); }
  return n;
}

const head = (eyebrow, title, actions = '') => `
  <header class="head"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div>
  <div class="head-actions">${actions}</div></header>`;

const settingsBtn = `<button class="icon-btn press" data-action="settings" aria-label="Settings">${icon('settings', 20)}</button>`;
const addBtn = (action, label) => `<button class="icon-btn accent press" data-action="${action}" aria-label="${esc(label)}">${icon('plus', 20, 2.2)}</button>`;

const emptyState = (iconName, text) => `<div class="empty">${icon(iconName, 28, 1.5)}${esc(text)}</div>`;

const sortedGoals = () => [...data().goals].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
const goalProgress = (g) => (g.target > 0 ? clamp01(g.current / g.target) : 0);

/* ================= Views ================= */

function todayView() {
  const d = data();
  const s = settings();
  const days = last7();
  const finished = doneWorkouts();
  const live = activeSession();
  const minsToday = sum(finished.filter((w) => isToday(w.at)), (w) => w.minutes);
  const waterToday = sum(d.water.filter((w) => isToday(w.at)), (w) => w.ml);
  const spentToday = sum(d.expenses.filter((e) => isToday(e.at)), (e) => e.amount);
  const allowance = s.budget / daysInMonth();

  const trainP = clamp01(minsToday / s.trainGoal);
  const waterP = clamp01(waterToday / s.waterGoal);
  const moneyP = spentToday <= allowance ? 1 : clamp01(1 - (spentToday - allowance) / allowance);
  const score = Math.round(100 * (0.4 * trainP + 0.35 * waterP + 0.25 * moneyP));
  const hits = [trainP >= 1, waterP >= 1, spentToday <= allowance].filter(Boolean).length;
  const tier = tierFor(score);
  const overToday = spentToday > allowance;

  const mins = days.map((day) => sum(finished.filter((w) => sameDay(w.at, day)), (w) => w.minutes));
  const spend = days.map((day) => sum(d.expenses.filter((e) => sameDay(e.at, day)), (e) => e.amount));
  const st = streak(finished);
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const metric = (tab, label, iconName, color, frac, value, of) => `
    <button class="metric press" data-tab="${tab}" style="--c:${color}" aria-label="${esc(label)}: ${esc(value)} ${esc(of)}">
      <div class="ring">${dial(frac, color, { size: 58, stroke: 6, gradient: false, id: tab })}<div class="ring-icon">${icon(iconName, 18)}</div></div>
      <div class="metric-value num">${esc(value)}</div>
      <div class="metric-of">${esc(of)}</div>
      <div class="metric-label">${esc(label)}</div>
    </button>`;

  return `
    ${head(dateLabel, 'Today', settingsBtn)}
    <div class="stack">
      ${live ? liveBanner(live) : ''}
      <section class="card hero" style="--glow:color-mix(in srgb, ${tier.color} 35%, transparent)">
        <div class="eyebrow">Day score</div>
        <div class="dial-wrap">${dial(score / 100, tier.color === 'var(--text-3)' ? 'var(--text-2)' : tier.color, { id: 'score' })}
          <div class="dial-center">
            <div class="hero-num">${score}</div>
            <div class="tier" style="--tier:${tier.color}">${icon(tier.icon, 14, 2.4)}${esc(tier.label)}</div>
          </div>
        </div>
        <div class="targets" aria-label="${hits} of 3 daily targets hit">
          ${target('Train', trainP >= 1)}${target('Hydrate', waterP >= 1)}${target('Budget', spentToday <= allowance)}
        </div>
        ${st > 1 ? `<p class="hero-sub">${st}-day training streak</p>` : ''}
      </section>

      <div class="metrics">
        ${metric('train', 'Train', 'train', 'var(--train)', trainP, `${minsToday}`, `of ${s.trainGoal} min`)}
        ${metric('money', overToday ? 'Over' : 'Spent', 'money', overToday ? 'var(--critical)' : 'var(--money)', clamp01(spentToday / allowance), shortRupees(spentToday), `of ${shortRupees(allowance)}/day`)}
        ${metric('water', 'Hydrate', 'water', 'var(--water)', waterP, `${litres(waterToday)} L`, `of ${litres(s.waterGoal)} L`)}
      </div>

      <div class="quick">
        <button class="press" data-action="${live ? 'resume-session' : 'start-session'}" style="--c:var(--train)">${icon(live ? 'right' : 'gym', 16, 2.2)}${live ? 'Resume' : 'Gym'}</button>
        <button class="press" data-action="add-expense" style="--c:var(--money)">${icon('plus', 16, 2.4)}Expense</button>
        <button class="press" data-action="water-add" data-ml="250" style="--c:var(--water)">${icon('water', 16, 2.2)}250 ml</button>
      </div>

      <section class="card">
        <div class="card-head"><div class="card-title">Training minutes</div><div class="card-sub">Last 7 days</div></div>
        ${columns(mins, days, 'var(--train)', (v) => `${v}`, 'min')}
      </section>

      <section class="card">
        <div class="card-head"><div class="card-title">Spending</div><div class="card-sub">Last 7 days</div></div>
        ${columns(spend, days, 'var(--money)', shortRupees, '')}
      </section>

      ${d.goals.length ? `<section class="card">
        <div class="card-head"><div class="card-title">Goals</div>
          <button class="text-btn" data-tab="goals">See all</button></div>
        ${sortedGoals().slice(0, 3).map((g) => `
          <div class="goal-mini"><div class="goal-mini-top"><span>${esc(g.title)}</span>
            <span class="num muted">${Math.round(goalProgress(g) * 100)}%</span></div>
            ${meter(goalProgress(g), goalColor(g))}</div>`).join('')}
      </section>` : ''}
    </div>`;
}

function liveBanner(s) {
  const muscles = (s.muscles ?? []).join(' · ') || 'Gym';
  return `<button class="card live-banner press" data-action="resume-session">
    <span class="live-dot" aria-hidden="true"></span>
    <div class="row-main"><div class="eyebrow" style="color:var(--train)">Workout in progress</div>
      <div class="row-title">${esc(muscles)}</div>
      <div class="row-sub num"><span data-timer="${s.at}">${fmtClock(Date.now() - s.at)}</span> · ${plural(workoutSets(s), "set")}</div></div>
    <div class="row-end"><span class="pill">Resume ${icon('right', 14, 2.4)}</span></div>
  </button>`;
}

function trainView() {
  const ws = doneWorkouts().sort((a, b) => b.at - a.at);
  const live = activeSession();
  const week = ws.filter((w) => sameWeek(w.at));
  const best = bestLifts();
  const pbs = Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const days = last7();
  const weekGym = week.filter((w) => w.type === 'Gym');

  return `
    ${head('This week', 'Train', live ? '' : addBtn('quick-log', 'Quick log'))}
    <div class="stack">
      ${live ? liveBanner(live) : `
      <section class="card start-card">
        <div class="tile-icon" style="--c:var(--train);width:52px;height:52px;border-radius:16px">${icon('gym', 26)}</div>
        <div class="row-main"><div class="card-title">Gym session</div>
          <div class="card-sub">Pick today's muscles, then log every set as you go.</div></div>
        <button class="btn tint press" style="--c:var(--train);margin-top:14px" data-action="start-session">${icon('bolt', 18, 2.2)}Start workout</button>
        <button class="btn ghost press" style="margin-top:10px" data-action="quick-log">${icon('run', 18)}Log run, walk, yoga…</button>
      </section>`}

      <div class="stats">
        <div class="stat"><div class="stat-value num">${week.length}</div><div class="stat-label">Sessions</div></div>
        <div class="stat"><div class="stat-value num">${sum(week, (w) => w.minutes)}</div><div class="stat-label">Active min</div></div>
        <div class="stat"><div class="stat-value num">${shortKg(sum(weekGym, workoutVolume))}</div><div class="stat-label">Volume lifted</div></div>
      </div>

      <section class="card">
        <div class="card-head"><div class="card-title">Last 7 days</div><div class="card-sub">${icon('flame', 14)}</div></div>
        <div class="week">${days.map((day, i) => {
          const done = ws.some((w) => sameDay(w.at, day));
          return `<div class="day"><div class="day-box ${done ? 'done' : ''} ${i === 6 ? 'today' : ''}">${done ? icon('check', 16, 2.6) : ''}</div>
            <span class="${i === 6 ? 'today' : ''}">${weekday(day)}</span></div>`;
        }).join('')}</div>
      </section>

      ${pbs.length ? `<section class="card">
        <div class="card-head"><div class="card-title">Personal bests</div><div class="card-sub">${icon('trophy', 16)}</div></div>
        ${pbs.map(([name, kg]) => `<div class="row"><div class="tile-icon" style="--c:var(--warning)">${icon('trophy', 18)}</div>
          <div class="row-main"><div class="row-title">${esc(titleCase(name))}</div><div class="row-sub">Heaviest set</div></div>
          <div class="row-end"><strong>${fmtKg(kg)} kg</strong></div></div>`).join('')}
      </section>` : ''}

      <section class="card">
        <div class="card-head"><div class="card-title">History</div><div class="card-sub">${ws.length} total</div></div>
        ${ws.length ? ws.map((w) => {
          const isGym = w.type === 'Gym';
          const title = isGym && w.muscles?.length ? w.muscles.join(' · ') : w.type;
          const sub = isGym && (w.exercises ?? []).length
            ? `${fmtDay(w.at)} · ${plural((w.exercises ?? []).length, "exercise")} · ${plural(workoutSets(w), "set")}`
            : `${fmtDay(w.at)} · ${fmtTime(w.at)}`;
          return `<button class="row press" data-action="workout-open" data-id="${esc(w.id)}">
            <div class="tile-icon" style="--c:var(--train)">${icon(typeIcon(w.type), 20)}</div>
            <div class="row-main"><div class="row-title">${esc(title)}</div><div class="row-sub">${esc(sub)}</div></div>
            <div class="row-end"><strong>${w.minutes} min</strong><span>${isGym && workoutVolume(w) ? `${shortKg(workoutVolume(w))} kg` : esc(w.intensity ?? '')}</span></div>
          </button>`;
        }).join('') : emptyState('train', 'No workouts yet. Start your first session.')}
      </section>
    </div>`;
}

const shortKg = (v) => (v >= 10000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K` : Math.round(v).toLocaleString('en-IN'));

/* ---------- Live gym session ---------- */

function sessionView() {
  const s = activeSession();
  if (!s) return '';
  const exercises = s.exercises ?? [];
  const muscles = (s.muscles ?? []).join(' · ') || 'Gym';
  const prev = bestLifts(s.id);

  const cards = exercises.map((e, i) => {
    const sets = exSets(e);
    const cardio = isCardio(e);
    const last = lastPerformance(e.name, s.id);
    const lastSet = sets[sets.length - 1] ?? last?.sets?.[0];
    const draft = drafts[`${s.id}:${i}`] ?? {};
    const kgVal = draft.kg ?? (lastSet ? fmtKg(lastSet.kg || 0) : '');
    const repsVal = draft.reps ?? (lastSet ? String(lastSet.reps || '') : (cardio ? '10' : '10'));
    const topKg = Math.max(0, ...sets.map((x) => x.kg || 0));
    const isPr = !cardio && topKg > 0 && topKg > (prev[normName(e.name)] ?? 0) && prev[normName(e.name)] !== undefined;

    return `<section class="card ex-card" data-ex="${i}">
      <div class="ex-head">
        <div class="row-main">
          <div class="row-title">${esc(e.name)}</div>
          <div class="row-sub">${esc(e.muscle ?? '')}${last ? ` · Last: ${esc(summariseSets(last.ex, last.sets))}` : ' · First time'}</div>
        </div>
        ${isPr ? `<span class="pr-badge">${icon('trophy', 13, 2.2)}New PR</span>` : ''}
        <button class="x-btn press" data-action="session-remove-ex" data-i="${i}" aria-label="Remove ${esc(e.name)}">${icon('x', 18)}</button>
      </div>
      ${sets.length ? `<div class="set-list">${sets.map((x, j) => `
        <div class="set-row"><span class="set-no num">${j + 1}</span><span class="set-val num">${esc(setText(e, x))}</span>
          <button class="x-btn press" data-action="session-del-set" data-i="${i}" data-j="${j}" aria-label="Delete set ${j + 1}">${icon('x', 16)}</button></div>`).join('')}
      </div>` : ''}
      <div class="log-row ${cardio ? 'cardio' : ''}">
        ${cardio ? '' : `<div class="num-field">
          <span>kg</span>
          <div class="num-ctrl">
            <button type="button" class="press" data-action="session-step" data-i="${i}" data-f="kg" data-d="-2.5" aria-label="Less weight">${icon('minus', 16, 2.4)}</button>
            <input class="num" data-draft="${s.id}:${i}" data-f="kg" inputmode="decimal" value="${esc(kgVal)}" placeholder="0" aria-label="Weight in kg for ${esc(e.name)}">
            <button type="button" class="press" data-action="session-step" data-i="${i}" data-f="kg" data-d="2.5" aria-label="More weight">${icon('plus', 16, 2.4)}</button>
          </div></div>`}
        <div class="num-field">
          <span>${cardio ? 'minutes' : 'reps'}</span>
          <div class="num-ctrl">
            <button type="button" class="press" data-action="session-step" data-i="${i}" data-f="reps" data-d="-1" aria-label="Fewer">${icon('minus', 16, 2.4)}</button>
            <input class="num" data-draft="${s.id}:${i}" data-f="reps" inputmode="numeric" value="${esc(repsVal)}" placeholder="0" aria-label="${cardio ? 'Minutes' : 'Reps'} for ${esc(e.name)}">
            <button type="button" class="press" data-action="session-step" data-i="${i}" data-f="reps" data-d="1" aria-label="More">${icon('plus', 16, 2.4)}</button>
          </div></div>
      </div>
      <button class="btn tint press log-btn" style="--c:var(--train)" data-action="session-log" data-i="${i}">${icon('check', 18, 2.6)}Log set ${sets.length + 1}</button>
    </section>`;
  }).join('');

  return `
    <header class="head session-head">
      <div><div class="eyebrow" style="color:var(--train)">${esc(muscles)}</div>
        <h1 class="num" data-timer="${s.at}">${fmtClock(Date.now() - s.at)}</h1></div>
      <div class="head-actions"><button class="icon-btn press" data-tab="train" aria-label="Minimise session">${icon('left', 20)}</button></div>
    </header>
    <div class="stack">
      <div class="stats">
        <div class="stat"><div class="stat-value num">${exercises.length}</div><div class="stat-label">Exercises</div></div>
        <div class="stat"><div class="stat-value num">${workoutSets(s)}</div><div class="stat-label">Sets</div></div>
        <div class="stat"><div class="stat-value num">${shortKg(workoutVolume(s))}</div><div class="stat-label">Volume (kg)</div></div>
      </div>
      ${cards || `<section class="card">${emptyState('gym', 'Add your first exercise to start logging sets.')}</section>`}
      <button class="btn ghost press add-ex-btn" data-action="session-add-ex">${icon('plus', 18, 2.4)}Add exercise</button>
      <button class="btn press" data-action="session-finish" ${workoutSets(s) ? '' : 'disabled'}>${icon('check', 18, 2.6)}Finish workout</button>
      <button class="text-btn" style="color:#ff7b7b;margin:4px auto 0" data-action="session-discard">Discard session</button>
    </div>`;
}

function moneyView() {
  const d = data();
  const budget = d.settings.budget;
  const isCurrent = sameMonth(moneyMonth, Date.now());
  const list = d.expenses.filter((e) => sameMonth(e.at, moneyMonth)).sort((a, b) => b.at - a.at);
  const total = sum(list, (e) => e.amount);
  const pct = budget > 0 ? total / budget : 0;
  const status = pct > 1 ? { label: 'Over budget', color: 'var(--critical)', icon: 'alert' }
    : pct > 0.8 ? { label: 'Close to limit', color: 'var(--warning)', icon: 'alert' }
      : { label: 'Within budget', color: 'var(--good)', icon: 'check' };
  const daysLeft = isCurrent ? daysInMonth() - new Date().getDate() + 1 : 0;
  const perDay = isCurrent && budget > total ? (budget - total) / daysLeft : 0;
  const byCat = CATEGORIES
    .map((c) => ({ ...c, total: sum(list.filter((e) => cat(e.category).name === c.name), (e) => e.amount) }))
    .filter((c) => c.total > 0);
  const monthName = moneyMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  let lastDay = '';
  const rows = list.map((e) => {
    const day = isToday(e.at) ? 'Today' : fmtLongDate(e.at);
    const groupHead = day !== lastDay ? `<div class="list-group-title">${esc(day)}</div>` : '';
    lastDay = day;
    const c = cat(e.category);
    return `${groupHead}<button class="row press" data-action="expense-open" data-id="${esc(e.id)}">
      <div class="tile-icon" style="--c:${c.color}">${icon(c.icon, 19)}</div>
      <div class="row-main"><div class="row-title">${esc(e.note || e.category)}</div>
        <div class="row-sub">${esc(e.category)} · ${esc(e.payment)} · ${fmtTime(e.at)}</div></div>
      <div class="row-end"><strong>${rupees(e.amount)}</strong></div></button>`;
  }).join('');

  return `
    ${head(isCurrent ? 'This month' : 'History', 'Money', addBtn('add-expense', 'Add expense'))}
    <div class="stack">
      <section class="card">
        <div class="card-head">
          <button class="icon-btn press" data-action="month-prev" aria-label="Previous month">${icon('left', 18)}</button>
          <div class="card-title">${esc(monthName)}</div>
          <button class="icon-btn press" data-action="month-next" aria-label="Next month" ${isCurrent ? 'disabled style="opacity:.3"' : ''}>${icon('right', 18)}</button>
        </div>
        <div class="eyebrow">Spent</div>
        <div class="hero-num num" style="font-size:48px;margin:6px 0 14px">${rupees(total)}</div>
        ${meter(pct, pct > 1 ? 'var(--critical)' : 'var(--money)')}
        <div class="goal-meta" style="margin-top:12px">
          <span class="status" style="--s:${status.color}">${icon(status.icon, 15, 2.2)}${status.label}</span>
          <span class="num">Budget ${rupees(budget)}</span>
        </div>
        ${isCurrent ? `<div class="stats" style="margin-top:16px">
          <div class="stat"><div class="stat-value num" style="font-size:18px">${shortRupees(sum(d.expenses.filter((e) => isToday(e.at)), (e) => e.amount))}</div><div class="stat-label">Today</div></div>
          <div class="stat"><div class="stat-value num" style="font-size:18px">${shortRupees(sum(d.expenses.filter((e) => sameWeek(e.at)), (e) => e.amount))}</div><div class="stat-label">This week</div></div>
          <div class="stat"><div class="stat-value num" style="font-size:18px">${shortRupees(perDay)}</div><div class="stat-label">Per day left</div></div>
        </div>` : ''}
      </section>

      ${byCat.length ? `<section class="card">
        <div class="card-head"><div class="card-title">By category</div><div class="card-sub">${byCat.length} ${byCat.length === 1 ? 'category' : 'categories'}</div></div>
        ${donut(byCat, total)}
        ${[...byCat].sort((a, b) => b.total - a.total).map((c) => `<div class="legend-row">
          <span class="swatch" style="background:${c.color}"></span><span>${esc(c.name)}</span>
          <strong class="num">${rupees(c.total)}</strong>
          <span class="num faint small" style="text-align:right">${Math.round((c.total / total) * 100)}%</span></div>`).join('')}
      </section>` : ''}

      <section class="card">
        <div class="card-head"><div class="card-title">Transactions</div><div class="card-sub">${list.length}</div></div>
        ${rows || emptyState('money', 'Nothing spent this month yet.')}
      </section>
    </div>`;
}

function waterView() {
  const d = data();
  const goal = d.settings.waterGoal;
  const today = d.water.filter((w) => isToday(w.at)).sort((a, b) => b.at - a.at);
  const total = sum(today, (w) => w.ml);
  const frac = goal > 0 ? total / goal : 0;
  const left = Math.max(goal - total, 0);

  return `
    ${head('Today', 'Hydrate', settingsBtn)}
    <div class="stack">
      <section class="card hero" style="--glow:color-mix(in srgb, var(--water) 40%, transparent)">
        <div class="eyebrow">Water intake</div>
        <div class="dial-wrap">${dial(frac, 'var(--water)', { id: 'water' })}
          <div class="dial-center">
            <div class="hero-num num">${litres(total)}<span style="font-size:24px;letter-spacing:-0.02em"> L</span></div>
            <div class="hero-unit">of ${litres(goal)} L goal</div>
            ${total >= goal ? `<div class="tier" style="--tier:var(--good)">${icon('check', 14, 2.4)}Goal reached</div>` : ''}
          </div>
        </div>
        <p class="hero-sub">${total >= goal ? 'Great job. Keep sipping through the day.' : `${left.toLocaleString('en-IN')} ml to go`}</p>
        <div class="water-btns">
          <button class="press" data-action="water-add" data-ml="150">+150</button>
          <button class="press" data-action="water-add" data-ml="250">+250</button>
          <button class="press" data-action="water-add" data-ml="500">+500</button>
          <button class="press" data-action="water-custom">Other</button>
        </div>
      </section>

      <section class="card">
        <div class="stepper">
          <div><div class="card-title">Daily goal</div><div class="card-sub">Adjust in 250 ml steps</div></div>
          <div class="stepper-ctrl">
            <button class="press" data-action="water-goal" data-step="-250" aria-label="Decrease goal">${icon('minus', 18, 2.2)}</button>
            <strong class="num">${litres(goal)} L</strong>
            <button class="press" data-action="water-goal" data-step="250" aria-label="Increase goal">${icon('plus', 18, 2.2)}</button>
          </div>
        </div>
      </section>

      <button class="row card press" data-action="water-reminders" style="padding:16px 18px">
        <div class="tile-icon" style="--c:var(--water)">${icon('bell', 20)}</div>
        <div class="row-main"><div class="row-title">Drink reminders</div>
          <div class="row-sub">Alerts on your iPhone, even when the app is closed</div></div>
        <div class="row-end faint">${icon('right', 18)}</div>
      </button>

      <section class="card">
        <div class="card-head"><div class="card-title">Today's log</div><div class="card-sub">${today.length} ${today.length === 1 ? 'entry' : 'entries'}</div></div>
        ${today.length ? today.map((w) => `
          <div class="row"><div class="tile-icon" style="--c:var(--water)">${icon('water', 18)}</div>
            <div class="row-main"><div class="row-title num">${w.ml} ml</div><div class="row-sub">${fmtTime(w.at)}</div></div>
            <button class="x-btn press" data-action="water-del" data-id="${esc(w.id)}" aria-label="Remove ${w.ml} ml">${icon('x', 18)}</button>
          </div>`).join('') : emptyState('water', 'No water logged yet today.')}
      </section>
    </div>`;
}

function goalsView() {
  const goals = sortedGoals();
  const done = goals.filter((g) => goalProgress(g) >= 1).length;
  return `
    ${head(goals.length ? `${done} of ${goals.length} complete` : 'Set your targets', 'Goals', addBtn('goal-add', 'New goal'))}
    <div class="stack">
      ${goals.length ? goals.map((g) => {
        const p = goalProgress(g);
        const daysLeft = Math.round((startOfDay(g.deadline) - startOfDay()) / 86400000);
        const color = goalColor(g);
        const iconName = g.type === 'Money' ? 'money' : g.type === 'Fitness' ? 'train' : 'goals';
        return `<button class="card goal-card press" data-action="goal-open" data-id="${esc(g.id)}">
          <div class="goal-top">
            <div style="display:flex;gap:12px;align-items:center;min-width:0">
              <div class="tile-icon" style="--c:${color}">${icon(iconName, 19)}</div>
              <div class="row-main"><div class="row-title">${esc(g.title)}</div><div class="row-sub">${esc(g.type)}</div></div>
            </div>
            <div class="goal-pct num">${Math.round(p * 100)}<span class="faint" style="font-size:15px">%</span></div>
          </div>
          <div style="margin-top:16px">${meter(p, color)}</div>
          <div class="goal-meta"><span class="num">${esc(goalValue(g.current, g.unit))} of ${esc(goalValue(g.target, g.unit))}</span>
            <span>${p >= 1 ? '<span class="status" style="--s:var(--good)">' + icon('check', 14, 2.4) + 'Done</span>'
              : daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Past deadline'}</span></div>
        </button>`;
      }).join('') : `<section class="card">${emptyState('goals', 'Ideas: lose 5 kg by March, save ₹20,000 this month, or train 20 times this month.')}
        <button class="btn press" style="margin-top:14px" data-action="goal-add">${icon('plus', 18, 2.4)}Create a goal</button></section>`}
    </div>`;
}

const VIEWS = { today: todayView, train: trainView, money: moneyView, water: waterView, goals: goalsView };

/* ================= Shell & rendering ================= */

function renderShell() {
  app.innerHTML = `
    <div class="frame">
      ${store.mode === 'local' ? '<div class="banner">Test mode: data is saved in this browser only.</div>' : ''}
      <main id="view"></main>
    </div>
    <nav class="tabbar" aria-label="Sections">${TABS.map((t) => `
      <button data-tab="${t.id}" style="--c:${t.color}" aria-label="${t.label}">${icon(t.icon, 22)}<span>${t.label}</span></button>`).join('')}
    </nav>
    <div id="sheet-root"></div>
    <div id="toast" role="status" aria-live="polite"></div>`;
}

function render() {
  if (!signedIn) return;
  const view = document.getElementById('view');
  if (!view) return;
  // The live session screen only exists while a session is running.
  if (route === 'session' && !activeSession()) { route = 'train'; history.replaceState(null, '', '#train'); }
  const inSession = route === 'session';
  const tab = inSession ? TABS[1] : (TABS.find((t) => t.id === route) ?? TABS[0]);
  view.innerHTML = inSession ? sessionView() : VIEWS[tab.id]();
  document.body.classList.toggle('in-session', inSession);
  if (animateNext) {
    view.classList.remove('view-enter');
    void view.offsetWidth; // restart the entrance animation
    view.classList.add('view-enter');
    runEntryAnimations(view);
    animateNext = false;
  }
  document.querySelectorAll('.tabbar button').forEach((b) => {
    const on = b.dataset.tab === tab.id;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function go(tab) {
  if (tab === route) { window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' }); return; }
  route = tab;
  animateNext = true;
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `#${tab}`);
  window.scrollTo(0, 0);
  render();
}

/* ================= Chart tooltips (values set with textContent) ================= */

function showTip(col) {
  const card = col.closest('.card');
  const tip = card?.querySelector('.tip');
  if (!tip) return;
  tip.querySelector('strong').textContent = col.dataset.tip;
  tip.querySelector('span').textContent = col.dataset.sub;
  const cr = card.getBoundingClientRect();
  const r = col.getBoundingClientRect();
  const bar = col.querySelector('.col-bar').getBoundingClientRect();
  const x = Math.min(Math.max(r.left + r.width / 2 - cr.left, 50), cr.width - 50);
  const y = Math.min(bar.top, r.bottom - 24) - cr.top - 8;
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  tip.hidden = false;
}
function hideTips() { document.querySelectorAll('.tip').forEach((t) => { t.hidden = true; }); }

function focusDonut(seg) {
  const wrap = seg.closest('.donut-wrap');
  const i = Number(seg.dataset.i);
  wrap.classList.add('focusing');
  wrap.querySelectorAll('.donut-seg').forEach((s) => s.classList.toggle('on', Number(s.dataset.i) === i));
  const label = seg.getAttribute('aria-label').split(': ');
  wrap.querySelector('.donut-center strong').textContent = label[1];
  wrap.querySelector('.donut-center span').textContent = label[0];
}
function resetDonut(wrap) {
  if (!wrap) return;
  wrap.classList.remove('focusing');
  render();
}

document.addEventListener('pointerover', (e) => {
  const col = e.target.closest('.col');
  if (col) showTip(col); else if (!e.target.closest('.tip')) hideTips();
  const seg = e.target.closest('.donut-seg');
  if (seg) focusDonut(seg);
});
document.addEventListener('pointerout', (e) => {
  const seg = e.target.closest('.donut-seg');
  if (seg && !e.relatedTarget?.closest?.('.donut-seg')) resetDonut(seg.closest('.donut-wrap'));
});
document.addEventListener('focusin', (e) => {
  const col = e.target.closest('.col');
  if (col) showTip(col);
  const seg = e.target.closest('.donut-seg');
  if (seg) focusDonut(seg);
});
document.addEventListener('focusout', (e) => { if (e.target.closest('.col')) hideTips(); });
window.addEventListener('scroll', hideTips, { passive: true });

/* ================= Sheets ================= */

function openSheet(title, body, onSave, saveLabel = 'Save', accent = 'var(--text)') {
  const root = document.getElementById('sheet-root');
  root.dataset.open = 'false';
  root.dataset.closing = 'false';
  root.innerHTML = `
    <div class="backdrop" data-action="sheet-close"></div>
    <form class="sheet" novalidate autocomplete="off" role="dialog" aria-modal="true" aria-label="${esc(title)}" style="--c:${accent}">
      <div class="grabber"></div>
      <div class="sheet-head">
        <button type="button" class="text-btn" data-action="sheet-close">${onSave ? 'Cancel' : 'Close'}</button>
        <h2>${esc(title)}</h2>
        ${onSave ? `<button type="submit" class="text-btn strong">${esc(saveLabel)}</button>` : '<span></span>'}
      </div>
      <div class="sheet-body">${body}</div>
    </form>`;
  const form = root.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (onSave && onSave(form, new FormData(form)) !== false) closeSheet();
  });
  void root.offsetHeight; // commit the closed position, then slide in
  root.dataset.open = 'true';
  return form;
}

function closeSheet() {
  const root = document.getElementById('sheet-root');
  if (!root || !root.innerHTML) return;
  root.dataset.closing = 'true';
  root.dataset.open = 'false';
  const done = () => { if (root.dataset.open === 'false') { root.innerHTML = ''; root.dataset.closing = 'false'; } };
  setTimeout(done, reduceMotion() ? 200 : 230);
}

const seg = (name, options, checked) => `<div class="seg">${options.map((o) => `
  <label><input type="radio" name="${name}" value="${esc(o)}" ${o === checked ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;

const field = (label, input) => `<label class="field"><span>${label}</span>${input}</label>`;

/* ---------- Gym session sheets ---------- */

function startSessionSheet() {
  const live = activeSession();
  if (live) { go('session'); return; }
  openSheet('Start workout', `
    <div class="detail-hero"><div class="tile-icon" style="--c:var(--train)">${icon('gym', 28)}</div>
      <h3>What are you training today?</h3>
      <p class="muted small" style="margin-top:6px">Pick one or more. The timer starts when you tap Start.</p></div>
    <div class="chips muscles">${MUSCLES.map((m) => `
      <label class="chip" style="--c:var(--train)"><input type="checkbox" name="muscles" value="${m}"><span>${m}</span></label>`).join('')}</div>
  `, (form, f) => {
    const muscles = f.getAll('muscles').filter((m) => MUSCLES.includes(m));
    if (!muscles.length) { toast('Pick at least one muscle group', true); return false; }
    write(store.add('workouts', {
      at: Date.now(), type: 'Gym', status: 'active', muscles, exercises: [],
      minutes: 0, intensity: 'Medium', calories: 0, steps: 0, notes: '',
    }), 'Workout started');
    route = 'session';
    animateNext = true;
    history.replaceState(null, '', '#session');
    // Open the exercise picker straight away once the session exists.
    setTimeout(() => { render(); window.scrollTo(0, 0); if (activeSession()) addExerciseSheet(); }, 260);
  }, 'Start', 'var(--train)');
}

function addExerciseSheet() {
  const s = activeSession();
  if (!s) return;
  const chosen = s.muscles?.length ? s.muscles : MUSCLES;
  const already = new Set((s.exercises ?? []).map((e) => normName(e.name)));
  const groups = [...chosen, ...MUSCLES.filter((m) => !chosen.includes(m))];
  openSheet('Add exercise', `
    <span class="label">Your own exercise</span>
    <div class="custom-ex">
      ${field('Name', '<input name="custom" maxlength="60" placeholder="e.g. Machine chest press">')}
      ${field('Muscle', `<select name="muscle">${chosen.map((m) => `<option>${esc(m)}</option>`).join('')}${MUSCLES.filter((m) => !chosen.includes(m)).map((m) => `<option>${esc(m)}</option>`).join('')}</select>`)}
    </div>
    ${groups.map((m, gi) => `
      <span class="label">${esc(m)}${gi >= chosen.length ? ' <span class="faint">· other</span>' : ''}</span>
      <section class="card ex-pick">${LIBRARY[m].map((name) => `
        <button type="button" class="row press" data-action="session-pick" data-name="${esc(name)}" data-muscle="${esc(m)}" ${already.has(normName(name)) ? 'disabled' : ''}>
          <div class="row-main"><div class="row-title">${esc(name)}</div></div>
          <div class="row-end faint">${already.has(normName(name)) ? icon('check', 18, 2.4) : icon('plus', 18, 2.2)}</div>
        </button>`).join('')}</section>`).join('')}
  `, (form, f) => {
    const name = clean(f.get('custom'), 60);
    if (!name) { toast('Type a name, or tap an exercise below', true); return false; }
    addExerciseToSession(name.charAt(0).toUpperCase() + name.slice(1), f.get('muscle'));
  }, 'Add', 'var(--train)');
}

function addExerciseToSession(name, muscle) {
  const s = activeSession();
  if (!s) return;
  if ((s.exercises ?? []).some((e) => normName(e.name) === normName(name))) { toast(`${name} is already in this workout`, true); return; }
  const exercises = [...(s.exercises ?? []), { name, muscle: MUSCLES.includes(muscle) ? muscle : 'Chest', sets: [] }];
  write(store.update('workouts', s.id, { exercises }), `${name} added`);
  setTimeout(() => document.querySelector('.ex-card:last-of-type')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }), 150);
}

function readCard(i) {
  const s = activeSession();
  const card = document.querySelector(`.ex-card[data-ex="${i}"]`);
  return {
    s, card,
    kg: num(card?.querySelector('input[data-f=kg]')?.value),
    reps: Math.round(num(card?.querySelector('input[data-f=reps]')?.value)),
  };
}

function logSet(i) {
  const { s, kg, reps } = readCard(i);
  if (!s) return;
  const e = s.exercises?.[i];
  if (!e) return;
  if (!(reps > 0)) { toast(isCardio(e) ? 'Enter the minutes' : 'Enter how many reps', true); return; }
  if (kg < 0 || kg > 1000) { toast('Check the weight', true); return; }
  const exercises = s.exercises.map((x, k) => (k === i
    ? { ...x, sets: [...exSets(x), { kg: isCardio(x) ? 0 : Math.round(kg * 100) / 100, reps, at: Date.now() }] } : x));
  delete drafts[`${s.id}:${i}`];
  const prevBest = bestLifts(s.id)[normName(e.name)];
  const pr = !isCardio(e) && prevBest !== undefined && kg > prevBest;
  write(store.update('workouts', s.id, { exercises }), pr ? `New PR: ${fmtKg(kg)} kg 🏆` : `Set ${exSets(e).length + 1} logged`);
  if (navigator.vibrate) navigator.vibrate(12);
}

function stepField(i, field, delta) {
  const { s, card } = readCard(i);
  const input = card?.querySelector(`input[data-f=${field}]`);
  if (!s || !input) return;
  const next = Math.max(0, Math.round((num(input.value) + delta) * 100) / 100);
  input.value = field === 'kg' ? fmtKg(next) : String(Math.round(next));
  const key = `${s.id}:${i}`;
  drafts[key] = { ...(drafts[key] ?? {}), [field]: input.value };
}

function finishSession() {
  const s = activeSession();
  if (!s) return;
  const exercises = (s.exercises ?? []).filter((e) => exSets(e).length);
  if (!exercises.length) { toast('Log at least one set first', true); return; }
  const minutes = Math.max(1, Math.round((Date.now() - s.at) / 60000));
  const prevBest = bestLifts(s.id);
  const prs = exercises.filter((e) => !isCardio(e) && prevBest[normName(e.name)] !== undefined
    && Math.max(...exSets(e).map((x) => x.kg || 0)) > prevBest[normName(e.name)]);
  const totalSets = sum(exercises, (e) => exSets(e).length);
  const finished = { ...s, exercises, minutes };
  write(store.update('workouts', s.id, {
    status: 'done', endedAt: Date.now(), minutes, exercises,
    intensity: totalSets >= 18 ? 'Hard' : totalSets >= 9 ? 'Medium' : 'Easy',
  }));
  Object.keys(drafts).forEach((k) => { if (k.startsWith(`${s.id}:`)) delete drafts[k]; });
  route = 'train';
  animateNext = true;
  history.replaceState(null, '', '#train');
  render();
  openSheet('Workout complete', `
    <div class="detail-hero"><div class="tile-icon" style="--c:var(--good)">${icon('check', 30, 2.4)}</div>
      <h3>Great session!</h3><p class="muted small" style="margin-top:6px">${esc((s.muscles ?? []).join(' · '))}</p></div>
    <div class="stats">
      <div class="stat"><div class="stat-value num">${minutes}</div><div class="stat-label">Minutes</div></div>
      <div class="stat"><div class="stat-value num">${totalSets}</div><div class="stat-label">Sets</div></div>
      <div class="stat"><div class="stat-value num">${shortKg(workoutVolume(finished))}</div><div class="stat-label">Volume (kg)</div></div>
    </div>
    ${prs.length ? `<span class="label">New personal bests</span><section class="card">${prs.map((e) => `
      <div class="kv"><span>${icon('trophy', 16)}${esc(e.name)}</span><span class="num">${fmtKg(Math.max(...exSets(e).map((x) => x.kg || 0)))} kg</span></div>`).join('')}</section>` : ''}
    <span class="label">Exercises</span>
    <section class="card">${exercises.map((e) => `
      <div class="kv"><span>${esc(e.name)}</span><span class="num">${plural(exSets(e).length, "set")}${isCardio(e) ? '' : ` · ${shortKg(exVolume(e))} kg`}</span></div>`).join('')}</section>
  `);
}

function quickLogForm() {
  openSheet('Quick log', `
    <span class="label">Activity</span>
    <div class="chips">${QUICK_TYPES.map((t, i) => `
      <label class="chip"><input type="radio" name="type" value="${t.name}" ${i === 0 ? 'checked' : ''}><span>${icon(t.icon, 22)}${t.name}</span></label>`).join('')}</div>
    <span class="label">Session</span>
    <div class="field-row">
      ${field('Duration (min)', '<input type="number" name="minutes" inputmode="numeric" value="30" min="1" max="600">')}
      ${field('Calories', '<input type="number" name="calories" inputmode="numeric" min="0" placeholder="Optional">')}
    </div>
    <div class="field-row">
      ${field('Steps', '<input type="number" name="steps" inputmode="numeric" min="0" placeholder="Optional">')}
      ${field('When', `<input type="datetime-local" name="at" value="${toLocalInput(Date.now())}">`)}
    </div>
    <span class="label">Intensity</span>
    ${seg('intensity', INTENSITIES, 'Medium')}
    <span class="label">Notes</span>
    ${field('How did it feel?', '<textarea name="notes" rows="2" maxlength="500" placeholder="Optional"></textarea>')}
  `, (form, f) => {
    write(store.add('workouts', {
      at: fromLocalInput(f.get('at')),
      type: f.get('type') || 'Other',
      status: 'done',
      minutes: Math.max(1, Math.round(num(f.get('minutes')) || 1)),
      intensity: f.get('intensity') || 'Medium',
      calories: Math.max(0, Math.round(num(f.get('calories')))),
      steps: Math.max(0, Math.round(num(f.get('steps')))),
      notes: clean(f.get('notes'), 500),
      exercises: [],
    }), 'Workout saved');
  }, 'Save', 'var(--train)');
}

function workoutDetail(id) {
  const w = data().workouts.find((x) => x.id === id);
  if (!w) return;
  const isGym = w.type === 'Gym';
  const exercises = w.exercises ?? [];
  openSheet(isGym ? 'Gym session' : 'Workout', `
    <div class="detail-hero"><div class="tile-icon" style="--c:var(--train)">${icon(typeIcon(w.type), 28)}</div>
      <h3>${esc(isGym && w.muscles?.length ? w.muscles.join(' · ') : w.type)}</h3>
      <p class="muted small">${fmtLongDate(w.at)} · ${fmtTime(w.at)}</p></div>
    <div class="stats">
      <div class="stat"><div class="stat-value num">${w.minutes}</div><div class="stat-label">Minutes</div></div>
      ${isGym ? `<div class="stat"><div class="stat-value num">${workoutSets(w)}</div><div class="stat-label">Sets</div></div>
        <div class="stat"><div class="stat-value num">${shortKg(workoutVolume(w))}</div><div class="stat-label">Volume (kg)</div></div>`
        : `<div class="stat"><div class="stat-value">${esc(w.intensity ?? '–')}</div><div class="stat-label">Intensity</div></div>
        <div class="stat"><div class="stat-value num">${w.calories || '–'}</div><div class="stat-label">Calories</div></div>`}
    </div>
    ${exercises.map((e) => `<span class="label">${esc(e.name)}${e.muscle ? ` <span class="faint">· ${esc(e.muscle)}</span>` : ''}</span>
      <section class="card">${exSets(e).map((x, j) => `<div class="kv"><span>Set ${j + 1}</span><span class="num">${esc(setText(e, x))}</span></div>`).join('')}</section>`).join('')}
    ${w.steps ? `<span class="label">Steps</span><section class="card"><div class="kv"><span>Steps</span><span class="num">${w.steps.toLocaleString('en-IN')}</span></div></section>` : ''}
    ${w.notes ? `<span class="label">Notes</span><section class="card muted">${esc(w.notes)}</section>` : ''}
    <button type="button" class="btn danger press" style="margin-top:20px" data-action="delete" data-col="workouts" data-id="${esc(w.id)}">${icon('trash', 18)}Delete workout</button>
  `);
}

function expenseForm() {
  openSheet('Add expense', `
    <div class="amount"><span>₹</span><input name="amount" inputmode="decimal" placeholder="0" aria-label="Amount"></div>
    <span class="label">Category</span>
    <div class="chips">${CATEGORIES.map((c, i) => `
      <label class="chip" style="--c:${c.color}"><input type="radio" name="category" value="${c.name}" ${i === 0 ? 'checked' : ''}><span>${icon(c.icon, 22)}${c.name === 'Entertainment' ? 'Fun' : c.name}</span></label>`).join('')}</div>
    <span class="label">Paid with</span>
    ${seg('payment', PAYMENTS, 'UPI')}
    <span class="label">Details</span>
    ${field('Note', '<input name="note" maxlength="80" placeholder="e.g. Lunch with friends">')}
    ${field('When', `<input type="datetime-local" name="at" value="${toLocalInput(Date.now())}">`)}
  `, (form, f) => {
    const amount = Math.round(num(f.get('amount')) * 100) / 100;
    if (!(amount > 0)) { toast('Enter an amount first', true); form.querySelector('[name=amount]').focus(); return false; }
    write(store.add('expenses', {
      at: fromLocalInput(f.get('at')),
      amount,
      category: f.get('category') || 'Others',
      payment: f.get('payment') || 'UPI',
      note: clean(f.get('note'), 80),
    }), `Saved ${rupees(amount)}`);
  }, 'Save', 'var(--money)');
  setTimeout(() => document.querySelector('.amount input')?.focus(), 80);
}

function expenseDetail(id) {
  const e = data().expenses.find((x) => x.id === id);
  if (!e) return;
  const c = cat(e.category);
  openSheet('Expense', `
    <div class="detail-hero"><div class="tile-icon" style="--c:${c.color}">${icon(c.icon, 28)}</div>
      <div class="hero-num num" style="font-size:44px">${rupees(e.amount)}</div>
      <p class="muted small" style="margin-top:6px">${esc(e.note || e.category)}</p></div>
    <section class="card">
      <div class="kv"><span>Category</span><span>${esc(e.category)}</span></div>
      <div class="kv"><span>Paid with</span><span>${esc(e.payment)}</span></div>
      <div class="kv"><span>When</span><span>${fmtLongDate(e.at)}, ${fmtTime(e.at)}</span></div>
    </section>
    <button type="button" class="btn danger press" style="margin-top:20px" data-action="delete" data-col="expenses" data-id="${esc(e.id)}">${icon('trash', 18)}Delete expense</button>
  `);
}

function waterCustom() {
  openSheet('Add water', `<div class="amount"><input name="ml" type="number" inputmode="numeric" min="10" max="3000" placeholder="300" aria-label="Amount in ml" style="caret-color:var(--water)"><span>ml</span></div>`,
    (form, f) => {
      const ml = Math.round(num(f.get('ml')));
      if (!(ml > 0 && ml <= 3000)) { toast('Enter between 1 and 3000 ml', true); return false; }
      write(store.add('water', { at: Date.now(), ml }), `Logged ${ml} ml`);
    }, 'Add', 'var(--water)');
  setTimeout(() => document.querySelector('[name=ml]')?.focus(), 80);
}

function remindersHelp() {
  const times = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];
  openSheet('Drink reminders', `
    <div class="detail-hero"><div class="tile-icon" style="--c:var(--water)">${icon('bell', 26)}</div>
      <h3>Set up once, works daily</h3>
      <p class="muted small" style="margin-top:6px;max-width:320px;margin-inline:auto">Uses the free Shortcuts app on your iPhone. About 1 minute per reminder time.</p></div>
    <ol class="steps">
      <li>Open <b>Shortcuts</b>, then tap <b>Automation</b> at the bottom.</li>
      <li>Tap <b>＋</b> (New Automation) and choose <b>Time of Day</b>.</li>
      <li>Pick a time, choose <b>Daily</b>, select <b>Run Immediately</b>, and turn off <b>Notify When Run</b>. Tap <b>Next</b>.</li>
      <li>Tap <b>New Blank Automation</b>, then <b>Add Action</b>. Search for <b>Show Notification</b> and add it.</li>
      <li>Replace “Hello World!” with <b>Time to drink water 💧</b> and tap <b>Done</b>.</li>
      <li>Repeat for each time below.</li>
    </ol>
    <span class="label">Suggested times</span>
    <section class="card">${times.map((t) => `<div class="kv"><span>${icon('clock', 16)}</span><span class="num">${t}</span></div>`).join('')}</section>
  `);
}

function goalForm(id) {
  const g = id ? data().goals.find((x) => x.id === id) : null;
  const deadline = g?.deadline ?? (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.getTime(); })();
  openSheet(g ? 'Update goal' : 'New goal', `
    <span class="label">Goal</span>
    ${field('Name', `<input name="title" maxlength="80" placeholder="e.g. Save for a trip" value="${esc(g?.title ?? '')}">`)}
    ${seg('type', GOAL_TYPES, g?.type ?? 'Fitness')}
    <span class="label">Target</span>
    <div class="field-row">
      ${field('Target', `<input name="target" inputmode="decimal" value="${g ? esc(g.target) : ''}" placeholder="20000">`)}
      ${field('Unit', `<select name="unit">${GOAL_UNITS.map((u) => `<option ${u === (g?.unit ?? 'kg') ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`)}
    </div>
    ${field('Deadline', `<input type="date" name="deadline" value="${toDateInput(deadline)}">`)}
    <span class="label">Progress so far</span>
    ${field('Current', `<input name="current" inputmode="decimal" value="${esc(g?.current ?? 0)}">`)}
    ${g ? `<button type="button" class="btn danger press" style="margin-top:20px" data-action="delete" data-col="goals" data-id="${esc(g.id)}">${icon('trash', 18)}Delete goal</button>` : ''}
  `, (form, f) => {
    const title = clean(f.get('title'), 80);
    const target = num(f.get('target'));
    if (!title) { toast('Give your goal a name', true); return false; }
    if (!(target > 0)) { toast('Enter a target amount', true); return false; }
    const values = {
      title,
      type: f.get('type') || 'Other',
      target,
      current: Math.max(0, num(f.get('current'))),
      unit: f.get('unit') || 'kg',
      deadline: fromLocalInput(`${f.get('deadline')}T23:59`),
    };
    if (g) write(store.update('goals', g.id, values), 'Goal updated');
    else write(store.add('goals', { ...values, createdAt: Date.now() }), 'Goal added');
  }, 'Save', 'var(--goal)');
}

function settingsSheet() {
  const s = settings();
  const user = store.user;
  openSheet('Settings', `
    <span class="label">Daily targets</span>
    <div class="field-row">
      ${field('Training (min)', `<input name="trainGoal" inputmode="numeric" value="${esc(s.trainGoal)}">`)}
      ${field('Water (ml)', `<input name="waterGoal" inputmode="numeric" value="${esc(s.waterGoal)}">`)}
    </div>
    ${field('Monthly budget (₹)', `<input name="budget" inputmode="numeric" value="${esc(s.budget)}">`)}
    <span class="label">Account</span>
    <section class="card">
      <div class="kv"><span>Signed in as</span><span>${esc(user?.email ?? '—')}</span></div>
      <div class="kv"><span>Storage</span><span>${store.mode === 'cloud' ? 'Private cloud database' : 'This browser only'}</span></div>
      ${store.mode === 'cloud' ? `<div class="kv"><span>User ID</span><span class="small" style="word-break:break-all;font-weight:500">${esc(user?.uid)}</span></div>` : ''}
    </section>
    <div class="stack" style="margin-top:14px;gap:10px">
      ${store.mode === 'cloud' ? `<button type="button" class="btn ghost press" data-action="copy-uid">${icon('copy', 18)}Copy my User ID</button>` : ''}
      <button type="button" class="btn ghost press" data-action="export">${icon('download', 18)}Download a backup</button>
      ${store.mode === 'cloud' ? `<button type="button" class="btn danger press" data-action="signout">${icon('logout', 18)}Sign out</button>` : ''}
    </div>
  `, (form, f) => {
    const budget = Math.round(num(f.get('budget')));
    const waterGoal = Math.round(num(f.get('waterGoal')));
    const trainGoal = Math.round(num(f.get('trainGoal')));
    if (!(budget > 0)) { toast('Enter a budget above ₹0', true); return false; }
    if (!(waterGoal >= 500 && waterGoal <= 8000)) { toast('Water goal: 500 to 8000 ml', true); return false; }
    if (!(trainGoal >= 5 && trainGoal <= 300)) { toast('Training goal: 5 to 300 min', true); return false; }
    write(store.saveSettings({ budget, waterGoal, trainGoal }), 'Settings saved');
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
  'add-workout': () => (activeSession() ? go('session') : startSessionSheet()),
  'quick-log': () => quickLogForm(),
  'start-session': () => startSessionSheet(),
  'resume-session': () => go('session'),
  'session-add-ex': () => addExerciseSheet(),
  'session-pick': (el) => { closeSheet(); addExerciseToSession(el.dataset.name, el.dataset.muscle); },
  'session-log': (el) => logSet(Number(el.dataset.i)),
  'session-step': (el) => stepField(Number(el.dataset.i), el.dataset.f, Number(el.dataset.d)),
  'session-del-set': (el) => {
    const s = activeSession();
    if (!s) return;
    const i = Number(el.dataset.i); const j = Number(el.dataset.j);
    const exercises = s.exercises.map((x, k) => (k === i ? { ...x, sets: exSets(x).filter((_, n) => n !== j) } : x));
    write(store.update('workouts', s.id, { exercises }), 'Set removed');
  },
  'session-remove-ex': (el) => {
    const s = activeSession();
    const i = Number(el.dataset.i);
    const e = s?.exercises?.[i];
    if (!e) return;
    if (exSets(e).length && !confirm(`Remove ${e.name} and its ${exSets(e).length} sets?`)) return;
    Object.keys(drafts).forEach((k) => { if (k.startsWith(`${s.id}:`)) delete drafts[k]; });
    write(store.update('workouts', s.id, { exercises: s.exercises.filter((_, k) => k !== i) }), `${e.name} removed`);
  },
  'session-finish': () => finishSession(),
  'session-discard': () => {
    const s = activeSession();
    if (!s || !confirm('Discard this workout? Logged sets will be deleted.')) return;
    write(store.remove('workouts', s.id), 'Workout discarded');
    go('train');
  },
  'workout-open': (el) => workoutDetail(el.dataset.id),
  'add-expense': () => expenseForm(),
  'expense-open': (el) => expenseDetail(el.dataset.id),
  'month-prev': () => { moneyMonth = new Date(moneyMonth.getFullYear(), moneyMonth.getMonth() - 1, 1); render(); },
  'month-next': () => {
    if (sameMonth(moneyMonth, Date.now())) return;
    moneyMonth = new Date(moneyMonth.getFullYear(), moneyMonth.getMonth() + 1, 1); render();
  },
  'water-add': (el) => write(store.add('water', { at: Date.now(), ml: Number(el.dataset.ml) }), `Logged ${el.dataset.ml} ml`),
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
    try { await navigator.clipboard.writeText(store.user.uid); toast('User ID copied'); } catch { toast('Copy failed. Select the ID and copy it.', true); }
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

// Big amount inputs grow with their digits so the ₹ / ml label stays beside the number.
const fitAmount = (input) => { input.style.width = `${Math.max(input.value.length, input.placeholder.length, 1) + 0.5}ch`; };
document.addEventListener('input', (e) => { if (e.target.matches('.amount input')) fitAmount(e.target); });
new MutationObserver(() => document.querySelectorAll('.amount input').forEach(fitAmount))
  .observe(document.getElementById('app').parentElement, { childList: true, subtree: true });

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (ROUTES.includes(tab) && tab !== route) go(tab);
});

// Remember kg/reps typed in a session card so a re-render never loses them.
document.addEventListener('input', (e) => {
  const key = e.target.dataset?.draft;
  if (!key) return;
  drafts[key] = { ...(drafts[key] ?? {}), [e.target.dataset.f]: e.target.value };
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
    <div class="login view-enter">
      <img class="brand-mark" src="icons/icon.svg" alt="" width="64" height="64">
      <h1>Train. Spend.<br>Hydrate.</h1>
      <p class="lead">One daily score for your workouts, money and water.</p>
      <form id="login-form" novalidate>
        <label class="field"><span>Email</span><input name="email" type="email" autocomplete="username" inputmode="email" required></label>
        <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
        <p class="error" id="login-error">${esc(message)}</p>
        <button class="btn press" type="submit">Sign in</button>
        <button class="btn ghost press" type="button" id="signup-btn">Create my account</button>
        <button class="text-btn" type="button" id="reset-btn" style="margin-top:12px">Forgot password?</button>
      </form>
      <div class="login-foot">${icon('lock', 14)}Your data is private to your account.</div>
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
  if (!params.has('water')) return;
  const ml = Math.round(num(params.get('water')));
  history.replaceState(null, '', `${location.pathname}#water`);
  route = 'water';
  animateNext = true;
  if (ml > 0 && ml <= 3000) write(store.add('water', { at: Date.now(), ml }), `Logged ${ml} ml`);
  render();
}

/* ================= Start ================= */

async function boot() {
  try {
    store = await createStore(() => render());
  } catch (err) {
    app.innerHTML = `<div class="login"><h1>Couldn’t start</h1><p class="lead">${esc(err?.message ?? err)}</p>
      <p class="lead">Check your internet connection and reload.</p></div>`;
    return;
  }
  store.watchUser((user) => {
    if (user) {
      signedIn = true;
      animateNext = true;
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
// (Skipped on the session screen and while a sheet is open, so typing is never interrupted.)
setInterval(() => { if (signedIn && route !== 'session' && !document.querySelector('.sheet')) render(); }, 60000);

// Live session clocks: update only the timer text every second.
setInterval(() => {
  document.querySelectorAll('[data-timer]').forEach((el) => { el.textContent = fmtClock(Date.now() - Number(el.dataset.timer)); });
}, 1000);

boot();
