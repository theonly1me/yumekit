import { secondsText, spentText } from "./limits.js";
import { askForNotices } from "./readySignal.js";
import { notify, state } from "./state.js";

function stepperMarkup({ scope, field, unit }) {
  const value = state.limits[scope][field];
  const step = field === "dollars" ? 10 : 30;
  const shown = field === "dollars" ? `$${value}` : `${value} seconds`;
  return `
    <span class="stepper">
      <button type="button" data-limit="${scope}.${field}" data-step="-${step}" aria-label="${step} ${unit} less">-</button>
      <span>${shown}</span>
      <button type="button" data-limit="${scope}.${field}" data-step="${step}" aria-label="${step} ${unit} more">+</button>
    </span>`;
}

function rowsMarkup(scope) {
  return `
    <div class="setting-row"><span>Money<em>The lead stops and asks when a project reaches it.</em></span>${stepperMarkup({ scope, field: "dollars", unit: "dollars" })}</div>
    <div class="setting-row"><span>Seconds of real video<em>Clips from a video model count. Pictures and drawn scenes do not.</em></span>${stepperMarkup({ scope, field: "seconds", unit: "seconds" })}</div>`;
}

function switchMarkup({ field, label, note }) {
  return `<label class="switch setting-check"><input type="checkbox" data-switch="${field}" ${state.limits[field] ? "checked" : ""} /> <span>${label}<em>${note}</em></span></label>`;
}

export function limitsMarkup() {
  return `
    <section class="setting-group">
      <h3>Limits for every project</h3>
      <p class="fact">Set these once. Each new project uses them, so you do not raise a limit for each project.</p>
      ${rowsMarkup("every")}
      <label class="switch setting-check"><input type="checkbox" data-switch="own" ${state.limits.own ? "checked" : ""} /> Use other limits for this project</label>
      ${state.limits.own ? `<div class="own-limits">${rowsMarkup("project")}</div>` : ""}
      <p class="spend-line">${spentText()}. ${secondsText()}.</p>
    </section>`;
}

function checksMarkup() {
  const choices = [
    ["draft", "Fast draft", "One hard check: the design of each character."],
    ["careful", "Careful", "A second AI checks each picture and clip."],
  ];
  return `<div class="setting-row"><span>How the AI checks the film<em>${choices.find(([id]) => id === state.checks)[2]}</em></span><span class="segments" role="group" aria-label="How the AI checks the film">${choices.map(([id, name]) => `<button type="button" data-checks="${id}" aria-pressed="${state.checks === id}">${name}</button>`).join("")}</span></div>`;
}

export function leadWorkMarkup() {
  return `
    <section class="setting-group">
      <h3>How the lead works</h3>
      ${switchMarkup({ field: "approveFirst", label: "Approve pictures before clips", note: "Clips cost the most. The lead makes them only from pictures that you approved. Turn it off for a quick draft." })}
      ${checksMarkup()}
      ${switchMarkup({ field: "readySignal", label: "Ring and show a notice when a take is ready", note: "Your browser asks once if yumekit may show notices." })}
    </section>`;
}

export function bindLimits(element) {
  element.querySelectorAll("[data-checks]").forEach((button) => {
    button.addEventListener("click", () => {
      state.checks = button.dataset.checks;
      notify();
    });
  });
  element.querySelectorAll("[data-limit]").forEach((button) => {
    button.addEventListener("click", () => {
      const [scope, field] = button.dataset.limit.split(".");
      const floor = field === "dollars" ? 10 : 30;
      state.limits[scope][field] = Math.max(
        floor,
        state.limits[scope][field] + Number(button.dataset.step),
      );
      notify();
    });
  });
  element.querySelectorAll("[data-switch]").forEach((input) => {
    input.addEventListener("change", () => {
      const field = input.dataset.switch;
      state.limits[field] = input.checked;
      if (field === "own" && input.checked) {
        state.limits.project = { ...state.limits.every };
      }
      if (field === "readySignal" && input.checked) {
        askForNotices();
      }
      notify();
    });
  });
}
