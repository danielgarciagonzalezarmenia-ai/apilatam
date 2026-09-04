import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const apiKey = generateApiKey();
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        plan: 'free',
        apiKey: apiKey,
        requestsToday: 0,
        lastRequestDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      return { user, isNew: true, apiKey };
    }
    return { user, isNew: false, apiKey: userSnap.data().apiKey };
  } catch (error) {
    console.error('Login error:', error);
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
  await updateDoc(userRef, { apiKey: newKey });
  return newKey;
}

export { auth, db, loginWithGoogle, logout, onAuthChange, getUserData, isAdmin, regenerateApiKey };
