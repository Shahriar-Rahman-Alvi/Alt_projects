'use strict';

/**
 * ModalController — product detail modal (buy is async).
 */
class ModalController {
  static openProduct(id) {
    const p      = db.prod(id);
    if (!p) return;
    const seller = db.user(p.sid);
    const own    = p.sid === AuthController.user.id;

    document.getElementById('pm-title').textContent = p.title;
    document.getElementById('pm-body').innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div style="width:110px;height:110px;background:var(--bg);border-radius:var(--r-lg);
                    display:flex;align-items:center;justify-content:center;font-size:52px;flex-shrink:0">${p.em}</div>
        <div style="flex:1">
          <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
            <span class="badge ${p.type === 'Sell' ? 'badge-blue' : 'badge-amber'}">${p.type}</span>
            <span class="badge badge-gray">${p.cat}</span>
            <span class="badge badge-gray">${p.cond}</span>
            <span class="badge ${p.status === 'Active' ? 'badge-green' : 'badge-gray'}">${p.status}</span>
          </div>
          <div style="font-family:'Syne',sans-serif;font-size:26px;font-weight:700;color:var(--brand);margin-bottom:7px">
            ৳${p.price.toLocaleString()}</div>
          <div style="font-size:14px;color:var(--text2);margin-bottom:7px">📖 ${p.course}</div>
          <div style="font-size:14px">${p.desc}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:10px">Listed on ${p.date}</div>
        </div>
      </div>
      <div style="margin-top:18px;padding:13px;background:var(--bg);border-radius:var(--r)">
        <div style="font-weight:600;font-size:13px;margin-bottom:8px">Seller</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--brand);color:#fff;
                      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">
            ${seller ? seller.fname[0] : '?'}</div>
          <div>
            <div style="font-weight:500;font-size:14px">${seller ? seller.fname + ' ' + seller.lname : 'Unknown'}</div>
            <div style="font-size:12px;color:var(--text3)">${seller ? seller.dept + ' · ' + seller.sem : ''}</div>
          </div>
          <div style="margin-left:auto"><span class="stars" style="font-size:14px">★★★★★</span>
            <span style="font-size:13px">4.8</span></div>
        </div>
      </div>`;

    document.getElementById('pm-ftr').innerHTML = own
      ? `<button class="btn btn-ghost" onclick="ModalController.closeProduct()">Close</button>
         <button class="btn btn-outline" onclick="ModalController.closeProduct();PostController.edit(${p.id})">✏️ Edit</button>
         <button class="btn btn-danger" onclick="PostListController.del(${p.id});ModalController.closeProduct()">🗑️ Delete</button>`
      : `<button class="btn btn-ghost btn-sm" onclick="ModalController.closeProduct();ReportController.open(${p.id})">🚩 Report</button>
         <button class="btn btn-ghost" onclick="ModalController.closeProduct()">Close</button>
         ${p.type === 'Sell' && p.status === 'Active'
           ? `<button class="btn btn-primary" onclick="ModalController.buy(${p.id})">Buy Now</button>` : ''}
         <button class="btn btn-outline" onclick="ModalController.closeProduct();MsgController.startWith(${p.sid})">💬 Message</button>`;

    document.getElementById('prod-modal').classList.add('open');
  }

  /** Buy a product — async transaction creation */
  static async buy(pid) {
    const p = db.prod(pid);
    if (!p || p.status !== 'Active') return;
    try {
      Loader.show('Processing…');
      await db.addTxn({ pid, bid: AuthController.user.id, sid: p.sid, amt: p.price });
      ModalController.closeProduct();
      DashController.render();
      Toast.show('Purchase initiated! Chat the seller to complete. ✅');
    } catch (e) {
      Toast.show('Purchase failed.');
    } finally {
      Loader.hide();
    }
  }

  static closeProduct() {
    document.getElementById('prod-modal').classList.remove('open');
  }
}
