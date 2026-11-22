import { firstScenes } from "./data.js";

const listeners = [];

export const state = {
  screen: "start",
  sheet: undefined,
  prompt: "",
  platformIds: ["youtube", "tiktok"],
  activePlatformId: "youtube",
  length: "30 seconds",
  scenes: structuredClone(firstScenes),
  viewSceneId: "s1",
  pickedSceneId: undefined,
  aboutScene: true,
  sideTab: "chat",
  draft: "",
  chat: [
    { kind: "you", text: "Make a short video that explains what yumekit is." },
    {
      kind: "ai",
      text: "I made 5 scenes with a voice, music, and captions. Pick a scene to change it, or ask me here.",
    },
  ],
  thinking: false,
  timelineOpen: false,
  openRow: undefined,
  voice: { on: true, choice: "Warm narrator" },
  music: { on: true, choice: "Soft piano" },
  captions: { on: true, choice: "Word by word" },
  agentId: "claude-code",
  keys: { gemini: false, fal: false, openai: true, sample: true },
  limitSeconds: 30,
  usedSeconds: 4,
  playing: false,
  playheadSeconds: 0,
  script: undefined,
  ownPictures: new Map(),
};

export function onChange(listener) {
  listeners.push(listener);
}

export function notify() {
  listeners.forEach((listener) => listener());
}

export function change(patch) {
  Object.assign(state, patch);
  notify();
}

function snapshot() {
  return structuredClone({
    scenes: state.scenes,
    voice: state.voice,
    music: state.music,
    captions: state.captions,
  });
}

export function record({ text, apply }) {
  const before = snapshot();
  apply();
  state.chat.push({ kind: "change", text, before, undone: false });
  notify();
}

export function undo(entry) {
  Object.assign(state, structuredClone(entry.before));
  entry.undone = true;
  if (!state.scenes.some((scene) => scene.id === state.viewSceneId)) {
    state.viewSceneId = state.scenes[0]?.id;
  }
  if (!state.scenes.some((scene) => scene.id === state.pickedSceneId)) {
    state.pickedSceneId = undefined;
  }
  notify();
}

export function say({ kind, text }) {
  state.chat.push({ kind, text });
  notify();
}

export function sceneOf(sceneId) {
  return state.scenes.find((scene) => scene.id === sceneId);
}

export function numberOf(sceneId) {
  return state.scenes.findIndex((scene) => scene.id === sceneId) + 1;
}

export function pickedScene() {
  return sceneOf(state.pickedSceneId);
}

export function viewScene() {
  return sceneOf(state.viewSceneId) ?? state.scenes[0];
}

export function totalSeconds() {
  let sum = 0;
  for (const scene of state.scenes) {
    sum += scene.seconds;
  }
  return sum;
}

export function startOf(sceneId) {
  let start = 0;
  for (const scene of state.scenes) {
    if (scene.id === sceneId) {
      return start;
    }
    start += scene.seconds;
  }
  return 0;
}

export function sceneAt(seconds) {
  let end = 0;
  for (const scene of state.scenes) {
    end += scene.seconds;
    if (seconds < end) {
      return scene;
    }
  }
  return state.scenes.at(-1);
}

export function pick(sceneId) {
  const same = state.pickedSceneId === sceneId;
  change({
    pickedSceneId: same ? undefined : sceneId,
    viewSceneId: sceneId,
    aboutScene: true,
    playing: false,
    playheadSeconds: startOf(sceneId),
    sideTab: same ? "chat" : state.sideTab,
  });
}

let nextNumber = 6;

export function newSceneId() {
  nextNumber += 1;
  return `s${nextNumber}`;
}

export function escapeText(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
