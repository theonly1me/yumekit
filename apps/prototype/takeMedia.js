import { artMarkup } from "./art.js";
import { escapeText } from "./state.js";
import { addComment } from "./takesStore.js";

const tickMilliseconds = 50;
export const frameSeconds = 1 / 24;
const players = new Map();
const playback = { timer: undefined, itemId: undefined };

export function playerOf(item) {
  if (!players.has(item.id)) {
    players.set(item.id, { seconds: 0, rate: 1 });
  }
  return players.get(item.id);
}

export function clockOf(seconds) {
  const whole = Math.floor(seconds);
  const tenth = Math.floor((seconds - whole) * 10);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}.${tenth}`;
}

function waveMarkup(item) {
  const bars = [];
  for (let index = 0; index < 56; index += 1) {
    const seed = (index * ((item.title.charCodeAt(0) % 9) + 3)) % 11;
    const swell = index > 28 && index < 40 ? 1.6 : 1;
    bars.push(
      `<i style="height:${Math.min(100, (18 + seed * 6) * swell)}%"></i>`,
    );
  }
  return `<div class="wave" aria-hidden="true">${bars.join("")}</div>`;
}

function marksMarkup(item) {
  return [...item.comments.entries()]
    .map(([index, comment]) => {
      if (comment.kind === "pin") {
        return `<span class="pin" style="left:${comment.x * 100}%;top:${comment.y * 100}%">${index + 1}</span>`;
      }
      if (comment.kind === "moment") {
        return `<span class="moment-mark" style="left:${(comment.seconds / item.seconds) * 100}%" title="${clockOf(comment.seconds)}"></span>`;
      }
      return "";
    })
    .join("");
}

export function mediaMarkup({ item, large = false, overlay = "" }) {
  const player = playerOf(item);
  const share = item.seconds === 0 ? 0 : player.seconds / item.seconds;
  const moving = item.kind === "clip" || item.kind === "cut";
  const visual =
    item.kind === "music" ? waveMarkup(item) : artMarkup(item.picture);
  const playable = item.kind !== "picture";
  const controls = playable
    ? `<div class="player" data-player="${item.id}">
        <button type="button" class="play" data-play="${item.id}" aria-label="Play ${escapeText(item.title)}">${playback.itemId === item.id ? "Pause" : "Play"}</button>
        <div class="scrub" data-scrub="${item.id}" role="slider" tabindex="0" aria-label="Time" aria-valuenow="${player.seconds.toFixed(1)}" aria-valuemin="0" aria-valuemax="${item.seconds}"><i style="width:${share * 100}%"></i>${marksMarkup(item)}</div>
        <span class="time" data-time="${item.id}">${clockOf(player.seconds)}</span>
        <button type="button" class="mark-moment" data-moment="${item.id}">Mark this moment</button>
      </div>`
    : "";
  return `
    <div class="media" data-kind="${item.kind}" data-large="${large}">
      <div class="stage-box ${moving ? "moving" : ""}" data-stage="${item.id}" style="--time:${share}">
        ${visual}
        ${item.kind === "picture" ? marksMarkup(item) : ""}
        ${overlay}
      </div>
      ${controls}
    </div>`;
}

function drawTime(item) {
  const player = playerOf(item);
  const share = player.seconds / item.seconds;
  document.querySelectorAll(`[data-stage="${item.id}"]`).forEach((stage) => {
    stage.style.setProperty("--time", String(share));
  });
  document.querySelectorAll(`[data-scrub="${item.id}"] > i`).forEach((bar) => {
    bar.style.width = `${share * 100}%`;
  });
  document.querySelectorAll(`[data-time="${item.id}"]`).forEach((time) => {
    time.textContent = clockOf(player.seconds);
  });
}

export function stopPlayback() {
  clearInterval(playback.timer);
  playback.timer = undefined;
  document
    .querySelectorAll(`[data-play="${playback.itemId}"]`)
    .forEach((button) => (button.textContent = "Play"));
  playback.itemId = undefined;
}

export function togglePlay(item) {
  const same = playback.itemId === item.id;
  stopPlayback();
  if (same) {
    return;
  }
  playback.itemId = item.id;
  document
    .querySelectorAll(`[data-play="${item.id}"]`)
    .forEach((button) => (button.textContent = "Pause"));
  playback.timer = setInterval(() => {
    const player = playerOf(item);
    player.seconds += (tickMilliseconds / 1000) * player.rate;
    if (player.seconds >= item.seconds) {
      player.seconds = 0;
      stopPlayback();
    }
    drawTime(item);
  }, tickMilliseconds);
}

export function seek({ item, seconds }) {
  playerOf(item).seconds = Math.min(item.seconds, Math.max(0, seconds));
  drawTime(item);
}

export function markMoment(item) {
  stopPlayback();
  const seconds = Math.round(playerOf(item).seconds * 10) / 10;
  addComment({ item, comment: { kind: "moment", seconds, text: "" } });
}

export function bindMedia({ element, item, onPin }) {
  const stage = element.querySelector(`[data-stage="${item.id}"]`);
  if (item.kind === "picture") {
    stage.addEventListener("click", (event) => {
      const box = stage.getBoundingClientRect();
      const x = Math.min(
        1,
        Math.max(0, (event.clientX - box.left) / box.width),
      );
      const y = Math.min(
        1,
        Math.max(0, (event.clientY - box.top) / box.height),
      );
      onPin();
      addComment({ item, comment: { kind: "pin", x, y, text: "" } });
    });
  }
  element
    .querySelector(`[data-play="${item.id}"]`)
    ?.addEventListener("click", () => togglePlay(item));
  element
    .querySelector(`[data-moment="${item.id}"]`)
    ?.addEventListener("click", () => {
      onPin();
      markMoment(item);
    });
  const scrub = element.querySelector(`[data-scrub="${item.id}"]`);
  scrub?.addEventListener("pointerdown", (down) => {
    const box = scrub.getBoundingClientRect();
    seek({
      item,
      seconds: ((down.clientX - box.left) / box.width) * item.seconds,
    });
  });
  scrub?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? frameSeconds : -frameSeconds;
      seek({ item, seconds: playerOf(item).seconds + step });
    }
  });
}
