/* ==========================================================
   L&F Medical Clinic — client-side admin authentication
   Static hosting (GitHub Pages): SHA-256 password hash check
   in the browser + localStorage / sessionStorage session.

   SECURITY NOTE (read this):
   A static site has no server, so this gate protects the admin
   UI from casual visitors — it is NOT a substitute for a real
   backend. Anyone who can read this file can read the hash, and
   the dashboard data lives in the visitor's own browser storage.
   Never put patient records, real credentials or anything
   confidential behind it. For true security, move the admin to
   a server-backed app (see README).
   ========================================================== */
(function (window) {
  'use strict';

  var CONFIG = {
    /* SHA-256 of the administrator password.
       Default password: Gfamily@2026  — CHANGE IT (see README). */
    passwordHash: '70354bf0199a53175b3ca79bec91fa1128d5754f2072e25b1912b2087ee310fd',
    email: 'info@gfamilycare.com',
    sessionKey: 'gfamily_admin_session',
    rememberKey: 'gfamily_remember_email',
    /* session lifetimes in milliseconds */
    sessionTtl: 8 * 60 * 60 * 1000,        /* 8 hours  */
    rememberTtl: 30 * 24 * 60 * 60 * 1000  /* 30 days  */
  };

  function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error('This browser cannot verify the password securely. Use a modern browser over HTTPS.'));
    }
    var data = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', data).then(function (buf) {
      return Array.prototype.map
        .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  /* constant-time-ish comparison */
  function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  function readSession() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(CONFIG.sessionKey) ||
            window.sessionStorage.getItem(CONFIG.sessionKey);
    } catch (e) { return null; }
    if (!raw) return null;
    var s;
    try { s = JSON.parse(raw); } catch (e) { return null; }
    if (!s || !s.email || !s.exp) return null;
    if (Date.now() > s.exp) { clearSession(); return null; }
    return s;
  }

  function writeSession(remember) {
    var ttl = remember ? CONFIG.rememberTtl : CONFIG.sessionTtl;
    var session = {
      email: CONFIG.email,
      issued: Date.now(),
      exp: Date.now() + ttl,
      remember: !!remember
    };
    var payload = JSON.stringify(session);
    try {
      if (remember) {
        window.localStorage.setItem(CONFIG.sessionKey, payload);
        window.sessionStorage.removeItem(CONFIG.sessionKey);
      } else {
        window.sessionStorage.setItem(CONFIG.sessionKey, payload);
        window.localStorage.removeItem(CONFIG.sessionKey);
      }
    } catch (e) { /* storage blocked */ }
    return session;
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(CONFIG.sessionKey);
      window.sessionStorage.removeItem(CONFIG.sessionKey);
    } catch (e) {}
  }

  function login(email, password, remember) {
    var addr = String(email || '').trim().toLowerCase();
    if (addr !== CONFIG.email.toLowerCase()) {
      return Promise.reject(new Error('Incorrect email or password.'));
    }
    return sha256Hex(String(password || '')).then(function (hash) {
      if (!safeEqual(hash, CONFIG.passwordHash)) {
        throw new Error('Incorrect email or password.');
      }
      return writeSession(remember);
    });
  }

  function requireSession(redirectTo) {
    var s = readSession();
    if (!s) {
      window.location.replace(redirectTo || 'index.html');
      return null;
    }
    return s;
  }

  window.GFAuth = {
    config: CONFIG,
    sha256Hex: sha256Hex,
    login: login,
    logout: clearSession,
    session: readSession,
    requireSession: requireSession,
    isAuthed: function () { return !!readSession(); }
  };
})(window);
