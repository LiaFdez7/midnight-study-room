/* Scales the 1600 × 1000 stage to fit the window, keeping its 16:10 shape.
   On a narrow portrait screen (a phone held upright) fitting the whole room would make
   every label unreadably small, so the room is sized to the screen's height instead and
   you swipe sideways to look around; it starts centred on the desk and timer. */
(function () {
  var stage = document.getElementById('stage');
  var viewport = document.getElementById('viewport');
  var wasPan = null;
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var pan = w < 700 && h > w;
    var s = pan ? Math.min(1, h / 1000) : Math.min(w / 1600, h / 1000);
    document.documentElement.classList.toggle('pan', pan);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.margin = ((1000 * s - 1000) / 2) + 'px ' + ((1600 * s - 1600) / 2) + 'px';
    if (pan && wasPan !== true && viewport) viewport.scrollLeft = Math.max(0, 800 * s - w / 2);
    wasPan = pan;
  }
  window.addEventListener('resize', fit);
  fit();
  /* While panning, a room dialog or drawer can open off to the side; scroll it into view once when it appears. */
  var shown = null;
  if (window.MutationObserver && viewport) new MutationObserver(function () {
    if (!document.documentElement.classList.contains('pan')) return;
    var d = stage.querySelector('.dlg, .tray');
    if (d && d !== shown) setTimeout(function () {   /* after the dialog has laid out and taken focus */
      if (!d.isConnected) return; var r = d.getBoundingClientRect(); viewport.scrollLeft += (r.left + r.width / 2) - window.innerWidth / 2;
    }, 120);
    shown = d;
  }).observe(stage, { childList: true, subtree: true });
})();
