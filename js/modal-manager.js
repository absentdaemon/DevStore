/**
 * DevStore Modal & Focus Manager
 * Handles dialog focus trapping, Escape dismissal, and focus restoration for accessibility.
 */

export class ModalManager {
  constructor() {
    this.openModals = [];
    this.lastTriggerElement = null;
    this._bindGlobalKeydown();
  }

  _bindGlobalKeydown() {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.openModals.length > 0) {
          e.preventDefault();
          const topModal = this.openModals[this.openModals.length - 1];
          if (topModal && typeof topModal.close === 'function') {
            topModal.close();
          }
        }
      } else if (e.key === 'Tab') {
        if (this.openModals.length > 0) {
          const topModal = this.openModals[this.openModals.length - 1];
          if (topModal && topModal.element) {
            this._trapFocus(e, topModal.element);
          }
        }
      }
    });
  }

  _trapFocus(e, modalElement) {
    const focusable = modalElement.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  registerOpen(modalId, element, closeFn, triggerElement = null) {
    this.lastTriggerElement = triggerElement || document.activeElement;
    this.openModals.push({ id: modalId, element, close: closeFn, trigger: this.lastTriggerElement });

    // Focus first focusable element inside modal
    setTimeout(() => {
      if (element) {
        const focusable = element.querySelector(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
        );
        if (focusable && typeof focusable.focus === 'function') {
          focusable.focus();
        } else if (typeof element.focus === 'function') {
          element.focus();
        }
      }
    }, 50);
  }

  registerClose(modalId) {
    const idx = this.openModals.findIndex(m => m.id === modalId);
    if (idx !== -1) {
      const modal = this.openModals[idx];
      this.openModals.splice(idx, 1);
      if (modal.trigger && typeof modal.trigger.focus === 'function') {
        setTimeout(() => modal.trigger.focus(), 50);
      }
    }
  }

  hasOpenModal() {
    return this.openModals.length > 0;
  }
}

export const modalManager = new ModalManager();
