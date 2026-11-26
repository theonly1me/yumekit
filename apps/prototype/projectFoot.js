import { nextChapterOf, picturesPlan } from "./chapterWork.js";
import { chapterNumber, needsNotes, plannedClips } from "./leadWork.js";
import { warningMarkup } from "./costGuard.js";
import { cutOf } from "./projectFilm.js";
import { state } from "./state.js";
import {
  storyIsApproved,
  storyIsWriting,
  storyNoteCount,
} from "./storySheet.js";
import { prices } from "./takeItems.js";
import {
  costOf,
  currentItemsOf,
  money,
  shownTake,
  takes,
  takesOf,
} from "./takesStore.js";

const markHint =
  "Mark only what needs a change. Everything else counts as approved.";

function notesLabel(count) {
  return `Send ${count} note${count === 1 ? "" : "s"} to the lead`;
}

function storyFoot() {
  const count = storyNoteCount();
  if (storyIsWriting()) {
    return ["The lead writes the story again from your notes.", []];
  }
  if (count > 0) {
    return [
      `${count} notes on the story.`,
      [["send-story", notesLabel(count)]],
    ];
  }
  if (!storyIsApproved()) {
    return [
      "Read it once. Approve it, or click a paragraph to say what to change.",
      [["approve-story", "Approve the story"]],
    ];
  }
  return ["You approved the story.", [["back", "Back to the chapter"]]];
}

function takeFoot(take) {
  const latest = takesOf(take.chapterId).at(-1) === take;
  if (!latest) {
    return [
      "This is an earlier take. Your notes went to the lead with it.",
      [["latest", "Open the latest take"]],
    ];
  }
  const count = currentItemsOf(take).filter(needsNotes).length;
  if (count > 0) {
    return [
      `${count} to change, leave out, or answer. Everything else counts as approved.`,
      [["send", "Send the review to the lead"]],
    ];
  }
  if (take.step === "pictures") {
    const planned = plannedClips(take);
    return [
      markHint,
      [
        [
          "clips",
          `All good. Make the clips, about ${money(planned.seconds * prices.clipSecond + 3 * prices.music)}`,
        ],
      ],
    ];
  }
  return [markHint, [["cut", "All good. Make the cut"]]];
}

function filmFoot() {
  const cut = cutOf(takes.view.chapterId);
  if (cut === undefined) {
    return ["", []];
  }
  if (
    needsNotes(cut) ||
    (cut.comments.length > 0 && cut.verdict === "waiting")
  ) {
    return [markHint, [["send", notesLabel(cut.comments.length)]]];
  }
  if (cut.verdict !== "approved") {
    return [
      "Watch it once at full speed.",
      [["approve-cut", "Approve the cut"]],
    ];
  }
  const next = nextChapterOf(takes.view.chapterId);
  return next === undefined
    ? ["The film is done.", [["export", "Export"]]]
    : [
        `Chapter ${chapterNumber(takes.view.chapterId)} is done.`,
        [
          ["export-other", "Export"],
          ["next", "Next chapter"],
        ],
      ];
}

function footOf(view) {
  const take = shownTake();
  const feet = {
    waiting: () => ["Answer the lead in the chat.", []],
    story: storyFoot,
    empty: () => {
      const plan = picturesPlan(takes.view.chapterId);
      return [
        `Chapter ${chapterNumber(takes.view.chapterId)}: ${plan.count} pictures.`,
        [["pictures", `Make the pictures, about ${plan.price}`]],
      ];
    },
    work: () => [
      `This take has cost ${money(costOf(take).spent)} so far.`,
      [["stop-other", "Stop"]],
    ],
    take: () => takeFoot(take),
    film: filmFoot,
  };
  return feet[view]();
}

export function footMarkup(view) {
  if (state.costWarning !== undefined) {
    return `<footer class="work-foot">${warningMarkup()}</footer>`;
  }
  const [text, buttons] = footOf(view);
  const take = shownTake();
  const cost =
    view === "take" && take !== undefined
      ? ` This take cost ${money(costOf(take).spent)}.`
      : "";
  const markup = buttons
    .map(
      ([id, label]) =>
        `<button type="button" class="${id.endsWith("-other") ? "" : "primary"}" data-foot="${id}">${label}</button>`,
    )
    .join("");
  return `<footer class="work-foot"><p class="fact">${text}${cost}</p><div class="foot-actions">${markup}</div></footer>`;
}
