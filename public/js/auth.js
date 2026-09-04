import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const OWNER_EMAIL = 'danigar222009@gmail.com';

async function ensureUserDoc(user) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    const apiKey = generateApiKey();
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || null,
      plan: 'free',
      apiKey: apiKey,
      requestsToday: 0,
      lastRequestDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
    return { user, isNew: true, apiKey };
  }
  return { user, isNew: false, apiKey: userSnap.data().apiKey };
}

async function ensureOwnerAdmin(user) {
  if (!user || !user.email || user.email.toLowerCase() !== OWNER_EMAIL.toLowerCase()) return;
  const adminRef = doc(db, 'admin', user.uid);
  const adminSnap = await getDoc(adminRef);
  if (!adminSnap.exists()) {
    await setDoc(adminRef, { roles: ['admin'], email: user.email });
  }
}

async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const payload = await ensureUserDoc(result.user);
    await ensureOwnerAdmin(result.user);
    return payload;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const payload = await ensureUserDoc(result.user);
    await ensureOwnerAdmin(result.user);
    return payload;
  } catch (error) {
    console.error('Login email error:', error);
    throw error;
  }
}

async function registerWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const payload = await ensureUserDoc(result.user);
    await ensureOwnerAdmin(result.user);
    return payload;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

async function logout() {
  await signOut(auth);
  window.location.href = 'login.html';
}

function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'aplat_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

async function getUserData(uid) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) return { id: userSnap.id, ...userSnap.data() };
  return null;
}

async function isAdmin(uid) {
  const adminRef = doc(db, 'admin', uid);
  const adminSnap = await getDoc(adminRef);
  return adminSnap.exists();
}

async function regenerateApiKey(uid) {
  const userRef = doc(db, 'users', uid);
  const newKey = generateApiKey();
  await setDoc(userRef, { apiKey: newKey }, { merge: true });
  return newKey;
}

async function ensureUserApiKey(uid, existing) {
  if (existing) return existing;
  try {
    return await regenerateApiKey(uid);
  } catch (error) {
    console.error('No se pudo generar la API key:', error);
    return null;
  }
}

export { auth, db, loginWithGoogle, loginWithEmail, registerWithEmail, logout, onAuthChange, getUserData, isAdmin, regenerateApiKey, ensureUserApiKey, OWNER_EMAIL };
