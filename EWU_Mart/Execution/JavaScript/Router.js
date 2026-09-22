'use strict';

/**
 * Router — single-page navigation controller.
 * Activates the correct page, sidebar item, and bottom-bar button,
 * then calls the page's render method.
 */
class Router {
  // Maps page names to bottom-bar button IDs
  static _barMap = {
    dashboard:   'dashboard',
    marketplace: 'marketplace',
    messages:    'messages',
    profile:     'profile',
  };

  /**
   * Navigate to a named page.
   * @param {string} page - e.g. 'dashboard', 'marketplace', 'messages'
   */
  static go(page) {
    // Activate page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pg = document.getElementById('page-' + page);
    if (pg) pg.classList.add('active');

    // Activate sidebar item
    document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
    const sb = document.getElementById('sb-' + page);
    if (sb) sb.classList.add('active');

    // Activate bottom-bar button
    document.querySelectorAll('.bar-btn').forEach(i => i.classList.remove('active'));
    const barKey = Router._barMap[page] || page;
    const bar = document.getElementById('bar-' + barKey);
    if (bar) bar.classList.add('active');

    // Call page render
    const renderMap = {
      dashboard:     () => DashController.render(),
      marketplace:   () => MarketController.render(),
      messages:      () => MsgController.render(),
      'my-posts':    () => PostListController.render(),
      'create-post': () => PostController.initForm(),
      transactions:  () => TxnController.render(),
      profile:       () => ProfileController.render(),
      admin:         () => AdminController.render(),
    };

    if (renderMap[page]) renderMap[page]();
  }
}
