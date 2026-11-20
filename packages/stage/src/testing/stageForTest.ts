import type { MountOptions, SceneModule } from "@yumekit/scene";
import { onTestFinished } from "vitest";
import { createStage } from "../index.js";
import type { StageOptions, StageProject } from "../stageProject.js";

export interface SceneEvent {
  sceneId: string;
  event: "mount" | "seek" | "dispose";
  frame?: number;
}

export function recordingScene(options: {
  sceneId: string;
  events: SceneEvent[];
  draw?: (frame: number) => string;
}): SceneModule {
  const { sceneId, events } = options;
  const draw =
    options.draw ?? ((frame: number) => `${sceneId} ${String(frame)}`);
  return {
    mount: (mountOptions: MountOptions) => {
      events.push({ sceneId, event: "mount" });
      const paragraph = document.createElement("p");
      paragraph.dataset["sceneId"] = sceneId;
      paragraph.dataset["durationFrames"] = String(mountOptions.durationFrames);
      mountOptions.element.append(paragraph);
      return Promise.resolve({
        seek: (frame) => {
          events.push({ sceneId, event: "seek", frame });
          paragraph.textContent = draw(frame);
          return Promise.resolve();
        },
        dispose: () => {
          events.push({ sceneId, event: "dispose" });
          paragraph.remove();
        },
      });
    },
  };
}

export const testOutput = { id: "wide", widthPixels: 320, heightPixels: 180 };

export function stageProject(
  sceneTracks: StageProject["sceneTracks"],
): StageProject {
  const sceneIds = new Set(sceneTracks.flat().map((clip) => clip.sceneId));
  return {
    framesPerSecond: 30,
    output: testOutput,
    scenes: [...sceneIds].map((id) => ({ id, props: { label: id } })),
    sceneTracks,
    assets: {
      logo: { url: "/logo.png", kind: "image", widthPixels: 10 },
    },
  };
}

export function clip(options: {
  id: string;
  sceneId: string;
  startFrame: number;
  durationFrames: number;
  sceneStartFrame?: number;
}) {
  return { sceneStartFrame: 0, ...options };
}

export function stageForTest(options: Omit<StageOptions, "element">) {
  const element = document.createElement("div");
  document.body.append(element);
  const stage = createStage({ ...options, element });
  onTestFinished(() => {
    stage.dispose();
    element.remove();
  });
  return { element, stage };
}

export function shownScenes(element: HTMLElement): (string | null)[] {
  return [...element.querySelectorAll("p")].map(
    (paragraph) => paragraph.textContent,
  );
}

export function loaderOf(scenes: Record<string, SceneModule>) {
  return (sceneId: string) => {
    const scene = scenes[sceneId];
    return scene === undefined
      ? Promise.reject(new Error(`No scene ${sceneId}`))
      : Promise.resolve(scene);
  };
}
