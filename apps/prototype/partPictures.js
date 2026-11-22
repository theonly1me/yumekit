import { platformOf, tones } from "./data.js";
import { escapeText, numberOf, record, sceneOf, state } from "./state.js";

const toneIds = Object.keys(tones);
const view = { sceneId: undefined, platformId: undefined, note: "" };

function pictureMarkup({ scene, platform }) {
  const own = state.ownPictures[scene.id];
  const fill =
    own === undefined
      ? `background:${tones[scene.tone]}`
      : `background:#000 url("${own.url}") center / cover`;
  const text =
    own === undefined
      ? `<span class="picture-text">${escapeText(scene.text)}</span>`
      : "";
  return `<span class="picture" data-dark="${scene.tone !== "paper" || own !== undefined}" style="aspect-ratio:${platform.width} / ${platform.height};${fill}">${text}</span>`;
}

function cardMarkup({ scene, platform }) {
  return `
    <li>
      <button type="button" class="picture-card" data-scene="${scene.id}" aria-pressed="${scene.id === view.sceneId}">
        ${pictureMarkup({ scene, platform })}
        <span>${numberOf(scene.id)}. ${escapeText(scene.title)}</span>
      </button>
    </li>`;
}

function detailMarkup({ scene, platform, locked }) {
  const off = locked ? "disabled" : "";
  const own = state.ownPictures[scene.id];
  return `
    <div class="picture-detail">
      <div class="picture-large">${pictureMarkup({ scene, platform })}</div>
      <div class="picture-controls">
        <h4>Scene ${numberOf(scene.id)}: ${escapeText(scene.title)}</h4>
        <label>Text in the picture<input type="text" data-text value="${escapeText(scene.text)}" ${off} /></label>
        <form class="describe" data-ask>
          <label>Describe a change to this picture<input type="text" placeholder="For example: a night sky, with the text at the bottom" required ${off} /></label>
          <button type="submit" ${off}>Change the picture</button>
        </form>
        <div class="part-actions">
          <label class="file-button" data-off="${locked}">Use my own picture<input type="file" accept="image/*" data-own ${off} /></label>
          ${own === undefined ? "" : `<button type="button" data-remove-own ${off}>Remove my picture</button>`}
          <button type="button" data-download>Download the picture</button>
        </div>
        <p class="fact" aria-live="polite">${escapeText(view.note)}</p>
      </div>
    </div>`;
}

function shapesMarkup() {
  if (state.platformIds.length < 2) {
    return "";
  }
  const buttons = state.platformIds
    .map((platformId) => {
      const platform = platformOf(platformId);
      return `<button type="button" data-shape="${platform.id}" aria-pressed="${platform.id === view.platformId}">${platform.name} <span>${platform.shape}</span></button>`;
    })
    .join("");
  return `<div class="segments" role="group" aria-label="Which version to show">${buttons}</div>`;
}

export function renderPictures({ element, locked }) {
  if (!state.platformIds.includes(view.platformId)) {
    view.platformId = state.platformIds[0];
  }
  const platform = platformOf(view.platformId);
  const scene = sceneOf(view.sceneId);
  const redraw = (note = "") => {
    view.note = note;
    renderPictures({ element, locked });
  };
  element.innerHTML = `
    ${shapesMarkup()}
    <ul class="picture-grid" data-shape="${platform.shape}">${state.scenes.map((each) => cardMarkup({ scene: each, platform })).join("")}</ul>
    ${scene === undefined ? `<p class="fact">Click a picture to see it large and to change it.</p>` : detailMarkup({ scene, platform, locked })}`;

  element.querySelectorAll("[data-shape]").forEach((button) => {
    button.addEventListener("click", () => {
      view.platformId = button.dataset.shape;
      redraw();
    });
  });
  element.querySelectorAll("[data-scene]").forEach((button) => {
    button.addEventListener("click", () => {
      view.sceneId =
        view.sceneId === button.dataset.scene
          ? undefined
          : button.dataset.scene;
      redraw();
    });
  });
  if (scene === undefined) {
    return;
  }
  element.querySelector("[data-text]").addEventListener("input", (event) => {
    scene.text = event.target.value;
    element.querySelectorAll(".picture-text").forEach((text) => {
      if (text.closest(".picture-large, [aria-pressed='true']")) {
        text.textContent = scene.text;
      }
    });
  });
  element.querySelector("[data-ask]").addEventListener("submit", (event) => {
    event.preventDefault();
    record({
      text: `The AI changed the picture of scene ${numberOf(scene.id)}.`,
      apply: () => {
        const next = (toneIds.indexOf(scene.tone) + 1) % toneIds.length;
        scene.tone = toneIds[next];
        delete state.ownPictures[scene.id];
      },
    });
    redraw("The AI made a new picture. Undo is in the chat of the editor.");
  });
  element.querySelector("[data-own]").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (file === undefined) {
      return;
    }
    state.ownPictures[scene.id] = {
      name: file.name,
      url: URL.createObjectURL(file),
    };
    redraw(`Scene ${numberOf(scene.id)} now uses your file ${file.name}.`);
  });
  element.querySelector("[data-remove-own]")?.addEventListener("click", () => {
    delete state.ownPictures[scene.id];
    redraw("The scene uses the picture of the AI again.");
  });
  element
    .querySelector("[data-download]")
    .addEventListener("click", () =>
      redraw("The real editor saves this picture as a PNG file."),
    );
}
