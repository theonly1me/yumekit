import { makingSteps, tones } from "./data.js";
import { change, escapeText, state } from "./state.js";

const stepMilliseconds = 1100;
const run = { timer: undefined, stepIndex: 0 };

function stepMarkup([index, step]) {
  const status =
    index < run.stepIndex ? "done" : index === run.stepIndex ? "now" : "next";
  const fact =
    status === "done" ? step.done : status === "now" ? "Working" : "";
  return `<li data-status="${status}"><span class="step-mark" aria-hidden="true"></span><span>${step.label}</span><em>${fact}</em></li>`;
}

function cardMarkup([index, scene]) {
  const shown = run.stepIndex >= 1 && index < (run.stepIndex - 1) * 2 + 3;
  if (!shown) {
    return `<li class="making-card" data-empty="true"></li>`;
  }
  return `<li class="making-card"><span class="thumb" style="background:${tones[scene.tone]}"></span><span>${escapeText(scene.title)}</span></li>`;
}

function draw(element) {
  element.innerHTML = `
    <div class="making-body">
      <p class="fact">${escapeText(state.prompt || "A short video that explains what yumekit is.")}</p>
      <h2 class="making-title" aria-live="polite">${run.stepIndex >= makingSteps.length ? "Your video is ready" : "Making your video"}</h2>
      <ol class="making-steps">${[...makingSteps.entries()].map(stepMarkup).join("")}</ol>
      <ul class="making-cards">${[...state.scenes.entries()].map(cardMarkup).join("")}</ul>
      <div class="making-action">
        <button type="button" data-stop>Stop</button>
        <p class="fact">You can stop at any time. What is made stays in the project.</p>
      </div>
    </div>`;
  element.querySelector("[data-stop]").addEventListener("click", () => {
    stopMaking();
    change({ screen: "start" });
  });
}

export function stopMaking() {
  clearInterval(run.timer);
  run.timer = undefined;
}

export function renderMaking({ element }) {
  if (run.timer !== undefined) {
    draw(element);
    return;
  }
  run.stepIndex = 0;
  draw(element);
  run.timer = setInterval(() => {
    run.stepIndex += 1;
    draw(element);
    if (run.stepIndex >= makingSteps.length) {
      stopMaking();
      setTimeout(() => {
        if (state.screen === "making") {
          change({ screen: "editor", activePlatformId: state.platformIds[0] });
        }
      }, 700);
    }
  }, stepMilliseconds);
}
