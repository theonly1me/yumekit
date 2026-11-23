import { callTool, type McpSession } from "./mcpSession.ts";

export const customSceneCode = `import { useMemo } from "react";
import { defineReactScene, useFrame } from "@yumekit/scene";
import { paper } from "@yumekit/scene-kit";

export default defineReactScene(() => {
  const frame = useFrame();
  const left = useMemo(() => 10 + frame * 8, [frame]);
  return (
    <div style={{ position: "absolute", inset: 0, background: paper.colors.background }}>
      <div style={{ position: "absolute", left, top: 60, width: 40, height: 40, background: paper.colors.accent }} />
    </div>
  );
});
`;

const sceneTrack = {
  id: "main",
  kind: "scene",
  clips: [
    { id: "first", scene_id: "kit", start_frame: 0, duration_frames: 6 },
    { id: "second", scene_id: "custom", start_frame: 6, duration_frames: 6 },
  ],
};

export async function buildVideoProject(session: McpSession): Promise<void> {
  await callTool({
    session,
    name: "put_scene",
    input: {
      scene_id: "kit",
      title: "Kit",
      kit_component: "title-card",
      props: { heading: "Install check" },
    },
  });
  await callTool({
    session,
    name: "put_scene",
    input: { scene_id: "custom", title: "Custom", code: customSceneCode },
  });
  await callTool({
    session,
    name: "set_timeline",
    input: { output_id: "wide", tracks: [sceneTrack] },
  });
}

export async function makeSampleAsset(session: McpSession): Promise<string> {
  return callTool({
    session,
    name: "generate_asset",
    input: {
      asset_id: "still",
      capability: "image",
      input: { prompt: "a lake", width_pixels: 64, height_pixels: 48 },
    },
  });
}

export async function listLocalVoice(session: McpSession): Promise<string> {
  const listed = await callTool({
    session,
    name: "list_media_tools",
    input: {},
  });
  if (!listed.includes('"Voice of this computer"')) {
    throw new Error(`list_media_tools has no local voice: ${listed}`);
  }
  return "local-voice started";
}
