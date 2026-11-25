import { bindChapterRow, chapterRowMarkup } from "./chapterRow.js";
import { bindCards, cardsMarkup } from "./sceneCards.js";
import {
  change,
  escapeText,
  newSceneId,
  numberOf,
  pickedScene,
  record,
  sceneOf,
  state,
} from "./state.js";

const view = { addingAfter: undefined };

function addFormMarkup() {
  if (view.addingAfter === undefined) {
    return "";
  }
  return `
    <form class="inline-form" data-add-form>
      <label for="new-scene">Describe the new scene after scene ${numberOf(view.addingAfter)}</label>
      <input type="text" id="new-scene" placeholder="A customer says why they like it" required />
      <button type="submit" class="primary">Add the scene</button>
      <button type="button" data-cancel-add>Cancel</button>
    </form>`;
}

function actionsMarkup(scene) {
  if (scene === undefined) {
    return `<p class="fact scene-hint">Pick a scene to change it. Drag a scene to move it, also into another chapter. Drag the line between two chapters onto a scene to move the line.</p>`;
  }
  return `
    <div class="scene-actions" role="group" aria-label="Actions for scene ${numberOf(scene.id)}">
      <p class="scene-actions-name">Scene ${numberOf(scene.id)}: ${escapeText(scene.title)}</p>
      <button type="button" data-action="edit">Edit text</button>
      <span class="stepper" role="group" aria-label="Change length">
        <button type="button" data-action="shorter" aria-label="One second shorter">-</button>
        <span>${scene.seconds} seconds</span>
        <button type="button" data-action="longer" aria-label="One second longer">+</button>
      </span>
      <button type="button" data-action="clip">Make a real video clip</button>
      <button type="button" data-action="duplicate">Duplicate</button>
      <button type="button" data-action="delete">Delete</button>
    </div>`;
}

const actions = {
  edit: () => change({ sideTab: "scene", focusField: "scene-text" }),
  clip: () => change({ sheet: "clip" }),
  shorter: (scene) =>
    record({
      text: `You made scene ${numberOf(scene.id)} shorter.`,
      apply: () => (scene.seconds = Math.max(1, scene.seconds - 1)),
    }),
  longer: (scene) =>
    record({
      text: `You made scene ${numberOf(scene.id)} longer.`,
      apply: () => (scene.seconds += 1),
    }),
  duplicate: (scene) =>
    record({
      text: `You duplicated scene ${numberOf(scene.id)}.`,
      apply: () =>
        state.scenes.splice(numberOf(scene.id), 0, {
          ...scene,
          shots: [...scene.shots],
          id: newSceneId(),
          title: `${scene.title} copy`,
        }),
    }),
  delete: (scene) =>
    record({
      text: `You deleted scene "${scene.title}".`,
      apply: () => {
        state.scenes = state.scenes.filter(
          (candidate) => candidate.id !== scene.id,
        );
        state.pickedSceneId = undefined;
        state.viewSceneId = state.scenes[0]?.id;
        state.sideTab = "chat";
      },
    }),
};

export function addScene({ afterId, description }) {
  const title =
    description.length > 26 ? `${description.slice(0, 24)}...` : description;
  const scene = {
    id: newSceneId(),
    title,
    text: description,
    other: description,
    seconds: 4,
    tone: "moss",
    art: "clear",
    shots: [title],
    chapterId: sceneOf(afterId)?.chapterId ?? state.chapters.at(-1).id,
    isVideo: false,
  };
  record({
    text: `The AI added the scene "${title}".`,
    apply: () => {
      const index =
        afterId === undefined ? state.scenes.length : numberOf(afterId);
      state.scenes.splice(index, 0, scene);
      state.viewSceneId = scene.id;
      state.pickedSceneId = scene.id;
    },
  });
}

export function renderScenesRow({ element }) {
  const scene = pickedScene();
  element.innerHTML = `
    ${chapterRowMarkup()}
    ${cardsMarkup()}
    ${addFormMarkup()}
    ${actionsMarkup(scene)}`;
  const cards = element.querySelector(".cards");
  const pickedCard = element.querySelector('.card[aria-pressed="true"]');
  if (pickedCard !== null) {
    cards.scrollLeft = Math.max(
      0,
      pickedCard.getBoundingClientRect().left -
        cards.getBoundingClientRect().left -
        24,
    );
  }
  bindChapterRow(element);
  bindCards(element);
  element.querySelectorAll("[data-add-after]").forEach((button) => {
    button.addEventListener("click", () => {
      view.addingAfter = button.dataset.addAfter;
      renderScenesRow({ element });
      element.querySelector("#new-scene").focus();
    });
  });
  element.querySelector("[data-cancel-add]")?.addEventListener("click", () => {
    view.addingAfter = undefined;
    renderScenesRow({ element });
  });
  element
    .querySelector("[data-add-form]")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const afterId = view.addingAfter;
      view.addingAfter = undefined;
      addScene({
        afterId,
        description: element.querySelector("#new-scene").value.trim(),
      });
    });
  element.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () =>
      actions[button.dataset.action](scene),
    );
  });
}
