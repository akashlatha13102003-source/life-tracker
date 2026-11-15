import { createStore } from './store.js';
import { BODY_PATHS } from './body-paths.js';

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
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9.5a5.5 5.5 0 0 1 8 0l-2.2 2.2a2.5 2.5 0 0 0-3.6 0z"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  screen: '<rect x="6.5" y="3" width="11" height="18" rx="2.5"/><path d="M11 18h2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  spark: '<path d="M12 3.5l1.9 5.2a2 2 0 0 0 1.2 1.2l5.2 1.9-5.2 1.9a2 2 0 0 0-1.2 1.2L12 20.1l-1.9-5.2a2 2 0 0 0-1.2-1.2L3.7 11.8l5.2-1.9a2 2 0 0 0 1.2-1.2z"/><path d="M19 3v3M17.5 4.5h3"/>',
  pause: '<path d="M9 5.5v13M15 5.5v13"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="M5 8.5l7 1.5 7-1.5M12 10v5M9 21l3-6 3 6"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
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
// Built-in exercises: "Name|equipment code". The first few per muscle are the most common ones.
const EQUIPMENT = { B: 'Barbell', D: 'Dumbbell', C: 'Cable', M: 'Machine', W: 'Body weight', K: 'Kettlebell', O: 'Other' };
const BUILTIN = {
  Chest: ['Bench press|B', 'Incline bench press|B', 'Dumbbell press|D', 'Incline dumbbell press|D', 'Cable fly|C', 'Pec deck|M', 'Chest dips|W', 'Push-ups|W',
    'Decline bench press|B', 'Decline dumbbell press|D', 'Dumbbell fly|D', 'Incline dumbbell fly|D', 'Low-to-high cable fly|C', 'High-to-low cable fly|C',
    'Machine chest press|M', 'Incline machine press|M', 'Smith machine bench press|M', 'Smith machine incline press|M', 'Floor press|B', 'Svend press|O',
    'Incline push-ups|W', 'Decline push-ups|W', 'Dumbbell pullover|D'],
  Back: ['Deadlift|B', 'Lat pulldown|C', 'Pull-ups|W', 'Barbell row|B', 'Seated cable row|C', 'One-arm dumbbell row|D', 'T-bar row|B',
    'Chin-ups|W', 'Close-grip lat pulldown|C', 'Wide-grip lat pulldown|C', 'Straight-arm pulldown|C', 'Pendlay row|B', 'Chest-supported row|D',
    'Machine row|M', 'Seal row|B', 'Rack pull|B', 'Back extension|W', 'Good morning|B', 'Inverted row|W', 'Assisted pull-ups|M', 'Single-arm cable row|C',
    'Meadows row|B', 'Face pull|C'],
  Biceps: ['Barbell curl|B', 'Dumbbell curl|D', 'Hammer curl|D', 'Preacher curl|B', 'Cable curl|C', 'Concentration curl|D',
    'EZ-bar curl|B', 'Incline dumbbell curl|D', 'Spider curl|D', 'Bayesian cable curl|C', 'Machine curl|M', 'Cross-body hammer curl|D',
    'Rope hammer curl|C', 'Drag curl|B', 'Zottman curl|D'],
  Triceps: ['Tricep pushdown|C', 'Overhead extension|D', 'Skull crushers|B', 'Close-grip bench press|B', 'Bench dips|W', 'Kickbacks|D',
    'Rope pushdown|C', 'Overhead cable extension|C', 'Single-arm pushdown|C', 'JM press|B', 'Diamond push-ups|W', 'Tricep dips|W',
    'Machine tricep extension|M', 'Dumbbell skull crushers|D'],
  Shoulders: ['Overhead press|B', 'Dumbbell shoulder press|D', 'Lateral raise|D', 'Front raise|D', 'Rear delt fly|D', 'Upright row|B', 'Shrugs|D',
    'Arnold press|D', 'Seated barbell press|B', 'Machine shoulder press|M', 'Cable lateral raise|C', 'Machine lateral raise|M', 'Reverse pec deck|M',
    'Cable rear delt fly|C', 'Barbell shrugs|B', 'Landmine press|B', 'Push press|B', 'Lu raise|D', 'Plate front raise|O'],
  Legs: ['Squat|B', 'Leg press|M', 'Romanian deadlift|B', 'Lunges|D', 'Leg extension|M', 'Leg curl|M', 'Calf raise|M',
    'Front squat|B', 'Hack squat|M', 'Goblet squat|D', 'Bulgarian split squat|D', 'Walking lunges|D', 'Step-ups|D', 'Hip thrust|B', 'Glute bridge|W',
    'Seated leg curl|M', 'Lying leg curl|M', 'Nordic curl|W', 'Sumo deadlift|B', 'Smith machine squat|M', 'Pendulum squat|M', 'Hip abduction|M',
    'Hip adduction|M', 'Seated calf raise|M', 'Standing calf raise|M', 'Kettlebell swing|K', 'Box jumps|W', 'Sissy squat|W', 'Cable kickback|C',
    'Dumbbell Romanian deadlift|D', 'Single-leg leg press|M'],
  Abs: ['Crunches|W', 'Hanging leg raise|W', 'Cable crunch|C', 'Russian twist|O', 'Ab wheel|O', 'Plank|W',
    'Side plank|W', 'Leg raise|W', 'Bicycle crunch|W', 'Decline sit-ups|W', 'Mountain climbers|W', 'Dead bug|W', 'Hollow hold|W',
    'Pallof press|C', 'Woodchopper|C', 'Machine crunch|M', 'Hanging knee raise|W', 'V-ups|W', 'Toe touches|W'],
  Forearms: ["Wrist curl|D", 'Reverse wrist curl|D', 'Reverse curl|B', "Farmer's walk|D", 'Behind-the-back wrist curl|B', 'Dead hang|W',
    'Plate pinch|O', 'Wrist roller|O', 'Gripper|O'],
  Cardio: ['Treadmill|M', 'Cycling|M', 'Rowing|M', 'Elliptical|M', 'Stair climber|M', 'Jump rope|O',
    'Incline walk|M', 'Assault bike|M', 'Sled push|O', 'Battle ropes|O', 'Burpees|W', 'Ski erg|M', 'Swimming|O', 'Outdoor run|O'],
};
const LIBRARY = Object.fromEntries(MUSCLES.map((m) => [m, BUILTIN[m].map((x) => x.split('|')[0])]));
const BUILTIN_EQUIP = Object.fromEntries(MUSCLES.flatMap((m) => BUILTIN[m].map((x) => { const [n, e] = x.split('|'); return [n.toLowerCase(), EQUIPMENT[e]]; })));
const QUICK_TYPES = WORKOUT_TYPES.filter((t) => t.name !== 'Gym');
const LIBRARY_NAMES = MUSCLES.flatMap((m) => LIBRARY[m]);

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
  { id: 'plan', label: 'Plan', icon: 'calendar', color: 'var(--water)' },
  { id: 'money', label: 'Money', icon: 'money', color: 'var(--money)' },
  { id: 'goals', label: 'Goals', icon: 'goals', color: 'var(--goal)' },
];
const OLD_ROUTES = { home: 'today', workout: 'train', water: 'today' };

/* ================= State ================= */

let store;
let signedIn = false;
const initialHash = location.hash.slice(1);
const ROUTES = [...TABS.map((t) => t.id), 'session', 'exercises', 'muscles', 'chat'];
// Water used to be its own tab: links and reminder taps to #water now open the Water panel on Today.
let openWaterOnStart = initialHash === 'water';
let route = ROUTES.includes(initialHash) ? initialHash : (OLD_ROUTES[initialHash] ?? 'today');
let moneyMonth = new Date();
let trainDay = null; // day picked in Train → Last 7 days (null = today)
let trainWeeksBack = 0; // 0 = the 7 days ending today, 1 = the 7 days before that, …
/** Seven days ending `weeksBack` weeks before today. */
const weekWindow = (weeksBack) => Array.from({ length: 7 }, (_, i) => {
  const d = startOfDay(); d.setDate(d.getDate() - (6 - i) - 7 * weeksBack); return d;
});
/** Show a given day in the Train → days card (and select it). */
function jumpToDay(t) {
  const day = startOfDay(Math.min(t, Date.now()));
  const daysAgo = Math.round((startOfDay() - day) / 86400000);
  trainWeeksBack = Math.floor(daysAgo / 7);
  trainDay = day.getTime();
  render();
}
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
  const spentToday = sum(d.expenses.filter((e) => isToday(e.at)), (e) => e.amount);
  const allowance = s.budget / daysInMonth();
  const wt = weightStatus();

  const trainP = clamp01(minsToday / s.trainGoal);
  const moneyP = spentToday <= allowance ? 1 : clamp01(1 - (spentToday - allowance) / allowance);
  // Day score: training 50%, budget 30%, body weight in your range 20%.
  const score = Math.round(100 * (0.5 * trainP + 0.3 * moneyP + 0.2 * wt.score));
  const hits = [trainP >= 1, spentToday <= allowance, wt.ok].filter(Boolean).length;
  const tier = tierFor(score);
  const overToday = spentToday > allowance;

  const mins = days.map((day) => sum(finished.filter((w) => sameDay(w.at, day)), (w) => w.minutes));
  const spend = days.map((day) => sum(d.expenses.filter((e) => sameDay(e.at, day)), (e) => e.amount));
  const st = streak(finished);
  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const metric = (tab, label, iconName, color, frac, value, of) => `
    <button class="metric press" ${tab === 'weight' ? 'data-action="weight-open"' : `data-tab="${tab}"`} style="--c:${color}" aria-label="${esc(label)}: ${esc(value)} ${esc(of)}">
      <div class="ring">${dial(frac, color, { size: 58, stroke: 6, gradient: false, id: tab })}<div class="ring-icon">${icon(iconName, 18)}</div></div>
      <div class="metric-value num">${esc(value)}</div>
      <div class="metric-of">${esc(of)}</div>
      <div class="metric-label">${esc(label)}</div>
    </button>`;

  return `
    ${head(dateLabel, 'Today', `<button class="icon-btn press chat-btn" data-tab="chat" aria-label="Ask the AI assistant">${icon('spark', 20, 1.9)}</button>${settingsBtn}`)}
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
          ${target('Train', trainP >= 1)}${target('Budget', spentToday <= allowance)}${target('Weight', wt.ok)}
        </div>
        ${st > 1 ? `<p class="hero-sub">${st}-day training streak</p>` : wt.streakText ? `<p class="hero-sub">${esc(wt.streakText)}</p>` : ''}
      </section>

      <div class="metrics">
        ${metric('train', 'Train', 'train', 'var(--train)', trainP, `${minsToday}`, `of ${s.trainGoal} min`)}
        ${metric('money', overToday ? 'Over' : 'Spent', 'money', overToday ? 'var(--critical)' : 'var(--money)', clamp01(spentToday / allowance), shortRupees(spentToday), `of ${shortRupees(allowance)}/day`)}
        ${metric('weight', wt.label, 'scale', wt.ok ? 'var(--good)' : 'var(--goal)', wt.ring, wt.value, wt.of)}
      </div>

      <div class="quick">
        <button class="press" data-action="${live ? 'resume-session' : 'start-session'}" style="--c:var(--train)">${icon(live ? 'right' : 'gym', 16, 2.2)}${live ? 'Resume' : 'Gym'}</button>
        <button class="press" data-action="add-expense" style="--c:var(--money)">${icon('plus', 16, 2.4)}Expense</button>
        <button class="press" data-action="weight-add" style="--c:var(--goal)">${icon('scale', 16, 2.2)}Weigh in</button>
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

/* ---------- Workout clock with pause ---------- */
// A session keeps pausedAt (when the current pause began, or null) and pausedMs (all earlier pauses).
const isPaused = (s) => Boolean(s?.pausedAt);
const sessionElapsed = (s, now = Date.now()) => Math.max(0, (s.pausedAt || now) - s.at - (s.pausedMs || 0));
const timerAttrs = (s) => `data-timer="${s.at}" data-paused-ms="${s.pausedMs || 0}"${s.pausedAt ? ` data-paused-at="${s.pausedAt}"` : ''}`;
function pauseSession() {
  const s = activeSession();
  if (!s || isPaused(s)) return;
  write(store.update('workouts', s.id, { pausedAt: Date.now() }), 'Workout paused');
}
function resumeSession(quiet = false) {
  const s = activeSession();
  if (!s || !isPaused(s)) return;
  const pausedMs = (s.pausedMs || 0) + Math.max(0, Date.now() - s.pausedAt);
  write(store.update('workouts', s.id, { pausedAt: null, pausedMs }), quiet ? undefined : 'Workout resumed');
}

function liveBanner(s) {
  const muscles = (s.muscles ?? []).join(' · ') || 'Gym';
  const paused = isPaused(s);
  return `<button class="card live-banner press ${paused ? 'paused' : ''}" data-action="resume-session">
    <span class="live-dot" aria-hidden="true"></span>
    <div class="row-main"><div class="eyebrow" style="color:${paused ? 'var(--warning)' : 'var(--train)'}">${paused ? 'Workout paused' : 'Workout in progress'}</div>
      <div class="row-title">${esc(muscles)}</div>
      <div class="row-sub num"><span ${timerAttrs(s)}>${fmtClock(sessionElapsed(s))}</span> · ${plural(workoutSets(s), "set")}</div></div>
    <div class="row-end"><span class="pill">Resume ${icon('right', 14, 2.4)}</span></div>
  </button>`;
}

function trainView() {
  const ws = doneWorkouts().sort((a, b) => b.at - a.at);
  const live = activeSession();
  const week = ws.filter((w) => sameWeek(w.at));
  const best = bestLifts();
  const pbs = Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const days = weekWindow(trainWeeksBack);
  const isNow = trainWeeksBack === 0;
  const selDay = days.find((d) => trainDay && sameDay(d, trainDay)) ?? days[6];
  const rangeLabel = `${fmtDate(days[0])} – ${fmtDate(days[6])}`;
  const dayWs = ws.filter((w) => sameDay(w.at, selDay)).sort((a, b) => a.at - b.at);
  const weekGym = week.filter((w) => w.type === 'Gym');
  const planned = todaysRoutine();
  const doneToday = ws.some((w) => isToday(w.at) && w.type === 'Gym');

  return `
    ${head('This week', 'Train', live ? '' : addBtn('quick-log', 'Quick log'))}
    ${sectionTabs('train', TRAIN_SECTIONS, trainSection)}
    <div class="stack section-body">
      <div class="sec-block" data-sec-block="overview">
      ${live ? liveBanner(live) : `
      <section class="card start-card">
        <div class="tile-icon" style="--c:var(--train);width:52px;height:52px;border-radius:16px">${icon('gym', 26)}</div>
        ${planned ? `<div class="row-main"><div class="eyebrow" style="color:var(--water)">Today's plan${doneToday ? ' · done' : ''}</div><div class="card-title">${esc(planned.name)}</div>
          <div class="card-sub">${esc(`${routineMuscles(planned).join(' · ')} · ${plural(planned.exercises.length, 'exercise')} · ${plural(routineSets(planned), 'set')}`)}</div></div>
        <button class="btn tint press" style="--c:var(--train);margin-top:14px" data-action="start-routine" data-id="${esc(planned.id)}">${icon('bolt', 18, 2.2)}Start ${esc(planned.name)}</button>
        <button class="btn ghost press" style="margin-top:10px" data-action="start-session">${icon('gym', 18)}Pick muscles instead</button>`
        : `<div class="row-main"><div class="card-title">Gym session</div>
          <div class="card-sub">${sortedRoutines().length ? 'Rest day in your plan. Train anyway, or pick a routine.' : "Pick today's muscles, then log every set as you go."}</div></div>
        <button class="btn tint press" style="--c:var(--train);margin-top:14px" data-action="start-session">${icon('bolt', 18, 2.2)}Start workout</button>`}
        <button class="btn ghost press" style="margin-top:10px" data-action="quick-log">${icon('run', 18)}Log run, walk, yoga…</button>
        <button class="text-btn" style="margin:6px auto 0;display:flex;align-items:center;gap:6px" data-action="backfill">${icon('calendar', 16)}Log a past gym session</button>
      </section>`}

      ${weekCompareCard()}
      </div>

      <div class="sec-block" data-sec-block="body">${muscleMapCard()}${weightCard()}</div>

      <div class="sec-block" data-sec-block="lifts">
      <div class="lift-links">
        <button class="card row press" data-action="open-library">
          <div class="tile-icon" style="--c:var(--train)">${icon('list', 20)}</div>
          <div class="row-main"><div class="row-title">Exercise library</div>
            <div class="row-sub">${libraryEntries().length} exercises</div></div></button>
        <button class="card row press" data-action="open-explore">
          <div class="tile-icon" style="--c:var(--train)">${icon('body', 20)}</div>
          <div class="row-main"><div class="row-title">By muscle</div>
            <div class="row-sub">Tap the body</div></div></button>
      </div>
      ${strongestLiftsCard()}
      ${pbs.length ? `<section class="card">
        <div class="card-head"><div class="card-title">Personal bests</div>
          <button class="see-all press" data-action="pbs-all">See all ${Object.keys(best).length}</button></div>
        <div class="pb-strip">${pbs.map(([name, kg]) => `<button class="pb press" data-action="pb-open" data-name="${esc(name)}" aria-label="${esc(titleCase(name))} progress">
          <div class="pb-kg num">${fmtKg(kg)}<small> kg</small></div><div class="pb-name">${esc(titleCase(name))}</div></button>`).join('')}</div>
      </section>` : ''}
      </div>

      <div class="sec-block" data-sec-block="history">
      <section class="card" id="days-card">
        <div class="card-head">
          <div class="row-main"><div class="card-title">${isNow ? 'Last 7 days' : esc(rangeLabel)}</div>
            <div class="card-sub">${isNow ? 'Tap a day' : `${plural(trainWeeksBack, 'week')} ago`}</div></div>
          <div class="day-nav">
            <button class="icon-btn press" data-action="train-week" data-d="1" aria-label="Previous 7 days">${icon('left', 18)}</button>
            <label class="icon-btn press day-pick" aria-label="Pick a date">${icon('calendar', 18)}
              <input type="date" data-day-pick max="${toDateInput(Date.now())}" value="${toDateInput(selDay)}" aria-label="Pick a date"></label>
            <button class="icon-btn press" data-action="train-week" data-d="-1" aria-label="Next 7 days" ${isNow ? 'disabled' : ''}>${icon('right', 18)}</button>
          </div>
        </div>
        <div class="week">${days.map((day, i) => {
          const done = ws.some((w) => sameDay(w.at, day));
          const sel = day === selDay;
          return `<button class="day press" data-action="train-day" data-day="${day.getTime()}" aria-pressed="${sel}" aria-label="${esc(fmtDay(day))}">
            <div class="day-box ${done ? 'done' : ''} ${isNow && i === 6 ? 'today' : ''} ${sel ? 'sel' : ''}">${done ? icon('check', 16, 2.6) : ''}</div>
            <span class="${sel ? 'today' : ''}">${weekday(day)}</span></button>`;
        }).join('')}</div>
        ${isNow ? '' : '<button class="text-btn back-today" data-action="train-today">Back to today</button>'}
        <div class="day-list">
          <div class="day-list-head">${isToday(selDay) ? 'Today' : esc(fmtDay(selDay))}</div>
          ${dayWs.length ? dayWs.map((w) => workoutRow(w)).join('') : '<div class="empty">Rest day · nothing logged</div>'}
        </div>
      </section>

      <section class="card">
        <button class="card-head collapse-head press" data-action="history-toggle" aria-expanded="${historyOpen}" aria-controls="history-list">
          <span class="card-title">History</span>
          <span class="collapse-end"><span class="card-sub">${ws.length} total</span><span class="chev ${historyOpen ? 'open' : ''}">${icon('chevron', 18, 2.2)}</span></span>
        </button>
        <div id="history-list" ${historyOpen ? '' : 'hidden'}>
        ${ws.length ? ws.map((w) => workoutRow(w, false)).join('') : emptyState('train', 'No workouts yet. Start your first session.')}
        </div>
      </section>
      </div>
    </div>`;
}

/* ---------- Section tabs: a sticky bar with a sliding pill ---------- */

const TRAIN_SECTIONS = [['overview', 'Overview'], ['body', 'Body'], ['lifts', 'Lifts'], ['history', 'History']];
let trainSection = 'overview'; // the part of the Train page currently in view
let spyLockUntil = 0; // after tapping a tab, let the smooth scroll land before following the scroll again

/** Move the highlight to a tab without redrawing the page (the pill slides there). */
function setActiveSection(s) {
  const i = TRAIN_SECTIONS.findIndex(([k]) => k === s);
  if (i < 0) return;
  trainSection = s;
  const slide = document.querySelector('.seg-tabs.slide');
  if (!slide || Number(slide.style.getPropertyValue('--i')) === i) return;
  slide.style.setProperty('--i', i);
  slide.querySelectorAll('[data-action=section]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.s === s)));
}

/** Tapping a tab glides the page to that section, just under the sticky bar. */
function switchSection(s) {
  const block = document.querySelector(`[data-sec-block="${s}"]`);
  if (!block) return;
  setActiveSection(s);
  const bar = document.querySelector('[data-sticky]');
  const offset = (bar?.offsetHeight ?? 0) + (bar ? parseFloat(getComputedStyle(bar).top) || 0 : 0) + 6;
  const y = s === TRAIN_SECTIONS[0][0] ? 0 : block.getBoundingClientRect().top + window.scrollY - offset;
  spyLockUntil = Date.now() + 1000;
  window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion() ? 'auto' : 'smooth' });
}

/** Scroll-spy: the last section whose top has passed just below the bar is the current one. */
function spySection() {
  if (Date.now() < spyLockUntil) return;
  const blocks = [...document.querySelectorAll('[data-sec-block]')];
  if (!blocks.length) return;
  const bar = document.querySelector('[data-sticky]');
  const line = (bar ? bar.getBoundingClientRect().bottom : 0) + 80;
  let current = blocks[0].dataset.secBlock;
  for (const b of blocks) if (b.getBoundingClientRect().top <= line) current = b.dataset.secBlock;
  // At the very bottom, the last section counts even if it's short.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = blocks.at(-1).dataset.secBlock;
  setActiveSection(current);
}
// When a smooth scroll finishes, follow the page again straight away.
window.addEventListener('scrollend', () => { spyLockUntil = 0; spySection(); });
/* ---------- Scroll effects ---------- */

let revealObserver = null;
/** After each render: set up scroll reveals and the sticky bar / highlight for the current scroll position. */
function afterRender(view) {
  // Cards below the screen fade up into place as they scroll into view.
  revealObserver?.disconnect();
  if (!reduceMotion() && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add('revealed');
        en.target.classList.remove('pre');
        revealObserver.unobserve(en.target);
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    view.querySelectorAll('.stack > .card, .stack > .stats, .sec-block > .card, .sec-block > .lift-links').forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pre'); revealObserver.observe(el); }
    });
  }
  scrollFx();
}

let scrollTick = false;
/** Sticky bar state, and cards softly fading as they slide up under it. */
function scrollFx() {
  scrollTick = false;
  const bar = document.querySelector('[data-sticky]');
  const sentinel = document.querySelector('[data-sticky-sentinel]');
  if (!bar || !sentinel) return;
  const barTop = parseFloat(getComputedStyle(bar).top) || 0;
  bar.classList.toggle('stuck', sentinel.getBoundingClientRect().top < barTop + 1);
  spySection();
  const limit = bar.getBoundingClientRect().bottom;
  const fade = !reduceMotion();
  document.querySelectorAll('.sec-block > *').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (!fade || r.top >= limit - 2) { el.style.opacity = ''; el.style.transform = ''; return; }
    const o = Math.max(0, Math.min(1, (r.bottom - limit) / 160));
    el.style.opacity = o.toFixed(3);
    el.style.transform = `scale(${(0.97 + 0.03 * o).toFixed(4)})`;
  });
}
window.addEventListener('scroll', () => {
  spySection(); // instant tab highlight (only 4 positions to check)
  if (!scrollTick) { scrollTick = true; requestAnimationFrame(scrollFx); }
}, { passive: true });

function sectionTabs(group, sections, current) {
  const to = Math.max(0, sections.findIndex(([k]) => k === current));
  return `<div data-sticky-sentinel></div><div class="sticky-tabs" data-sticky>
    <div class="seg-tabs slide" role="tablist" style="--n:${sections.length};--i:${to}">
      <i class="seg-pill" aria-hidden="true"></i>
      ${sections.map(([k, l]) => `<button class="press" role="tab" data-action="section" data-group="${group}" data-s="${k}" aria-selected="${k === current}">${l}</button>`).join('')}
    </div>
  </div>`;
}

/* ---------- This week vs last week ---------- */

/** Totals for workouts finished between two moments. */
function trainingTotals(from, to) {
  const ws = doneWorkouts().filter((w) => w.at >= from && w.at < to);
  return {
    sessions: ws.length,
    sets: sum(ws, workoutSets),
    volume: sum(ws.filter((w) => w.type === 'Gym'), workoutVolume),
    minutes: sum(ws, (w) => w.minutes),
  };
}

function weekCompareCard() {
  const WEEK = 7 * 86400000;
  const now = Date.now();
  const thisStart = startOfWeek().getTime();
  const cur = trainingTotals(thisStart, now);
  // Fair comparison: last week up to the same day and time.
  const prev = trainingTotals(thisStart - WEEK, now - WEEK);
  const prevFull = trainingTotals(thisStart - WEEK, thisStart);
  const tile = (label, a, b, fmt) => {
    let delta;
    if (!b && !a) delta = '<span class="delta flat">–</span>';
    else if (!b) delta = `<span class="delta up">${icon('up', 12, 2.6)}New</span>`;
    else {
      const pct = Math.round(((a - b) / b) * 100);
      delta = pct === 0 ? '<span class="delta flat">Same</span>'
        : `<span class="delta ${pct > 0 ? 'up' : 'down'}">${icon(pct > 0 ? 'up' : 'down', 12, 2.6)}${Math.abs(pct)}%</span>`;
    }
    return `<div class="wc-tile"><div class="stat-label">${label}</div><div class="stat-value num">${fmt(a)}</div>
      <div class="wc-foot">${delta}<span class="faint small num">vs ${fmt(b)}</span></div></div>`;
  };
  // Volume for the last 8 weeks (this week so far on the right).
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = thisStart - (7 - i) * WEEK;
    return { start, v: trainingTotals(start, Math.min(start + WEEK, now)).volume };
  });
  const max = Math.max(...weeks.map((w) => w.v), 0);
  const bars = weeks.map((w, i) => {
    const h = max > 0 && w.v > 0 ? Math.max((w.v / max) * 100, 4) : 0;
    const label = `${shortKg(w.v)} kg`;
    return `<div class="col" tabindex="0" role="listitem" aria-label="${esc(`Week of ${fmtDate(w.start)}: ${label}`)}"
        data-tip="${esc(label)}" data-sub="${esc(i === 7 ? 'This week so far' : `Week of ${fmtDate(w.start)}`)}">
      <div class="col-val">${i === 7 && w.v ? esc(shortKg(w.v)) : ''}</div>
      <div class="col-track"><div class="col-bar ${i === 7 ? 'now' : ''}" style="height:${h}%;--c:var(--train)"></div></div>
    </div>`;
  }).join('');
  const day = new Date().toLocaleDateString('en-IN', { weekday: 'long' });
  return `<section class="card">
    <div class="card-head"><div class="row-main"><div class="card-title">This week vs last week</div>
      <div class="card-sub">Up to ${esc(day)} each week · last week in full: ${plural(prevFull.sessions, 'session')}</div></div></div>
    <div class="wc-grid">
      ${tile('Sessions', cur.sessions, prev.sessions, (v) => String(v))}
      ${tile('Sets', cur.sets, prev.sets, (v) => String(v))}
      ${tile('Volume (kg)', cur.volume, prev.volume, shortKg)}
      ${tile('Minutes', cur.minutes, prev.minutes, (v) => String(v))}
    </div>
    <div class="card-head" style="margin:18px 0 10px"><div class="card-title" style="font-size:14px">Volume · last 8 weeks</div></div>
    <div class="cols" role="list" style="grid-template-columns:repeat(8,1fr);height:120px">${bars}${max === 0 ? '<div class="chart-empty">No volume logged yet</div>' : ''}</div>
    <div class="col-days" style="grid-template-columns:repeat(8,1fr)">${weeks.map((w, i) => `<span class="${i === 7 ? 'today' : ''}">${i === 7 ? 'Now' : esc(new Date(w.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'numeric' }))}</span>`).join('')}</div>
    <div class="tip" hidden><strong></strong><span></span></div>
  </section>`;
}

/** Your strongest lifts by estimated 1RM (sets of 1–12 reps). */
function strongestLiftsCard() {
  const best = new Map();
  for (const ev of setEvents()) {
    if (ev.live) continue;
    const e1 = est1RM(ev.kg, ev.reps);
    if (!e1) continue;
    const key = normName(ev.name);
    const x = best.get(key);
    if (!x || e1 > x.e1) best.set(key, { name: ev.name, e1, kg: ev.kg, reps: ev.reps, at: ev.at });
  }
  const list = [...best.values()].sort((a, b) => b.e1 - a.e1).slice(0, 8);
  if (!list.length) return '';
  const top = list[0].e1;
  return `<section class="card">
    <div class="card-head"><div class="card-title">Strongest lifts</div><div class="card-sub">Est. 1RM</div></div>
    ${list.map((x) => `<button class="mrow lift-row press" data-action="pb-open" data-name="${esc(normName(x.name))}">
      <span class="mname"><span class="str-name">${esc(x.name)}</span><small>${fmtKg(x.kg)} kg × ${x.reps} · ${esc(fmtDate(x.at))}</small></span>
      <div class="mbar" aria-hidden="true"><i class="fill" style="width:${(x.e1 / top) * 100}%;background:var(--warning)"></i></div>
      <span class="mval num"><b>${fmtKg(Math.round(x.e1 * 10) / 10)}</b> kg</span></button>`).join('')}
    <p class="map-note">Estimated from your best set of 1–12 reps (Epley formula).</p>
  </section>`;
}

/** One workout row. With details on, gym sessions also list each exercise and its sets. */
function workoutRow(w, details = true) {
  const isGym = w.type === 'Gym';
  const exs = w.exercises ?? [];
  const title = isGym && w.muscles?.length ? w.muscles.join(' · ') : w.type;
  const when = details ? fmtTime(w.at) : fmtDay(w.at);
  const sub = isGym && exs.length
    ? `${when} · ${plural(exs.length, 'exercise')} · ${plural(workoutSets(w), 'set')}`
    : details ? when : `${when} · ${fmtTime(w.at)}`;
  return `<button class="row press" data-action="workout-open" data-id="${esc(w.id)}">
    <div class="tile-icon" style="--c:var(--train)">${icon(typeIcon(w.type), 20)}</div>
    <div class="row-main"><div class="row-title">${esc(title)}</div><div class="row-sub">${esc(sub)}</div></div>
    <div class="row-end"><strong>${w.minutes} min</strong><span>${isGym && workoutVolume(w) ? `${shortKg(workoutVolume(w))} kg` : esc(w.intensity ?? '')}</span></div>
  </button>${details && exs.length ? `<ul class="ex-lines">${exs.map((e) => `<li>
    <div class="ex-name">${esc(e.name)}</div><div class="ex-sets num">${esc(summariseSets(e, exSets(e)) || 'No sets logged')}</div></li>`).join('')}</ul>` : ''}`;
}

function allBestsSheet() {
  const all = Object.entries(bestLifts()).sort((a, b) => b[1] - a[1]);
  openSheet('Personal bests', `<p class="muted small" style="margin:0 0 12px">Tap an exercise to see your progress.</p>
    <section class="card">${all.map(([name, kg]) => `<button class="row press" data-action="pb-open" data-name="${esc(name)}"><div class="tile-icon" style="--c:var(--warning)">${icon('trophy', 18)}</div>
    <div class="row-main"><div class="row-title">${esc(titleCase(name))}</div><div class="row-sub">Heaviest set</div></div>
    <div class="row-end"><strong>${fmtKg(kg)} kg</strong></div>${icon('right', 16)}</button>`).join('')}</section>`);
}

/* ---------- Exercise progress ---------- */

/** Every finished session that included this exercise, oldest first, with its top set. */
function exerciseHistory(key) {
  return doneWorkouts().sort((a, b) => a.at - b.at).flatMap((w) => {
    const e = (w.exercises ?? []).find((x) => normName(x.name) === key);
    if (!e || isCardio(e)) return [];
    const sets = exSets(e).filter((s) => s.kg > 0 || s.reps > 0);
    if (!sets.length) return [];
    const top = sets.reduce((b, s) => (s.kg > b.kg || (s.kg === b.kg && s.reps > b.reps) ? s : b));
    return [{ at: w.at, kg: top.kg, reps: top.reps, ex: e, sets, volume: exVolume(e) }];
  });
}

/** Step size for y-axis gridlines: 1, 2, 2.5 or 5 × a power of ten. */
function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? 10 * p;
}

/** Line chart of the heaviest set per session (one series, one axis). */
function progressChart(pts) {
  if (pts.length < 2) {
    return `<div class="pchart-empty">${icon('up', 22, 1.6)}<span>Log this exercise in one more session to see your trend line.</span></div>`;
  }
  const W = 320; const H = 170; const L = 36; const R = 14; const T = 16; const B = 26;
  const kgs = pts.map((p) => p.kg);
  const span = Math.max(Math.max(...kgs) - Math.min(...kgs), 5);
  const step = niceStep(span / 3);
  const lo = Math.max(0, Math.floor((Math.min(...kgs) - step / 2) / step) * step);
  const hi = Math.ceil((Math.max(...kgs) + step / 4) / step) * step;
  const x = (i) => L + (i / (pts.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - B} L${x(0).toFixed(1)},${H - B} Z`;
  const mid = Math.floor((pts.length - 1) / 2);
  const xLabels = [...new Set([0, pts.length > 4 ? mid : -1, pts.length - 1])].filter((i) => i >= 0);
  return `<div class="pchart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Heaviest set per session, from ${fmtKg(kgs[0])} kg to ${fmtKg(kgs[kgs.length - 1])} kg">
      <defs><linearGradient id="pfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--train)" stop-opacity=".22"/><stop offset="1" stop-color="var(--train)" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="pgrid" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>
        <text class="paxis" x="${L - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${fmtKg(t)}</text>`).join('')}
      ${xLabels.map((i) => `<text class="paxis" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'middle'}">${esc(new Date(pts[i].at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}</text>`).join('')}
      <path d="${area}" fill="url(#pfill)"/>
      <path class="pline" d="${line}"/>
      ${pts.map((p, i) => `<circle class="pdot ${i === pts.length - 1 ? 'last' : ''}" cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="${i === pts.length - 1 ? 5 : 4}"/>`).join('')}
      ${pts.map((p, i) => `<circle class="pt-hit" tabindex="0" cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="16"
        data-tip="${esc(`${fmtKg(p.kg)} kg × ${p.reps}`)}" data-sub="${esc(fmtDay(p.at))}"/>`).join('')}
    </svg>
    <div class="tip" hidden><strong></strong><span></span></div>
  </div>`;
}

function exerciseProgressSheet(key, extra = '') {
  const hist = exerciseHistory(key);
  const pts = hist.filter((h) => h.kg > 0);
  const best = Math.max(0, ...pts.map((p) => p.kg));
  const change = pts.length > 1 ? pts[pts.length - 1].kg - pts[0].kg : 0;
  let running = 0;
  const rows = hist.map((h) => { const pr = h.kg > running && running > 0; running = Math.max(running, h.kg); return { ...h, pr }; }).reverse();
  openSheet(titleCase(key), `
    <div class="stats">
      <div class="stat"><div class="stat-value num">${fmtKg(best)}<small> kg</small></div><div class="stat-label">Best</div></div>
      <div class="stat"><div class="stat-value num">${change > 0 ? '+' : ''}${fmtKg(change)}</div><div class="stat-label">Kg since first</div></div>
      <div class="stat"><div class="stat-value num">${hist.length}</div><div class="stat-label">${hist.length === 1 ? 'Session' : 'Sessions'}</div></div>
    </div>
    <section class="card" style="margin-top:12px">
      <div class="card-head"><div class="card-title">Heaviest set</div><div class="card-sub">Per session</div></div>
      ${progressChart(pts)}
    </section>
    <span class="label">Sessions</span>
    <section class="card">${rows.map((h) => `<div class="row">
      <div class="row-main"><div class="row-title">${esc(fmtDay(h.at))}</div><div class="row-sub">${esc(summariseSets(h.ex, h.sets))}</div></div>
      <div class="row-end">${h.pr ? `<span class="pr-badge">${icon('trophy', 13, 2.2)}PR</span>` : ''}<strong>${fmtKg(h.kg)} kg × ${h.reps}</strong><span>${shortKg(h.volume)} kg total</span></div>
    </div>`).join('')}</section>${extra}`);
}

const shortKg = (v) => (v >= 10000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K` : Math.round(v).toLocaleString('en-IN'));

/* ---------- Line chart over time (body weight) ---------- */

/**
 * One series plotted against real dates (entries can be days apart), with an optional
 * dashed goal line. pts: [{ at, v }] oldest first.
 */
function lineChart(pts, { color = 'var(--goal)', goal = null, unit = 'kg', compact = false, id = 'lc' } = {}) {
  if (pts.length < 2) {
    return `<div class="pchart-empty">${icon('up', 22, 1.6)}<span>${pts.length ? 'Log one more entry to see your trend line.' : 'No entries yet.'}</span></div>`;
  }
  const W = 320; const H = compact ? 130 : 180; const L = 36; const R = 14; const T = 16; const B = 26;
  const vals = pts.map((p) => p.v);
  const hasGoal = Number.isFinite(goal) && goal > 0;
  const lowV = Math.min(...vals, hasGoal ? goal : Infinity);
  const highV = Math.max(...vals, hasGoal ? goal : -Infinity);
  const step = niceStep(Math.max(highV - lowV, 2) / 3);
  const lo = Math.floor((lowV - step / 4) / step) * step;
  const hi = Math.ceil((highV + step / 4) / step) * step;
  const t0 = pts[0].at; const t1 = pts[pts.length - 1].at;
  const x = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo || 1)) * (H - T - B);
  const ticks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.at).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(t1).toFixed(1)},${H - B} L${x(t0).toFixed(1)},${H - B} Z`;
  const fmtD = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const many = pts.length > 30;
  const gid = `lcfill-${id}`;
  return `<div class="pchart lc" style="--c:${color}">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`From ${fmtKg(vals[0])} ${unit} to ${fmtKg(vals[vals.length - 1])} ${unit}${hasGoal ? `, goal ${fmtKg(goal)} ${unit}` : ''}`)}">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${ticks.map((t) => `<line class="pgrid" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>
        <text class="paxis" x="${L - 8}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${fmtKg(t)}</text>`).join('')}
      <text class="paxis" x="${L}" y="${H - 6}" text-anchor="start">${esc(fmtD(t0))}</text>
      <text class="paxis" x="${W - R}" y="${H - 6}" text-anchor="end">${esc(fmtD(t1))}</text>
      <path d="${area}" fill="url(#${gid})"/>
      ${hasGoal ? `<line class="pgoal" x1="${L}" x2="${W - R}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}"/>
        <text class="pgoal-label" x="${W - R}" y="${(y(goal) - 5).toFixed(1)}" text-anchor="end">Goal ${fmtKg(goal)} ${esc(unit)}</text>` : ''}
      <path class="pline" d="${line}"/>
      ${pts.map((p, i) => `<circle class="pdot ${i === pts.length - 1 ? 'last' : ''}" cx="${x(p.at).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${i === pts.length - 1 ? 5 : many ? 2 : 3.5}"/>`).join('')}
      ${pts.map((p) => `<circle class="pt-hit" tabindex="0" cx="${x(p.at).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${many ? 8 : 14}"
        data-tip="${esc(`${fmtKg(p.v)} ${unit}`)}" data-sub="${esc(fmtDay(p.at))}"/>`).join('')}
    </svg>
    <div class="tip" hidden><strong></strong><span></span></div>
  </div>`;
}

/* ---------- Body weight ---------- */

const weightGoal = () => { const g = Number(data().settings.weightGoal); return g > 0 ? g : null; };
const sortedWeights = () => [...(data().weights ?? [])].sort((a, b) => a.at - b.at);
const latestWeight = () => sortedWeights().at(-1) ?? null;
/** Weight on or just before a moment (for "change in 30 days"). */
function weightAt(t) {
  const list = sortedWeights().filter((w) => w.at <= t);
  return list.at(-1) ?? null;
}
/** true = moved toward the goal, false = away from it, null = no goal or no change. */
function towardGoal(from, to) {
  const g = weightGoal();
  if (g === null || from === to) return null;
  return Math.abs(to - g) < Math.abs(from - g);
}
/** A change label like "−1.2 kg", coloured by whether it moved toward the goal. */
function weightChange(from, to, suffix = '') {
  const d = Math.round((to - from) * 10) / 10;
  const dir = towardGoal(from, to);
  const color = dir === null ? 'var(--text-2)' : dir ? 'var(--good)' : 'var(--critical)';
  const text = d === 0 ? `No change${suffix}` : `${d > 0 ? '+' : '−'}${fmtKg(Math.abs(d))} kg${suffix}`;
  const meaning = dir === null ? '' : dir ? ' (toward goal)' : ' (away from goal)';
  return `<span class="status" style="--s:${color}">${icon(d > 0 ? 'up' : d < 0 ? 'down' : 'minus', 14, 2.4)}${esc(text)}<span class="sr-only">${meaning}</span></span>`;
}

/* Maintenance range: daily weight swings of 0.5–1 kg are normal (water, food), so being within
   ± band of the goal counts as "on target". */
const weightBand = () => { const b = Number(data().settings.weightBand); return b > 0 ? b : 1; };
const inWeightRange = (kg) => { const g = weightGoal(); return g !== null && Math.abs(kg - g) <= weightBand() + 1e-9; };
/** When your current run of in-range weigh-ins began (null if the latest one is out of range). */
function inRangeSince() {
  const list = sortedWeights();
  if (!list.length || !inWeightRange(list.at(-1).kg)) return null;
  let since = list.at(-1).at;
  for (let i = list.length - 1; i >= 0 && inWeightRange(list[i].kg); i -= 1) since = list[i].at;
  return since;
}
/** Everything the Today tile and Day score need about body weight. */
function weightStatus() {
  const last = latestWeight();
  const g = weightGoal(); const band = weightBand();
  if (!last) return { ok: false, score: 0, ring: 0, label: 'Weight', value: '–', of: 'tap to weigh in', streakText: '' };
  const stale = Date.now() - last.at > 7 * 86400000; // no weigh-in for a week: nudge
  const value = `${fmtKg(last.kg)} kg`;
  if (g === null) return { ok: !stale, score: stale ? 0 : 1, ring: stale ? 0.3 : 1, label: stale ? 'Weigh in' : 'Weight', value, of: 'set a goal', streakText: '' };
  const diff = last.kg - g;
  const inRange = Math.abs(diff) <= band + 1e-9;
  const ok = inRange && !stale;
  const near = clamp01(1 - Math.max(0, Math.abs(diff) - band) / (band * 3));
  const since = inRange ? inRangeSince() : null;
  const days = since ? Math.floor((Date.now() - since) / 86400000) : 0;
  return {
    ok,
    score: ok ? 1 : near * (stale ? 0.5 : 1),
    ring: ok ? 1 : near * (stale ? 0.5 : 1),
    label: stale ? 'Weigh in' : inRange ? 'In range' : diff > 0 ? 'Above range' : 'Below range',
    value,
    of: `goal ${fmtKg(g)} ± ${fmtKg(band)}`,
    streakText: since && days >= 7 ? `In your weight range for ${days >= 14 ? plural(Math.floor(days / 7), 'week') : plural(days, 'day')}` : '',
    days,
  };
}

function weightCard() {
  const list = sortedWeights();
  const last = list.at(-1);
  const goal = weightGoal();
  const monthAgo = last ? weightAt(last.at - 30 * 86400000) ?? list[0] : null;
  const recent = list.filter((w) => w.at >= Date.now() - 90 * 86400000);
  return `<section class="card">
    <div class="card-head"><div class="card-title">Body weight</div>
      ${list.length ? `<button class="see-all press" style="color:var(--goal)" data-action="weight-open">See all ${list.length}</button>` : ''}</div>
    ${last ? `<div class="bw-top">
        <div><div class="bw-num num">${fmtKg(last.kg)}<small> kg</small></div>
          <div class="row-sub">${esc(isToday(last.at) ? 'Today' : fmtDay(last.at))}</div></div>
        <div class="bw-chips">
          ${monthAgo && monthAgo !== last ? weightChange(monthAgo.kg, last.kg, ' in 30 days') : ''}
          ${goal ? (inWeightRange(last.kg)
            ? `<span class="status" style="--s:var(--good)">${icon('check', 14, 2.4)}In range</span>${weightStatus().streakText ? `<span class="faint small">${esc(weightStatus().streakText.replace('In your weight range for ', 'for '))}</span>` : ''}`
            : `<span class="faint small num">${fmtKg(Math.round((Math.abs(last.kg - goal) - weightBand()) * 10) / 10)} kg outside your range</span>`) : ''}
        </div>
      </div>
      ${lineChart(recent.length >= 2 ? recent.map((w) => ({ at: w.at, v: w.kg })) : list.slice(-2).map((w) => ({ at: w.at, v: w.kg })), { goal, compact: true, id: 'card' })}`
    : emptyState('scale', 'Log your weight to see your trend and a goal line.')}
    <button class="btn ghost press" style="margin-top:12px" data-action="weight-add">${icon('plus', 18, 2.4)}Log weight</button>
  </section>`;
}

function weightSheet() {
  const list = sortedWeights();
  const goal = weightGoal();
  const last = list.at(-1);
  const first = list[0];
  const rows = list.map((w, i) => ({ ...w, prev: list[i - 1] })).reverse();
  openSheet('Body weight', `
    <div class="stats">
      <div class="stat"><div class="stat-value num">${last ? fmtKg(last.kg) : '–'}<small> kg</small></div><div class="stat-label">Current</div></div>
      <div class="stat"><div class="stat-value num">${last && first ? `${last.kg - first.kg > 0 ? '+' : ''}${fmtKg(Math.round((last.kg - first.kg) * 10) / 10)}` : '–'}</div><div class="stat-label">Kg since first</div></div>
      <div class="stat"><div class="stat-value num">${goal ? fmtKg(goal) : '–'}<small>${goal ? ' kg' : ''}</small></div><div class="stat-label">Goal</div></div>
    </div>
    <section class="card" style="margin-top:12px">
      <div class="card-head"><div class="card-title">Trend</div><div class="card-sub">${goal ? 'Dashed line = goal' : 'All entries'}</div></div>
      ${lineChart(list.map((w) => ({ at: w.at, v: w.kg })), { goal, id: 'sheet' })}
    </section>
    <div class="field-row" style="margin-top:12px">
      <button type="button" class="btn tint press" style="--c:var(--goal)" data-action="weight-add">${icon('plus', 18, 2.4)}Log weight</button>
      <button type="button" class="btn ghost press" data-action="weight-goal">${icon('goals', 18)}${goal ? 'Change goal' : 'Set goal'}</button>
    </div>
    <span class="label">Entries</span>
    <section class="card">${rows.length ? rows.map((w) => `<div class="row">
      <div class="tile-icon" style="--c:var(--goal)">${icon('scale', 18)}</div>
      <div class="row-main"><div class="row-title num">${fmtKg(w.kg)} kg</div><div class="row-sub">${esc(fmtDay(w.at))} · ${esc(fmtTime(w.at))}</div></div>
      <div class="row-end">${w.prev ? weightChange(w.prev.kg, w.kg) : '<span class="faint small">First entry</span>'}</div>
      <button type="button" class="x-btn press" data-action="weight-del" data-id="${esc(w.id)}" aria-label="Delete ${fmtKg(w.kg)} kg entry">${icon('x', 16)}</button>
    </div>`).join('') : emptyState('scale', 'No entries yet.')}</section>`);
}

function weightForm() {
  const last = latestWeight();
  openSheet('Log weight', `
    <div class="amount"><input name="kg" inputmode="decimal" placeholder="${last ? esc(fmtKg(last.kg)) : '70'}" aria-label="Weight in kg" style="caret-color:var(--goal)"><span>kg</span></div>
    ${field('When', `<input type="datetime-local" name="at" value="${toLocalInput(Date.now())}">`)}
    <p class="muted small" style="margin-top:12px">Tip: weigh yourself at the same time each day, for example in the morning before breakfast.</p>
  `, (form, f) => {
    const kg = Math.round(num(f.get('kg')) * 10) / 10;
    if (!(kg >= 20 && kg <= 400)) { toast('Enter a weight between 20 and 400 kg', true); return false; }
    write(store.add('weights', { at: fromLocalInput(f.get('at')), kg }), `Logged ${fmtKg(kg)} kg`);
  }, 'Save', 'var(--goal)');
  setTimeout(() => document.querySelector('[name=kg]')?.focus(), 80);
}

function weightGoalForm() {
  const goal = weightGoal();
  openSheet('Goal weight', `
    <div class="amount"><input name="goal" inputmode="decimal" value="${goal ? esc(fmtKg(goal)) : ''}" placeholder="${esc(fmtKg(latestWeight()?.kg ?? 70))}" aria-label="Goal weight in kg" style="caret-color:var(--goal)"><span>kg</span></div>
    <span class="label">Stay within</span>
    <div class="seg">${[0.5, 1, 1.5, 2].map((b) => `<label><input type="radio" name="band" value="${b}" ${weightBand() === b ? 'checked' : ''}><span>± ${b} kg</span></label>`).join('')}</div>
    <p class="muted small" style="margin-top:12px;text-align:center">Your weight naturally moves 0.5–1 kg day to day (water, food). Anywhere inside this range counts as on target.</p>
    ${goal ? `<button type="button" class="btn danger press" style="margin-top:20px" data-action="weight-goal-clear">Remove goal</button>` : ''}
  `, (form, f) => {
    const g = Math.round(num(f.get('goal')) * 10) / 10;
    if (!(g >= 20 && g <= 400)) { toast('Enter a goal between 20 and 400 kg', true); return false; }
    const band = [0.5, 1, 1.5, 2].includes(Number(f.get('band'))) ? Number(f.get('band')) : 1;
    write(store.saveSettings({ weightGoal: g, weightBand: band }), `Goal ${fmtKg(g)} kg ± ${band}`);
  }, 'Save', 'var(--goal)');
}

/* ---------- Training year heatmap ---------- */

const DAY_MS = 86400000;
/** Consecutive weeks with at least one workout. The current week never breaks a streak. */
function weekStreaks(ws) {
  const weeks = new Set(ws.map((w) => startOfWeek(w.at).getTime()));
  const prevWeek = (t) => { const d = new Date(t); d.setDate(d.getDate() - 7); return startOfWeek(d).getTime(); };
  let cur = startOfWeek().getTime();
  if (!weeks.has(cur)) cur = prevWeek(cur);
  let current = 0;
  while (weeks.has(cur)) { current += 1; cur = prevWeek(cur); }
  let best = 0; let run = 0; let last = null;
  for (const t of [...weeks].sort((a, b) => a - b)) {
    run = last !== null && Math.round((t - last) / (7 * DAY_MS)) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    last = t;
  }
  return { current, best };
}

function heatmapCard() {
  const ws = doneWorkouts();
  const byDay = new Map();
  for (const w of ws) {
    const k = startOfDay(w.at).getTime();
    const d = byDay.get(k) ?? { minutes: 0, labels: [] };
    d.minutes += Number(w.minutes) || 0;
    d.labels.push(w.type === 'Gym' && w.muscles?.length ? w.muscles.join(' · ') : w.type);
    byDay.set(k, d);
  }
  const WEEKS = 53;
  const first = startOfWeek(); first.setDate(first.getDate() - (WEEKS - 1) * 7);
  const today = startOfDay().getTime();
  let cells = ''; let months = ''; let lastMonth = -1; let lastLabelCol = -9;
  let active = 0; let sessions = 0;
  for (let c = 0; c < WEEKS; c += 1) {
    const colStart = new Date(first); colStart.setDate(first.getDate() + c * 7);
    if (colStart.getMonth() !== lastMonth) {
      if (c - lastLabelCol >= 3) {
        months += `<span class="hm-m" style="grid-column:${c + 1}/span 3">${esc(colStart.toLocaleDateString('en-IN', { month: 'short' }))}</span>`;
        lastLabelCol = c;
      }
      lastMonth = colStart.getMonth();
    }
    for (let r = 0; r < 7; r += 1) {
      const day = new Date(first); day.setDate(first.getDate() + c * 7 + r);
      const t = day.getTime();
      const area = `grid-area:${r + 2}/${c + 1}`;
      if (t > today) { cells += `<span class="hm-cell future" style="${area}"></span>`; continue; }
      const d = byDay.get(t);
      const m = d?.minutes ?? 0;
      if (d) { active += 1; sessions += d.labels.length; }
      const lvl = !d ? 0 : m >= 90 ? 4 : m >= 60 ? 3 : m >= 30 ? 2 : 1;
      const tip = d ? `${m} min · ${d.labels.join(', ')}` : 'Rest day';
      cells += `<span class="hm-cell l${lvl} ${t === today ? 'today' : ''}" style="${area}" tabindex="-1"
        data-tip="${esc(tip)}" data-sub="${esc(fmtDay(t))}" data-action="heatmap-day" data-day="${t}"></span>`;
    }
  }
  const { current, best } = weekStreaks(ws);
  return `<section class="card">
    <div class="card-head"><div class="card-title">Training year</div><div class="card-sub">Last 12 months</div></div>
    <div class="stats" style="margin-bottom:14px">
      <div class="stat"><div class="stat-value num">${current}</div><div class="stat-label">Week streak</div></div>
      <div class="stat"><div class="stat-value num">${best}</div><div class="stat-label">Best streak</div></div>
      <div class="stat"><div class="stat-value num">${active}</div><div class="stat-label">Days trained</div></div>
    </div>
    <div class="hm-wrap">
      <div class="hm-days" aria-hidden="true"><span></span><span>M</span><span></span><span>W</span><span></span><span>F</span><span></span><span></span></div>
      <div class="hm-scroll"><div class="hm" role="img" aria-label="${esc(`${active} training days and ${sessions} sessions in the last 12 months`)}">${months}${cells}</div></div>
    </div>
    <div class="hm-legend"><span>Less</span><i class="hm-cell l0"></i><i class="hm-cell l1"></i><i class="hm-cell l2"></i><i class="hm-cell l3"></i><i class="hm-cell l4"></i><span>More</span></div>
    <div class="tip" hidden><strong></strong><span></span></div>
  </section>`;
}

/* ---------- Edit or back-fill a gym workout ---------- */

let editDraft = null;
const guessMuscle = (name) => MUSCLES.find((m) => exercisesFor(m).some((n) => normName(n) === normName(name))) ?? null;

function workoutEditor(id) {
  const w = id ? data().workouts.find((x) => x.id === id) : null;
  if (w && w.type !== 'Gym') { quickLogForm(w); return; }
  const yesterday = startOfDay(); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(18, 0, 0, 0);
  editDraft = {
    id: w?.id ?? null,
    at: w?.at ?? yesterday.getTime(),
    minutes: w?.minutes || 60,
    notes: w?.notes ?? '',
    muscles: w?.muscles ?? [],
    exercises: (w?.exercises ?? []).map((e) => ({
      name: e.name,
      muscle: e.muscle ?? guessMuscle(e.name) ?? 'Chest',
      sets: exSets(e).map((s) => ({ kg: s.kg || 0, reps: s.reps || 0, ...(s.at ? { at: s.at } : {}) })),
    })),
  };
  openSheet(w ? 'Edit workout' : 'Log past workout', editorBody(), () => saveEditor(), 'Save', 'var(--train)');
}

function editorBody() {
  const d = editDraft;
  return `
    <span class="label">When</span>
    <div class="field-row">
      ${field('Date & time', `<input type="datetime-local" data-ed="at" value="${toLocalInput(d.at)}" max="${toLocalInput(Date.now())}">`)}
      ${field('Duration (min)', `<input type="number" data-ed="minutes" inputmode="numeric" min="1" max="600" value="${esc(d.minutes)}">`)}
    </div>
    ${d.exercises.map((e, i) => {
      const cardio = e.muscle === 'Cardio';
      return `<section class="card ex-card ed-ex">
      <div class="ex-head">
        <div class="row-main"><div class="row-title">${esc(e.name)}</div><div class="row-sub">${esc(e.muscle)} · ${plural(e.sets.length, 'set')}</div></div>
        <button type="button" class="x-btn press" data-action="ed-del-ex" data-i="${i}" aria-label="Remove ${esc(e.name)}">${icon('trash', 17)}</button>
      </div>
      ${e.sets.map((s, j) => `<div class="ed-set">
        <span class="set-no num">${j + 1}</span>
        ${cardio ? '' : `<input class="num" data-ed-set="${i}:${j}:kg" inputmode="decimal" value="${esc(fmtKg(s.kg))}" aria-label="Set ${j + 1} weight in kg"><span class="faint small">kg ×</span>`}
        <input class="num" data-ed-set="${i}:${j}:reps" inputmode="numeric" value="${esc(s.reps)}" aria-label="Set ${j + 1} ${cardio ? 'minutes' : 'reps'}"><span class="faint small">${cardio ? 'min' : 'reps'}</span>
        <button type="button" class="x-btn press" data-action="ed-del-set" data-i="${i}" data-j="${j}" aria-label="Delete set ${j + 1}">${icon('x', 16)}</button>
      </div>`).join('')}
      <button type="button" class="text-btn ed-add-set" data-action="ed-add-set" data-i="${i}">${icon('plus', 15, 2.4)} Add set</button>
    </section>`;
    }).join('')}
    <span class="label">Add exercise</span>
    <div class="field-row">
      ${field('Exercise', '<input id="ed-new-name" list="ed-names" maxlength="60" placeholder="e.g. Bench press">')}
      ${field('Muscle', `<select id="ed-new-muscle">${MUSCLES.map((m) => `<option>${esc(m)}</option>`).join('')}</select>`)}
    </div>
    ${nameDatalist('ed-names')}
    <button type="button" class="btn ghost press" style="margin-top:10px" data-action="ed-add-ex">${icon('plus', 18, 2.4)}Add exercise</button>
    <span class="label">Notes</span>
    ${field('Notes', `<textarea data-ed="notes" rows="2" maxlength="500" placeholder="Optional">${esc(d.notes)}</textarea>`)}
    ${d.id ? `<button type="button" class="btn danger press" style="margin-top:20px" data-action="delete" data-col="workouts" data-id="${esc(d.id)}">${icon('trash', 18)}Delete workout</button>` : ''}`;
}

/** Redraw the editor in place, keeping the scroll position. */
function rerenderEditor() {
  const body = document.querySelector('.sheet-body');
  if (!body || !editDraft) return;
  const top = body.scrollTop;
  body.innerHTML = editorBody();
  body.scrollTop = top;
}

function saveEditor() {
  const d = editDraft;
  if (!d) return false;
  if (!(d.at <= Date.now())) { toast('The date can’t be in the future', true); return false; }
  const minutes = Math.round(num(d.minutes));
  if (!(minutes >= 1 && minutes <= 600)) { toast('Duration: 1 to 600 minutes', true); return false; }
  const exercises = d.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.reps > 0).map((s) => ({ kg: e.muscle === 'Cardio' ? 0 : Math.max(0, Math.min(1000, s.kg)), reps: s.reps, at: s.at ?? d.at })) }))
    .filter((e) => e.sets.length);
  if (!exercises.length) { toast('Add at least one set with reps', true); return false; }
  const muscles = [...new Set(exercises.map((e) => e.muscle))];
  const totalSets = sum(exercises, (e) => e.sets.length);
  const values = {
    at: d.at, minutes, exercises, muscles, notes: clean(d.notes, 500),
    intensity: totalSets >= 18 ? 'Hard' : totalSets >= 9 ? 'Medium' : 'Easy',
  };
  if (d.id) write(store.update('workouts', d.id, values), 'Workout updated');
  else write(store.add('workouts', { ...values, type: 'Gym', status: 'done', calories: 0, steps: 0, endedAt: d.at + minutes * 60000 }), 'Workout saved');
  editDraft = null;
  return true;
}

// Keep the editor's draft in step with what is typed.
document.addEventListener('input', (e) => {
  if (!editDraft) return;
  const t = e.target;
  if (t.dataset.ed === 'at') editDraft.at = fromLocalInput(t.value);
  else if (t.dataset.ed === 'minutes') editDraft.minutes = t.value;
  else if (t.dataset.ed === 'notes') editDraft.notes = t.value;
  else if (t.dataset.edSet) {
    const [i, j, f] = t.dataset.edSet.split(':');
    const s = editDraft.exercises[Number(i)]?.sets[Number(j)];
    if (s) s[f] = f === 'kg' ? Math.round(num(t.value) * 100) / 100 : Math.round(num(t.value));
  } else if (t.id === 'ed-new-name') {
    const m = guessMuscle(t.value);
    const sel = document.getElementById('ed-new-muscle');
    if (m && sel) sel.value = m;
  }
});

/* ---------- Keep the screen awake during a workout ---------- */

let wakeLock = null;
let wakeWanted = false;
let wakePending = false;
async function syncWakeLock(on) {
  wakeWanted = on;
  if (!('wakeLock' in navigator)) return;
  if (on && !wakeLock && !wakePending && document.visibilityState === 'visible') {
    wakePending = true;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
      if (!wakeWanted) { wakeLock.release().catch(() => {}); wakeLock = null; }
    } catch { /* low battery mode or not allowed: the screen just behaves normally */ }
    wakePending = false;
  } else if (!on && wakeLock) {
    const lock = wakeLock; wakeLock = null;
    lock.release().catch(() => {});
  }
}
// The phone drops the lock when the app goes to the background; take it back on return.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wakeWanted) syncWakeLock(true); });

/* ================= Exercise library (built-in + your own) ================= */

const makeId = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 20) : `${Date.now()}${Math.random().toString(36).slice(2, 10)}`);
const customExercises = () => (data().exercises ?? []).filter((e) => e.name && MUSCLES.includes(e.muscle));
/** Exercise names for a muscle: built-in first, then the ones you created. */
function exercisesFor(m) {
  const own = customExercises().filter((e) => e.muscle === m).map((e) => e.name)
    .filter((n) => !LIBRARY[m].some((x) => normName(x) === normName(n)));
  return [...LIBRARY[m], ...own];
}
const allExerciseNames = () => MUSCLES.flatMap(exercisesFor);
const equipmentOf = (name) => customExercises().find((e) => normName(e.name) === normName(name))?.equipment ?? BUILTIN_EQUIP[normName(name)] ?? '';
const nameDatalist = (id) => `<datalist id="${id}">${[...new Set(allExerciseNames())].map((n) => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;

let libQuery = '';
let libMuscle = 'All';
const searchKey = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

let libLimit = 60;
let exploreRegion = null;
let exploreScope = 'main';
let exploreLimit = 40;

/**
 * Everything in the library: your own exercises, the app's familiar names (with a demo when one
 * matches), then the rest of the photo library.
 */
function libraryEntries() {
  const own = customExercises();
  const ownKeys = new Set(own.map((e) => normName(e.name)));
  const used = new Set();
  const builtin = MUSCLES.flatMap((m) => LIBRARY[m].filter((n) => !ownKeys.has(normName(n))).map((name) => {
    const d = dbFor(name);
    if (d) used.add(d.id);
    return { name, muscle: m, equip: BUILTIN_EQUIP[normName(name)] ?? '', custom: false, db: d };
  }));
  const fromDb = exDb ? exDb.list.filter((e) => !used.has(e.id) && !ownKeys.has(normName(e.n)))
    .map((e) => ({ name: e.n, muscle: dbGroup(e), equip: dbEquip(e), custom: false, db: e })) : [];
  return [...own.map((e) => ({ name: e.name, muscle: e.muscle, equip: e.equipment ?? '', custom: true, id: e.id, db: null })), ...builtin, ...fromDb];
}

function exerciseRow(e, best) {
  const kg = best[normName(e.name)];
  return `<button class="row press ex-row" data-action="lib-open" data-name="${esc(e.name)}" data-muscle="${esc(e.muscle)}">
    ${e.db ? `<img class="ex-thumb" src="${imgUrl(e.db, 0)}" alt="" loading="lazy" decoding="async">`
      : `<div class="tile-icon" style="--c:${e.muscle === 'Cardio' ? 'var(--water)' : 'var(--train)'}">${icon(e.muscle === 'Cardio' ? 'run' : 'gym', 19)}</div>`}
    <div class="row-main"><div class="row-title">${esc(e.name)}</div>
      <div class="row-sub">${esc(e.muscle)}${e.equip ? ` · ${esc(e.equip)}` : ''}${e.custom ? ' · Yours' : ''}</div></div>
    <div class="row-end">${kg ? `<strong class="num">${fmtKg(kg)} kg</strong><span>Best</span>` : `<span class="faint">${icon('right', 16)}</span>`}</div>
  </button>`;
}

function libraryList() {
  const words = searchKey(libQuery).split(' ').filter(Boolean);
  const best = bestLifts();
  const list = libraryEntries().filter((e) => (libMuscle === 'All' || e.muscle === libMuscle)
    && words.every((w) => searchKey(`${e.name} ${e.muscle} ${e.equip}`).includes(w)));
  if (!list.length) return emptyState('train', libQuery ? `Nothing matches “${libQuery}”. Create it as your own exercise.` : 'No exercises here yet.');
  return `<div class="card-sub" style="margin-bottom:6px">${plural(list.length, 'exercise')}${exDb ? '' : ' · loading photo library…'}</div>
    ${list.slice(0, libLimit).map((e) => exerciseRow(e, best)).join('')}
    ${list.length > libLimit ? `<button class="btn ghost press" style="margin-top:12px" data-action="lib-more">Show more (${list.length - libLimit} left)</button>` : ''}`;
}

function libraryView() {
  loadExDb();
  const total = libraryEntries().length;
  return `
    ${head('Train', 'Exercises', `<button class="icon-btn press" data-tab="train" aria-label="Back to Train">${icon('left', 20)}</button>`)}
    <div class="stack">
      <div class="lib-top">
        <label class="search">${icon('search', 18)}<input id="lib-search" type="search" value="${esc(libQuery)}" placeholder="Search ${total} exercises" autocomplete="off" aria-label="Search exercises"></label>
        <button class="by-muscle press" data-action="open-explore">${icon('body', 18)}By muscle</button>
      </div>
      <div class="filter-chips" role="group" aria-label="Filter by muscle">${['All', ...MUSCLES].map((m) => `
        <button class="fchip press" data-action="lib-filter" data-m="${esc(m)}" aria-pressed="${libMuscle === m}">${esc(m)}</button>`).join('')}</div>
      <button class="card row press create-ex" data-action="lib-new">
        <div class="tile-icon" style="--c:var(--text-2)">${icon('plus', 20, 2.2)}</div>
        <div class="row-main"><div class="row-title">Create your own exercise</div><div class="row-sub">Name, muscle and equipment</div></div>
        <span class="faint">${icon('right', 18)}</span></button>
      <section class="card" id="lib-list">${libraryList()}</section>
    </div>`;
}

/* ---------- Explore muscles: tap the body, see what trains it ---------- */

function regionCounts() {
  const counts = Object.fromEntries(REGIONS.map((r) => [r.id, 0]));
  for (const e of exDb?.list ?? []) for (const r of REGIONS) if (e.p.some((m) => r.db.includes(m))) counts[r.id] += 1;
  return counts;
}

function exploreView() {
  loadExDb();
  const counts = regionCounts();
  const sel = REGIONS.find((r) => r.id === exploreRegion) ?? null;
  const look = (slug) => {
    const r = SLUG_REGION[slug];
    if (!r) return null;
    return { cls: `ex-r ${sel?.id === r.id ? 'sel' : ''}`, attrs: `data-action="explore-pick" data-r="${r.id}" role="button" aria-label="${esc(r.name)}"` };
  };
  const sexToggle = `<div class="seg-tabs small" role="tablist" aria-label="Body">${[['male', 'Male'], ['female', 'Female']].map(([v, l]) => `
    <button class="press" role="tab" data-action="body-sex" data-v="${v}" aria-selected="${bodySex() === v}">${l}</button>`).join('')}</div>`;

  let results = '';
  if (sel && exDb) {
    const main = exDb.list.filter((e) => e.p.some((m) => sel.db.includes(m)));
    const also = exDb.list.filter((e) => !e.p.some((m) => sel.db.includes(m)) && e.s.some((m) => sel.db.includes(m)));
    const list = exploreScope === 'main' ? main : also;
    const best = bestLifts();
    const rows = list.slice(0, exploreLimit).map((e) => exerciseRow({ name: e.n, muscle: dbGroup(e), equip: dbEquip(e), db: e }, best)).join('');
    results = `<section class="card explore-results" id="explore-results">
      <div class="card-head"><div class="row-main"><div class="card-title">${esc(sel.name)}</div>
        <div class="card-sub">${plural(main.length, 'exercise')} target it · ${also.length} also work it</div></div>
        <button class="x-btn press" data-action="explore-pick" data-r="" aria-label="Clear selection">${icon('x', 18)}</button></div>
      <div class="seg-tabs" role="tablist" style="margin-bottom:8px">${[['main', `Main target · ${main.length}`], ['also', `Also works · ${also.length}`]].map(([t, l]) => `
        <button class="press" role="tab" data-action="explore-scope" data-t="${t}" aria-selected="${exploreScope === t}">${l}</button>`).join('')}</div>
      ${rows || emptyState('train', 'No exercises here.')}
      ${list.length > exploreLimit ? `<button class="btn ghost press" style="margin-top:12px" data-action="explore-more">Show more (${list.length - exploreLimit} left)</button>` : ''}
    </section>`;
  }

  return `
    ${head('Exercises', 'Explore muscles', `<button class="icon-btn press" data-tab="exercises" aria-label="Back to Exercises">${icon('left', 20)}</button>`)}
    <div class="stack">
      <p class="muted" style="margin:-6px 0 0">Tap a muscle to see the exercises that train it.</p>
      <section class="card explore-card">
        <div class="card-head" style="margin-bottom:6px"><div class="card-sub">${sel ? `Showing ${esc(sel.name)}` : 'Nothing selected'}</div>${sexToggle}</div>
        <div class="bodymap big">
          <figure class="bm-fig">${anatomy('front', look)}<figcaption>Front</figcaption></figure>
          <figure class="bm-fig">${anatomy('back', look)}<figcaption>Back</figcaption></figure>
        </div>
        <div class="filter-chips region-chips" role="group" aria-label="Muscles">${REGIONS.map((r) => `
          <button class="fchip press" data-action="explore-pick" data-r="${r.id}" aria-pressed="${sel?.id === r.id}">${esc(r.name)} <span class="num faint">${exDb ? counts[r.id] : ''}</span></button>`).join('')}</div>
      </section>
      ${sel && !exDb ? `<section class="card">${emptyState('clock', 'Loading exercises…')}</section>` : results}
    </div>`;
}

/* ---------- Exercise detail: photo demo, how-to steps, muscles ---------- */

async function libraryDetail(name, muscle) {
  await loadExDb();
  const key = normName(name);
  const own = customExercises().find((e) => normName(e.name) === key);
  const d = own ? null : dbFor(name);
  const live = activeSession();
  const inLive = live?.exercises?.some((e) => normName(e.name) === key);
  const hist = exerciseHistory(key);
  const best = Math.max(0, ...hist.map((h) => h.kg));
  const group = MUSCLES.includes(muscle) ? muscle : d ? dbGroup(d) : 'Chest';
  const look = (slug) => {
    if (!d) return null;
    const r = SLUG_REGION[slug];
    if (!r) return null;
    const primary = d.p.some((m) => r.db.includes(m));
    const secondary = d.s.some((m) => r.db.includes(m));
    return primary ? { cls: 'hit-p' } : secondary ? { cls: 'hit-s' } : { cls: '' };
  };
  openSheet(name, `
    ${d ? `<div class="demo" role="img" aria-label="${esc(`${name}: start and end position, shown in a loop`)}">
        <img class="f0" src="${imgUrl(d, 0)}" alt="" decoding="async"><img class="f1" src="${imgUrl(d, 1)}" alt="" decoding="async">
        <span class="demo-tag">${icon('bolt', 12, 2.4)}Demo</span>
      </div>` : `<div class="detail-hero"><div class="tile-icon" style="--c:var(--train)">${icon(group === 'Cardio' ? 'run' : 'gym', 28)}</div></div>`}
    <div class="ex-facts">
      <span>${esc(group)}</span>
      ${d ? `<span>${esc(dbEquip(d))}</span><span>${esc(titleCase(d.l))}</span>${d.f ? `<span>${esc(titleCase(d.f))}</span>` : ''}` : equipmentOf(name) ? `<span>${esc(equipmentOf(name))}</span>` : ''}
      ${own ? '<span>Your exercise</span>' : ''}
    </div>
    ${hist.length ? `<button type="button" class="card row press" style="margin-top:12px" data-action="pb-open" data-name="${esc(key)}">
        <div class="tile-icon" style="--c:var(--warning)">${icon('trophy', 19)}</div>
        <div class="row-main"><div class="row-title">Your progress</div><div class="row-sub">${plural(hist.length, 'session')}${best ? ` · best ${fmtKg(best)} kg` : ''}</div></div>
        <span class="faint">${icon('right', 18)}</span></button>` : ''}
    ${live && !inLive ? `<button type="button" class="btn tint press" style="--c:var(--train);margin-top:12px" data-action="lib-add-live" data-name="${esc(name)}" data-muscle="${esc(group)}">${icon('plus', 18, 2.4)}Add to current workout</button>` : ''}
    ${d ? `<span class="label">Muscles worked</span>
      <section class="card">
        <div class="bodymap small-map">
          <figure class="bm-fig">${anatomy('front', look)}</figure><figure class="bm-fig">${anatomy('back', look)}</figure>
        </div>
        <div class="map-key" style="justify-content:center;margin-top:8px"><i class="key-p"></i>Main: ${esc(d.p.map(titleCase).join(', '))}${d.s.length ? `<i class="key-s"></i>Also: ${esc(d.s.map(titleCase).join(', '))}` : ''}</div>
      </section>
      <span class="label">How to do it</span>
      <ol class="steps how-to">${d.i.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : `<section class="card" style="margin-top:12px">${emptyState('up', hist.length ? 'No demo for this one yet. Your progress is above.' : 'No demo for this one. Your progress chart appears after your first session with it.')}</section>`}
    ${own ? `<button type="button" class="btn danger press" style="margin-top:16px" data-action="delete" data-col="exercises" data-id="${esc(own.id)}">${icon('trash', 18)}Delete my exercise</button>` : ''}
    ${d ? '<p class="faint small credit">Photos and steps: free-exercise-db (public domain).</p>' : ''}`);
}
function customExerciseForm() {
  openSheet('New exercise', `
    ${field('Name', `<input name="name" maxlength="60" placeholder="e.g. Machine chest press" value="${esc(libQuery)}">`)}
    <span class="label">Muscle</span>
    <div class="chips muscles">${MUSCLES.map((m) => `
      <label class="chip" style="--c:var(--train)"><input type="radio" name="muscle" value="${m}" ${m === (libMuscle === 'All' ? 'Chest' : libMuscle) ? 'checked' : ''}><span>${m}</span></label>`).join('')}</div>
    <span class="label">Equipment</span>
    <div class="chips muscles">${Object.values(EQUIPMENT).map((q, i) => `
      <label class="chip" style="--c:var(--train)"><input type="radio" name="equipment" value="${q}" ${i === 0 ? 'checked' : ''}><span>${q}</span></label>`).join('')}</div>
  `, (form, f) => {
    const raw = clean(f.get('name'), 60);
    if (!raw) { toast('Give the exercise a name', true); return false; }
    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (allExerciseNames().some((n) => normName(n) === normName(name))) { toast(`${name} is already in the library`, true); return false; }
    const muscle = MUSCLES.includes(f.get('muscle')) ? f.get('muscle') : 'Chest';
    const equipment = Object.values(EQUIPMENT).includes(f.get('equipment')) ? f.get('equipment') : 'Other';
    write(store.add('exercises', { name, muscle, equipment, createdAt: Date.now() }), `${name} added to your library`);
  }, 'Save', 'var(--train)');
}

// Search filters the list as you type, without redrawing the page (keeps the keyboard open).
document.addEventListener('input', (e) => {
  if (e.target.id !== 'lib-search') return;
  libQuery = e.target.value; libLimit = 60;
  const list = document.getElementById('lib-list');
  if (list) list.innerHTML = libraryList();
});

/* ================= Weekly plan & routines ================= */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayIndex = (t = Date.now()) => (new Date(t).getDay() + 6) % 7; // Monday = 0
const sortedRoutines = () => [...(data().routines ?? [])].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
const routineById = (id) => (id ? (data().routines ?? []).find((r) => r.id === id) ?? null : null);
const planDays = () => { const p = data().settings.plan?.days; return Array.from({ length: 7 }, (_, i) => (Array.isArray(p) && routineById(p[i]) ? p[i] : null)); };
const todaysRoutine = () => routineById(planDays()[dayIndex()]);
const routineMuscles = (r) => [...new Set((r?.exercises ?? []).map((e) => e.muscle))];
const routineSets = (r) => sum(r?.exercises ?? [], (e) => e.sets);
let planTab = 'schedule';

const STARTER_PLAN = [
  { day: 0, name: 'Chest & Triceps', ex: [['Bench press', 'Chest', 4, 8], ['Incline dumbbell press', 'Chest', 3, 10], ['Cable fly', 'Chest', 3, 12], ['Tricep pushdown', 'Triceps', 3, 12], ['Overhead extension', 'Triceps', 3, 10]] },
  { day: 1, name: 'Back & Biceps', ex: [['Lat pulldown', 'Back', 4, 10], ['Barbell row', 'Back', 3, 8], ['Seated cable row', 'Back', 3, 12], ['Barbell curl', 'Biceps', 3, 10], ['Hammer curl', 'Biceps', 3, 12]] },
  { day: 3, name: 'Legs & Abs', ex: [['Squat', 'Legs', 4, 8], ['Leg press', 'Legs', 3, 12], ['Romanian deadlift', 'Legs', 3, 10], ['Leg curl', 'Legs', 3, 12], ['Calf raise', 'Legs', 3, 15], ['Hanging leg raise', 'Abs', 3, 12]] },
  { day: 4, name: 'Shoulders & Forearms', ex: [['Overhead press', 'Shoulders', 4, 8], ['Lateral raise', 'Shoulders', 4, 15], ['Rear delt fly', 'Shoulders', 3, 15], ['Shrugs', 'Shoulders', 3, 12], ['Wrist curl', 'Forearms', 3, 15]] },
];

function loadStarterPlan() {
  const days = planDays();
  const now = Date.now();
  STARTER_PLAN.forEach((p, k) => {
    const id = makeId();
    write(store.set('routines', id, { name: p.name, createdAt: now + k, exercises: p.ex.map(([name, muscle, sets, reps]) => ({ name, muscle, sets, reps })) }));
    if (!days[p.day]) days[p.day] = id;
  });
  write(store.saveSettings({ plan: { days } }), 'Starter plan loaded');
}

function planView() {
  const routines = sortedRoutines();
  const days = planDays();
  const weekStart = startOfWeek();
  const ws = doneWorkouts();
  const tabs = `<div class="seg-tabs" role="tablist">${[['schedule', 'Schedule'], ['routines', 'Routines']].map(([t, l]) => `
    <button class="press" role="tab" data-action="plan-tab" data-t="${t}" aria-selected="${planTab === t}">${l}</button>`).join('')}</div>`;
  const starter = `<section class="card plan-empty">
      <div class="tile-icon" style="--c:var(--water);width:52px;height:52px;border-radius:16px;margin:0 auto">${icon('calendar', 26)}</div>
      <h3>No routines yet</h3>
      <p class="muted small">Make one, or load a 4-day starter split (chest, back, legs, shoulders) and change it to suit you.</p>
      <button class="btn tint press" style="--c:var(--water)" data-action="plan-starter">${icon('bolt', 18, 2.2)}Load starter plan</button>
      <button class="btn ghost press" style="margin-top:10px" data-action="routine-new">${icon('plus', 18, 2.4)}Create a routine</button>
    </section>`;

  let body;
  if (planTab === 'schedule') {
    body = `${routines.length ? '' : starter}
      <span class="label">This week</span>
      ${days.map((id, i) => {
        const r = routineById(id);
        const date = new Date(weekStart); date.setDate(weekStart.getDate() + i);
        const today = isToday(date);
        const done = ws.some((w) => sameDay(w.at, date));
        const past = date < startOfDay() && !today;
        const end = done ? `<span class="status" style="--s:var(--good)">${icon('check', 15, 2.4)}Done</span>`
          : today ? '<span class="pill">Today</span>' : past && r ? '<span class="faint small">Missed</span>' : `<span class="faint">${icon('right', 18)}</span>`;
        return `<button class="card row plan-day press ${today ? 'is-today' : ''}" data-action="plan-day" data-i="${i}">
          <div class="plan-dow"><b>${DAY_NAMES[i].slice(0, 2)}</b><small class="num">${date.getDate()}</small></div>
          <div class="tile-icon" style="--c:${r ? 'var(--water)' : 'var(--text-3)'}">${icon(r ? 'gym' : 'moon', 19)}</div>
          <div class="row-main"><div class="row-title">${esc(r?.name ?? 'Rest day')}</div>
            <div class="row-sub">${r ? esc(`${routineMuscles(r).join(' · ')} · ${plural(r.exercises.length, 'exercise')}`) : 'Tap to plan something'}</div></div>
          <div class="row-end">${end}</div>
        </button>`;
      }).join('')}
      ${todaysRoutine() && !activeSession() ? `<button class="btn tint press" style="--c:var(--train);margin-top:4px" data-action="start-routine" data-id="${esc(todaysRoutine().id)}">${icon('bolt', 18, 2.2)}Start today: ${esc(todaysRoutine().name)}</button>` : ''}`;
  } else {
    body = routines.length ? `${routines.map((r) => {
      const onDays = days.map((id, i) => (id === r.id ? DAY_NAMES[i].slice(0, 3) : null)).filter(Boolean);
      return `<button class="card routine-card press" data-action="routine-open" data-id="${esc(r.id)}">
        <div class="goal-top"><div class="row-main"><div class="row-title">${esc(r.name)}</div>
          <div class="row-sub">${esc(routineMuscles(r).join(' · '))}</div></div>
          <span class="faint">${icon('right', 18)}</span></div>
        <div class="routine-ex">${r.exercises.slice(0, 4).map((e) => `<span>${esc(e.name)} <b class="num">${e.sets} × ${e.reps}</b></span>`).join('')}${r.exercises.length > 4 ? `<span class="faint">+${r.exercises.length - 4} more</span>` : ''}</div>
        <div class="goal-meta"><span class="num">${plural(r.exercises.length, 'exercise')} · ${plural(routineSets(r), 'set')}</span><span>${onDays.length ? esc(onDays.join(', ')) : 'Not scheduled'}</span></div>
      </button>`;
    }).join('')}
      <button class="btn ghost press" data-action="routine-new">${icon('plus', 18, 2.4)}New routine</button>` : starter;
  }
  return `${head('Your weekly routine', 'Plan', planTab === 'routines' ? addBtn('routine-new', 'New routine') : '')}
    <div class="stack">${tabs}${body}</div>`;
}

function planDaySheet(i) {
  const days = planDays();
  const routines = sortedRoutines();
  const option = (value, title, sub, iconName) => `<label class="row pick-row">
      <input type="radio" name="routine" value="${esc(value)}" ${(days[i] ?? '') === value ? 'checked' : ''}>
      <div class="tile-icon" style="--c:${value ? 'var(--water)' : 'var(--text-3)'}">${icon(iconName, 19)}</div>
      <div class="row-main"><div class="row-title">${esc(title)}</div><div class="row-sub">${esc(sub)}</div></div>
      <span class="pick-check">${icon('check', 18, 2.6)}</span></label>`;
  openSheet(DAY_NAMES[i], `
    <p class="muted small" style="margin:0 0 12px">Pick what you train every ${DAY_NAMES[i]}.</p>
    <section class="card">${option('', 'Rest day', 'Recover and come back stronger', 'moon')}
      ${routines.map((r) => option(r.id, r.name, `${routineMuscles(r).join(' · ')} · ${plural(r.exercises.length, 'exercise')}`, 'gym')).join('')}</section>
    <button type="button" class="btn ghost press" style="margin-top:14px" data-action="routine-new" data-day="${i}">${icon('plus', 18, 2.4)}New routine for ${DAY_NAMES[i]}</button>
  `, (form, f) => {
    const next = [...days];
    next[i] = f.get('routine') || null;
    write(store.saveSettings({ plan: { days: next } }), next[i] ? `${DAY_NAMES[i]}: ${routineById(next[i])?.name}` : `${DAY_NAMES[i]}: rest day`);
  }, 'Save', 'var(--water)');
}

/* ---------- Routine editor ---------- */

let routineDraft = null;

function routineEditor(id, forDay = null) {
  const r = routineById(id);
  routineDraft = {
    id: r?.id ?? null,
    forDay,
    name: r?.name ?? '',
    exercises: (r?.exercises ?? []).map((e) => ({ ...e })),
  };
  openSheet(r ? 'Edit routine' : 'New routine', routineBody(), () => saveRoutine(), 'Save', 'var(--water)');
}

function routineBody() {
  const d = routineDraft;
  return `
    ${field('Routine name', `<input data-rt="name" maxlength="40" placeholder="e.g. Push day" value="${esc(d.name)}">`)}
    <span class="label">Exercises · sets × reps</span>
    <section class="card">${d.exercises.length ? d.exercises.map((e, i) => `<div class="rt-ex">
      <div class="row-main"><div class="row-title">${esc(e.name)}</div><div class="row-sub">${esc(e.muscle)}</div></div>
      <input class="num" data-rt-ex="${i}:sets" inputmode="numeric" value="${esc(e.sets)}" aria-label="Sets for ${esc(e.name)}">
      <span class="faint small">×</span>
      <input class="num" data-rt-ex="${i}:reps" inputmode="numeric" value="${esc(e.reps)}" aria-label="${e.muscle === 'Cardio' ? 'Minutes' : 'Reps'} for ${esc(e.name)}">
      <div class="rt-move">
        <button type="button" class="x-btn press" data-action="rt-move" data-i="${i}" data-d="-1" aria-label="Move ${esc(e.name)} up" ${i === 0 ? 'disabled' : ''}>${icon('up', 15)}</button>
        <button type="button" class="x-btn press" data-action="rt-move" data-i="${i}" data-d="1" aria-label="Move ${esc(e.name)} down" ${i === d.exercises.length - 1 ? 'disabled' : ''}>${icon('down', 15)}</button>
      </div>
      <button type="button" class="x-btn press" data-action="rt-del-ex" data-i="${i}" aria-label="Remove ${esc(e.name)}">${icon('x', 16)}</button>
    </div>`).join('') : emptyState('gym', 'Add the exercises for this routine below.')}</section>
    <span class="label">Add exercise</span>
    <div class="field-row">
      ${field('Exercise', '<input id="rt-new-name" list="rt-names" maxlength="60" placeholder="e.g. Squat">')}
      ${field('Muscle', `<select id="rt-new-muscle">${MUSCLES.map((m) => `<option>${esc(m)}</option>`).join('')}</select>`)}
    </div>
    ${nameDatalist('rt-names')}
    <button type="button" class="btn ghost press" style="margin-top:10px" data-action="rt-add-ex">${icon('plus', 18, 2.4)}Add exercise</button>
    ${d.id ? `<button type="button" class="btn danger press" style="margin-top:20px" data-action="routine-del" data-id="${esc(d.id)}">${icon('trash', 18)}Delete routine</button>` : ''}`;
}

function rerenderRoutine() {
  const body = document.querySelector('.sheet-body');
  if (!body || !routineDraft) return;
  const top = body.scrollTop;
  body.innerHTML = routineBody();
  body.scrollTop = top;
}

function saveRoutine() {
  const d = routineDraft;
  if (!d) return false;
  const name = clean(d.name, 40);
  if (!name) { toast('Give the routine a name', true); return false; }
  const exercises = d.exercises.map((e) => ({
    name: e.name, muscle: e.muscle,
    sets: Math.min(10, Math.max(1, Math.round(num(e.sets)) || 1)),
    reps: Math.min(100, Math.max(1, Math.round(num(e.reps)) || 1)),
  }));
  if (!exercises.length) { toast('Add at least one exercise', true); return false; }
  if (d.id) write(store.update('routines', d.id, { name, exercises }), 'Routine saved');
  else {
    const id = makeId();
    write(store.set('routines', id, { name, exercises, createdAt: Date.now() }), 'Routine created');
    if (d.forDay !== null) {
      const days = planDays(); days[d.forDay] = id;
      write(store.saveSettings({ plan: { days } }));
    }
  }
  routineDraft = null;
  return true;
}

document.addEventListener('input', (e) => {
  if (!routineDraft) return;
  const t = e.target;
  if (t.dataset.rt === 'name') routineDraft.name = t.value;
  else if (t.dataset.rtEx) {
    const [i, f] = t.dataset.rtEx.split(':');
    const ex = routineDraft.exercises[Number(i)];
    if (ex) ex[f] = t.value;
  } else if (t.id === 'rt-new-name') {
    const m = guessMuscle(t.value);
    const sel = document.getElementById('rt-new-muscle');
    if (m && sel) sel.value = m;
  }
});

/** Start a live gym session with a routine's exercises already added. */
function startRoutine(id) {
  const r = routineById(id);
  if (!r) return;
  if (activeSession()) { go('session'); return; }
  write(store.add('workouts', {
    at: Date.now(), type: 'Gym', status: 'active', routine: r.name, routineId: r.id,
    muscles: routineMuscles(r),
    exercises: r.exercises.map((e) => ({ name: e.name, muscle: e.muscle, sets: [], target: { sets: e.sets, reps: e.reps } })),
    minutes: 0, intensity: 'Medium', calories: 0, steps: 0, notes: '',
  }), `${r.name} started`);
  route = 'session';
  animateNext = true;
  history.replaceState(null, '', '#session');
  setTimeout(() => { render(); window.scrollTo(0, 0); }, 120);
}

/* ---------- Detailed anatomy (MuscleMap, MIT, see body-paths.js) ---------- */

// Tappable muscle regions for "Explore muscles", the MuscleMap shapes they cover,
// and the exercise-library muscle names that count as training them.
const REGIONS = [
  { id: 'chest', name: 'Chest', slugs: ['chest'], db: ['chest'] },
  { id: 'shoulders', name: 'Shoulders', slugs: ['deltoids', 'rotatorCuff'], db: ['shoulders'] },
  { id: 'traps', name: 'Traps', slugs: ['trapezius'], db: ['traps'] },
  { id: 'lats', name: 'Lats & upper back', slugs: ['upperBack', 'rhomboids'], db: ['lats', 'middle back'] },
  { id: 'lowerback', name: 'Lower back', slugs: ['lowerBack'], db: ['lower back'] },
  { id: 'biceps', name: 'Biceps', slugs: ['biceps'], db: ['biceps'] },
  { id: 'triceps', name: 'Triceps', slugs: ['triceps'], db: ['triceps'] },
  { id: 'forearms', name: 'Forearms', slugs: ['forearm'], db: ['forearms'] },
  { id: 'abs', name: 'Abs & obliques', slugs: ['abs', 'obliques', 'serratus'], db: ['abdominals'] },
  { id: 'glutes', name: 'Glutes', slugs: ['gluteal'], db: ['glutes', 'abductors'] },
  { id: 'quads', name: 'Quads', slugs: ['quadriceps'], db: ['quadriceps'] },
  { id: 'hamstrings', name: 'Hamstrings', slugs: ['hamstring'], db: ['hamstrings'] },
  { id: 'adductors', name: 'Adductors', slugs: ['adductors'], db: ['adductors'] },
  { id: 'calves', name: 'Calves', slugs: ['calves', 'tibialis'], db: ['calves'] },
  { id: 'neck', name: 'Neck', slugs: ['neck'], db: ['neck'] },
];
const SLUG_REGION = Object.fromEntries(REGIONS.flatMap((r) => r.slugs.map((s) => [s, r])));
// The app's own muscle groups (used for sets per week) drawn on the same body.
const GROUP_SLUGS = {
  Chest: ['chest'], Back: ['upperBack', 'rhomboids', 'lowerBack'], Shoulders: ['deltoids', 'rotatorCuff', 'trapezius'],
  Biceps: ['biceps'], Triceps: ['triceps'], Forearms: ['forearm'], Abs: ['abs', 'obliques', 'serratus'],
  Legs: ['quadriceps', 'hamstring', 'gluteal', 'calves', 'adductors', 'tibialis'],
};
const SLUG_GROUP = Object.fromEntries(Object.entries(GROUP_SLUGS).flatMap(([g, ss]) => ss.map((s) => [s, g])));
// Exercise-library muscle names → the app's groups.
const DB_GROUP = {
  abdominals: 'Abs', abductors: 'Legs', adductors: 'Legs', biceps: 'Biceps', calves: 'Legs', chest: 'Chest', forearms: 'Forearms',
  glutes: 'Legs', hamstrings: 'Legs', lats: 'Back', 'lower back': 'Back', 'middle back': 'Back', neck: 'Shoulders',
  quadriceps: 'Legs', shoulders: 'Shoulders', traps: 'Shoulders', triceps: 'Triceps',
};
const bodySex = () => (data().settings.bodySex === 'female' ? 'female' : 'male');

/**
 * One side of the body. `look(slug)` returns { cls, attrs } for a muscle shape, or null to draw
 * it as plain body (head, hands, feet…).
 */
function anatomy(side, look, sex = bodySex()) {
  const v = BODY_PATHS[sex][side];
  return `<svg viewBox="${v.viewBox}" class="anat" aria-hidden="true">${v.parts.map((p) => {
    const l = look(p.slug);
    return `<g class="${l ? `bm-m ${l.cls ?? ''}` : 'bm-base'}" ${l?.attrs ?? ''}>${p.d.map((d) => `<path d="${d}"/>`).join('')}</g>`;
  }).join('')}</svg>`;
}

function bodyFigure(side, classFor, tipFor) {
  const look = (slug) => {
    const g = SLUG_GROUP[slug];
    if (!g) return null;
    const t = tipFor(g);
    return { cls: classFor(g), attrs: `data-tip="${esc(t.tip)}" data-sub="${esc(t.sub)}"` };
  };
  return `<figure class="bm-fig">${anatomy(side, look)}<figcaption>${side === 'front' ? 'Front' : 'Back'}</figcaption></figure>`;
}

/* ---------- Exercise library data (free-exercise-db, public domain) ---------- */

const EXDB_IMG = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises';
let exDb = null;
let exDbLoading = null;
/** Loads the 873-exercise library the first time it is needed (about 750 KB, then cached). */
function loadExDb() {
  if (exDb) return Promise.resolve(exDb);
  exDbLoading ??= fetch('./exercises-db.json')
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((j) => {
      const byId = new Map(j.exercises.map((e) => [e.id, e]));
      const byName = new Map(j.exercises.map((e) => [normName(e.n), e]));
      exDb = { list: j.exercises, byId, byName, aliases: j.aliases ?? {} };
      if (['exercises', 'muscles', 'train', 'session'].includes(route) && !document.querySelector('.sheet')) render();
      return exDb;
    })
    .catch(() => { exDbLoading = null; toast('Couldn’t load the exercise library. Check your internet.', true); return null; });
  return exDbLoading;
}
/** The library entry (with photos and steps) for an exercise name, if there is one. */
function dbFor(name) {
  if (!exDb) return null;
  const key = normName(name);
  return exDb.byName.get(key) ?? exDb.byId.get(exDb.aliases[key]) ?? null;
}
const dbGroup = (e) => (e.c === 'cardio' ? 'Cardio' : DB_GROUP[e.p[0]] ?? 'Abs');
const dbEquip = (e) => ({ 'body only': 'Body weight', 'e-z curl bar': 'EZ bar', kettlebells: 'Kettlebell', bands: 'Bands' }[e.e] ?? titleCase(e.e));
const imgUrl = (e, frame = 0) => `${EXDB_IMG}/${encodeURI(e.img)}/${frame}.jpg`;
/* ================= Muscle engine: sets, fatigue, strength ================= */

const DB_REGION = Object.fromEntries(REGIONS.flatMap((r) => r.db.map((m) => [m, r.id])));
const regionById = (id) => REGIONS.find((r) => r.id === id) ?? null;
const MAP_REGIONS = REGIONS.filter((r) => r.id !== 'neck');
// When an exercise isn't in the photo library, its group decides the muscles (main + helpers).
const GROUP_REGIONS = {
  Chest: { p: ['chest'], s: ['shoulders', 'triceps'] }, Back: { p: ['lats'], s: ['biceps', 'lowerback'] },
  Shoulders: { p: ['shoulders'], s: ['triceps'] }, Biceps: { p: ['biceps'], s: ['forearms'] }, Triceps: { p: ['triceps'], s: [] },
  Forearms: { p: ['forearms'], s: [] }, Abs: { p: ['abs'], s: [] }, Legs: { p: ['quads'], s: ['glutes', 'hamstrings'] },
  Cardio: { p: [], s: [] },
};
const muscleOf = (e) => (MUSCLES.includes(e.muscle) ? e.muscle : guessMuscle(e.name));
const muscleCache = new Map();
/** Main (p) and helper (s) muscles an exercise trains. */
function musclesFor(name, group) {
  const key = `${normName(name)}|${group ?? ''}|${exDb ? 1 : 0}`;
  if (muscleCache.has(key)) return muscleCache.get(key);
  const d = dbFor(name);
  let res;
  if (d && d.c !== 'cardio') {
    const p = [...new Set(d.p.map((m) => DB_REGION[m]).filter(Boolean))];
    res = { p, s: [...new Set(d.s.map((m) => DB_REGION[m]).filter((x) => x && !p.includes(x)))] };
  } else {
    res = GROUP_REGIONS[group ?? guessMuscle(name)] ?? { p: [], s: [] };
  }
  muscleCache.set(key, res);
  return res;
}
/** Every logged set (finished workouts and the one running now), with the muscles it trained. */
function setEvents() {
  const out = [];
  for (const w of data().workouts) {
    for (const e of w.exercises ?? []) {
      if (isCardio(e)) continue;
      const m = musclesFor(e.name, muscleOf(e));
      if (!m.p.length && !m.s.length) continue;
      for (const s of exSets(e)) if ((s.reps || 0) > 0) out.push({ at: s.at ?? w.at, kg: s.kg || 0, reps: s.reps || 0, m, name: e.name, live: isActive(w) });
    }
  }
  return out;
}

/* ---------- Sets per muscle ---------- */
const REGION_RANGES = {
  chest: [10, 20], shoulders: [8, 20], traps: [4, 12], lats: [10, 20], lowerback: [4, 10], biceps: [8, 18], triceps: [8, 18],
  forearms: [4, 12], abs: [6, 16], glutes: [8, 18], quads: [8, 18], hamstrings: [6, 16], adductors: [4, 10], calves: [6, 16],
};
const regionRanges = () => ({ ...REGION_RANGES, ...(data().settings.regionRanges ?? {}) });
let mapMode = 'sets';
let mapScope = 'done'; // done | plan
let mapPeriod = 'week'; // week | month
let mapBack = 0;
let mapSel = null;
let mapShowAll = false;

function periodRange() {
  if (mapPeriod === 'month') {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - mapBack);
    const end = new Date(d); end.setMonth(end.getMonth() + 1);
    return { start: d, end, label: mapBack === 0 ? 'This month' : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), weeks: daysInMonth(d) / 7 };
  }
  const start = startOfWeek(); start.setDate(start.getDate() - 7 * mapBack);
  const end = new Date(start); end.setDate(end.getDate() + 7);
  return { start, end, label: mapBack === 0 ? 'This week' : mapBack === 1 ? 'Last week' : `Week of ${fmtDate(start)}`, weeks: 1 };
}
const addSets = (counts, m, n) => { m.p.forEach((r) => { if (r in counts) counts[r] += n; }); m.s.forEach((r) => { if (r in counts) counts[r] += n / 2; }); };
/** Sets per muscle in a period: 1 per set for the main muscle, ½ for helpers. */
function regionSets(start, end) {
  const counts = Object.fromEntries(MAP_REGIONS.map((r) => [r.id, 0]));
  for (const ev of setEvents()) if (ev.at >= start.getTime() && ev.at < end.getTime()) addSets(counts, ev.m, 1);
  return counts;
}
function plannedRegionSets(weeks) {
  const counts = Object.fromEntries(MAP_REGIONS.map((r) => [r.id, 0]));
  for (const id of planDays()) for (const e of routineById(id)?.exercises ?? []) addSets(counts, musclesFor(e.name, e.muscle), e.sets * weeks);
  return counts;
}
const fmtSets = (v) => String(Math.round(v * 10) / 10);

/* ---------- Estimated 1RM and personal records ---------- */
/** Epley estimate. Sets above 12 reps aren't used: the estimate gets unreliable there. */
const est1RM = (kg, reps) => (kg > 0 && reps >= 1 && reps <= 12 ? (reps === 1 ? kg : kg * (1 + reps / 30)) : 0);
/** Your lifts that train a muscle: best set, best estimated 1RM and when. */
function regionLifts(regionId) {
  const byEx = new Map();
  for (const ev of setEvents()) {
    if (ev.live) continue;
    const role = ev.m.p.includes(regionId) ? 'main' : ev.m.s.includes(regionId) ? 'helper' : null;
    if (!role || ev.kg <= 0) continue;
    const key = normName(ev.name);
    const x = byEx.get(key) ?? { name: ev.name, role, e1rm: 0, e1At: 0, kg: 0, reps: 0, kgAt: 0, lastAt: 0 };
    const e1 = est1RM(ev.kg, ev.reps);
    if (e1 > x.e1rm) { x.e1rm = e1; x.e1At = ev.at; }
    if (ev.kg > x.kg || (ev.kg === x.kg && ev.reps > x.reps)) { x.kg = ev.kg; x.reps = ev.reps; x.kgAt = ev.at; }
    x.lastAt = Math.max(x.lastAt, ev.at);
    byEx.set(key, x);
  }
  return [...byEx.values()].sort((a, b) => (a.role === b.role ? 0 : a.role === 'main' ? -1 : 1) || b.e1rm - a.e1rm || b.kg - a.kg);
}

/* ---------- Fatigue: builds with each set, fades over the following days ---------- */
// Hours for fatigue to fall to about a third. Big muscles recover slower than small ones.
const RECOVERY_H = {
  chest: 36, lats: 36, lowerback: 40, quads: 40, hamstrings: 40, glutes: 40, shoulders: 30, traps: 30,
  adductors: 30, calves: 28, biceps: 24, triceps: 24, forearms: 20, abs: 20, neck: 20,
};
const FATIGUE_CAP = 6; // about 6 recent hard sets ≈ 63%
function fatigueLoads(now = Date.now()) {
  const loads = Object.fromEntries(REGIONS.map((r) => [r.id, 0]));
  for (const ev of setEvents()) {
    const ageH = (now - ev.at) / 3600000;
    if (ageH < 0 || ageH > 240) continue;
    for (const [list, w] of [[ev.m.p, 1], [ev.m.s, 0.5]]) {
      for (const r of list) loads[r] += w * Math.exp(-ageH / (RECOVERY_H[r] ?? 30));
    }
  }
  return loads;
}
const fatiguePct = (load) => Math.round(100 * (1 - Math.exp(-load / FATIGUE_CAP)));
const fatigueZone = (pct) => (pct >= 60 ? { id: 'fat', label: 'Fatigued', color: 'var(--critical)' }
  : pct >= 30 ? { id: 'rec', label: 'Recovering', color: 'var(--warning)' } : { id: 'ready', label: 'Ready', color: 'var(--text-3)' });
/** Hours until fatigue drops below a % (0 if it already has). */
function hoursUntil(load, regionId, pct) {
  const target = -FATIGUE_CAP * Math.log(1 - pct / 100);
  return load <= target ? 0 : (RECOVERY_H[regionId] ?? 30) * Math.log(load / target);
}
/**
 * Smooth colour for a fatigue %: plain muscle grey at 0, warming to yellow by 60%, then to red at 100%.
 * Even a lightly worked muscle shows a tint, so the body never looks "empty" after training.
 */
function fatigueFill(p) {
  const base = 'color-mix(in srgb, var(--text) 17%, var(--surface))';
  if (p <= 0) return base;
  if (p < 60) return `color-mix(in srgb, var(--warning) ${Math.round(18 + (p / 60) * 82)}%, ${base})`;
  return `color-mix(in srgb, var(--critical) ${Math.round(((p - 60) / 40) * 100)}%, var(--warning))`;
}
const fmtWait = (h) => (h <= 0 ? 'now' : h < 20 ? `in ${Math.max(1, Math.round(h))} h` : `in ${plural(Math.round(h / 24) || 1, 'day')}`);

/* ---------- Strength: est. 1RM, held while you train, slowly fading after ~2 weeks off ---------- */
const retention = (lastAt) => {
  if (!lastAt) return 0;
  const days = (Date.now() - lastAt) / 86400000;
  return days <= 14 ? 1 : 0.5 + 0.5 * Math.exp(-(days - 14) / 45);
};
function regionLastAt() {
  const last = {};
  for (const ev of setEvents()) for (const r of [...ev.m.p, ...ev.m.s]) last[r] = Math.max(last[r] ?? 0, ev.at);
  return last;
}

/* ---------- The Muscles card ---------- */

function muscleMapCard() {
  if (!exDb) loadExDb(); // finer muscle data; the card redraws when it arrives
  const isSets = mapMode === 'sets'; const isFat = mapMode === 'fatigue';
  const { start, end, label, weeks } = periodRange();
  const ranges = regionRanges();
  const sets = isSets ? (mapScope === 'plan' ? plannedRegionSets(weeks) : regionSets(start, end)) : null;
  const loads = isFat ? fatigueLoads() : null;
  const last = !isSets && !isFat ? regionLastAt() : null;
  const sel = regionById(mapSel);

  const levelOf = (r) => {
    if (isSets) { const v = sets[r]; const lo = (ranges[r]?.[0] || 1) * weeks; return !v ? 'l0' : v >= lo ? 'l4' : v >= lo * 0.67 ? 'l3' : v >= lo * 0.34 ? 'l2' : 'l1'; }
    if (isFat) return '';
    const k = retention(last[r]); return !k ? '' : k >= 0.95 ? 's4' : k >= 0.8 ? 's3' : k >= 0.65 ? 's2' : 's1';
  };
  const look = (slug) => {
    const r = SLUG_REGION[slug];
    if (!r || r.id === 'neck') return null;
    const paint = isFat ? ` style="fill:${fatigueFill(fatiguePct(loads[r.id]))}"` : '';
    return { cls: `${levelOf(r.id)} ${mapSel === r.id ? 'sel' : ''}`, attrs: `data-action="map-pick" data-r="${r.id}" role="button" aria-label="${esc(r.name)}"${paint}` };
  };
  const tabs = `<div class="seg-tabs" role="tablist">${[['sets', 'Sets'], ['fatigue', 'Fatigue'], ['strength', 'Strength']].map(([t, l]) => `
    <button class="press" role="tab" data-action="map-mode" data-t="${t}" aria-selected="${mapMode === t}">${l}</button>`).join('')}</div>`;

  let controls = ''; let legend = ''; let note = ''; let detail = ''; let rows = '';
  if (isSets) {
    controls = `<div class="map-controls">
        <div class="seg-tabs small" role="tablist">${[['done', 'Completed'], ['plan', 'Planned']].map(([t, l]) => `
          <button class="press" role="tab" data-action="map-scope" data-t="${t}" aria-selected="${mapScope === t}">${l}</button>`).join('')}</div>
        <button class="period-btn press" data-action="map-period">${mapPeriod === 'week' ? 'Week' : 'Month'} ${icon('down', 14, 2.4)}</button>
      </div>
      ${mapScope === 'done' ? `<div class="week-nav">
        <button class="icon-btn press" data-action="map-back" data-d="1" aria-label="Previous ${mapPeriod}">${icon('left', 18)}</button>
        <strong>${esc(label)}</strong>
        <button class="icon-btn press" data-action="map-back" data-d="-1" aria-label="Next ${mapPeriod}" ${mapBack === 0 ? 'disabled' : ''}>${icon('right', 18)}</button></div>`
        : `<div class="week-nav"><span></span><strong>Your plan, per ${mapPeriod}</strong><span></span></div>`}`;
    legend = '<div class="hm-legend"><span>Less</span><i class="hm-cell l0"></i><i class="hm-cell l1"></i><i class="hm-cell l2"></i><i class="hm-cell l3"></i><i class="hm-cell l4"></i><span>Target hit</span></div>';
    const planned = mapScope === 'done' ? plannedRegionSets(weeks) : null;
    const anyPlan = planned && Object.values(planned).some((v) => v > 0);
    const order = [...MAP_REGIONS].sort((a, b) => sets[b.id] - sets[a.id]);
    const trained = order.filter((r) => sets[r.id] > 0);
    const shown = mapShowAll ? trained : trained.slice(0, 5);
    rows = shown.map((r) => {
      const [lo0, hi0] = ranges[r.id]; const lo = Math.round(lo0 * weeks); const hi = Math.round(hi0 * weeks);
      const p = planned?.[r.id] ?? 0;
      const scale = Math.max(hi * 1.2, sets[r.id], p, 1);
      const pct = (v) => `${Math.min(100, (v / scale) * 100).toFixed(1)}%`;
      return `<button class="mrow press" data-action="map-pick" data-r="${r.id}"><span class="mname">${esc(r.name)}</span>
        <div class="mbar" aria-hidden="true"><i class="band" style="left:${pct(lo)};width:calc(${pct(hi)} - ${pct(lo)})"></i>
          <i class="fill" style="width:${pct(sets[r.id])}"></i>${p ? `<i class="plan" style="left:${pct(p)}"></i>` : ''}</div>
        <span class="mval num"><b>${fmtSets(sets[r.id])}</b> / ${lo}–${hi}</span></button>`;
    }).join('') || `<p class="muted small" style="margin:6px 0">${mapScope === 'plan' ? 'No routines in your plan yet. Set them up in the Plan tab.' : 'No sets logged in this period.'}</p>`;
    const untrained = order.filter((r) => !sets[r.id]);
    rows += `${trained.length > 5 ? `<button class="text-btn show-more" data-action="map-more">${mapShowAll ? 'Show less' : 'Show more'} ${icon(mapShowAll ? 'up' : 'down', 14, 2.4)}</button>` : ''}
      <div class="map-foot"><span class="map-key"><i class="key-band"></i>Target range${anyPlan ? '<i class="key-plan"></i>Planned' : ''}</span>
        <button class="see-all press" style="color:var(--train)" data-action="map-ranges">${icon('settings', 14)} Ranges</button></div>
      ${untrained.length ? `<details class="untrained"><summary><span>Not trained in this period</span><span class="num">${untrained.length} ${icon('down', 14, 2.4)}</span></summary>
        <p class="muted small">${esc(untrained.map((r) => r.name).join(', '))}</p></details>` : ''}`;
    note = '<p class="map-note">Each set counts 1 for the main muscle and ½ for helper muscles. Tap a muscle for its records.</p>';
    if (sel) {
      const [lo0, hi0] = ranges[sel.id] ?? [0, 0];
      const lifts = regionLifts(sel.id).slice(0, 6);
      detail = `<div class="map-detail">
        <div class="map-detail-head"><div><div class="card-title">${esc(sel.name)}</div>
          <div class="card-sub">${fmtSets(sets[sel.id] ?? 0)} sets ${mapScope === 'plan' ? 'planned' : esc(label.toLowerCase())} · target ${Math.round(lo0 * weeks)}–${Math.round(hi0 * weeks)}</div></div>
          <button class="x-btn press" data-action="map-pick" data-r="${sel.id}" aria-label="Close">${icon('x', 16)}</button></div>
        <span class="label" style="margin-top:10px">Your records</span>
        ${lifts.length ? lifts.map((x) => `<button class="pr-row press" data-action="how-to" data-name="${esc(x.name)}" data-muscle="">
            <div class="row-main"><div class="row-title">${esc(x.name)} ${x.role === 'helper' ? '<span class="role">helper</span>' : ''}</div>
              <div class="row-sub">Best set ${fmtKg(x.kg)} kg × ${x.reps} · ${esc(fmtDate(x.kgAt))}</div></div>
            <div class="row-end">${x.e1rm ? `<strong class="num">${fmtKg(Math.round(x.e1rm * 10) / 10)} kg</strong><span>Est. 1RM</span>` : `<strong class="num">${fmtKg(x.kg)} kg</strong><span>Best</span>`}</div>
          </button>`).join('') : '<p class="muted small">No weighted sets for this muscle yet.</p>'}
        <button class="btn ghost press" style="margin-top:10px" data-action="explore-region" data-r="${sel.id}">${icon('list', 18)}Exercises for ${esc(sel.name)}</button>
      </div>`;
    }
  } else if (isFat) {
    legend = `<div class="fat-legend" aria-hidden="true"><span>Ready</span><i style="background:linear-gradient(90deg, ${[0, 15, 30, 45, 60, 80, 100].map((p) => fatigueFill(p)).join(', ')})"></i><span>Fatigued</span></div>`;
    note = '<p class="map-note">Fatigue builds with each set and fades over the next days (big muscles take longer). An estimate, not a measurement. Tap a muscle for details.</p>';
    if (sel) {
      const L = loads[sel.id]; const p = fatiguePct(L); const z = fatigueZone(p);
      const toRec = hoursUntil(L, sel.id, 60); const toReady = hoursUntil(L, sel.id, 30);
      detail = `<div class="map-detail">
        <div class="map-detail-head"><div class="card-title">${esc(sel.name)}</div>
          <button class="x-btn press" data-action="map-pick" data-r="${sel.id}" aria-label="Close">${icon('x', 16)}</button></div>
        <div class="fat-scale" aria-label="${esc(`${sel.name} fatigue ${p}%, ${z.label}`)}">
          <i class="z ready"></i><i class="z rec"></i><i class="z fat"></i>
          <span class="fat-marker" style="left:${Math.min(99, Math.max(1, p))}%"><b class="num">${p}%</b></span>
        </div>
        <div class="fat-axis"><span>Ready</span><span>Recovering</span><span>Fatigued</span></div>
        <p class="small" style="margin:10px 0 0"><span class="status" style="--s:${z.color}">${icon(z.id === 'ready' ? 'check' : z.id === 'rec' ? 'clock' : 'alert', 14, 2.4)}${z.label}</span></p>
        <p class="muted small" style="margin:6px 0 0">${p >= 60 ? `Recovering ${fmtWait(toRec)} · ready ${fmtWait(toReady)}` : p >= 30 ? `Ready ${fmtWait(toReady)}` : 'Fresh enough to train hard.'}</p>
      </div>`;
    }
    const list = MAP_REGIONS.map((r) => ({ r, p: fatiguePct(loads[r.id]) })).filter((x) => x.p >= 5).sort((a, b) => b.p - a.p);
    rows = list.length ? list.map(({ r, p }) => { const z = fatigueZone(p); return `<button class="mrow press" data-action="map-pick" data-r="${r.id}"><span class="mname">${esc(r.name)}</span>
        <div class="mbar" aria-hidden="true"><i class="fill" style="width:${p}%;background:${fatigueFill(Math.max(p, 12))}"></i></div>
        <span class="mval num"><b>${p}%</b></span></button>`; }).join('') : '<p class="muted small" style="margin:6px 0">Everything is fresh. No muscle has meaningful fatigue right now.</p>';
  } else {
    legend = '<div class="map-legend"><span>Full</span><i class="lg s4"></i><i class="lg s3"></i><i class="lg s2"></i><i class="lg s1"></i><span>Fading</span></div>';
    note = '<p class="map-note">Estimated 1RM per lift. Strength holds for about 2 weeks after you train a muscle, then slowly fades (to about half after a long break). Train it again to reset. Tap a muscle for its lifts.</p>';
    const list = sel ? null : MAP_REGIONS.map((r) => ({ r, k: retention(last[r.id]) })).sort((a, b) => b.k - a.k);
    if (sel) {
      const lifts = regionLifts(sel.id).filter((x) => x.e1rm > 0).slice(0, 8);
      detail = `<div class="map-detail">
        <div class="map-detail-head"><div><div class="card-title">${esc(sel.name)}</div><div class="card-sub">${last[sel.id] ? `Last trained ${esc(fmtDay(last[sel.id]))} · ${Math.round(retention(last[sel.id]) * 100)}% held` : 'Not trained yet'}</div></div>
          <button class="x-btn press" data-action="map-pick" data-r="${sel.id}" aria-label="Close">${icon('x', 16)}</button></div>
        ${lifts.length ? lifts.map((x) => { const k = retention(x.lastAt); const top = lifts[0].e1rm || 1; return `<button class="mrow str press" data-action="how-to" data-name="${esc(x.name)}" data-muscle="">
            <span class="mname"><span class="str-name">${esc(x.name)}${x.role === 'helper' ? ' <span class="role">helper</span>' : ''}</span><small>Est. 1RM ${fmtKg(Math.round(x.e1rm * 10) / 10)} kg · ${esc(fmtDate(x.e1At))}</small></span>
            <div class="mbar" aria-hidden="true"><i class="fill" style="width:${((x.e1rm * k) / top) * 100}%;background:var(--warning)"></i></div>
            <span class="mval num"><b>${fmtKg(Math.round(x.e1rm * k * 10) / 10)}</b> · ${Math.round(k * 100)}%</span></button>`; }).join('')
          : '<p class="muted small" style="margin:8px 0 0">No sets of 1–12 reps with weight for this muscle yet.</p>'}
      </div>`;
    } else {
      rows = list.map(({ r, k }) => `<button class="mrow press" data-action="map-pick" data-r="${r.id}"><span class="mname">${esc(r.name)}</span>
        <div class="mbar" aria-hidden="true"><i class="fill" style="width:${k * 100}%;background:${k ? 'var(--warning)' : 'transparent'}"></i></div>
        <span class="mval num">${k ? `<b>${Math.round(k * 100)}%</b>` : 'not trained'}</span></button>`).join('');
    }
  }

  return `<section class="card" id="muscle-card">
    <div class="card-head"><div class="card-title">Muscles</div><button class="see-all press" style="color:var(--train)" data-action="open-explore">${icon('body', 14)} Explore</button></div>
    ${tabs}
    ${controls}
    <div class="bodymap mode-${mapMode}">
      <figure class="bm-fig">${anatomy('front', look)}<figcaption>Front</figcaption></figure>
      <figure class="bm-fig">${anatomy('back', look)}<figcaption>Back</figcaption></figure>
    </div>
    ${legend}${note}${detail}
    <div class="mrows">${rows}</div>
  </section>`;
}

function rangesSheet() {
  const ranges = regionRanges();
  openSheet('Weekly set targets', `
    <p class="muted small" style="margin:0 0 12px">Sets per week you aim for, per muscle (helper sets count ½). About 10–20 for big muscles is common advice. Monthly targets are these × weeks.</p>
    <section class="card">${MAP_REGIONS.map((r) => `<div class="range-row"><span>${esc(r.name)}</span>
      <input class="num" name="${r.id}-lo" inputmode="numeric" value="${ranges[r.id][0]}" aria-label="${esc(r.name)} minimum sets">
      <span class="faint">–</span>
      <input class="num" name="${r.id}-hi" inputmode="numeric" value="${ranges[r.id][1]}" aria-label="${esc(r.name)} maximum sets"></div>`).join('')}</section>
    <button type="button" class="text-btn" style="margin:12px auto 0;display:block" data-action="map-ranges-reset">Reset to defaults</button>
  `, (form, f) => {
    const out = {};
    for (const r of MAP_REGIONS) {
      const lo = Math.round(num(f.get(`${r.id}-lo`))); const hi = Math.round(num(f.get(`${r.id}-hi`)));
      if (!(lo >= 0 && hi >= lo && hi <= 60)) { toast(`Check the ${r.name} range`, true); return false; }
      out[r.id] = [lo, hi];
    }
    write(store.saveSettings({ regionRanges: out }), 'Targets saved');
  }, 'Save', 'var(--train)');
}

/* ---------- Live muscle map at the top of a workout ---------- */

let liveMapOpen = (() => { try { return localStorage.getItem('lt-live-map') !== '0'; } catch { return true; } })();

function liveMuscleCard(s) {
  if (!exDb) loadExDb();
  const main = new Set(); const helper = new Set();
  for (const e of s.exercises ?? []) {
    if (isCardio(e)) continue;
    const m = musclesFor(e.name, muscleOf(e));
    m.p.forEach((r) => main.add(r)); m.s.forEach((r) => helper.add(r));
  }
  const ids = [...main, ...[...helper].filter((r) => !main.has(r))];
  if (!ids.length) return '';
  const loads = fatigueLoads();
  const chips = ids.map((r) => { const p = fatiguePct(loads[r]); const z = fatigueZone(p); return `<span class="live-chip ${main.has(r) ? '' : 'helper'}" style="--z:${fatigueFill(Math.max(p, 12))}" title="${z.label}"><i></i>${esc(regionById(r)?.name ?? r)} <b class="num">${p}%</b></span>`; }).join('');
  const look = (slug) => {
    const r = SLUG_REGION[slug];
    if (!r || !ids.includes(r.id)) return r ? { cls: '' } : null;
    const p = fatiguePct(loads[r.id]);
    return { cls: 'live-on', attrs: `style="fill:${fatigueFill(p)}"` };
  };
  return `<section class="card live-map">
    <button class="collapse-head press" data-action="live-map-toggle" aria-expanded="${liveMapOpen}">
      <span class="card-title">Muscles today</span><span class="chev ${liveMapOpen ? 'open' : ''}">${icon('chevron', 18, 2.2)}</span></button>
    <div class="live-chips">${chips}</div>
    ${liveMapOpen ? `<div class="bodymap live">
      <figure class="bm-fig">${anatomy('front', look)}</figure><figure class="bm-fig">${anatomy('back', look)}</figure></div>
      <p class="map-note" style="text-align:center">Live fatigue: updates with every set you log.</p>` : ''}
  </section>`;
}
/* ================= Water (now a panel, not a tab) ================= */

function waterBody() {
  const goal = settings().waterGoal;
  const today = data().water.filter((w) => isToday(w.at)).sort((a, b) => b.at - a.at);
  const total = sum(today, (w) => w.ml);
  return `
    <div class="water-sum">
      <div class="hero-num num">${litres(total)}<span style="font-size:22px"> L</span></div>
      <div class="muted small">${total >= goal ? `${icon('check', 14, 2.4)} Goal reached` : `of ${litres(goal)} L · ${(goal - total).toLocaleString('en-IN')} ml to go`}</div>
      <div style="margin-top:12px">${meter(goal > 0 ? total / goal : 0, 'var(--water)')}</div>
    </div>
    <div class="water-btns">
      <button type="button" class="press" data-action="water-add" data-ml="150">+150</button>
      <button type="button" class="press" data-action="water-add" data-ml="250">+250</button>
      <button type="button" class="press" data-action="water-add" data-ml="500">+500</button>
      <button type="button" class="press" data-action="water-custom">Other</button>
    </div>
    <span class="label">Today's log</span>
    <section class="card">${today.length ? today.map((w) => `
      <div class="row"><div class="tile-icon" style="--c:var(--water)">${icon('water', 18)}</div>
        <div class="row-main"><div class="row-title num">${w.ml} ml</div><div class="row-sub">${fmtTime(w.at)}</div></div>
        <button type="button" class="x-btn press" data-action="water-del" data-id="${esc(w.id)}" aria-label="Remove ${w.ml} ml">${icon('x', 18)}</button>
      </div>`).join('') : emptyState('water', 'No water logged yet today.')}</section>
    <button type="button" class="btn ghost press" style="margin-top:14px" data-action="settings">${icon('settings', 18)}Water goal & reminders</button>`;
}
function waterSheet() { openSheet('Water', waterBody(), null, '', 'var(--water)'); }
/** Keep an open Water panel in step with new entries. */
function refreshWaterSheet() {
  const body = document.querySelector('.sheet[aria-label="Water"] .sheet-body');
  if (body) body.innerHTML = waterBody();
}

/* ================= AI assistant ================= */
// Two ways to answer:
// 1. Free: your question + a summary of your data is copied, and the Claude or ChatGPT app opens to paste it.
// 2. In-app (optional): with your own Anthropic API key, Claude answers right here (pay-per-use, billed by Anthropic).
//    The key is kept only on this device (localStorage), never in the cloud database.

const AI_SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm';
const AI_MODELS = [
  { id: 'claude-opus-5-5', label: 'Opus 5.5', note: 'Best answers · about ₹1–3 per message' },
  { id: 'claude-haiku-5-5', label: 'Haiku 5.5', note: 'Fast and cheapest · well under ₹0.10 per message' },
];
const OPENAI_MODELS = [
  { id: 'gpt-6.1-sol', label: 'GPT-6.1 Sol', note: 'Strong, balanced answers · about ₹1 per message' },
  { id: 'gpt-6-luna', label: 'GPT-6 Luna', note: 'Fast and cheapest · well under ₹0.10 per message' },
];
/** Which assistant is chosen, and whether it can answer inside the app (has a key). */
function aiSetup(cfg = aiCfg()) {
  const gpt = cfg.app === 'chatgpt';
  const models = gpt ? OPENAI_MODELS : AI_MODELS;
  const model = models.find((m) => m.id === (gpt ? cfg.openaiModel : cfg.model)) ?? models[0];
  return { gpt, name: gpt ? 'ChatGPT' : 'Claude', key: gpt ? cfg.openaiKey : cfg.key, model };
}
const AI_RULES = `You are the assistant inside Life Tracker, the user's personal app for workouts, body weight, money (₹), water and goals. The user lives in India.
Answer from the user's data below and quote the real numbers. Be practical and brief: a few short paragraphs or a bullet list, no tables, no long preambles.
Muscle fatigue % and "strength held" % are the app's own estimates, not measurements. Estimated 1RM uses the Epley formula.
You can't change anything in the app. When the user should act, say which tab to use (Today, Train, Plan, Money, Goals) and what to tap.
If the data doesn't cover the question, say so. For injuries, pain or medical questions, give general guidance and suggest seeing a professional; for money, give general budgeting guidance, not investment advice.`;

const aiCfg = () => { try { return JSON.parse(localStorage.getItem('lt-ai')) ?? {}; } catch { return {}; } };
const saveAiCfg = (cfg) => { try { localStorage.setItem('lt-ai', JSON.stringify(cfg)); } catch { toast('Couldn’t save on this device', true); } };
let chatMsgs = (() => { try { const m = JSON.parse(localStorage.getItem('lt-chat-v1')); return Array.isArray(m) ? m : []; } catch { return []; } })();
let chatBusy = false;
let chatDraft = '';
const saveChat = () => { try { localStorage.setItem('lt-chat-v1', JSON.stringify(chatMsgs.slice(-60))); } catch { /* storage full or blocked */ } };

/** A compact, plain-text summary of everything in the app, for the assistant to answer from. */
function aiContext() {
  const d = data(); const s = settings(); const now = Date.now();
  const L = [];
  const r1 = (v) => Math.round(v * 10) / 10;
  L.push(`Now: ${fmtLongDate(now)}, ${fmtTime(now)} (IST).`);

  const done = doneWorkouts();
  const minsToday = sum(done.filter((w) => isToday(w.at)), (w) => w.minutes);
  const spentToday = sum(d.expenses.filter((e) => isToday(e.at)), (e) => e.amount);
  L.push('', '## Today', `Training: ${minsToday} of ${s.trainGoal} min target`,
    `Spent: ${rupees(spentToday)} (daily allowance ${rupees(s.budget / daysInMonth())})`,
    `Day score weights: training 50%, budget 30%, body weight in range 20%.`);
  const live = activeSession();
  if (live) L.push(`Workout in progress${isPaused(live) ? ' (paused)' : ''}: ${(live.muscles ?? []).join(', ')}, ${workoutSets(live)} sets so far, ${Math.round(sessionElapsed(live) / 60000)} min.`);

  const WEEK = 7 * 86400000; const ws0 = startOfWeek().getTime();
  const cur = trainingTotals(ws0, now); const prev = trainingTotals(ws0 - WEEK, now - WEEK);
  L.push('', '## Training', `This week so far: ${cur.sessions} sessions, ${cur.sets} sets, ${Math.round(cur.volume)} kg volume, ${cur.minutes} min.`,
    `Last week at the same point: ${prev.sessions} sessions, ${prev.sets} sets, ${Math.round(prev.volume)} kg, ${prev.minutes} min.`);
  const recent = [...done].sort((a, b) => b.at - a.at).slice(0, 12);
  if (recent.length) {
    L.push('Recent workouts (newest first):');
    for (const w of recent) {
      const ex = (w.exercises ?? []).map((e) => `${e.name} ${summariseSets(e, exSets(e))}`).join('; ');
      L.push(`- ${fmtDay(w.at)}: ${w.type === 'Gym' ? (w.muscles ?? []).join('/') || 'Gym' : w.type}, ${w.minutes} min${ex ? ` — ${ex}` : ''}${w.notes ? ` (note: ${clean(w.notes, 80)})` : ''}`);
    }
  }
  const weekSets = regionSets(startOfWeek(), new Date(ws0 + WEEK));
  const ranges = regionRanges();
  L.push('Sets per muscle this week (main muscle 1, helper ½) vs weekly target: '
    + MAP_REGIONS.map((r) => `${r.name} ${fmtSets(weekSets[r.id])} (${ranges[r.id][0]}–${ranges[r.id][1]})`).join(', '));
  const loads = fatigueLoads();
  const tired = MAP_REGIONS.map((r) => [r.name, fatiguePct(loads[r.id])]).filter(([, p]) => p >= 5).sort((a, b) => b[1] - a[1]);
  L.push(`Muscle fatigue now (estimate; 60%+ fatigued, 30–59% recovering): ${tired.length ? tired.map(([n, p]) => `${n} ${p}%`).join(', ') : 'all fresh'}.`);
  const best = new Map();
  for (const ev of setEvents()) {
    if (ev.live) continue;
    const e1 = est1RM(ev.kg, ev.reps); if (!e1) continue;
    const k = normName(ev.name); const x = best.get(k);
    if (!x || e1 > x.e1) best.set(k, { name: ev.name, e1, kg: ev.kg, reps: ev.reps, at: ev.at });
  }
  const top = [...best.values()].sort((a, b) => b.e1 - a.e1).slice(0, 12);
  if (top.length) L.push(`Best lifts (est. 1RM from best set): ${top.map((x) => `${x.name} ${r1(x.e1)} kg (${fmtKg(x.kg)}×${x.reps}, ${fmtDate(x.at)})`).join('; ')}.`);

  const days = planDays();
  if (days.some(Boolean)) {
    L.push('', '## Weekly plan', DAY_NAMES.map((n, i) => `${n}: ${routineById(days[i])?.name ?? 'rest'}`).join(', '));
    for (const r of sortedRoutines()) L.push(`- ${r.name}: ${r.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(', ')}`);
  } else L.push('', '## Weekly plan', 'No plan set up yet.');

  const wts = sortedWeights();
  if (wts.length) {
    const last = wts.at(-1); const ago = weightAt(last.at - 30 * 86400000) ?? wts[0];
    L.push('', '## Body weight', `Latest ${fmtKg(last.kg)} kg (${fmtDate(last.at)}); 30 days ago ${fmtKg(ago.kg)} kg; goal ${weightGoal() ? `${fmtKg(weightGoal())} kg` : 'not set'}.`);
  }

  const month = d.expenses.filter((e) => sameMonth(e.at, now));
  const total = sum(month, (e) => e.amount);
  L.push('', '## Money (this month)', `Spent ${rupees(total)} of ${rupees(s.budget)} budget; ${daysInMonth() - new Date().getDate()} days left in the month.`);
  const byCat = CATEGORIES.map((c) => [c.name, sum(month.filter((e) => cat(e.category).name === c.name), (e) => e.amount)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (byCat.length) L.push(`By category: ${byCat.map(([n, v]) => `${n} ${rupees(v)}`).join(', ')}.`);
  const lastMonth = new Date(); lastMonth.setDate(1); lastMonth.setMonth(lastMonth.getMonth() - 1);
  L.push(`Last month total: ${rupees(sum(d.expenses.filter((e) => sameMonth(e.at, lastMonth)), (e) => e.amount))}.`);
  const recentEx = [...d.expenses].sort((a, b) => b.at - a.at).slice(0, 15);
  if (recentEx.length) L.push('Recent expenses: ' + recentEx.map((e) => `${fmtDate(e.at)} ${rupees(e.amount)} ${e.category}${e.note ? ` (${clean(e.note, 40)})` : ''} via ${e.payment}`).join('; '));

  const goals = sortedGoals();
  L.push('', '## Goals', goals.length ? goals.map((g) => `- ${g.title} (${g.type}): ${goalValue(g.current, g.unit)} of ${goalValue(g.target, g.unit)}, due ${fmtDate(g.deadline)}`).join('\n') : 'No goals yet.');
  L.push('', '## Water', `Not tracked (the user only uses drink reminders; they are ${reminderSettings().enabled ? 'on' : 'off'}).`);
  return L.join('\n');
}

/** Tiny, safe Markdown: escapes everything, then allows **bold**, `code`, headings and lists. */
function mdLite(text) {
  const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of String(text).split('\n')) {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*[-*•]\s+(.*)$/); const ol = line.match(/^\s*\d+[.)]\s+(.*)$/); const h = line.match(/^#{1,4}\s+(.*)$/);
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol';
      if (list !== kind) { close(); out.push(`<${kind}>`); list = kind; }
      out.push(`<li>${inline((ul ?? ol)[1])}</li>`);
    } else {
      close();
      if (h) out.push(`<p class="md-h">${inline(h[1])}</p>`);
      else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    }
  }
  close();
  return out.join('');
}

const CHAT_SUGGESTIONS = ['What should I train today?', 'How is my spending this month?', 'Am I on track for my goals?', 'Plan my next leg workout', 'Which muscles am I neglecting?', 'How can I save ₹2,000 this month?'];

function chatBubble(m, i) {
  if (m.role === 'user') return `<div class="msg me"><div class="bubble">${esc(m.text)}</div></div>`;
  const body = m.pending && !m.text ? '<span class="typing"><i></i><i></i><i></i></span>' : mdLite(m.text) + (m.pending ? '<span class="caret"></span>' : '');
  const app = m.app === 'chatgpt' ? 'ChatGPT' : 'Claude';
  const actions = m.handoff && m.prompt ? `<div class="handoff-actions">
      <button type="button" class="hbtn press" data-action="chat-copy" data-i="${i}">${icon('copy', 15, 2)}Copy again</button>
      <button type="button" class="hbtn press" data-action="chat-open" data-app="${m.app === 'chatgpt' ? 'chatgpt' : 'claude'}">${icon('right', 15, 2.2)}Open ${app}</button>
    </div>` : '';
  return `<div class="msg ai ${m.error ? 'err' : ''} ${m.handoff ? 'handoff' : ''}" data-msg="${i}">
    <div class="ai-avatar">${icon(m.handoff ? 'copy' : 'spark', 15, 2)}</div><div class="bubble">${body}${actions}</div></div>`;
}

function chatView() {
  const ai = aiSetup();
  const inApp = Boolean(ai.key);
  const appName = ai.name;
  return `
    ${head('Ask about your data', 'Assistant', `
      ${chatMsgs.length ? `<button class="icon-btn press" data-action="chat-new" aria-label="New chat">${icon('edit', 19)}</button>` : ''}
      <button class="icon-btn press" data-tab="today" aria-label="Back to Today">${icon('x', 20)}</button>`)}
    <button class="ai-mode press ${inApp ? 'on' : ''}" data-action="ai-settings">
      <span class="ai-mode-dot"></span>
      <span class="row-main"><b>${inApp ? `${ai.gpt ? '' : 'Claude '}${esc(ai.model.label)} · answers here` : `Free mode · opens ${appName}`}</b>
        <span>${inApp ? `Uses your ${ai.gpt ? 'OpenAI' : 'Anthropic'} API key (pay-per-use)` : 'Copies your question with your data, then opens the app to paste it'}</span></span>
      <span class="faint">${icon('settings', 17)}</span>
    </button>
    <div class="chat-list" id="chat-list" aria-live="polite">
      ${chatMsgs.length ? chatMsgs.map(chatBubble).join('') : `
        <div class="chat-empty">
          <div class="ai-hero">${icon('spark', 28, 1.8)}</div>
          <h3>Ask anything about your training, money, plan or goals</h3>
          <p class="muted small">It sees a summary of everything in Life Tracker: workouts, muscles, PRs, plan, weight, spending and goals.</p>
        </div>`}
    </div>
    ${chatMsgs.length < 2 ? `<div class="chat-chips">${CHAT_SUGGESTIONS.map((q) => `<button class="fchip press" data-action="chat-suggest" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
    <form class="composer" id="chat-form" autocomplete="off">
      <textarea id="chat-input" rows="1" maxlength="2000" placeholder="${inApp ? `Message ${appName}…` : `Ask, then paste in ${appName}…`}" aria-label="Your message">${esc(chatDraft)}</textarea>
      <button type="submit" class="send press" aria-label="Send" ${chatBusy ? 'disabled' : ''}>${icon('up', 20, 2.6)}</button>
    </form>`;
}

/** Updates only the last message while Claude is typing (no full redraw, keeps the keyboard up). */
function refreshLastBubble() {
  const list = document.getElementById('chat-list');
  if (!list) return;
  const i = chatMsgs.length - 1;
  const el = list.querySelector(`[data-msg="${i}"]`);
  if (!el) { render(); return; }
  const nearBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 160;
  el.outerHTML = chatBubble(chatMsgs[i], i);
  if (nearBottom) window.scrollTo(0, document.body.scrollHeight);
}

let aiSdk = null;
const loadAiSdk = () => (aiSdk ??= import(AI_SDK_URL).then((m) => m.default ?? m.Anthropic).catch((e) => { aiSdk = null; throw e; }));

/** Free mode: copy question + data, open the Claude or ChatGPT app. Runs inside the tap so iPhone allows both. */
function aiHandoff(text) {
  const cfg = aiCfg();
  const isGpt = cfg.app === 'chatgpt';
  const prompt = `${AI_RULES}\n\n--- My Life Tracker data ---\n${aiContext()}\n--- End of data ---\n\nMy question: ${text}`;
  const copied = navigator.clipboard?.writeText(prompt);
  window.open(isGpt ? 'https://chatgpt.com/' : 'https://claude.ai/new', '_blank', 'noopener');
  chatMsgs.push({ role: 'user', text, at: Date.now() });
  const appName = isGpt ? 'ChatGPT' : 'Claude';
  const note = {
    role: 'assistant', handoff: true, at: Date.now(), app: isGpt ? 'chatgpt' : 'claude', prompt,
    text: `Copied your question **with your data**. In ${appName}, tap and hold the message box, choose **Paste**, then send.\n\nIf Paste doesn't work, tap **Copy again** below.`,
  };
  chatMsgs.push(note);
  chatDraft = '';
  saveChat();
  render();
  Promise.resolve(copied).catch(() => {
    note.text = `Couldn’t copy automatically. Tap **Copy again** below, then go back to ${appName} and paste.`;
    saveChat(); refreshLastBubble();
  });
}

/** Copy a free-mode question again. If the phone blocks copying, show the text to copy by hand. */
function copyHandoff(i) {
  const m = chatMsgs[i];
  if (!m?.prompt) return;
  const appName = m.app === 'chatgpt' ? 'ChatGPT' : 'Claude';
  const manual = () => {
    openSheet('Copy your question', `
      <p class="muted small" style="margin:0 0 10px">Your phone blocked automatic copying. Tap the text, choose <b>Select All</b>, then <b>Copy</b>, and paste it in ${appName}.</p>
      <textarea class="copy-box" readonly rows="12">${esc(m.prompt)}</textarea>
      <button type="button" class="btn tint press" style="--c:var(--goal);margin-top:12px" data-action="chat-open" data-app="${m.app === 'chatgpt' ? 'chatgpt' : 'claude'}">${icon('right', 18, 2.2)}Open ${appName}</button>`);
    setTimeout(() => { const box = document.querySelector('.copy-box'); box?.focus(); box?.select(); }, 300);
  };
  if (!navigator.clipboard?.writeText) { manual(); return; }
  navigator.clipboard.writeText(m.prompt)
    .then(() => toast(`Copied. Now paste it in ${appName}`))
    .catch(manual);
}

async function sendChat(raw) {
  const text = clean(raw, 2000);
  if (!text || chatBusy) return;
  const cfg = aiCfg();
  const ai = aiSetup(cfg);
  if (!ai.key) { aiHandoff(text); return; }
  if (ai.gpt) { sendChatOpenAI(text, ai); return; }
  chatMsgs.push({ role: 'user', text, at: Date.now() });
  const reply = { role: 'assistant', text: '', at: Date.now(), pending: true };
  chatMsgs.push(reply);
  chatDraft = '';
  chatBusy = true;
  render();
  window.scrollTo(0, document.body.scrollHeight);
  let Anthropic = null;
  try {
    Anthropic = await loadAiSdk();
    const client = new Anthropic({ apiKey: cfg.key, dangerouslyAllowBrowser: true });
    const model = AI_MODELS.some((m) => m.id === cfg.model) ? cfg.model : AI_MODELS[0].id;
    const history = chatHistory();
    const params = {
      model,
      max_tokens: 16000,
      output_config: { effort: 'low' }, // chat: quick, concise answers
      system: [
        { type: 'text', text: AI_RULES },
        { type: 'text', text: `The user's data:\n${aiContext()}`, cache_control: { type: 'ephemeral' } },
      ],
      messages: [...history, { role: 'user', content: text }],
    };
    // Opus 5.5: if a safety check declines, the API retries on a suitable model instead of stopping.
    const stream = model === 'claude-opus-5-5'
      ? client.beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : client.messages.stream(params);
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { reply.text += ev.delta.text; refreshLastBubble(); }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') { reply.error = true; reply.text = reply.text || 'Claude declined to answer this one. Try asking it a different way.'; }
    else if (final.stop_reason === 'max_tokens') reply.text += '\n\n(The answer was cut off.)';
  } catch (err) {
    reply.error = true;
    if (Anthropic && err instanceof Anthropic.AuthenticationError) reply.text = 'Your API key wasn’t accepted. Check it in the settings above.';
    else if (Anthropic && err instanceof Anthropic.PermissionDeniedError) reply.text = 'This API key isn’t allowed to use that model. Try the other model in settings.';
    else if (Anthropic && err instanceof Anthropic.RateLimitError) reply.text = 'Too many requests, or your Anthropic account is out of credit. Wait a minute, or check your balance at console.anthropic.com.';
    else if (Anthropic && err instanceof Anthropic.APIConnectionError) reply.text = 'Couldn’t reach Claude. Check your internet connection.';
    else if (Anthropic && err instanceof Anthropic.APIError) reply.text = `Claude returned an error (${err.status ?? 'unknown'}). Try again in a moment.`;
    else if (!Anthropic) reply.text = 'Couldn’t load the assistant. Check your internet connection.';
    else reply.text = `Something went wrong: ${err?.message ?? err}`;
  } finally {
    reply.pending = false;
    chatBusy = false;
    saveChat();
    if (route === 'chat') render();
  }
}

/** Earlier turns that got a normal answer (skips errors, free-mode notes and the questions they belong to). */
function chatHistory() {
  const history = [];
  for (let k = 0; k < chatMsgs.length - 2; k += 1) {
    const m = chatMsgs[k]; const next = chatMsgs[k + 1];
    if (m.role === 'user' && next?.role === 'assistant' && !next.error && !next.handoff && !next.pending && next.text) {
      history.push({ role: 'user', content: m.text }, { role: 'assistant', content: next.text });
    }
  }
  return history.slice(-20);
}

/** In-app ChatGPT: OpenAI Responses API, streamed, with your own OpenAI API key. */
async function sendChatOpenAI(text, ai) {
  chatMsgs.push({ role: 'user', text, at: Date.now() });
  const reply = { role: 'assistant', text: '', at: Date.now(), pending: true };
  chatMsgs.push(reply);
  chatDraft = '';
  chatBusy = true;
  render();
  window.scrollTo(0, document.body.scrollHeight);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.key}` },
      body: JSON.stringify({
        model: ai.model.id,
        instructions: `${AI_RULES}\n\nThe user's data:\n${aiContext()}`,
        input: [...chatHistory(), { role: 'user', content: text }],
        max_output_tokens: 16000,
        reasoning: { effort: 'low' }, // chat: quick, concise answers
        stream: true,
      }),
    });
    if (!res.ok) {
      let err = {};
      try { err = (await res.json())?.error ?? {}; } catch { /* not JSON */ }
      const code = err.code ?? err.type ?? '';
      reply.error = true;
      if (res.status === 401) reply.text = 'Your OpenAI API key wasn’t accepted. Check it in the settings above.';
      else if (res.status === 429 && /credit|quota|spend|usage_limit/.test(code)) reply.text = 'Your OpenAI account is out of credit or hit its spend limit. Add credit at platform.openai.com → Billing.';
      else if (res.status === 429) reply.text = 'Too many requests to ChatGPT. Wait a minute and try again.';
      else if (res.status === 404) reply.text = `This key can’t use ${ai.model.label}. Try the other model in settings.`;
      else reply.text = `ChatGPT returned an error (${res.status}): ${err.message ?? 'try again in a moment.'}`;
      return;
    }
    // Server-sent events: blocks separated by a blank line, each with a "data: {json}" line.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = ''; let finished = false;
    while (!finished) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let cut;
      while ((cut = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, cut); buf = buf.slice(cut + 2);
        const dataLine = block.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('');
        if (!dataLine || dataLine === '[DONE]') continue;
        let ev; try { ev = JSON.parse(dataLine); } catch { continue; }
        if (ev.type === 'response.output_text.delta' && typeof ev.delta === 'string') { reply.text += ev.delta; refreshLastBubble(); }
        else if (ev.type === 'response.completed') finished = true;
        else if (ev.type === 'response.incomplete') {
          finished = true;
          const why = ev.response?.incomplete_details?.reason;
          reply.text += why === 'content_filter' ? '\n\n(ChatGPT stopped this answer.)' : '\n\n(The answer was cut off.)';
        } else if (ev.type === 'response.failed' || ev.type === 'error') {
          finished = true;
          reply.error = true;
          reply.text = reply.text || `ChatGPT couldn’t answer: ${ev.response?.error?.message ?? ev.message ?? 'unknown error'}`;
        }
      }
    }
    if (!reply.text) { reply.error = true; reply.text = 'ChatGPT sent an empty answer. Try again.'; }
  } catch (err) {
    reply.error = true;
    reply.text = navigator.onLine === false ? 'You’re offline. Check your internet connection.' : `Couldn’t reach ChatGPT: ${err?.message ?? err}`;
  } finally {
    reply.pending = false;
    chatBusy = false;
    saveChat();
    if (route === 'chat') render();
  }
}

function aiSettingsSheet() {
  const cfg = aiCfg();
  const pick = cfg.app === 'chatgpt' ? 'ChatGPT' : 'Claude';
  const modelRows = (name, list, current) => list.map((m) => `<label class="row pick-row card" style="padding:12px 14px">
      <input type="radio" name="${name}" value="${m.id}" ${current === m.id ? 'checked' : ''}>
      <div class="row-main"><div class="row-title">${esc(m.label)}</div><div class="row-sub">${esc(m.note)}</div></div>
      <span class="pick-check">${icon('check', 18, 2.6)}</span></label>`).join('');
  openSheet('AI assistant', `
    <p class="muted small" style="margin:0 0 14px">The assistant reads a summary of your Life Tracker data to answer questions about training, money, your plan and goals.</p>
    <span class="label">Assistant</span>
    ${seg('app', ['Claude', 'ChatGPT'], pick)}
    <p class="faint small" style="margin:8px 2px 0">Without an API key it runs in <b>free mode</b>: your question and data are copied and the Claude or ChatGPT app opens, using your normal subscription. With a key for the chosen assistant, it answers right here.</p>

    <div class="ai-prov" data-prov="Claude" ${pick === 'Claude' ? '' : 'hidden'}>
      <span class="label">Claude in the app (optional)</span>
      ${field('Anthropic API key', `<input name="key" type="password" autocomplete="off" spellcheck="false" placeholder="${cfg.key ? '•••••••• saved on this phone' : 'sk-ant-…'}">`)}
      <div class="stack" style="gap:8px;margin-top:10px">${modelRows('model', AI_MODELS, cfg.model ?? AI_MODELS[0].id)}</div>
      <p class="faint small" style="margin:10px 2px 0">Get a key at <b>console.anthropic.com</b> → API keys. Claude Max, Ultra and Team plans include monthly API credits you can link there; Pro doesn't.</p>
      ${cfg.key ? `<button type="button" class="btn danger press" style="margin-top:12px" data-action="ai-key-remove" data-prov="claude">${icon('trash', 18)}Remove Claude key</button>` : ''}
    </div>

    <div class="ai-prov" data-prov="ChatGPT" ${pick === 'ChatGPT' ? '' : 'hidden'}>
      <span class="label">ChatGPT in the app (optional)</span>
      ${field('OpenAI API key', `<input name="openaiKey" type="password" autocomplete="off" spellcheck="false" placeholder="${cfg.openaiKey ? '•••••••• saved on this phone' : 'sk-…'}">`)}
      <div class="stack" style="gap:8px;margin-top:10px">${modelRows('openaiModel', OPENAI_MODELS, cfg.openaiModel ?? OPENAI_MODELS[0].id)}</div>
      <p class="faint small" style="margin:10px 2px 0">Get a key at <b>platform.openai.com</b> → API keys and add credit under Billing. ChatGPT Go/Plus subscriptions don't include API use.</p>
      ${cfg.openaiKey ? `<button type="button" class="btn danger press" style="margin-top:12px" data-action="ai-key-remove" data-prov="chatgpt">${icon('trash', 18)}Remove OpenAI key</button>` : ''}
    </div>

    <section class="card small muted" style="margin-top:14px">
      <p style="margin:0">Keys are stored only on this phone, not in your cloud data, and are sent only to Anthropic or OpenAI. Anyone with your unlocked phone could use them, so set a monthly spend limit in that provider's console.</p>
    </section>
  `, (form, f) => {
    const next = { ...aiCfg(), app: f.get('app') === 'ChatGPT' ? 'chatgpt' : 'claude' };
    if (AI_MODELS.some((m) => m.id === f.get('model'))) next.model = f.get('model');
    if (OPENAI_MODELS.some((m) => m.id === f.get('openaiModel'))) next.openaiModel = f.get('openaiModel');
    const key = String(f.get('key') ?? '').trim();
    const openaiKey = String(f.get('openaiKey') ?? '').trim();
    if (key) {
      if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(key)) { toast('That doesn’t look like an Anthropic API key (sk-ant-…)', true); return false; }
      next.key = key;
    }
    if (openaiKey) {
      if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(openaiKey) || openaiKey.startsWith('sk-ant-')) { toast('That doesn’t look like an OpenAI API key (sk-…)', true); return false; }
      next.openaiKey = openaiKey;
    }
    saveAiCfg(next);
    const ai = aiSetup(next);
    toast(ai.key ? `${ai.name} answers inside the app` : `Free mode · opens ${ai.name}`);
    setTimeout(() => { if (route === 'chat') render(); }, 250);
  }, 'Save', 'var(--goal)');
}

// Show the key and model options for whichever assistant is selected.
document.addEventListener('change', (e) => {
  if (e.target.name !== 'app' || !e.target.closest('.sheet')) return;
  document.querySelectorAll('.sheet .ai-prov').forEach((el) => { el.hidden = el.dataset.prov !== e.target.value; });
});

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'chat-form') return;
  e.preventDefault();
  sendChat(document.getElementById('chat-input')?.value);
});
document.addEventListener('input', (e) => {
  if (e.target.id !== 'chat-input') return;
  chatDraft = e.target.value;
  e.target.style.height = 'auto';
  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
});
// Enter sends; Shift+Enter makes a new line.
document.addEventListener('keydown', (e) => {
  if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    document.getElementById('chat-form')?.requestSubmit();
  }
});

/* ================= Collapsible History ================= */

let historyOpen = (() => { try { return localStorage.getItem('lt-history-open') !== '0'; } catch { return true; } })();

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
    const repsVal = draft.reps ?? (lastSet ? String(lastSet.reps || '') : String(e.target?.reps ?? 10));
    const goalSets = e.target?.sets;
    const topKg = Math.max(0, ...sets.map((x) => x.kg || 0));
    const isPr = !cardio && topKg > 0 && topKg > (prev[normName(e.name)] ?? 0) && prev[normName(e.name)] !== undefined;

    return `<section class="card ex-card" data-ex="${i}">
      <div class="ex-head">
        <div class="row-main">
          <div class="row-title">${esc(e.name)}</div>
          <div class="row-sub">${esc(e.muscle ?? '')}${goalSets ? ` · Plan: ${goalSets} × ${esc(e.target.reps)}` : ''}${last ? ` · Last: ${esc(summariseSets(last.ex, last.sets))}` : ' · First time'}</div>
        </div>
        ${isPr ? `<span class="pr-badge">${icon('trophy', 13, 2.2)}New PR</span>` : ''}
        <button class="x-btn press" data-action="how-to" data-name="${esc(e.name)}" data-muscle="${esc(e.muscle ?? '')}" aria-label="How to do ${esc(e.name)}">${icon('info', 18)}</button>
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
      <button class="btn tint press log-btn" style="--c:var(--train)" data-action="session-log" data-i="${i}">${icon('check', 18, 2.6)}Log set ${sets.length + 1}${goalSets ? ` of ${goalSets}` : ''}</button>
    </section>`;
  }).join('');

  return `
    <header class="head session-head">
      <div><div class="eyebrow" style="color:var(--train)">${esc(muscles)}</div>
        <h1 class="num session-clock ${isPaused(s) ? 'paused' : ''}" ${timerAttrs(s)}>${fmtClock(sessionElapsed(s))}</h1>
        ${isPaused(s) ? `<div class="awake-note paused-note">${icon('pause', 13, 2.4)}Paused · clock stopped</div>`
          : 'wakeLock' in navigator ? `<div class="awake-note">${icon('screen', 13, 2)}Screen stays on</div>` : ''}</div>
      <div class="head-actions">
        <button class="icon-btn press pause-btn ${isPaused(s) ? 'is-paused' : ''}" data-action="${isPaused(s) ? 'session-resume' : 'session-pause'}" aria-label="${isPaused(s) ? 'Resume workout' : 'Pause workout'}">${icon(isPaused(s) ? 'play' : 'pause', 20, 2.2)}</button>
        <button class="icon-btn press" data-tab="train" aria-label="Minimise session">${icon('left', 20)}</button>
      </div>
    </header>
    ${isPaused(s) ? `<button class="card paused-bar press" data-action="session-resume">
      <span class="paused-icon">${icon('pause', 18, 2.4)}</span>
      <div class="row-main"><div class="row-title">Workout paused</div><div class="row-sub">The clock is stopped. Logging a set also resumes it.</div></div>
      <span class="pill">${icon('play', 13, 2.4)}Resume</span>
    </button>` : ''}
    <div class="stack">
      ${liveMuscleCard(s)}
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
        <div class="money-split">
          <div><div class="eyebrow">Spent</div>
            <div class="hero-num num money-num">${rupees(total)}</div></div>
          <div class="money-left ${total > budget ? 'over' : ''}">
            <div class="eyebrow">${total > budget ? 'Over by' : isCurrent ? 'Left to spend' : 'Saved'}</div>
            <div class="hero-num num money-num">${rupees(Math.abs(budget - total))}</div></div>
        </div>
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

const VIEWS = { today: todayView, train: trainView, plan: planView, money: moneyView, goals: goalsView };

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
  const inLibrary = route === 'exercises'; const inExplore = route === 'muscles'; const inChat = route === 'chat';
  const tab = inChat ? TABS[0] : inSession || inLibrary || inExplore ? TABS[1] : (TABS.find((t) => t.id === route) ?? TABS[0]);
  view.innerHTML = inSession ? sessionView() : inLibrary ? libraryView() : inExplore ? exploreView() : inChat ? chatView() : VIEWS[tab.id]();
  document.body.classList.toggle('in-session', inSession); document.body.classList.toggle('in-chat', inChat);
  syncWakeLock(inSession && !isPaused(activeSession())); // let the screen sleep while paused
  refreshWaterSheet();
  // Heatmap: start scrolled to the most recent weeks.
  view.querySelectorAll('.hm-scroll').forEach((el) => { el.scrollLeft = el.scrollWidth; });
  afterRender(view);
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
  const point = col.classList.contains('pt-hit'); // a dot on a line chart
  const cell = col.classList.contains('hm-cell') || col.classList.contains('bm-m'); // a heatmap day or a body-map muscle
  const card = col.closest(point ? '.pchart' : '.card');
  const tip = card?.querySelector('.tip');
  if (!tip) return;
  tip.querySelector('strong').textContent = col.dataset.tip;
  tip.querySelector('span').textContent = col.dataset.sub;
  const cr = card.getBoundingClientRect();
  const r = col.getBoundingClientRect();
  const half = Math.min(tip.offsetWidth / 2 || 50, cr.width / 2);
  const x = Math.min(Math.max(r.left + r.width / 2 - cr.left, half), cr.width - half);
  const y = point ? r.top + r.height / 2 - cr.top - 12
    : cell ? r.top - cr.top - 6
      : Math.min(col.querySelector('.col-bar').getBoundingClientRect().top, r.bottom - 24) - cr.top - 8;
  document.querySelectorAll('.hm-cell.on, .bm-m.on').forEach((c) => c.classList.remove('on'));
  if (cell) col.classList.add('on');
  card.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('on', point && i === [...card.querySelectorAll('.pt-hit')].indexOf(col)));
  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
  tip.hidden = false;
}
function hideTips() {
  document.querySelectorAll('.tip').forEach((t) => { t.hidden = true; });
  document.querySelectorAll('.pdot.on, .hm-cell.on, .bm-m.on').forEach((d) => d.classList.remove('on'));
}

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
  const col = e.target.closest('.col, .pt-hit, .hm-cell[data-tip], .bm-m[data-tip]');
  if (col) showTip(col); else if (!e.target.closest('.tip')) hideTips();
  const seg = e.target.closest('.donut-seg');
  if (seg) focusDonut(seg);
});
document.addEventListener('pointerout', (e) => {
  const seg = e.target.closest('.donut-seg');
  if (seg && !e.relatedTarget?.closest?.('.donut-seg')) resetDonut(seg.closest('.donut-wrap'));
});
document.addEventListener('focusin', (e) => {
  const col = e.target.closest('.col, .pt-hit, .hm-cell[data-tip], .bm-m[data-tip]');
  if (col) showTip(col);
  const seg = e.target.closest('.donut-seg');
  if (seg) focusDonut(seg);
});
document.addEventListener('focusout', (e) => { if (e.target.closest('.col, .pt-hit, .hm-cell, .bm-m')) hideTips(); });
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
        <button type="button" class="text-btn" data-action="sheet-close">${onSave && saveLabel ? 'Cancel' : 'Close'}</button>
        <h2>${esc(title)}</h2>
        ${onSave && saveLabel ? `<button type="submit" class="text-btn strong">${esc(saveLabel)}</button>` : '<span></span>'}
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
  editDraft = null;
  routineDraft = null;
  root.dataset.closing = 'true';
  root.dataset.open = 'false';
  const done = () => { if (root.dataset.open === 'false') { root.innerHTML = ''; root.dataset.closing = 'false'; } };
  setTimeout(done, reduceMotion() ? 200 : 230);
}

/**
 * In-app "Are you sure?" box. Used instead of the browser's confirm(), which some browsers and
 * home-screen apps block or auto-cancel. Sits above any open panel, so edits in progress are kept.
 * Resolves true for the main button, false for Cancel, the backdrop or Escape.
 */
function askConfirm({ title, message = '', yes = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    let root = document.getElementById('confirm-root');
    if (!root) { root = document.createElement('div'); root.id = 'confirm-root'; document.body.append(root); }
    root.innerHTML = `
      <div class="cf-backdrop" data-cf="no"></div>
      <div class="cf-box" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-msg">
        <div class="cf-icon" style="--c:${danger ? 'var(--critical)' : 'var(--text)'}">${icon(danger ? 'trash' : 'alert', 22)}</div>
        <h3 id="cf-title">${esc(title)}</h3>
        ${message ? `<p id="cf-msg">${esc(message)}</p>` : ''}
        <div class="cf-actions">
          <button type="button" class="btn ghost press" data-cf="no">Cancel</button>
          <button type="button" class="btn press ${danger ? 'cf-danger' : ''}" data-cf="yes">${esc(yes)}</button>
        </div>
      </div>`;
    root.dataset.open = 'false';
    void root.offsetHeight; // commit the hidden state, then animate in
    root.dataset.open = 'true';
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); finish(false); } };
    const finish = (answer) => {
      root.onclick = null;
      document.removeEventListener('keydown', onKey, true);
      root.dataset.open = 'false';
      setTimeout(() => { if (root.dataset.open === 'false') root.innerHTML = ''; }, 220);
      resolve(answer);
    };
    root.onclick = (e) => {
      const b = e.target.closest('[data-cf]');
      if (!b) return;
      e.stopPropagation();
      finish(b.dataset.cf === 'yes');
    };
    document.addEventListener('keydown', onKey, true);
    root.querySelector('[data-cf="no"].btn')?.focus();
  });
}

const seg = (name, options, checked) => `<div class="seg">${options.map((o) => `
  <label><input type="radio" name="${name}" value="${esc(o)}" ${o === checked ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;

const field = (label, input) => `<label class="field"><span>${label}</span>${input}</label>`;

/* ---------- Gym session sheets ---------- */

function startSessionSheet() {
  const live = activeSession();
  if (live) { go('session'); return; }
  const planned = todaysRoutine();
  const others = sortedRoutines().filter((r) => r.id !== planned?.id);
  const routineBtn = (r, main) => `<button type="button" class="row press ${main ? 'card plan-start' : ''}" data-action="start-routine" data-id="${esc(r.id)}">
      <div class="tile-icon" style="--c:var(--water)">${icon('calendar', 19)}</div>
      <div class="row-main"><div class="row-title">${esc(r.name)}</div><div class="row-sub">${esc(`${routineMuscles(r).join(' · ')} · ${plural(r.exercises.length, 'exercise')}`)}</div></div>
      <span class="faint">${icon('right', 18)}</span></button>`;
  openSheet('Start workout', `
    ${planned ? `<span class="label">Today's plan</span>${routineBtn(planned, true)}` : ''}
    ${others.length ? `<span class="label">${planned ? 'Or another routine' : 'Your routines'}</span><section class="card">${others.map((r) => routineBtn(r, false)).join('')}</section>` : ''}
    <div class="detail-hero" style="${planned || others.length ? 'margin-top:18px' : ''}"><div class="tile-icon" style="--c:var(--train)">${icon('gym', 28)}</div>
      <h3>${planned || others.length ? 'Or pick muscles' : 'What are you training today?'}</h3>
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
      <section class="card ex-pick">${exercisesFor(m).map((name) => `
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
  if (isPaused(s)) resumeSession(true); // logging a set means you're training again
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
  const minutes = Math.max(1, Math.round(sessionElapsed(s) / 60000)); // paused time doesn't count
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

/** Log a run, walk, yoga… or, given an existing entry, edit it. */
function quickLogForm(w = null) {
  const type = w?.type ?? QUICK_TYPES[0].name;
  openSheet(w ? 'Edit activity' : 'Quick log', `
    <span class="label">Activity</span>
    <div class="chips">${QUICK_TYPES.map((t) => `
      <label class="chip"><input type="radio" name="type" value="${t.name}" ${t.name === type ? 'checked' : ''}><span>${icon(t.icon, 22)}${t.name}</span></label>`).join('')}</div>
    <span class="label">Session</span>
    <div class="field-row">
      ${field('Duration (min)', `<input type="number" name="minutes" inputmode="numeric" value="${esc(w?.minutes ?? 30)}" min="1" max="600">`)}
      ${field('Calories', `<input type="number" name="calories" inputmode="numeric" min="0" placeholder="Optional" value="${w?.calories ? esc(w.calories) : ''}">`)}
    </div>
    <div class="field-row">
      ${field('Steps', `<input type="number" name="steps" inputmode="numeric" min="0" placeholder="Optional" value="${w?.steps ? esc(w.steps) : ''}">`)}
      ${field('When', `<input type="datetime-local" name="at" value="${toLocalInput(w?.at ?? Date.now())}">`)}
    </div>
    <span class="label">Intensity</span>
    ${seg('intensity', INTENSITIES, w?.intensity ?? 'Medium')}
    <span class="label">Notes</span>
    ${field('How did it feel?', `<textarea name="notes" rows="2" maxlength="500" placeholder="Optional">${esc(w?.notes ?? '')}</textarea>`)}
    ${w ? `<button type="button" class="btn danger press" style="margin-top:20px" data-action="delete" data-col="workouts" data-id="${esc(w.id)}">${icon('trash', 18)}Delete activity</button>` : ''}
  `, (form, f) => {
    const values = {
      at: fromLocalInput(f.get('at')),
      type: f.get('type') || 'Other',
      minutes: Math.max(1, Math.round(num(f.get('minutes')) || 1)),
      intensity: f.get('intensity') || 'Medium',
      calories: Math.max(0, Math.round(num(f.get('calories')))),
      steps: Math.max(0, Math.round(num(f.get('steps')))),
      notes: clean(f.get('notes'), 500),
    };
    if (w) write(store.update('workouts', w.id, values), 'Activity updated');
    else write(store.add('workouts', { ...values, status: 'done', exercises: [] }), 'Workout saved');
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
    <button type="button" class="btn ghost press" style="margin-top:20px" data-action="workout-edit" data-id="${esc(w.id)}">${icon('edit', 18)}Edit workout</button>
    <button type="button" class="btn danger press" style="margin-top:10px" data-action="delete" data-col="workouts" data-id="${esc(w.id)}">${icon('trash', 18)}Delete workout</button>
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

/* ---------- Push notification reminders ---------- */

// Public half of the push key pair (safe to publish). The private half lives only in a GitHub secret.
const VAPID_PUBLIC_KEY = 'BO3GE4rWv3A5so8eruftMELzeEkpn0yiqMxITa9gDUUPUd4_jwbYSKYZU-N2MUsTQDIh5YcUqpiKpjZd6qZyabA';
const REMINDER_DEFAULTS = { enabled: false, start: '09:00', end: '21:00', every: 120 };
const reminderSettings = () => ({ ...REMINDER_DEFAULTS, ...(data().settings.reminders ?? {}) });
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const fmtHM = (hm) => {
  const [h, m] = String(hm).split(':').map(Number);
  const d = new Date(); d.setHours(h || 0, m || 0, 0, 0);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: m ? '2-digit' : undefined });
};
const everyLabel = (min) => (min % 60 === 0 ? `${min / 60} h` : `${(min / 60).toFixed(1)} h`);

function reminderCard() {
  const r = reminderSettings();
  const on = r.enabled && (r.subs ?? []).length > 0;
  return `<button type="button" class="row card press" data-action="water-reminders" style="padding:16px 18px">
    <div class="tile-icon" style="--c:var(--water)">${icon('bell', 20)}</div>
    <div class="row-main"><div class="row-title">Drink reminders</div>
      <div class="row-sub">${on ? `On · every ${everyLabel(r.every)} · ${fmtHM(r.start)}–${fmtHM(r.end)}` : 'Off · tap to get notifications from this app'}</div></div>
    <div class="row-end">${on ? `<span class="status" style="--s:var(--good)">${icon('check', 15, 2.4)}On</span>` : `<span class="faint">${icon('right', 18)}</span>`}</div>
  </button>`;
}

function b64ToBytes(b64url) {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const raw = atob((b64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function remindersSheet() {
  const r = reminderSettings();
  const on = r.enabled && (r.subs ?? []).length > 0;
  const blocked = !pushSupported() || !isStandalone();
  const denied = pushSupported() && Notification.permission === 'denied';
  openSheet('Drink reminders', `
    <div class="detail-hero"><div class="tile-icon" style="--c:var(--water)">${icon('bell', 26)}</div>
      <h3>${on ? 'Reminders are on' : 'Get reminders from Life Tracker'}</h3>
      <p class="muted small" style="margin-top:6px;max-width:330px;margin-inline:auto">A friendly drink-water nudge at each time below, every day.</p></div>
    ${blocked ? `<section class="card" style="border-color:color-mix(in srgb,var(--warning) 40%,transparent)">
      <div class="status" style="--s:var(--warning)">${icon('alert', 16, 2.2)}Open from your Home Screen</div>
      <p class="muted small" style="margin-top:6px">iPhone only allows notifications for web apps opened from the Home Screen icon. Add Life Tracker to your Home Screen, open it from there, then come back here.</p></section>` : ''}
    ${denied ? `<section class="card" style="border-color:color-mix(in srgb,var(--critical) 40%,transparent)">
      <div class="status" style="--s:var(--critical)">${icon('alert', 16, 2.2)}Notifications are blocked</div>
      <p class="muted small" style="margin-top:6px">Open iPhone <b>Settings → Notifications → Life Tracker</b> and turn on <b>Allow Notifications</b>.</p></section>` : ''}
    <span class="label">Schedule</span>
    <div class="field-row">
      ${field('From', `<input type="time" name="start" value="${esc(r.start)}">`)}
      ${field('Until', `<input type="time" name="end" value="${esc(r.end)}">`)}
    </div>
    <span class="label">Remind me every</span>
    ${seg('every', ['1 h', '1.5 h', '2 h', '3 h'], everyLabel(r.every))}
    <div class="stack" style="margin-top:18px;gap:10px">
      <button type="submit" class="btn tint press" style="--c:var(--water)" ${blocked || denied ? 'disabled' : ''}>${icon('bell', 18)}${on ? 'Save changes' : 'Turn on notifications'}</button>
      ${on ? `<button type="button" class="btn ghost press" data-action="reminders-test">${icon('bolt', 18)}Show a test notification</button>
        <button type="button" class="btn danger press" data-action="reminders-off">Turn off reminders</button>` : ''}
      <button type="button" class="text-btn" style="margin:2px auto 0" data-action="reminders-shortcuts">Or use the Shortcuts app instead</button>
    </div>
  `, (form, f) => {
    const every = { '1 h': 60, '1.5 h': 90, '2 h': 120, '3 h': 180 }[f.get('every')] ?? 120;
    const start = String(f.get('start') || '09:00');
    const end = String(f.get('end') || '21:00');
    if (end <= start) { toast('“Until” must be later than “From”', true); return false; }
    enableReminders({ start, end, every });
    return false; // the sheet closes once the phone has said yes
  }, null, 'var(--water)');
}

async function enableReminders(schedule) {
  if (!pushSupported() || !isStandalone()) { toast('Open Life Tracker from your Home Screen first', true); return; }
  // Ask first, while the tap still counts as the user's action.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') { toast('Notifications were not allowed', true); remindersSheet(); return; }
  try {
    const reg = await navigator.serviceWorker.ready;
    const appKey = b64ToBytes(VAPID_PUBLIC_KEY);
    let sub = await reg.pushManager.getSubscription();
    // A subscription made with an older key can't receive our pushes: replace it.
    const oldKey = sub?.options?.applicationServerKey ? new Uint8Array(sub.options.applicationServerKey) : null;
    if (sub && oldKey && (oldKey.length !== appKey.length || oldKey.some((b, i) => b !== appKey[i]))) {
      await sub.unsubscribe();
      sub = null;
    }
    sub = sub ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    const json = sub.toJSON();
    const subs = [...(reminderSettings().subs ?? []).filter((x) => x.endpoint !== json.endpoint),
      { endpoint: json.endpoint, keys: json.keys, addedAt: Date.now(), device: /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone' : 'Browser' }];
    write(store.saveSettings({ reminders: { ...schedule, enabled: true, subs } }), 'Reminders are on');
    closeSheet();
  } catch (err) {
    toast(`Couldn’t turn on notifications: ${err?.message ?? err}`, true);
  }
}

async function testNotification() {
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('Time to drink water 💧', {
      body: 'This is a test. Real reminders arrive at your scheduled times.',
      icon: './icons/icon-180.png', tag: 'water-test', data: { url: './#water' },
    });
  } catch (err) { toast(`Test failed: ${err?.message ?? err}`, true); }
}

async function disableReminders() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    const endpoint = sub?.endpoint;
    await sub?.unsubscribe();
    const subs = (reminderSettings().subs ?? []).filter((x) => x.endpoint !== endpoint);
    write(store.saveSettings({ reminders: { ...reminderSettings(), enabled: subs.length > 0, subs } }), 'Reminders turned off');
  } catch {
    write(store.saveSettings({ reminders: { ...reminderSettings(), enabled: false, subs: [] } }), 'Reminders turned off');
  }
  closeSheet();
}

function remindersHelp() {
  const times = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];
  openSheet('Shortcuts reminders', `
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
      ${field('Monthly budget (₹)', `<input name="budget" inputmode="numeric" value="${esc(s.budget)}">`)}
    </div>
    <span class="label">Water</span>
    ${reminderCard()}
    <span class="label">AI assistant</span>
    <button type="button" class="row card press" data-action="ai-settings" style="padding:14px 16px">
      <div class="tile-icon" style="--c:var(--goal)">${icon('spark', 19)}</div>
      <div class="row-main"><div class="row-title">Assistant settings</div>
        <div class="row-sub">${aiSetup().key ? `${aiSetup().name} · answers inside the app` : `Free mode · opens ${aiSetup().name}`}</div></div>
      <span class="faint">${icon('right', 18)}</span></button>
    <span class="label">Body diagrams</span>
    <div class="seg-tabs" role="tablist">${[['male', 'Male'], ['female', 'Female']].map(([v, l]) => `
      <button type="button" class="press" role="tab" data-action="body-sex" data-v="${v}" aria-selected="${bodySex() === v}">${l}</button>`).join('')}</div>
    <span class="label">Credits</span>
    <section class="card small muted credits">
      <p>Body diagrams from <b>MuscleMap</b> by Melih Colpan (MIT licence).</p>
      <p>Exercise photos and instructions from <b>free-exercise-db</b> (public domain).</p>
    </section>
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
    const trainGoal = Math.round(num(f.get('trainGoal')));
    if (!(budget > 0)) { toast('Enter a budget above ₹0', true); return false; }
    if (!(trainGoal >= 5 && trainGoal <= 300)) { toast('Training goal: 5 to 300 min', true); return false; }
    write(store.saveSettings({ budget, trainGoal }), 'Settings saved');
  });
}

function exportBackup() {
  const d = data();
  const backup = { exportedAt: new Date().toISOString(), settings: d.settings, workouts: d.workouts, expenses: d.expenses, water: d.water, goals: d.goals, weights: d.weights, routines: d.routines, exercises: d.exercises };
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
  'session-remove-ex': async (el) => {
    const s = activeSession();
    const i = Number(el.dataset.i);
    const e = s?.exercises?.[i];
    if (!e) return;
    if (exSets(e).length && !(await askConfirm({ title: `Remove ${e.name}?`, message: `Its ${plural(exSets(e).length, 'logged set')} will be removed from this workout.`, yes: 'Remove' }))) return;
    Object.keys(drafts).forEach((k) => { if (k.startsWith(`${s.id}:`)) delete drafts[k]; });
    write(store.update('workouts', s.id, { exercises: s.exercises.filter((_, k) => k !== i) }), `${e.name} removed`);
  },
  'session-finish': () => finishSession(),
  'session-pause': () => pauseSession(),
  'session-resume': () => resumeSession(),
  'session-discard': async () => {
    const s = activeSession();
    if (!s) return;
    const n = workoutSets(s);
    if (!(await askConfirm({ title: 'Discard this workout?', message: n ? `The ${plural(n, 'set')} you logged will be deleted. This can’t be undone.` : 'Nothing has been logged yet.', yes: 'Discard' }))) return;
    if (!activeSession()) return;
    Object.keys(drafts).forEach((k) => { if (k.startsWith(`${s.id}:`)) delete drafts[k]; });
    write(store.remove('workouts', s.id), 'Workout discarded');
    go('train');
  },
  'workout-open': (el) => workoutDetail(el.dataset.id),
  'workout-edit': (el) => workoutEditor(el.dataset.id),
  'backfill': () => workoutEditor(null),
  'ed-add-set': (el) => {
    const e = editDraft?.exercises[Number(el.dataset.i)];
    if (!e) return;
    const last = e.sets.at(-1);
    e.sets.push(last ? { kg: last.kg, reps: last.reps } : { kg: 0, reps: e.muscle === 'Cardio' ? 10 : 10 });
    rerenderEditor();
  },
  'ed-del-set': (el) => {
    const e = editDraft?.exercises[Number(el.dataset.i)];
    if (!e) return;
    e.sets.splice(Number(el.dataset.j), 1);
    rerenderEditor();
  },
  'ed-del-ex': async (el) => {
    const i = Number(el.dataset.i);
    const e = editDraft?.exercises[i];
    if (!e) return;
    if (e.sets.length && !(await askConfirm({ title: `Remove ${e.name}?`, message: `Its ${plural(e.sets.length, 'set')} will be removed when you save.`, yes: 'Remove' }))) return;
    if (!editDraft || editDraft.exercises[i] !== e) return;
    editDraft.exercises.splice(i, 1);
    rerenderEditor();
  },
  'ed-add-ex': () => {
    if (!editDraft) return;
    const raw = clean(document.getElementById('ed-new-name')?.value, 60);
    if (!raw) { toast('Type or pick an exercise name', true); return; }
    const name = allExerciseNames().find((n) => normName(n) === normName(raw)) ?? raw.charAt(0).toUpperCase() + raw.slice(1);
    if (editDraft.exercises.some((e) => normName(e.name) === normName(name))) { toast(`${name} is already in this workout`, true); return; }
    const sel = document.getElementById('ed-new-muscle')?.value;
    const muscle = MUSCLES.includes(sel) ? sel : 'Chest';
    const last = lastPerformance(name, editDraft.id);
    const sets = last ? last.sets.map((s) => ({ kg: s.kg || 0, reps: s.reps || 0 })) : [{ kg: 0, reps: 10 }];
    editDraft.exercises.push({ name, muscle, sets });
    rerenderEditor();
    setTimeout(() => document.querySelectorAll('.ed-ex').forEach((c, k, all) => { if (k === all.length - 1) c.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); }), 50);
  },
  // History
  'history-toggle': () => {
    historyOpen = !historyOpen;
    try { localStorage.setItem('lt-history-open', historyOpen ? '1' : '0'); } catch { /* storage blocked */ }
    render();
  },
  // Water panel
  'water-open': () => waterSheet(),
  // AI assistant
  'ai-settings': () => aiSettingsSheet(),
  'ai-key-remove': async (el) => {
    const gpt = el.dataset.prov === 'chatgpt';
    if (!(await askConfirm({ title: `Remove the ${gpt ? 'OpenAI' : 'Anthropic'} key?`, message: `${gpt ? 'ChatGPT' : 'Claude'} goes back to free mode (opens the app to paste).`, yes: 'Remove' }))) return;
    const cfg = aiCfg(); delete cfg[gpt ? 'openaiKey' : 'key']; saveAiCfg(cfg);
    closeSheet(); toast('Key removed from this phone');
    if (route === 'chat') render();
  },
  'chat-suggest': (el) => sendChat(el.dataset.q),
  'chat-copy': (el) => copyHandoff(Number(el.dataset.i)),
  'chat-open': (el) => window.open(el.dataset.app === 'chatgpt' ? 'https://chatgpt.com/' : 'https://claude.ai/new', '_blank', 'noopener'),
  'chat-new': async () => {
    if (chatBusy || !(await askConfirm({ title: 'Start a new chat?', message: 'This conversation will be cleared from this phone.', yes: 'New chat', danger: false }))) return;
    chatMsgs = []; chatDraft = ''; saveChat(); render();
  },
  // Exercise library
  'open-library': () => go('exercises'),
  'lib-filter': (el) => { libMuscle = el.dataset.m; libLimit = 60; render(); },
  'lib-more': () => { libLimit += 80; const list = document.getElementById('lib-list'); if (list) list.innerHTML = libraryList(); },
  'open-explore': () => go('muscles'),
  'explore-pick': (el) => {
    const id = el.dataset.r || null;
    exploreRegion = exploreRegion === id ? null : id;
    exploreScope = 'main';
    exploreLimit = 40;
    render();
    if (exploreRegion) setTimeout(() => document.getElementById('explore-results')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' }), 60);
  },
  'explore-scope': (el) => { exploreScope = el.dataset.t; exploreLimit = 40; render(); },
  'explore-more': () => { exploreLimit += 60; render(); },
  'body-sex': (el) => write(store.saveSettings({ bodySex: el.dataset.v === 'female' ? 'female' : 'male' })),
  'how-to': (el) => libraryDetail(el.dataset.name, el.dataset.muscle),
  'lib-open': (el) => libraryDetail(el.dataset.name, el.dataset.muscle),
  'lib-new': () => customExerciseForm(),
  'lib-add-live': (el) => { closeSheet(); addExerciseToSession(el.dataset.name, el.dataset.muscle); go('session'); },
  // Plan
  'plan-tab': (el) => { planTab = el.dataset.t; render(); },
  'plan-day': (el) => planDaySheet(Number(el.dataset.i)),
  'plan-starter': () => loadStarterPlan(),
  'routine-new': (el) => routineEditor(null, el.dataset.day !== undefined ? Number(el.dataset.day) : null),
  'routine-open': (el) => routineEditor(el.dataset.id),
  'routine-del': async (el) => {
    const r = routineById(el.dataset.id);
    if (!r || !(await askConfirm({ title: `Delete “${r.name}”?`, message: 'It’s removed from your plan too. Your logged workouts stay.' }))) return;
    const days = planDays().map((id) => (id === r.id ? null : id));
    write(store.saveSettings({ plan: { days } }));
    write(store.remove('routines', r.id), 'Routine deleted');
    closeSheet();
  },
  'rt-add-ex': () => {
    if (!routineDraft) return;
    const raw = clean(document.getElementById('rt-new-name')?.value, 60);
    if (!raw) { toast('Type or pick an exercise name', true); return; }
    const name = allExerciseNames().find((n) => normName(n) === normName(raw)) ?? raw.charAt(0).toUpperCase() + raw.slice(1);
    if (routineDraft.exercises.some((e) => normName(e.name) === normName(name))) { toast(`${name} is already in this routine`, true); return; }
    const sel = document.getElementById('rt-new-muscle')?.value;
    routineDraft.exercises.push({ name, muscle: MUSCLES.includes(sel) ? sel : 'Chest', sets: 3, reps: sel === 'Cardio' ? 20 : 10 });
    rerenderRoutine();
  },
  'rt-del-ex': (el) => { routineDraft?.exercises.splice(Number(el.dataset.i), 1); rerenderRoutine(); },
  'rt-move': (el) => {
    const list = routineDraft?.exercises;
    const i = Number(el.dataset.i); const j = i + Number(el.dataset.d);
    if (!list || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    rerenderRoutine();
  },
  'start-routine': (el) => { closeSheet(); startRoutine(el.dataset.id); },
  // Muscle map
  'map-mode': (el) => { mapMode = el.dataset.t; mapShowAll = false; render(); },
  'map-scope': (el) => { mapScope = el.dataset.t; render(); },
  'map-period': () => { mapPeriod = mapPeriod === 'week' ? 'month' : 'week'; mapBack = 0; render(); },
  'map-back': (el) => { mapBack = Math.max(0, mapBack + Number(el.dataset.d)); render(); },
  'map-pick': (el) => { mapSel = mapSel === el.dataset.r ? null : el.dataset.r; render(); },
  'map-more': () => { mapShowAll = !mapShowAll; render(); },
  'map-ranges': () => rangesSheet(),
  'map-ranges-reset': () => { write(store.saveSettings({ regionRanges: null }), 'Targets reset'); closeSheet(); },
  'explore-region': (el) => { exploreRegion = el.dataset.r; exploreScope = 'main'; exploreLimit = 40; go('muscles'); },
  'live-map-toggle': () => {
    liveMapOpen = !liveMapOpen;
    try { localStorage.setItem('lt-live-map', liveMapOpen ? '1' : '0'); } catch { /* storage blocked */ }
    render();
  },
  'weight-open': () => weightSheet(),
  'weight-add': () => weightForm(),
  'weight-goal': () => weightGoalForm(),
  'weight-goal-clear': () => { write(store.saveSettings({ weightGoal: null }), 'Goal removed'); closeSheet(); },
  'weight-del': async (el) => {
    if (!(await askConfirm({ title: 'Delete this weight entry?', message: 'This can’t be undone.' }))) return;
    write(store.remove('weights', el.dataset.id), 'Entry deleted');
    setTimeout(() => { if (document.querySelector('.sheet')) weightSheet(); }, 120);
  },
  'train-day': (el) => { trainDay = Number(el.dataset.day); render(); },
  'train-week': (el) => {
    trainWeeksBack = Math.max(0, trainWeeksBack + Number(el.dataset.d));
    trainDay = weekWindow(trainWeeksBack)[6].getTime();
    render();
  },
  'train-today': () => { trainWeeksBack = 0; trainDay = null; render(); },
  'section': (el) => switchSection(el.dataset.s),
  'heatmap-day': (el) => {
    jumpToDay(Number(el.dataset.day));
    setTimeout(() => document.getElementById('days-card')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' }), 50);
  },
  'pbs-all': () => allBestsSheet(),
  'pb-open': (el) => exerciseProgressSheet(el.dataset.name),
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
  'water-reminders': () => remindersSheet(),
  'reminders-shortcuts': () => remindersHelp(),
  'reminders-test': () => testNotification(),
  'reminders-off': () => disableReminders(),
  'goal-add': () => goalForm(),
  'goal-open': (el) => goalForm(el.dataset.id),
  'delete': async (el) => {
    const what = { workouts: 'workout', expenses: 'expense', goals: 'goal', exercises: 'exercise' }[el.dataset.col] ?? 'item';
    if (!(await askConfirm({ title: `Delete this ${what}?`, message: 'This can’t be undone.' }))) return;
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
// Measures the real digit widths (the old "ch" sizing was too narrow on iPhone and hid the first digit).
const measureCtx = document.createElement('canvas').getContext('2d');
const fitAmount = (input) => {
  const cs = getComputedStyle(input);
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const w = measureCtx.measureText(input.value || input.placeholder || '0').width;
  input.style.width = `${Math.ceil(w) + 14}px`; // + room for the caret
};
document.fonts?.ready.then(() => document.querySelectorAll('.amount input').forEach(fitAmount));
document.addEventListener('input', (e) => { if (e.target.matches('.amount input')) fitAmount(e.target); });
new MutationObserver(() => document.querySelectorAll('.amount input').forEach(fitAmount))
  .observe(document.getElementById('app').parentElement, { childList: true, subtree: true });

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1);
  if (tab === 'water') { go('today'); history.replaceState(null, '', '#today'); return; } // old reminder links
  if (ROUTES.includes(tab) && tab !== route) go(tab);
});

// Train → calendar button: jump to the picked date.
document.addEventListener('change', (e) => {
  if (!e.target.matches('[data-day-pick]') || !e.target.value) return;
  jumpToDay(new Date(`${e.target.value}T12:00`).getTime());
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
      <h1>Train. Spend.<br>Stay on target.</h1>
      <p class="lead">One daily score for your workouts, money and body weight.</p>
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
  history.replaceState(null, '', `${location.pathname}#today`);
  route = 'today';
  animateNext = true;
  if (ml > 0 && ml <= 3000) write(store.add('water', { at: Date.now(), ml }), `Logged ${ml} ml`);
  render();
  openWaterOnStart = true;
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
      if (openWaterOnStart) {
        openWaterOnStart = false;
        if (location.hash === '#water') history.replaceState(null, '', '#today');
      }
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
setInterval(() => { if (signedIn && route !== 'session' && route !== 'exercises' && route !== 'muscles' && route !== 'chat' && !document.querySelector('.sheet')) render(); }, 60000);

// Live session clocks: update only the timer text every second.
setInterval(() => {
  document.querySelectorAll('[data-timer]').forEach((el) => {
    const end = el.dataset.pausedAt ? Number(el.dataset.pausedAt) : Date.now();
    el.textContent = fmtClock(Math.max(0, end - Number(el.dataset.timer) - Number(el.dataset.pausedMs || 0)));
  });
}, 1000);

boot();
