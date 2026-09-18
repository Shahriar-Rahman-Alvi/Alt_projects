'use strict';

/**
 * PostController — create & edit post form (async submit).
 */
class PostController {
  static _editId = null;
  static _type   = 'Sell';

  static _EM = {
    Textbooks: '📚', 'Lab Supplies': '🔬', 'Notes & Reports': '📓',
    Electronics: '💻', Stationery: '✏️', Other: '📦',
  };

  static selectType(type, el) {
    PostController._type = type;
    document.querySelectorAll('.pt-opt').forEach(e => e.classList.remove('sel'));
    el.classList.add('sel');
  }

  static initForm() {
    PostController._editId ? PostController._loadEdit(PostController._editId) : PostController._reset();
  }

  static edit(id) {
    PostController._editId = id;
    Router.go('create-post');
  }

  /** Submit create or update — async API call */
  static async submit() {
    const title  = document.getElementById('p-title').value.trim();
    const course = document.getElementById('p-course').value.trim();
    const price  = parseFloat(document.getElementById('p-price').value);
    const cat    = document.getElementById('p-cat').value;
    const desc   = document.getElementById('p-desc').value.trim();
    const cond   = document.getElementById('p-cond').value;

    if (!title || !course || !price) { Toast.show('Please fill all required fields.'); return; }

    const em = PostController._EM[cat] || '📦';

    try {
      Loader.show('Saving…');
      if (PostController._editId) {
        const existing = db.prod(PostController._editId);
        await db.updateProduct(PostController._editId, {
          ...existing, title, course, price, cat, desc, cond,
          type: PostController._type, em,
        });
        Toast.show('Post updated! ✅');
      } else {
        await db.addProduct({
          sid: AuthController.user.id,
          title, course, cat, price,
          type: PostController._type,
          cond, desc, em,
        });
        Toast.show('Post published! 🎉');
      }
      PostController._editId = null;
      Router.go('my-posts');
    } catch (e) {
      Toast.show('Failed to save post.');
    } finally {
      Loader.hide();
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────

  static _reset() {
    PostController._editId = null;
    PostController._type   = 'Sell';
    document.getElementById('cp-title').textContent = 'Create New Post';
    document.getElementById('cp-btn').textContent   = 'Publish Post';
    ['p-title', 'p-course', 'p-price', 'p-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('p-cat').value  = 'Textbooks';
    document.getElementById('p-cond').value = 'Good';
    document.querySelectorAll('.pt-opt').forEach((el, i) => el.classList.toggle('sel', i === 0));
  }

  static _loadEdit(id) {
    const p = db.prod(id);
    if (!p) return;
    document.getElementById('cp-title').textContent = 'Edit Post';
    document.getElementById('cp-btn').textContent   = 'Save Changes';
    document.getElementById('p-title').value  = p.title;
    document.getElementById('p-course').value = p.course;
    document.getElementById('p-cat').value    = p.cat;
    document.getElementById('p-price').value  = p.price;
    document.getElementById('p-desc').value   = p.desc;
    document.getElementById('p-cond').value   = p.cond;
    PostController._type = p.type;
    document.querySelectorAll('.pt-opt').forEach((el, i) =>
      el.classList.toggle('sel', (i === 0 && p.type === 'Sell') || (i === 1 && p.type === 'Want'))
    );
  }
}

const Post = PostController;
