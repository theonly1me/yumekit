import { castKinds, type Bible, type CastMember } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { referencePathsInput } from "../media/referencePaths.js";
import { failureResult } from "../results.js";
import { castMemberNotFound, wireCastMemberOf } from "./castMembers.js";

export const maximumCastPictures = 4;

const putCastMemberInput = {
  cast_id: idInput("The id of the entry, for example 'mia' or 'blue-mug'."),
  kind: z.enum(castKinds).describe("What the entry is."),
  name: z
    .string()
    .trim()
    .min(1)
    .describe("The name, for example 'Mia' or 'The blue mug'."),
  description: z
    .string()
    .describe(
      "How the entry looks in a few words. The harness adds it to each prompt that gives its id in cast_ids.",
    ),
  reference_asset_ids: z
    .array(idInput("An image asset that shows the entry."))
    .max(maximumCastPictures)
    .optional()
    .describe(
      `Up to ${String(maximumCastPictures)} image assets that show the entry. Leave it out to keep the pictures of an entry that exists.`,
    ),
};

function bibleWithMember(options: { bible: Bible; member: CastMember }): Bible {
  const { bible, member } = options;
  const exists = bible.cast.some((candidate) => candidate.id === member.id);
  return {
    ...bible,
    cast: exists
      ? bible.cast.map((candidate) =>
          candidate.id === member.id ? member : candidate,
        )
      : [...bible.cast, member],
  };
}

function registerPutCastMember(context: HarnessContext): void {
  context.tools.add({
    name: "put_cast_member",
    description:
      "Add or replace one person, place, or product of the cast. The cast keeps it the same in each picture and each video clip: give its id in cast_ids of generate_asset for each one that shows it.",
    inputSchema: putCastMemberInput,
    run: ({ input }) => {
      const snapshot = context.store.read();
      const existing = snapshot.bible.cast.find(
        (candidate) => candidate.id === input.cast_id,
      );
      const referenceAssetIds =
        input.reference_asset_ids ?? existing?.referenceAssetIds ?? [];
      const pictures = referencePathsInput({
        snapshot,
        projectFolder: context.store.folder,
        ids: { referenceAssetIds, firstFrameAssetId: undefined },
      });
      if (!pictures.ok) return failureResult(pictures.failure);
      const member = {
        id: input.cast_id,
        kind: input.kind,
        name: input.name,
        description: input.description.trim(),
        referenceAssetIds,
      };
      return applyEditsResult({
        store: context.store,
        edits: [
          {
            kind: "setBible",
            bible: bibleWithMember({ bible: snapshot.bible, member }),
          },
        ],
        line: `Cast entry "${input.cast_id}" saved with ${String(referenceAssetIds.length)} pictures.`,
        data: { cast_member: wireCastMemberOf(member) },
      });
    },
  });
}

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
