import { escapeText } from "./state.js";
import { bindMedia, clockOf, mediaMarkup, seek } from "./takeMedia.js";
import { whatToCheckOf } from "./takeNotes.js";
import {
  addComment,
  changeView,
  isInUse,
  itemOf,
  removeComment,
  setVerdict,
  takes,
  useMusic,
} from "./takesStore.js";

export function badgesMarkup({ item, take }) {
  const badges = [];
  if (item.take === take.number) {
    badges.push(`<span class="badge new">New in take ${take.number}</span>`);
  }
  if (isInUse(item)) {
    badges.push(`<span class="badge use">In use</span>`);
  }
  if (item.replaces !== undefined) {
    badges.push(
      `<span class="badge">Replaces take ${itemOf(item.replaces).take}</span>`,
    );
  }
  return `<div class="badges">${badges.join("")}</div>`;
}

export function checkMarkup(item) {
  if (item.kind === "music" || item.kind === "cut") {
    return "";
  }
  return `<span class="check" data-passed="${item.check.passed}">${escapeText(item.check.text)}</span>`;
}

export function verdictMarkup(item) {
  const approve =
    item.kind === "music"
      ? `<button type="button" data-verdict="approved" aria-pressed="${item.verdict === "approved"}">${item.verdict === "approved" ? "In use" : "Use this one"}</button>`
      : `<button type="button" data-verdict="approved" aria-pressed="${item.verdict === "approved"}">${item.verdict === "approved" ? "Approved" : "Approve"}</button>`;
  return `
    <div class="verdict" role="group" aria-label="Your answer for ${escapeText(item.title)}">
      ${approve}
      <button type="button" data-verdict="declined" aria-pressed="${item.verdict === "declined"}">${item.verdict === "declined" ? "Declined" : "Decline"}</button>
      <button type="button" data-comment aria-expanded="${takes.view.commentingId === item.id}">Comment</button>
    </div>`;
}

function commentKey({ comment, index }) {
  if (comment.kind === "pin") {
    return `<span class="comment-key pin-key">${index + 1}</span>`;
  }
  if (comment.kind === "moment") {
    return `<button type="button" class="comment-key moment-key" data-go-moment="${comment.seconds}" title="Go to this moment">${clockOf(comment.seconds)}</button>`;
  }
  return `<span class="comment-key note-key">Note</span>`;
}

export function commentsMarkup({ item, scope }) {
  const open = takes.view.commentingId === item.id;
  const rows = [...item.comments.entries()]
    .map(
      ([index, comment]) => `
      <li class="comment">
        ${commentKey({ comment, index })}
        <input type="text" id="${scope}-comment-${item.id}-${index}" data-comment-text="${index}" value="${escapeText(comment.text)}" placeholder="${comment.kind === "moment" ? "What goes wrong here?" : "What is wrong at this pin?"}" aria-label="Comment ${index + 1}" />
        <button type="button" class="remove" data-remove-comment="${index}" aria-label="Remove comment ${index + 1}">Remove</button>
      </li>`,
    )
    .join("");
  const hint =
    item.kind === "picture"
      ? "Click the picture to pin a point, or write a note."
      : "Mark a moment while it plays, or write a note.";
  const composer = open
    ? `<form class="note-form" data-note-form><input type="text" id="${scope}-note-${item.id}" value="${escapeText(takes.drafts.get(item.id) ?? "")}" placeholder="${hint}" aria-label="A note for the lead" /><button type="submit">Add</button></form>`
    : "";
  return rows === "" && composer === ""
    ? ""
    : `<ul class="comments">${rows}</ul>${composer}`;
}

export function bindItem({ element, item, scope }) {
  bindMedia({
    element,
    item,
    onPin: () => {
      takes.view.commentingId = item.id;
      takes.view.focusId = `${scope}-comment-${item.id}-${item.comments.length}`;
    },
  });
  element.querySelectorAll("[data-verdict]").forEach((button) => {
    button.addEventListener("click", () => {
      const verdict = button.dataset.verdict;
      if (item.kind === "music" && verdict === "approved") {
        useMusic(item);
        return;
      }
      setVerdict({ item, verdict });
    });
  });
  element.querySelector("[data-comment]")?.addEventListener("click", () => {
    const open = takes.view.commentingId === item.id;
    takes.view.focusId = open ? undefined : `${scope}-note-${item.id}`;
    changeView({ commentingId: open ? undefined : item.id });
  });
  element.querySelectorAll("[data-comment-text]").forEach((input) => {
    input.addEventListener("input", () => {
      item.comments[Number(input.dataset.commentText)].text = input.value;
    });
  });
  element.querySelectorAll("[data-remove-comment]").forEach((button) => {
    button.addEventListener("click", () =>
      removeComment({ item, index: Number(button.dataset.removeComment) }),
    );
  });
  element.querySelectorAll("[data-go-moment]").forEach((button) => {
    button.addEventListener("click", () =>
      seek({ item, seconds: Number(button.dataset.goMoment) }),
    );
  });
  element
    .querySelector("[data-note-form] input")
    ?.addEventListener("input", (event) => {
      takes.drafts.set(item.id, event.target.value);
    });
  element
    .querySelector("[data-note-form]")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = event.target.querySelector("input");
      if (input.value.trim() === "") {
        return;
      }
      takes.view.focusId = `${scope}-note-${item.id}`;
      takes.drafts.delete(item.id);
      addComment({ item, comment: { kind: "note", text: input.value.trim() } });
    });
  element
    .querySelector("[data-open-large]")
    ?.addEventListener("click", () => changeView({ openItemId: item.id }));
  element
    .querySelector("[data-compare]")
    ?.addEventListener("click", () => changeView({ compareItemId: item.id }));
}

export function cardMarkup({ item, take }) {
  const check = whatToCheckOf(item);
  const older = item.replaces === undefined ? undefined : itemOf(item.replaces);
  return `
    <article class="take-card" id="card-${item.id}" tabindex="0" data-item="${item.id}" data-verdict="${item.verdict}" data-kind="${item.kind}" aria-label="${escapeText(item.title)}">
      <div class="card-media">
        ${mediaMarkup({ item, overlay: badgesMarkup({ item, take }) + checkMarkup(item) })}
      </div>
      <div class="card-text">
        <h4>${escapeText(item.title)}</h4>
        <p class="lead-note"><span>The lead</span>${escapeText(item.note)}</p>
        ${check === undefined ? "" : `<p class="check-line"><span>What to check</span>${escapeText(check)}</p>`}
      </div>
      <div class="card-actions">
        ${verdictMarkup(item)}
        <span class="card-links">
          ${older === undefined ? "" : `<button type="button" class="link" data-compare>Compare with take ${older.take}</button>`}
          ${item.kind === "music" ? "" : `<button type="button" class="link" data-open-large>Large view</button>`}
        </span>
      </div>
      ${commentsMarkup({ item, scope: "card" })}
    </article>`;
}
