declare module "virtual:yumekit-stage-data" {
  const stagePageData: import("./stagePageData.js").StagePageData;
  export default stagePageData;
  export const moduleSceneImports: Record<string, () => Promise<unknown>>;
}
