export interface Permission {
  importName: string;
  typesOnly?: true;
}

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
  "harness-mcp": [project, render, tools, sceneKitSchemas],
  engine: [project, render, tools, harnessMcp, sceneKitSchemas],
  "apps/cli": [project, render, tools, harnessMcp, engine],
  "apps/editor": [{ importName: "@yumekit/project/scenes-row" }],
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
