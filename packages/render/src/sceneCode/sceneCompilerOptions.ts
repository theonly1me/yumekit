import ts from "typescript";

export const sceneFileName = "scene.tsx";

export const sceneCompilerOptions: ts.CompilerOptions = {
  strict: true,
  noPropertyAccessFromIndexSignature: false,
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
  types: [],
};
