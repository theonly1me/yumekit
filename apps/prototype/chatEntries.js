import { answerLimit } from "./limits.js";
import { takes } from "./takesStore.js";
import { openTake } from "./readySignal.js";
import { change, escapeText, state, undo } from "./state.js";

function actionMarkup({ entry, index }) {
  if (entry.action === undefined) {
    return "";
  }
  return `<button type="button" class="entry-action" data-entry-action="${index}">${escapeText(entry.action.label)}</button>`;
}

function answersMarkup(entry) {
  const rows = entry.pairs
    .map(
      ([question, answer]) =>
        `<li><span>${escapeText(question)}</span>${escapeText(answer)}</li>`,
    )
    .join("");
  return `<li class="entry you answers-entry"><span class="who">You</span><details><summary>You answered ${entry.pairs.length} questions</summary><ul class="answer-list">${rows}</ul></details></li>`;
}

function limitMarkup({ entry, index }) {
  const buttons =
    entry.answer === undefined
      ? `<div class="entry-buttons"><button type="button" class="primary" data-limit="${index}" data-raise="true">Raise this project to ${entry.raiseTo} seconds</button><button type="button" data-limit="${index}" data-raise="false">Keep the limit</button></div>`
      : `<p class="fact">${escapeText(entry.answer)}</p>`;
  return `<li class="entry limit-entry"><span class="who">AI</span><div><p>${escapeText(entry.text)}</p>${buttons}</div></li>`;
}

export function entryMarkup([index, entry]) {
  if (entry.kind === "change") {
    return `
      <li class="entry change" data-undone="${entry.undone}">
        <p>${escapeText(entry.text)}</p>
        ${entry.undone ? `<span class="fact">Undone</span>` : `<button type="button" class="link" data-undo="${index}">Undo</button>`}
      </li>`;
  }
  if (entry.kind === "answers") {
    return answersMarkup(entry);
  }
  if (entry.kind === "limit") {
    return limitMarkup({ entry, index });
  }
  if (entry.kind === "take") {
    return `<li class="entry take-entry"><span class="who">AI</span><div><p>${escapeText(entry.text)}</p>${actionMarkup({ entry, index })}</div></li>`;
  }
  const about =
    entry.about === undefined
      ? ""
      : `<em>About ${escapeText(entry.about)}</em>`;
  const files =
    entry.files === undefined || entry.files.length === 0
      ? ""
      : `<em>${entry.files.length} file${entry.files.length === 1 ? "" : "s"}: ${escapeText(entry.files.map((file) => file.name).join(", "))}</em>`;
  const split =
    entry.split === undefined
      ? ""
      : `<ol class="split-list">${entry.split.map((line) => `<li>${escapeText(line)}</li>`).join("")}</ol><p>${escapeText(entry.after)}</p>`;
  return `<li class="entry ${entry.kind}"><span class="who">${entry.kind === "you" ? "You" : "AI"}</span><div><p>${about}${files}${escapeText(entry.text)}</p>${split}${actionMarkup({ entry, index })}</div></li>`;
}

function runAction(action) {
  const inProject = state.screen === "project";
  if (action.go === "takes" && inProject) {
    Object.assign(takes.view, {
      chapterId: action.chapterId,
      takeNumber: action.number,
    });
    change({ projectView: "take" });
    return;
  }
  if (action.go === "takes") {
    openTake({ chapterId: action.chapterId, number: action.number });
    return;
  }
  if (action.go === "chapters") {
    change({ screen: "editor", sheet: undefined, timelineOpen: true });
    document.querySelector(".chapter-row")?.scrollIntoView({ block: "start" });
    return;
  }
  if (inProject) {
    change({ projectView: action.go });
    return;
  }
  change({ sheet: action.go });
}

export function bindEntries(element) {
  element.querySelectorAll("[data-entry-action]").forEach((button) => {
    button.addEventListener("click", () =>
      runAction(state.chat[Number(button.dataset.entryAction)].action),
    );
  });
  element.querySelectorAll("[data-limit]").forEach((button) => {
    button.addEventListener("click", () =>
      answerLimit({
        entry: state.chat[Number(button.dataset.limit)],
        raise: button.dataset.raise === "true",
      }),
    );
  });
  element.querySelectorAll("[data-undo]").forEach((button) => {
    button.addEventListener("click", () =>
      undo(state.chat[Number(button.dataset.undo)]),
    );
  });
}
