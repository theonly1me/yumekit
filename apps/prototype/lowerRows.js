import { captionStyles, musicChoices, voices } from "./data.js";
import { change, escapeText, record, state } from "./state.js";
import { renderTimeline } from "./timeline.js";

const rows = [
  { id: "voice", name: "Voice", choices: voices, describe: undefined },
  {
    id: "music",
    name: "Music",
    choices: musicChoices,
    describe: "Or describe the music",
  },
  {
    id: "captions",
    name: "Captions",
    choices: captionStyles,
    describe: undefined,
  },
];

function choicesMarkup(row) {
  const current = state[row.id].choice;
  const buttons = row.choices
    .map(
      (choice) =>
        `<button type="button" data-choice="${choice}" data-row="${row.id}" aria-pressed="${choice === current}">${choice}</button>`,
    )
    .join("");
  const describe =
    row.describe === undefined
      ? ""
      : `<form class="describe" data-describe="${row.id}"><input type="text" aria-label="${row.describe}" placeholder="${row.describe}" required /><button type="submit">Use this</button></form>`;
  return `<div class="row-choices">${buttons}${describe}</div>`;
}

function rowMarkup(row) {
  const value = state[row.id];
  const open = state.openRow === row.id;
  return `
    <li class="sound-row" data-on="${value.on}">
      <span class="sound-name">${row.name}</span>
      <span class="sound-choice">${value.on ? escapeText(value.file?.name ?? value.choice) : "Off"}</span>
      <label class="switch"><input type="checkbox" data-toggle="${row.id}" ${value.on ? "checked" : ""} /> On</label>
      ${row.id === "captions" ? `<button type="button" data-open-row="${row.id}" aria-expanded="${open}">${open ? "Close" : "Change"}</button>` : `<button type="button" data-open-part="${row.id}">Open</button>`}
      ${open ? choicesMarkup(row) : ""}
    </li>`;
}

function setChoice({ rowId, choice }) {
  const row = rows.find((candidate) => candidate.id === rowId);
  record({
    text: `You changed the ${row.name.toLowerCase()} to "${choice}".`,
    apply: () => {
      state[rowId] = { on: true, choice };
      state.openRow = undefined;
    },
  });
}

export function renderLowerRows({ element }) {
  element.innerHTML = `
    <ul class="sound-rows">${rows.map(rowMarkup).join("")}</ul>
    <label class="switch timeline-switch"><input type="checkbox" data-timeline ${state.timelineOpen ? "checked" : ""} /> Detailed timeline</label>
    <div class="timeline" ${state.timelineOpen ? "" : "hidden"}></div>`;
  element.querySelectorAll("[data-toggle]").forEach((input) => {
    input.addEventListener("change", () => {
      const rowId = input.dataset.toggle;
      const row = rows.find((candidate) => candidate.id === rowId);
      record({
        text: `You turned the ${row.name.toLowerCase()} ${input.checked ? "on" : "off"}.`,
        apply: () => (state[rowId] = { ...state[rowId], on: input.checked }),
      });
    });
  });
  element.querySelectorAll("[data-open-row]").forEach((button) => {
    button.addEventListener("click", () =>
      change({
        openRow:
          state.openRow === button.dataset.openRow
            ? undefined
            : button.dataset.openRow,
      }),
    );
  });
  element.querySelectorAll("[data-open-part]").forEach((button) => {
    button.addEventListener("click", () =>
      change({ sheet: button.dataset.openPart, playing: false }),
    );
  });
  element.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () =>
      setChoice({ rowId: button.dataset.row, choice: button.dataset.choice }),
    );
  });
  element.querySelectorAll("[data-describe]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      setChoice({
        rowId: form.dataset.describe,
        choice: form.querySelector("input").value.trim(),
      });
    });
  });
  element
    .querySelector("[data-timeline]")
    .addEventListener("change", (event) =>
      change({ timelineOpen: event.target.checked }),
    );
  if (state.timelineOpen) {
    renderTimeline({ element: element.querySelector(".timeline") });
  }
}
