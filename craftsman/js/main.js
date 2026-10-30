const CORE_PATH_COURSES = {
  "electrical-safety": {
    href: "courses/electrical-safety/index.html",
    linkText: "Start Lesson 1 →",
    badge: "featured",
  },
  "dc-theory": {
    href: "courses/dc-theory/lesson-2-dc-theory.html",
    linkText: "Start Lesson 2 →",
    badge: "lesson2",
  },
  "ac-theory": {
    href: "courses/ac-theory/lesson-3-ac-theory.html",
    linkText: "Start Lesson 3 →",
    badge: "lesson3",
  },
  "conduit-bending": {
    href: "courses/conduit-bending/lesson-4-conduit-bending.html",
    linkText: "Start Lesson 4 →",
    badge: "lesson4",
  },
};

function getCourseLink(course) {
  if (CORE_PATH_COURSES[course.id]) {
    return CORE_PATH_COURSES[course.id];
  }
  if (course.requiresLesson) {
    return {
      href: "courses/electrical-safety/lesson-1-safety-first.html",
      linkText: "Complete Safety First →",
      badge: null,
    };
  }
  return { href: "#contact", linkText: "Coming Soon →", badge: null };
}

function renderCourses(filter = "all") {
  const grid = document.getElementById("courses-grid");
  if (!grid || typeof getSortedCourses !== "function") return;

  grid.innerHTML = getSortedCourses()
    .filter((c) => filter === "all" || c.category === filter)
    .map((course) => {
      const { href, linkText, badge } = getCourseLink(course);
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
            <a href="${href}" class="course-link">${linkText}</a>
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