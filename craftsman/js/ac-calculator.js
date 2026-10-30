function formatAcValue(value, unit, decimals = 2) {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)} M${unit}`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(decimals)} k${unit}`;
  return `${value.toFixed(decimals)} ${unit}`;
}

function calcAcPower(voltage, current, powerFactor) {
  if (!Number.isFinite(voltage) || voltage <= 0) return null;
  if (!Number.isFinite(current) || current <= 0) return null;
  if (!Number.isFinite(powerFactor) || powerFactor <= 0 || powerFactor > 1) return null;

  const apparent = voltage * current;
  const real = apparent * powerFactor;
  const reactive = apparent * Math.sin(Math.acos(powerFactor));
  const phaseAngle = Math.acos(powerFactor) * (180 / Math.PI);
  const peakVoltage = voltage * Math.SQRT2;
  const rmsFromPeak = peakVoltage / Math.SQRT2;

  return { apparent, real, reactive, phaseAngle, peakVoltage, rmsFromPeak };
}

function renderAcResults(container, result) {
  container.innerHTML = `
    <div class="calc-result-row">
      <span class="calc-result-label">Real power (P)</span>
      <span class="calc-result-value">${formatAcValue(result.real, "W")}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Apparent power (S)</span>
      <span class="calc-result-value">${formatAcValue(result.apparent, "VA")}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Reactive power (Q)</span>
      <span class="calc-result-value">${formatAcValue(result.reactive, "VAR")}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Phase angle (θ)</span>
      <span class="calc-result-value">${formatAcValue(result.phaseAngle, "°", 1)}</span>
    </div>
    <div class="calc-result-row">
      <span class="calc-result-label">Peak voltage</span>
      <span class="calc-result-value">${formatAcValue(result.peakVoltage, "V")}</span>
    </div>
  `;
}

function initAcCalculator() {
  const voltageInput = document.getElementById("ac-voltage");
  const currentInput = document.getElementById("ac-current");
  const pfInput = document.getElementById("ac-power-factor");
  const pfRange = document.getElementById("ac-pf-range");
  const results = document.getElementById("ac-calc-results");
  const tip = document.getElementById("ac-calc-tip");

  if (!voltageInput) return;

  function syncPf() {
    if (pfRange && pfInput) {
      pfRange.value = pfInput.value || 1;
      pfInput.value = pfRange.value;
    }
  }

  function calculate() {
    syncPf();
    const result = calcAcPower(
      parseFloat(voltageInput.value),
      parseFloat(currentInput.value),
      parseFloat(pfInput.value)
    );

    if (!result) {
      results.innerHTML = '<p class="calc-placeholder">Enter voltage, current, and power factor to calculate AC power values.</p>';
      tip.textContent = "";
      return;
    }

    renderAcResults(results, result);
    tip.textContent = `P = V × I × PF = ${formatAcValue(result.real, "W")}. A pure resistive load (PF = 1.0) uses all apparent power as real power. Motors typically run 0.7–0.9 PF.`;
  }

  [voltageInput, currentInput, pfInput, pfRange].forEach((el) => {
    if (el) el.addEventListener("input", calculate);
  });

  voltageInput.value = "120";
  currentInput.value = "10";
  pfInput.value = "0.85";
  if (pfRange) pfRange.value = "0.85";
  calculate();
}

function renderAcVideoGallery(filter = "all") {
  const grid = document.getElementById("ac-video-gallery");
  if (!grid) return;

  const videos = AC_VIDEOS.filter((v) => filter === "all" || v.topic === filter);

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

function initAcVideoFilters() {
  document.querySelectorAll(".ac-video-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ac-video-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderAcVideoGallery(btn.dataset.filter);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAcCalculator();
  renderAcVideoGallery();
  initAcVideoFilters();
});