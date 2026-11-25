import { change, escapeText, state } from "./state.js";
import { takes } from "./takesStore.js";

const toastMilliseconds = 6000;
const signal = { timer: undefined };

function chime() {
  try {
    const sound = new AudioContext();
    [...[660, 880].entries()].forEach(([index, pitch]) => {
      const tone = sound.createOscillator();
      const volume = sound.createGain();
      const start = sound.currentTime + index * 0.16;
      tone.frequency.value = pitch;
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      tone.connect(volume).connect(sound.destination);
      tone.start(start);
      tone.stop(start + 0.55);
    });
  } catch {
    return;
  }
}

function browserNotice(text) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  try {
    new Notification("yumekit", { body: text });
  } catch {
    return;
  }
}

function toastElement() {
  const found = document.getElementById("toast");
  if (found !== null) {
    return found;
  }
  const toast = document.createElement("div");
  toast.id = "toast";
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.append(toast);
  return toast;
}

export function openTake({ chapterId, number }) {
  Object.assign(takes.view, {
    chapterId,
    takeNumber: number,
    filter: "all",
    openItemId: undefined,
    compareItemId: undefined,
  });
  if (state.screen === "project") {
    change({ projectView: "take" });
    return;
  }
  change({ sheet: "takes", playing: false });
}

export function ringReady({ text, take }) {
  const toast = toastElement();
  toast.innerHTML = `<p>${escapeText(text)}</p><button type="button" class="primary" data-open-ready>Open take ${take.number}</button>`;
  toast.hidden = false;
  toast.querySelector("[data-open-ready]").addEventListener("click", () => {
    toast.hidden = true;
    openTake({ chapterId: take.chapterId, number: take.number });
  });
  clearTimeout(signal.timer);
  signal.timer = setTimeout(() => (toast.hidden = true), toastMilliseconds);
  if (state.limits.readySignal) {
    chime();
    browserNotice(text);
  }
}

export function askForNotices() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => undefined);
  }
}
