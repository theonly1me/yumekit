import { voices } from "./data.js";
import { addScene } from "./scenesRow.js";
import { change, notify, numberOf, record, say, state } from "./state.js";

const replyMilliseconds = 1200;

function shorter() {
  record({
    text: "The AI made each scene shorter. The video lost a few seconds.",
    apply: () =>
      state.scenes.forEach(
        (scene) => (scene.seconds = Math.max(2, scene.seconds - 1)),
      ),
  });
}

function nextVoice() {
  const next = voices[(voices.indexOf(state.voice.choice) + 1) % voices.length];
  record({
    text: `The AI changed the voice to "${next}" and recorded it again.`,
    apply: () => (state.voice = { on: true, choice: next }),
  });
}

function reword(scene) {
  const target = scene ?? state.scenes[0];
  record({
    text: `The AI changed the text of scene ${numberOf(target.id)} to "${target.other}".`,
    apply: () => {
      const old = target.text;
      target.text = target.other;
      target.other = old;
      state.viewSceneId = target.id;
    },
  });
}

function answer({ text, scene, files }) {
  const words = text.toLowerCase();
  if (files.length > 0) {
    return say({
      kind: "ai",
      text: `I added ${files.length} file${files.length === 1 ? "" : "s"} to the project. I use them as references in the next take, and I show them in Takes as yours.`,
    });
  }
  if (words.includes("short")) {
    return shorter();
  }
  if (words.includes("voice")) {
    return nextVoice();
  }
  if (words.includes("add") || words.includes("price")) {
    return addScene({
      afterId: scene?.id ?? state.scenes.at(-2)?.id,
      description: "What it costs: only the clips you make",
    });
  }
  if (
    words.includes("video") ||
    words.includes("clip") ||
    words.includes("real")
  ) {
    say({
      kind: "ai",
      text: "A real video clip costs money, so I ask first. Choose the model and the length.",
    });
    return change({
      sheet: "clip",
      pickedSceneId: scene?.id ?? state.viewSceneId,
    });
  }
  if (words.includes("music")) {
    return record({
      text: 'The AI changed the music to "Light electronic".',
      apply: () => (state.music = { on: true, choice: "Light electronic" }),
    });
  }
  return reword(scene);
}

export function ask({ text, scene, files }) {
  state.draft = "";
  state.chat.push({
    kind: "you",
    text,
    files,
    about:
      scene === undefined
        ? undefined
        : `Scene ${numberOf(scene.id)}: ${scene.title}`,
  });
  state.thinking = true;
  notify();
  setTimeout(() => {
    state.thinking = false;
    answer({ text, scene, files });
  }, replyMilliseconds);
}
