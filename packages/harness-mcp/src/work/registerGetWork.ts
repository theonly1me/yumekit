import { z } from "zod";
import type { HarnessContext } from "../context.js";
import { idInput } from "../inputs.js";
import { workCharacterLimit, workParts, workTextOf } from "./workText/index.js";

export function registerGetWork(context: HarnessContext): void {
  context.tools.add({
    name: "get_work",
    description: `Read the whole video as one text, in this order: the story (style, look, tempo, frame, fonts, cast, script), the shared code, each scene with its props and its code, each timeline with its clips in beats and frames, and the assets with their labels. Call it first, and before each change to a video that exists, so you change the video as one piece. The text has at most ${String(workCharacterLimit)} characters. A larger work leaves out the code and says so: then ask for part "code" with scene_ids. Write the changes back with put_work.`,
    inputSchema: {
      part: z
        .enum(workParts)
        .optional()
        .describe(
          'The part to read: "all" (default), "story", "code" (the shared code and the scenes), "timelines", or "assets".',
        ),
      scene_ids: z
        .array(idInput("A scene id."))
        .optional()
        .describe('With part "code": only these scenes, and all shared code.'),
    },
    annotations: { readOnlyHint: true },
    run: ({ input }) => {
      const snapshot = context.store.read();
      const part = input.part ?? "all";
      const work = workTextOf({ snapshot, part, sceneIds: input.scene_ids });
      return {
        content: [
          {
            type: "text",
            text: `The work at revision ${String(snapshot.revision)}, part "${part}", ${String(work.text.length)} characters.`,
          },
          { type: "text", text: work.text },
        ],
        structuredContent: {
          revision: snapshot.revision,
          part,
          characters: work.text.length,
          left_out: work.leftOut,
        },
      };
    },
  });
}
