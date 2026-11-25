import {
  changes,
  intro,
  limits,
  answers,
  decided,
  screens,
} from "./notesText.js";

function rowsMarkup(rows) {
  return rows
    .map(
      ([title, text]) =>
        `<div class="note-row"><h3>${title}</h3><p>${text}</p></div>`,
    )
    .join("");
}

function answerMarkup([question, word, meaning]) {
  return `<li><p>${question}</p><ul class="reply-words"><li><code>${word}</code><span>${meaning}</span></li></ul></li>`;
}

export function renderNotes({ element }) {
  element.innerHTML = `
    <div class="notes-intro">
      <h2>${intro.title}</h2>
      <p>${intro.text}</p>
    </div>
    <div><h2>What moved where, and why</h2>${rowsMarkup(changes)}</div>
    <div><h2>Decided: the six ideas that you kept</h2>${rowsMarkup(decided)}</div>
    <div>
      <h2>The control count of each screen</h2>${rowsMarkup(screens)}
      <h2 class="notes-gap">Limits of this mock</h2>
      <ul class="plain-list">${limits.map((limit) => `<li>${limit}</li>`).join("")}</ul>
    </div>
    <div class="questions">
      <h2>Your answers, and what this pass did with them</h2>
      <ol>${answers.map(answerMarkup).join("")}</ol>
    </div>`;
}
