document.addEventListener("DOMContentLoaded", () => {
  const progressBar = document.getElementById("reading-progress");
  const tocLinks = document.querySelectorAll(".lesson-toc a");
  const sections = [...tocLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    if (progressBar) progressBar.style.width = `${pct}%`;
  }

  function updateActiveSection() {
    let current = sections[0];
    sections.forEach((section) => {
      if (section.offsetTop - 120 <= window.scrollY) {
        current = section;
      }
    });

    tocLinks.forEach((link) => {
      const active = current && link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("active", active);
    });
  }

  window.addEventListener("scroll", () => {
    updateProgress();
    updateActiveSection();
  });

  updateProgress();
  updateActiveSection();
});