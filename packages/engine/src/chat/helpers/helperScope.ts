import type { HelperChange, HelperRequest } from "@yumekit/harness-mcp";

const readTools = new Set([
  "get_work",
  "get_project",
  "get_scene",
  "get_timeline",
  "list_assets",
  "get_asset_words",
  "list_kit_scenes",
  "get_scene_guide",
  "list_media_tools",
  "preview_frame",
  "preview_frames",
  "preview_scenes",
  "contact_sheet",
]);

const writeTools = new Set(["put_scene", "put_work", "generate_asset"]);

export function isHelperTool(tool: string): boolean {
  return readTools.has(tool) || writeTools.has(tool);
}

function textOf(options: { input: Record<string, unknown>; key: string }) {
  const value = options.input[options.key];
  return typeof value === "string" ? value : "";
}

function sceneIdsOfWork(input: Record<string, unknown>): string[] | undefined {
  const { scenes, ...rest } = input;
  const others = Object.entries(rest).filter(
    ([, value]) => value !== undefined,
  );
  if (others.length > 0 || !Array.isArray(scenes)) return undefined;
  return scenes.map((scene: unknown) =>
    typeof scene === "object" && scene !== null
      ? String(Reflect.get(scene, "scene_id"))
      : "",
  );
}

export function changesOfCall(options: {
  tool: string;
  input: Record<string, unknown>;
}): HelperChange[] {
  const { tool, input } = options;
  switch (tool) {
    case "put_scene":
      return [{ kind: "scene", id: textOf({ input, key: "scene_id" }) }];
    case "put_work":
      return (sceneIdsOfWork(input) ?? []).map((id) => ({ kind: "scene", id }));
    case "generate_asset":
      return [{ kind: "asset", id: textOf({ input, key: "asset_id" }) }];
    default:
      return [];
  }
}

export function helperRefusalOf(options: {
  tool: string;
  input: Record<string, unknown>;
  request: HelperRequest;
}): string | undefined {
  const { tool, input, request } = options;
  if (readTools.has(tool)) return undefined;
  if (!writeTools.has(tool)) {
    return `A helper cannot call ${tool}. It may read, look at previews, and change only the scenes and the assets of its brief with put_scene, put_work, and generate_asset.`;
  }
  if (tool === "put_work" && sceneIdsOfWork(input) === undefined) {
    return "A helper sends only scenes in put_work: no shared code, no timeline, no frame, and no removal of what the person made.";
  }
  const outside = changesOfCall({ tool, input }).filter((change) =>
    change.kind === "scene"
      ? !request.sceneIds.includes(change.id)
      : !request.assetIds.includes(change.id),
  );
  const [first] = outside;
  if (first === undefined) return undefined;
  const allowed = [
    ...request.sceneIds.map((id) => `scene ${id}`),
    ...request.assetIds.map((id) => `asset ${id}`),
  ];
  return `The brief does not name ${first.kind} ${first.id}. This helper may change only ${allowed.join(", ")}.`;
}
