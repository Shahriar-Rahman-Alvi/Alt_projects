'use strict';

/**
 * MsgController — split-panel messaging UI.
 * send() is async (writes to DB via API).
 * Render methods are sync (read from db.data cache).
 */
class MsgController {
  static _activePartnerId = null;
  static _searchQuery     = '';

  static render() {
    MsgController._renderList();
    if (MsgController._activePartnerId) {
      MsgController._openThread(MsgController._activePartnerId);
    }
  }

  static filterConvos() {
    MsgController._searchQuery = document.getElementById('cl-srch').value.toLowerCase();
    MsgController._renderList();
  }

  /** Send a message — async write then re-render thread */
  static async send() {
    if (!MsgController._activePartnerId) return;
    const inp  = document.getElementById('chat-inp');
    const text = inp.value.trim();
    if (!text) return;

    try {
      await db.addMsg({ from: AuthController.user.id, to: MsgController._activePartnerId, text });
      inp.value = '';
      MsgController._openThread(MsgController._activePartnerId);
      Badge.update();
    } catch (e) {
      Toast.show('Failed to send message.');
    }
  }

  static startWith(partnerId) {
    MsgController._activePartnerId = partnerId;
    Router.go('messages');
  }

  // ── Private ─────────────────────────────────────────────────────────────

  static _renderList() {
    const u    = AuthController.user;
    const q    = MsgController._searchQuery;
    const pids = db.partners(u.id).filter(pid => {
      if (!q) return true;
      const p = db.user(pid);
      return p && (p.fname + ' ' + p.lname).toLowerCase().includes(q);
    });

    const el = document.getElementById('cl-list');
    if (!pids.length) {
      el.innerHTML = `<div class="cl-empty">${q
        ? 'No match found.'
        : 'No conversations yet.<br/>Start chatting from a product listing!'}</div>`;
      return;
    }

    el.innerHTML = pids.map(pid => {
      const partner = db.user(pid);
      if (!partner) return '';
      const thread = db.thread(u.id, pid);
      const last   = thread[thread.length - 1];
      const init   = partner.fname[0] + (partner.lname ? partner.lname[0] : '');
      const unread = thread.filter(m => m.to === u.id).length;
      const active = MsgController._activePartnerId === pid;

      return `
        <div class="cl-item ${active ? 'active' : ''}" onclick="MsgController._openThread(${pid})">
          <div class="cl-av">${init}</div>
          <div class="cl-info">
            <div class="cl-name">${partner.fname} ${partner.lname}</div>
            <div class="cl-prev">${last ? (last.from === u.id ? 'You: ' : '') + last.text : 'No messages yet'}</div>
          </div>
          <div class="cl-meta">
            <div class="cl-time">${last ? last.time : ''}</div>
            ${unread > 0 ? `<div class="cl-unread">${unread}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  static _openThread(pid) {
    MsgController._activePartnerId = pid;
    const u       = AuthController.user;
    const partner = db.user(pid);
    if (!partner) return;

    MsgController._renderList();

    document.getElementById('chat-hdr').classList.remove('hidden');
    document.getElementById('chat-hdr-av').textContent   = partner.fname[0] + (partner.lname ? partner.lname[0] : '');
    document.getElementById('chat-hdr-name').textContent = partner.fname + ' ' + partner.lname;
    document.getElementById('chat-hdr-sub').textContent  = partner.dept + ' · ' + partner.sem;
    document.getElementById('chat-ph').classList.add('hidden');

    const msgs = document.getElementById('chat-msgs');
    msgs.classList.remove('hidden');
    document.getElementById('chat-inp-row').classList.remove('hidden');

    msgs.innerHTML = db.thread(u.id, pid).map(m => {
      const mine = m.from === u.id;
      return `<div><div class="bubble ${mine ? 'mine' : 'theirs'}">${m.text}<div class="bubble-time">${m.time}</div></div></div>`;
    }).join('');

    msgs.scrollTop = msgs.scrollHeight;
    document.getElementById('chat-inp').focus();
  }
}

const Msg = MsgController;
