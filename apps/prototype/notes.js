import {
  changes,
  intro,
  limits,
  proposed,
  questions,
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

function proposedMarkup(rows) {
  return rows
    .map(
      ([title, text]) =>
        `<div class="note-row"><h3>${title} <b class="proposed">Proposed</b></h3><p>${text}</p></div>`,
    )
    .join("");
}

function questionMarkup(question) {
  const words = question.words
    .map(
      ([word, meaning]) =>
        `<li><code>${word}</code><span>${meaning}</span></li>`,
    )
    .join("");
  return `<li><p>${question.text}</p><ul class="reply-words">${words}</ul></li>`;
}

export function renderNotes({ element }) {
  element.innerHTML = `
    <div class="notes-intro">
      <h2>${intro.title}</h2>
      <p>${intro.text}</p>
    </div>
    <div><h2>What moved where, and why</h2>${rowsMarkup(changes)}</div>
    <div><h2>Proposed by the architect. Keep or drop each one.</h2>${proposedMarkup(proposed)}</div>
    <div>
      <h2>The control count of each screen</h2>${rowsMarkup(screens)}
      <h2 class="notes-gap">Limits of this mock</h2>
      <ul class="plain-list">${limits.map((limit) => `<li>${limit}</li>`).join("")}</ul>
    </div>
    <div class="questions">
      <h2>Questions for you. Reply with one word for each.</h2>
      <ol>${questions.map(questionMarkup).join("")}</ol>
    </div>`;
}
