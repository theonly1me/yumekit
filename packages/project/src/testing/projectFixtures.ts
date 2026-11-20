import { mkdir, mkdtemp, readdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { createProject, type Edit, type ProjectStore } from "../index.js";

export type EditOfKind<Kind extends Edit["kind"]> = Extract<
  Edit,
  { kind: Kind }
>;

export const wideOutput = {
  id: "wide",
  label: "Wide",
  widthPixels: 1920,
  heightPixels: 1080,
};

export const tallOutput = {
  id: "tall",
  label: "Tall",
  widthPixels: 1080,
  heightPixels: 1920,
};

export function temporaryFolder(): Promise<string> {
  return mkdtemp(join(tmpdir(), "yumekit-project-"));
}

export async function createTestProject(): Promise<ProjectStore> {
  const created = await createProject({
    folder: join(await temporaryFolder(), "project"),
    name: "Test project",
    framesPerSecond: 30,
    outputs: [wideOutput],
  });
  if (!created.ok) {
    throw new Error(`createProject failed: ${created.failure.message}`);
  }
  return created.value;
}

export async function readFolderFiles(
  folder: string,
): Promise<Map<string, string>> {
  const entries = await readdir(folder, {
    recursive: true,
    withFileTypes: true,
  });
  const files = new Map<string, string>();
  for (const entry of entries.filter((candidate) => candidate.isFile())) {
    const path = join(entry.parentPath, entry.name);
    files.set(relative(folder, path), await readFile(path, "utf8"));
  }
  return files;
}

export async function readProjectFile(options: {
  store: ProjectStore;
  file: string;
}): Promise<string> {
  return readFile(join(options.store.folder, options.file), "utf8");
}

export async function writeProjectFile(options: {
  folder: string;
  file: string;
  content: string;
}): Promise<void> {
  const path = join(options.folder, options.file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, options.content);
}

export function kitScene(sceneId: string): EditOfKind<"putScene"> {
  return {
    kind: "putScene",
    scene: {
      id: sceneId,
      title: `Scene ${sceneId}`,
      notes: "",
      source: {
        kind: "kit",
        component: "title-card",
        props: { text: sceneId },
      },
    },
  };
}

export function moduleScene(options: {
  sceneId: string;
  code: string;
}): EditOfKind<"putScene"> {
  return {
    kind: "putScene",
    scene: {
      id: options.sceneId,
      title: `Scene ${options.sceneId}`,
      notes: "",
      source: { kind: "module", props: {} },
    },
    code: options.code,
  };
}

export function sceneTrack(options: {
  trackId: string;
  clips: {
    id: string;
    sceneId: string;
    startFrame: number;
    durationFrames: number;
  }[];
}): EditOfKind<"setTimeline"> {
  return {
    kind: "setTimeline",
    timeline: {
      outputId: "wide",
      tracks: [
        {
          id: options.trackId,
          kind: "scene",
          clips: options.clips.map((clip) => ({ ...clip, sceneStartFrame: 0 })),
        },
      ],
    },
  };
}

export async function addAudioAsset(options: {
  store: ProjectStore;
  assetId: string;
  durationFrames: number;
}): Promise<EditOfKind<"addAsset">> {
  const file = `assets/files/${options.assetId}.wav`;
  await writeProjectFile({
    folder: options.store.folder,
    file,
    content: `audio ${options.assetId}`,
  });
  return {
    kind: "addAsset",
    asset: {
      id: options.assetId,
      kind: "audio",
      file,
      durationFrames: options.durationFrames,
      source: { kind: "import", originalName: `${options.assetId}.wav` },
    },
  };
}

export async function projectWithOneClip(): Promise<ProjectStore> {
  const store = await createTestProject();
  const addVoice = await addAudioAsset({
    store,
    assetId: "voice",
    durationFrames: 90,
  });
  await store.applyEdits([
    kitScene("intro"),
    addVoice,
    sceneTrack({
      trackId: "main",
      clips: [
        { id: "open", sceneId: "intro", startFrame: 0, durationFrames: 30 },
      ],
    }),
  ]);
  return store;
}

export function clipsOfMainTrack(store: ProjectStore): unknown[] {
  return store.read().timelines[0]?.tracks[0]?.clips ?? [];
}
