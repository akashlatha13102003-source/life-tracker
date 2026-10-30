// Data layer. Uses your private Firebase database when firebase-config.js is filled in,
// otherwise a local "test mode" that saves in this browser only.
import { firebaseConfig } from './firebase-config.js';

const COLLECTIONS = ['workouts', 'expenses', 'water', 'goals'];
const DEFAULT_SETTINGS = { budget: 20000, waterGoal: 3000 };
const FIREBASE_VERSION = '10.12.2';

const emptyData = () => ({
  workouts: [], expenses: [], water: [], goals: [], settings: { ...DEFAULT_SETTINGS },
});

export async function createStore(onChange) {
  return firebaseConfig && firebaseConfig.apiKey ? cloudStore(onChange) : localStore(onChange);
}

/* ---------- Test mode: this browser only ---------- */

function localStore(onChange) {
  const KEY = 'life-tracker-local-v1';
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* storage blocked */ }
  const data = emptyData();
  for (const c of COLLECTIONS) data[c] = Array.isArray(saved?.[c]) ? saved[c] : [];
  data.settings = { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) };

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage blocked */ }
    onChange();
  };
  const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

  return {
    mode: 'local',
    data,
    user: { uid: 'local', email: 'Test mode (this browser)' },
    watchUser(cb) { cb(this.user); },
    async signIn() {}, async signUp() {}, async resetPassword() {}, async signOut() {},
    async add(col, obj) { data[col].push({ id: newId(), ...obj }); persist(); },
    async update(col, id, patch) { const it = data[col].find((x) => x.id === id); if (it) Object.assign(it, patch); persist(); },
    async remove(col, id) { data[col] = data[col].filter((x) => x.id !== id); persist(); },
    async saveSettings(patch) { Object.assign(data.settings, patch); persist(); },
  };
}

/* ---------- Cloud mode: your private Firebase database ---------- */

async function cloudStore(onChange) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-auth.js`),
    import(`${base}/firebase-firestore.js`),
  ]);

  const app = initializeApp(firebaseConfig);
  // Email/password only: skip the Google popup helper so no extra scripts load.
  const auth = A.initializeAuth(app, {
    persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence],
  });
  let db;
  try {
    // Keeps a copy on the phone, so the app works offline and syncs later.
    db = F.initializeFirestore(app, { localCache: F.persistentLocalCache() });
  } catch {
    db = F.getFirestore(app);
  }

  const data = emptyData();
  let unsubscribers = [];
  let uid = null;

  const userDoc = () => F.doc(db, 'users', uid);
  const col = (name) => F.collection(db, 'users', uid, name);

  const store = {
    mode: 'cloud',
    data,
    user: null,

    watchUser(cb) {
      A.onAuthStateChanged(auth, (user) => {
        unsubscribers.forEach((u) => u());
        unsubscribers = [];
        Object.assign(data, emptyData());
        store.user = user;
        uid = user?.uid ?? null;

        if (user) {
          for (const name of COLLECTIONS) {
            unsubscribers.push(F.onSnapshot(col(name), (snap) => {
              data[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              onChange();
            }, (err) => console.error(name, err)));
          }
          unsubscribers.push(F.onSnapshot(userDoc(), (snap) => {
            data.settings = { ...DEFAULT_SETTINGS, ...(snap.data()?.settings ?? {}) };
            onChange();
          }, (err) => console.error('settings', err)));
        }
        cb(user);
      });
    },

    signIn: (email, password) => A.signInWithEmailAndPassword(auth, email, password),
    signUp: (email, password) => A.createUserWithEmailAndPassword(auth, email, password),
    resetPassword: (email) => A.sendPasswordResetEmail(auth, email),
    signOut: () => A.signOut(auth),

    add: (name, obj) => F.addDoc(col(name), obj),
    update: (name, id, patch) => F.updateDoc(F.doc(db, 'users', uid, name, id), patch),
    remove: (name, id) => F.deleteDoc(F.doc(db, 'users', uid, name, id)),
    saveSettings: (patch) => F.setDoc(userDoc(), { settings: patch }, { merge: true }),
  };
  return store;
}
