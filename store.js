// Data layer. Uses your private Firebase database when firebase-config.js is filled in,
// otherwise a local "test mode" that saves in this browser only.
import { firebaseConfig } from './firebase-config.js';

const COLLECTIONS = ['workouts', 'expenses', 'water', 'goals', 'weights', 'routines', 'exercises', 'checkins', 'whoop'];
// What the owner can see of a member (Money stays private; the database rules enforce this too).
const MEMBER_COLLECTIONS = COLLECTIONS.filter((c) => c !== 'expenses');
const DEFAULT_SETTINGS = { budget: 20000, waterGoal: 3000, trainGoal: 45 };
const FIREBASE_VERSION = '10.12.2';

const emptyData = () => ({
  workouts: [], expenses: [], water: [], goals: [], weights: [], routines: [], exercises: [], checkins: [], whoop: [], settings: { ...DEFAULT_SETTINGS },
});

// A preview running on this computer (localhost) always uses test mode,
// so trying out changes never touches the real database.
const isLocalPreview = ['localhost', '127.0.0.1'].includes(location.hostname);

export async function createStore(onChange) {
  return firebaseConfig && firebaseConfig.apiKey && !isLocalPreview ? cloudStore(onChange) : localStore(onChange);
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
    async idToken() { return 'preview-token'; },
    async add(col, obj) { data[col].push({ id: newId(), ...obj }); persist(); },
    async set(col, id, obj) { data[col] = data[col].filter((x) => x.id !== id); data[col].push({ id, ...obj }); persist(); },
    async update(col, id, patch) { const it = data[col].find((x) => x.id === id); if (it) Object.assign(it, patch); persist(); },
    async remove(col, id) { data[col] = data[col].filter((x) => x.id !== id); persist(); },
    async saveSettings(patch) { Object.assign(data.settings, patch); persist(); },
    // Members console in the preview: sample members saved under lt-demo-members (never real people).
    async listMembers() {
      const demo = demoMembers();
      if (!demo.length) throw Object.assign(new Error('Not the owner'), { code: 'permission-denied' });
      return demo.map(({ uid, email, lastSeen }) => ({ uid, email, lastSeen }));
    },
    async loadMember(id) {
      const m = demoMembers().find((x) => x.uid === id);
      const out = emptyData();
      for (const c of MEMBER_COLLECTIONS) out[c] = Array.isArray(m?.data?.[c]) ? m.data[c] : [];
      out.settings = { ...DEFAULT_SETTINGS, ...(m?.data?.settings ?? {}) };
      return out;
    },
  };
}

function demoMembers() {
  try { const d = JSON.parse(localStorage.getItem('lt-demo-members')); return Array.isArray(d) ? d : []; } catch { return []; }
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
          // Lets the owner's Members console list this account and show when it was last used.
          F.setDoc(userDoc(), { profile: { email: user.email ?? '', lastSeen: Date.now() } }, { merge: true }).catch(() => {});
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
    // Proves to the WHOOP helper which member is asking.
    idToken: () => auth.currentUser?.getIdToken() ?? Promise.reject(new Error('Not signed in')),

    add: (name, obj) => F.addDoc(col(name), obj),
    // Save under an id chosen by the app (works offline, so the id is known straight away).
    set: (name, id, obj) => F.setDoc(F.doc(db, 'users', uid, name, id), obj),
    update: (name, id, patch) => F.updateDoc(F.doc(db, 'users', uid, name, id), patch),
    remove: (name, id) => F.deleteDoc(F.doc(db, 'users', uid, name, id)),
    saveSettings: (patch) => F.setDoc(userDoc(), { settings: patch }, { merge: true }),

    // Members console (owner only). The database rules refuse these for everyone else.
    async listMembers() {
      const snap = await F.getDocs(F.collection(db, 'users'));
      return snap.docs.filter((d) => d.id !== uid).map((d) => ({
        uid: d.id, email: d.data().profile?.email ?? '', lastSeen: d.data().profile?.lastSeen ?? 0,
      }));
    },
    async loadMember(id) {
      const out = emptyData();
      await Promise.all(MEMBER_COLLECTIONS.map(async (c) => {
        const snap = await F.getDocs(F.collection(db, 'users', id, c));
        out[c] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }));
      const u = await F.getDoc(F.doc(db, 'users', id));
      out.settings = { ...DEFAULT_SETTINGS, ...(u.data()?.settings ?? {}) };
      return out;
    },
  };
  return store;
}
