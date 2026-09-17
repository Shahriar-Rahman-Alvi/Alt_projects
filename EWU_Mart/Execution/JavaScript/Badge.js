'use strict';

/**
 * Badge — syncs unread message count badges across
 * the navbar, sidebar, and bottom bar.
 * Depends on: db (Database), Auth
 */
class Badge {
  /** Recalculate and update all badge elements */
  static update() {
    const u = Auth.user;
    if (!u) return;

    const count = db.unread(u.id);
    const ids   = ['nav-msg-cnt', 'sb-msg-bdg', 'bar-msg-bb'];

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
    });
  }
}
