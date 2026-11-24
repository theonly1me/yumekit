import type { MountedScene, SceneAsset } from "@yumekit/scene";
import {
  installRenderGuards,
  noGuards,
  type RenderGuards,
} from "./renderGuards/index.js";
import { applyClipLook, clipLookOf } from "./clipLook.js";
import { createOutputBox, prepareStageElement } from "./stageElements.js";
import type { Stage, StageOptions } from "./stageProject.js";
import { visibleClipsAt, type VisibleClip } from "./visibleClips.js";

interface MountedClip {
  box: HTMLElement;
  scene: MountedScene;
}

function randomSeedOf(visible: VisibleClip): string {
  return `${visible.clip.sceneId}:${String(visible.sceneFrame)}`;
}

export function createStage(options: StageOptions): Stage {
  const { element, project, loadScene, mode } = options;
  prepareStageElement({ element, output: project.output });
  const layers = project.sceneTracks.map(() =>
    createOutputBox({ parent: element, output: project.output }),
  );
  const guards: RenderGuards =
    mode === "render" ? installRenderGuards() : noGuards;
  const assets = new Map<string, SceneAsset>(Object.entries(project.assets));
  const propsOfScene = new Map(
    project.scenes.map((scene) => [scene.id, scene.props]),
  );
  const mountedClips = new Map<string, MountedClip>();
  let pendingSeek = Promise.resolve();
  let isDisposed = false;

  function unmount(clipId: string): void {
    const mounted = mountedClips.get(clipId);
    if (mounted === undefined) {
      return;
    }
    mountedClips.delete(clipId);
    mounted.box.remove();
    mounted.scene.dispose();
  }

  function failureOfUnmount(clipId: string): unknown[] {
    try {
      unmount(clipId);
      return [];
    } catch (error) {
      return [error];
    }
  }

  async function mount(visible: VisibleClip): Promise<MountedClip> {
    const { clip, trackIndex } = visible;
    const props = propsOfScene.get(clip.sceneId);
    const layer = layers[trackIndex];
    if (props === undefined || layer === undefined) {
      throw new Error(`The stage has no scene "${clip.sceneId}"`);
    }
    const box = createOutputBox({
      parent: layer,
      output: project.output,
      atBack: visible.part.kind === "leaving",
    });
    box.dataset["sceneId"] = clip.sceneId;
    if (clip.sceneId === project.frameSceneId) {
      box.style.pointerEvents = "none";
    }
    try {
      const sceneModule = await loadScene(clip.sceneId);
      guards.seedRandom(randomSeedOf(visible));
      const scene = await sceneModule.mount({
        element: box,
        output: project.output,
        framesPerSecond: project.framesPerSecond,
        durationFrames: clip.sceneStartFrame + clip.durationFrames,
        ...(project.beatFrames === undefined
          ? {}
          : { beatFrames: project.beatFrames }),
        props,
        findAsset: (assetId) => assets.get(assetId),
      });
      return { box, scene };
    } catch (error) {
      box.remove();
      throw error;
    }
  }

  async function seekNow(frame: number): Promise<void> {
    if (isDisposed) {
      throw new Error("The stage is disposed");
    }
    const visibleClips = visibleClipsAt({
      sceneTracks: project.sceneTracks,
      frame,
    });
    const visibleClipIds = new Set(
      visibleClips.map((visible) => visible.clip.id),
    );
    for (const clipId of [...mountedClips.keys()]) {
      if (!visibleClipIds.has(clipId)) {
        unmount(clipId);
      }
    }
    const scenesToSeek: { visible: VisibleClip; scene: MountedScene }[] = [];
    for (const visible of visibleClips) {
      const mounted =
        mountedClips.get(visible.clip.id) ?? (await mount(visible));
      mountedClips.set(visible.clip.id, mounted);
      applyClipLook({
        box: mounted.box,
        look: clipLookOf({
          part: visible.part,
          widthPixels: project.output.widthPixels,
        }),
      });
      scenesToSeek.push({ visible, scene: mounted.scene });
    }
    await Promise.all(
      scenesToSeek.map(({ visible, scene }) => {
        guards.seedRandom(randomSeedOf(visible));
        return scene.seek(visible.sceneFrame);
      }),
    );
  }

  return {
    seek: (frame) => {
      const seek = pendingSeek.then(() => seekNow(frame));
      pendingSeek = seek.catch(() => undefined);
      return seek;
    },
    dispose: () => {
      isDisposed = true;
      const failures = [...mountedClips.keys()].flatMap((clipId) =>
        failureOfUnmount(clipId),
      );
      guards.remove();
      element.replaceChildren();
      const [firstFailure] = failures;
      if (firstFailure !== undefined) {
        throw firstFailure instanceof Error
          ? firstFailure
          : new Error("A scene failed in its dispose", { cause: firstFailure });
      }
    },
  };
}
