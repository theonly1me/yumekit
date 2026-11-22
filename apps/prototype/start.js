import { agents } from "./aiTools.js";
import { lengths, platforms, recentProjects } from "./data.js";
import { change, escapeText, state } from "./state.js";

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

function recentMarkup(project) {
  return `<li><button type="button" class="recent" data-recent><span>${project.name}</span><em>${project.facts}</em></button></li>`;
}

export function renderStart({ element }) {
  const agent = agents.find((candidate) => candidate.id === state.agentId);
  const none = state.platformIds.length === 0;
  element.innerHTML = `
    <div class="start-body">
      <p class="wordmark">yumekit</p>
      <form class="start-form" id="start-form">
        <label class="start-question" for="start-prompt">What do you want to make?</label>
        <textarea id="start-prompt" rows="3" placeholder="A 30 second video that explains my app to new users. Friendly, with a voice and music.">${escapeText(state.prompt)}</textarea>
        <div class="start-group">
          <h2>Where will it go?</h2>
          <p class="fact">Pick one or more. You get one video for each, in its own shape.</p>
          <div class="choices">${platforms.map(platformMarkup).join("")}</div>
        </div>
        <div class="start-group">
          <h2>How long?</h2>
          <div class="segments" role="group" aria-label="Length">${lengths.map(lengthMarkup).join("")}</div>
        </div>
        <div class="start-action">
          <button type="submit" class="primary large" ${none ? "disabled" : ""}>Make the video</button>
          <p class="fact">${none ? "Pick at least one place first." : `The AI is ${agent.name} on this computer. No key needed.`} <button type="button" class="link" data-open-settings>Change</button></p>
        </div>
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
    .querySelector("[data-open-settings]")
    .addEventListener("click", () => change({ sheet: "settings" }));
  element.querySelectorAll("[data-recent]").forEach((button) => {
    button.addEventListener("click", () => change({ screen: "editor" }));
  });
  element.querySelector("#start-form").addEventListener("submit", (event) => {
    event.preventDefault();
    change({ screen: "making", prompt: state.prompt || promptBox.placeholder });
  });
}
