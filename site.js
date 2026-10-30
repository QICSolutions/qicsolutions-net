/* QIC Solutions — shared site behavior: theme toggle (shared with QIC Craftsman), mobile nav, footer year */
(function () {
  var THEME_KEY = "qic-theme";

  function stored() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function preferred() {
    var s = stored();
    if (s === "light" || s === "dark") return s;
    return "dark"; // default for everyone, regardless of device setting
  }
  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var isDark = theme === "dark";
    btn.setAttribute("aria-label", isDark ? "Switch to day mode" : "Switch to night mode");
    btn.setAttribute("title", isDark ? "Day mode" : "Night mode");
    btn.setAttribute("aria-pressed", String(isDark));
    btn.classList.toggle("is-dark", isDark);
  }
  function set(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    apply(theme);
  }

  function createToggle() {
    var nav = document.querySelector(".nav");
    if (!nav || document.getElementById("theme-toggle")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "theme-toggle";
    btn.className = "theme-toggle";
    btn.innerHTML =
      '<svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>' +
      '<svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    nav.appendChild(btn);
    btn.addEventListener("click", function () {
      set(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".nav-menu");
    var header = document.querySelector(".site-header");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("open");
        toggle.setAttribute("aria-expanded", String(open));
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
    if (header) {
      window.addEventListener("scroll", function () {
        header.classList.toggle("scrolled", window.scrollY > 20);
      });
    }
  }

  function init() {
    createToggle();
    apply(preferred());
    initNav();
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
