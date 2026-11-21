import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { counterCode } from "./counterProject.js";
import type { RunningEngine } from "./runEngine.js";

const runFile = promisify(execFile);

export const renderClipFrames = 120;

export const brokenCode = `import { defineReactScene, useFrame } from "@yumekit/scene";

export default defineReactScene(() => {
  const frame = useFrame();
  if (frame > 3) throw new Error("This scene breaks on purpose.");
  return <div style={{ position: "absolute", inset: 0, background: "#202020" }} />;
});
`;

function sceneTrack(clips: { sceneId: string; durationFrames: number }[]) {
  let startFrame = 0;
  return {
    id: "scenes",
    kind: "scene",
    clips: clips.map((clip) => {
      const placed = {
        id: clip.sceneId,
        scene_id: clip.sceneId,
        start_frame: startFrame,
        duration_frames: clip.durationFrames,
      };
      startFrame += clip.durationFrames;
      return placed;
    }),
  };
}

export async function buildRenderProject(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "put_scene",
    input: { scene_id: "counter", title: "Counter", code: counterCode },
  });
  await engine.callTool({
    name: "put_scene",
    input: { scene_id: "broken", title: "Broken", code: brokenCode },
  });
  await engine.callTool({
    name: "set_timeline",
    input: {
      output_id: "wide",
      tracks: [
        sceneTrack([{ sceneId: "counter", durationFrames: renderClipFrames }]),
      ],
    },
  });
  await engine.callTool({
    name: "set_timeline",
    input: {
      output_id: "tall",
      tracks: [sceneTrack([{ sceneId: "broken", durationFrames: 30 }])],
    },
  });
}

const probeSchema = z.object({
  streams: z.array(
    z.object({
      codec_type: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  ),
  format: z.object({ duration: z.coerce.number() }),
});

export async function probeVideo(file: string) {
  const { stdout } = await runFile("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=codec_type,width,height:format=duration",
    "-of",
    "json",
    file,
  ]);
  return probeSchema.parse(JSON.parse(stdout));
}
