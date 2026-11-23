export const permittedSceneImports = [
  "react",
  "@yumekit/scene",
  "@yumekit/scene-kit",
  "@yumekit/scene-kit/motion",
] as const;

export const sharedImportForm = "./_shared/<name>";

const importsAddedByTheJsxTransform = [
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
] as const;

const sharedImportOfScene = /^\.\/_shared\/([a-z0-9][a-z0-9-]{0,63})$/;
const sharedImportOfSharedCode = /^\.\/([a-z0-9][a-z0-9-]{0,63})$/;

export function sharedCodeNameOf(options: {
  importName: string;
  isSharedCode: boolean;
}): string | undefined {
  const pattern = options.isSharedCode
    ? sharedImportOfSharedCode
    : sharedImportOfScene;
  return pattern.exec(options.importName)?.[1];
}

export function isPermittedSceneImport(importName: string): boolean {
  return permittedSceneImports.some((permitted) => permitted === importName);
}

export function isPermittedCompiledSceneImport(importName: string): boolean {
  return (
    isPermittedSceneImport(importName) ||
    importsAddedByTheJsxTransform.some((permitted) => permitted === importName)
  );
}
