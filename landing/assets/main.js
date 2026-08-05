/* Landing-page interactions:
 *   - Typewriter animation for the hero title.
 *   - Fade-in for the tagline after the title finishes.
 */
(function () {
  var TITLE = "Stellar TimeLock";
  var TYPE_MS = 70;
  var titleEl = document.getElementById("typed-title");
  var cursorEl = document.getElementById("cursor");
  var taglineEl = document.getElementById("tagline");

  if (!titleEl || !taglineEl) return;

  titleEl.textContent = "";
  var i = 0;

  function typeNext() {
    if (i <= TITLE.length) {
      titleEl.textContent = TITLE.slice(0, i);
      i += 1;
      window.setTimeout(typeNext, TYPE_MS);
    } else {
      window.setTimeout(function () {
        if (cursorEl) cursorEl.style.opacity = 0;
        taglineEl.classList.add("visible");
      }, 500);
    }
  }

  window.setTimeout(typeNext, 250);
})();
