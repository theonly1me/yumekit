import { join } from "node:path";
import ts from "typescript";
import { fail, succeed, type Outcome } from "../outcome.js";
import { renderPackageDirectory, sceneTypesFile } from "../packagePaths.js";
import type { RenderFailure } from "../renderFailure.js";
import { compileFailure, parseScene } from "./inspectSceneCode.js";
import { sceneCompilerOptions, sceneFileName } from "./sceneCompilerOptions.js";
import {
  isSharedCodeId,
  sharedCodeIdOf,
  sharedCodePrefix,
} from "./sharedImports.js";

const checkFolder = join(renderPackageDirectory, "scene-check");
const sharedFolder = join(checkFolder, "_shared");
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

interface CheckedFile {
  sceneId: string;
  code: string;
}

function sharedFileOf(name: string): string {
  return join(sharedFolder, `${name}.tsx`);
}

function createSceneHost(files: Map<string, CheckedFile>): ts.CompilerHost {
  const systemHost = ts.createCompilerHost(compilerOptions);
  return {
    ...systemHost,
    getSourceFile: (...parameters) => {
      const [fileName, languageVersion] = parameters;
      const virtual = files.get(fileName);
      return virtual === undefined
        ? systemHost.getSourceFile(fileName, languageVersion)
        : ts.createSourceFile(fileName, virtual.code, languageVersion, true);
    },
    fileExists: (fileName) =>
      files.has(fileName) || systemHost.fileExists(fileName),
    directoryExists: (directory) =>
      directory === checkFolder ||
      directory === sharedFolder ||
      (systemHost.directoryExists?.(directory) ?? false),
    readFile: (fileName) =>
      files.get(fileName)?.code ?? systemHost.readFile(fileName),
  };
}

function defaultExportPosition(code: string): number {
  const sourceFile = parseScene(code);
  const defaultExport = sourceFile.statements.find(ts.isExportAssignment);
  return defaultExport?.getStart(sourceFile) ?? 0;
}

function checkedFilesOf(options: {
  sceneId: string;
  code: string;
  sharedCode: Readonly<Record<string, string>>;
}): { files: Map<string, CheckedFile>; rootFile: string } {
  const files = new Map<string, CheckedFile>(
    Object.entries(options.sharedCode).map(([name, code]) => [
      sharedFileOf(name),
      { sceneId: sharedCodeIdOf(name), code },
    ]),
  );
  const checked = { sceneId: options.sceneId, code: options.code };
  if (isSharedCodeId(options.sceneId)) {
    const rootFile = sharedFileOf(
      options.sceneId.slice(sharedCodePrefix.length),
    );
    files.set(rootFile, checked);
    return { files, rootFile };
  }
  files.set(sceneFile, checked);
  files.set(defaultExportFile, {
    sceneId: options.sceneId,
    code: defaultExportCode,
  });
  return { files, rootFile: sceneFile };
}

export function typeCheckScene(options: {
  sceneId: string;
  code: string;
  sharedCode?: Readonly<Record<string, string>>;
}): Outcome<{ checked: true }, RenderFailure> {
  const { sceneId, code } = options;
  const { files, rootFile } = checkedFilesOf({
    sceneId,
    code,
    sharedCode: options.sharedCode ?? {},
  });
  const program = ts.createProgram({
    rootNames:
      rootFile === sceneFile ? [sceneFile, defaultExportFile] : [rootFile],
    options: compilerOptions,
    host: createSceneHost(files),
  });
  const [diagnostic] = ts
    .getPreEmitDiagnostics(program)
    .filter((candidate) => candidate.category === ts.DiagnosticCategory.Error);
  if (diagnostic === undefined) {
    return succeed({ checked: true });
  }
  const failedFile = files.get(diagnostic.file?.fileName ?? "");
  if (
    failedFile !== undefined &&
    diagnostic.file?.fileName !== defaultExportFile
  ) {
    return fail(
      compileFailure({
        sceneId: failedFile.sceneId,
        diagnostic,
        sourceFile: parseScene(failedFile.code),
      }),
    );
  }
  return fail(
    compileFailure({
      sceneId,
      sourceFile: parseScene(code),
      diagnostic: {
        ...diagnostic,
        start: defaultExportPosition(code),
        messageText: `The default export must be a SceneModule, for example from defineReactScene. ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`,
      },
    }),
  );
}
