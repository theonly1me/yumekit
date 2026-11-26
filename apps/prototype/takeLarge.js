import { escapeText } from "./state.js";
import { mediaMarkup, stopPlayback, togglePlay } from "./takeMedia.js";
import { isUsedNow, pickVerdict, verdictOf } from "./takeReview.js";
import { changeView, itemOf, takes } from "./takesStore.js";

function looksRightMarkup(each) {
  return `<button type="button" class="use-this" data-looks-right="${each.id}" aria-pressed="${verdictOf(each) === "approved"}">Looks right</button>`;
}

function compareMarkup(item) {
  const older = itemOf(item.replaces);
  const column = ({ each, label }) => `
    <figure class="compare-column">
      <figcaption>${label}${isUsedNow(each) ? `<span class="badge in-use">In use</span>` : ""}${looksRightMarkup(each)}</figcaption>
      ${mediaMarkup({ item: each, large: true })}
    </figure>`;
  return `
    <div class="take-large compare" role="dialog" aria-modal="true" aria-label="Compare two takes of ${escapeText(item.title)}" data-item="${item.id}" data-close-outside>
      <div class="large-top">
        <p>${escapeText(item.title)}: take ${older.take} and take ${item.take}</p>
        <button type="button" data-close-large>Close</button>
      </div>
      <div class="compare-columns">
        ${column({ each: older, label: `Take ${older.take}` })}
        ${column({ each: item, label: `Take ${item.take}, new` })}
      </div>
    </div>`;
}

export function largeMarkup() {
  const compared = itemOf(takes.view.compareItemId);
  if (compared !== undefined) {
    return compareMarkup(compared);
  }
  const item = itemOf(takes.view.openItemId);
  if (item === undefined) {
    return "";
  }
  return `
    <div class="take-large full-size" role="dialog" aria-modal="true" aria-label="Full size of ${escapeText(item.title)}" data-item="${item.id}" data-close-outside>
      <div class="large-top" data-close-outside>
        <p>${escapeText(item.title)}</p>
        <button type="button" data-close-large>Close</button>
      </div>
      <div class="full-size-stage" data-close-outside>${mediaMarkup({ item, large: true })}</div>
    </div>`;
}

export function stepItem(step) {
  const list = takes.view.order ?? [];
  const index = list.indexOf(takes.view.openItemId);
  const next = list[Math.min(list.length - 1, Math.max(0, index + step))];
  stopPlayback();
  changeView({ openItemId: next, commentingId: undefined });
}

export function closeLarge() {
  stopPlayback();
  changeView({ openItemId: undefined, compareItemId: undefined });
}

export function bindLarge({ element }) {
  const large = element.querySelector(".take-large");
  if (large === null) {
    return;
  }
  large
    .querySelectorAll("[data-close-large]")
    .forEach((button) => button.addEventListener("click", closeLarge));
  large.addEventListener("click", (event) => {
    if (event.target.matches?.("[data-close-outside]")) {
      closeLarge();
    }
  });
  large.querySelectorAll("[data-looks-right]").forEach((button) => {
    button.addEventListener("click", () =>
      pickVerdict({
        item: itemOf(button.dataset.looksRight),
        verdict: "approved",
      }),
    );
  });
  large.querySelectorAll("[data-play]").forEach((button) => {
    const item = itemOf(button.dataset.play);
    button.addEventListener("click", () => togglePlay(item));
  });
}
