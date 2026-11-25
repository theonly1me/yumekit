import { clipLengths, priceText, toolOf, videoModels } from "./aiTools.js";
import { bindKeyGuide, keyGuideMarkup } from "./keyGuide.js";
import {
  projectLimits,
  raiseProject,
  raisedSecondsFor,
  roomFor,
  usedSeconds,
} from "./limits.js";
import {
  change,
  escapeText,
  numberOf,
  pickedScene,
  record,
  state,
  viewScene,
} from "./state.js";

const choice = {
  modelId: "omni",
  seconds: 5,
  percent: undefined,
  timer: undefined,
  sceneId: undefined,
  prompt: "",
};

function modelMarkup(model) {
  const tool = toolOf(model.tool);
  const ready = state.keys[tool.id];
  return `
    <label class="model">
      <input type="radio" name="model" value="${model.id}" ${model.id === choice.modelId ? "checked" : ""} />
      <span class="model-name">${model.name}<em>${tool.name}. ${model.note}</em></span>
      <span class="model-price" data-ready="${ready}">${ready ? priceText({ model, seconds: choice.seconds }) : "Needs a key"}</span>
    </label>`;
}

function actionMarkup({ model, scene }) {
  const tool = toolOf(model.tool);
  const price = priceText({ model, seconds: choice.seconds });
  if (choice.percent !== undefined) {
    return `
      <p class="clip-price">Making the clip</p>
      <div class="progress wide" role="progressbar" aria-valuenow="${choice.percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${choice.percent}%"></i></div>
      <p class="fact">${choice.percent} percent. You can close this. The clip goes into scene ${numberOf(scene.id)} when it is ready.</p>`;
  }
  if (!state.keys[tool.id]) {
    return `
      <p class="clip-price">${tool.name} needs a key</p>
      <p class="fact">Add it once. It takes about two minutes. Then this clip costs ${price.toLowerCase()}.</p>
      ${keyGuideMarkup({ tool, saveLabel: "Save the key and continue" })}`;
  }
  if (!roomFor(choice.seconds)) {
    return `
      <p class="clip-price">Over the limit of this project</p>
      <p class="fact">This project has used ${usedSeconds()} of ${projectLimits().seconds} seconds of real video. Pick a shorter clip, or raise the limit of this project.</p>
      <button type="button" data-raise-limit>Raise this project to ${raisedSecondsFor(choice.seconds)} seconds</button>`;
  }
  return `
    <p class="clip-price">${price}</p>
    <p class="fact">${choice.seconds} seconds with ${model.name}. This project has used ${usedSeconds()} of ${projectLimits().seconds} seconds of real video.</p>
    <button type="button" class="primary large" data-start-clip>Make the clip</button>`;
}

function finish({ scene, model }) {
  clearInterval(choice.timer);
  choice.timer = undefined;
  choice.percent = undefined;
  record({
    text: `The AI made a ${choice.seconds} second video clip with ${model.name} and put it in scene ${numberOf(scene.id)}.`,
    apply: () => {
      scene.isVideo = true;
      scene.tone = scene.tone === "ocean" ? "dusk" : "ocean";
      scene.seconds = choice.seconds;
      state.extraSeconds += choice.seconds;
      state.sheet = undefined;
      state.viewSceneId = scene.id;
    },
  });
}

export function renderClipSheet({ element }) {
  const scene = pickedScene() ?? viewScene();
  if (choice.sceneId !== scene.id) {
    choice.sceneId = scene.id;
    choice.prompt = `${scene.text}. Slow camera move, natural light.`;
  }
  const model = videoModels.find(
    (candidate) => candidate.id === choice.modelId,
  );
  const lengthButtons = clipLengths
    .map(
      (seconds) =>
        `<button type="button" data-seconds="${seconds}" aria-pressed="${seconds === choice.seconds}">${seconds} seconds</button>`,
    )
    .join("");
  element.innerHTML = `
    <div class="sheet-body wide" id="clip-form">
      <h2>Make a real video clip</h2>
      <p class="fact lead">For scene ${numberOf(scene.id)}: ${escapeText(scene.title)}. A video model makes moving video from your words.</p>
      <div class="clip-columns">
        <div class="clip-column">
          <div class="field">
            <label for="clip-prompt">What happens in the clip</label>
            <textarea id="clip-prompt" rows="3">${escapeText(choice.prompt)}</textarea>
          </div>
          <fieldset class="models"><legend>Model</legend>${videoModels.map(modelMarkup).join("")}</fieldset>
        </div>
        <div class="clip-column">
          <div class="field"><span class="field-label">Length</span><div class="segments" role="group" aria-label="Length">${lengthButtons}</div></div>
          <div class="clip-action">${actionMarkup({ model, scene })}</div>
        </div>
      </div>
    </div>`;
  const rerender = () => renderClipSheet({ element });
  element
    .querySelector("#clip-prompt")
    .addEventListener("input", (event) => (choice.prompt = event.target.value));
  element.querySelectorAll('input[name="model"]').forEach((input) => {
    input.addEventListener("change", () => {
      choice.modelId = input.value;
      rerender();
    });
  });
  element.querySelectorAll("[data-seconds]").forEach((button) => {
    button.addEventListener("click", () => {
      choice.seconds = Number(button.dataset.seconds);
      rerender();
    });
  });
  element.querySelector("[data-raise-limit]")?.addEventListener("click", () => {
    raiseProject(raisedSecondsFor(choice.seconds));
    change({});
  });
  bindKeyGuide({ element });
  element.querySelector("[data-start-clip]")?.addEventListener("click", () => {
    if (choice.timer !== undefined) {
      return;
    }
    choice.percent = 0;
    rerender();
    choice.timer = setInterval(() => {
      choice.percent += 10;
      if (choice.percent >= 100) {
        finish({ scene, model });
        return;
      }
      if (state.sheet === "clip") {
        renderClipSheet({ element });
      }
    }, 300);
  });
}
