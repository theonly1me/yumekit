import { notify, state } from "./state.js";
import { money, projectSpent, realSeconds } from "./takesStore.js";

export function projectLimits() {
  return state.limits.own ? state.limits.project : state.limits.every;
}

export function usedSeconds() {
  return realSeconds() + state.extraSeconds;
}

export function spentText() {
  return `Spent ${money(projectSpent())} of $${projectLimits().dollars} on this project`;
}

export function secondsText() {
  return `${usedSeconds()} of ${projectLimits().seconds} seconds of real video used`;
}

export function roomFor(seconds) {
  return usedSeconds() + seconds <= projectLimits().seconds;
}

export function raisedSecondsFor(seconds) {
  return Math.ceil((usedSeconds() + seconds) / 30) * 30;
}

export function raiseProject(seconds) {
  const current = projectLimits();
  state.limits.own = true;
  state.limits.project = { ...current, seconds };
}

export function askToRaise({ seconds, what, onRaise }) {
  const raiseTo = raisedSecondsFor(seconds);
  state.chat.push({
    kind: "limit",
    text: `${what} need ${seconds} seconds of real video. This project has ${projectLimits().seconds - usedSeconds()} seconds left of its limit of ${projectLimits().seconds}.`,
    raiseTo,
    answer: undefined,
    onRaise,
  });
  notify();
}

export function answerLimit({ entry, raise }) {
  entry.answer = raise
    ? `You raised this project to ${entry.raiseTo} seconds.`
    : "You kept the limit. The lead waits.";
  if (raise) {
    raiseProject(entry.raiseTo);
    entry.onRaise();
  }
  notify();
}
