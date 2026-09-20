'use strict';

/**
 * TxnController — renders transaction history with tab filtering.
 * Depends on: db, AuthController
 */
class TxnController {
  static _filter = 'all'; // 'all' | 'sales' | 'purchases'

  /**
   * Switch the active filter tab.
   * @param {'all'|'sales'|'purchases'} f
   * @param {HTMLElement} el - The clicked tab element
   */
  static setFilter(f, el) {
    TxnController._filter = f;
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    TxnController.render();
  }

  /** Render the filtered transaction list */
  static render() {
    const u = AuthController.user;
    const f = TxnController._filter;

    const list = db.data.txns.filter(t =>
      f === 'sales'     ? t.sid === u.id :
      f === 'purchases' ? t.bid === u.id :
      t.sid === u.id || t.bid === u.id
    );

    const el = document.getElementById('txn-list');

    el.innerHTML = list.length
      ? list.map(t => {
          const p     = db.prod(t.pid);
          const other = db.user(t.sid === u.id ? t.bid : t.sid);
          const sale  = t.sid === u.id;

          return `
            <div class="txn-row">
              <div class="txn-ic" style="background:${sale ? 'var(--success-light)' : 'var(--brand-light)'}">
                ${sale ? '💰' : '🛍️'}
              </div>
              <div style="flex:1">
                <div style="font-weight:500;font-size:14px">${p ? p.title : 'Unknown item'}</div>
                <div style="font-size:12px;color:var(--text3)">
                  ${sale ? 'Sold to' : 'Bought from'}
                  ${other ? other.fname + ' ' + other.lname : 'Unknown'} · ${t.date}
                </div>
              </div>
              <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:${sale ? 'var(--success)' : 'var(--text)'}">
                ${sale ? '+' : '-'}৳${t.amt.toLocaleString()}
              </div>
              <span class="badge ${t.status === 'Completed' ? 'badge-green' : 'badge-amber'}" style="margin-left:10px">
                ${t.status}
              </span>
            </div>`;
        }).join('')
      : '<div style="text-align:center;color:var(--text3);padding:32px;font-size:14px">No transactions found.</div>';
  }
}

const Txn = TxnController;
