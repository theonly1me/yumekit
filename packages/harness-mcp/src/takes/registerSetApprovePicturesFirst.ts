import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";

export const approvePicturesFirstMeaning =
  'While "Approve pictures before clips" is on (the default), a clip starts only from start and end pictures that the person approved in a take. While it is off, nothing waits for the person, as in a quick draft.';

export function registerSetApprovePicturesFirst(context: HarnessContext): void {
  context.tools.add({
    name: "set_approve_pictures_first",
    description: `Turn "Approve pictures before clips" on or off. The person picks it in Settings, so call this only when the person asks. ${approvePicturesFirstMeaning} One call is one undo step.`,
    inputSchema: {
      approve_pictures_first: z
        .boolean()
        .describe("true to wait for the person's approval, false for a draft."),
    },
    run: ({ input: { approve_pictures_first } }) =>
      applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setApprovePicturesFirst",
            approvePicturesFirst: approve_pictures_first,
          },
        ],
        line: `"Approve pictures before clips" is ${approve_pictures_first ? "on" : "off"}. ${approvePicturesFirstMeaning}`,
        data: { approve_pictures_first },
      }),
  });
}
