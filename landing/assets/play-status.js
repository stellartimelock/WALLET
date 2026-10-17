/* Google Play listing status: the ONE place to edit.
 * Set an app to true once its Play listing is live. Any element with
 * data-play="<package>" becomes a "Get it on Google Play" link when true,
 * and stays a non-clickable "Coming soon to Google Play" badge when false. */
(function () {
  var PLAY_LIVE = {
    "com.stellartimelock": true,              // StellarTimeLock wallet
    "com.stellartimelock.music": false,       // Music
    "com.stellartimelock.video": false,       // Video
    "com.stellartimelock.write": false,       // Write
    "app.stellar.sourceify": false,           // Sourceify
    "com.stellartimelock.stellarvault": false // Fortress
  };
  function run() {
    var els = document.querySelectorAll("[data-play]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i], pkg = el.getAttribute("data-play");
      if (!PLAY_LIVE[pkg]) continue;
      var a = document.createElement("a");
      a.className = el.className.replace(/\s*\bplay-soon\b/, "");
      a.href = "https://play.google.com/store/apps/details?id=" + pkg;
      a.rel = "noopener";
      a.innerHTML = el.innerHTML.replace(/Coming soon to Google Play/, "Get it on Google Play");
      el.parentNode.replaceChild(a, el);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
