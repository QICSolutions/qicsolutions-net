/* QIC Craftsman is dark mode only (no day/night toggle). Kept so existing <script> tags keep working. */
(function () {
  document.documentElement.setAttribute("data-theme", "dark");
  document.documentElement.style.colorScheme = "dark";
  var old = document.getElementById("theme-toggle");
  if (old) old.remove();
})();
