function formatDcValue(value, unit, decimals = 2) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)} M${unit}`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(decimals)} k${unit}`;
  if (abs < 0.001 && abs > 0) return `${(value * 1_000_000).toFixed(decimals)} µ${unit}`;
  if (abs < 1 && abs > 0) return `${(value * 1_000).toFixed(decimals)} m${unit}`;
  return `${value.toFixed(decimals)} ${unit}`;
}

function solveOhmsLaw(voltage, current, resistance) {
  const known = [voltage, current, resistance].filter((v) => Number.isFinite(v) && v > 0).length;
  if (known < 2) return null;

  let v = voltage;
  let i = current;
  let r = resistance;

  if (Number.isFinite(v) && v > 0 && Number.isFinite(i) && i > 0) {
    r = v / i;
  } else if (Number.isFinite(v) && v > 0 && Number.isFinite(r) && r > 0) {
    i = v / r;
  } else if (Number.isFinite(i) && i > 0 && Number.isFinite(r) && r > 0) {
    v = i * r;
  } else {
    return null;
  }

  const power = v * i;
  return { voltage: v, current: i, resistance: r, power };
}

function renderDcResults(container, result) {
  container.innerHTML = `
    <div class="calc-result-row">
      <span class="calc-result-label">Voltage (V)</span>
      <span class="calc-result-value">${formatDcValue(result.voltage, "V")}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Current (I)</span>
      <span class="calc-result-value">${formatDcValue(result.current, "A")}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Resistance (R)</span>
      <span class="calc-result-value">${formatDcValue(result.resistance, "Ω")}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Power (P)</span>
      <span class="calc-result-value">${formatDcValue(result.power, "W")}</span>
    </div>
  `;
}

function initDcCalculator() {
  const form = document.getElementById("dc-calculator");
  if (!form) return;

  const voltageInput = document.getElementById("dc-voltage");
  const currentInput = document.getElementById("dc-current");
  const resistanceInput = document.getElementById("dc-resistance");
  const results = document.getElementById("dc-calc-results");
  const tip = document.getElementById("dc-calc-tip");

  function parseInput(el) {
    const val = parseFloat(el.value);
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  function calculate() {
    const result = solveOhmsLaw(
      parseInput(voltageInput),
      parseInput(currentInput),
      parseInput(resistanceInput)
    );

    if (!result) {
      results.innerHTML = '<p class="calc-placeholder">Enter any two values to solve for the third — power is calculated automatically.</p>';
      tip.textContent = "";
      return;
    }

    renderDcResults(results, result);
    tip.textContent = `Ohm's Law: V = I × R → ${formatDcValue(result.voltage, "V")} = ${formatDcValue(result.current, "A")} × ${formatDcValue(result.resistance, "Ω")}. Power: P = V × I = ${formatDcValue(result.power, "W")}.`;
  }

  [voltageInput, currentInput, resistanceInput].forEach((el) => {
    el.addEventListener("input", calculate);
  });

  calculate();
}

function renderDcVideoGallery(filter = "all") {
  const grid = document.getElementById("dc-video-gallery");
  if (!grid) return;

  const videos = DC_VIDEOS.filter((v) => filter === "all" || v.topic === filter);

  grid.innerHTML = videos
    .map(
      (video) => `
      <article class="video-card">
        <div class="video-embed">
          <iframe
            src="https://www.youtube.com/embed/${video.id}"
            title="${video.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        <div class="video-card-body">
          <h3>${video.title}</h3>
          <p class="video-channel">${video.channel}</p>
          <p>${video.description}</p>
          <a href="https://www.youtube.com/watch?v=${video.id}" class="video-youtube-link" target="_blank" rel="noopener noreferrer">
            Watch on YouTube ↗
          </a>
        </div>
      </article>
    `
    )
    .join("");
}

function initDcVideoFilters() {
  const buttons = document.querySelectorAll(".dc-video-filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderDcVideoGallery(btn.dataset.filter);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initDcCalculator();
  renderDcVideoGallery();
  initDcVideoFilters();
});