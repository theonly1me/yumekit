export const permittedSceneImports = [
  "react",
  "@yumekit/scene",
  "@yumekit/scene-kit",
] as const;

const importsAddedByTheJsxTransform = [
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
] as const;

export function isPermittedSceneImport(importName: string): boolean {
  return permittedSceneImports.some((permitted) => permitted === importName);
}

export function isPermittedCompiledSceneImport(importName: string): boolean {
  return (
    isPermittedSceneImport(importName) ||
    importsAddedByTheJsxTransform.some((permitted) => permitted === importName)
  );
}
