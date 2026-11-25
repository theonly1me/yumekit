import { artMarkup } from "./art.js";
import { drag } from "./dragState.js";
import { escapeText, numberOf, record, sceneOf } from "./state.js";
import { isInUse, itemOf, takes } from "./takesStore.js";

function trayItems() {
  return [...takes.items.values()].filter(
    (item) =>
      (item.section === "shots" || item.section === "clips") && isInUse(item),
  );
}

export function placeItem({ sceneId, itemId }) {
  const scene = sceneOf(sceneId);
  const item = itemOf(itemId);
  if (scene === undefined || item === undefined) {
    return;
  }
  record({
    text: `You put the ${item.kind === "clip" ? "clip" : "picture"} "${item.title}" in scene ${numberOf(scene.id)}.`,
    apply: () => {
      scene.picture = item.picture;
      scene.isVideo = item.kind === "clip";
      scene.placedItemId = item.id;
    },
  });
}

export function trayMarkup() {
  const items = trayItems();
  if (items.length === 0) {
    return `<p class="fact">Approved pictures and clips from Takes show here. Drag one onto a scene.</p>`;
  }
  const tiles = items
    .map(
      (item) =>
        `<li><span class="tray-tile" draggable="true" data-tray="${item.id}" title="${escapeText(item.title)}" data-kind="${item.kind}">${artMarkup(item.picture)}<i>${item.kind === "clip" ? "Clip" : "Picture"}</i></span></li>`,
    )
    .join("");
  return `
    <div class="tray">
      <p class="track-name">From Takes</p>
      <ul class="tray-tiles" aria-label="Approved pictures and clips. Drag one onto a scene.">${tiles}</ul>
    </div>`;
}

export function bindTray(element) {
  element.querySelectorAll("[data-tray]").forEach((tile) => {
    tile.addEventListener("dragstart", () => {
      drag.kind = "take-item";
      drag.id = tile.dataset.tray;
    });
  });
}
