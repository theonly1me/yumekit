export interface Permission {
  importName: string;
  typesOnly?: true;
}

const brain = { importName: "@yumekit/brain" };
const engine = { importName: "@yumekit/engine" };
const harnessMcp = { importName: "@yumekit/harness-mcp" };
const project = { importName: "@yumekit/project" };
const render = { importName: "@yumekit/render" };
const scene = { importName: "@yumekit/scene" };
const sceneKit = { importName: "@yumekit/scene-kit" };
const stage = { importName: "@yumekit/stage" };
const sceneKitSchemas = { importName: "@yumekit/scene-kit/schemas" };
const tools = { importName: "@yumekit/tools" };

export const permittedImports: Record<string, Permission[]> = {
  scene: [],
  "scene-kit": [scene],
  project: [],
  stage: [scene, { ...project, typesOnly: true }],
  render: [project, stage, sceneKit],
  tools: [],
  brain: [],
  "harness-mcp": [project, render, tools, sceneKitSchemas],
  engine: [project, render, tools, harnessMcp, sceneKitSchemas, brain],
  "apps/cli": [project, render, tools, harnessMcp, engine],
  "apps/editor": [
    { importName: "@yumekit/project/scenes-row" },
    { importName: "@yumekit/project/platforms" },
    { importName: "@yumekit/project/start-formats" },
    { importName: "@yumekit/project/asset-uses" },
    { importName: "@yumekit/project/asset-labels" },
    { importName: "@yumekit/project/camera-moves" },
    { importName: "@yumekit/project/voice-script" },
    { importName: "@yumekit/project/tempo" },
    { importName: "@yumekit/project/film-measure" },
    { importName: "@yumekit/project/plan-budget" },
    sceneKit,
  ],
  "tools/*": [],
};

export const browserPackages = new Set(["scene", "scene-kit", "stage"]);

export function tableRowOf(packageFolder: string): string {
  const [group, name = ""] = packageFolder.split("/");
  if (group === "packages") {
    return name;
  }
  return group === "tools" ? "tools/*" : packageFolder;
}
