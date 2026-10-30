function formatInches(value) {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 16) / 16;
  const whole = Math.floor(rounded);
  const frac = rounded - whole;
  if (frac < 0.001) return `${whole}"`;

  const sixteenths = Math.round(frac * 16);
  if (sixteenths === 16) return `${whole + 1}"`;

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const divisor = gcd(sixteenths, 16);
  const num = sixteenths / divisor;
  const den = 16 / divisor;

  if (whole === 0) return `${num}/${den}"`;
  return `${whole} ${num}/${den}"`;
}

function calcStub90(stubHeight, conduitKey) {
  const conduit = CONDUIT_SIZES[conduitKey];
  const mark = stubHeight + conduit.deduct;
  return {
    markDistance: mark,
    deduct: conduit.deduct,
    gain: conduit.gain,
    tip: `Mark ${formatInches(mark)} from the conduit end, align the arrow on the bender, and bend to 90°.`,
  };
}

function calcOffset(offsetHeight, angle, conduitKey) {
  const angleData = BEND_ANGLES[angle];
  const distance = offsetHeight * angleData.multiplier;
  const shrink = offsetHeight * angleData.shrinkPerInch;
  return {
    distanceBetweenBends: distance,
    shrink,
    tip: `Make two ${angleData.label} bends spaced ${formatInches(distance)} apart. Conduit run shortens by ${formatInches(shrink)}.`,
  };
}

function calcBackToBack(spacing, conduitKey) {
  const conduit = CONDUIT_SIZES[conduitKey];
  const mark = spacing + conduit.deduct * 2 - conduit.gain;
  return {
    markDistance: mark,
    deductTotal: conduit.deduct * 2,
    gain: conduit.gain,
    tip: `For ${formatInches(spacing)} between 90° legs: mark first bend at ${formatInches(mark)} from end.`,
  };
}

function calcSaddle3(obstacleHeight) {
  const shrink = obstacleHeight * 0.75;
  const centerToSide = obstacleHeight * 2;
  const totalSpan = centerToSide * 2;
  return {
    shrink,
    centerToSide,
    totalSpan,
    centerAngle: "45°",
    sideAngle: "22.5°",
    tip: `3-point saddle: center bend ${formatInches(obstacleHeight)} over obstacle at 45°. Side bends at 22.5°, ${formatInches(centerToSide)} each side of center.`,
  };
}

function calcSaddle4(obstacleHeight) {
  const shrink = obstacleHeight * 1;
  const segment = obstacleHeight * 1.5;
  const totalSpan = segment * 3;
  return {
    shrink,
    segment,
    totalSpan,
    bendAngles: "30° / 60° / 60° / 30°",
    tip: `4-point saddle: four bends across ${formatInches(totalSpan)} for obstacles taller than a standard 3-point allows.`,
  };
}

function renderCalculatorResults(container, rows) {
  container.innerHTML = rows
    .map(
      ([label, value]) => `
      <div class="calc-result-row">
        <span class="calc-result-label">${label}</span>
        <span class="calc-result-value">${value}</span>
      </div>
    `
    )
    .join("");
}

function initConduitCalculator() {
  const form = document.getElementById("bend-calculator");
  if (!form) return;

  const bendType = document.getElementById("bend-type");
  const conduitSize = document.getElementById("conduit-size");
  const bendAngle = document.getElementById("bend-angle");
  const measureInput = document.getElementById("measure-input");
  const measureLabel = document.getElementById("measure-label");
  const angleGroup = document.getElementById("angle-group");
  const conduitGroup = document.getElementById("conduit-group");
  const results = document.getElementById("calc-results");
  const tip = document.getElementById("calc-tip");

  const fieldConfig = {
    stub90: { label: "Desired stub height (inches)", showAngle: false, showConduit: true },
    offset: { label: "Offset height (inches)", showAngle: true, showConduit: false },
    backtoback: { label: "Distance between 90° legs (inches)", showAngle: false, showConduit: true },
    saddle3: { label: "Obstacle height (inches)", showAngle: false, showConduit: false },
    saddle4: { label: "Obstacle height (inches)", showAngle: false, showConduit: false },
  };

  function updateFields() {
    const config = fieldConfig[bendType.value];
    measureLabel.textContent = config.label;
    angleGroup.hidden = !config.showAngle;
    conduitGroup.hidden = !config.showConduit;
    calculate();
  }

  function calculate() {
    const value = parseFloat(measureInput.value);
    if (!Number.isFinite(value) || value <= 0) {
      results.innerHTML = '<p class="calc-placeholder">Enter measurements to calculate bend marks.</p>';
      tip.textContent = "";
      return;
    }

    let output;
    switch (bendType.value) {
      case "stub90":
        output = calcStub90(value, conduitSize.value);
        renderCalculatorResults(results, [
          ["Conduit size", CONDUIT_SIZES[conduitSize.value].label],
          ["Deduct", formatInches(output.deduct)],
          ["Mark distance from end", formatInches(output.markDistance)],
          ["Gain", formatInches(output.gain)],
        ]);
        break;
      case "offset":
        output = calcOffset(value, parseFloat(bendAngle.value), conduitSize.value);
        renderCalculatorResults(results, [
          ["Bend angle", BEND_ANGLES[bendAngle.value].label],
          ["Distance between bends", formatInches(output.distanceBetweenBends)],
          ["Shrink (run loss)", formatInches(output.shrink)],
          ["Multiplier used", BEND_ANGLES[bendAngle.value].multiplier],
        ]);
        break;
      case "backtoback":
        output = calcBackToBack(value, conduitSize.value);
        renderCalculatorResults(results, [
          ["Conduit size", CONDUIT_SIZES[conduitSize.value].label],
          ["First mark from end", formatInches(output.markDistance)],
          ["Total deduct (both bends)", formatInches(output.deductTotal)],
          ["Gain", formatInches(output.gain)],
        ]);
        break;
      case "saddle3":
        output = calcSaddle3(value);
        renderCalculatorResults(results, [
          ["Center bend angle", output.centerAngle],
          ["Side bend angles", output.sideAngle],
          ["Center to each side bend", formatInches(output.centerToSide)],
          ["Total saddle span", formatInches(output.totalSpan)],
          ["Shrink", formatInches(output.shrink)],
        ]);
        break;
      case "saddle4":
        output = calcSaddle4(value);
        renderCalculatorResults(results, [
          ["Bend sequence", output.bendAngles],
          ["Spacing per segment", formatInches(output.segment)],
          ["Total saddle span", formatInches(output.totalSpan)],
          ["Shrink", formatInches(output.shrink)],
        ]);
        break;
      default:
        break;
    }

    if (output) tip.textContent = output.tip;
  }

  bendType.addEventListener("change", updateFields);
  [conduitSize, bendAngle, measureInput].forEach((el) => {
    el.addEventListener("input", calculate);
    el.addEventListener("change", calculate);
  });

  updateFields();
}

function renderVideoGallery(filter = "all") {
  const grid = document.getElementById("video-gallery");
  if (!grid) return;

  const videos = CONDUIT_VIDEOS.filter((v) => filter === "all" || v.topic === filter);

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

function initVideoFilters() {
  const buttons = document.querySelectorAll(".video-filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderVideoGallery(btn.dataset.filter);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initConduitCalculator();
  renderVideoGallery();
  initVideoFilters();
});