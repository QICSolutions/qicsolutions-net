/* Dark by default for everyone; only an explicit toggle choice (shared "qic-theme" key) overrides it. */
(function () {
  var theme = "dark";
  try {
    var stored = localStorage.getItem("qic-theme");
    if (stored === "light" || stored === "dark") theme = stored;
  } catch (e) {}
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
})();
