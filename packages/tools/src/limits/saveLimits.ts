import type { UserFileFailure } from "../choiceTypes.js";
import { configurationDirectory } from "../configurationDirectory.js";
import type { MediaLimits, Outcome } from "../types.js";
import {
  changeConfigurationFile,
  jsonObjectSchema,
  type FileObject,
} from "../userFile.js";
import type { LimitScope } from "./limitSources.js";

const ownLimitNames: ReadonlySet<string> = new Set([
  "generatedVideoSeconds",
  "spendingUsd",
]);

function limitsOfFile(file: FileObject): FileObject {
  const parsed = jsonObjectSchema.safeParse(file["limits"]);
  return parsed.success ? parsed.data : {};
}

function fieldsWhere(options: {
  object: FileObject;
  keep: (name: string) => boolean;
}): FileObject {
  return Object.fromEntries(
    Object.entries(options.object).filter(([name]) => options.keep(name)),
  );
}

export function saveLimits(options: {
  projectFolder: string;
  appliesTo: LimitScope;
  limits: Partial<MediaLimits>;
}): Promise<Outcome<{ file: string }, UserFileFailure>> {
  return changeConfigurationFile({
    folder:
      options.appliesTo === "every-project"
        ? configurationDirectory()
        : options.projectFolder,
    change: (file) => ({
      ...file,
      limits: { ...limitsOfFile(file), ...options.limits },
    }),
  });
}

export function removeOwnLimits(
  projectFolder: string,
): Promise<Outcome<{ file: string }, UserFileFailure>> {
  return changeConfigurationFile({
    folder: projectFolder,
    change: (file) => {
      const kept = fieldsWhere({
        object: limitsOfFile(file),
        keep: (name) => !ownLimitNames.has(name),
      });
      const others = fieldsWhere({
        object: file,
        keep: (name) => name !== "limits",
      });
      return Object.keys(kept).length === 0
        ? others
        : { ...others, limits: kept };
    },
  });
}
