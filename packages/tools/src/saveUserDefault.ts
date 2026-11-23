import type { MediaPick, MediaPickFailure } from "./choiceTypes.js";
import type { Outcome } from "./types.js";
import {
  changeUserFile,
  jsonObjectSchema,
  type FileObject,
} from "./userFile.js";

function withPick(options: { file: FileObject; pick: MediaPick }): FileObject {
  const { file, pick } = options;
  const parsedDefaults = jsonObjectSchema.safeParse(file["defaults"]);
  const otherDefaults = Object.fromEntries(
    Object.entries(parsedDefaults.success ? parsedDefaults.data : {}).filter(
      ([capability]) => capability !== pick.capability,
    ),
  );
  if (pick.server === undefined) return { ...file, defaults: otherDefaults };
  const entry =
    pick.model === undefined
      ? pick.server
      : { server: pick.server, model: pick.model };
  const defaults = { ...otherDefaults, [pick.capability]: entry };
  return { ...file, defaults };
}

export function saveUserDefault(
  pick: MediaPick,
): Promise<Outcome<{ file: string }, MediaPickFailure>> {
  return changeUserFile((file) => withPick({ file, pick }));
}
