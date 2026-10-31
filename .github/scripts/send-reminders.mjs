// Sends "drink water" push notifications to everyone who turned reminders on in the app.
// Runs every 15 minutes from GitHub Actions. Times are India Standard Time (UTC+5:30).
//
// Needs two GitHub secrets:
//   FIREBASE_SERVICE_ACCOUNT  - the JSON key file from Firebase (Project settings → Service accounts)
//   VAPID_PRIVATE_KEY         - the private half of the push key pair
import admin from 'firebase-admin';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BO3GE4rWv3A5so8eruftMELzeEkpn0yiqMxITa9gDUUPUd4_jwbYSKYZU-N2MUsTQDIh5YcUqpiKpjZd6qZyabA';
const APP_URL = 'https://akashlatha13102003-source.github.io/life-tracker/';
const IST_OFFSET_MIN = 330;
const LATE_WINDOW_MIN = 60; // GitHub's scheduler can run late; still send if within an hour of the slot.
const TEST = process.env.TEST_PUSH === 'true';

for (const name of ['FIREBASE_SERVICE_ACCOUNT', 'VAPID_PRIVATE_KEY']) {
  if (!process.env[name]) {
    console.error(`Missing secret ${name}. Add it in GitHub → Settings → Secrets and variables → Actions.`);
    process.exit(1);
  }
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();
webpush.setVapidDetails(APP_URL, VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY.trim());

// "Now" in India.
const ist = new Date(Date.now() + IST_OFFSET_MIN * 60000);
const nowMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
const dayKey = ist.toISOString().slice(0, 10);
const dayStartMs = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MIN * 60000;

const toMin = (hm) => { const [h, m] = String(hm).split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const label = (min) => {
  const h = Math.floor(min / 60); const m = min % 60;
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`;
};
const litres = (ml) => (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1);

/** The reminder slot that is due now (latest slot at or before now, within the late window). */
function dueSlot(r) {
  const start = toMin(r.start ?? '09:00');
  const end = toMin(r.end ?? '21:00');
  const every = Math.max(30, Number(r.every) || 120);
  let due = null;
  for (let t = start; t <= end; t += every) {
    if (t <= nowMin && nowMin - t < LATE_WINDOW_MIN) due = t;
  }
  return due;
}

function message(total, goal, slot, r) {
  const start = toMin(r.start ?? '09:00');
  const end = toMin(r.end ?? '21:00');
  const expected = Math.round((goal * Math.min(1, Math.max(0, (slot - start) / Math.max(1, end - start)))) / 50) * 50;
  const left = Math.max(goal - total, 0);
  if (total === 0) return { title: 'Time to drink water 💧', body: `Start your day with a glass. Goal: ${litres(goal)} L.` };
  if (expected - total >= 250) return { title: 'Time to drink water 💧', body: `You're ${expected - total} ml behind. ${litres(total)} of ${litres(goal)} L so far.` };
  return { title: 'Water break 💧', body: `${litres(total)} of ${litres(goal)} L done, ${left} ml to go. Keep it up!` };
}

async function send(subs, payload) {
  const alive = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload), { TTL: 3600, urgency: 'normal' });
      alive.push(sub);
      console.log(`  sent to ${sub.device ?? 'device'}`);
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.log(`  removed expired ${sub.device ?? 'device'} (${err.statusCode})`);
      } else {
        alive.push(sub);
        console.log(`  failed for ${sub.device ?? 'device'}: ${err.statusCode ?? ''} ${err.body ?? err.message}`);
      }
    }
  }
  return alive;
}

const users = await db.collection('users').get();
console.log(`IST ${dayKey} ${label(nowMin)} · ${users.size} user(s)${TEST ? ' · TEST MODE' : ''}`);

for (const doc of users.docs) {
  const settings = doc.data().settings ?? {};
  const r = settings.reminders ?? {};
  const subs = Array.isArray(r.subs) ? r.subs : [];
  if (!r.enabled || !subs.length) { console.log('- reminders off'); continue; }

  if (TEST) {
    const alive = await send(subs, { title: 'Life Tracker test 💧', body: 'Push notifications are working. Reminders will arrive on schedule.', tag: 'water-test' });
    if (alive.length !== subs.length) await doc.ref.set({ settings: { reminders: { subs: alive } } }, { merge: true });
    continue;
  }

  const slot = dueSlot(r);
  if (slot === null) { console.log('- no reminder due'); continue; }
  const slotKey = `${dayKey} ${slot}`;
  if (r.lastSent === slotKey) { console.log(`- ${label(slot)} already sent`); continue; }

  const goal = Number(settings.waterGoal) || 3000;
  const water = await doc.ref.collection('water').where('at', '>=', dayStartMs).get();
  const total = water.docs.reduce((s, d) => s + (Number(d.data().ml) || 0), 0);

  if (total >= goal) {
    console.log(`- ${label(slot)} skipped: goal reached (${total} ml)`);
    await doc.ref.set({ settings: { reminders: { lastSent: slotKey } } }, { merge: true });
    continue;
  }

  console.log(`- ${label(slot)} reminder (${total}/${goal} ml)`);
  const alive = await send(subs, { ...message(total, goal, slot, r), tag: 'water', url: './#water' });
  await doc.ref.set({ settings: { reminders: { lastSent: slotKey, subs: alive, enabled: alive.length > 0 } } }, { merge: true });
}

process.exit(0);
