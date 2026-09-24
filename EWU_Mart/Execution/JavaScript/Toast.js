'use strict';

/**
 * Toast — lightweight notification singleton.
 * Usage: Toast.show('Message here');
 */
class Toast {
  /**
   * Display a toast message for a given duration.
   * @param {string} msg  - Text to display
   * @param {number} dur  - Duration in ms (default 3000)
   */
  static show(msg, dur = 3000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(Toast._timer);
    Toast._timer = setTimeout(() => el.classList.remove('show'), dur);
  }
}
