/* QIC Solutions is dark mode only. Clear any old saved day/night choice and force dark. */
(function () {
  try { localStorage.removeItem("qic-theme"); } catch (e) {}
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.style.colorScheme = "dark";
})();
