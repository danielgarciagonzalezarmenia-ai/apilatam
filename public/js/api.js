import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit as fbLimit } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FREE_CHANNEL_LIMIT = 5;
const FREE_MOVIE_LIMIT = 10;

function validateApiKey(apiKey) {
  return apiKey && typeof apiKey === 'string' && apiKey.startsWith('aplat_');
}

async function getUserByApiKey(apiKey) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('apiKey', '==', apiKey));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function getChannels(apiKey, category = null) {
  if (!validateApiKey(apiKey)) {
    return { error: 'API key invalida', status: 403 };
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    return { error: 'API key no encontrada', status: 403 };
  }

  let q = query(collection(db, 'channels'), where('status', '==', 'online'));
  if (category) {
    q = query(q, where('category', '==', category));
  }

  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    imageUrl: d.data().imageUrl,
    m3u8Url: d.data().m3u8Url,
    category: d.data().category
  }));

  if (user.plan === 'free') {
    items = items.slice(0, FREE_CHANNEL_LIMIT);
  }

  return {
    channels: items,
    total: items.length,
    plan: user.plan
  };
}

async function getChannelById(apiKey, id) {
  if (!validateApiKey(apiKey)) {
    return { error: 'API key invalida', status: 403 };
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    return { error: 'API key no encontrada', status: 403 };
  }

  const docSnap = await getDoc(doc(db, 'channels', id));
  if (!docSnap.exists()) {
    return { error: 'Canal no encontrado', status: 404 };
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    imageUrl: data.imageUrl,
    m3u8Url: data.m3u8Url,
    category: data.category
  };
}

async function getMovies(apiKey, category = null) {
  if (!validateApiKey(apiKey)) {
    return { error: 'API key invalida', status: 403 };
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    return { error: 'API key no encontrada', status: 403 };
  }

  let q = query(collection(db, 'movies'), where('status', '==', 'online'));
  if (category) {
    q = query(q, where('category', '==', category));
  }

  const snap = await getDocs(q);
  let items = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    imageUrl: d.data().imageUrl,
    m3u8Url: d.data().m3u8Url,
    category: d.data().category
  }));

  if (user.plan === 'free') {
    items = items.slice(0, FREE_MOVIE_LIMIT);
  }

  return {
    movies: items,
    total: items.length,
    plan: user.plan
  };
}

async function getMovieById(apiKey, id) {
  if (!validateApiKey(apiKey)) {
    return { error: 'API key invalida', status: 403 };
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    return { error: 'API key no encontrada', status: 403 };
  }

  const docSnap = await getDoc(doc(db, 'movies', id));
  if (!docSnap.exists()) {
    return { error: 'Pelicula no encontrada', status: 404 };
  }

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    imageUrl: data.imageUrl,
    m3u8Url: data.m3u8Url,
    category: data.category
  };
}

async function getCategories(apiKey) {
  if (!validateApiKey(apiKey)) {
    return { error: 'API key invalida', status: 403 };
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    return { error: 'API key no encontrada', status: 403 };
  }

  const snap = await getDocs(collection(db, 'categories'));
  const items = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    type: d.data().type
  }));

  return { categories: items, total: items.length };
}

export { getChannels, getChannelById, getMovies, getMovieById, getCategories, validateApiKey };
