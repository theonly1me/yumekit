import { join } from "node:path";
import ts from "typescript";
import { fail, succeed, type Outcome } from "../outcome.js";
import { renderPackageDirectory, sceneTypesFile } from "../packagePaths.js";
import type { RenderFailure } from "../renderFailure.js";
import { compileFailure, parseScene } from "./inspectSceneCode.js";
import { sceneCompilerOptions, sceneFileName } from "./sceneCompilerOptions.js";

const checkFolder = join(renderPackageDirectory, "scene-check");
const sceneFile = join(checkFolder, sceneFileName);
const defaultExportFile = join(checkFolder, "defaultExport.ts");
const defaultExportCode = [
  'import type { SceneModule } from "@yumekit/scene";',
  'import scene from "./scene.js";',
  "export const sceneModule: SceneModule = scene;",
].join("\n");

const compilerOptions: ts.CompilerOptions = {
  ...sceneCompilerOptions,
  paths: { "@yumekit/scene": [sceneTypesFile] },
};

function createSceneHost(code: string): ts.CompilerHost {
  const systemHost = ts.createCompilerHost(compilerOptions);
  const virtualFiles = new Map([
    [sceneFile, code],
    [defaultExportFile, defaultExportCode],
  ]);
  return {
    ...systemHost,
    getSourceFile: (...parameters) => {
      const [fileName, languageVersion] = parameters;
      const virtualCode = virtualFiles.get(fileName);
      return virtualCode === undefined
        ? systemHost.getSourceFile(fileName, languageVersion)
        : ts.createSourceFile(fileName, virtualCode, languageVersion, true);
    },
    fileExists: (fileName) =>
      virtualFiles.has(fileName) || systemHost.fileExists(fileName),
    directoryExists: (directory) =>
      directory === checkFolder ||
      (systemHost.directoryExists?.(directory) ?? false),
    readFile: (fileName) =>
      virtualFiles.get(fileName) ?? systemHost.readFile(fileName),
  };
}

function defaultExportPosition(code: string): number {
  const sourceFile = parseScene(code);
  const defaultExport = sourceFile.statements.find(ts.isExportAssignment);
  return defaultExport?.getStart(sourceFile) ?? 0;
}

export function typeCheckScene(options: {
  sceneId: string;
  code: string;
}): Outcome<{ checked: true }, RenderFailure> {
  const { sceneId, code } = options;
  const program = ts.createProgram({
    rootNames: [sceneFile, defaultExportFile],
    options: compilerOptions,
    host: createSceneHost(code),
  });
  const [diagnostic] = ts
    .getPreEmitDiagnostics(program)
    .filter((candidate) => candidate.category === ts.DiagnosticCategory.Error);
  if (diagnostic === undefined) {
    return succeed({ checked: true });
  }
  const sourceFile = parseScene(code);
  if (diagnostic.file?.fileName === sceneFile) {
    return fail(compileFailure({ sceneId, diagnostic, sourceFile }));
  }
  return fail(
    compileFailure({
      sceneId,
      sourceFile,
      diagnostic: {
        ...diagnostic,
        start: defaultExportPosition(code),
        messageText: `The default export must be a SceneModule, for example from defineReactScene. ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
      },
    }),
  );
}
