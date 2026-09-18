'use strict';

/**
 * NotifController — manages the notifications dropdown.
 */
class NotifController {
  /** Toggle the notification dropdown and clear the unread dot */
  static toggle() {
    const dd = document.getElementById('notif-dd');
    dd.classList.toggle('open');
    document.getElementById('notif-dot').style.display = 'none';
  }
}
