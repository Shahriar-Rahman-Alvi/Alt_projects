'use strict';

/**
 * AdminController — admin panel with listings, users, reports tabs.
 * Includes: Create User modal, Promote to Admin, Remove product, Resolve report.
 * All mutations are async API calls.
 */
class AdminController {
  static _tab = 'listings';

  static render() {
    document.getElementById('adm-u').textContent = db.data.users.length;
    document.getElementById('adm-l').textContent = db.data.products.filter(p => p.status === 'Active').length;
    document.getElementById('adm-t').textContent = db.data.txns.length;
    document.getElementById('adm-r').textContent = db.data.reports.filter(r => r.status === 'Pending').length;
    AdminController._renderContent();
  }

  static setTab(tab, el) {
    AdminController._tab = tab;
    document.querySelectorAll('#page-admin .tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    AdminController._renderContent();
  }

  static async removeProd(id) {
    if (!confirm('Remove this product?')) return;
    try {
      await db.removeProd(id);
      AdminController.render();
      Toast.show('Product removed.');
    } catch (e) { Toast.show('Failed to remove product.'); }
  }

  static async resolveRep(id) {
    try {
      await db.resolveReport(id);
      AdminController.render();
      Toast.show('Report resolved. ✅');
    } catch (e) { Toast.show('Failed to resolve report.'); }
  }

  /** Open the Create User modal */
  static openCreateUser() {
    document.getElementById('adm-create-user-modal').classList.add('open');
  }

  static closeCreateUser() {
    document.getElementById('adm-create-user-modal').classList.remove('open');
    ['adm-u-fn','adm-u-ln','adm-u-em','adm-u-sid','adm-u-pw'].forEach(id =>
      document.getElementById(id).value = '');
    document.getElementById('adm-u-dept').value = 'CSE';
    document.getElementById('adm-u-sem').value  = 'Spring 2025';
    document.getElementById('adm-u-role').value = 'user';
  }

  /** Create a new user (admin) */
  static async createUser() {
    const fn   = document.getElementById('adm-u-fn').value.trim();
    const ln   = document.getElementById('adm-u-ln').value.trim();
    const em   = document.getElementById('adm-u-em').value.trim();
    const sid  = document.getElementById('adm-u-sid').value.trim();
    const dept = document.getElementById('adm-u-dept').value;
    const sem  = document.getElementById('adm-u-sem').value;
    const pw   = document.getElementById('adm-u-pw').value;
    const role = document.getElementById('adm-u-role').value;

    if (!fn || !em || !pw || !dept || !sem) { Toast.show('Fill all required fields.'); return; }

    try {
      Loader.show('Creating user…');
      // Register via API then promote if admin
      const u = await ApiService.register({ fname: fn, lname: ln, email: em, pw, dept, sem, sid });
      db.data.users.push(u);
      if (role === 'admin') {
        await db.setUserRole(u.id, 'admin');
      }
      AdminController.closeCreateUser();
      AdminController.render();
      Toast.show(`User ${fn} created! 🎉`);
    } catch (e) {
      Toast.show(e.message || 'Failed to create user.');
    } finally {
      Loader.hide();
    }
  }

  /** Toggle a user's role between user ↔ admin */
  static async toggleRole(uid) {
    const u    = db.user(uid);
    if (!u) return;
    const role = u.role === 'admin' ? 'user' : 'admin';
    try {
      await db.setUserRole(uid, role);
      AdminController.render();
      Toast.show(`${u.fname} is now ${role}.`);
    } catch (e) { Toast.show('Failed to change role.'); }
  }

  // ── Private ─────────────────────────────────────────────────────────────

  static _renderContent() {
    const el = document.getElementById('adm-content');
    if      (AdminController._tab === 'listings') el.innerHTML = AdminController._listingsTable();
    else if (AdminController._tab === 'users')    el.innerHTML = AdminController._usersTable();
    else                                           el.innerHTML = AdminController._reportsTable();
  }

  static _listingsTable() {
    const rows = db.data.products.map(p => {
      const s = db.user(p.sid);
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${p.em}</span>
          <div><div style="font-weight:500;font-size:14px">${p.title}</div>
          <div style="font-size:12px;color:var(--text3)">${p.course}</div></div></div></td>
        <td style="font-size:14px">${s ? s.fname + ' ' + s.lname : '?'}</td>
        <td style="font-weight:600">৳${p.price}</td>
        <td><span class="badge ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}">${p.status}</span></td>
        <td><button class="btn btn-danger btn-sm" onclick="AdminController.removeProd(${p.id})">Remove</button></td>
      </tr>`;
    }).join('');
    return `<div class="card" style="padding:0;overflow:hidden">
      <table class="pt" style="width:100%"><thead><tr>
        <th>Item</th><th>Seller</th><th>Price</th><th>Status</th><th>Action</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  static _usersTable() {
    const currentUserId = AuthController.user.id;
    const rows = db.data.users.map(u => `<tr>
      <td style="font-weight:500">${u.fname} ${u.lname}</td>
      <td style="font-size:13px;color:var(--text2)">${u.email}</td>
      <td>${u.dept}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}">${u.role}</span></td>
      <td>${db.data.products.filter(p => p.sid === u.id).length}</td>
      <td>${u.id !== currentUserId
        ? `<button class="btn btn-ghost btn-sm" onclick="AdminController.toggleRole(${u.id})">
             ${u.role === 'admin' ? 'Demote' : 'Make Admin'}
           </button>` : '<span style="font-size:12px;color:var(--text3)">You</span>'}</td>
    </tr>`).join('');

    return `
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
        <button class="btn btn-primary btn-sm" onclick="AdminController.openCreateUser()">+ Create User</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="pt" style="width:100%"><thead><tr>
          <th>Name</th><th>Email</th><th>Dept</th><th>Role</th><th>Posts</th><th>Actions</th>
        </tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  static _reportsTable() {
    if (!db.data.reports.length) {
      return '<div class="card" style="text-align:center;color:var(--text3);padding:32px">No reports filed.</div>';
    }
    const rows = db.data.reports.map(r => {
      const who = db.user(r.by);
      const p   = db.prod(r.pid);
      return `<tr>
        <td style="font-size:14px">${who ? who.fname + ' ' + who.lname : '?'}</td>
        <td><div style="font-size:13px;font-weight:500">${r.rsn}</div>
            <div style="font-size:12px;color:var(--text2)">${r.dtl}</div></td>
        <td><span class="badge ${r.status === 'Pending' ? 'badge-amber' : 'badge-green'}">${r.status}</span></td>
        <td style="display:flex;gap:6px">
          ${r.status === 'Pending' ? `<button class="btn btn-ghost btn-sm" onclick="AdminController.resolveRep(${r.id})">Resolve</button>` : ''}
          ${p ? `<button class="btn btn-danger btn-sm" onclick="AdminController.removeProd(${p.id})">Remove Post</button>` : ''}
        </td>
      </tr>`;
    }).join('');
    return `<div class="card" style="padding:0;overflow:hidden">
      <table class="pt" style="width:100%"><thead><tr>
        <th>Reporter</th><th>Reason</th><th>Status</th><th>Actions</th>
      </tr></thead><tbody>${rows}</tbody></table></div>`;
  }
}

const Admin = AdminController;
