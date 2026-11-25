import { recentProjects } from "./data.js";
import { addFilesMarkup, bindFiles, chipsMarkup } from "./fileChips.js";
import { startProject, showSampleProject } from "./projectFlow.js";
import { change, escapeText, state } from "./state.js";
import { placesLine } from "./startOptions.js";
import { howToLine, templates } from "./templates.js";

function recentMarkup(project) {
  return `<li><button type="button" class="recent" data-recent><span>${project.name}</span><em>${project.facts}</em></button></li>`;
}

function templateMarkup(template) {
  return `<button type="button" class="template-chip" data-template="${template.id}" aria-pressed="${state.templateId === template.id}">${template.name}</button>`;
}

export function renderStart({ element }) {
  const none = state.platformIds.length === 0;
  element.innerHTML = `
    <div class="start-body">
      <div class="start-top">
        <p class="wordmark">yumekit</p>
        <button type="button" data-open-settings>Settings</button>
      </div>
      <form class="start-form" id="start-form">
        <label class="start-question" for="start-prompt">What do you want to make?</label>
        <div class="template-chips" role="group" aria-label="Start from">${templates.map(templateMarkup).join("")}</div>
        <div class="prompt-box" data-dragging="false">
          <textarea id="start-prompt" rows="${state.templateId === undefined ? 4 : 7}" placeholder="Describe it. A rough story is enough.">${escapeText(state.prompt)}</textarea>
          ${chipsMarkup(state.startFiles)}
          <div class="prompt-foot">
            ${addFilesMarkup("start-files")}
            <button type="submit" class="primary" ${none ? "disabled" : ""}>Start</button>
          </div>
          <p class="drop-hint" aria-hidden="true">Drop the files for the lead</p>
        </div>
        <p class="how-to">${howToLine}</p>
        <p class="fact">${placesLine()} <button type="button" class="link" data-start-options>Change</button></p>
      </form>
      <div class="start-group recent-group">
        <h2>Recent projects</h2>
        <ul class="recent-list">${recentProjects.map(recentMarkup).join("")}</ul>
      </div>
    </div>`;
  const promptBox = element.querySelector("#start-prompt");
  promptBox.addEventListener("input", () => {
    state.prompt = promptBox.value;
  });
  bindFiles({
    zone: element.querySelector(".prompt-box"),
    files: state.startFiles,
  });
  element.querySelectorAll("[data-template]").forEach((button) => {
    button.addEventListener("click", () => {
      const template = templates.find(
        (candidate) => candidate.id === button.dataset.template,
      );
      const same = state.templateId === template.id;
      change({
        templateId: same ? undefined : template.id,
        prompt: same ? "" : template.guide,
        length: same ? "Let the AI decide" : template.length,
      });
      const box = element.querySelector("#start-prompt");
      box.focus();
      const firstGap = box.value.indexOf(": \n");
      box.setSelectionRange(firstGap + 2, firstGap + 2);
    });
  });
  element
    .querySelector("[data-open-settings]")
    .addEventListener("click", () => change({ sheet: "settings" }));
  element
    .querySelector("[data-start-options]")
    .addEventListener("click", () => change({ sheet: "start-options" }));
  element.querySelectorAll("[data-recent]").forEach((button) => {
    button.addEventListener("click", showSampleProject);
  });
  element.querySelector("#start-form").addEventListener("submit", (event) => {
    event.preventDefault();
    startProject();
  });
}
