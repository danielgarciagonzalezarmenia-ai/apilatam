import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js?v=3';
import { showToast, toggleMobileMenu, formatDate, escapeHtml, debounce } from './app.js?v=3';

window.toggleMobileMenu = toggleMobileMenu;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let channels = [];
let movies = [];
let categories = [];
let currentTab = 'channels';

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.style.display = 'none');
    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById(`tab-${target}`).style.display = 'block';
    currentTab = target;
  });
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const adminRef = doc(db, 'admin', user.uid);
  const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
  const adminSnap = await getDoc(adminRef);
  if (!adminSnap.exists()) {
    window.location.href = 'dashboard.html';
    return;
  }
  await loadAll();
});

async function loadAll() {
  await Promise.all([loadChannels(), loadMovies(), loadCategories()]);
}

async function loadChannels() {
  const snap = await getDocs(query(collection(db, 'channels'), orderBy('createdAt', 'desc')));
  channels = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderChannels();
  updateCategoryFilters();
}

async function loadMovies() {
  const snap = await getDocs(query(collection(db, 'movies'), orderBy('createdAt', 'desc')));
  movies = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderMovies();
  updateCategoryFilters();
}

async function loadCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  categories = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCategories();
  updateCategoryFilters();
  updateModalCategories();
}

function renderChannels() {
  const tbody = document.getElementById('channels-tbody');
  const search = document.getElementById('search-channels').value.toLowerCase();
  const catFilter = document.getElementById('filter-category-channels').value;

  let filtered = channels.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search);
    const matchCat = !catFilter || c.category === catFilter;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><h3>Sin resultados</h3><p>No se encontraron canales.</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(ch => `
    <tr>
      <td><img src="${escapeHtml(ch.imageUrl || '')}" class="thumb" alt="" onerror="this.style.display='none'"></td>
      <td style="font-weight: 600;">${escapeHtml(ch.name)}</td>
      <td><span class="badge badge-info">${escapeHtml(ch.category || '-')}</span></td>
      <td><span class="badge ${ch.status === 'online' ? 'badge-success' : ch.status === 'offline' ? 'badge-danger' : 'badge-warning'}">${ch.status || 'verificar'}</span></td>
      <td style="font-size: 13px; color: var(--color-text-muted);">${formatDate(ch.createdAt)}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button onclick="editItem('channel','${ch.id}')" class="btn btn-secondary btn-sm" style="padding:6px 10px; font-size:12px;">Editar</button>
          <button onclick="deleteItem('channels','${ch.id}')" class="btn btn-danger btn-sm" style="padding:6px 10px; font-size:12px;">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderMovies() {
  const tbody = document.getElementById('movies-tbody');
  const search = document.getElementById('search-movies').value.toLowerCase();
  const catFilter = document.getElementById('filter-category-movies').value;

  let filtered = movies.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search);
    const matchCat = !catFilter || m.category === catFilter;
    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><h3>Sin resultados</h3><p>No se encontraron peliculas.</p></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(mv => `
    <tr>
      <td><img src="${escapeHtml(mv.imageUrl || '')}" class="thumb" alt="" onerror="this.style.display='none'"></td>
      <td style="font-weight: 600;">${escapeHtml(mv.name)}</td>
      <td><span class="badge badge-info">${escapeHtml(mv.category || '-')}</span></td>
      <td><span class="badge ${mv.status === 'online' ? 'badge-success' : mv.status === 'offline' ? 'badge-danger' : 'badge-warning'}">${mv.status || 'verificar'}</span></td>
      <td style="font-size: 13px; color: var(--color-text-muted);">${formatDate(mv.createdAt)}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button onclick="editItem('movie','${mv.id}')" class="btn btn-secondary btn-sm" style="padding:6px 10px; font-size:12px;">Editar</button>
          <button onclick="deleteItem('movies','${mv.id}')" class="btn btn-danger btn-sm" style="padding:6px 10px; font-size:12px;">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderCategories() {
  const tbody = document.getElementById('categories-tbody');
  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state"><h3>Sin categorias</h3><p>Crea categorias para organizar tu contenido.</p></td></tr>';
    return;
  }
  tbody.innerHTML = categories.map(cat => `
    <tr>
      <td style="font-weight: 600;">${escapeHtml(cat.name)}</td>
      <td><span class="badge badge-info">${cat.type === 'channel' ? 'Canal' : 'Pelicula'}</span></td>
      <td>
        <button onclick="deleteCategory('${cat.id}')" class="btn btn-danger btn-sm" style="padding:6px 10px; font-size:12px;">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function updateCategoryFilters() {
  const channelCategories = categories.filter(c => c.type === 'channel');
  const movieCategories = categories.filter(c => c.type === 'movie');

  const channelSelect = document.getElementById('filter-category-channels');
  const currentChannelVal = channelSelect.value;
  channelSelect.innerHTML = '<option value="">Todas las categorias</option>' +
    channelCategories.map(c => `<option value="${escapeHtml(c.name)}" ${c.name === currentChannelVal ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');

  const movieSelect = document.getElementById('filter-category-movies');
  const currentMovieVal = movieSelect.value;
  movieSelect.innerHTML = '<option value="">Todas las categorias</option>' +
    movieCategories.map(c => `<option value="${escapeHtml(c.name)}" ${c.name === currentMovieVal ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
}

function updateModalCategories() {
  const modalSelect = document.getElementById('modal-category');
  const type = document.getElementById('modal-item-type').value || 'channel';
  const filtered = categories.filter(c => c.type === type);
  modalSelect.innerHTML = '<option value="">Sin categoria</option>' +
    filtered.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
}

function openModal(type, item = null) {
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('modal-form');

  document.getElementById('modal-item-type').value = type;
  updateModalCategories();

  if (item) {
    title.textContent = type === 'channel' ? 'Editar Canal' : 'Editar Pelicula';
    document.getElementById('modal-name').value = item.name || '';
    document.getElementById('modal-image').value = item.imageUrl || '';
    document.getElementById('modal-m3u8').value = item.m3u8Url || '';
    document.getElementById('modal-category').value = item.category || '';
    document.getElementById('modal-item-id').value = item.id;
  } else {
    title.textContent = type === 'channel' ? 'Nuevo Canal' : 'Nueva Pelicula';
    form.reset();
    document.getElementById('modal-item-id').value = '';
  }

  overlay.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('modal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('modal-item-type').value;
  const collectionName = type === 'channel' ? 'channels' : 'movies';
  const id = document.getElementById('modal-item-id').value;

  const data = {
    name: document.getElementById('modal-name').value.trim(),
    imageUrl: document.getElementById('modal-image').value.trim(),
    m3u8Url: document.getElementById('modal-m3u8').value.trim(),
    category: document.getElementById('modal-category').value,
    status: 'pending'
  };

  try {
    if (id) {
      await updateDoc(doc(db, collectionName, id), data);
      showToast(`${type === 'channel' ? 'Canal' : 'Pelicula'} actualizado`, 'success');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, collectionName), data);
      showToast(`${type === 'channel' ? 'Canal' : 'Pelicula'} creado`, 'success');
    }
    closeModal();
    if (type === 'channel') await loadChannels();
    else await loadMovies();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
});

window.editItem = async (type, id) => {
  const collectionName = type === 'channel' ? 'channels' : 'movies';
  const items = type === 'channel' ? channels : movies;
  const item = items.find(i => i.id === id);
  if (item) openModal(type, item);
};

window.deleteItem = async (collectionName, id) => {
  if (!confirm('Eliminar este elemento?')) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
    showToast('Eliminado', 'success');
    if (collectionName === 'channels') await loadChannels();
    else if (collectionName === 'movies') await loadMovies();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
};

window.deleteCategory = async (id) => {
  if (!confirm('Eliminar esta categoria?')) return;
  try {
    await deleteDoc(doc(db, 'categories', id));
    showToast('Categoria eliminada', 'success');
    await loadCategories();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
};

document.getElementById('add-channel-btn').addEventListener('click', () => openModal('channel'));
document.getElementById('add-movie-btn').addEventListener('click', () => openModal('movie'));

document.getElementById('add-category-btn').addEventListener('click', async () => {
  const name = document.getElementById('new-category-name').value.trim();
  const type = document.getElementById('new-category-type').value;
  if (!name) return showToast('Ingresa un nombre', 'error');

  try {
    await addDoc(collection(db, 'categories'), { name, type, createdAt: serverTimestamp() });
    document.getElementById('new-category-name').value = '';
    showToast('Categoria creada', 'success');
    await loadCategories();
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
});

async function checkM3U8(collectionName) {
  const items = collectionName === 'channels' ? channels : movies;
  if (items.length === 0) return showToast('No hay elementos para verificar', 'info');

  showToast('Verificando streams...', 'info');

  for (const item of items) {
    if (!item.m3u8Url) {
      await updateDoc(doc(db, collectionName, item.id), { status: 'offline' });
      continue;
    }
    try {
      await fetch(item.m3u8Url, { method: 'HEAD', mode: 'no-cors' });
      await updateDoc(doc(db, collectionName, item.id), { status: 'online' });
    } catch {
      await updateDoc(doc(db, collectionName, item.id), { status: 'offline' });
    }
  }

  showToast('Verificacion completada', 'success');
  if (collectionName === 'channels') await loadChannels();
  else await loadMovies();
}

document.getElementById('check-channels-btn').addEventListener('click', () => checkM3U8('channels'));
document.getElementById('check-movies-btn').addEventListener('click', () => checkM3U8('movies'));

const debouncedChannelSearch = debounce(() => renderChannels());
const debouncedMovieSearch = debounce(() => renderMovies());

document.getElementById('search-channels').addEventListener('input', debouncedChannelSearch);
document.getElementById('search-movies').addEventListener('input', debouncedMovieSearch);
document.getElementById('filter-category-channels').addEventListener('change', renderChannels);
document.getElementById('filter-category-movies').addEventListener('change', renderMovies);
