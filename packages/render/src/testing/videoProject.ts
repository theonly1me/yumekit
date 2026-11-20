import type { AudioClip, Edit, JsonObject, Output } from "@yumekit/project";
import { decodePng } from "./decodePng.js";
import {
  createRenderProject,
  moduleScene,
  sceneTracks,
  smallOutput,
} from "./renderProject.js";
import { addVideoAsset, markerCenterOf, type TestVideo } from "./testVideo.js";

export const videoFrameCode = `import { defineReactScene, useFrame, VideoFrame } from "@yumekit/scene";

export default defineReactScene(({ props }) => {
  const frame = useFrame();
  const assetId = typeof props.assetId === "string" ? props.assetId : "clip";
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <VideoFrame assetId={assetId} assetFrame={frame} />
    </div>
  );
});
`;

export function videoClipScene(props: JsonObject): Edit {
  return {
    kind: "putScene",
    scene: {
      id: "shot",
      title: "Shot",
      notes: "",
      source: { kind: "kit", component: "video-clip", props },
    },
  };
}

export function createVideoProject(options: {
  video: TestVideo;
  clipFrames: number;
  scene?: Edit;
  output?: Output;
  audioClips?: AudioClip[];
}): Promise<string> {
  const output = options.output ?? smallOutput;
  return createRenderProject({
    outputs: [output],
    edits: async (store) => [
      await addVideoAsset({
        folder: store.folder,
        assetId: "clip",
        video: options.video,
      }),
      options.scene ?? moduleScene({ sceneId: "shot", code: videoFrameCode }),
      sceneTracks({
        outputId: output.id,
        tracks: [
          [
            {
              id: "shot",
              sceneId: "shot",
              startFrame: 0,
              durationFrames: options.clipFrames,
            },
          ],
        ],
        ...(options.audioClips === undefined
          ? {}
          : { audioClips: options.audioClips }),
      }),
    ],
  });
}

export async function markerCenterInPng(options: {
  png: Uint8Array;
  row?: number;
}): Promise<number> {
  const picture = await decodePng(options.png);
  const row = options.row ?? Math.floor(picture.heightPixels / 2);
  return markerCenterOf(
    Array.from({ length: picture.widthPixels }, (...[, column]) =>
      picture.pixelAt({ x: column, y: row }),
    ),
  );
}
