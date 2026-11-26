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

export function pickVerdict({ item, verdict }) {
  const review = reviewOf(item);
  review.verdict = review.verdict === verdict ? undefined : verdict;
  if (review.verdict !== "approved") {
    review.use = false;
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

export function pickUse(item) {
  const review = reviewOf(item);
  if (review.use) {
    review.use = false;
    notify();
    return;
  }
  for (const other of takes.items.values()) {
    if (other.slot === item.slot && other.review !== undefined) {
      other.review.use = false;
    }
  }
  review.use = true;
  review.verdict = "approved";
  keepOldVerdict(item);
  notify();
}

export function isUsedNow(item) {
  const picked = [...takes.items.values()].find(
    (other) => other.slot === item.slot && other.review?.use === true,
  );
  if (picked !== undefined) {
    return picked === item;
  }
  if (item.verdict !== "approved") {
    return false;
  }
  return ![...takes.items.values()].some(
    (other) =>
      other.slot === item.slot &&
      other.take > item.take &&
      other.verdict === "approved",
  );
}
