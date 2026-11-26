import type { ClientFailure } from "../engine/engineClient.js";

export type ScreenState =
  ClientFailure | { kind: "loading" } | { kind: "token-missing" };

function textOf(state: ScreenState): { title: string; lines: string[] } {
  switch (state.kind) {
    case "loading":
      return { title: "Opening the project", lines: [] };
    case "token-missing":
      return {
        title: "This page needs the link from yumekit open",
        lines: [
          "The link holds a key that lets this page reach the project. Only the tab that opened the link keeps the key.",
          "Run yumekit open with your project folder, then open the link that it prints.",
        ],
      };
    case "token-rejected":
      return {
        title: "The engine did not accept this link",
        lines: [
          "Each start of the engine makes a new link. This link is from an earlier start, or it is not complete.",
          "Open the latest link that yumekit open printed.",
        ],
      };
    case "engine-unreachable":
      return {
        title: "The engine is not reachable",
        lines: [
          "The engine stopped, or it did not start. This page tries again every few seconds.",
          "To start it, run yumekit open with your project folder, then open the new link that it prints.",
        ],
      };
    case "request-failed":
      return {
        title: "The project did not load",
        lines: [state.message],
      };
  }
}

export function StateScreen(props: { state: ScreenState }) {
  const { title, lines } = textOf(props.state);
  return (
    <main className="state" data-state={props.state.kind}>
      <p className="wordmark">yumekit</p>
      <h1>{title}</h1>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </main>
  );
}

export function NoVideoShape(props: { onBackToProject: () => void }) {
  return (
    <main className="state">
      <h1>This project has no video shape yet</h1>
      <p>Ask the lead to add a platform, for example YouTube.</p>
      <button type="button" onClick={props.onBackToProject}>
        Back to the project
      </button>
    </main>
  );
}
