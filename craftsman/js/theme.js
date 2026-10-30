const THEME_KEY = "qic-theme";

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function updateThemeToggle(theme) {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const isDark = theme === "dark";
  btn.setAttribute("aria-label", isDark ? "Switch to day mode" : "Switch to night mode");
  btn.setAttribute("title", isDark ? "Day mode" : "Night mode");
  btn.setAttribute("aria-pressed", String(isDark));
  btn.classList.toggle("is-dark", isDark);
}

function setTheme(theme) {
  applyTheme(theme);
  localStorage.setItem(THEME_KEY, theme);
  updateThemeToggle(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  setTheme(current === "dark" ? "light" : "dark");
}

function createThemeToggle() {
  if (document.getElementById("theme-toggle")) return;

  const nav = document.querySelector(".nav");
  if (!nav) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "theme-toggle";
  btn.className = "theme-toggle";
  btn.innerHTML = `
    <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
    <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  `;

  nav.appendChild(btn);

  btn.addEventListener("click", toggleTheme);
}

function initTheme() {
  applyTheme(getPreferredTheme());
  createThemeToggle();
  updateThemeToggle(document.documentElement.getAttribute("data-theme") || "light");

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      setTheme(e.matches ? "dark" : "light");
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}