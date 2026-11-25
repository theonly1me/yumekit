import { escapeText } from "./state.js";
import {
  badgesMarkup,
  bindItem,
  checkMarkup,
  commentsMarkup,
  verdictMarkup,
} from "./takeCard.js";
import {
  frameSeconds,
  mediaMarkup,
  playerOf,
  seek,
  stopPlayback,
} from "./takeMedia.js";
import { whatToCheckOf } from "./takeNotes.js";
import { changeView, itemOf, takes } from "./takesStore.js";

const rates = [0.25, 0.5, 1];

function toolsMarkup(item) {
  if (item.kind !== "clip" && item.kind !== "cut") {
    return `<p class="fact">Click the picture to pin a point. Each pin gets its own words.</p>`;
  }
  const rate = playerOf(item).rate;
  const speeds = rates
    .map(
      (each) =>
        `<button type="button" data-rate="${each}" aria-pressed="${each === rate}">${each} x</button>`,
    )
    .join("");
  return `
    <div class="large-tools">
      <button type="button" data-frame="-1">One frame back</button>
      <button type="button" data-frame="1">One frame on</button>
      <span class="segments" role="group" aria-label="Speed">${speeds}</span>
    </div>`;
}

function simpleMarkup(item) {
  const older = itemOf(item.replaces);
  const label =
    item.kind === "music"
      ? item.verdict === "approved"
        ? "In use"
        : "Use this one"
      : item.verdict === "declined"
        ? "Use this one again"
        : "Don't use this one";
  return `
    <div class="simple-actions">
      <button type="button" data-dont-use data-kind="${item.kind}" aria-pressed="${item.kind === "music" ? item.verdict === "approved" : item.verdict === "declined"}">${label}</button>
      ${older === undefined ? "" : `<button type="button" class="link" data-compare>Compare with take ${older.take}</button>`}
    </div>`;
}

function panelMarkup({ item, take }) {
  const check = whatToCheckOf(item);
  return `
    <aside class="large-panel">
      ${item.group === undefined ? "" : `<p class="fact">${escapeText(item.group)}</p>`}
      <h3>${escapeText(item.title)}</h3>
      <div class="large-badges">${badgesMarkup({ item, take })}${checkMarkup(item)}</div>
      <p class="lead-note"><span>The lead</span>${escapeText(item.note)}</p>
      ${check === undefined ? "" : `<p class="check-line"><span>What to check</span>${escapeText(check)}</p>`}
      ${takes.view.simple === true ? simpleMarkup(item) : verdictMarkup(item)}
      ${commentsMarkup({ item, scope: "large" })}
      <p class="large-keys">${takes.view.simple === true ? "Keys: C to write a note, D for Don't use this one, arrows for the next item, Esc to close." : "Keys: A approve, D decline, C comment, arrows for the next item, Esc to close."}${item.kind === "picture" ? "" : " Space plays, comma and period step one frame."}</p>
    </aside>`;
}

function compareMarkup(item) {
  const older = itemOf(item.replaces);
  const column = ({ each, label }) => `
    <figure class="compare-column">
      <figcaption>${label}</figcaption>
      ${mediaMarkup({ item: each, large: true })}
    </figure>`;
  return `
    <div class="take-large compare" role="dialog" aria-modal="true" aria-label="Compare two takes of ${escapeText(item.title)}" data-item="${item.id}">
      <div class="large-top">
        <p>${escapeText(item.title)}: take ${older.take} and take ${item.take}</p>
        <button type="button" data-close-large>Close</button>
      </div>
      <div class="compare-columns">
        ${column({ each: older, label: `Take ${older.take}, ${older.verdict}` })}
        ${column({ each: item, label: `Take ${item.take}, new` })}
      </div>
      <div class="compare-foot">${takes.view.simple === true ? simpleMarkup(item) : verdictMarkup(item)}</div>
    </div>`;
}

export function largeMarkup(take) {
  const compared = itemOf(takes.view.compareItemId);
  if (compared !== undefined) {
    return compareMarkup(compared);
  }
  const item = itemOf(takes.view.openItemId);
  if (item === undefined) {
    return "";
  }
  const list = takes.view.order ?? [];
  const position = list.indexOf(item.id) + 1;
  return `
    <div class="take-large" role="dialog" aria-modal="true" aria-label="Large view of ${escapeText(item.title)}" data-item="${item.id}">
      <div class="large-top">
        <p>${position} of ${list.length}</p>
        <button type="button" data-step-item="-1">Previous</button>
        <button type="button" data-step-item="1">Next</button>
        <button type="button" data-close-large>Close</button>
      </div>
      <div class="large-body">
        <div class="large-media">${mediaMarkup({ item, large: true })}${toolsMarkup(item)}</div>
        ${panelMarkup({ item, take })}
      </div>
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
  const item = itemOf(large.dataset.item);
  bindItem({ element: large, item, scope: "large" });
  large
    .querySelectorAll("[data-close-large]")
    .forEach((button) => button.addEventListener("click", closeLarge));
  large.querySelectorAll("[data-step-item]").forEach((button) => {
    button.addEventListener("click", () =>
      stepItem(Number(button.dataset.stepItem)),
    );
  });
  large.querySelectorAll("[data-frame]").forEach((button) => {
    button.addEventListener("click", () => {
      stopPlayback();
      const step = Number(button.dataset.frame) * frameSeconds;
      seek({ item, seconds: playerOf(item).seconds + step });
    });
  });
  large.querySelectorAll("[data-rate]").forEach((button) => {
    button.addEventListener("click", () => {
      playerOf(item).rate = Number(button.dataset.rate);
      large.querySelectorAll("[data-rate]").forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
    });
  });
}
