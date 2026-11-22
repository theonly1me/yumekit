import { voices } from "./data.js";
import { bind, fileOf, view } from "./partSound.js";
import { escapeText, numberOf, record, state } from "./state.js";

export function renderVoice({ element, locked }) {
  const off = locked ? "disabled" : "";
  const voice = state.voice;
  const redraw = (note = "") => {
    view.note = note;
    renderVoice({ element, locked });
  };
  const lines = state.scenes
    .map(
      (scene) => `
        <li class="voice-line">
          <button type="button" data-play="line-${scene.id}" aria-pressed="${view.playing === `line-${scene.id}`}">${view.playing === `line-${scene.id}` ? "Pause" : "Play"}</button>
          <label>Scene ${numberOf(scene.id)}: ${escapeText(scene.title)}<input type="text" data-line="${scene.id}" value="${escapeText(scene.other)}" ${off} /></label>
        </li>`,
    )
    .join("");
  element.innerHTML = `
    <section class="part-group"><h4>Who speaks</h4>
      <div class="segments" role="group" aria-label="Voice">
        ${voices.map((name) => `<button type="button" data-voice="${name}" aria-pressed="${voice.on && voice.choice === name}" ${off}>${name}</button>`).join("")}
      </div>
    </section>
    <section class="part-group"><h4>What the voice says</h4>
      <ul class="voice-lines">${lines}</ul>
      <div class="part-actions">
        <button type="button" class="primary" data-again ${off} ${view.linesChanged ? "" : "hidden"}>Record the changed lines again</button>
        <label class="file-button" data-off="${locked}">Use my own recording<input type="file" accept="audio/*" data-own ${off} /></label>
        <button type="button" data-download>Download the voice</button>
        <button type="button" data-remove ${off}>${voice.on ? "Remove the voice" : "Put the voice back"}</button>
      </div>
    </section>
    <p class="fact" aria-live="polite">${escapeText(view.note)}</p>`;
  bind({ element, redraw });
  element.querySelectorAll("[data-voice]").forEach((button) => {
    button.addEventListener("click", () => {
      record({
        text: `You changed the voice to "${button.dataset.voice}".`,
        apply: () => (state.voice = { on: true, choice: button.dataset.voice }),
      });
      redraw("The AI records each line again with this voice.");
    });
  });
  element.querySelectorAll("[data-line]").forEach((input) => {
    input.addEventListener("input", () => {
      state.scenes.find((scene) => scene.id === input.dataset.line).other =
        input.value;
      view.linesChanged = true;
      element.querySelector("[data-again]").hidden = false;
    });
  });
  element.querySelector("[data-again]").addEventListener("click", () => {
    view.linesChanged = false;
    redraw("The AI recorded the changed lines again.");
  });
  element.querySelector("[data-own]").addEventListener("change", (event) => {
    const file = fileOf(event);
    if (file !== undefined) {
      redraw(`The video now uses your recording ${file.name}.`);
    }
  });
  element.querySelector("[data-remove]").addEventListener("click", () => {
    record({
      text: `You turned the voice ${voice.on ? "off" : "on"}.`,
      apply: () => (state.voice = { ...voice, on: !voice.on }),
    });
    redraw();
  });
  element
    .querySelector("[data-download]")
    .addEventListener("click", () =>
      redraw("The real editor saves the voice as a sound file."),
    );
}
