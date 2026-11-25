import { artMarkup } from "./art.js";
import { platformOf, platforms } from "./data.js";
import {
  change,
  escapeText,
  numberOf,
  record,
  sceneAt,
  startOf,
  state,
  totalSeconds,
  viewScene,
} from "./state.js";

const tickMilliseconds = 100;
const view = { timer: undefined, adding: false };

function tabMarkup(platformId) {
  const platform = platformOf(platformId);
  return `<button type="button" class="tab" data-tab="${platform.id}" aria-pressed="${platform.id === state.activePlatformId}">${platform.name} <span>${platform.shape}</span></button>`;
}

function addMarkup() {
  const rest = platforms.filter(
    (platform) => !state.platformIds.includes(platform.id),
  );
  if (!view.adding) {
    return `<button type="button" class="tab add" data-add-platform>Add a platform</button>`;
  }
  const options = rest
    .map(
      (platform) =>
        `<button type="button" data-new-platform="${platform.id}">${platform.name} <span>${platform.shape}</span></button>`,
    )
    .join("");
  return `<div class="add-menu" role="group" aria-label="Add a platform">${options}<button type="button" class="link" data-add-platform>Close</button></div>`;
}

function clock(seconds) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function frameMarkup({ scene, platform }) {
  const picture = scene.picture ?? { kind: "scene", art: scene.art };
  const caption = state.captions.on
    ? `<p class="frame-caption" data-style="${state.captions.choice}">${escapeText(scene.text)}</p>`
    : "";
  return `
    <div class="frame" data-dark="true" style="--frame-width:${platform.width};--frame-height:${platform.height};aspect-ratio:${platform.width} / ${platform.height}">
      <div class="frame-art">${artMarkup(picture)}</div>
      ${scene.isVideo ? `<span class="frame-badge">Video clip</span>` : ""}
      <p class="frame-text" contenteditable="true" spellcheck="false" role="textbox" aria-label="Text of scene ${numberOf(scene.id)}. Click to change it" data-frame-text>${escapeText(scene.text)}</p>
      ${caption}
    </div>`;
}

function stopTimer() {
  clearInterval(view.timer);
  view.timer = undefined;
}

function tick(element) {
  const next = state.playheadSeconds + tickMilliseconds / 1000;
  if (next >= totalSeconds()) {
    stopTimer();
    change({
      playing: false,
      playheadSeconds: 0,
      viewSceneId: state.scenes[0].id,
    });
    return;
  }
  state.playheadSeconds = next;
  const scene = sceneAt(next);
  if (scene.id !== state.viewSceneId) {
    change({ viewSceneId: scene.id });
    return;
  }
  element.querySelector("[data-clock]").textContent =
    `${clock(next)} of ${clock(totalSeconds())}`;
  element.querySelector("[data-progress]").style.width =
    `${(next / totalSeconds()) * 100}%`;
}

export function renderPreview({ element }) {
  const scene = viewScene();
  const platform =
    platformOf(state.activePlatformId) ??
    platformOf(state.platformIds[0]) ??
    platforms[0];
  const tall = platform.height > platform.width;
  element.innerHTML = `
    <div class="platform-tabs">${state.platformIds.map(tabMarkup).join("")}${addMarkup()}</div>
    <div class="frame-area" data-tall="${tall}">${frameMarkup({ scene, platform })}</div>
    <div class="transport">
      <button type="button" data-play>${state.playing ? "Pause" : "Play"}</button>
      <div class="progress" aria-hidden="true"><i data-progress style="width:${(state.playheadSeconds / totalSeconds()) * 100}%"></i></div>
      <p class="clock" data-clock>${clock(state.playheadSeconds)} of ${clock(totalSeconds())}</p>
    </div>`;
  element.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () =>
      change({ activePlatformId: button.dataset.tab }),
    );
  });
  element.querySelectorAll("[data-add-platform]").forEach((button) => {
    button.addEventListener("click", () => {
      view.adding = !view.adding;
      renderPreview({ element });
    });
  });
  element.querySelectorAll("[data-new-platform]").forEach((button) => {
    button.addEventListener("click", () => {
      view.adding = false;
      const platformId = button.dataset.newPlatform;
      change({
        platformIds: [...state.platformIds, platformId],
        activePlatformId: platformId,
      });
    });
  });
  const frameText = element.querySelector("[data-frame-text]");
  frameText.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      frameText.blur();
    }
  });
  frameText.addEventListener("focus", () => {
    stopTimer();
    state.playing = false;
  });
  frameText.addEventListener("blur", () => {
    const text = frameText.textContent.trim();
    if (text === "" || text === scene.text) {
      frameText.textContent = scene.text;
      return;
    }
    setTimeout(
      () =>
        record({
          text: `You changed the text of scene ${numberOf(scene.id)}.`,
          apply: () => (scene.text = text),
        }),
      140,
    );
  });
  element.querySelector("[data-play]").addEventListener("click", () => {
    stopTimer();
    change({
      playing: !state.playing,
      playheadSeconds: state.playing
        ? state.playheadSeconds
        : Math.max(state.playheadSeconds, startOf(scene.id)),
    });
  });
  stopTimer();
  if (state.playing) {
    view.timer = setInterval(() => tick(element), tickMilliseconds);
  }
}
