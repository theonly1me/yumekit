import { escapeText, say, state } from "./state.js";

const updateMilliseconds = 1600;
const tools = [
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "heading", label: "Heading" },
  { id: "list", label: "List" },
];
const messages = {
  same: "The video matches the script.",
  changed: "You changed the script. The video still follows the old script.",
  updating: "The AI updates the video to match the script.",
  updated: "The video matches the script. The AI changed 2 scenes.",
};

function firstScript() {
  const scenes = state.scenes
    .map(
      (...[scene, index]) => `
        <h2>${index + 1}. ${escapeText(scene.title)}</h2>
        <p><strong>Voice:</strong> ${escapeText(scene.other)}.</p>
        <p><strong>On screen:</strong> ${escapeText(scene.text)}</p>`,
    )
    .join("");
  return `<h1>What is yumekit</h1><p>A short video for YouTube and TikTok, with a warm voice, soft piano, and captions.</p>${scenes}`;
}

function applyTool(toolId) {
  if (toolId === "bold" || toolId === "italic") {
    document.execCommand(toolId);
    return;
  }
  if (toolId === "list") {
    document.execCommand("insertUnorderedList");
    return;
  }
  const isHeading = document.queryCommandValue("formatBlock") === "h2";
  document.execCommand("formatBlock", false, isHeading ? "p" : "h2");
}

function downloadScript(page) {
  const file = new Blob([page.innerText], { type: "text/markdown" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "script.md";
  link.click();
  URL.revokeObjectURL(link.href);
}

export function renderScript({ element, locked }) {
  state.script ??= {
    markup: firstScript(),
    saved: firstScript(),
    status: "same",
  };
  const script = state.script;
  element.innerHTML = `
    <div class="script-tools" role="toolbar" aria-label="Text style">
      ${tools.map((tool) => `<button type="button" data-tool="${tool.id}" ${locked ? "disabled" : ""}>${tool.label}</button>`).join("")}
      <button type="button" class="link" data-download>Download the script</button>
    </div>
    <div class="script-page" contenteditable="${!locked}" spellcheck="false" role="textbox" aria-multiline="true" aria-label="The script of the video">${script.markup}</div>
    <div class="script-status" aria-live="polite"></div>`;
  const page = element.querySelector(".script-page");
  const status = element.querySelector(".script-status");

  const drawStatus = () => {
    const changed = script.status === "changed";
    status.dataset.status = script.status;
    status.innerHTML = `
      <p>${messages[script.status]}</p>
      ${changed ? `<button type="button" class="primary" data-update>Update the video</button><button type="button" data-revert>Undo my changes</button>` : ""}`;
    status.querySelector("[data-update]")?.addEventListener("click", () => {
      script.status = "updating";
      drawStatus();
      setTimeout(() => {
        script.saved = script.markup;
        script.status = "updated";
        say({ kind: "ai", text: "I updated 2 scenes to match your script." });
        if (status.isConnected) {
          drawStatus();
        }
      }, updateMilliseconds);
    });
    status.querySelector("[data-revert]")?.addEventListener("click", () => {
      script.markup = script.saved;
      script.status = "same";
      page.innerHTML = script.saved;
      drawStatus();
    });
  };

  page.addEventListener("input", () => {
    script.markup = page.innerHTML;
    const next = script.markup === script.saved ? "same" : "changed";
    if (next !== script.status) {
      script.status = next;
      drawStatus();
    }
  });
  element.querySelectorAll("[data-tool]").forEach((button) => {
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      page.focus();
      applyTool(button.dataset.tool);
      page.dispatchEvent(new Event("input"));
    });
  });
  element
    .querySelector("[data-download]")
    .addEventListener("click", () => downloadScript(page));
  drawStatus();
}
