import { makingSteps } from "./data.js";
import { renderPart } from "./parts.js";
import { change, escapeText, state } from "./state.js";

const stepMilliseconds = 1700;
const run = { timer: undefined, stepIndex: 0, partId: undefined };

function isWorking() {
  return run.stepIndex < makingSteps.length;
}

function stepMarkup([index, step]) {
  if (index >= run.stepIndex) {
    const status = index === run.stepIndex ? "now" : "next";
    return `<li data-status="${status}"><span class="step-row"><span class="step-mark" aria-hidden="true"></span><span>${step.label}</span><em>${status === "now" ? "Working" : ""}</em></span></li>`;
  }
  const open = run.partId === step.id;
  return `
    <li data-status="done" data-open="${open}">
      <button type="button" class="step-row" data-part="${step.id}" aria-pressed="${open}">
        <span class="step-mark" aria-hidden="true"></span><span>${step.label}</span><em>${step.done}</em>
        <span class="step-see">${open ? "Open now" : "See and change"}</span>
      </button>
    </li>`;
}

function drawPart(element) {
  const pane = element.querySelector(".making-part");
  if (run.partId === undefined) {
    pane.innerHTML = `<p class="fact lead making-wait">When a step is done, you can open it here. You can read the script, see each picture, and listen to the voice and the music. You can change each of them.</p>`;
    return;
  }
  renderPart({ element: pane, partId: run.partId, locked: isWorking() });
}

function drawSteps(element) {
  const working = isWorking();
  element.querySelector(".making-title").textContent = working
    ? "Making your video"
    : "Your video is ready";
  element.querySelector(".making-steps").innerHTML = [...makingSteps.entries()]
    .map(stepMarkup)
    .join("");
  element.querySelector(".making-action").innerHTML = working
    ? `<button type="button" data-stop>Stop</button><p class="fact">You can stop at any time. What is made stays in the project.</p>`
    : `<button type="button" class="primary large" data-editor>Open the editor</button><p class="fact">Or open a step to check it first.</p>`;
  element.querySelectorAll("[data-part]").forEach((button) => {
    button.addEventListener("click", () => {
      run.partId = button.dataset.part;
      drawSteps(element);
      drawPart(element);
    });
  });
  element.querySelector("[data-stop]")?.addEventListener("click", () => {
    stopMaking();
    run.stepIndex = makingSteps.length;
    drawSteps(element);
    drawPart(element);
  });
  element
    .querySelector("[data-editor]")
    ?.addEventListener("click", () =>
      change({ screen: "editor", activePlatformId: state.platformIds[0] }),
    );
}

export function stopMaking() {
  clearInterval(run.timer);
  run.timer = undefined;
}

export function renderMaking({ element }) {
  stopMaking();
  run.stepIndex = 0;
  run.partId = undefined;
  element.innerHTML = `
    <div class="making-body">
      <p class="fact">${escapeText(state.prompt || "A short video that explains what yumekit is.")}</p>
      <h2 class="making-title" aria-live="polite"></h2>
      <div class="making-desk">
        <div class="making-side">
          <ol class="making-steps"></ol>
          <div class="making-action"></div>
        </div>
        <div class="making-part"></div>
      </div>
    </div>`;
  drawSteps(element);
  drawPart(element);
  run.timer = setInterval(() => {
    run.stepIndex += 1;
    if (run.partId === undefined) {
      run.partId = makingSteps[0].id;
    }
    if (!isWorking()) {
      stopMaking();
    }
    drawSteps(element);
    const typing = element
      .querySelector(".making-part")
      .contains(document.activeElement);
    if (!typing || !isWorking()) {
      drawPart(element);
    }
  }, stepMilliseconds);
}
