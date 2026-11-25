import { changes, limits, proposed, questions, screens } from "./notesText.js";

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
      <h2>Sixth pass: review each step in Takes</h2>
      <p>You made a 56 second trailer in steps, with a review at each step. This pass puts that way of working into yumekit: a template and your files at the start, the story first, chapters for a long film, and Takes, where you approve, decline, and comment on every picture, clip, and music before the next step.</p>
    </div>
    <div><h2>What changed since the fifth pass, and why</h2>${rowsMarkup(changes)}</div>
    <div><h2>Proposed by the architect. Keep or drop each one.</h2>${proposedMarkup(proposed)}</div>
    <div>
      <h2>The screens</h2>${rowsMarkup(screens)}
      <h2 class="notes-gap">Limits of this mock</h2>
      <ul class="plain-list">${limits.map((limit) => `<li>${limit}</li>`).join("")}</ul>
    </div>
    <div class="questions">
      <h2>Questions for you. Reply with one word for each.</h2>
      <ol>${questions.map(questionMarkup).join("")}</ol>
    </div>`;
}
