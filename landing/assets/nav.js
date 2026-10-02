/* Mobile primary nav. Desktop keeps the link row; narrow viewports use the button. */
(function () {
  var header = document.querySelector(".site-header");
  var toggle = header && header.querySelector(".nav-toggle");
  var panel = header && header.querySelector(".nav-links-bar");
  if (!header || !toggle || !panel) return;

  var mq = window.matchMedia("(max-width: 768px)");

  function setOpen(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  function close(focusToggle) {
    var wasOpen = header.classList.contains("is-open");
    setOpen(false);
    if (focusToggle && wasOpen) toggle.focus();
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    event.preventDefault();
    close(true);
  });

  document.addEventListener("click", function (event) {
    if (!header.classList.contains("is-open")) return;
    if (header.contains(event.target)) return;
    close(false);
  });

  panel.addEventListener("click", function (event) {
    if (event.target.closest("a")) close(false);
  });

  function onViewportChange() {
    if (!mq.matches) close(false);
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onViewportChange);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(onViewportChange);
  }
})();
