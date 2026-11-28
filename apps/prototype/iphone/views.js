import { artMarkup } from "../art.js";
import { escapeText as text } from "../state.js";
import { templates } from "../templates.js";
import { film, projects, session } from "./projects.js";

export const button = ({ action, label, style = "", disabled = false }) =>
  `<button type="button" class="${style}" data-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>`;

function still(scene) {
  return scene ? artMarkup({ kind: "scene", art: scene.art }) : "";
}

function poster() {
  return '<img src="unwritten.jpg" alt="Illustrated close-up of the eyes from Unwritten">';
}

function row(project) {
  const thumb = project === film ? poster() : still(project.scenes[0]);
  const status =
    project.stage === "Pictures" ? "3 pictures to review" : project.stage;
  return `<button class="project-row" data-project="${projects.indexOf(project)}"><span class="thumb">${thumb}</span><span class="info"><b>${text(project.title)}</b><span class="meta">${text(status)} · ${text(project.format)}</span></span><span class="arrow" aria-hidden="true">›</span></button>`;
}

export function studio() {
  return `<h2>Your studio</h2>
  <button class="poster" data-project="${projects.indexOf(film)}">${poster()}<span class="kicker">Latest export</span><strong>Unwritten</strong><span class="meta">Anime trailer · 56 sec</span></button>
  <div class="section-head"><h3>Projects</h3><span class="meta">${projects.length}</span></div>${projects.map(row).join("")}`;
}

export function create() {
  return `<span class="kicker">New project</span><h2>What do you want to make?</h2>
  <div class="chips" aria-label="Start from">${templates.map((t) => `<button data-template="${t.id}" aria-pressed="${t.id === session.template}">${t.name}</button>`).join("")}</div>
  <div class="input-card"><label for="brief">Your idea</label><textarea id="brief" rows="4" placeholder="Describe it. A rough story is enough.">${text(session.draft)}</textarea>
  <label class="attach" for="media">Add photos, video or music</label><input class="file-input" id="media" type="file" multiple accept="image/*,video/*,audio/*"></div>
  ${session.files.map((f) => `<p class="meta">${text(f)}</p>`).join("")}
  <div class="action-row"><label for="format">Where will it go?</label><select id="format">${["YouTube", "YouTube Shorts", "Instagram Reel", "TikTok"].map((f) => `<option ${session.format === f ? "selected" : ""}>${f}</option>`).join("")}</select></div>`;
}

export function project() {
  const p = session.project;
  const picture = p === film ? poster() : still(p.scenes[0]);
  const action =
    p.stage === "Pictures"
      ? button({ action: "takes", label: "Review pictures" })
      : "";
  return `<span class="kicker">${text(p.format)} · ${text(p.stage)}</span><h2>${text(p.title)}</h2>
  ${picture ? `<div class="still">${picture}</div>` : ""}<p>${text(p.brief)}</p>
  ${p.files.length ? `<p class="meta">Attached · ${p.files.map(text).join(", ")}</p>` : ""}
  ${action ? `<section class="card"><h3>Take ${p.take} · Pictures</h3><p>Review the three starting pictures before making clips.</p>${action}</section>` : ""}
  ${p.stage === "Story" ? button({ action: "pictures", label: "Review sample pictures" }) : ""}
  ${p.stage === "Changes requested" ? button({ action: "pictures", label: "Preview revised take" }) : ""}
  ${p.stage === "Clips" ? button({ action: "finish", label: "Preview finished cut" }) : ""}
  ${p.stage === "Finished" ? button({ action: "export", label: "Open export" }) : ""}
  <div class="section-head"><h3>Chat with the lead</h3></div>
  ${p.messages.map((m) => `<article class="bubble"><b>${text(m.author)}</b><p>${text(m.body)}</p></article>`).join("")}
  <div class="input-card"><label for="message">Ask for a change</label><textarea id="message" rows="2" placeholder="Tell the lead what to do next.">${text(p.messageDraft ?? "")}</textarea>${button({ action: "send", label: "Send", disabled: !p.messageDraft?.trim() })}</div>`;
}

export function takes() {
  const p = session.project,
    s = p.scenes[session.shot];
  const note = p.notes[s.id] ?? "";
  return `<span class="kicker">${text(p.title)} · Take ${p.take}</span><h2>Review pictures</h2><div class="action-row"><h3>${text(s.title)}</h3><span class="meta">${session.shot + 1} of ${p.scenes.length}</span></div>
  <div class="still">${still(s)}</div><p>${text(s.shots.join(". "))}.</p>
  <div class="frames">${Array.from(p.scenes.entries(), ([i, scene]) => `<button aria-label="Review picture ${i + 1}" aria-pressed="${i === session.shot}" data-shot="${i}"><span>${still(scene)}</span><small>${i + 1}${p.notes[scene.id] ? " · Note" : ""}</small></button>`).join("")}</div>
  ${button({ action: "note", label: session.editingNote ? "Close note" : note ? "Edit note" : "Mark a change" })}
  ${session.editingNote ? `<div class="input-card"><label for="shot-note">Note on picture ${session.shot + 1}</label><textarea id="shot-note" rows="2">${text(note)}</textarea></div>` : note ? `<div class="bubble"><b>Your note</b><p>${text(note)}</p></div>` : ""}
  <p class="meta">Unmarked pictures count as approved when you send the take.</p>`;
}

function cover() {
  return session.project === film ? poster() : still(session.project.scenes[0]);
}

export function exportView() {
  return `<span class="kicker">Export</span><h2>${text(session.project.title)}</h2><div class="still">${cover()}</div>
  <h3>Finished film</h3><p class="meta">MP4 · ${text(session.project.format)}${session.project === film ? " · 56 sec" : ""}</p>
  ${session.feedback ? `<p class="feedback" role="status">${text(session.feedback)}</p>` : ""}`;
}

export function connection() {
  return `<span class="kicker">Private connection</span><h2>${session.paired ? "Your Mac" : "Pair your Mac"}</h2>
  <section class="card"><h3>${session.paired ? "Studio Mac" : "Connect with Tailscale"}</h3><p>${session.paired ? (session.online ? "Connected" : "Offline. Open YumeKit on your Mac to reconnect.") : "Open Pair iPhone in YumeKit on your Mac, then scan its code."}</p></section>
  ${session.paired ? button({ action: "unpair", label: "Unpair this phone" }) : ""}`;
}

export function share() {
  return `<span class="kicker">Export · Share sheet preview</span><h2>Share film</h2>
  <div class="still">${cover()}</div><p class="meta">${text(session.project.title)}.mp4</p><div class="chips">${button({ action: "photos", label: "Save to Photos" })}${button({ action: "files", label: "Save to Files" })}</div>`;
}
