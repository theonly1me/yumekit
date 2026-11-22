export type CommandResult =
  | { kind: "done"; output: string }
  | { kind: "serving" }
  | { kind: "failed"; message: string }
  | { kind: "failed-with-output"; output: string }
  | { kind: "usage-error"; message: string };

export function failed(message: string): CommandResult {
  return { kind: "failed", message };
}

export function usageError(message: string): CommandResult {
  return { kind: "usage-error", message };
}

export const usage = `Usage:
  yumekit init <folder> [--name <name>] [--frame-rate 24|25|30|50|60] [--output <id>:<width>x<height>]...
  yumekit mcp --project <folder>
  yumekit render --project <folder> --output <id> [--scale 0.25|0.5|1] [--first-frame <n>] [--frame-count <n>]
  yumekit frame --project <folder> --output <id> --frame <n> [--scale 0.25|0.5|1]
  yumekit keys
  yumekit keys set <VARIABLE>
  yumekit keys remove <VARIABLE>
  yumekit open <folder> [--port <n>] [--no-browser]
  yumekit agent connect --agent claude-code|codex|cursor [--project <folder>]
  yumekit doctor
  yumekit setup
  yumekit --version

init makes a project with one 1920x1080 output named "wide" when no --output is given.
mcp serves the harness MCP tools over stdio for an agent. If yumekit open runs for the project, mcp sends each tool call to that engine.
render writes renders/<id>.mp4. frame writes renders/<id>-frame-<n>.png.
keys lists each media server, the keys it needs, and the state of each key.
keys set reads the value from a hidden prompt or from standard input, never from an argument.
open starts the engine and the editor for the project, prints the URL, and opens it in the browser. It runs until you stop it.
doctor checks Node.js, FFmpeg, Chromium for Playwright, and the agent programs. It exits with 1 when Node.js, FFmpeg, or Chromium is missing.
setup installs Chromium for the Playwright version of yumekit.
agent connect writes the yumekit MCP entry for an agent in the project folder. The folder is the current folder when no --project is given.
`;
