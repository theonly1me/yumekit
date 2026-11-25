import { artMarkup } from "./art.js";
import { moveLine, moveSceneTo, scenesIn } from "./chapters.js";
import { drag } from "./dragState.js";
import { escapeText, numberOf, pick, state } from "./state.js";

function cardMarkup(scene) {
  const index = numberOf(scene.id);
  return `
    <li class="card-slot">
      <button type="button" class="card" draggable="true" data-card="${scene.id}" aria-pressed="${scene.id === state.pickedSceneId}" data-shown="${scene.id === state.viewSceneId}">
        <span class="thumb">${artMarkup(scene.picture ?? { kind: "scene", art: scene.art })}</span>
        <span class="card-title">${index}. ${escapeText(scene.title)}</span>
        <span class="card-facts">${scene.seconds} seconds${scene.isVideo ? ", video clip" : ""}</span>
      </button>
      <button type="button" class="plus" data-add-after="${scene.id}" aria-label="Add a scene after scene ${index}" title="Add a scene here">+</button>
    </li>`;
}

function groupMarkup([index, chapter]) {
  const line =
    index === 0
      ? ""
      : `<li class="chapter-line" draggable="true" data-line="${state.chapters[index - 1].id}" title="Drag onto a scene to move the line between chapter ${index} and chapter ${index + 1}" aria-label="Line between chapter ${index} and chapter ${index + 1}"><span></span></li>`;
  return `${line}
    <li class="card-group" data-group="${chapter.id}">
      <p class="group-label">${index + 1}. ${escapeText(chapter.name)}</p>
      <ol class="group-cards">${scenesIn(chapter.id).map(cardMarkup).join("")}</ol>
    </li>`;
}

export function cardsMarkup() {
  return `<ol class="cards">${[...state.chapters.entries()].map(groupMarkup).join("")}</ol>`;
}

export function bindCards(element) {
  element.querySelectorAll("[data-card]").forEach((card) => {
    const sceneId = card.dataset.card;
    card.addEventListener("click", () => pick(sceneId));
    card.addEventListener("dragstart", () => {
      drag.kind = "scene";
      drag.id = sceneId;
    });
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      card.dataset.over = drag.kind ?? "true";
    });
    card.addEventListener("dragleave", () => delete card.dataset.over);
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      const target = state.scenes.find((scene) => scene.id === sceneId);
      if (drag.kind === "scene") {
        moveSceneTo({
          sceneId: drag.id,
          chapterId: target.chapterId,
          beforeId: sceneId,
        });
      }
      if (drag.kind === "line") {
        moveLine({ leftId: drag.id, firstSceneId: sceneId });
      }
      drag.kind = undefined;
    });
  });
  element.querySelectorAll("[data-line]").forEach((line) => {
    line.addEventListener("dragstart", () => {
      drag.kind = "line";
      drag.id = line.dataset.line;
    });
  });
}
