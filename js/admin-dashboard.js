/* G.Family Care — administrator dashboard */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var gate = document.getElementById('gate');
  var emailOut = document.getElementById('email');
  var logout = document.getElementById('logout');

  function toLogin() {
    window.location.replace('/admin/');
  }

  fetch('/api/auth?action=me', { credentials: 'same-origin' })
    .then(function (r) {
      if (!r.ok) throw new Error('unauthenticated');
      return r.json();
    })
    .then(function (d) {
      if (emailOut) emailOut.textContent = d.email || '';
      if (gate) gate.classList.add('hidden');
    })
    .catch(toLogin);

  if (logout) {
    logout.addEventListener('click', function () {
      logout.disabled = true;
      fetch('/api/auth?action=logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
        .then(toLogin)
        .catch(toLogin);
    });
  }
});
