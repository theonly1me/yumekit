import { escapeText, notify } from "./state.js";

const kinds = [
  ["image/", "picture", "Picture"],
  ["video/", "clip", "Clip"],
  ["audio/", "music", "Sound"],
];

function fileOf(file) {
  const [, kind, label] = kinds.find(([prefix]) =>
    file.type.startsWith(prefix),
  ) ?? ["", "document", "Text"];
  return {
    name: file.name,
    kind,
    label,
    url: kind === "picture" ? URL.createObjectURL(file) : undefined,
  };
}

function chipMarkup([index, file]) {
  const thumb =
    file.url === undefined
      ? `<span class="file-thumb" data-kind="${file.kind}">${file.label}</span>`
      : `<span class="file-thumb" style="background-image:url('${file.url}')"></span>`;
  return `<li class="file-chip">${thumb}<span class="file-name">${escapeText(file.name)}</span><button type="button" class="remove" data-remove-file="${index}" aria-label="Remove ${escapeText(file.name)}">Remove</button></li>`;
}

export function chipsMarkup(files) {
  if (files.length === 0) {
    return "";
  }
  return `<ul class="file-chips" aria-label="Files for the lead">${[...files.entries()].map(chipMarkup).join("")}</ul>`;
}

export function addFilesMarkup(id) {
  return `<label class="add-files" for="${id}">Add files<input type="file" id="${id}" multiple accept="image/*,video/*,audio/*,.txt,.md,.pdf,.doc,.docx" data-add-files /></label>`;
}

export function bindFiles({ zone, files }) {
  const add = (list) => {
    [...list].forEach((file) => files.push(fileOf(file)));
    notify();
  };
  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    zone.dataset.dragging = "true";
  });
  zone.addEventListener("dragleave", (event) => {
    if (!zone.contains(event.relatedTarget)) {
      zone.dataset.dragging = "false";
    }
  });
  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    zone.dataset.dragging = "false";
    if (event.dataTransfer.files.length > 0) {
      add(event.dataTransfer.files);
    }
  });
  zone.addEventListener("paste", (event) => {
    if (event.clipboardData.files.length > 0) {
      event.preventDefault();
      add(event.clipboardData.files);
    }
  });
  zone
    .querySelector("[data-add-files]")
    ?.addEventListener("change", (event) => {
      add(event.target.files);
    });
  zone.querySelectorAll("[data-remove-file]").forEach((button) => {
    button.addEventListener("click", () => {
      files.splice(Number(button.dataset.removeFile), 1);
      notify();
    });
  });
}
