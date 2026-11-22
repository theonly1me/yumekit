export interface StartFailure {
  title: string;
  lines: string[];
}

const askAgain =
  "Your project is saved. When the AI is ready, ask for the video in the chat.";

export function takeFirstRequestFailure(): string | undefined {
  const url = new URL(window.location.href);
  const kind = url.searchParams.get("first-request");
  if (kind === null) return undefined;
  url.searchParams.delete("first-request");
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
  return kind;
}

export function startFailureOf(kind: string): StartFailure {
  switch (kind) {
    case "no-agent":
      return {
        title: "No AI is on this computer",
        lines: [
          "yumekit uses the AI program that you have on this computer. Install Claude Code or Codex, start it once in a terminal, and sign in.",
          askAgain,
        ],
      };
    case "agent-signed-out":
      return {
        title: "The AI is not signed in",
        lines: [
          "Open a terminal, start Claude Code or Codex once, and sign in.",
          askAgain,
        ],
      };
    case "settings-not-valid":
      return {
        title: "The settings file is not valid",
        lines: [
          "Correct settings.json in the yumekit settings folder, or remove it.",
          askAgain,
        ],
      };
    default:
      return {
        title: "The AI did not start",
        lines: [
          "Close this page and try again from the start screen.",
          askAgain,
        ],
      };
  }
}
