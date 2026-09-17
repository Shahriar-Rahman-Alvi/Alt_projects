'use strict';

/**
 * AuthController — handles login, registration, demo login, and logout.
 * All auth calls hit the Flask API; on success db.init() loads all app data.
 * Depends on: ApiService, db (Database), Badge, Router, Toast, Loader
 */
class AuthController {
  static _u = null;

  static get user() { return AuthController._u; }

  static switchTab(tab, btn) {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
    document.getElementById('auth-err').style.display = 'none';
    document.getElementById('auth-h').textContent =
      tab === 'login' ? 'Welcome back' : 'Create Account';
  }

  /** Email/password login via API */
  static async login() {
    const em = document.getElementById('l-email').value.trim();
    const pw = document.getElementById('l-pass').value;
    if (!em || !pw) { AuthController._err('Please enter email and password.'); return; }

    try {
      Loader.show('Signing in…');
      const u = await ApiService.login(em, pw);
      await AuthController._enter(u);
    } catch (e) {
      AuthController._err(e.message || 'Login failed.');
    } finally {
      Loader.hide();
    }
  }

  /** Register new account via API */
  static async register() {
    const fn   = document.getElementById('r-fn').value.trim();
    const ln   = document.getElementById('r-ln').value.trim();
    const em   = document.getElementById('r-em').value.trim();
    const sid  = document.getElementById('r-sid').value.trim();
    const dept = document.getElementById('r-dept').value;
    const sem  = document.getElementById('r-sem').value;
    const pw   = document.getElementById('r-pw').value;

    if (!fn || !em || !pw || !dept || !sem) {
      AuthController._err('Please fill all required fields.'); return;
    }
    if (pw.length < 6) {
      AuthController._err('Password must be at least 6 characters.'); return;
    }

    try {
      Loader.show('Creating account…');
      const u = await ApiService.register({ fname: fn, lname: ln, email: em, pw, dept, sem, sid });
      await AuthController._enter(u);
    } catch (e) {
      AuthController._err(e.message || 'Registration failed.');
    } finally {
      Loader.hide();
    }
  }

  /** Quick demo login (bypasses API, uses known credentials) */
  static async demo(role) {
    const creds = role === 'admin'
      ? { email: 'admin@ewubd.edu', pw: 'admin' }
      : { email: 'ibna@ewubd.edu',  pw: '1234'  };
    try {
      Loader.show('Loading demo…');
      const u = await ApiService.login(creds.email, creds.pw);
      await AuthController._enter(u);
    } catch (e) {
      AuthController._err('Demo login failed — is the server running?');
    } finally {
      Loader.hide();
    }
  }

  /** Logout — clear session and return to auth screen */
  static logout() {
    AuthController._u = null;
    document.getElementById('app').classList.remove('visible');
    document.getElementById('auth-screen').style.display = 'flex';
  }

  // ── Private ─────────────────────────────────────────────────────────────

  /** Load all data then enter the app */
  static async _enter(u) {
    AuthController._u = u;
    Loader.show('Loading your data…');
    await db.init(u.id);
    Loader.hide();

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');
    document.getElementById('nav-av').textContent = u.fname[0] + (u.lname ? u.lname[0] : '');
    document.getElementById('sb-admin-sec').classList.toggle('hidden', u.role !== 'admin');

    Badge.update();
    Router.go('dashboard');
    Toast.show(`Welcome, ${u.fname}! 👋`);
  }

  static _err(msg) {
    const el = document.getElementById('auth-err');
    el.textContent = msg;
    el.style.display = 'block';
  }
}

const Auth = AuthController;
