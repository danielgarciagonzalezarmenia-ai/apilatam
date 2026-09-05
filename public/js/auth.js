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
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp()
    });
  }
  return { user };
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

export { auth, db, loginWithGoogle, loginWithEmail, registerWithEmail, logout, onAuthChange, getUserData, isAdmin, OWNER_EMAIL };
