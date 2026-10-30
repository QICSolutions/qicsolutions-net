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

// No backend yet: submitting opens the visitor's email app with a pre-filled
// message to support@qicsolutions.net so no signup is lost.
const LAUNCH_LIST_EMAIL = "support@qicsolutions.net";

function buildLaunchListMailto(email) {
  const subject = "QIC Craftsman launch list";
  const body =
    "Please add me to the QIC Craftsman launch list.\n\n" +
    "My email: " + (email || "") + "\n";
  return "mailto:" + LAUNCH_LIST_EMAIL +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
}

function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const email = input ? input.value.trim() : "";
    if (input && (!email || !input.checkValidity())) {
      input.focus();
      input.reportValidity && input.reportValidity();
      return;
    }

    form.classList.add("success");
    const btn = form.querySelector("button");
    const originalText = btn.textContent;
    btn.textContent = "Opening your email app…";
    window.location.href = buildLaunchListMailto(email);

    setTimeout(() => {
      form.classList.remove("success");
      btn.textContent = originalText;
    }, 4000);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCourses();
  initFilters();
  initNav();
  initSignupForm();
});