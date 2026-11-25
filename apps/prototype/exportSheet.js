import { chapterLength, minutesText } from "./chapters.js";
import { fileNameOf, platformOf, platforms } from "./data.js";
import { bindSizes, realText, sizeMarkup } from "./exportSize.js";
import { change, escapeText, state, totalSeconds } from "./state.js";

const run = {
  chosen: undefined,
  percents: {},
  timer: undefined,
  shown: {},
  part: "film",
  more: false,
};

function secondsOfPart() {
  return run.part === "film" ? totalSeconds() : chapterLength(run.part);
}

function partMarkup() {
  const parts = [
    ["film", "The whole film"],
    ...state.chapters.map((chapter) => [chapter.id, chapter.name]),
  ];
  return `<div class="segments" role="group" aria-label="What to export">${parts
    .map(
      ([id, name]) =>
        `<button type="button" data-part="${id}" aria-pressed="${run.part === id}" ${run.timer === undefined ? "" : "disabled"}>${escapeText(name)}</button>`,
    )
    .join("")}</div>`;
}

function rowMarkup(platformId) {
  const platform = platformOf(platformId);
  const percent = run.percents[platformId];
  const checked = run.chosen.includes(platformId);
  const done = percent === 100;
  const status =
    percent === undefined
      ? `<span class="fact">${platform.width} x ${platform.height}</span>`
      : done
        ? `<span class="export-done"><span class="real-size">${realText({ platformId, seconds: secondsOfPart() })}</span><button type="button" data-show-file="${platformId}">${run.shown[platformId] ? "In Movies/yumekit" : "Show the file"}</button></span>`
        : `<span class="progress small" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></span>`;
  return `
    <li class="export-row">
      <label><input type="checkbox" data-export="${platformId}" ${checked ? "checked" : ""} ${run.timer === undefined ? "" : "disabled"} /> ${platform.name} <em>${platform.shape}</em></label>
      <span class="export-file">${fileNameOf(platformId).replace("bell-", run.part === "film" ? "bell-" : `bell-chapter-${state.chapters.findIndex((chapter) => chapter.id === run.part) + 1}-`)}</span>
      ${status}
      ${checked && !done ? sizeMarkup({ platformId, seconds: secondsOfPart(), busy: run.timer !== undefined }) : ""}
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
      <p class="fact lead">One file for each place, in its own shape. ${minutesText(secondsOfPart())}, with voice, music, and captions.</p>
      <ul class="export-rows">${state.platformIds.map(rowMarkup).join("")}</ul>
      <details class="more" ${run.more ? "open" : ""}>
        <summary>More</summary>
        <div class="more-body">
          <h3>What to export</h3>
          ${partMarkup()}
          <h3>More places</h3>
          <div class="segments" role="group" aria-label="More places">${platforms
            .filter((platform) => !state.platformIds.includes(platform.id))
            .map(
              (platform) =>
                `<button type="button" data-add-place="${platform.id}">${platform.name}</button>`,
            )
            .join("")}</div>
        </div>
      </details>
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
  bindSizes({ element, redraw: () => renderExportSheet({ element }) });
  element.querySelector(".more").addEventListener("toggle", (event) => {
    run.more = event.target.open;
  });
  element.querySelectorAll("[data-add-place]").forEach((button) => {
    button.addEventListener("click", () => {
      const platformId = button.dataset.addPlace;
      run.chosen = [...run.chosen, platformId];
      change({ platformIds: [...state.platformIds, platformId] });
    });
  });
  element.querySelectorAll("[data-part]").forEach((button) => {
    button.addEventListener("click", () => {
      run.part = button.dataset.part;
      run.percents = {};
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
