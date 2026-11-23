import { framesPerBeatOf, highestTempo, lowestTempo } from "@yumekit/project";
import { z } from "zod";
import { applyEditsResult } from "../applyEditsResult.js";
import type { HarnessContext } from "../context.js";
import { roundedBeats } from "./beatFacts.js";

export function registerSetTempo(context: HarnessContext): void {
  context.tools.add({
    name: "set_tempo",
    description:
      'Set the tempo of the project in beats each minute, usually the tempo of the music. Then each timeline and clip tool also takes times in beats (start_beat, duration_beats, scene_start_beat, asset_start_beat), in whole or half beats, in place of frames. Beat 0 is frame 0. get_timeline and get_project show beats next to frames, scene code gets beatFrames from useSceneContext, and sequence of @yumekit/scene-kit/motion takes every: "beat". A new tempo moves no clip. One undo brings the old tempo back.',
    inputSchema: {
      tempo: z
        .number()
        .min(lowestTempo)
        .max(highestTempo)
        .describe(
          `Beats each minute, ${String(lowestTempo)} to ${String(highestTempo)}. For example 120: at 30 frames each second, one beat is 15 frames.`,
        ),
    },
    run: ({ input }) => {
      const { framesPerSecond } = context.store.read().project;
      const framesPerBeat = framesPerBeatOf({
        tempo: input.tempo,
        framesPerSecond,
      });
      return applyEditsResult({
        store: context.store,
        edits: [{ kind: "setTempo", tempo: input.tempo }],
        line: `Tempo ${String(input.tempo)} beats each minute: one beat is ${String(roundedBeats(framesPerBeat))} frames at ${String(framesPerSecond)} frames each second.`,
        data: { tempo: input.tempo, frames_per_beat: framesPerBeat },
      });
    },
  });
}
