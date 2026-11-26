import { escapeText } from "./state.js";
import { bindMedia, clockOf, mediaMarkup, seek } from "./takeMedia.js";
import { whatToCheckOf } from "./takeNotes.js";
import {
  isUsedNow,
  openWithMistakes,
  pickVerdict,
  reviewOf,
  reviewTags,
  reviewVerdicts,
  toggleTag,
  verdictOf,
  writeNote,
} from "./takeReview.js";
import { changeView, itemOf, removeComment, takes } from "./takesStore.js";

const saveMilliseconds = 600;

function badgesMarkup({ item, take }) {
  const older = item.replaces === undefined ? undefined : itemOf(item.replaces);
  return [
    item.take === take.number
      ? `<span class="badge new">New in take ${take.number}</span>`
      : `<span class="badge">Approved in take ${item.take}</span>`,
    older === undefined
      ? ""
      : `<span class="badge">Replaces take ${older.take}</span>`,
    isUsedNow(item) ? `<span class="badge in-use">In use</span>` : "",
  ].join("");
}

function markKey({ comment, index }) {
  if (comment.kind === "moment") {
    return `<button type="button" class="mark-key" data-go-moment="${comment.seconds}" aria-label="Go to ${clockOf(comment.seconds)}">${clockOf(comment.seconds)}</button>`;
  }
  return `<span class="mark-key">${comment.kind === "pin" ? index + 1 : "Note"}</span>`;
}

function marksMarkup(item) {
  if (item.comments.length === 0) {
    return "";
  }
  const lines = [...item.comments.entries()]
    .map(
      ([index, comment]) => `
      <li class="mark-line">
        ${markKey({ comment, index })}
        <input type="text" id="row-mark-${item.id}-${index}" data-mark-text="${index}" value="${escapeText(comment.text)}" placeholder="${comment.kind === "moment" ? "What goes wrong here?" : "What is wrong at this pin?"}" aria-label="Words for mark ${index + 1}" />
        <button type="button" class="mark-remove" data-remove-mark="${index}">Remove</button>
      </li>`,
    )
    .join("");
  return `<ol class="mark-lines">${lines}</ol>`;
}

export function rowMarkup({ item, take }) {
  const review = reviewOf(item);
  const verdict = verdictOf(item);
  const check = whatToCheckOf(item);
  const older = item.replaces === undefined ? undefined : itemOf(item.replaces);
  const tags = [...new Set([...(reviewTags[item.kind] ?? []), ...review.tags])];
  return `
    <article class="review-row" data-item="${item.id}" data-verdict="${verdict ?? "none"}" aria-label="${escapeText(item.title)}">
      <div class="row-media">
        ${mediaMarkup({ item })}
        ${item.kind === "picture" ? `<p class="media-hint"><button type="button" class="link" data-full-size>Full size</button><span>Click the picture to pin a mistake.</span></p>` : ""}
      </div>
      <div class="review-panel">
        ${item.group === undefined ? "" : `<p class="fact">${escapeText(item.group)}</p>`}
        <h4 class="review-title">${escapeText(item.title)}</h4>
        <p class="review-badges">${badgesMarkup({ item, take })}</p>
        <p class="lead-note"><span>The lead</span>${escapeText(item.note)}</p>
        ${check === undefined ? "" : `<p class="check-line"><span>What to check</span>${escapeText(check)}</p>`}
        ${older === undefined ? "" : `<div class="use-row"><button type="button" class="link" data-compare>Compare with take ${older.take}</button></div>`}
        <div class="verdicts" role="group" aria-label="Your verdict">${reviewVerdicts
          .map(
            ([id, label]) =>
              `<button type="button" data-review-verdict="${id}" data-verdict="${id}" aria-pressed="${verdict === id}">${label}</button>`,
          )
          .join("")}</div>
        <div class="review-tags" role="group" aria-label="What is wrong">${tags
          .map(
            (tag) =>
              `<button type="button" class="review-tag" data-tag="${escapeText(tag)}" aria-pressed="${review.tags.includes(tag)}">${escapeText(tag)}</button>`,
          )
          .join("")}</div>
        ${marksMarkup(item)}
        <textarea class="review-note" id="row-note-${item.id}" data-review-note rows="2" placeholder="What is wrong, or what is good, in your words" aria-label="Your note">${escapeText(review.note)}</textarea>
        <p class="save-line" data-save-line>${review.saved === true ? "Saved" : "Saves as you type."}</p>
      </div>
    </article>`;
}

function saveLater({ row, item }) {
  const line = row.querySelector("[data-save-line]");
  line.textContent = "Saving";
  clearTimeout(item.saveTimer);
  item.saveTimer = setTimeout(() => {
    reviewOf(item).saved = true;
    line.textContent = "Saved";
  }, saveMilliseconds);
}

export function bindRow({ row, item }) {
  bindMedia({
    element: row,
    item,
    onPin: () => {
      openWithMistakes(item);
      takes.view.focusId = `row-mark-${item.id}-${item.comments.length}`;
    },
  });
  row.querySelectorAll("[data-review-verdict]").forEach((button) => {
    button.addEventListener("click", () =>
      pickVerdict({ item, verdict: button.dataset.reviewVerdict }),
    );
  });
  row.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () =>
      toggleTag({ item, tag: button.dataset.tag }),
    );
  });
  row.querySelectorAll("[data-mark-text]").forEach((input) => {
    input.addEventListener("input", () => {
      item.comments[Number(input.dataset.markText)].text = input.value;
      saveLater({ row, item });
    });
  });
  row.querySelectorAll("[data-remove-mark]").forEach((button) => {
    button.addEventListener("click", () =>
      removeComment({ item, index: Number(button.dataset.removeMark) }),
    );
  });
  row.querySelectorAll("[data-go-moment]").forEach((button) => {
    button.addEventListener("click", () =>
      seek({ item, seconds: Number(button.dataset.goMoment) }),
    );
  });
  const note = row.querySelector("[data-review-note]");
  note.addEventListener("input", () => {
    const hadVerdict = reviewOf(item).verdict !== undefined;
    writeNote({ item, text: note.value });
    saveLater({ row, item });
    if (!hadVerdict && reviewOf(item).verdict !== undefined) {
      row.dataset.verdict = "change";
      row
        .querySelector('[data-review-verdict="change"]')
        ?.setAttribute("aria-pressed", "true");
    }
  });
  row
    .querySelector("[data-full-size]")
    ?.addEventListener("click", () => changeView({ openItemId: item.id }));
  row
    .querySelector("[data-compare]")
    ?.addEventListener("click", () => changeView({ compareItemId: item.id }));
}

export function bindRows({ element, restoreFocus = true }) {
  element.querySelectorAll(".review-row").forEach((row) => {
    bindRow({ row, item: itemOf(row.dataset.item) });
  });
  const focusId = takes.view.focusId;
  if (restoreFocus && focusId !== undefined) {
    takes.view.focusId = undefined;
    document.getElementById(focusId)?.focus();
  }
}
