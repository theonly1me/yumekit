import { tones } from "./data.js";
import { change, escapeText, numberOf, record, state } from "./state.js";

const toneNames = {
  paper: "Light paper",
  ink: "Dark",
  dusk: "Warm dusk",
  ocean: "Ocean",
  moss: "Green",
};

function toneMarkup({ scene, tone }) {
  return `<button type="button" class="tone" data-tone="${tone}" aria-pressed="${scene.tone === tone}" aria-label="${toneNames[tone]}" title="${toneNames[tone]}" style="background:${tones[tone]}"></button>`;
}

export function renderScenePanel({ element, scene }) {
  const number = numberOf(scene.id);
  element.innerHTML = `
    <div class="scene-panel">
      <div class="field">
        <label for="scene-title">Name of the scene</label>
        <input type="text" id="scene-title" value="${escapeText(scene.title)}" />
      </div>
      <div class="field">
        <label for="scene-text">Text on the screen</label>
        <textarea id="scene-text" rows="3">${escapeText(scene.text)}</textarea>
      </div>
      <div class="field">
        <span class="field-label">Length</span>
        <span class="stepper">
          <button type="button" data-length-step="-1" aria-label="One second shorter">-</button>
          <span>${scene.seconds} seconds</span>
          <button type="button" data-length-step="1" aria-label="One second longer">+</button>
        </span>
      </div>
      <div class="field">
        <span class="field-label">Picture</span>
        <p class="fact">${scene.isVideo ? "This scene shows a video clip." : "This scene shows a still picture."}</p>
        <div class="tones" role="group" aria-label="Picture">${Object.keys(
          tones,
        )
          .map((tone) => toneMarkup({ scene, tone }))
          .join("")}</div>
        <div class="panel-actions">
          <button type="button" data-new-picture>Ask the AI for a new picture</button>
          <button type="button" data-make-clip>Make a real video clip</button>
        </div>
      </div>
      <p class="fact">Each change shows in the video at once. The Chat tab lists the changes, each with Undo.</p>
    </div>`;
  const commit = ({ inputId, key, label }) => {
    const input = element.querySelector(`#${inputId}`);
    input.addEventListener("change", () => {
      const value = input.value.trim();
      if (value === "" || value === scene[key]) {
        input.value = scene[key];
        return;
      }
      setTimeout(
        () =>
          record({
            text: `You changed the ${label} of scene ${number}.`,
            apply: () => (scene[key] = value),
          }),
        140,
      );
    });
  };
  commit({ inputId: "scene-title", key: "title", label: "name" });
  commit({ inputId: "scene-text", key: "text", label: "text" });
  element.querySelectorAll("[data-length-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const seconds = Math.max(
        1,
        scene.seconds + Number(button.dataset.lengthStep),
      );
      record({
        text: `You changed scene ${number} to ${seconds} seconds.`,
        apply: () => (scene.seconds = seconds),
      });
    });
  });
  element.querySelectorAll("[data-tone]").forEach((button) => {
    button.addEventListener("click", () => {
      record({
        text: `You changed the picture of scene ${number}.`,
        apply: () => (scene.tone = button.dataset.tone),
      });
    });
  });
  element.querySelector("[data-new-picture]").addEventListener("click", () => {
    const names = Object.keys(tones);
    const next = names[(names.indexOf(scene.tone) + 1) % names.length];
    record({
      text: `The AI made a new picture for scene ${number}.`,
      apply: () => (scene.tone = next),
    });
  });
  element
    .querySelector("[data-make-clip]")
    .addEventListener("click", () => change({ sheet: "clip" }));
  if (state.focusField !== undefined) {
    const field = element.querySelector(`#${state.focusField}`);
    state.focusField = undefined;
    field?.focus();
    field?.select();
  }
}
