import { tones } from "./data.js";
import {
  change,
  escapeText,
  newSceneId,
  numberOf,
  pick,
  pickedScene,
  record,
  state,
} from "./state.js";

const view = { addingAfter: undefined, draggedId: undefined };

function cardMarkup([index, scene]) {
  const picked = scene.id === state.pickedSceneId;
  const shown = scene.id === state.viewSceneId;
  return `
    <li class="card-slot">
      <button type="button" class="card" draggable="true" data-card="${scene.id}" aria-pressed="${picked}" data-shown="${shown}">
        <span class="thumb" style="background:${tones[scene.tone]}" data-dark="${scene.tone !== "paper"}"><i>${escapeText(scene.text)}</i></span>
        <span class="card-title">${index + 1}. ${escapeText(scene.title)}</span>
        <span class="card-facts">${scene.seconds} seconds${scene.isVideo ? ", video clip" : ""}</span>
      </button>
      <button type="button" class="plus" data-add-after="${scene.id}" aria-label="Add a scene after scene ${index + 1}" title="Add a scene here">+</button>
    </li>`;
}

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
    return `<p class="fact scene-hint">Pick a scene to change it. Drag a scene to move it.</p>`;
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

function moveScene({ draggedId, targetId }) {
  if (draggedId === targetId || draggedId === undefined) {
    return;
  }
  const dragged = state.scenes.find((scene) => scene.id === draggedId);
  record({
    text: `You moved scene "${dragged.title}".`,
    apply: () => {
      const targetIndex = state.scenes.findIndex(
        (scene) => scene.id === targetId,
      );
      const rest = state.scenes.filter((scene) => scene.id !== draggedId);
      rest.splice(targetIndex, 0, dragged);
      state.scenes = rest;
    },
  });
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
    <ol class="cards">${[...state.scenes.entries()].map(cardMarkup).join("")}</ol>
    ${addFormMarkup()}
    ${actionsMarkup(scene)}`;
  const cards = element.querySelector(".cards");
  const pickedCard = element.querySelector('.card[aria-pressed="true"]');
  if (pickedCard !== null) {
    cards.scrollLeft = Math.max(
      0,
      pickedCard.parentElement.offsetLeft - cards.offsetLeft - 24,
    );
  }
  element.querySelectorAll("[data-card]").forEach((card) => {
    const sceneId = card.dataset.card;
    card.addEventListener("click", () => pick(sceneId));
    card.addEventListener("dragstart", () => (view.draggedId = sceneId));
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      moveScene({ draggedId: view.draggedId, targetId: sceneId });
      view.draggedId = undefined;
    });
  });
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
