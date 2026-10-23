/**
 * DevStore Accessible UI Notifications and Dialogs
 * Replaces blocking browser alert() and prompt() flows with accessible toast notifications
 * and keyboard-navigable modal dialogs.
 */

let activeToastTimeout = null;

export class NotificationSystem {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  _ensureContainer() {
    if (typeof document === 'undefined') return;
    this.container = document.getElementById('store-notifications');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'store-notifications';
      this.container.className = 'store-notifications-container';
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', 'DevStore Notifications');
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  }

  /**
   * Displays an accessible toast notification.
   * @param {string} message - Notification text
   * @param {'info'|'success'|'warning'|'error'} type - Style semantic type
   * @param {number} duration - Auto-dismiss timeout in ms
   */
  notify(message, type = 'info', duration = 4500) {
    this._ensureContainer();
    if (!this.container) return;

    const toast = document.createElement('div');
    toast.className = `store-toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#01875f" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#d93025" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f29900" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#1a73e8" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${this._escape(message)}</div>
      <button class="toast-close-btn" aria-label="Dismiss notification">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.classList.add('dismissing');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  /**
   * Displays an accessible modal dialog.
   */
  showDialog({ title, message, bodyHtml, confirmText = 'Understood', cancelText = null, onConfirm, onCancel }) {
    const previousActive = document.activeElement;
    let modalEl = document.getElementById('info-modal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'info-modal';
      modalEl.className = 'modal-backdrop';
      modalEl.setAttribute('role', 'dialog');
      modalEl.setAttribute('aria-modal', 'true');
      document.body.appendChild(modalEl);
    }

    const content = bodyHtml || `<p class="info-dialog-text">${this._escape(message)}</p>`;

    modalEl.innerHTML = `
      <div class="modal-dialog info-modal-dialog" role="document">
        <div class="modal-header">
          <h3 class="modal-title">${this._escape(title)}</h3>
          <button class="modal-close-btn" id="info-modal-close-x" aria-label="Close dialog">&times;</button>
        </div>
        <div class="modal-body" style="padding: 16px 0;">
          ${content}
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
          ${cancelText ? `<button class="detail-share-btn" id="info-modal-cancel-btn">${this._escape(cancelText)}</button>` : ''}
          <button class="detail-install-btn" id="info-modal-confirm-btn">${this._escape(confirmText)}</button>
        </div>
      </div>
    `;

    modalEl.classList.add('open');

    const close = () => {
      modalEl.classList.remove('open');
      document.removeEventListener('keydown', keyHandler);
      if (previousActive && typeof previousActive.focus === 'function') {
        previousActive.focus();
      }
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCancel) onCancel();
        close();
      }
    };

    document.addEventListener('keydown', keyHandler);

    document.getElementById('info-modal-close-x')?.addEventListener('click', () => {
      if (onCancel) onCancel();
      close();
    });

    if (cancelText) {
      document.getElementById('info-modal-cancel-btn')?.addEventListener('click', () => {
        if (onCancel) onCancel();
        close();
      });
    }

    document.getElementById('info-modal-confirm-btn')?.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close();
    });

    const confirmBtn = document.getElementById('info-modal-confirm-btn');
    setTimeout(() => confirmBtn?.focus(), 50);
  }

  _escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const notifications = new NotificationSystem();
