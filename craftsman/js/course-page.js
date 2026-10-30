document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("lesson-list");
  if (!list) return;

  const course = getCourseById("electrical-safety");
  if (!course || !course.lessons.length) return;

  list.innerHTML = course.lessons
    .map((lesson) => {
      const isFirst = lesson.number === 1;
      const isAvailable = lesson.status === "available";
      const classes = [
        "lesson-list-item",
        isFirst ? "required" : "",
        isAvailable ? "available" : "locked",
      ]
        .filter(Boolean)
        .join(" ");

      const badge = isFirst
        ? '<span class="lesson-badge required">Required First</span>'
        : isAvailable
          ? '<span class="lesson-badge available">Available</span>'
          : '<span class="lesson-badge soon">Coming Soon</span>';

      const link = isAvailable && lesson.path
        ? `<a href="../../${lesson.path}" class="lesson-link">Start lesson →</a>`
        : "";

      return `
        <li class="${classes}">
          <span class="lesson-number">${lesson.number}</span>
          <div class="lesson-info">
            <h3>${lesson.title}</h3>
            <p>${lesson.subtitle}</p>
            ${link}
          </div>
          <div class="lesson-status">
            <span class="lesson-duration">${lesson.duration}</span>
            ${badge}
          </div>
        </li>
      `;
    })
    .join("");
});