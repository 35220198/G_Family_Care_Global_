/* L&F Medical Clinic — administrator login */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var form = document.getElementById('login');
  var status = document.getElementById('status');
  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var remember = document.getElementById('remember');
  var submit = document.getElementById('submit');
  var toggle = document.getElementById('show');

  var STORE_KEY = 'gfamily_remember_email';

  /* ---- restore a remembered email ---- */
  try {
    var saved = window.localStorage.getItem(STORE_KEY);
    if (saved) {
      email.value = saved;
      if (remember) remember.checked = true;
      password.focus();
    } else {
      email.focus();
    }
  } catch (e) {
    /* storage blocked — ignore */
  }

  /* ---- show / hide password ---- */
  if (toggle) {
    toggle.addEventListener('click', function () {
      var hidden = password.type === 'password';
      password.type = hidden ? 'text' : 'password';
      toggle.innerHTML = hidden
        ? '<i class="fas fa-eye-slash"></i>'
        : '<i class="fas fa-eye"></i>';
      toggle.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
    });
  }

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'status' + (kind ? ' ' + kind : '');
  }

  /* ---- submit ---- */
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    var addr = email.value.trim();
    var pass = password.value;

    if (!addr || !pass) {
      setStatus('Enter your email and password.', 'error');
      return;
    }

    var keep = !!(remember && remember.checked);

    /* remember the email locally (never the password) */
    try {
      if (keep) window.localStorage.setItem(STORE_KEY, addr);
      else window.localStorage.removeItem(STORE_KEY);
    } catch (e) {}

    submit.disabled = true;
    setStatus('Signing in…');

    fetch('/api/auth?action=login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addr, password: pass, remember: keep })
    })
      .then(function (r) {
        return r.json().then(function (d) {
          return { ok: r.ok, data: d };
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.error || 'Login failed.');
        setStatus('Signed in. Redirecting…', 'success');
        if (window.GFSparkle) window.GFSparkle.burstFrom(submit, 26);
        window.setTimeout(function () {
          window.location.href = '/admin/dashboard.html';
        }, 550);
      })
      .catch(function (err) {
        submit.disabled = false;
        setStatus(err.message || 'Login failed.', 'error');
      });
  });
});
