'use strict';

/**
 * ProfileController — profile view + edit form (async save).
 */
class ProfileController {
  static render() {
    const u    = AuthController.user;
    const init = u.fname[0] + (u.lname ? u.lname[0] : '');

    document.getElementById('pfl-av').textContent    = init;
    document.getElementById('pfl-name').textContent  = u.fname + ' ' + u.lname;
    document.getElementById('pfl-id').textContent    = u.sid || '';
    document.getElementById('pfl-dept').textContent  = u.dept;
    document.getElementById('pfl-sem').textContent   = u.sem;
    document.getElementById('pfl-email').textContent = u.email;

    document.getElementById('e-fn').value   = u.fname;
    document.getElementById('e-ln').value   = u.lname || '';
    document.getElementById('e-em').value   = u.email;
    document.getElementById('e-dept').value = u.dept;
    document.getElementById('e-sem').value  = u.sem;
    document.getElementById('e-bio').value  = u.bio || '';

    ProfileController._renderReviews(u.id);
  }

  /** Save profile changes — async API update */
  static async save() {
    const u    = AuthController.user;
    const fn   = document.getElementById('e-fn').value.trim();
    const ln   = document.getElementById('e-ln').value.trim();
    const dept = document.getElementById('e-dept').value;
    const sem  = document.getElementById('e-sem').value;
    const bio  = document.getElementById('e-bio').value.trim();

    try {
      Loader.show('Saving…');
      const saved = await db.updateUser(u.id, { fname: fn, lname: ln, dept, sem, bio });
      // Update live session reference
      Object.assign(u, saved);
      document.getElementById('nav-av').textContent = fn[0] + (ln ? ln[0] : '');
      DashController.render();
      ProfileController.render();
      Toast.show('Profile saved! ✅');
    } catch (e) {
      Toast.show('Failed to save profile.');
    } finally {
      Loader.hide();
    }
  }

  static _renderReviews(userId) {
    const el   = document.getElementById('pfl-reviews');
    const myRv = db.data.reviews.filter(r => r.for === userId);

    el.innerHTML = myRv.length
      ? myRv.map(r => {
          const who = db.user(r.by);
          return `
            <div class="rv-item">
              <div class="rv-user">
                <div class="rv-av">${who ? who.fname[0] : '?'}</div>
                <div>
                  <div style="font-weight:500;font-size:13px">${who ? who.fname + ' ' + who.lname : 'Unknown'}</div>
                  <div class="stars" style="font-size:12px">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
                </div>
                <div style="margin-left:auto;font-size:11px;color:var(--text3)">${r.date}</div>
              </div>
              <div class="rv-text">"${r.text}"</div>
            </div>`;
        }).join('')
      : '<div style="color:var(--text3);font-size:14px;padding:12px 0">No reviews yet.</div>';
  }
}

const Profile = ProfileController;
