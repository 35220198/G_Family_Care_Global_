/* L&F Medical Clinic — administrator login (client-side, GitHub Pages) */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var form = document.getElementById('login');
  var status = document.getElementById('status');
  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var remember = document.getElementById('remember');
  var submit = document.getElementById('submit');
  var toggle = document.getElementById('show');

  if (!window.GFAuth) {
    if (status) { status.textContent = 'Authentication module failed to load.'; status.className = 'status error'; }
    return;
  }

  /* already signed in? go straight to the dashboard */
  if (window.GFAuth.isAuthed()) {
    window.location.replace('dashboard.html');
    return;
  }

  /* ---- restore a remembered email ---- */
  try {
    var saved = window.localStorage.getItem(window.GFAuth.config.rememberKey);
    if (saved) {
      email.value = saved;
      if (remember) remember.checked = true;
      password.focus();
    } else {
      email.focus();
    }
  } catch (e) { email.focus(); }

  /* ---- show / hide password ---- */
  if (toggle) {
    toggle.addEventListener('click', function () {
      var hidden = password.type === 'password';
      password.type = hidden ? 'text' : 'password';
      toggle.innerHTML = hidden ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
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

    try {
      if (keep) window.localStorage.setItem(window.GFAuth.config.rememberKey, addr);
      else window.localStorage.removeItem(window.GFAuth.config.rememberKey);
    } catch (e) {}

    submit.disabled = true;
    setStatus('Verifying…');

    window.GFAuth.login(addr, pass, keep)
      .then(function () {
        setStatus('Signed in. Redirecting…', 'success');
        window.setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 450);
      })
      .catch(function (err) {
        submit.disabled = false;
        password.value = '';
        password.focus();
        setStatus(err && err.message ? err.message : 'Login failed.', 'error');
      });
  });
});
