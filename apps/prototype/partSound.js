import { musicChoices } from "./data.js";
import { escapeText, record, state } from "./state.js";

const barCount = 64;
export const view = { playing: undefined, note: "" };

function waveMarkup(name) {
  let seed = [...name].reduce((sum, letter) => sum + letter.charCodeAt(0), 7);
  const bars = Array.from({ length: barCount }, () => {
    seed = (seed * 9301 + 49297) % 233280;
    return `<i style="height:${18 + Math.round((seed / 233280) * 82)}%"></i>`;
  });
  return `<span class="wave" aria-hidden="true">${bars.join("")}</span>`;
}

function trackMarkup({ name, length, action }) {
  const playing = view.playing === name;
  return `
    <div class="sound-track" data-playing="${playing}">
      <button type="button" data-play="${escapeText(name)}" aria-pressed="${playing}">${playing ? "Pause" : "Play"}</button>
      ${waveMarkup(name)}
      <span class="track-name">${escapeText(name)}</span>
      <span class="fact">${length}</span>
      ${action ?? ""}
    </div>`;
}

function ownFileMarkup(file) {
  return `
    <div class="sound-track own">
      <span class="track-name">Your file: ${escapeText(file.name)}</span>
      <audio controls src="${file.url}"></audio>
    </div>`;
}

export function bind({ element, redraw }) {
  element.querySelectorAll("[data-play]").forEach((button) => {
    button.addEventListener("click", () => {
      view.playing =
        view.playing === button.dataset.play ? undefined : button.dataset.play;
      redraw(view.playing === undefined ? "" : "This mock has no sound.");
    });
  });
}

export function fileOf(event) {
  const [file] = event.target.files;
  return file === undefined
    ? undefined
    : { name: file.name, url: URL.createObjectURL(file) };
}

export function renderMusic({ element, locked }) {
  const off = locked ? "disabled" : "";
  const music = state.music;
  const redraw = (note = "") => {
    view.note = note;
    renderMusic({ element, locked });
  };
  const use = ({ choice, file }) => {
    record({
      text: `You changed the music to "${file?.name ?? choice}".`,
      apply: () => (state.music = { ...music, on: true, choice, file }),
    });
    view.playing = undefined;
    redraw();
  };
  const now = !music.on
    ? `<p class="fact lead">The video has no music.</p>`
    : music.file === undefined
      ? trackMarkup({ name: music.choice, length: "0:18" })
      : ownFileMarkup(music.file);
  const others = musicChoices
    .filter((choice) => choice !== music.choice || music.file !== undefined)
    .map((choice) =>
      trackMarkup({
        name: choice,
        length: "0:18",
        action: `<button type="button" data-use="${choice}" ${off}>Use this</button>`,
      }),
    )
    .join("");
  element.innerHTML = `
    <section class="part-group"><h4>In your video now</h4>${now}
      <label class="volume">How loud the music is under the voice<input type="range" min="0" max="100" value="${music.volume ?? 30}" data-volume ${off} /></label>
      <div class="part-actions">
        <button type="button" data-download ${music.on ? "" : "disabled"}>Download the music</button>
        <button type="button" data-remove ${off}>${music.on ? "Remove the music" : "Put the music back"}</button>
      </div>
    </section>
    <section class="part-group"><h4>Try another</h4>${others}
      <form class="describe" data-describe>
        <label>Or describe the music<input type="text" placeholder="For example: slow strings that build to a bright end" required ${off} /></label>
        <button type="submit" ${off}>Make this music</button>
      </form>
    </section>
    <section class="part-group"><h4>Use my own music</h4>
      <label class="drop" data-off="${locked}">
        <span>Drop a sound file here, or click to pick one</span>
        <span class="fact">MP3, WAV, or M4A. The file stays on your computer.</span>
        <input type="file" accept="audio/*" data-own ${off} />
      </label>
    </section>
    <p class="fact" aria-live="polite">${escapeText(view.note)}</p>`;
  bind({ element, redraw });
  element.querySelectorAll("[data-use]").forEach((button) => {
    button.addEventListener("click", () =>
      use({ choice: button.dataset.use, file: undefined }),
    );
  });
  element
    .querySelector("[data-describe]")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      use({
        choice: event.target.querySelector("input").value.trim(),
        file: undefined,
      });
    });
  element.querySelector("[data-own]").addEventListener("change", (event) => {
    const file = fileOf(event);
    if (file !== undefined) {
      use({ choice: music.choice, file });
    }
  });
  element.querySelector("[data-volume]").addEventListener("input", (event) => {
    music.volume = Number(event.target.value);
  });
  element.querySelector("[data-remove]").addEventListener("click", () => {
    record({
      text: `You turned the music ${music.on ? "off" : "on"}.`,
      apply: () => (state.music = { ...music, on: !music.on }),
    });
    redraw();
  });
  element
    .querySelector("[data-download]")
    .addEventListener("click", () =>
      redraw("The real editor saves the music as a sound file."),
    );
}
