import { escapeText as text } from "../state.js";
import { session } from "./projects.js";
import { canReview, viewedTake } from "./takeHistory.js";
import { button, cover, still } from "./views.js";

export function takeList() {
  const p = session.project;
  const items = p.takes
    .toReversed()
    .map(
      (take) =>
        `<button class="project-row" data-take="${take.number}"><span class="thumb">${take.kind === "Cut" ? cover() : still(take.scenes[0])}</span><span class="info"><b>Take ${take.number} · ${take.kind}</b><span class="meta">${take.status} · ${take.kind === "Cut" ? "Finished film" : `${take.scenes.length} shots`}</span></span><span aria-hidden="true">›</span></button>`,
    );
  const revise =
    p.stage === "Changes requested"
      ? button({ action: "pictures", label: "Preview revised take" })
      : "";
  return `<h2>Takes</h2>${items.join("") || '<section class="card"><h3>No takes yet</h3><p>Your project reviews will appear here.</p></section>'}${revise}`;
}

export function review() {
  const p = session.project,
    take = viewedTake(p);
  const select = `<label for="take-picker">Viewing take</label><select id="take-picker">${p.takes
    .toReversed()
    .map(
      (entry) =>
        `<option value="${entry.number}" ${entry === take ? "selected" : ""}>Take ${entry.number} · ${entry.status}</option>`,
    )
    .join("")}</select>`;
  if (take.kind === "Cut")
    return `<div class="action-row take-picker">${select}</div><div class="section-head"><h2>Finished cut</h2></div><div class="still">${cover()}</div>${button({ action: "export", label: "Open export" })}`;
  const scene = take.scenes[take.shot],
    note = take.notes[scene.id] ?? "";
  const frames = Array.from(
    take.scenes.entries(),
    ([i, item]) =>
      `<button data-shot="${i}" aria-label="Review picture ${i + 1}" aria-pressed="${i === take.shot}"><span>${still(item)}</span><small>${i + 1}${take.notes[item.id] ? " · Note" : ""}</small></button>`,
  ).join("");
  const mark = canReview(p)
    ? button({
        action: "note",
        label: session.editingNote
          ? "Close note"
          : note
            ? "Edit note"
            : "Mark a change",
      })
    : "";
  return `<div class="action-row take-picker">${select}</div><div class="section-head"><h2>Pictures</h2><span class="meta">${take.shot + 1} of ${take.scenes.length}</span></div><h3>${text(scene.title)}</h3><div class="still">${still(scene)}</div><p>${text(scene.shots.join(". "))}.</p>
  <div class="frames">${frames}</div>${mark}
  ${session.editingNote && canReview(p) ? `<div class="input-card"><label for="shot-note">Note on picture ${take.shot + 1}</label><textarea id="shot-note">${text(note)}</textarea></div>` : note ? `<div class="bubble"><b>Your note</b><p>${text(note)}</p></div>` : ""}
  ${canReview(p) ? '<p class="meta">Unmarked pictures count as approved when you send the take.</p>' : `<p class="meta">Take ${take.number} · ${take.status}</p>`}`;
}
