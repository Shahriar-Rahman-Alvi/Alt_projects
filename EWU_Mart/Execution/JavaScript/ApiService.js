'use strict';

/**
 * ApiService — thin HTTP client for the EWUMart REST API.
 * All methods return Promises. Throws on non-2xx responses.
 */
class ApiService {
  static BASE = '/api';

  /**
   * Core request helper.
   * @param {string} method - HTTP verb
   * @param {string} path   - path after /api (e.g. '/login')
   * @param {object} [body] - JSON payload for POST/PUT
   */
  static async _req(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== null) opts.body = JSON.stringify(body);

    const res  = await fetch(ApiService.BASE + path, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  static get(path)          { return ApiService._req('GET',    path); }
  static post(path, body)   { return ApiService._req('POST',   path, body); }
  static put(path, body)    { return ApiService._req('PUT',    path, body); }
  static del(path)          { return ApiService._req('DELETE', path); }

  // ── Shortcuts ──────────────────────────────────────────────────────────────

  /** Login — returns user object or throws */
  static login(email, pw)       { return ApiService.post('/login',    { email, pw }); }

  /** Register — returns new user object or throws */
  static register(data)         { return ApiService.post('/register', data); }

  /** Load all app data for uid in one round-trip */
  static init(uid)              { return ApiService.get(`/init/${uid}`); }

  /** Products */
  static getProducts()          { return ApiService.get('/products'); }
  static createProduct(data)    { return ApiService.post('/products', data); }
  static updateProduct(id, data){ return ApiService.put(`/products/${id}`, data); }
  static deleteProduct(id)      { return ApiService.del(`/products/${id}`); }

  /** Messages */
  static getMessages(uid)       { return ApiService.get(`/messages/${uid}`); }
  static sendMessage(data)      { return ApiService.post('/messages', data); }

  /** Transactions */
  static createTransaction(data){ return ApiService.post('/transactions', data); }

  /** Reports */
  static createReport(data)     { return ApiService.post('/reports', data); }
  static resolveReport(id)      { return ApiService.put(`/reports/${id}`, { status: 'Resolved' }); }

  /** Users */
  static updateUser(id, data)   { return ApiService.put(`/users/${id}`, data); }
}
