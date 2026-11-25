import { artMarkup } from "./art.js";
import { chapterNumber, chapterOf, progressText } from "./leadWork.js";
import { escapeText } from "./state.js";
import { sections } from "./takeHead.js";
import { bindTakeKeys } from "./takeKeys.js";
import { bindLarge, largeMarkup } from "./takeLarge.js";
import {
  changeView,
  itemsOf,
  shownTake,
  stepNames,
  takes,
  takesOf,
} from "./takesStore.js";

function isFresh({ item, take }) {
  return item.take === take.number || item.verdict === "waiting";
}

export function shownItems(take) {
  const items = itemsOf(take).filter(
    (item) => takes.view.allItems === true || isFresh({ item, take }),
  );
  return sections.flatMap(([id]) =>
    items.filter((item) => item.section === id),
  );
}

function summaryOf(take) {
  const made = itemsOf(take).filter((item) => item.take === take.number);
  if (take.state === "making") {
    return `${progressText(take)}.`;
  }
  const remade = made.filter((item) => item.replaces !== undefined).length;
  if (remade > 0) {
    return `The lead made ${remade} again from your notes.`;
  }
  return `The lead made ${made.length} new.`;
}

function tileMarkup({ item, take }) {
  const notes = item.comments.length;
  const marked = item.verdict === "declined" || notes > 0;
  const visual =
    item.kind === "music"
      ? `<span class="tile-wave">${escapeText(item.title)}</span>`
      : artMarkup(item.picture);
  return `
    <li class="tile" data-marked="${marked}" data-out="${item.verdict === "declined"}">
      <button type="button" class="tile-open" data-open-item="${item.id}" aria-label="Open ${escapeText(item.title)}">
        <span class="tile-picture" data-kind="${item.kind}">${visual}${item.take === take.number && take.number > 1 ? `<span class="tile-new">New</span>` : ""}${marked ? `<span class="tile-notes">${item.verdict === "declined" ? "Not used" : `${notes} note${notes === 1 ? "" : "s"}`}</span>` : ""}</span>
        <span class="tile-caption">${escapeText(item.group === undefined ? item.title : `${item.group}, ${item.title}`)}</span>
        ${item.check.passed || item.kind === "music" ? "" : `<span class="tile-fault">${escapeText(item.check.text)}</span>`}
      </button>
    </li>`;
}

function sheetMarkup(take) {
  const items = shownItems(take);
  if (items.length === 0) {
    return `<p class="fact lead">Nothing new waits for you. Turn off the switch to see every item.</p>`;
  }
  return sections
    .filter(([id]) => items.some((item) => item.section === id))
    .map(
      ([id, name]) => `
        <section class="contact" aria-label="${name}">
          <h3>${name}</h3>
          <ul class="contact-sheet" data-section="${id}">${items
            .filter((item) => item.section === id)
            .map((item) => tileMarkup({ item, take }))
            .join("")}</ul>
        </section>`,
    )
    .join("");
}

function earlierMarkup(take) {
  const list = takesOf(take.chapterId);
  if (list.length < 2) {
    return "";
  }
  const options = list
    .map(
      (each) =>
        `<option value="${each.number}" ${each === take ? "selected" : ""}>Take ${each.number}, ${stepNames[each.step]}</option>`,
    )
    .join("");
  return `<label class="earlier"><span class="hidden-label">Earlier takes</span><select data-earlier>${options}</select></label>`;
}

export function takeMarkup() {
  const take = shownTake();
  const chapter = chapterOf(take.chapterId);
  const fresh = itemsOf(take).filter((item) => isFresh({ item, take })).length;
  const share = (take.planned - take.queue.length) / Math.max(1, take.planned);
  takes.view.order = shownItems(take).map((item) => item.id);
  takes.view.simple = true;
  return `
    <header class="take-slate-head">
      <div class="slate" aria-label="Take ${take.number}"><span>Take</span><strong>${take.number}</strong></div>
      <div class="slate-facts">
        <p>Chapter ${chapterNumber(chapter.id)}, ${escapeText(chapter.name)}. ${stepNames[take.step].charAt(0).toUpperCase()}${stepNames[take.step].slice(1)}.</p>
        <p class="fact lead">${summaryOf(take)}</p>
        ${take.state === "making" ? `<div class="progress wide"><i style="width:${share * 100}%"></i></div>` : ""}
        <div class="slate-controls">
          <label class="switch"><input type="checkbox" data-only-new ${takes.view.allItems ? "" : "checked"} /> Only new and waiting (${fresh})</label>
          ${earlierMarkup(take)}
        </div>
      </div>
    </header>
    ${sheetMarkup(take)}
    ${largeMarkup(take)}`;
}

export function bindTake(element) {
  bindTakeKeys();
  element.querySelectorAll("[data-open-item]").forEach((button) => {
    button.addEventListener("click", () =>
      changeView({ openItemId: button.dataset.openItem }),
    );
  });
  element
    .querySelector("[data-only-new]")
    ?.addEventListener("change", (event) =>
      changeView({ allItems: !event.target.checked }),
    );
  element
    .querySelector("[data-earlier]")
    ?.addEventListener("change", (event) =>
      changeView({ takeNumber: Number(event.target.value) }),
    );
  bindLarge({ element });
}
