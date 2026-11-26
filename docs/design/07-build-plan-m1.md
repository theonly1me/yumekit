# 07 Build plan for milestone 1

Milestone 1 ends when one project renders a 60 second 16:9 explainer and a 9:16 short. An agent builds that project through the harness MCP tools only.

## Work packages

Each work package is one pull request. A builder agent writes it. The owner's lead agent reviews it against the design before the merge.

| Id  | Scope                                                                            | Design    | Needs              |
| --- | -------------------------------------------------------------------------------- | --------- | ------------------ |
| WP1 | `@yumekit/scene`: the contract types, the React adapter, the animation functions | 02        |                    |
| WP2 | `@yumekit/project`: schemas, the store, all edits, undo                          | 03        |                    |
| WP3 | `@yumekit/tools` and `tools/sample-media`                                        | 06        |                    |
| WP4 | `@yumekit/stage` and `@yumekit/render`, and a lint rule for the dependency table | 01, 04    | WP1, WP2           |
| WP5 | `@yumekit/scene-kit`: 6 kit scenes and one style pack                            | 02, below | WP1, WP4           |
| WP6 | `@yumekit/harness-mcp` and the `yumekit` command                                 | 05        | WP2, WP3, WP4, WP5 |
| WP7 | `tools/openai-media`                                                             | 06        | WP3                |
| WP8 | The acceptance content                                                           | below     | all                |

WP1, WP2, and WP3 start together. WP4 and WP7 start next. WP5 follows WP4. WP6 follows WP5.

## Acceptance checks

A work package is complete only when each of its checks passes in CI, and the pull request shows the dogfood evidence.

### WP1 scene

1. `tween`, `spring`, `stagger`, `easings`, and `seededRandom` have tests with values computed by hand or from the formula. The tests include the clamps before the start and after the end.
2. A React scene in a real browser shows the correct frame after `seek`, for frames called in the order 10, 3, 10.
3. `seek` does not resolve before an image decodes and before a hold is released.
4. `FrameWindow` hides its children outside the window and restarts `useFrame` at 0 inside it.
5. `layout` and `unit` have the values that document 02 defines, for a wide, a tall, and a square output.

### WP2 project

1. `createProject` then `openProject` gives an equal snapshot.
2. Each of the 15 edit kinds has a test for its effect and a test for each rule in document 03 that can reject it.
3. A batch with one invalid edit changes no file.
4. `undo` and `redo` restore the exact file contents, including scene code.
5. Each `OpenFailure` kind has a test with a damaged folder.
6. Two writes of the same snapshot give identical bytes.

### WP3 tools and sample media

The tests in document 06, numbers 1 to 6. The root test configuration also finds tests in `tools/*`.

### WP4 stage and render

The tests in document 04. Also: a lint rule or a script fails CI when a package imports a package that the table in document 01 does not permit.

### WP5 scene kit

Kit scenes: `title-card`, `bullet-list`, `image-pan` (a slow move over an image), `caption-words` (words that appear with the narration), `bar-chart`, and `quote`. One style pack sets colors, spacing, and one bundled open font.

1. Each kit scene exports a `zod` schema for its props with a description for each field.
2. Each kit scene renders at 1920 by 1080 and at 1080 by 1920. A test reads pixels to prove that content is inside the picture in both sizes.
3. `caption-words` shows a word only from its start frame.
4. Long text does not leave the picture. The test uses a title of 120 characters.

### WP6 harness and command

The tests in document 05. Also: `yumekit init`, `yumekit mcp`, `yumekit render`, and `yumekit frame` each have a test that runs the built command as a child process.

### WP7 paid tool servers

The tests in document 06, number 7. The manual check for each server is one image and one sentence of speech.

### WP8 acceptance content

1. An agent with only the harness connected builds an explainer about yumekit: a script, a bible, 8 or more scenes, narration, images, and two timelines.
2. `render_video` gives a 16:9 file of 55 to 65 seconds and a 9:16 file of 20 to 35 seconds. `ffprobe` confirms size, frame rate, and an audio stream.
3. The lead agent watches both files and lists each defect. A defect in yumekit becomes an issue or a fix. A defect in the content is the job of the agent that built it.
4. The run uses `tools/openai-media`. The total paid cost stays under 3 US dollars.

## Dogfood that costs almost nothing

Each builder uses the thing it builds, in the way a user would, before it opens the pull request.

| Rule                     | Detail                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free media only          | Use `tools/sample-media`. No builder calls a paid API. Only WP7 manual checks and WP8 spend money, and the lead agent runs those                                                  |
| Small renders            | Scale 0.25, and 90 frames or fewer for each render                                                                                                                                |
| Use the public interface | WP4 renders a small project from the command line. WP5 looks at a still of each kit scene in both sizes. WP6 connects an MCP client and builds a 3 second project with tool calls |
| Look at the result       | Open the picture or the video. A check that only reads an exit code is not dogfood                                                                                                |
| Show it                  | Put 1 to 3 pictures in the pull request under Verification, with one line for each that says what it proves                                                                       |
| Report friction          | List each thing that was hard or unclear as a user. The lead agent turns the real ones into issues                                                                                |

## Rules for a builder

1. Read `AGENTS.md`, then `docs/design/README.md`, then the design documents of your work package.
2. Build what the design says. If the design is wrong or has a gap, stop and report it. Do not choose a different design yourself.
3. Stay inside your packages. Do not change another package, the design documents, or the lint rules, except where your work package says so.
4. Add a new package folder with the same files as an existing package.
5. Check library versions and interfaces in current documents, never from memory.
6. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build` before each push.
7. Open one pull request from a branch named `feat/<work-package-id>-<short-name>`, for example `feat/wp1-scene`. Watch CI until it is green.
8. Do not merge. The lead agent reviews and merges with a squash commit.

## Review by the lead agent

The lead agent checks each pull request for these points before the merge:

1. The public interface equals the interface in the design, name for name.
2. Each acceptance check has a test, and the test fails without the code it covers.
3. No import breaks the dependency table.
4. No forbidden dependency and no new license outside the permitted list.
5. The code rules in `AGENTS.md` hold.
6. The dogfood evidence is present and shows a real result.
