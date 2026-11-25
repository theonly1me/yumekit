import { ask } from "./assistant.js";
import { agents } from "./aiTools.js";
import { bindEntries, entryMarkup } from "./chatEntries.js";
import { addFilesMarkup, bindFiles, chipsMarkup } from "./fileChips.js";
import { suggestions } from "./data.js";
import { renderScenePanel } from "./scenePanel.js";
import { change, escapeText, numberOf, pickedScene, state } from "./state.js";

function chipMarkup(scene) {
  if (scene === undefined || !state.aboutScene) {
    return "";
  }
  return `<span class="about-chip">About scene ${numberOf(scene.id)}: ${escapeText(scene.title)}<button type="button" data-remove-chip aria-label="Ask about the full video">x</button></span>`;
}

function chatMarkup() {
  const scene = pickedScene();
  const agent = agents.find((candidate) => candidate.id === state.agentId);
  return `
    <ol class="chat" aria-live="polite">
      ${[...state.chat.entries()].map(entryMarkup).join("")}
      ${state.thinking ? `<li class="entry ai thinking"><span class="who">AI</span><p>Working on it</p></li>` : ""}
    </ol>
    <div class="ask">
      <div class="suggestions">${suggestions.map((text) => `<button type="button" data-suggestion="${text}">${text}</button>`).join("")}</div>
      <form class="ask-form" id="ask-form" data-dragging="false">
        ${chipMarkup(scene)}
        <label for="ask-box" class="hidden-label">Ask for a change</label>
        <textarea id="ask-box" rows="2" placeholder="Ask for a change, or drop files here">${escapeText(state.draft)}</textarea>
        ${chipsMarkup(state.askFiles)}
        <div class="ask-foot">
          ${addFilesMarkup("ask-files")}
          <p class="fact">${agent.name} on this computer</p>
          <button type="submit" class="primary">Send</button>
        </div>
        <p class="drop-hint" aria-hidden="true">Drop the files for the lead</p>
      </form>
    </div>`;
}

function bindChat(element) {
  const scene = state.aboutScene ? pickedScene() : undefined;
  const box = element.querySelector("#ask-box");
  const send = (text) => {
    const files = state.askFiles.splice(0);
    if ((text.trim() !== "" || files.length > 0) && !state.thinking) {
      ask({ text: text.trim() || "Use these files.", scene, files });
    }
  };
  box.addEventListener("input", () => (state.draft = box.value));
  box.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(box.value);
    }
  });
  element.querySelector("#ask-form").addEventListener("submit", (event) => {
    event.preventDefault();
    send(box.value);
  });
  element.querySelectorAll("[data-suggestion]").forEach((button) => {
    button.addEventListener("click", () => send(button.dataset.suggestion));
  });
  element
    .querySelector("[data-remove-chip]")
    ?.addEventListener("click", () => change({ aboutScene: false }));
  bindEntries(element);
  bindFiles({
    zone: element.querySelector("#ask-form"),
    files: state.askFiles,
  });
  const list = element.querySelector(".chat");
  list.scrollTop = list.scrollHeight;
}

export function renderSide({ element }) {
  const scene = pickedScene();
  const tab = scene === undefined ? "chat" : state.sideTab;
  const hadFocus = document.activeElement?.id === "ask-box";
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
  body.innerHTML = chatMarkup();
  bindChat(body);
  if (hadFocus) {
    const box = body.querySelector("#ask-box");
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  }
}
