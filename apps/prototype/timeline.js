import {
  chapterLength,
  minutesText,
  moveChapter,
  moveSceneTo,
} from "./chapters.js";
import { drag } from "./dragState.js";
import { escapeText, numberOf, pick, state, totalSeconds } from "./state.js";
import { stepLabels } from "./takeHead.js";
import { bindTray, placeItem, trayMarkup } from "./takesTray.js";
import { bindChapterEdge, bindMusicDrag, bindTrim } from "./timelineDrag.js";

function clipMarkup(scene) {
  return `
    <div class="clip scene-clip" draggable="true" data-clip="${scene.id}" data-picked="${scene.id === state.pickedSceneId}" data-video="${scene.isVideo}" style="flex-grow:${scene.seconds}">
      <button type="button" class="clip-name" data-pick-clip="${scene.id}">${escapeText(scene.title)}</button>
      <span class="trim" data-trim="${scene.id}" role="slider" tabindex="0" aria-label="Length of scene ${numberOf(scene.id)}" aria-valuenow="${scene.seconds}" aria-valuemin="1" aria-valuemax="90" title="Drag to change the length"></span>
    </div>`;
}

function chapterLaneMarkup() {
  const blocks = [...state.chapters.entries()].map(([index, chapter]) => {
    const edge =
      index === state.chapters.length - 1
        ? ""
        : `<span class="chapter-edge" data-edge="${chapter.id}" role="slider" tabindex="0" aria-label="Line between chapter ${index + 1} and chapter ${index + 2}" aria-valuenow="${chapterLength(chapter.id)}" title="Drag to move the line between two chapters"></span>`;
    return `<div class="chapter-clip" draggable="true" data-chapter-clip="${chapter.id}" data-step="${chapter.step}" style="flex-grow:${chapterLength(chapter.id)}"><span>${index + 1}. ${escapeText(chapter.name)}</span><em>${stepLabels[chapter.step]}</em>${edge}</div>`;
  });
  return `<div class="track"><span class="track-name">Chapters</span><div class="track-lane chapter-lane" data-chapter-lane>${blocks.join("")}<span class="edge-ghost" hidden></span></div></div>`;
}

function barMarkup({ name, text, on, kind }) {
  return `<div class="track"><span class="track-name">${name}</span><div class="track-lane"><div class="clip ${kind}" data-on="${on}">${on ? escapeText(text) : "Off"}</div></div></div>`;
}

function musicMarkup() {
  const total = totalSeconds();
  const clip = state.musicClip;
  return `<div class="track"><span class="track-name">Music</span><div class="track-lane music-lane" data-music-lane><div class="clip music-clip movable" data-on="${state.music.on}" data-music-block style="left:${(clip.start / total) * 100}%;width:${(clip.seconds / total) * 100}%" title="Drag to move the music. Drag its right edge to change its length."><span>${escapeText(state.music.choice)}</span><span class="trim"></span></div></div></div>`;
}

function rulerMarkup() {
  const total = totalSeconds();
  const marks = [];
  for (let second = 0; second <= total; second += 60) {
    marks.push(
      `<span style="left:${(second / total) * 100}%">${minutesText(second)}</span>`,
    );
  }
  return `<div class="track"><span class="track-name"></span><div class="ruler">${marks.join("")}</div></div>`;
}

function bindDrops(element) {
  element.querySelectorAll("[data-clip]").forEach((clip) => {
    const sceneId = clip.dataset.clip;
    clip.addEventListener("dragstart", () =>
      Object.assign(drag, { kind: "scene", id: sceneId }),
    );
    clip.addEventListener("dragover", (event) => {
      event.preventDefault();
      clip.dataset.over = "true";
    });
    clip.addEventListener("dragleave", () => delete clip.dataset.over);
    clip.addEventListener("drop", (event) => {
      event.preventDefault();
      const target = state.scenes.find((scene) => scene.id === sceneId);
      if (drag.kind === "scene") {
        moveSceneTo({
          sceneId: drag.id,
          chapterId: target.chapterId,
          beforeId: sceneId,
        });
      }
      if (drag.kind === "take-item") {
        placeItem({ sceneId, itemId: drag.id });
      }
      drag.kind = undefined;
    });
  });
  element.querySelectorAll("[data-chapter-clip]").forEach((block) => {
    block.addEventListener("dragstart", (event) => {
      if (event.target !== block) {
        return;
      }
      Object.assign(drag, { kind: "chapter", id: block.dataset.chapterClip });
    });
    block.addEventListener("dragover", (event) => event.preventDefault());
    block.addEventListener("drop", (event) => {
      event.preventDefault();
      if (drag.kind === "chapter") {
        moveChapter({
          chapterId: drag.id,
          beforeId: block.dataset.chapterClip,
        });
      }
      if (drag.kind === "scene") {
        moveSceneTo({
          sceneId: drag.id,
          chapterId: block.dataset.chapterClip,
          beforeId: undefined,
        });
      }
      drag.kind = undefined;
    });
  });
}

export function renderTimeline({ element }) {
  const voiceText = state.scenes.map((scene) => scene.text).join(". ");
  element.innerHTML = `
    ${trayMarkup()}
    ${rulerMarkup()}
    ${chapterLaneMarkup()}
    <div class="track"><span class="track-name">Scenes</span><div class="track-lane" data-scene-lane>${state.scenes.map(clipMarkup).join("")}</div></div>
    ${barMarkup({ name: "Voice", text: voiceText, on: state.voice.on, kind: "voice-clip" })}
    ${musicMarkup()}
    ${barMarkup({ name: "Captions", text: `${state.captions.choice}, from the voice`, on: state.captions.on, kind: "voice-clip" })}
    <p class="fact">Drag a chapter or a scene to move it. Drag the edge of a chapter, a scene, or the music to change it. Drag a picture or a clip from Takes onto a scene.</p>`;
  const lane = element.querySelector("[data-scene-lane]");
  element.querySelectorAll("[data-pick-clip]").forEach((button) => {
    button.addEventListener("click", () => pick(button.dataset.pickClip));
  });
  bindDrops(element);
  bindTray(element);
  element
    .querySelectorAll("[data-trim]")
    .forEach((handle) => bindTrim({ handle, lane }));
  const chapterLane = element.querySelector("[data-chapter-lane]");
  element
    .querySelectorAll("[data-edge]")
    .forEach((handle) => bindChapterEdge({ handle, lane: chapterLane }));
  bindMusicDrag({
    block: element.querySelector("[data-music-block]"),
    lane: element.querySelector("[data-music-lane]"),
  });
}
