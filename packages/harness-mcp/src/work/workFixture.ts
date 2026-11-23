export const layoutCode = `export const margin = 8;
export const ink = "#f4f1ea";
`;

const sceneCode = (
  word: string,
) => `import { defineReactScene, useFrame } from "@yumekit/scene";
import { ink, margin } from "./_shared/layout";

export default defineReactScene(() => {
  const frame = useFrame();
  return <h1 style={{ margin: 0, padding: margin * 8, color: ink, opacity: Math.min(1, frame / 10) }}>${word}</h1>;
});
`;

export const frameCode = `import { defineReactScene, useFrame, useSceneContext } from "@yumekit/scene";
import { ink } from "./layout";

export default defineReactScene(() => {
  const frame = useFrame();
  const { durationFrames } = useSceneContext();
  return <div style={{ position: "absolute", left: 0, bottom: 0, height: 4, width: \`\${String((100 * frame) / durationFrames)}%\`, background: ink }} />;
});
`;

const clip = (options: { id: string; start: number }) => ({
  id: options.id,
  scene_id: options.id,
  start_frame: options.start,
  duration_frames: 60,
});

export const filmWork = {
  shared_code: [{ name: "layout", code: layoutCode }],
  scenes: [
    { scene_id: "hook", title: "Hook", code: sceneCode("Fast") },
    { scene_id: "proof", title: "Proof", code: sceneCode("Clear") },
    {
      scene_id: "end",
      title: "End",
      kit_component: "title-card",
      props: { heading: "Made with code" },
    },
  ],
  timelines: [
    {
      output_id: "wide",
      tracks: [
        {
          id: "scenes",
          kind: "scene" as const,
          clips: [
            clip({ id: "hook", start: 0 }),
            clip({ id: "proof", start: 60 }),
            clip({ id: "end", start: 120 }),
          ],
        },
      ],
    },
  ],
} as const;
