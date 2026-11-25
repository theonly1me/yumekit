import { chapterNumber, scenesOf } from "./leadWork.js";
import { filmTitle } from "./film.js";
import { change, escapeText, say, state } from "./state.js";
import { storyChapters } from "./storyText.js";
import { total } from "./takesStore.js";

const rewriteMilliseconds = 1400;
const story = {
  round: 1,
  approved: true,
  writing: false,
  comments: new Map(),
  changed: new Set(),
  commenting: undefined,
};

function lengthOf(chapterId) {
  const seconds = total(scenesOf(chapterId).map((scene) => scene.seconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function paragraphMarkup({ key, text }) {
  const notes = story.comments.get(key) ?? [];
  const open = story.commenting === key;
  const noteRows = notes.map((note) => `<li>${escapeText(note)}</li>`).join("");
  return `
    <div class="story-paragraph" data-open="${open}" data-has-notes="${notes.length > 0}">
      <p>${story.changed.has(key) ? `<span class="badge new">New in round ${story.round}</span>` : ""}${escapeText(text)}</p>
      <button type="button" class="link" data-comment-on="${key}" aria-expanded="${open}">${notes.length > 0 ? `${notes.length} comment${notes.length === 1 ? "" : "s"}` : "Comment"}</button>
      ${notes.length > 0 ? `<ul class="story-notes">${noteRows}</ul>` : ""}
      ${open ? `<form class="note-form" data-story-note="${key}"><input type="text" id="story-note-${key}" placeholder="What should change in this paragraph?" aria-label="Your note on this paragraph" /><button type="submit">Add</button></form>` : ""}
    </div>`;
}

function chapterMarkup(chapter) {
  const text = storyChapters[chapter.id];
  const lines = text.script
    .map(
      ([who, words]) =>
        `<p class="script-line"><b>${who}</b>${escapeText(words)}</p>`,
    )
    .join("");
  const paragraphs = [...text.story.entries()]
    .map(([index, words]) =>
      paragraphMarkup({ key: `${chapter.id}-${index}`, text: words }),
    )
    .join("");
  return `
    <section class="story-chapter">
      <h3><span>Chapter ${chapterNumber(chapter.id)}</span>${escapeText(chapter.name)}<em>${lengthOf(chapter.id)}</em></h3>
      ${paragraphs}
      <div class="story-script" aria-label="Script of chapter ${chapterNumber(chapter.id)}">${lines}</div>
    </section>`;
}

function footMarkup() {
  const count = total([...story.comments.values()].map((list) => list.length));
  if (story.writing) {
    return `<p class="take-state" data-state="making">The lead writes the story again from your notes.</p>`;
  }
  return `
    <p class="take-counts">${story.approved ? "<b>You approved the story.</b> You can still send notes. " : ""}<b>${count}</b> comment${count === 1 ? "" : "s"}</p>
    <div class="foot-actions">
      <button type="button" data-send-story ${count === 0 ? "disabled" : ""}>Send my notes to the lead</button>
      ${story.approved ? "" : `<button type="button" class="primary" data-approve-story>Approve the story</button>`}
    </div>`;
}

export function approveStory() {
  story.approved = true;
}

export function resetStory() {
  Object.assign(story, { round: 1, approved: false, commenting: undefined });
  story.comments.clear();
  story.changed.clear();
}

export function storyIsApproved() {
  return story.approved;
}

function sendNotes() {
  story.writing = true;
  change({});
  setTimeout(() => {
    story.changed = new Set(story.comments.keys());
    story.comments.clear();
    story.round += 1;
    story.writing = false;
    say({
      kind: "ai",
      text: `I wrote the story again from your notes. ${story.changed.size} paragraphs changed, and they show with New.`,
    });
  }, rewriteMilliseconds);
}

export function renderStorySheet({ element }) {
  element.innerHTML = `
    <article class="story-sheet">
      <header class="story-head">
        <p class="fact">The whole story and the script. Round ${story.round}.</p>
        <h2>${filmTitle}</h2>
        <p class="fact lead">${state.chapters.length} chapters. Click Comment next to any paragraph to tell the lead what to change.</p>
      </header>
      ${state.chapters.map(chapterMarkup).join("")}
      <footer class="takes-foot story-foot">${footMarkup()}</footer>
    </article>`;
  element.querySelectorAll("[data-comment-on]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.commentOn;
      story.commenting = story.commenting === key ? undefined : key;
      change({});
      element.querySelector(`#story-note-${key}`)?.focus();
    });
  });
  element.querySelectorAll("[data-story-note]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const words = form.querySelector("input").value.trim();
      if (words === "") {
        return;
      }
      const key = form.dataset.storyNote;
      story.comments.set(key, [...(story.comments.get(key) ?? []), words]);
      story.commenting = undefined;
      change({});
    });
  });
  element
    .querySelector("[data-send-story]")
    ?.addEventListener("click", sendNotes);
  element
    .querySelector("[data-approve-story]")
    ?.addEventListener("click", () => {
      approveStory();
      change({});
    });
}
