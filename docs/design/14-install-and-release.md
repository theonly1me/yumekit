# 14. Install and release

A person installs yumekit with one command, and an agent starts it with `npx`. Today the only way is a clone of the repository and a build.

## Decisions

| Id  | Decision                                                                                                                                                                                                      | Why                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| N1  | One npm package with the name `yumekit`. No `@yumekit/*` package is published                                                                                                                                 | One install and one version. The name was free on 2026-11-22                                                                                                                                                                                                 |
| N2  | The package holds the command, the engine, the built editor, the harness, the renderer, the scene kit, and the bundled media servers                                                                          | A person needs nothing more to make a video                                                                                                                                                                                                                  |
| N3  | The workspace packages stay private. A build step makes the folder that is published                                                                                                                          | The repository keeps its package map and its import rules                                                                                                                                                                                                    |
| N4  | Each dependency from outside is a normal dependency with an exact version                                                                                                                                     | npm installs it. The package holds no copy of it                                                                                                                                                                                                             |
| N5  | The package has no install script. It downloads nothing at install                                                                                                                                            | An install script is a risk for each person who installs                                                                                                                                                                                                     |
| N6  | `yumekit doctor` checks what the computer needs. `yumekit setup` gets the browser of the renderer                                                                                                             | A person learns what is missing before the first render                                                                                                                                                                                                      |
| N7  | Only the owner releases. GitHub Actions publishes a tag `v<version>` on `main` after the owner approves the run. An agent never runs `npm publish` and never approves the run                                 | A release is not reversible                                                                                                                                                                                                                                  |
| N8  | CI runs lint, the type check, the unit tests, and the build. It runs no end-to-end test and no install check. The release workflow installs the packed file in a clean folder and uses it before each publish | The owner: "don't run e2e tests on ci, i.e. if you're trying to spin up yumekit and dogfood it on ci, don't it makes no sense to do that". A package that works only inside the repository is still the usual defect, so the check stays before each publish |

## The package

- The name is `yumekit`, and the command is `yumekit`. `npx yumekit <command>` works.
- It needs Node.js 22 or later. The field `engines` says so.
- The first version is `0.1.0`. Each workspace package keeps `0.0.0` and `private`.
- `pnpm run pack-release` builds the repository, makes the publish folder, and runs `npm pack` there. The result is one `.tgz` file in a folder that git ignores.
- The builder chooses how the publish folder holds the code of the workspace packages, and records it here. The choice must keep these rules:
  1. The scene code of a project imports the scene kit and React. The renderer and the preview resolve these from the installed package, not from the project folder. A project folder has no `node_modules`.
  2. The bundled media servers start as child processes with the full path of their file in the installed package.
  3. The editor is served from its built files in the installed package.
  4. `serverCommand` of document 11 names the installed command, so an agent configuration still works.
- The package has a `files` list. It holds the built code, the editor files, the fonts, the README, and the license. It holds no test, no source of the repository, no design document, and no prototype.
- The README of the package is the root README. It gets the sections "Install", "First video", and "Use an agent", and its status line is corrected.

## Details of the package

WP34 chose these details.

- The publish folder is `release/package`. It holds `package.json`, `README.md`, `LICENSE`, and `lib/node_modules/@yumekit/<name>` for each workspace package in the package.
- Node.js finds `@yumekit/*` in `lib/node_modules` by its normal search. The outside dependencies are in the `node_modules` folder that npm makes.
- The packages stay side by side, as in `packages/` and `apps/`. So the relative paths of the code still work, for example the path from the command to the built editor.
- The package does not use `bundleDependencies`. With it, a global install on macOS failed with npm 11.11.0. npm ran the install script of the registry metadata of `fsevents`, an optional dependency of Vite, in a folder with no `binding.gyp`.
- The package does not bundle the Node.js code. The renderer gives the scene kit, the stage, and its page files to Vite as files, and finds them by package name.
- The set of packages is `@yumekit/cli` and each workspace package that it needs through `dependencies`. `@yumekit/editor` adds its built files only.
- `@yumekit/tools` depends on the five bundled media servers, so they are in the set. `findBundledServers` finds `@yumekit/<server>/package.json` by name and starts `dist/main.js` in that folder. Before WP34 it used a path relative to the repository.
- `pack-release` gathers the `dependencies` of each package in the set, except `@yumekit/*` and the editor. The editor has its dependencies in its built files.
- `pack-release` stops when a version is not exact, when two packages need different versions, or when no package in the set gives a peer dependency. It names each problem.
- The version of a release is the `version` of the root `package.json`. The publish folder writes it into each copied `package.json`. So `yumekit --version` and the engine show the release version.
- Each copy holds the `files` entries of its workspace package: `dist`, and also `fonts` for the scene kit. The copy leaves out tests, `testing` folders, source maps, and `.tsbuildinfo` files.
- Declaration files (`.d.ts`) ship. The check of custom scene code reads the types of `@yumekit/scene`, the scene kit, and React.
- Each copied `package.json` has only `name`, `version`, `type`, and `exports`. So no copy has a script or a dependency.
- `pack-release` reads the `.tgz` with `tar`. It stops for a file outside the folders of the set, `package.json`, `README.md`, and `LICENSE`.
- It also stops for a test, a test helper, a source map, an `.env` file, TypeScript source, a design file, a key file, a value in the form of an API key, and an install script in any `package.json`.
- `pack-release` prints the layout, the dependencies, the size, and the file count. The full file list is in `release/files.txt`.
- `pnpm run check-release` installs the `.tgz` in a temporary folder, with a temporary npm cache, and runs check 2. With `--global` it uses a temporary npm prefix.
- `yumekit setup` runs `install chromium` of the `playwright-core` package in yumekit. That gets Chromium and the Chromium headless shell, as CI does.
- `yumekit doctor` starts and stops Chromium with the code of the renderer. So it finds what a render finds.
- `main.js` checks the version of Node.js before it loads the other modules.
- `serverCommand` names `process.execPath` and the real path of the installed `main.js`. For a global or a local install, that path stays.
- With `npx`, the path is in the npx cache (`_npx/<hash>`), and it works until the cache is cleared. yumekit keeps this path. The README says to install yumekit for an agent entry that stays, and gives the `npx -y yumekit` form for an entry by hand.

## What the computer needs

| Need                    | How yumekit finds it             | When it is missing                                               |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------- |
| Node.js 22 or later     | `process.versions.node`          | The command stops with one sentence                              |
| FFmpeg                  | `ffmpeg` on the `PATH`           | `doctor` gives the install command for macOS, Linux, and Windows |
| Chromium for Playwright | The browser folder of Playwright | `doctor` says to run `yumekit setup`                             |
| An agent program        | `listAgents` of document 11      | `doctor` lists which ones it found. None is not a failure        |

- `yumekit doctor` prints one line for each need, with "ok" or what to do. It exits with 1 when FFmpeg, Chromium, or Node.js is missing.
- `yumekit setup` runs the browser install of Playwright for Chromium only, with the Playwright version of the package. It prints the progress of that install.
- A render or a preview that cannot start the browser gives a failure whose hint names `yumekit setup`.

## Release

The owner published `0.1.0` from the computer on 2026-11-26. Each later version is published by GitHub Actions with npm trusted publishing: the workflow proves who it is with a short-lived identity token, so no npm token exists and no one types a one-time code.

1. A pull request changes `version` in the root `package.json`, and it merges into `main`.
2. The owner, or an agent on the owner's word, pushes the tag `v<version>` on that commit of `main`.
3. `.github/workflows/release.yml` starts. Its job uses the GitHub environment `npm`, so it waits until the owner approves it on GitHub.
4. The job checks that the tag is on `main` and matches the version, builds the file with `pnpm run pack-release`, runs `pnpm run check-release`, and runs `npm publish <file> --access public`. npm adds a provenance statement on its own.

## Details of the release workflow

- The trusted publisher on npmjs.com (the package settings, "Trusted publishing") has the user `theonly1me`, the repository `yumekit`, the workflow file `release.yml`, the environment `npm`, and "Allow npm publish". These fields cannot change. To change one, delete the connection and make a new one.
- A new connection expires when it has no successful publish within 2 days.
- The GitHub environment `npm` has the owner as its required reviewer, and it accepts only tags in the form `v*`.
- npm needs `id-token: write`, a GitHub-hosted runner, npm 11.5.1 or later, and Node.js 22.14 or later. The job uses Node.js 24 and stops when its npm is older. It passes no npm token.
- The `repository.url` of the published `package.json` must name this repository exactly.
- After the first publish from the workflow, the package setting "Require two-factor authentication and disallow tokens" (the package settings, "Publishing access") turns off publishing with a token. The trusted publisher still works.
- Sources, read on 2026-11-26: https://docs.npmjs.com/trusted-publishers and https://docs.npmjs.com/cli/v12/commands/npm-trust. The documents do not say whether a trusted publisher can publish a `.tgz` file. The first run of the workflow shows it.

## Work package

| Id   | Scope                                                                                                                     | Needs |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP34 | The publish folder and `pack-release`, `yumekit doctor`, `yumekit setup`, the README, and the CI check of the packed file |       |

### WP34 checks

1. In a clean folder outside the repository, `npm install <file>` works with no workspace and no pnpm.
2. From that install: `yumekit init` makes a project, `yumekit mcp` answers `tools/list`, a project with a kit scene and a custom scene renders a short video that `ffprobe` reads, `yumekit open --no-browser` serves the editor page and its script files, and the sample media server makes an asset.
3. `yumekit doctor` reports a missing FFmpeg and a missing browser, each with its fix, and exits with 1.
4. The packed file holds no test file, no `.env` file, no key, and no file outside the `files` list. The check prints its size and its file count.
5. The release workflow runs checks 1, 2, and 4 before each publish. CI ran them on each pull request until WP92.

## Details of WP92

These decisions came from the work on a fast and steady CI on 2026-11-26. The owner said: "don't run e2e tests on ci, i.e. if you're trying to spin up yumekit and dogfood it on ci, don't it makes no sense to do that".

### Two sets of tests

1. A unit test runs in the test process. It starts no other program.
2. An end-to-end test starts another program or a server of yumekit: the CLI, the home server, the engine over HTTP, an MCP server, a media server, an agent program, Chromium, or FFmpeg. It can also drive the editor in a browser. The name of its file ends in `.e2e.test.ts`. The editor browser tests (`*.browser.test.ts` in `apps/editor`) are all end to end and keep their names.
3. A test of browser code in the browser of Vitest (the browser tests of `packages/scene`, `packages/scene-kit`, `packages/stage`, and the page of `packages/render`) is a unit test. That browser is where the code under test runs, and the test starts no program of its own.
4. The set of a file follows what the file does, not its folder. A probe run of every node test file on 2026-11-26 recorded each program and each server that a file started. 154 files started no program. One of them, `testGuard`, starts only a local fake of a paid service. 276 files started at least one program, and each of them moved. The list is at the end of these details.
5. A fake of a paid service on a local port does not make a test end to end. Only a program does.

### The commands

6. `pnpm test` runs the unit set (`--project=unit-*`). `pnpm test:e2e` runs the end-to-end set (`--project=e2e-*`). `pnpm test:all` runs both. Each one runs `scripts/testFolders/main.ts`, so the guard of WP88 for the temporary folder covers each set.
7. The Vitest projects are `unit-node`, `unit-scene-browser`, `unit-scene-kit-browser`, `unit-stage-browser`, `unit-render-page-browser`, `e2e-node`, and `e2e-editor-browser`. The prefix decides the set. Vitest takes a pattern with `*` in `--project` (the CLI document of Vitest 5.1.2, read on 2026-11-26).
8. Each unit test file gets the setup file `unitTestGuard.ts`. It replaces the functions of `node:child_process` that start a program. A unit test that starts a program fails with "A unit test started <program>. A unit test runs in the test process only. Rename the test file to end in .e2e.test.ts, so that pnpm test:e2e runs it.". So a new test cannot bring a process back into CI by mistake.

### CI

9. CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` on Node.js 22 and 24. It installs the Chromium of Playwright for the unit browser tests. It installs no FFmpeg, because no unit test may start a program. It runs no end-to-end test, no `pack-release`, and no `check-release`.
10. `.github/workflows/release.yml` still runs `pack-release` and `check-release` before each publish (rule N8).
11. The check names stay `Check (Node 22)` and `Check (Node 24)`. The ruleset of `main` requires no check (read on 2026-11-26).
12. CI has no shards. The unit set takes UNIT_TIME on the runner, so one job for each Node.js version stays under 8 minutes. Vitest splits files into shards by count, not by time (the source of `BaseSequencer.shard` in Vitest 5.1.1).
13. Before WP92, a job took 22 and 31.5 minutes (run 45827235607, Node.js 22 and 24). With WP92, a job took CI_TIME (the runs of the pull request).

### Tests that failed under load

14. Each cause was found with a run under load: other test runs and CPU burners on the same computer, at load averages of about 20 to 240 on 16 cores.
15. The Script view, "puts the script back with Undo my changes" (run 45832857011). Cause: a defect of the editor. "Undo my changes" counted the saves of the person while the answer to the last save was still on its way, and undid one save too few. The file then kept "Black tea" in place of "Black". `useScriptSaves` now waits for the last save to end before it counts. A new test holds the answer of the second save and the reload of the project, clicks Undo my changes, and expects the first script. It failed before the fix with the same text as the CI run.
16. `stopOnEnd.mcp`, "5 seconds after SIGTERM" and "after the end of its input". Cause: the test. It checked for processes 5 seconds after the signal, not after the end of the command. Under load, the close of each media server and of Chromium took longer, and the command was still closing. The tests now wait for the command to end, check that its exit code is 0 (so the close ended before the stop deadline of 20 seconds), and find no process of it 5 seconds later, as the tests of `yumekit` and `yumekit open` do.
17. `renderFrame.kit`. Cause: the machine. The test made six renders, each with its own Chromium, in one test of 30 seconds. Under load, six starts of Chromium took more than 30 seconds. Each kit scene now renders in a test of its own, and the title card checks its pixels in one more test. No timeout changed.
18. `chat.critic` and `chat.modelChoice`, the close of the engine in `onTestFinished`. Cause: the machine. The close waits for Chromium of the picture renderer to end, and under load that took up to 10 seconds (measured with timers in each step of the close: the media servers took 7 to 23 milliseconds, the picture renderer up to 9.2 seconds). The hook limit of Vitest is 10 seconds by default. The `e2e-node` project gives a hook 30 seconds, the same as a test. The close still waits for each program to end. No other timeout changed.
19. `chat.changes.browser`. Not reproduced: 10 runs under load passed, at load averages of 58 to 247. Item 11 of "Details of WP85" in document 21 fixed its last known cause. No change.
20. The browser tests `planFirst` and `making` no longer exist. #115 removed them with the Making screen.

### Time

21. On one computer with 16 cores, at load averages near 60 from other work: the unit set ran 189 files and 1,953 tests in 25 seconds. The end-to-end set ran 363 files and 1,205 tests in 302 seconds.
22. No unit test waits on real time or on a real process. The slowest unit file, `tools/local-music/src/generateMusic.test.ts` (38 seconds in the probe run), makes music in the test process, so it does real work.

### Follow-ups

23. 124 of the moved files are tests of `packages/harness-mcp`. Their test helper `startHarnessProject` starts the sample media server as a program for each test, also for a test that makes no media, because `connectMediaTools` starts each server as a program. A connection to a media server in the test process would let the tests that make no media return to the unit set. It needs a new interface of `@yumekit/tools`, so it needs a design first.

### Sources

24. Vitest, read on 2026-11-26 (the documents show version 5.1.2; the repository has 5.1.1): https://vitest.dev/guide/cli.html (`--shard`, `--project` with `*` and `!`), https://vitest.dev/guide/improving-performance.html ("Vitest splits your test files, not your test cases, into shards"), https://vitest.dev/config/testtimeout (5 seconds in Node.js and 15 seconds in the browser by default), and https://vitest.dev/config/maxworkers.

### The files that moved to the end-to-end set

Each file kept its folder and its name, with `.e2e.test.ts` in place of `.test.ts`.

- `apps/cli/src/commands/`: `initCommand`, `mcpCommand`, `renderCommands`
- `apps/cli/src/commands/agent/`: `agentCommand`, `agentCount`
- `apps/cli/src/commands/bridge/`: `serveBridge`, `serveBridge.sameResults`
- `apps/cli/src/commands/doctor/`: `doctorCommand`
- `apps/cli/src/commands/home/`: `homeCommand`
- `apps/cli/src/commands/keys/`: `keyValueStaysSecret`, `keysCommand`
- `apps/cli/src/commands/open/`: `openCommand`, `openCommand.chat`, `openCommand.render`, `openKeyStaysSecret`
- `apps/cli/src/ending/`: `stopOnEnd.home`, `stopOnEnd.mcp`
- `apps/editor/src/testing/`: `runEngine`
- `packages/brain/src/`: `modelChoice`
- `packages/brain/src/claudeCode/`: `claudeCodeAdapter`
- `packages/brain/src/codex/`: `codexAdapter`
- `packages/brain/src/cursor/`: `cursorAdapter`, `cursorFiles`
- `packages/brain/src/program/`: `runTurn`
- `packages/engine/src/`: `startEngine.close`, `startEngine.previewRefresh`, `startEngine.requestChecks`
- `packages/engine/src/chat/`: `chat.changes`, `chat.chapters`, `chat.critic`, `chat.cursor`, `chat.failures`, `chat.files`, `chat.helper`, `chat.modelChoice`, `chat.personActs`, `chat.personLines`, `chat.personWork`, `chat.questions`, `chat.request`, `chat.session`, `chat.steering`, `chat.steeringNext`, `chat.stepNotes`, `chat.takeQuiet`
- `packages/engine/src/chat/money/`: `chat.money`
- `packages/engine/src/engineFile/`: `claimEngineFile`, `engineFile`
- `packages/engine/src/events/`: `events.requestChecks`
- `packages/engine/src/files/`: `paths`, `staticFiles`
- `packages/engine/src/home/`: `startHomeServer.create`, `startHomeServer.files`, `startHomeServer.format`, `startHomeServer.look`, `startHomeServer.recent`, `startHomeServer.security`, `startHomeServer.videoStyle`
- `packages/engine/src/http/`: `agentRoutes`, `fileRoutes`, `keyRoutes`, `mediaChoiceRoutes`, `mediaLimitRoutes`, `mediaLimitRoutes.restart`, `mediaPrepareRoutes`, `mediaRequestRoutes`, `mediaServers`, `projectRoutes`, `readJsonBody`, `settingsRoutes`, `takeDraftRoutes`, `takeRoutes`, `takeRoutes.next`, `uploadLimit`, `uploadRoutes`, `uploadRoutes.font`
- `packages/harness-mcp/src/`: `buildProject`, `buildVideoProject`, `readTools`, `referenceTools`, `toolDescriptions`
- `packages/harness-mcp/src/beats/`: `beatTimes`
- `packages/harness-mcp/src/cast/`: `castLooks`, `castTools`, `generateAsset.cast`
- `packages/harness-mcp/src/chapters/`: `setChapters`
- `packages/harness-mcp/src/clock/`: `filmClock`
- `packages/harness-mcp/src/contactSheet/`: `contactSheet`
- `packages/harness-mcp/src/critic/`: `reviewSeveral`, `severity`
- `packages/harness-mcp/src/critic/clip/`: `cleanRange`
- `packages/harness-mcp/src/critic/design/`: `designCrop`
- `packages/harness-mcp/src/critic/plan/`: `planAnswerCheck`
- `packages/harness-mcp/src/harness/`: `createHarness.failures`, `createHarness.progress`, `createHarness.sameResults`
- `packages/harness-mcp/src/media/`: `generateAsset.cameraMove`, `generateAsset.models`, `generateAsset.newKinds`, `generateAsset.servers`, `generateAsset.talkingClip`, `generateAsset.video`, `generateAssetDescription`, `generateAssets`, `generateAssets.money`, `importAsset`, `importAsset.videoSound`, `markAsset`, `mediaKeys`, `mediaTools`, `mediaTools.failures`, `previewAssets`, `promptAsSent`, `removeAsset`, `strongModel`, `videoLimit`
- `packages/harness-mcp/src/media/made/`: `madeAsset.notes`
- `packages/harness-mcp/src/music/`: `checkMusic`
- `packages/harness-mcp/src/output/`: `chapterRender`, `outputTools`, `previewScenes`, `renderPlatforms`, `renderSmallerFile`, `sharperCopy`
- `packages/harness-mcp/src/questions/`: `askPerson`
- `packages/harness-mcp/src/read/`: `listMediaRequests`, `listMediaTools`
- `packages/harness-mcp/src/replace/`: `replaceMusic`, `replaceNarration`, `replaceNarration.lines`
- `packages/harness-mcp/src/sceneClips/`: `sceneClipTools.duplicateModule`, `sceneClipTools.failures`, `sceneClipTools.move`, `sceneClipTools.removeDuplicate`, `sceneClipTools.resize`, `sceneClipTools.videoSounds`, `setTrackOff`
- `packages/harness-mcp/src/sceneGuide/`: `motionExample`
- `packages/harness-mcp/src/sharedCode/`: `sharedCodeTools`
- `packages/harness-mcp/src/spending/`: `spendingLimit`
- `packages/harness-mcp/src/story/`: `platformTools`, `platformTools.agent`, `putScene.failures`, `setLook`, `setLook.ownLook`, `storyTools`, `videoStyle`
- `packages/harness-mcp/src/storyFirst/`: `cardLanding`, `planStoryNotes`, `setStory`, `storyForm`
- `packages/harness-mcp/src/storyGuide/`: `storyGuide`, `storyGuide.flow`
- `packages/harness-mcp/src/storyPlan/`: `chapters`, `cleanUntil`, `continuesShot`, `draftMode`, `keyPictures`, `personKept`, `planAdvice`, `planBudget`, `planCheck`, `planDirection`, `reviewClip`, `setStoryPlan`, `sheetBeforePlan`, `shotGate`, `shotLook`, `shotOrder`, `startPicture`
- `packages/harness-mcp/src/storyPlan/shotBrief/`: `getShotBrief`
- `packages/harness-mcp/src/takes/`: `personPicks`, `personWords`, `pictureApproval`, `readyTakeMoney`, `sendTake`, `takeRound`
- `packages/harness-mcp/src/timeline/`: `captionsAndOldVoice`, `keptTransitions`, `personWork`, `placeNarration`, `placeNarration.captions`, `placeNarration.failures`, `placePicture`, `placeSound`, `placeSound.render`, `placeVideo`, `placeVideo.keeps`, `placeVideo.narration`, `placeVideo.quietVoice`, `placeVideo.replace`, `placeVideo.tracks`, `shownClips`, `timelineTools`, `updateClipTarget`
- `packages/harness-mcp/src/transitions/`: `setTransitions`
- `packages/harness-mcp/src/work/`: `getWork`, `putWork`, `putWork.frame`, `putWork.remove`
- `packages/render/src/`: `probeMedia`, `renderFailures.kit`, `renderFailures.project`, `renderFailures.scene`, `renderFrame`, `renderFrame.kit`, `renderFrame.look`, `renderFrame.ownLook`, `renderFrame.sceneOffset`, `renderFrame.textMark`, `renderFrame.trailerCard`, `renderFrame.transitions`, `renderFrame.video`, `renderFrame.videoCache`, `renderFrame.videoClip`, `renderFrame.videoShort`, `renderVideo`, `renderVideo.audioLength`, `renderVideo.loudness`, `renderVideo.oddSize`, `renderVideo.paperFonts`, `renderVideo.smallerFile`, `renderVideo.trackOff`, `renderVideo.videoSound`
- `packages/render/src/browser/`: `browserSetup`
- `packages/render/src/contactSheet/`: `drawContactSheet`
- `packages/render/src/media/`: `cutAudio`, `saveVideoFrame`
- `packages/render/src/motion/`: `measureClipMotion`
- `packages/render/src/pictures/`: `createPictureRenderer.lifetime`, `createPictureRenderer.project`, `createPictureRenderer.repeat`
- `packages/render/src/preview/`: `startPreviewServer.messages`, `startPreviewServer.origin`, `startPreviewServer.pixels`, `startPreviewServer.refresh`
- `packages/render/src/project/`: `beatFrames`, `frameLayer.render`
- `packages/render/src/server/`: `startStageServer.signals`
- `packages/render/src/session/`: `drawFrame.videoCapture`, `drawFrame.videoOrder`
- `packages/render/src/sharedCode/`: `sharedCodeAndFonts`
- `packages/tools/src/`: `connectMediaTools.bundled`, `connectMediaTools.choicePrices`, `connectMediaTools.chosenModel`, `connectMediaTools.configuration`, `connectMediaTools.descriptions`, `connectMediaTools.download`, `connectMediaTools.estimate`, `connectMediaTools.failures`, `connectMediaTools.keyHealth`, `connectMediaTools.keys`, `connectMediaTools.limits`, `connectMediaTools.models`, `connectMediaTools.musicOrder`, `connectMediaTools.newKinds`, `connectMediaTools.order`, `connectMediaTools.picks`, `connectMediaTools.planService`, `connectMediaTools.progress`, `connectMediaTools.sample`, `connectMediaTools.setLimit`, `connectMediaTools.spending`, `connectMediaTools.toolCalls`
- `packages/tools/src/requests/`: `requestLog`
- `scripts/release/installCheck/`: `checkEnvironment`
- `tools/codex-images/src/`: `createCodexImagesServer.chatModel`, `createCodexImagesServer.picture`, `createCodexImagesServer.readiness`, `createCodexImagesServer.together`
- `tools/fal-media/src/video/`: `mp4Facts`
- `tools/sample-media/src/`: `catalog`, `toolDescriptions`
- `tools/sample-media/src/sharpen/`: `sharpenMedia`
- `tools/sample-media/src/talking/`: `talkingClip`
- `tools/sample-media/src/video/`: `generateVideo`
