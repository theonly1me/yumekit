# yumekit design

These documents are the design of yumekit. Code follows them. If code and a document disagree, one of them has a defect.

## Read in this order

| Document                                                           | Answers                                                                                             |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| [01-architecture.md](01-architecture.md)                           | Which processes and packages exist, and which package may use which                                 |
| [02-scene-contract.md](02-scene-contract.md)                       | How a scene draws one frame, and the rules that keep a render repeatable                            |
| [03-project-format.md](03-project-format.md)                       | Which files a project has, and the edit commands that change them                                   |
| [04-renderer.md](04-renderer.md)                                   | How frames become a video file with sound                                                           |
| [05-harness-mcp.md](05-harness-mcp.md)                             | Which MCP tools an agent uses to build content                                                      |
| [06-media-tools.md](06-media-tools.md)                             | How an image, voice, music, or video tool connects                                                  |
| [07-build-plan-m1.md](07-build-plan-m1.md)                         | The work packages of milestone 1, with the checks that accept each one                              |
| [08-scene-kit.md](08-scene-kit.md)                                 | Which ready scenes exist, how captions follow narration, and the default look                       |
| [09-generated-video.md](09-generated-video.md)                     | How a clip from a video model gets into a scene, and the limit on its cost                          |
| [10-providers-models-and-keys.md](10-providers-models-and-keys.md) | How a server describes its models, and where an API key lives                                       |
| [11-editor-m2.md](11-editor-m2.md)                                 | How the engine serves the editor, and the screens of the first version                              |
| [12-brain-runner.md](12-brain-runner.md)                           | How the editor starts the agent program of the person, and how the chat works                       |
| [13-editor-prompt-first.md](13-editor-prompt-first.md)             | The second version of the editor: the prompt, platforms, scene cards, and the start screen          |
| [14-install-and-release.md](14-install-and-release.md)             | How a person installs yumekit from npm, and how the owner makes a release                           |
| [15-open-steps-and-choices.md](15-open-steps-and-choices.md)       | The step views, files of the person, the choice of services and models, and the video style         |
| [16-creator-capabilities.md](16-creator-capabilities.md)           | More models, camera moves, the cast, start formats, the Files view, and new kinds of media          |
| [17-looks-and-motion.md](17-looks-and-motion.md)                   | Five looks, the motion functions, backdrops, twelve new kit scenes, and transitions                 |
| [18-first-full-run.md](18-first-full-run.md)                       | Corrections from the first full run: a local voice, step reasons, captions, names, the phone layout |

The visual reference for the editor is the prototype in [apps/prototype](../../apps/prototype).

## Product in one paragraph

yumekit is an open source harness for content creation. A person gives an idea. An agent writes the script, the scenes, and the timeline. Media tools make the images and the audio. yumekit renders the result to video and still images for any platform. The person can edit each part by prompt or by hand. All of it runs on the machine of the user, with the AI tools of the user.

## Principles

1. **The user owns the tools.** yumekit has no account, no server, and no list of permitted models. The brain is any MCP client. Each media tool is an MCP server.
2. **One way to change a project.** Each change is an edit command that the project store applies. An agent and a person use the same commands.
3. **A frame depends only on its number.** No scene reads a clock. The same project gives the same video on each render.
4. **A project is plain files.** A person can read them, and git can track them.
5. **Our own open stack.** The core has no dependency with a license that limits a visual editor or a paid product.
6. **Deep packages.** A package exposes a small interface that states what the caller wants. A caller never orders the internal steps.

## Decisions

Each row is a decision that code depends on. To change one, change this table and the affected document in the same pull request.

| Id  | Decision                                                               | Reason                                                                                                     |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1  | TypeScript for all code. Node 22 or later                              | The content is web code, and the MCP SDK is TypeScript first                                               |
| D2  | No Electron. The editor is a web app. A Tauri shell comes later        | The owner rejected Electron                                                                                |
| D3  | No HyperFrames and no GSAP in the core                                 | The GSAP license forbids visual animation tools that compete with Webflow, and Webflow can end the license |
| D4  | A scene implements `mount` and `seek(frame)`. See document 02          | The renderer and the preview stay independent of a framework                                               |
| D5  | React is the first scene adapter. An HTML adapter is second            | Agents write React well, and the editor uses React                                                         |
| D6  | All time in a project is in whole frames                               | Whole numbers give exact cuts and no rounding drift                                                        |
| D7  | One project has many outputs that share scenes and assets              | One idea becomes a long video, shorts, and stills                                                          |
| D8  | An agent changes a project only through harness tools                  | Each change is validated, recorded for undo, and visible in the editor                                     |
| D9  | A media tool writes a file and returns its path                        | Media is too large for a tool result                                                                       |
| D10 | An expected failure is a return value. A thrown `Error` means a defect | The type checker then covers each failure path                                                             |
| D11 | Apache-2.0 license                                                     | Anyone can build on yumekit, and the owner can charge later                                                |
| D12 | Each pull request merges as one squash commit                          | The history of `main` has one commit for each change                                                       |

## Words

Use these words with these meanings in code and in documents.

| Word       | Meaning                                                                          |
| ---------- | -------------------------------------------------------------------------------- |
| Project    | One folder with the files that document 03 defines                               |
| Output     | One deliverable of a project with a fixed size, for example a 1920 by 1080 video |
| Scene      | A unit of content that draws itself at a frame                                   |
| Clip       | A placement of a scene or an asset on a timeline, with a start and a duration    |
| Asset      | A media file in the project with a record of its source                          |
| Edit       | One command that changes a project                                               |
| Brain      | The agent that builds content through the harness tools                          |
| Media tool | An MCP server that makes or changes media                                        |
| Harness    | yumekit itself: the store, the tools, the renderer, and the editor               |

## Follow-ups that have no design yet

- One paid check of `tools/gemini-media` with a real key: a 3 second clip at 720p, and confirmation that background mode works for the model.
- Timeline changes by drag in the editor (milestone 3), the first run screen, and a desktop shell with Tauri.
- The cost guard and the budget cap (milestone 4).
- The cast and style rules for long content (milestone 5).
- Publishing to a platform (milestone 6).
- Sign-in in front of an engine that runs on remote infrastructure.
- Speech after 2027-01-06, when OpenAI shuts down its speech models: a Realtime path, or another speech server.
- A local align server, before OpenAI shuts down `whisper-1` on 2027-02-26.
- Servers for more hosts, such as Replicate and BytePlus, and more fal models.
- Keys in the keychain of the operating system.
- `tools/local-video`, a video server that runs on the computer of the user. It has a low priority. Document 10 has the facts of the LTX-2.3 probe.
- `tools/codex-images`, after a probe confirms that a `codex exec` run can make an image.
- Smaller undo history for long projects, and recovery after a crash in the middle of a write.
- Removal of media files and word timing files that no record references.
- A failure with a `kind` and a hint when an input does not match the schema of a harness tool.
- One paid check of `tools/fal-media` with a real key: a 4 second clip at 480p.
