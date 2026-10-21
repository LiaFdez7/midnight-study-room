/* Scales the 1600 × 1000 stage to fit the window, keeping its 16:10 shape. */
(function () {
  var stage = document.getElementById('stage');
  function fit() {
    var s = Math.min(window.innerWidth / 1600, window.innerHeight / 1000);
    stage.style.transform = 'scale(' + s + ')';
    stage.style.margin = ((1000 * s - 1000) / 2) + 'px ' + ((1600 * s - 1600) / 2) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();
})();
