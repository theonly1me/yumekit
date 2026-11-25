import { ask } from "./assistant.js";
import { bindEntries, entryMarkup } from "./chatEntries.js";
import { bindChatEdge, chatEdgeMarkup } from "./chatResize.js";
import { addFilesMarkup, bindFiles, chipsMarkup } from "./fileChips.js";
import { bindQuestionCard, questionCardMarkup } from "./questionCard.js";
import { change, escapeText, pickedScene, state } from "./state.js";

function chatMarkup({ prefix, chip }) {
  return `
    ${chatEdgeMarkup()}
    <ol class="chat" aria-live="polite">
      ${[...state.chat.entries()].map(entryMarkup).join("")}
      ${state.thinking ? `<li class="entry ai thinking"><span class="who">AI</span><p>Working on it</p></li>` : ""}
    </ol>
    <div class="ask">
      ${questionCardMarkup()}
      <form class="ask-form" id="${prefix}-ask-form" data-dragging="false">
        ${chip}
        <label for="${prefix}-ask-box" class="hidden-label">Ask the lead</label>
        <textarea id="${prefix}-ask-box" rows="2" placeholder="Ask the lead, or drop files here">${escapeText(state.draft)}</textarea>
        ${chipsMarkup(state.askFiles)}
        <div class="ask-foot">
          ${addFilesMarkup(`${prefix}-ask-files`)}
          <button type="submit" class="primary">Send</button>
        </div>
        <p class="drop-hint" aria-hidden="true">Drop the files for the lead</p>
      </form>
    </div>`;
}

export function renderChat({ element, prefix, chip }) {
  const boxId = `${prefix}-ask-box`;
  const hadFocus = document.activeElement?.id === boxId;
  const ownFocus = document.activeElement?.id === "own-answer";
  element.innerHTML = chatMarkup({ prefix, chip });
  const scene =
    prefix === "editor" && state.aboutScene ? pickedScene() : undefined;
  const box = element.querySelector(`#${boxId}`);
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
  const form = element.querySelector(`#${prefix}-ask-form`);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    send(box.value);
  });
  element
    .querySelector("[data-remove-chip]")
    ?.addEventListener("click", () => change({ aboutScene: false }));
  bindEntries(element);
  bindQuestionCard(element);
  bindChatEdge(element);
  bindFiles({ zone: form, files: state.askFiles });
  const list = element.querySelector(".chat");
  list.scrollTop = list.scrollHeight;
  if (ownFocus) {
    const own = element.querySelector("#own-answer");
    own?.focus();
    own?.setSelectionRange(own.value.length, own.value.length);
  }
  if (hadFocus) {
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  }
}
