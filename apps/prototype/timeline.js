import {
  escapeText,
  numberOf,
  pick,
  record,
  state,
  totalSeconds,
} from "./state.js";

const view = { draggedId: undefined };

function clipMarkup(scene) {
  return `
    <div class="clip scene-clip" draggable="true" data-clip="${scene.id}" data-picked="${scene.id === state.pickedSceneId}" style="flex-grow:${scene.seconds}">
      <button type="button" class="clip-name" data-pick-clip="${scene.id}">${escapeText(scene.title)}</button>
      <span class="trim" data-trim="${scene.id}" role="slider" tabindex="0" aria-label="Length of scene ${numberOf(scene.id)}" aria-valuenow="${scene.seconds}" aria-valuemin="1" aria-valuemax="20" title="Drag to change the length"></span>
    </div>`;
}

function barMarkup({ name, text, on, kind }) {
  return `<div class="track"><span class="track-name">${name}</span><div class="track-lane"><div class="clip ${kind}" data-on="${on}">${on ? escapeText(text) : "Off"}</div></div></div>`;
}

function rulerMarkup() {
  const total = totalSeconds();
  const marks = [];
  for (let second = 0; second <= total; second += 5) {
    marks.push(
      `<span style="left:${(second / total) * 100}%">${second} s</span>`,
    );
  }
  return `<div class="track"><span class="track-name"></span><div class="ruler">${marks.join("")}</div></div>`;
}

function setSeconds({ scene, seconds }) {
  const next = Math.min(20, Math.max(1, seconds));
  if (next === scene.seconds) {
    return;
  }
  record({
    text: `You changed scene ${numberOf(scene.id)} to ${next} seconds.`,
    apply: () => (scene.seconds = next),
  });
}

function bindTrim({ handle, lane }) {
  const scene = state.scenes.find(
    (candidate) => candidate.id === handle.dataset.trim,
  );
  const clip = handle.parentElement;
  handle.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setSeconds({
        scene,
        seconds: scene.seconds + (event.key === "ArrowRight" ? 1 : -1),
      });
    }
  });
  handle.addEventListener("pointerdown", (down) => {
    down.preventDefault();
    handle.setPointerCapture(down.pointerId);
    const pixelsPerSecond = lane.getBoundingClientRect().width / totalSeconds();
    let seconds = scene.seconds;
    const move = (event) => {
      seconds = Math.min(
        20,
        Math.max(
          1,
          scene.seconds +
            Math.round((event.clientX - down.clientX) / pixelsPerSecond),
        ),
      );
      clip.style.flexGrow = String(seconds);
      clip.querySelector(".clip-name").textContent = `${seconds} seconds`;
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      clip.querySelector(".clip-name").textContent = scene.title;
      setSeconds({ scene, seconds });
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });
}

export function renderTimeline({ element }) {
  const voiceText = state.scenes.map((scene) => scene.text).join(". ");
  element.innerHTML = `
    ${rulerMarkup()}
    <div class="track"><span class="track-name">Scenes</span><div class="track-lane" data-scene-lane>${state.scenes.map(clipMarkup).join("")}</div></div>
    ${barMarkup({ name: "Voice", text: voiceText, on: state.voice.on, kind: "voice-clip" })}
    ${barMarkup({ name: "Music", text: state.music.choice, on: state.music.on, kind: "music-clip" })}
    ${barMarkup({ name: "Captions", text: `${state.captions.choice}, from the voice`, on: state.captions.on, kind: "voice-clip" })}
    <p class="fact">Drag a scene to move it. Drag its right edge to change the length.</p>`;
  const lane = element.querySelector("[data-scene-lane]");
  element.querySelectorAll("[data-pick-clip]").forEach((button) => {
    button.addEventListener("click", () => pick(button.dataset.pickClip));
  });
  element.querySelectorAll("[data-clip]").forEach((clip) => {
    clip.addEventListener(
      "dragstart",
      () => (view.draggedId = clip.dataset.clip),
    );
    clip.addEventListener("dragover", (event) => event.preventDefault());
    clip.addEventListener("drop", (event) => {
      event.preventDefault();
      const dragged = state.scenes.find((scene) => scene.id === view.draggedId);
      const targetIndex = state.scenes.findIndex(
        (scene) => scene.id === clip.dataset.clip,
      );
      view.draggedId = undefined;
      if (dragged === undefined || dragged.id === clip.dataset.clip) {
        return;
      }
      record({
        text: `You moved scene "${dragged.title}".`,
        apply: () => {
          const rest = state.scenes.filter((scene) => scene.id !== dragged.id);
          rest.splice(targetIndex, 0, dragged);
          state.scenes = rest;
        },
      });
    });
  });
  element
    .querySelectorAll("[data-trim]")
    .forEach((handle) => bindTrim({ handle, lane }));
}
