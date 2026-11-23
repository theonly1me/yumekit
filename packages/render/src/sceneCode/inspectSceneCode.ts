import ts from "typescript";
import { fail, succeed, type Outcome } from "../outcome.js";
import type { RenderFailure } from "../renderFailure.js";
import { codeLabelOf, importFailureOf } from "./sharedImports.js";
import { sceneCompilerOptions, sceneFileName } from "./sceneCompilerOptions.js";
import { sceneImportsOf } from "./sceneImports.js";
import { firstVideoElementOf } from "./videoElements.js";

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
    message: `The code of ${codeLabelOf(sceneId)} does not compile at line ${String(line)}, column ${String(column)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
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
  sharedNames?: readonly string[];
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
  const importFailure = importFailureOf({
    sceneId,
    importNames: sceneImportsOf(sourceFile),
    sharedNames: options.sharedNames ?? [],
  });
  if (importFailure !== undefined) {
    return fail(importFailure);
  }
  const videoElement = firstVideoElementOf(sourceFile);
  if (videoElement !== undefined) {
    return fail(
      compileFailure({
        sceneId,
        sourceFile,
        diagnostic: {
          category: ts.DiagnosticCategory.Error,
          code: 0,
          file: sourceFile,
          start: videoElement.getStart(sourceFile),
          length: videoElement.getWidth(sourceFile),
          messageText:
            "A scene must not use a <video> element, because it does not seek to an exact frame. Use VideoFrame from @yumekit/scene with the id of a video asset.",
        },
      }),
    );
  }
  return succeed({ checked: true });
}
