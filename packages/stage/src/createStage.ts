import type { MountedScene, SceneAsset } from "@yumekit/scene";
import {
  installRenderGuards,
  noGuards,
  type RenderGuards,
} from "./renderGuards/index.js";
import { createOutputBox, prepareStageElement } from "./stageElements.js";
import type { Stage, StageOptions } from "./stageProject.js";
import { visibleClipsAt, type VisibleClip } from "./visibleClips.js";

interface MountedClip {
  clipId: string;
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
  const mountedClips = new Map<number, MountedClip>();
  let pendingSeek = Promise.resolve();
  let isDisposed = false;

  function unmount(trackIndex: number): void {
    const mounted = mountedClips.get(trackIndex);
    if (mounted === undefined) {
      return;
    }
    mountedClips.delete(trackIndex);
    mounted.scene.dispose();
    mounted.box.remove();
  }

  async function mount(visible: VisibleClip): Promise<MountedClip> {
    const { clip, trackIndex } = visible;
    const props = propsOfScene.get(clip.sceneId);
    const layer = layers[trackIndex];
    if (props === undefined || layer === undefined) {
      throw new Error(`The stage has no scene "${clip.sceneId}"`);
    }
    const box = createOutputBox({ parent: layer, output: project.output });
    try {
      const sceneModule = await loadScene(clip.sceneId);
      guards.seedRandom(randomSeedOf(visible));
      const scene = await sceneModule.mount({
        element: box,
        output: project.output,
        framesPerSecond: project.framesPerSecond,
        durationFrames: clip.sceneStartFrame + clip.durationFrames,
        props,
        findAsset: (assetId) => assets.get(assetId),
      });
      return { clipId: clip.id, box, scene };
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
    for (const trackIndex of [...mountedClips.keys()]) {
      const visible = visibleClips.find(
        (candidate) => candidate.trackIndex === trackIndex,
      );
      if (visible?.clip.id !== mountedClips.get(trackIndex)?.clipId) {
        unmount(trackIndex);
      }
    }
    const scenesToSeek: { visible: VisibleClip; scene: MountedScene }[] = [];
    for (const visible of visibleClips) {
      const mounted =
        mountedClips.get(visible.trackIndex) ?? (await mount(visible));
      mountedClips.set(visible.trackIndex, mounted);
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
      for (const trackIndex of [...mountedClips.keys()]) {
        unmount(trackIndex);
      }
      guards.remove();
      element.replaceChildren();
    },
  };
}
