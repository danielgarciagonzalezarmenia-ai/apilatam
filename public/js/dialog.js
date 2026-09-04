let dialogRoot = null;

function injectStyle() {
  if (document.getElementById('dialog-style')) return;
  const style = document.createElement('style');
  style.id = 'dialog-style';
  style.textContent = `
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(120% 120% at 50% 0%, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.92) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 24px;
  opacity: 0;
  transition: opacity 0.22s ease;
}
.dialog-overlay.active {
  display: flex;
  opacity: 1;
}
.dialog {
  position: relative;
  background: linear-gradient(180deg, var(--surface, #18181b) 0%, var(--bg-card, #0a0a0a) 100%);
  border: 1px solid var(--border-strong, var(--border, #27272a));
  border-radius: var(--radius-xl, 24px);
  padding: 40px 36px 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.7);
  transform: translateY(16px) scale(0.96);
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease;
  opacity: 0;
  text-align: center;
}
.dialog-overlay.active .dialog {
  transform: translateY(0) scale(1);
  opacity: 1;
}
.dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--accent, #00A3FF), transparent);
  opacity: 0.7;
}
.dialog-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 8px rgba(0, 0, 0, 0.18);
}
.dialog-icon.confirm {
  background: rgba(0, 163, 255, 0.12);
  border: 1px solid rgba(0, 163, 255, 0.35);
  color: var(--accent, #00A3FF);
}
.dialog-icon.danger {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #ef4444;
}
.dialog-icon.error {
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #ef4444;
}
.dialog-icon.info {
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #22c55e;
}
.dialog-icon svg {
  width: 30px;
  height: 30px;
}
.dialog h3 {
  font-family: var(--font-display, 'Poppins');
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary, #fafafa);
  margin-bottom: 12px;
}
.dialog p {
  font-size: 14px;
  line-height: 1.65;
  color: var(--text-secondary, #a1a1aa);
  margin-bottom: 30px;
  white-space: pre-line;
}
.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.dialog-actions .btn {
  min-width: 128px;
}
`;
  document.head.appendChild(style);
}

function ensureRoot() {
  if (dialogRoot && document.body.contains(dialogRoot)) return dialogRoot;
  dialogRoot = document.createElement('div');
  dialogRoot.id = 'dialog-root';
  document.body.appendChild(dialogRoot);
  return dialogRoot;
}

function buildIcons() {
  return {
    confirm:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
    danger:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
  };
}

function openDialog({ title, message, icon, iconClass, actions }) {
  injectStyle();
  const root = ensureRoot();
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-icon ${iconClass}">${icon}</div>
    <h3></h3>
    <p></p>
    <div class="dialog-actions"></div>
  `;
  dialog.querySelector('h3').textContent = title;
  dialog.querySelector('p').textContent = message;

  const actionsWrap = dialog.querySelector('.dialog-actions');
  actions.forEach(({ label, className, onClick }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ' + className;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    actionsWrap.appendChild(btn);
  });

  overlay.appendChild(dialog);
  root.appendChild(overlay);

  function close() {
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.remove();
      if (root && !root.children.length) {
        root.remove();
        dialogRoot = null;
      }
    }, 220);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      for (const a of actions) {
        if (a.__cancel) { a.__cancel(); break; }
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      for (const a of actions) {
        if (a.__cancel) { a.__cancel(); break; }
      }
    }
  }, { once: true });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('active'));
  });

  return { overlay, dialog, close };
}

export function showConfirm({ title = 'Confirmar', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = {}) {
  return new Promise((resolve) => {
    const container = openDialog({
      title,
      message,
      icon: danger ? buildIcons().danger : buildIcons().confirm,
      iconClass: danger ? 'danger' : 'confirm',
      actions: []
    });
    const actionsWrap = container.dialog.querySelector('.dialog-actions');
    const doConfirm = () => {
      container.close();
      resolve(true);
    };
    const doCancel = () => {
      container.close();
      resolve(false);
    };
    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', doConfirm);
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener('click', doCancel);
    actionsWrap.appendChild(cancelBtn);
    actionsWrap.appendChild(confirmBtn);
    const escHandler = (e) => {
      if (e.key === 'Escape') doCancel();
    };
    document.addEventListener('keydown', escHandler, { once: true });
    container.overlay.addEventListener('click', (e) => {
      if (e.target === container.overlay) doCancel();
    });
  });
}

export function showAlert({ title = 'Aviso', message = '', okText = 'Entendido', variant = 'info' } = {}) {
  return new Promise((resolve) => {
    const iconClass = variant === 'error' ? 'error' : variant === 'success' ? 'info' : 'info';
    const container = openDialog({
      title,
      message,
      icon: iconClass === 'error' ? buildIcons().error : buildIcons().info,
      iconClass,
      actions: []
    });
    const actionsWrap = container.dialog.querySelector('.dialog-actions');
    const doOk = () => {
      container.close();
      resolve();
    };
    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'btn btn-primary';
    okBtn.textContent = okText;
    okBtn.addEventListener('click', doOk);
    actionsWrap.appendChild(okBtn);
    const escHandler = (e) => {
      if (e.key === 'Escape') doOk();
    };
    document.addEventListener('keydown', escHandler, { once: true });
    container.overlay.addEventListener('click', (e) => {
      if (e.target === container.overlay) doOk();
    });
  });
}