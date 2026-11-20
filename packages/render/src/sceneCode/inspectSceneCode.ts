import ts from "typescript";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import {
  isPermittedSceneImport,
  permittedSceneImports,
} from "./permittedImports.js";
import { sceneCompilerOptions, sceneFileName } from "./sceneCompilerOptions.js";
import { sceneImportsOf } from "./sceneImports.js";

export function compileFailure(options: {
  sceneId: string;
  diagnostic: ts.Diagnostic;
  sourceFile: ts.SourceFile;
}): RenderFailure {
  const { sceneId, diagnostic, sourceFile } = options;
  const position = sourceFile.getLineAndCharacterOfPosition(
    diagnostic.start ?? 0,
  );
  const line = position.line + 1;
  const column = position.character + 1;
  return {
    kind: "scene-compile-failed",
    sceneId,
    line,
    column,
    message: `The code of scene "${sceneId}" does not compile at line ${String(line)}, column ${String(column)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
  };
}

export function parseScene(code: string): ts.SourceFile {
  return ts.createSourceFile(
    sceneFileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

export function inspectSceneCode(options: {
  sceneId: string;
  code: string;
}): Outcome<{ checked: true }, RenderFailure> {
  const { sceneId, code } = options;
  const sourceFile = parseScene(code);
  const [syntaxError] =
    ts.transpileModule(code, {
      fileName: sceneFileName,
      reportDiagnostics: true,
      compilerOptions: sceneCompilerOptions,
    }).diagnostics ?? [];
  if (syntaxError !== undefined) {
    return fail(
      compileFailure({ sceneId, diagnostic: syntaxError, sourceFile }),
    );
  }
  const importName = sceneImportsOf(sourceFile).find(
    (candidate) => !isPermittedSceneImport(candidate),
  );
  if (importName !== undefined) {
    return fail({
      kind: "scene-import-not-permitted",
      sceneId,
      importName,
      message: `The code of scene "${sceneId}" imports "${importName}". A scene may import only ${permittedSceneImports.join(", ")}.`,
    });
  }
  return succeed({ checked: true });
}
