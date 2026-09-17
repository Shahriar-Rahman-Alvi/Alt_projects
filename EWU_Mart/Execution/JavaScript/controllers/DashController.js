'use strict';

/**
 * DashController — renders the dashboard page.
 * Shows user hero card, stat grid, recent listings, and reviews.
 * Depends on: db, AuthController
 */
class DashController {
  /** Render the full dashboard for the logged-in user */
  static render() {
    const u = AuthController.user;
    if (!u) return;

    // Hero card
    const init = u.fname[0] + (u.lname ? u.lname[0] : '');
    document.getElementById('dh-av').textContent   = init;
    document.getElementById('dh-name').textContent = u.fname + ' ' + u.lname;
    document.getElementById('dh-dept').textContent = u.dept;
    document.getElementById('dh-sem').textContent  = u.sem;

    // Stat counters
    const mine = db.data.products.filter(p => p.sid === u.id);
    document.getElementById('s-listed').textContent = mine.length;
    document.getElementById('s-sold').textContent   = mine.filter(p => p.status === 'Sold').length;
    document.getElementById('s-bought').textContent = db.data.txns.filter(t => t.bid === u.id).length;

    // Recent listings
    DashController._renderListings(mine);

    // Recent reviews
    DashController._renderReviews(u.id);
  }

  /** Render recent 4 listings in the dashboard card */
  static _renderListings(mine) {
    const el     = document.getElementById('dash-listings');
    const recent = mine.slice(-4).reverse();

    el.innerHTML = recent.length
      ? recent.map(p => `
          <div class="txn-row">
            <span style="font-size:22px">${p.em}</span>
            <div style="flex:1;min-width:0">
              <div style="font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
              <div style="font-size:12px;color:var(--text3)">${p.course} · ৳${p.price}</div>
            </div>
            <span class="badge ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}">${p.status}</span>
          </div>`).join('')
      : '<div style="color:var(--text3);font-size:14px;text-align:center;padding:20px 0">No listings yet</div>';
  }

  /** Render the last 3 reviews received by userId */
  static _renderReviews(userId) {
    const el   = document.getElementById('dash-reviews');
    const myRv = db.data.reviews.filter(r => r.for === userId).slice(-3);

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
              </div>
              <div class="rv-text">"${r.text}"</div>
            </div>`;
        }).join('')
      : '<div style="color:var(--text3);font-size:14px;text-align:center;padding:20px 0">No reviews yet</div>';
  }
}

const Dash = DashController;
