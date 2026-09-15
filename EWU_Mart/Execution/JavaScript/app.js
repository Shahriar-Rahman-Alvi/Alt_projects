'use strict';

/**
 * app.js — Application entry point.
 *
 * Responsibilities:
 *  1. Instantiate the Database singleton (global `db`)
 *  2. Wire global event listeners (dropdown close, etc.)
 *  3. Show loading overlay during async init
 */

// ── Global singleton instances ──────────────────────────────────────────────
const db = new Database();

// ── Close notification dropdown when clicking outside ──────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('.dd-wrap')) {
    document.getElementById('notif-dd').classList.remove('open');
  }
});

// ── Loading overlay helper ─────────────────────────────────────────────────
const Loader = {
  show(msg = 'Loading…') {
    let el = document.getElementById('app-loader');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-loader';
      el.style.cssText = `
        position:fixed;inset:0;background:rgba(26,58,92,.82);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        z-index:9999;color:#fff;font-family:'Syne',sans-serif;gap:14px;`;
      el.innerHTML = `
        <div style="width:44px;height:44px;border:4px solid rgba(255,255,255,.25);
             border-top-color:#f4a61d;border-radius:50%;animation:spin .7s linear infinite"></div>
        <div id="app-loader-msg" style="font-size:16px;font-weight:600">${msg}</div>`;
      const style = document.createElement('style');
      style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
      document.body.appendChild(el);
    } else {
      document.getElementById('app-loader-msg').textContent = msg;
      el.style.display = 'flex';
    }
  },
  hide() {
    const el = document.getElementById('app-loader');
    if (el) el.style.display = 'none';
  },
};
