import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db, logout } from './auth.js?v=2';
import { escapeHtml, showToast } from './util.js?v=1';

export function setupProfile(root, user, opts = {}) {
  if (!root || !user) return;

  root.innerHTML = `
    <button id="pp-btn" class="profile-btn" aria-label="Perfil"></button>
    <div id="pp-drop" class="profile-drop hidden">
      <div class="p-name" id="pp-name"></div>
      <div class="p-email" id="pp-email"></div>
      <button class="btn btn-secondary btn-sm" id="pp-edit">Editar perfil</button>
      <button class="btn btn-danger btn-sm" id="pp-logout">Cerrar sesion</button>
    </div>`;

  const avatarBtn = root.querySelector('#pp-btn');
  const nameEl = root.querySelector('#pp-name');
  const emailEl = root.querySelector('#pp-email');

  const renderAvatar = () => {
    if (user.photoURL) {
      avatarBtn.innerHTML = `<img class="profile-avatar" src="${escapeHtml(user.photoURL)}" alt="">`;
    } else {
      const letter = escapeHtml((user.displayName || user.email || 'U').charAt(0).toUpperCase());
      avatarBtn.innerHTML = `<span class="profile-avatar pp-letter">${letter}</span>`;
    }
  };
  const render = () => {
    renderAvatar();
    nameEl.textContent = user.displayName || user.email || 'Usuario';
    emailEl.textContent = user.email || '';
  };
  render();

  avatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    root.querySelector('#pp-drop').classList.toggle('hidden');
  });
  document.addEventListener('click', () => root.querySelector('#pp-drop').classList.add('hidden'));

  root.querySelector('#pp-logout').addEventListener('click', (e) => {
    e.stopPropagation();
    logout();
  });

  root.querySelector('#pp-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditor();
  });

  function openEditor() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <h2>Mi perfil</h2>
        <div class="form-group"><label>Nombre</label><input class="input" id="ppf-name" value="${escapeHtml(user.displayName || '')}" maxlength="40"></div>
        <div class="form-group"><label>Foto de perfil (URL)</label><input class="input" id="ppf-photo" value="${escapeHtml(user.photoURL || '')}" placeholder="https://ejemplo.com/foto.jpg"></div>
        <div class="form-group"><label>Correo</label><input class="input" id="ppf-email" value="${escapeHtml(user.email || '')}" disabled style="opacity:0.6;"></div>
        <div class="form-actions">
          <button class="btn btn-secondary" id="ppf-cancel">Cancelar</button>
          <button class="btn btn-primary" id="ppf-save">Guardar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
    overlay.querySelector('#ppf-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#ppf-save').addEventListener('click', async () => {
      const name = overlay.querySelector('#ppf-name').value.trim();
      const photo = overlay.querySelector('#ppf-photo').value.trim();
      const saveBtn = overlay.querySelector('#ppf-save');
      saveBtn.disabled = true;
      try {
        await updateProfile(user, { displayName: name || null, photoURL: photo || null });
        await updateDoc(doc(db, 'users', user.uid), { name: name || '', photo: photo || '' });
        user.displayName = name || '';
        user.photoURL = photo || '';
        render();
        overlay.remove();
        if (opts.onSaved) opts.onSaved();
      } catch (err) {
        console.error(err);
        saveBtn.disabled = false;
        showToast('No se pudo guardar el perfil', 'error');
      }
    });
  }
}