import { platformOf } from "./data.js";
import { escapeText } from "./state.js";

const bestMegabitsPerSecond = 5.4;
const fillShare = 0.98;
const sharpFloor = [
  [1080, 1],
  [720, 0.5],
  [480, 0.25],
];
const targets = [10, 25];

export const sizes = new Map();

export function sizeOf(platformId) {
  if (!sizes.has(platformId)) {
    const platform = platformOf(platformId);
    sizes.set(platformId, {
      mode: "best",
      target: 10,
      own: "",
      lines: Math.min(platform.width, platform.height),
    });
  }
  return sizes.get(platformId);
}

function targetText(target) {
  return `${Number.isInteger(target) ? target : target.toFixed(1)} MB`;
}

function megabytes(amount) {
  return amount >= 100 ? `${Math.round(amount)} MB` : `${amount.toFixed(1)} MB`;
}

function megabitsFor({ size, seconds }) {
  return (size.target * 8) / seconds;
}

export function expectedText({ platformId, seconds }) {
  const size = sizeOf(platformId);
  const amount =
    size.mode === "best"
      ? (bestMegabitsPerSecond * seconds) / 8
      : size.target * fillShare;
  return `About ${megabytes(amount)}`;
}

export function realText({ platformId, seconds }) {
  const size = sizeOf(platformId);
  const amount =
    size.mode === "best"
      ? (bestMegabitsPerSecond * seconds * 1.03) / 8
      : size.target * 0.97;
  return `${megabytes(amount)}, ${size.lines}p`;
}

function warningMarkup({ platformId, seconds }) {
  const size = sizeOf(platformId);
  const rate = megabitsFor({ size, seconds });
  const [, floor] = sharpFloor.find(([lines]) => lines === size.lines) ?? [
    size.lines,
    0,
  ];
  if (size.mode === "best" || rate >= floor) {
    return "";
  }
  const fit = sharpFloor.find(
    ([lines, need]) => lines < size.lines && rate >= need,
  );
  if (fit === undefined) {
    return `<p class="size-warning">This video is too long to look good under ${targetText(size.target)}. Pick a larger size, or export one chapter.</p>`;
  }
  return `<p class="size-warning">This video looks soft under ${targetText(size.target)}. <button type="button" class="link" data-lines="${platformId}" data-value="${fit[0]}">Make it ${fit[0]}p?</button></p>`;
}

export function sizeMarkup({ platformId, seconds, busy }) {
  const size = sizeOf(platformId);
  const off = busy ? "disabled" : "";
  const choices =
    size.mode === "best"
      ? ""
      : `<span class="segments" role="group" aria-label="Largest file">${targets
          .map(
            (target) =>
              `<button type="button" data-target="${platformId}" data-value="${target}" aria-pressed="${size.own === "" && size.target === target}" ${off}>Under ${target} MB</button>`,
          )
          .join(
            "",
          )}</span><label class="own-size">Or under<input type="text" inputmode="decimal" data-own-size="${platformId}" value="${escapeText(size.own)}" aria-label="Your own largest size in MB" ${off} />MB</label>`;
  return `
    <div class="size-choice">
      <span class="segments" role="group" aria-label="File size">
        <button type="button" data-size-mode="${platformId}" data-value="best" aria-pressed="${size.mode === "best"}" ${off}>Best quality</button>
        <button type="button" data-size-mode="${platformId}" data-value="small" aria-pressed="${size.mode === "small"}" ${off}>Smaller file</button>
      </span>
      ${choices}
      <p class="fact">${expectedText({ platformId, seconds })}, ${size.lines}p.</p>
      ${warningMarkup({ platformId, seconds })}
    </div>`;
}

export function bindSizes({ element, redraw }) {
  const each = (selector) => (action) =>
    element.querySelectorAll(selector).forEach((control) => {
      control.addEventListener("click", () => {
        action(control);
        redraw();
      });
    });
  each("[data-size-mode]")((button) => {
    const platform = platformOf(button.dataset.sizeMode);
    Object.assign(sizeOf(button.dataset.sizeMode), {
      mode: button.dataset.value,
      lines: Math.min(platform.width, platform.height),
    });
  });
  each("[data-target]")((button) => {
    Object.assign(sizeOf(button.dataset.target), {
      target: Number(button.dataset.value),
      own: "",
    });
  });
  each("[data-lines]")((button) => {
    sizeOf(button.dataset.lines).lines = Number(button.dataset.value);
  });
  element.querySelectorAll("[data-own-size]").forEach((input) => {
    input.addEventListener("change", () => {
      const value = Number(input.value);
      const size = sizeOf(input.dataset.ownSize);
      if (Number.isFinite(value) && value > 0) {
        Object.assign(size, { target: value, own: input.value });
      }
      redraw();
    });
  });
}
