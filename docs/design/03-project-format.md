# 03 Project format

A project is one folder. Package `@yumekit/project` is the only code that writes the files below.

## Files

```
my-project/
  project.json                  name, frame rate, outputs
  script.md                     the script, free text
  bible.json                    style, palette, cast, voice
  scenes/<sceneId>/scene.json   one scene
  scenes/<sceneId>/scene.tsx    custom code, only for a module scene
  scenes/_shared/<name>.tsx     code that custom scenes share (document 19)
  timelines/<outputId>.json     tracks and clips of one output
  assets/index.json             one record for each asset
  assets/files/<assetId>.<ext>  the media file
  assets/files/<assetId>.words.json   word timings of a speech asset
  renders/                      finished files (not in git)
  .yumekit/                     undo history and cache (not in git)
  .cache/                       frame pictures of video assets (not in git)
```

`createProject` writes a `.gitignore` with `renders/`, `.yumekit/`, `.cache/`, and the agent files `.mcp.json`, `.codex/config.toml`, and `.cursor/mcp.json`. The agent files hold full paths of one computer (document 11, "Agent setup").

## Schemas

All time is in whole frames. All sizes are in pixels. Each JSON file is written with sorted keys, 2 spaces, and a final newline, so a git diff shows only real changes.

```ts
type Project = {
  formatVersion: 1;
  name: string;
  framesPerSecond: 24 | 25 | 30 | 50 | 60;
  outputs: Output[];
  videoStyle?: VideoStyle;
  look?: LookId;
  calm?: boolean;
  tempo?: number;
  fonts?: ProjectFont[];
};

type ProjectFont = {
  assetId: string;
  family: string;
  weight?: number;
  style?: "normal" | "italic";
};

type VideoStyle = "graphics" | "ai-video" | "mix";

type LookId = "midnight" | "studio" | "editorial" | "neon" | "paper";

type Output = {
  id: string;
  label: string;
  widthPixels: number;
  heightPixels: number;
  platforms?: PlatformId[];
};

type PlatformId =
  | "youtube"
  | "youtube-shorts"
  | "tiktok"
  | "instagram-reel"
  | "instagram-post"
  | "x"
  | "linkedin"
  | "square";

type Bible = {
  style: string;
  palette: string[];
  cast: CastMember[];
  voice: string;
};
type CastMember = {
  id: string;
  kind: "person" | "place" | "product";
  name: string;
  description: string;
  referenceAssetIds: string[];
};

type Scene = { id: string; title: string; notes: string; source: SceneSource };
type SceneSource =
  | { kind: "kit"; component: string; props: JsonObject }
  | { kind: "module"; props: JsonObject };

type Timeline = { outputId: string; tracks: Track[] };
type Track =
  | {
      id: string;
      kind: "scene";
      clips: SceneClip[];
      off?: boolean;
      madeBy?: MadeBy;
    }
  | {
      id: string;
      kind: "audio";
      clips: AudioClip[];
      off?: boolean;
      madeBy?: MadeBy;
    };
type MadeBy = "person" | "ai";

type SceneClip = {
  id: string;
  sceneId: string;
  startFrame: number;
  durationFrames: number;
  sceneStartFrame: number;
  transition?: SceneTransition;
  madeBy?: MadeBy;
};

type SceneTransition = {
  kind: "fade" | "slide" | "wipe" | "zoom";
  durationFrames: number;
  madeBy?: MadeBy;
};

type AudioClip = {
  id: string;
  assetId: string;
  startFrame: number;
  durationFrames: number;
  assetStartFrame: number;
  gainDecibels: number;
  madeBy?: MadeBy;
};

type AssetIndex = { assets: Asset[] };
type Asset = {
  id: string;
  kind: "image" | "audio" | "video" | "font";
  file: string;
  contentHash: string;
  widthPixels?: number;
  heightPixels?: number;
  durationFrames?: number;
  hasAudio?: boolean;
  hasWords: boolean;
  label?: string;
  source: AssetSource;
};
type AssetSource =
  | { kind: "import"; originalName: string }
  | {
      kind: "tool";
      server: string;
      tool: string;
      model?: string;
      input: JsonObject;
      costUsd?: number;
      costIsEstimate?: boolean;
    };

type WordTimings = {
  words: { text: string; startFrame: number; endFrame: number }[];
};
```

## Rules that the store enforces

1. Each id matches `^[a-z0-9][a-z0-9-]{0,63}$` and is unique within its list.
2. Output width and height are even numbers from 16 to 7680.
3. A clip references a scene or an asset that exists. An audio clip references an asset of kind `audio`, or an asset of kind `video` with `hasAudio`.
4. Two clips on one track do not overlap. `durationFrames` is 1 or more. `startFrame`, `sceneStartFrame`, and `assetStartFrame` are 0 or more.
5. An audio clip does not read past the end of its asset.
6. A scene with source `module` has a `scene.tsx` file.
7. Nothing is removed while another record references it. The failure names each reference.
8. `file` in an asset record is a path inside `assets/files/`.
9. An asset of kind `audio` or `video` has `durationFrames`.
10. A clip id is unique within its timeline, across all tracks.
11. A platform is on one output only. The size of the output is the size of the platform in the catalog.
12. `tempo` is from 60 to 200. Each entry of `fonts` names an asset of kind `font`. A shared code name matches the id rule.

How a timeline reads:

- Scene tracks draw in list order. The first track is at the back.
- At frame `f`, a scene clip is visible when `startFrame <= f < startFrame + durationFrames`. The scene gets the frame `f - startFrame + sceneStartFrame`.
- `sceneStartFrame` cuts the start of a scene. The stage mounts the scene with a length of `sceneStartFrame + durationFrames`, so each frame it asks for is inside the scene.
- The length of an output is the largest clip end over all of its tracks.
- A track with `off: true` draws no picture and plays no sound. It still counts for the length of the output. The format version stays 1, because a track without the field is valid.
- The scenes row of a timeline is its first scene track that is not a caption track. A caption track is a scene track whose clips all show `caption-words` scenes. `scenesRowOf` and `isCaptionTrack` from `@yumekit/project` apply this rule. The entry `@yumekit/project/scenes-row` gives the same functions with no Node code, for the editor.

## The store

```ts
type ProjectSnapshot = {
  revision: number;
  project: Project;
  script: string;
  bible: Bible;
  scenes: Scene[];
  sceneCode: { [sceneId: string]: string };
  sharedCode: { [name: string]: string };
  timelines: Timeline[];
  assets: Asset[];
};

type ProjectStore = {
  folder: string;
  read: () => ProjectSnapshot;
  applyEdits: (
    edits: Edit[],
  ) => Promise<Outcome<{ revision: number }, EditFailure>>;
  undo: () => Promise<Outcome<{ revision: number }, "nothing-to-undo">>;
  redo: () => Promise<Outcome<{ revision: number }, "nothing-to-redo">>;
  readAssetWords: (
    assetId: string,
  ) => Promise<Outcome<WordTimings, "not-found">>;
  subscribe: (listener: (snapshot: ProjectSnapshot) => void) => () => void;
};

function createProject(options: {
  folder: string;
  name: string;
  framesPerSecond: Project["framesPerSecond"];
  outputs: Output[];
  videoStyle?: VideoStyle;
}): Promise<Outcome<ProjectStore, CreateFailure>>;

function openProject(options: {
  folder: string;
}): Promise<Outcome<ProjectStore, OpenFailure>>;
```

- `applyEdits` is atomic. The store applies each edit in order to a copy and checks the rules after each edit, so a failure names the exact edit. It writes the files only if all edits pass. One call is one undo step.
- A call that changes no file returns the current revision and records no undo step.
- A revision number only goes up. `undo` and `redo` each make a new revision.
- `CreateFailure` kinds: `folder-not-empty` and `invalid-value`. An empty folder that exists is accepted.
- A write goes to a temporary file first and then replaces the target with a rename.
- `read` returns an immutable snapshot. A caller never changes it.
- `undo` restores the files of the previous revision from `.yumekit/history/`. The store keeps the last 200 steps.
- Undo never deletes a media file. `removeAsset` removes only the record.
- `EditFailure` is `{ kind, editIndex, message }`. Example kinds: `id-in-use`, `not-found`, `still-referenced`, `clips-overlap`, `invalid-value`.
- `OpenFailure` kinds: `folder-not-found`, `not-a-project`, `invalid-file` (with the file and the schema error), `unsupported-format-version`.

## Edits

`Edit` is a closed union on the field `kind`. These 21 kinds are all the ways to change a project.

| Kind                 | Fields                          | Effect                                                                                                                            |
| -------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `setProjectName`     | `name`                          | Changes the name                                                                                                                  |
| `addOutput`          | `output`                        | Adds an output and an empty timeline                                                                                              |
| `removeOutput`       | `outputId`                      | Removes an output and its timeline                                                                                                |
| `setOutputPlatforms` | `outputId`, `platforms`         | Replaces the platforms of one output. The store keeps them in catalog order. An empty list removes the field                      |
| `setVideoStyle`      | `videoStyle`                    | Sets the video style of the project (document 15)                                                                                 |
| `setLook`            | `look`, `calm?`                 | Changes the look of the project, and its calm motion when `calm` is given (document 17)                                           |
| `setTempo`           | `tempo?`                        | Sets the tempo of the project. No value removes it (document 19)                                                                  |
| `setFonts`           | `fonts`                         | Replaces the fonts of the project. An empty list removes the field (document 19)                                                  |
| `putSharedCode`      | `name`, `code`                  | Adds or replaces `scenes/_shared/<name>.tsx` (document 19)                                                                        |
| `setScript`          | `script`                        | Replaces `script.md`                                                                                                              |
| `setBible`           | `bible`                         | Replaces `bible.json`                                                                                                             |
| `putScene`           | `scene`, `code?`                | Adds or replaces a scene. `code` is required for a module scene                                                                   |
| `removeScene`        | `sceneId`                       | Removes a scene and its folder                                                                                                    |
| `addAsset`           | `asset`, `words?`               | Adds a record for a file that is already in `assets/files/`. The caller gives no `contentHash` and no `hasWords`                  |
| `setAssetWords`      | `assetId`, `words`              | Adds or replaces the word timings of an audio asset                                                                               |
| `removeAsset`        | `assetId`                       | Removes the record                                                                                                                |
| `setTimeline`        | `timeline`                      | Replaces the timeline of one output                                                                                               |
| `addClip`            | `outputId`, `trackId`, `clip`   | Adds one clip                                                                                                                     |
| `updateClip`         | `outputId`, `clipId`, `changes` | Changes the timing, the gain, or the target of one clip. The target is `sceneId` for a scene clip and `assetId` for an audio clip |
| `removeClip`         | `outputId`, `clipId`            | Removes one clip                                                                                                                  |
| `copyTimeline`       | `fromOutputId`, `toOutputId`    | Replaces one timeline with a copy of another                                                                                      |

The store computes `contentHash` as `sha256:` plus the hex digest, and checks that the file exists, when it applies `addAsset`. It sets `hasWords` from the word timings.

The props of a scene can hold an asset id that the store cannot see. Rule 7 does not protect that reference, so a scene must draw correctly when `findAsset` returns nothing. It does not check that scene code compiles. The harness does that before it sends a `putScene` edit (document 05).

## Platforms

The platform catalog of document 13 is a fixed list in `@yumekit/project`. The package exports `platformCatalog` and `platformIds` in catalog order, `platformOf` and `findPlatform` for a lookup by id, and `platformsOfSize` for the platforms of one size. An output with no `platforms` is a custom output. A project without the field stays valid, so the format version stays 1.

## Video style

`videoStyle` says how the scenes of the project are made (document 15). A project with no value has `graphics`, so the format version stays 1. `videoStyleOf(project)` from `@yumekit/project` applies this default, and `videoStyles` lists the three values.

## Not in milestone 1

- Migration between format versions. Version 1 is the only version.
- A watch on the folder for changes from another program.
- Removal of media files that no record references.
