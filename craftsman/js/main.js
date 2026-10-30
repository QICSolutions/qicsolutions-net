// Courses are temporarily disabled while content is reviewed.
// Cards are a non-clickable preview of upcoming topics; core-path badges are kept for styling.
const CORE_PATH_BADGES = {
  "electrical-safety": "featured",
  "dc-theory": "lesson2",
  "ac-theory": "lesson3",
  "conduit-bending": "lesson4",
};

function renderCourses(filter = "all") {
  const grid = document.getElementById("courses-grid");
  if (!grid || typeof getSortedCourses !== "function") return;

  grid.innerHTML = getSortedCourses()
    .filter((c) => filter === "all" || c.category === filter)
    .map((course) => {
      const badge = CORE_PATH_BADGES[course.id] || null;
      const badgeClass = badge ? ` course-card-${badge}` : "";

      return `
      <article class="course-card${badgeClass}" data-category="${course.category}">
        <div class="course-thumb" aria-hidden="true">${course.icon}</div>
        <div class="course-body">
          <div class="course-meta">
            <span class="course-tag">${CATEGORY_LABELS[course.category]}</span>
            <span class="course-level">${course.level}</span>
          </div>
          <h3>${course.title}</h3>
          <p>${course.description}</p>
          <div class="course-footer">
            <span class="course-duration">${course.duration}</span>
            <span class="course-soon">Coming soon</span>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

function initFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderCourses(btn.dataset.filter);
    });
  });
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-menu");
  const header = document.querySelector(".site-header");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 20);
    });
  }
}

function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    if (!input || !input.value.trim()) return;

    form.classList.add("success");
    const btn = form.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "You're on the list!";
    btn.disabled = true;
    input.value = "";

    setTimeout(() => {
      form.classList.remove("success");
      btn.textContent = originalText;
      btn.disabled = false;
    }, 4000);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCourses();
  initFilters();
  initNav();
  initSignupForm();
});