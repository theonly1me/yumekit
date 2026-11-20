export type CommandResult =
  | { kind: "done"; output: string }
  | { kind: "serving" }
  | { kind: "failed"; message: string }
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
  yumekit --version

init makes a project with one 1920x1080 output named "wide" when no --output is given.
mcp serves the harness MCP tools over stdio for an agent.
render writes renders/<id>.mp4. frame writes renders/<id>-frame-<n>.png.
keys lists each media server, the keys it needs, and the state of each key.
keys set reads the value from a hidden prompt or from standard input, never from an argument.
`;
