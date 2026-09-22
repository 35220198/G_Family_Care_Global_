/* L&F Medical Clinic — star / sparkle burst effect
   Usage: burstStars(clientX, clientY) or window.GFSparkle.burstFrom(element)
   Attaches automatically to any element carrying data-sparkle. */
(function () {
  'use strict';

  var STAR_PATH =
    'M12 1.6l2.95 6.28 6.55.83-4.82 4.6 1.24 6.72L12 16.8l-5.92 3.23 1.24-6.72-4.82-4.6 6.55-.83z';
  var TONES = ['#fde68a', '#fcd34d', '#ffffff', '#a7f3d0', '#6ee7b7', '#34d399'];
  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var layer = null;
  function getLayer() {
    if (layer && document.body.contains(layer)) return layer;
    layer = document.getElementById('sparkle-layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'sparkle-layer';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    return layer;
  }

  function makeStar(x, y) {
    var host = getLayer();
    var el = document.createElement('span');
    el.className = 'gf-star';

    var size = 8 + Math.random() * 14;                 // 8–22px
    var angle = Math.random() * Math.PI * 2;
    var dist = 45 + Math.random() * 95;                // 45–140px travel
    var dur = 700 + Math.random() * 600;               // 0.7–1.3s

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--size', size.toFixed(1) + 'px');
    el.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
    el.style.setProperty('--dy', (Math.sin(angle) * dist - 26).toFixed(1) + 'px');
    el.style.setProperty('--rot', Math.round(-220 + Math.random() * 440) + 'deg');
    el.style.setProperty('--scale', (0.5 + Math.random() * 0.8).toFixed(2));
    el.style.setProperty('--dur', Math.round(dur) + 'ms');
    el.style.setProperty('--tone', TONES[(Math.random() * TONES.length) | 0]);

    el.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' +
      STAR_PATH +
      '"/></svg>';

    host.appendChild(el);
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, dur + 120);
  }

  function burstStars(x, y, count) {
    if (reduce) return;
    var n = count || 16;
    for (var i = 0; i < n; i++) {
      (function (i) {
        window.setTimeout(function () {
          makeStar(x, y);
        }, i * 14);
      })(i);
    }
  }

  function burstFrom(el, count) {
    if (!el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    burstStars(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  // Delegated handler: anything with data-sparkle sparkles on click.
  document.addEventListener(
    'click',
    function (ev) {
      var t = ev.target;
      var node = t && t.closest ? t.closest('[data-sparkle]') : null;
      if (!node) return;
      var count = parseInt(node.getAttribute('data-sparkle-count'), 10);
      if (ev.clientX || ev.clientY) {
        burstStars(ev.clientX, ev.clientY, count || 18);
      } else {
        burstFrom(node, count || 18);
      }

      /* If it's a plain link, hold navigation briefly so the stars are seen. */
      var href = node.getAttribute && node.getAttribute('href');
      if (
        !reduce &&
        node.tagName === 'A' &&
        href &&
        href.charAt(0) !== '#' &&
        !node.target &&
        !ev.metaKey && !ev.ctrlKey && !ev.shiftKey && ev.button === 0
      ) {
        ev.preventDefault();
        window.setTimeout(function () {
          window.location.href = href;
        }, 420);
      }
    },
    true
  );

  window.GFSparkle = { burstStars: burstStars, burstFrom: burstFrom };
})();
