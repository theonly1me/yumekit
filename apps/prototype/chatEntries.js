import { answerLimit } from "./limits.js";
import { answerQuestion } from "./projectFlow.js";
import { takes } from "./takesStore.js";
import { openTake } from "./readySignal.js";
import { change, escapeText, state, undo } from "./state.js";

function actionMarkup({ entry, index }) {
  if (entry.action === undefined) {
    return "";
  }
  return `<button type="button" class="entry-action" data-entry-action="${index}">${escapeText(entry.action.label)}</button>`;
}

function openQuestionMarkup({ entry, index }) {
  const options = entry.options
    .map(
      (option) =>
        `<button type="button" data-question="${index}" data-option="${escapeText(option)}">${escapeText(option)}</button>`,
    )
    .join("");
  return `<li class="entry ai question-entry" data-open="true"><span class="who">AI</span><div><p>${escapeText(entry.text)}</p><div class="answer-buttons" role="group" aria-label="${escapeText(entry.text)}">${options}</div><form class="own-words" data-own-answer="${index}"><input type="text" placeholder="Or in your own words" aria-label="Your own answer" /><button type="submit">Send</button></form></div></li>`;
}

function questionMarkup(entry) {
  const options = entry.options
    .map(
      (option) =>
        `<span class="answer-chip" data-chosen="${option === entry.answer}">${escapeText(option)}</span>`,
    )
    .join("");
  const ownWords = entry.options.includes(entry.answer)
    ? ""
    : `<span class="answer-chip" data-chosen="true">${escapeText(entry.answer)}</span>`;
  return `<li class="entry ai question-entry"><span class="who">AI</span><div><p>${escapeText(entry.text)}</p><div class="answer-chips">${options}${ownWords}</div></div></li>`;
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
  if (entry.kind === "question") {
    return entry.answer === undefined
      ? openQuestionMarkup({ entry, index })
      : questionMarkup(entry);
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
  element.querySelectorAll("[data-question]").forEach((button) => {
    button.addEventListener("click", () =>
      answerQuestion({
        entry: state.chat[Number(button.dataset.question)],
        answer: button.dataset.option,
      }),
    );
  });
  element.querySelectorAll("[data-own-answer]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const words = form.querySelector("input").value.trim();
      if (words !== "") {
        answerQuestion({
          entry: state.chat[Number(form.dataset.ownAnswer)],
          answer: words,
        });
      }
    });
  });
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
