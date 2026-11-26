import { notify } from "./state.js";
import { takes } from "./takesStore.js";

export const reviewVerdicts = [
  ["approved", "Looks right"],
  ["change", "Has mistakes"],
  ["question", "Not sure"],
  ["dropped", "Don't use this one"],
];

export const reviewTags = {
  picture: [
    "Wrong face",
    "Wrong clothes",
    "Bad hands",
    "Wrong place",
    "Bad framing",
    "Style changed",
    "Looks AI-made",
  ],
  clip: [
    "Character changes",
    "Stiff motion",
    "Jump or pop",
    "Bad camera move",
    "Too slow",
    "Does not match its picture",
    "Looks AI-made",
  ],
  music: ["Wrong mood", "Weak start", "No clear hits", "Too busy", "Too plain"],
  cut: ["Too long", "Off the beat", "Jump or pop", "Music does not fit"],
};

export function reviewOf(item) {
  item.review ??= {
    verdict: item.verdict === "declined" ? "dropped" : undefined,
    tags: [],
    note: "",
    use: false,
  };
  return item.review;
}

function keepOldVerdict(item) {
  const { verdict } = reviewOf(item);
  item.verdict =
    verdict === "approved"
      ? "approved"
      : verdict === "dropped"
        ? "declined"
        : "waiting";
}

export function verdictOf(item) {
  const review = reviewOf(item);
  const hasWords =
    review.tags.length > 0 ||
    review.note.trim() !== "" ||
    item.comments.length > 0;
  return review.verdict ?? (hasWords ? "change" : undefined);
}

export function needsTheLead(item) {
  const verdict = item.review?.verdict;
  return verdict === "change" || verdict === "question";
}

export function openWithMistakes(item) {
  const review = reviewOf(item);
  review.verdict ??= "change";
  keepOldVerdict(item);
}

function slotOf(item) {
  return [...takes.items.values()].filter((other) => other.slot === item.slot);
}

export function pickVerdict({ item, verdict }) {
  const review = reviewOf(item);
  review.verdict = review.verdict === verdict ? undefined : verdict;
  review.use = review.verdict === "approved";
  if (review.use) {
    slotOf(item)
      .filter((other) => other !== item && other.review !== undefined)
      .forEach((other) => (other.review.use = false));
  }
  keepOldVerdict(item);
  notify();
}

export function toggleTag({ item, tag }) {
  const review = reviewOf(item);
  const has = review.tags.includes(tag);
  review.tags = has
    ? review.tags.filter((each) => each !== tag)
    : [...review.tags, tag];
  if (!has) {
    openWithMistakes(item);
  }
  notify();
}

export function writeNote({ item, text }) {
  reviewOf(item).note = text;
  if (text.trim() !== "") {
    openWithMistakes(item);
  }
}

function isLive(item) {
  const verdict = verdictOf(item);
  return (
    item.verdict !== "declined" &&
    (verdict === undefined || verdict === "approved")
  );
}

export function isUsedNow(item) {
  const slot = slotOf(item);
  const picked = slot.find((other) => other.review?.use === true);
  if (picked !== undefined) {
    return picked === item;
  }
  const live = slot
    .filter(isLive)
    .toSorted((...[first, second]) => first.take - second.take);
  return live.at(-1) === item;
}
