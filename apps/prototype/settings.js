import { agents, mediaTools } from "./aiTools.js";
import { bindKeyGuide, keyGuideMarkup } from "./keyGuide.js";
import { bindLimits, leadWorkMarkup, limitsMarkup } from "./settingsLimits.js";
import { change, notify, state } from "./state.js";

const view = { openToolId: undefined, more: false };

function agentMarkup(agent) {
  const inUse = agent.id === state.agentId;
  const action = !agent.found
    ? `<span class="fact">Not found on this computer</span>`
    : inUse
      ? `<span class="in-use">In use</span>`
      : `<button type="button" data-use-agent="${agent.id}">Use this</button>`;
  return `<li class="setting-row"><span>${agent.name}<em>${agent.found ? "Found on this computer. Uses the plan you already pay for." : "Install it, then open Settings again."}</em></span>${action}</li>`;
}

function toolStateText(tool) {
  if (tool.steps === undefined) {
    return "Ready, no key needed";
  }
  return state.keys[tool.id] ? "Ready, key saved here" : "Needs a key";
}

function toolDetailMarkup(tool) {
  if (tool.steps === undefined) {
    return `<div class="key-guide"><p class="fact">This tool runs on this computer and needs no key.</p></div>`;
  }
  if (state.keys[tool.id]) {
    return `<div class="key-guide"><p class="fact">The ${tool.keyName} is saved on this computer.</p><button type="button" data-remove-key="${tool.id}">Remove the key</button></div>`;
  }
  return keyGuideMarkup({ tool, saveLabel: "Save the key" });
}

function toolMarkup(tool) {
  const open = view.openToolId === tool.id;
  return `
    <li class="tool" data-ready="${tool.steps === undefined || state.keys[tool.id]}">
      <button type="button" class="tool-head" data-toggle-tool="${tool.id}" aria-expanded="${open}">
        <span>${tool.name}<em>${tool.makes}</em></span>
        <span class="tool-state">${toolStateText(tool)}</span>
      </button>
      ${open ? toolDetailMarkup(tool) : ""}
    </li>`;
}

export function renderSettings({ element }) {
  element.innerHTML = `
    <div class="sheet-body">
      <h2>Settings</h2>
      <section class="setting-group">
        <h3>Who makes the film</h3>
        <p class="fact">The lead is an AI app on this computer. It uses the plan you already pay for.</p>
        <ul class="setting-rows">${agents.map(agentMarkup).join("")}</ul>
        <div class="setting-row"><span>Model of the lead<em>The default model is the most careful. A faster one costs less time.</em></span><span class="segments" role="group" aria-label="Model of the lead">${["Default", "Faster"].map((name) => `<button type="button" data-model="${name}" aria-pressed="${state.model === name}">${name}</button>`).join("")}</span></div>
      </section>
      ${limitsMarkup()}
      <details class="more" ${view.more ? "open" : ""}>
        <summary>More settings</summary>
        <section class="setting-group">
          <h3>Media services and keys</h3>
          <p class="fact">Each service makes pictures, voice, music, or video with your own account. yumekit asks for a key only when you first use one.</p>
          <ul class="setting-rows">${mediaTools.map(toolMarkup).join("")}</ul>
        </section>
        ${leadWorkMarkup()}
      </details>
    </div>`;
  element.querySelectorAll("[data-use-agent]").forEach((button) => {
    button.addEventListener("click", () =>
      change({ agentId: button.dataset.useAgent }),
    );
  });
  element.querySelectorAll("[data-toggle-tool]").forEach((button) => {
    button.addEventListener("click", () => {
      view.openToolId =
        view.openToolId === button.dataset.toggleTool
          ? undefined
          : button.dataset.toggleTool;
      renderSettings({ element });
    });
  });
  element.querySelectorAll("[data-remove-key]").forEach((button) => {
    button.addEventListener("click", () => {
      state.keys[button.dataset.removeKey] = false;
      notify();
    });
  });
  bindLimits(element);
  element.querySelector(".more").addEventListener("toggle", (event) => {
    view.more = event.target.open;
  });
  element.querySelectorAll("[data-model]").forEach((button) => {
    button.addEventListener("click", () =>
      change({ model: button.dataset.model }),
    );
  });
  bindKeyGuide({ element });
}
