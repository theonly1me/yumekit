import type { UserFileFailure } from "./choiceTypes.js";
import type { MediaLimits, Outcome } from "./types.js";
import { changeConfigurationFile, jsonObjectSchema } from "./userFile.js";

export function saveProjectLimits(options: {
  projectFolder: string;
  change: Partial<MediaLimits>;
}): Promise<Outcome<{ file: string }, UserFileFailure>> {
  return changeConfigurationFile({
    folder: options.projectFolder,
    change: (file) => {
      const parsedLimits = jsonObjectSchema.safeParse(file["limits"]);
      const limits = parsedLimits.success ? parsedLimits.data : {};
      return { ...file, limits: { ...limits, ...options.change } };
    },
  });
}
