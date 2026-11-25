import {
  defaultLookId,
  castLookOf,
  type CastMember,
  type Shot,
} from "@yumekit/project";
import { z } from "zod";
import { idInput } from "../inputs.js";

export const castLooksInput = z
  .record(
    idInput("A person of cast_ids."),
    idInput("The look of that person in this shot."),
  )
  .optional()
  .describe(
    `The look of each person in this shot, for example {"hero": "rain-cloak"}. A person that it does not name wears the look "${defaultLookId}". A look does not change inside a shot: a change of clothes is a cut to a new shot.`,
  );

export function lookWarningsOf(options: {
  shots: Shot[];
  cast: CastMember[];
}): string[] {
  return options.shots.flatMap((shot) =>
    Object.entries(shot.castLooks ?? {}).flatMap(([castId, lookId]) => {
      if (!shot.castIds.includes(castId)) {
        return [
          `Shot "${shot.id}" gives a look to "${castId}", which cast_ids does not name. Add the person to the shot, or remove the look.`,
        ];
      }
      const member = options.cast.find((entry) => entry.id === castId);
      if (
        member === undefined ||
        castLookOf({ member, lookId }) !== undefined
      ) {
        return [];
      }
      return [
        `Shot "${shot.id}" dresses "${castId}" in the look "${lookId}", which the entry does not have yet. A new look is the decision of the person: propose it, ask, and add it with put_cast_member looks and person_asked_for_it.`,
      ];
    }),
  );
}
