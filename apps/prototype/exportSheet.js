import { fileNameOf, platformOf } from "./data.js";
import { state, totalSeconds } from "./state.js";

const run = { chosen: undefined, percents: {}, timer: undefined, shown: {} };

function rowMarkup(platformId) {
  const platform = platformOf(platformId);
  const percent = run.percents[platformId];
  const checked = run.chosen.includes(platformId);
  const done = percent === 100;
  const status =
    percent === undefined
      ? `<span class="fact">${platform.width} x ${platform.height}</span>`
      : done
        ? `<button type="button" data-show-file="${platformId}">${run.shown[platformId] ? "In Movies/yumekit" : "Show the file"}</button>`
        : `<span class="progress small" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></span>`;
  return `
    <li class="export-row">
      <label><input type="checkbox" data-export="${platformId}" ${checked ? "checked" : ""} ${run.timer === undefined ? "" : "disabled"} /> ${platform.name} <em>${platform.shape}</em></label>
      <span class="export-file">${fileNameOf(platformId)}</span>
      ${status}
    </li>`;
}

function headline() {
  const values = Object.values(run.percents);
  if (values.length === 0) {
    return "Export the video";
  }
  return values.every((percent) => percent === 100)
    ? "Your videos are ready"
    : "Exporting";
}

function step(element) {
  const waiting = run.chosen.find(
    (platformId) => run.percents[platformId] < 100,
  );
  if (waiting === undefined) {
    clearInterval(run.timer);
    run.timer = undefined;
  } else {
    run.percents[waiting] = Math.min(100, run.percents[waiting] + 20);
  }
  if (state.sheet === "export") {
    renderExportSheet({ element });
  }
}

export function renderExportSheet({ element }) {
  run.chosen = (run.chosen ?? state.platformIds).filter((platformId) =>
    state.platformIds.includes(platformId),
  );
  const count = run.chosen.length;
  const busy = run.timer !== undefined;
  element.innerHTML = `
    <div class="sheet-body">
      <h2 aria-live="polite">${headline()}</h2>
      <p class="fact lead">One file for each place, in its own shape. ${totalSeconds()} seconds, with voice, music, and captions.</p>
      <ul class="export-rows">${state.platformIds.map(rowMarkup).join("")}</ul>
      <div class="start-action">
        <button type="button" class="primary large" data-start-export ${count === 0 || busy ? "disabled" : ""}>${busy ? "Exporting" : `Export ${count} ${count === 1 ? "video" : "videos"}`}</button>
        <p class="fact">Files go to the Movies folder on this computer. Nothing is uploaded.</p>
      </div>
    </div>`;
  element.querySelectorAll("[data-export]").forEach((input) => {
    input.addEventListener("change", () => {
      const platformId = input.dataset.export;
      run.chosen = input.checked
        ? [...run.chosen, platformId]
        : run.chosen.filter((id) => id !== platformId);
      renderExportSheet({ element });
    });
  });
  element.querySelectorAll("[data-show-file]").forEach((button) => {
    button.addEventListener("click", () => {
      run.shown[button.dataset.showFile] = true;
      renderExportSheet({ element });
    });
  });
  element.querySelector("[data-start-export]").addEventListener("click", () => {
    run.percents = Object.fromEntries(
      run.chosen.map((platformId) => [platformId, 0]),
    );
    run.shown = {};
    run.timer = setInterval(() => step(element), 220);
    renderExportSheet({ element });
  });
}
