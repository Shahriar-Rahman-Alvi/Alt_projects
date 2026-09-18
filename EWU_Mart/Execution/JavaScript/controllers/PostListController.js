'use strict';

/**
 * PostListController — My Posts table (async status change and delete).
 */
class PostListController {
  static render() {
    const u    = AuthController.user;
    const mine = db.data.products.filter(p => p.sid === u.id);
    const tbody = document.getElementById('my-posts-body');

    tbody.innerHTML = mine.length
      ? mine.map(p => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">${p.em}</span>
                <div>
                  <div style="font-weight:500">${p.title}</div>
                  <div style="font-size:12px;color:var(--text3)">${p.course}</div>
                </div>
              </div>
            </td>
            <td><span class="badge ${p.type === 'Sell' ? 'badge-blue' : 'badge-amber'}">${p.type}</span></td>
            <td style="font-weight:600">৳${p.price.toLocaleString()}</td>
            <td>
              <select onchange="PostListController.changeStatus(${p.id},this.value)"
                      style="width:auto;padding:4px 8px;font-size:13px">
                ${['Active','Sold','Closed'].map(s =>
                  `<option ${p.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </td>
            <td style="color:var(--text3);font-size:13px">${p.date}</td>
            <td>
              <div style="display:flex;gap:6px">
                <button class="btn btn-ghost btn-sm" onclick="PostController.edit(${p.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="PostListController.del(${p.id})">🗑️</button>
              </div>
            </td>
          </tr>`).join('')
      : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text3)">
           No posts yet. <button class="btn btn-primary btn-sm" onclick="Router.go('create-post')">Create one!</button>
         </td></tr>`;
  }

  /** Change product status — async API update */
  static async changeStatus(id, status) {
    const p = db.prod(id);
    if (!p) return;
    try {
      await db.updateProduct(id, { ...p, status });
      Toast.show(`Status → ${status}`);
      PostListController.render();
    } catch (e) {
      Toast.show('Failed to update status.');
    }
  }

  /** Delete product — async API delete */
  static async del(id) {
    if (!confirm('Delete this post?')) return;
    try {
      Loader.show('Deleting…');
      await db.removeProd(id);
      PostListController.render();
      DashController.render();
      Toast.show('Post deleted.');
    } catch (e) {
      Toast.show('Failed to delete post.');
    } finally {
      Loader.hide();
    }
  }
}

const PostList = PostListController;
