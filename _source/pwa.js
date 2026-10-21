/* Midnight Study Room: makes the website installable and available offline. */
(function () {
  'use strict';
  // Ask the browser to keep the room's saved data even when the disk gets full.
  try {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(function (p) { if (!p && navigator.storage.persist) navigator.storage.persist(); });
    }
  } catch (e) {}

  if (!('serviceWorker' in navigator)) return;
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (location.protocol !== 'https:' && !local) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
  });

  // When an update arrives, switch to it quietly the next time the room is hidden,
  // so nothing you are typing is interrupted. (The timer and tasks are saved, so a reload is safe.)
  var hadController = !!navigator.serviceWorker.controller, pending = false;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) { hadController = true; return; }
    if (document.hidden) location.reload(); else pending = true;
  });
  document.addEventListener('visibilitychange', function () {
    if (pending && document.hidden) location.reload();
  });
})();
