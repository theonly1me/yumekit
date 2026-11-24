import type { MediaLimits, Outcome } from "./types.js";
import type { UserFileFailure } from "./choiceTypes.js";
import { changeUserFile, jsonObjectSchema } from "./userFile.js";

export function saveUserLimits(
  change: Partial<MediaLimits>,
): Promise<Outcome<{ file: string }, UserFileFailure>> {
  return changeUserFile((file) => {
    const parsedLimits = jsonObjectSchema.safeParse(file["limits"]);
    const limits = parsedLimits.success ? parsedLimits.data : {};
    return { ...file, limits: { ...limits, ...change } };
  });
}
