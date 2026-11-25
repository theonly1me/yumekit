import { renderChat } from "./chatPanel.js";
import { renderScenePanel } from "./scenePanel.js";
import { change, escapeText, numberOf, pickedScene, state } from "./state.js";

function chipMarkup(scene) {
  if (scene === undefined || !state.aboutScene) {
    return "";
  }
  return `<span class="about-chip">About scene ${numberOf(scene.id)}: ${escapeText(scene.title)}<button type="button" data-remove-chip aria-label="Ask about the full video">x</button></span>`;
}

export function renderSide({ element }) {
  const scene = pickedScene();
  const tab = scene === undefined ? "chat" : state.sideTab;
  element.innerHTML = `
    <div class="side-tabs">
      <button type="button" class="tab" data-side-tab="chat" aria-pressed="${tab === "chat"}">Chat</button>
      <button type="button" class="tab" data-side-tab="scene" aria-pressed="${tab === "scene"}" ${scene === undefined ? "disabled" : ""}>Scene${scene === undefined ? "" : ` ${numberOf(scene.id)}`}</button>
    </div>
    <div class="side-body" data-tab="${tab}"></div>`;
  element.querySelectorAll("[data-side-tab]").forEach((button) => {
    button.addEventListener("click", () =>
      change({ sideTab: button.dataset.sideTab }),
    );
  });
  const body = element.querySelector(".side-body");
  if (tab === "scene") {
    renderScenePanel({ element: body, scene });
    return;
  }
  renderChat({ element: body, prefix: "editor", chip: chipMarkup(scene) });
}
