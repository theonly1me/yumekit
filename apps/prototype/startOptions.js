import { lengths, platformOf, platforms } from "./data.js";
import { change, state } from "./state.js";

function shapeMarkup(platform) {
  const longest = Math.max(platform.width, platform.height);
  const width = Math.round((platform.width / longest) * 26);
  const height = Math.round((platform.height / longest) * 26);
  return `<span class="shape" aria-hidden="true"><i style="width:${width}px;height:${height}px"></i></span>`;
}

function platformMarkup(platform) {
  const on = state.platformIds.includes(platform.id);
  return `
    <button type="button" class="choice" data-platform="${platform.id}" aria-pressed="${on}">
      ${shapeMarkup(platform)}
      <span class="choice-name">${platform.name}<em>${platform.shape}, ${platform.width} x ${platform.height}</em></span>
    </button>`;
}

function lengthMarkup(length) {
  return `<button type="button" data-length="${length}" aria-pressed="${state.length === length}">${length}</button>`;
}

export function placesLine() {
  const names = state.platformIds
    .map((platformId) => platformOf(platformId).name)
    .join(" and ");
  const length =
    state.length === "Let the AI decide"
      ? "The lead asks about the length."
      : `About ${state.length}.`;
  return names === "" ? "Pick at least one place." : `For ${names}. ${length}`;
}

export function renderStartOptions({ element }) {
  element.innerHTML = `
    <div class="sheet-body">
      <h2>Where it goes, and how long</h2>
      <div class="start-group">
        <h3>Where will it go?</h3>
        <p class="fact">Pick one or more. You get one video for each, in its own shape.</p>
        <div class="choices">${platforms.map(platformMarkup).join("")}</div>
      </div>
      <div class="start-group">
        <h3>How long?</h3>
        <div class="segments" role="group" aria-label="Length">${lengths.map(lengthMarkup).join("")}</div>
      </div>
      <div><button type="button" class="primary" data-done-options>Done</button></div>
    </div>`;
  element.querySelectorAll("[data-platform]").forEach((button) => {
    button.addEventListener("click", () => {
      const platformId = button.dataset.platform;
      const on = state.platformIds.includes(platformId);
      const platformIds = on
        ? state.platformIds.filter((id) => id !== platformId)
        : [...state.platformIds, platformId];
      change({ platformIds, activePlatformId: platformIds[0] });
    });
  });
  element.querySelectorAll("[data-length]").forEach((button) => {
    button.addEventListener("click", () =>
      change({ length: button.dataset.length }),
    );
  });
  element
    .querySelector("[data-done-options]")
    .addEventListener("click", () => change({ sheet: undefined }));
}
