export interface Permission {
  importName: string;
  typesOnly?: true;
}

const project = { importName: "@yumekit/project" };
const render = { importName: "@yumekit/render" };
const scene = { importName: "@yumekit/scene" };
const sceneKit = { importName: "@yumekit/scene-kit" };
const stage = { importName: "@yumekit/stage" };
const tools = { importName: "@yumekit/tools" };

export const permittedImports: Record<string, Permission[]> = {
  scene: [],
  "scene-kit": [scene],
  project: [],
  stage: [scene, { ...project, typesOnly: true }],
  render: [project, stage, sceneKit],
  tools: [],
  "harness-mcp": [
    project,
    render,
    tools,
    { importName: "@yumekit/scene-kit/schemas" },
  ],
  "apps/cli": [project, render, tools, { importName: "@yumekit/harness-mcp" }],
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
