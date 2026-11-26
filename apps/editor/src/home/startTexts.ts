import { platformCatalog } from "@yumekit/project/platforms";
import type { HomeAgent, ProjectLength, RecentProject } from "./homeApi.js";

const dayMilliseconds = 24 * 60 * 60 * 1000;

export function lengthLabelOf(length: ProjectLength): string {
  return length === "auto" ? "The lead asks" : `${String(length)} seconds`;
}

function namesText(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

function changedText(options: { changedAt: string; now: Date }): string {
  const changed = new Date(options.changedAt);
  const startOfToday = new Date(options.now);
  startOfToday.setHours(0, 0, 0, 0);
  const days = Math.ceil(
    (startOfToday.getTime() - changed.getTime()) / dayMilliseconds,
  );
  if (days <= 0) return "changed today";
  if (days === 1) return "changed yesterday";
  return `changed ${String(days)} days ago`;
}

export function recentFactsOf(options: {
  project: RecentProject;
  now: Date;
}): string {
  const { project } = options;
  const names = platformCatalog
    .filter((platform) => project.platforms.includes(platform.id))
    .map((platform) => platform.name);
  return [
    names.length === 0 ? "" : namesText(names),
    project.length === null || project.length === "auto"
      ? ""
      : `${String(project.length)} seconds`,
    changedText({ changedAt: project.changedAt, now: options.now }),
  ]
    .filter((part) => part !== "")
    .join(", ");
}

export function agentProblemOf(agents: HomeAgent[]): string | undefined {
  const inUse = agents.find((agent) => agent.in_use);
  if (inUse === undefined) {
    return "No AI program is on this computer. Install Claude Code, Codex, or Cursor, start it once in a terminal, and sign in.";
  }
  if (inUse.sign_in !== "signed-out") return undefined;
  const signInStep =
    inUse.id === "cursor"
      ? "Open a terminal and run cursor-agent login."
      : "Start it once in a terminal and sign in.";
  return `${inUse.name} is on this computer, but it is not signed in. ${signInStep}`;
}

export function placesLineOf(options: {
  platformIds: readonly string[];
  length: ProjectLength;
}): string {
  const names = platformCatalog
    .filter((platform) => options.platformIds.includes(platform.id))
    .map((platform) => platform.name);
  if (names.length === 0) return "Pick at least one place.";
  const length =
    options.length === "auto"
      ? "The lead asks about the length."
      : `About ${String(options.length)} seconds.`;
  return `For ${namesText(names)}. ${length}`;
}

export const longestRequestCharacters = 20_000;

export function requestLimitLineOf(length: number): string | undefined {
  return length >= longestRequestCharacters
    ? `The request is at its limit of ${longestRequestCharacters.toLocaleString("en-US")} characters, so yumekit keeps no more. Shorten it, or send the rest in the chat after the start.`
    : undefined;
}
