/* All saving lives here, so app.js only deals in plain objects.

   Firestore layout (each person only ever sees their own):
     users/{uid}                 prefs: { colors, look, ruled }
     users/{uid}/notes/{noteId}  { title, text, cardId, strokes, h, updated }

   Pencil drawings are saved as the strokes themselves (points as a short
   string), not as pictures -- small, sharp at any size, and no Storage needed.

   If firebase-config.js still says PASTE, the app runs in "sample mode":
   everything is kept in this browser only. */
const Store = (() => {
  const configured = typeof firebaseConfig !== 'undefined' && !/PASTE/.test(firebaseConfig.apiKey);
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  if (!configured) {
    // ---- Sample mode: localStorage ----
    const KEY = 'nrp-sample-notes';
    const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
    const listeners = new Set();
    const emit = () => { const all = read(); listeners.forEach(cb => cb(Object.entries(all).map(([id, n]) => ({ id, ...n })))); };
    return {
      configured: false,
      onUser(cb) { cb({ email: 'Sample mode (this device only)', sample: true }); return () => {}; },
      async signIn() {}, async signUp() {}, async signOut() {}, async reset() {},
      watchNotes(cb) { listeners.add(cb); emit(); return () => listeners.delete(cb); },
      async saveNote(note) {
        const all = read(); const id = note.id || newId();
        const { id: _, ...data } = note;
        all[id] = { ...data, updated: Date.now() };
        localStorage.setItem(KEY, JSON.stringify(all)); emit(); return id;
      },
      async deleteNote(id) { const all = read(); delete all[id]; localStorage.setItem(KEY, JSON.stringify(all)); emit(); },
      async getPrefs() { return null; },
      async savePrefs() {},
    };
  }

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  db.enablePersistence({ synchronizeTabs: true }).catch(err => console.warn('No offline cache:', err.code));

  // Offline, a save lands on this device at once and syncs later. Don't wait for it.
  const write = p => {
    if (navigator.onLine) return p;
    p.catch(e => console.error('Offline save failed to sync', e));
    return Promise.resolve();
  };
  const me = () => auth.currentUser;
  const userDoc = () => db.collection('users').doc(me().uid);
  const notesCol = () => userDoc().collection('notes');

  const friendly = err => {
    const map = {
      'auth/invalid-credential': 'That email or password doesn’t match.',
      'auth/wrong-password': 'That email or password doesn’t match.',
      'auth/user-not-found': 'No account with that email yet. Tap “Create account”.',
      'auth/email-already-in-use': 'There’s already an account with that email. Try signing in.',
      'auth/weak-password': 'Password needs at least 6 characters.',
      'auth/invalid-email': 'That email doesn’t look right.',
      'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
      'auth/network-request-failed': 'No internet connection.',
    };
    return new Error(map[err.code] || err.message);
  };
  const wrap = fn => (...a) => fn(...a).catch(e => { throw friendly(e); });

  return {
    configured: true,
    onUser: cb => auth.onAuthStateChanged(cb),
    signIn: wrap((email, pw) => auth.signInWithEmailAndPassword(email, pw)),
    signUp: wrap((email, pw) => auth.createUserWithEmailAndPassword(email, pw)),
    signOut: () => auth.signOut(),
    reset: wrap(email => auth.sendPasswordResetEmail(email)),

    watchNotes(cb) {
      if (!me()) { cb([]); return () => {}; }
      return notesCol().onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        err => console.error('notes', err));
    },
    async saveNote(note) {
      const { id, ...data } = note;
      const ref = id ? notesCol().doc(id) : notesCol().doc();
      await write(ref.set({ ...data, updated: Date.now() }));
      return ref.id;
    },
    deleteNote: id => write(notesCol().doc(id).delete()),

    async getPrefs() {
      if (!me()) return null;
      try { const s = await userDoc().get(); return s.exists ? s.data() : null; } catch { return null; }
    },
    savePrefs: prefs => me() ? write(userDoc().set(prefs, { merge: true })) : Promise.resolve(),
  };
})();
