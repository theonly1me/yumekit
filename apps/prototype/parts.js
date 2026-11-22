import { renderPictures } from "./partPictures.js";
import { renderScript } from "./partScript.js";
import { renderMusic } from "./partSound.js";
import { renderVoice } from "./partVoice.js";
import { change } from "./state.js";

function renderTogether({ element }) {
  element.innerHTML = `
    <p class="fact lead">The video is ready. Open the editor to watch it, to change a scene, and to export it.</p>
    <div class="part-actions"><button type="button" class="primary" data-editor>Open the editor</button></div>`;
  element
    .querySelector("[data-editor]")
    .addEventListener("click", () =>
      change({ screen: "editor", sheet: undefined }),
    );
}

const parts = {
  script: { title: "The script", render: renderScript },
  pictures: { title: "The pictures", render: renderPictures },
  voice: { title: "The voice", render: renderVoice },
  music: { title: "The music", render: renderMusic },
  together: { title: "The video", render: renderTogether },
};

const lockedText =
  "The AI still works on the video. You can look now. You can change this when the AI finishes, or after you stop it.";

export function renderPart({ element, partId, locked }) {
  const part = parts[partId];
  element.innerHTML = `
    <div class="part" data-locked="${locked}">
      <header class="part-head">
        <h3>${part.title}</h3>
        ${locked ? `<p class="fact">${lockedText}</p>` : ""}
      </header>
      <div class="part-body"></div>
    </div>`;
  part.render({ element: element.querySelector(".part-body"), locked });
}

export function renderPartSheet(partId) {
  return ({ element }) => {
    element.innerHTML = `<div class="sheet-body wide part-sheet"></div>`;
    renderPart({
      element: element.querySelector(".part-sheet"),
      partId,
      locked: false,
    });
  };
}
