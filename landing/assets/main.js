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

/* First-run preview:
 * Purpose stays on screen. Guided and Skip stay hidden until Continue.
 */
(function () {
  var gate = document.getElementById("first-run-gate");
  var choices = document.getElementById("first-run-choices");
  var result = document.getElementById("first-run-result");
  var restart = document.getElementById("first-run-restart");
  var continueBtn = document.getElementById("first-run-continue");

  if (!gate || !choices || !result || !restart || !continueBtn) return;

  var NEXT = {
    guided: "Next: pick an amount and an unlock time.",
    skip: "Next: your wallet. You can lock funds later."
  };

  function showPurpose() {
    gate.hidden = false;
    choices.hidden = true;
    result.hidden = true;
    result.textContent = "";
    restart.hidden = true;
  }

  continueBtn.addEventListener("click", function () {
    gate.hidden = true;
    choices.hidden = false;
    result.hidden = true;
    result.textContent = "";
  });

  choices.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-choice]");
    if (!btn) return;
    var choice = btn.getAttribute("data-choice");
    result.textContent = NEXT[choice] || "";
    result.hidden = false;
    restart.hidden = false;
  });

  restart.addEventListener("click", showPurpose);
})();
