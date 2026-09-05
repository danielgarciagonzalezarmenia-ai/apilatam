import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js?v=1';

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error('Firebase init error:', e);
}

export { app, auth, db };

export async function ensureUserDoc(user) {
  if (!user) return null;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { ...snap.data(), id: user.uid };
  const data = {
    email: user.email || '',
    name: user.displayName || '',
    photo: user.photoURL || '',
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return { ...data, id: user.uid };
}

export async function getUser(userId) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  return snap.exists() ? { ...snap.data(), id: userId } : null;
}

export function signInGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(fn) {
  return onAuthStateChanged(auth, fn);
}