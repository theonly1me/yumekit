import { moveLine, scenesIn } from "./chapters.js";
import { numberOf, record, startOf, state, totalSeconds } from "./state.js";

function boundariesOf(leftId) {
  const index = state.chapters.findIndex((chapter) => chapter.id === leftId);
  const right = state.chapters[index + 1];
  const pair = [...scenesIn(leftId), ...scenesIn(right.id)];
  return pair
    .slice(1)
    .map((scene) => ({ sceneId: scene.id, seconds: startOf(scene.id) }));
}

function nearest({ options, seconds }) {
  let best = options[0];
  for (const option of options) {
    if (Math.abs(option.seconds - seconds) < Math.abs(best.seconds - seconds)) {
      best = option;
    }
  }
  return best;
}

export function bindChapterEdge({ handle, lane }) {
  const leftId = handle.dataset.edge;
  const ghost = lane.querySelector(".edge-ghost");
  const total = totalSeconds();
  const options = boundariesOf(leftId);
  const current = options.findIndex(
    (option) => option.sceneId === scenesIn(leftId).at(-1)?.id,
  );
  handle.addEventListener("keydown", (event) => {
    const now = options.findIndex(
      (option) =>
        state.scenes.find((scene) => scene.id === option.sceneId)?.chapterId !==
        leftId,
    );
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const next = options[now + (step ?? 0)];
    if (step !== undefined && next !== undefined) {
      event.preventDefault();
      moveLine({ leftId, firstSceneId: next.sceneId });
    }
  });
  handle.addEventListener("pointerdown", (down) => {
    down.preventDefault();
    handle.setPointerCapture(down.pointerId);
    const box = lane.getBoundingClientRect();
    let chosen = options[current + 1];
    const move = (event) => {
      const seconds = ((event.clientX - box.left) / box.width) * total;
      chosen = nearest({ options, seconds });
      ghost.hidden = false;
      ghost.style.left = `${(chosen.seconds / total) * 100}%`;
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      ghost.hidden = true;
      if (chosen !== undefined) {
        moveLine({ leftId, firstSceneId: chosen.sceneId });
      }
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });
}

export function bindMusicDrag({ block, lane }) {
  const total = totalSeconds();
  const clip = state.musicClip;
  const drawAt = ({ start, seconds }) => {
    block.style.left = `${(start / total) * 100}%`;
    block.style.width = `${(seconds / total) * 100}%`;
  };
  const dragWith = ({ down, resize }) => {
    down.preventDefault();
    down.stopPropagation();
    const target = down.currentTarget;
    target.setPointerCapture(down.pointerId);
    const perSecond = lane.getBoundingClientRect().width / total;
    let next = { ...clip };
    const move = (event) => {
      const delta = Math.round((event.clientX - down.clientX) / perSecond);
      next = resize
        ? {
            ...clip,
            seconds: Math.min(
              total - clip.start,
              Math.max(20, clip.seconds + delta),
            ),
          }
        : {
            ...clip,
            start: Math.min(
              total - clip.seconds,
              Math.max(0, clip.start + delta),
            ),
          };
      drawAt(next);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      if (next.start === clip.start && next.seconds === clip.seconds) {
        return;
      }
      record({
        text: resize
          ? `You changed the music to ${next.seconds} seconds.`
          : `You moved the music to start at ${Math.floor(next.start / 60)}:${String(next.start % 60).padStart(2, "0")}.`,
        apply: () => Object.assign(state.musicClip, next),
      });
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };
  block.addEventListener("pointerdown", (down) =>
    dragWith({ down, resize: false }),
  );
  block
    .querySelector(".trim")
    .addEventListener("pointerdown", (down) =>
      dragWith({ down, resize: true }),
    );
}

function setSeconds({ scene, seconds }) {
  const next = Math.min(90, Math.max(1, seconds));
  if (next === scene.seconds) {
    return;
  }
  record({
    text: `You changed scene ${numberOf(scene.id)} to ${next} seconds.`,
    apply: () => (scene.seconds = next),
  });
}

export function bindTrim({ handle, lane }) {
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
        90,
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
