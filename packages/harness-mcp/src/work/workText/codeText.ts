import type { ProjectSnapshot, Scene } from "@yumekit/project";

export type CodeDetail = "code" | "outline";

function fenced(code: string): string {
  return ["```tsx", code.trimEnd(), "```"].join("\n");
}

function lineCountOf(code: string): string {
  return `${String(code.trimEnd().split("\n").length)} lines`;
}

export function sceneText(options: {
  scene: Scene;
  code: string | undefined;
  detail: CodeDetail;
}): string {
  const { scene, code, detail } = options;
  const kind =
    scene.source.kind === "kit"
      ? `kit ${scene.source.component}`
      : `custom, ${lineCountOf(code ?? "")}`;
  const lines = [
    `### Scene ${scene.id}: "${scene.title}" (${kind})`,
    ...(scene.notes.trim() === "" ? [] : [`Notes: ${scene.notes.trim()}`]),
    `Props: ${JSON.stringify(scene.source.props)}`,
  ];
  if (scene.source.kind === "module" && detail === "code") {
    lines.push(fenced(code ?? ""));
  }
  return lines.join("\n");
}

export function sharedCodeText(options: {
  snapshot: ProjectSnapshot;
  detail: CodeDetail;
}): string {
  const entries = Object.entries(options.snapshot.sharedCode);
  if (entries.length === 0) return "## Shared code\nNone yet.";
  return [
    "## Shared code",
    ...entries.map(([name, code]) =>
      options.detail === "code"
        ? `### ./_shared/${name}\n${fenced(code)}`
        : `### ./_shared/${name} (${lineCountOf(code)})`,
    ),
  ].join("\n");
}
