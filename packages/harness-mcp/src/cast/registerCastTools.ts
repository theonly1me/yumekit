import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { failureResult } from "../results.js";
import { castMemberNotFound } from "./castMembers.js";
import { registerPutCastMember } from "./putCastMember.js";

export { maximumCastPictures } from "./putCastMemberInput.js";

function registerRemoveCastMember(context: HarnessContext): void {
  context.tools.add({
    name: "remove_cast_member",
    description:
      "Remove one entry of the cast. Its pictures stay in the project. undo brings it back.",
    inputSchema: { cast_id: idInput("The id of the entry to remove.") },
    annotations: { destructiveHint: true },
    run: ({ input: { cast_id } }) => {
      const snapshot = context.store.read();
      const { bible } = snapshot;
      if (!bible.cast.some((member) => member.id === cast_id)) {
        return failureResult(castMemberNotFound({ snapshot, castId: cast_id }));
      }
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: {
              ...bible,
              cast: bible.cast.filter((member) => member.id !== cast_id),
            },
          },
        ],
        line: `Cast entry "${cast_id}" removed.`,
      });
    },
  });
}

export function registerCastTools(context: HarnessContext): void {
  registerPutCastMember(context);
  registerRemoveCastMember(context);
}
