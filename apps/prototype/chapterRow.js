import {
  chapterLength,
  joinNext,
  minutesText,
  moveChapter,
  moveSceneTo,
  renameChapter,
  scenesIn,
  splitAt,
} from "./chapters.js";
import { drag } from "./dragState.js";
import { openTake } from "./readySignal.js";
import { change, escapeText, pickedScene, state } from "./state.js";
import { stepLabels } from "./takeHead.js";
import { latestTake } from "./takesStore.js";

const view = { renaming: false };

function blockMarkup([index, chapter]) {
  const seconds = chapterLength(chapter.id);
  return `
    <li style="flex-grow:${seconds}">
      <button type="button" class="chapter-block" draggable="true" data-chapter-block="${chapter.id}" aria-pressed="${state.pickedChapterId === chapter.id}">
        <span class="chapter-name">${index + 1}. ${escapeText(chapter.name)}</span>
        <span class="chapter-facts">${minutesText(seconds)}, ${scenesIn(chapter.id).length} scenes</span>
        <span class="step-pill" data-step="${chapter.step}">${stepLabels[chapter.step]}</span>
      </button>
    </li>`;
}

function actionsMarkup() {
  const chapter = state.chapters.find(
    (candidate) => candidate.id === state.pickedChapterId,
  );
  if (chapter === undefined) {
    return "";
  }
  const index = state.chapters.indexOf(chapter);
  const scene = pickedScene();
  const canSplit =
    scene?.chapterId === chapter.id && scenesIn(chapter.id)[0]?.id !== scene.id;
  const name = view.renaming
    ? `<form class="rename-form" data-rename><input type="text" id="chapter-name" value="${escapeText(chapter.name)}" aria-label="Name of chapter ${index + 1}" /><button type="submit" class="primary">Save</button></form>`
    : `<button type="button" data-chapter-action="rename">Rename</button>`;
  return `
    <div class="chapter-actions" role="group" aria-label="Actions for chapter ${index + 1}">
      <p class="scene-actions-name">Chapter ${index + 1}: ${escapeText(chapter.name)}</p>
      ${name}
      <button type="button" data-chapter-action="split" ${canSplit ? "" : "disabled"} title="Pick a scene of this chapter first">${canSplit ? `Split at "${escapeText(scene.title)}"` : "Split at a scene"}</button>
      <button type="button" data-chapter-action="join" ${index === state.chapters.length - 1 ? "disabled" : ""}>Join with chapter ${index + 2}</button>
      <button type="button" data-chapter-action="takes" ${latestTake(chapter.id) === undefined ? "disabled" : ""}>Open its takes</button>
    </div>`;
}

export function chapterRowMarkup() {
  return `
    <div class="chapter-row">
      <ol class="chapter-blocks" aria-label="Chapters">${[...state.chapters.entries()].map(blockMarkup).join("")}</ol>
      ${actionsMarkup()}
    </div>`;
}

const actions = {
  rename: () => {
    view.renaming = true;
    change({});
    document.getElementById("chapter-name")?.select();
  },
  split: () => splitAt(state.pickedSceneId),
  join: () => joinNext(state.pickedChapterId),
  takes: () => {
    const take = latestTake(state.pickedChapterId);
    openTake({ chapterId: take.chapterId, number: take.number });
  },
};

export function bindChapterRow(element) {
  element.querySelectorAll("[data-chapter-block]").forEach((block) => {
    const chapterId = block.dataset.chapterBlock;
    block.addEventListener("click", () => {
      view.renaming = false;
      change({
        pickedChapterId:
          state.pickedChapterId === chapterId ? undefined : chapterId,
      });
    });
    block.addEventListener("dragstart", () => {
      drag.kind = "chapter";
      drag.id = chapterId;
    });
    block.addEventListener("dragover", (event) => {
      event.preventDefault();
      block.dataset.over = "true";
    });
    block.addEventListener("dragleave", () => (block.dataset.over = "false"));
    block.addEventListener("drop", (event) => {
      event.preventDefault();
      if (drag.kind === "chapter") {
        moveChapter({ chapterId: drag.id, beforeId: chapterId });
      }
      if (drag.kind === "scene") {
        moveSceneTo({ sceneId: drag.id, chapterId, beforeId: undefined });
      }
      drag.kind = undefined;
    });
  });
  element.querySelectorAll("[data-chapter-action]").forEach((button) => {
    button.addEventListener("click", () =>
      actions[button.dataset.chapterAction](),
    );
  });
  element
    .querySelector("[data-rename]")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      view.renaming = false;
      renameChapter({
        chapterId: state.pickedChapterId,
        name: event.target.querySelector("input").value.trim(),
      });
    });
}
