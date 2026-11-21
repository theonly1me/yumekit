import type { RunningEngine } from "./runEngine.js";

export const counterCode = `import { defineReactScene, useFrame } from "@yumekit/scene";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const offset = typeof props.offset === "number" ? props.offset : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#202020" }}>
      <p data-output-frame={offset + frame} style={{ color: "#ffffff", fontSize: 40, margin: 20 }}>
        {offset + frame}
      </p>
    </div>
  );
});
`;

export const clipLengthFrames = 30;
export const lastFrame = clipLengthFrames * 2 - 1;

export async function buildCounterProject(
  engine: RunningEngine,
): Promise<void> {
  for (const [sceneId, title, offset] of [
    ["first", "First counter", 0],
    ["second", "Second counter", clipLengthFrames],
  ] as const) {
    await engine.callTool({
      name: "put_scene",
      input: { scene_id: sceneId, title, code: counterCode, props: { offset } },
    });
  }
  for (const outputId of ["wide", "tall"]) {
    await engine.callTool({
      name: "set_timeline",
      input: {
        output_id: outputId,
        tracks: [
          {
            id: "scenes",
            kind: "scene",
            clips: [
              {
                id: "first",
                scene_id: "first",
                start_frame: 0,
                duration_frames: clipLengthFrames,
              },
              {
                id: "second",
                scene_id: "second",
                start_frame: clipLengthFrames,
                duration_frames: clipLengthFrames,
              },
            ],
          },
        ],
      },
    });
  }
}
