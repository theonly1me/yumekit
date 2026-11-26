import { reviewCountsOf, reviewTotalOf } from "@yumekit/project/takes";
import type { Take } from "../takes/takeTypes.js";
import type { WorkState } from "../work/workState.js";
import {
  allGoodLabelOf,
  costLineOf,
  markHint,
  moneyOf,
  notesLabelOf,
  sendReviewLabel,
  upperFirst,
} from "./footWords.js";
import { moneyActionOf, type MoneyLeft } from "./moneyAction.js";

export type ActionId =
  | "send"
  | "stop"
  | "approve-story"
  | "send-story"
  | "open-latest"
  | "next-chapter"
  | "export"
  | "raise"
  | "fewer"
  | "stop-here";

export interface FootButton {
  id: ActionId;
  label: string;
  isPrimary: boolean;
}

export interface NextAction {
  line: string;
  buttons: FootButton[];
}

function primary(options: { id: ActionId; label: string }): FootButton {
  return { ...options, isPrimary: true };
}

function takeActionOf(options: {
  take: Take;
  noteCount: number;
  countText: string;
  latestTakeId: string | undefined;
  takeCost: number;
}): NextAction {
  const { take, noteCount } = options;
  if (take.state === "sent") {
    const isLatest =
      options.latestTakeId === undefined || options.latestTakeId === take.id;
    return {
      line:
        reviewTotalOf(reviewCountsOf(take.notes)) === 0
          ? "You approved this take."
          : "Your review of this take went to the lead.",
      buttons: isLatest
        ? []
        : [primary({ id: "open-latest", label: "Open the latest take" })],
    };
  }
  if (noteCount === 0) {
    const line =
      options.countText === ""
        ? markHint
        : `${upperFirst(options.countText)}. Everything else counts as approved.`;
    return {
      line: `${line}${costLineOf(options.takeCost)}`,
      buttons: [primary({ id: "send", label: allGoodLabelOf(take) })],
    };
  }
  return {
    line: `${upperFirst(options.countText)}. Everything else counts as approved.${costLineOf(options.takeCost)}`,
    buttons: [primary({ id: "send", label: sendReviewLabel })],
  };
}

function storyActionOf(options: {
  take: Take | undefined;
  noteCount: number;
  isStoryApproved: boolean;
}): NextAction {
  const viaTake = options.take?.state === "ready";
  if (options.noteCount > 0) {
    return {
      line: `${String(options.noteCount)} ${options.noteCount === 1 ? "note" : "notes"} on the story.`,
      buttons: [
        primary({
          id: viaTake ? "send" : "send-story",
          label: notesLabelOf(options.noteCount),
        }),
      ],
    };
  }
  if (options.isStoryApproved) {
    return { line: "You approved the story.", buttons: [] };
  }
  return {
    line: "Read it once. Approve it, or click a paragraph to say what to change.",
    buttons: [
      primary({
        id: viaTake ? "send" : "approve-story",
        label: "Approve the story",
      }),
    ],
  };
}

function filmActionOf(options: {
  take: Take | undefined;
  noteCount: number;
  countText: string;
  hasNextChapter: boolean;
}): NextAction {
  const { take } = options;
  if (take === undefined) return { line: "", buttons: [] };
  if (take.state === "open") {
    return { line: "The lead puts the cut together.", buttons: [] };
  }
  if (take.state === "ready") {
    return options.noteCount > 0
      ? {
          line: `${upperFirst(options.countText)}.`,
          buttons: [primary({ id: "send", label: sendReviewLabel })],
        }
      : {
          line: "Watch it once at full speed.",
          buttons: [primary({ id: "send", label: "Approve the cut" })],
        };
  }
  if (reviewTotalOf(reviewCountsOf(take.notes)) > 0) {
    return { line: "Your review of the cut went to the lead.", buttons: [] };
  }
  return options.hasNextChapter
    ? {
        line: "You approved the cut of this chapter.",
        buttons: [
          { id: "export", label: "Export", isPrimary: false },
          primary({ id: "next-chapter", label: "Next chapter" }),
        ],
      }
    : {
        line: "The film is done.",
        buttons: [primary({ id: "export", label: "Export" })],
      };
}

export function nextActionOf(options: {
  state: WorkState;
  noteCount: number;
  countText: string;
  latestTakeId: string | undefined;
  isStoryApproved: boolean;
  hasNextChapter: boolean;
  isLeadRunning: boolean;
  takeCost: number;
  money: MoneyLeft | undefined;
}): NextAction {
  const { state } = options;
  const warning = moneyActionOf(options);
  if (warning !== undefined) return warning;
  const stop: FootButton = { id: "stop", label: "Stop", isPrimary: false };
  switch (state.kind) {
    case "failed":
    case "empty":
      return { line: "Tell the lead what to make in the chat.", buttons: [] };
    case "waiting":
      return state.phase === "questions"
        ? { line: "Answer the lead in the chat.", buttons: [] }
        : {
            line: "The lead tells you in the chat what it does.",
            buttons: options.isLeadRunning ? [stop] : [],
          };
    case "making":
      return {
        line: `This take has cost ${moneyOf(options.takeCost)} so far.`,
        buttons: options.isLeadRunning ? [stop] : [],
      };
    case "story":
      return storyActionOf({ ...options, take: state.take });
    case "take":
      return takeActionOf({ ...options, take: state.take });
    case "film":
      return filmActionOf({ ...options, take: state.take });
  }
}
