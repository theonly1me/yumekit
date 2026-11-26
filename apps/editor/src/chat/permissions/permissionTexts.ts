import type { PermissionEntry } from "./permissionSchemas.js";

function actionOf(entry: PermissionEntry): string {
  const { what } = entry;
  return `${what.charAt(0).toLowerCase()}${what.slice(1)}`;
}

export function askTextOf(entry: PermissionEntry): string {
  return `The AI wants to ${actionOf(entry)}.`;
}

function minutesText(minutes: number): string {
  return minutes === 1 ? "1 minute" : `${String(minutes)} minutes`;
}

export function answeredTextOf(entry: PermissionEntry): string {
  const action = actionOf(entry);
  switch (entry.state) {
    case "allowed-once":
      return `You allowed the AI once to ${action}.`;
    case "allowed-for-project":
      return `You allowed the AI to ${action}, for this project.`;
    case "denied":
      return `You did not allow the AI to ${action}.`;
    case "timed-out":
      return `No answer in ${minutesText(Math.max(1, Math.round(entry.waitSeconds / 60)))}, so the AI may not ${action}.`;
    case "ended":
    case "open":
      return `The request ended before you answered if the AI may ${action}.`;
  }
}

export function waitTextOf(secondsLeft: number): string {
  if (secondsLeft < 60) {
    return "Less than a minute to answer. No answer counts as Don't allow.";
  }
  return `${minutesText(Math.ceil(secondsLeft / 60))} to answer. No answer counts as Don't allow.`;
}

export function secondsLeftOf(options: {
  entry: PermissionEntry;
  now: number;
}): number {
  const askedAt = Date.parse(options.entry.askedAt);
  const endsAt = askedAt + options.entry.waitSeconds * 1000;
  return Math.max(0, Math.round((endsAt - options.now) / 1000));
}
