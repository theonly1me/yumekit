# 18. Corrections from the first full run

On 2026-11-23 a verifier used the build of `main` as a first-time creator, in a real browser, from the start screen to an exported file: a 15 second product ad with the plan first, on the cheap model, with no media key. The journey worked, and the exported video looked designed. This document records what was wrong and what yumekit does about it.

## What the run showed

| Finding                                                                                                  | Kind              |
| -------------------------------------------------------------------------------------------------------- | ----------------- |
| With no media key, the video has no voice and no music. The Making screen says only "Skipped"            | Hurts the result  |
| After a request for a voice, the AI wrote the timeline again, and each transition of the person was gone | Hurts the result  |
| The captions did not match the scenes, and the voice still said a line that the person had undone        | Hurts the result  |
| Names of the inside show: "Captions of voice-hoshi", "the image still-product", "3. Video clip-product"  | Looks unfinished  |
| The chat shows the marks of Markdown, and the first message of the person is the long text for the AI    | Looks unfinished  |
| The editor is 628 pixels wide in a window of 390 pixels                                                  | Breaks on a phone |
| A reload of the editor page loses the page                                                               | Confusing         |
| "Make a real video clip" starts with no picture, and the control for it is far below                     | Confusing         |

## Decisions

| Id  | Decision                                                                                          | Why                                                                              |
| --- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| F1  | yumekit bundles a voice that runs on the computer of the person, with no key and no cost          | A first video with no sound is not a video. The person already owns the computer |
| F2  | A step that the AI did not do says why, and gives the next action                                 | "Skipped" tells a person nothing                                                 |
| F3  | A tool that writes a timeline again keeps what the person set on a clip, unless the call names it | The AI must not undo a pick of the person by accident                            |
| F4  | Captions exist only for a voice, cover what the voice says, and are off for a test tone           | A caption that does not match the picture is worse than no caption               |
| F5  | The voice knows when it is old                                                                    | A person changes a line and must see that the voice still says the old one       |
| F6  | The interface shows a name that a person gave or would give, never an id                          | An id says that the product is not finished                                      |
| F7  | The chat shows formatted text, and the short request of the person                                | The long text for the AI is not what the person typed                            |
| F8  | The editor works at 390 pixels with no sideways scroll of the page                                | A creator checks a video on a phone                                              |
| F9  | A reload keeps the page                                                                           | A reload is a normal act                                                         |
| F10 | "Make a real video clip" starts on the picture of the scene                                       | The scene is what the person wants to turn into a clip                           |

## The local voice (F1)

- A new bundled media server, `tools/local-voice`, with the capability `speech` and the tool `generate_speech` of document 06. It needs no key. It never uses the network after its setup.
- The builder compares two ways, from their current documents, and measures both on the computer of the owner:
  1. The voice of the operating system: `say` on macOS, the speech interface of Windows, and `espeak-ng` on Linux when it is installed. No download.
  2. An open voice model that runs in Node on the processor, with a license that the rules of the repository permit, for the model and for its code. One download at the first use, with its size shown to the person before it starts.
- The server ships the way with the better sound that works with no setup step by the person. If the open model sounds clearly better, the server has both: the system voice at once, and the model as a second entry in the picker with "Download once, <size>". The builder records the choice, the licenses, the sizes, and the time to make 15 seconds of speech.
- The server gives word times when its way gives them. With none, the harness spreads the words over the length, as document 08 says.
- The order with no pick of document 15 becomes: `openai`, `gemini`, `fal`, each other server of the file, `local-voice`, and `sample` last. So with no key, a video has a real voice.
- The picker shows it as "Voice of this computer", with the line "Free. It runs on your computer."
- Music has no free way of this kind in this version. The step says so (F2), and "Use my own music" is one click from it.

## A step that says why (F2)

- The answer of the AI can leave a step with no result. The Making screen and the sound rows then show a reason and an action in place of "Skipped":

| State                               | Text                                                        | Action                          |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------- |
| No service for music is ready       | "No music yet. Music needs a key, or your own file."        | "Add a key", "Use my own music" |
| The person stopped the request      | "Stopped before this step."                                 | "Make the rest"                 |
| The step failed                     | "This step did not work." with the plain reason of the tool | "Try again"                     |
| The AI left the step out on purpose | The first sentence of the AI about it                       | None                            |

- The editor gets the state from the tool calls of the answer and from `GET /api/media/choices`. It asks the AI nothing.
- "Make the rest" and "Try again" are fixed requests.
- The rule of the AI about a missing key (document 12, rule 9) stays. The rule about a test tone changes: "Never use the free test service for a voice or for music in a video. Use the voice of this computer when no other voice is ready."

## What a timeline tool keeps (F3)

- `set_timeline` and `copy_timeline` keep the `transition` of a scene clip when the new timeline has a clip with the same id and gives no `transition` for it. To remove a transition, a call gives the kind `cut`.
- The same rule holds for each other field that only a person sets through the editor. Today that is the transition. A later field of that kind joins this rule in its own design.
- The result of the tool says how many transitions it kept, so the AI knows.

## Captions and an old voice (F4, F5)

- `place_narration` makes the caption clip only when the voice asset comes from a server that is not `sample`.
- The harness refuses a narration that is shorter than half of the video with the failure `narration-too-short`, with the two lengths, unless the call says `partial: true`. The instructions of the AI say that the voice covers the whole video, one line for each scene.
- A scene of the kit that shows its own large text can sit under a caption that says other words. The instructions of the AI get one rule: "When a video has a voice with captions, the text of a scene supports the voice. It does not show a second sentence at the same time."
- A voice asset keeps the text that it says. The harness compares that text with the lines of the script after each change of the script. When they differ, `get_project` gives `voice_matches_script: false`, the Voice view and the Voice row show "The voice says an older text." with "Record the voice again" (a fixed request), and an undo of the script change clears it.

## Names, the chat, the phone, the reload, and the clip (F6 to F10)

- F6: a scene has a title that the AI gives in plain words, and a scene that becomes a video clip keeps its title. An asset has a `label`: the first words of its prompt, or the original name of a file of the person. The interface shows the title and the label in each place: the Pictures view, the Files view, the clip sheet, the change list, and the rows. A caption clip has no card in the Pictures view.
- F6: a change by the person names its scene: "You changed the text of scene 2." One act of the person is one entry with one "Undo", also when it changes two outputs.
- F6: the names of the free test models are plain: "Test picture", "Test tone", "Test clip".
- F7: the chat draws Markdown as formatted text: bold, italic, lists, and line breaks. It draws no HTML of a message.
- F7: the first entry of the chat shows the words that the person typed on the start screen. The lines that yumekit adds for the AI (platforms, format, style, plan) stay out of the chat. The engine keeps both texts.
- F8: at 390 pixels the editor is one column: the preview at the full width, the scene cards in a row that scrolls with a visible edge, the sound rows with their controls on a second line, and the chat behind the button "Ask for a change". No part of the page is wider than the window. A browser test checks the width of the page at 390 pixels on each screen.
- F9: the editor keeps the session token for its tab in `sessionStorage` after it takes it from the address. A reload reads it there. The token never goes into `localStorage`, a cookie, or a log.
- F10: "Make a real video clip" opens with the picture of the scene as "Start on this picture", made from the scene at the settled frame at full size as an asset, when the picked model accepts a first picture. The control sits directly under the prompt. The prompt starts from the title and the texts of the scene in their order, with no word twice.
- The clip sheet says "1 second" and "2 seconds". The export sheet says "Your video is ready" for one file. The export sheet has the choice "Size" with full, half, and quarter. The sticky bar of the start screen covers no choice at 900 pixels of height. The preview uses the height that it has, so a tall video is not small. The list of scene cards shows that it scrolls.

## Work packages

| Id   | Scope                                                                              | Needs |
| ---- | ---------------------------------------------------------------------------------- | ----- |
| WP54 | The local voice (F1), and the order with no pick                                   |       |
| WP55 | F2 to F5: the step reasons, what a timeline tool keeps, captions, and an old voice | WP54  |
| WP56 | F6 to F10 and the small points of the last paragraph                               |       |

### Checks

1. WP54: with no key, a new video gets a voice that says the script, and no test tone. The test uses a stub of the voice program, and one real run on the computer of the owner makes 15 seconds of speech and gives its time.
2. WP55: `set_timeline` with the same clip ids keeps a `slide`. A narration of 8 seconds for a video of 15 seconds fails. A changed script line gives `voice_matches_script: false`, and an undo clears it. A skipped music step shows its reason and its two actions.
3. WP56: a browser test at 390 pixels finds no page wider than the window on the start screen, the Making screen, the editor, and each sheet. A reload of the editor keeps the page. No test project shows an id in a view: a test reads the text of each view and looks for the asset ids and the scene ids.
4. After the three packages, a verifier runs the same journey again and reports what stays.

## Not in this version

- Free music that runs on the computer.
- A voice that copies the voice of the person.
- A layout for a phone that is more than one column.

## Details of WP54

These facts and choices came from the build of WP54 on 2026-11-23. The times come from a MacBook with an M3 Max. The script was the same 15 second product line for each candidate.

| Candidate                                        | License of the code                           | License of the weights | Download | Time for the script          | Word times | Languages in yumekit |
| ------------------------------------------------ | --------------------------------------------- | ---------------------- | -------- | ---------------------------- | ---------- | -------------------- |
| `say` of macOS, voice Samantha                   | Part of macOS                                 | Part of macOS          | None     | 1.2 seconds for 15.1 s       | No         | Each English voice   |
| Speech interface of Windows (`System.Speech`)    | Part of Windows                               | Part of Windows        | None     | Not measured (no Windows)    | No         | Each English voice   |
| `espeak-ng` on Linux                             | GPL-3.0, installed by the person, not bundled | Same                   | None     | Not measured (not installed) | No         | Each English voice   |
| Kokoro 82M int8 with `sherpa-onnx-node` 2.0.1    | Apache-2.0                                    | Apache-2.0             | 148 MB   | 6.6 seconds for 12.5 s       | No         | American English     |
| Kitten TTS nano 0.8 int8 with `sherpa-onnx-node` | Apache-2.0                                    | Apache-2.0             | 31 MB    | 1.8 seconds for 15.3 s       | No         | Not shipped          |

1. The server ships both ways, as F1 says for a model that sounds clearly better. `system-voice` is the default, so a video with no key has a voice at once. `natural-voice` is the second entry, with the label "Natural voice. Download once, 148 MB" until the files are there.
2. The builder could not hear the files. The choice rests on what the sources say. Kokoro is a neural model of 82 million parameters, and its voice list gives Heart the grade A. Samantha is the older compact voice of macOS. The owner listens to the saved files and can change the order.
3. Kitten TTS also meets the license rule and is smaller. The server ships one model in this version. Kokoro has the larger model and the graded voice list.
4. Not permitted by the license rule: Supertonic (OpenRAIL weights) and Pocket TTS (CC-BY-4.0 weights). `kokoro-js` uses `phonemizer`, a build of `espeak-ng`, which is GPL-3.0. `sherpa-onnx` before 2.0.0 built `espeak-ng` into its library. Version 2.0.0 removed it (pull request 4055 of `k2-fsa/sherpa-onnx`), so the package needs 2.0.0 or later.
5. `sherpa-onnx-node` has no install script. npm installs one prebuilt package for the platform (`sherpa-onnx-darwin-arm64` and six others), from 23 MB to 35 MB. The server loads it only for `natural-voice`, so a platform with no prebuilt package still has `system-voice`.
6. The version is 2.0.1, because the policy of pnpm rejects a version younger than one day, and the rules ask for a version of two weeks or more where one exists.
7. The download takes five files from `huggingface.co/csukuangfj/kokoro-int8-multi-lang-v1_0` at the fixed commit `57adb37f`: the model, the voices, the American English word list, the tokens, and the license. It leaves out the `espeak-ng-data` folder of the archive. The server checks the size and the SHA-256 of each file, writes to a `.part` file, and renames it.
8. The files go to `<configuration folder>/voices/kokoro-int8-multi-lang-v1_0`. The bundled entry passes `YUMEKIT_CONFIG_DIRECTORY` to the server for this.
9. The pick of "Natural voice" in the picker is the act of the person that starts the download. The download runs at the first voice call after it, with MCP progress. The download and the first line took 18 seconds on the network of the owner. Rule 10 of the instructions keeps the AI from a model that the person did not name.
10. Kokoro with a word list skips each word that the list does not have, with no sound. So the server says numbers, prices, percents, years, and ordinals as words, and it refuses a text with another unknown word. The message names each word and asks for a spelling in common words, or the voice of this computer.
11. The server levels the natural voice to a peak of -1 dBFS. Both voices then measure about -17 LUFS, so the music level under the voice stays the same for both.
12. No way gives word times. `generate_speech` returns none, and `place_narration` with captions asks for `align_words` first, which spreads the words evenly (the free test service with no pick). `sherpa-onnx` added a forced aligner for English in 2.0.2. A later package can use it for real word times.
13. On Linux with no `espeak-ng` and no download, a voice call fails with "This computer has no voice program. Install espeak-ng ..., or pick the natural voice in Settings."
14. The sources, read on 2026-11-23: `k2-fsa/sherpa-onnx` (license, `CHANGELOG.md`, `nodejs-addon-examples`, release `tts-models`), `huggingface.co/hexgrad/Kokoro-82M` (license and `VOICES.md`), `huggingface.co/KittenML/kitten-tts-nano-0.8`, `huggingface.co/Supertone/supertonic-3`, `huggingface.co/kyutai/pocket-tts`, `github.com/xenova/phonemizer.js`, and the npm registry entries of `sherpa-onnx-node` and `kokoro-js`.

## Details of WP56

1. An asset gets the optional `label`, at most 200 characters. `generate_asset` sets it to the first six words of the `prompt`, or of the `text` of a voice, with a capital first letter and "..." when words were cut. `import_asset` and an upload set it to the original file name. The format version stays 1, because a project with no label stays valid.
2. `assetLabelOf` in the browser entry `@yumekit/project/asset-labels` is the one rule for the name of an asset. With no label, it computes the same words from the prompt or the text, or it gives the original file name, or a plain name of the kind ("Picture", "Sound", "Video clip"). The harness gives `label` in each asset of `get_project`, so the AI can name an asset too.
3. In the editor, `names/index.ts` has `assetNameOf` and `sceneNameOf`. Each view uses them: the scene cards, the Scene tab, the detailed timeline, the Pictures view, the Files view, the Voice view, the clip sheet, and the export failure. A title of an older project that `place_video` or `place_narration` made from an id ("Video <asset id>", "Captions of <asset id>") shows the name of the asset, or "Captions".
4. `place_video` with `replace_clip_id` gives the new scene the title of the replaced scene. Without it, the scene takes the label of the video. The caption scene of `place_narration` has the title "Captions". The Pictures view leaves out each caption scene.
5. The engine words a change by the person. `put_scene` names the scene by `scene_id`. `resize_scene_clip`, `move_scene_clip`, `remove_scene_clip`, `duplicate_scene_clip`, and `place_video` with `replace_clip_id` name it by the clip. The number is the place of the clip in the scenes row of the first output, in project order, that holds it, before the change. With no number, the sentence of `@yumekit/brain` stays.
6. One act of the person is one entry. `POST /api/tools/<name>` and `POST /api/uploads` take an optional `actId` (in the body, and as `act` in the query of an upload). Each later call with the same `actId` adds its undo step to the entry of the first call, and its sentence replaces the summary. The engine keeps this map in memory, because an act takes seconds. "Make the clip" sends the picture of the scene, the clip, and `place_video` for each output as one act, so the chat shows "You added a video clip to scene 2." once, with one "Undo".
7. The free test models are "Test picture", "Test tone" (for the voice and for the music), and "Test clip".
8. Markdown: the editor has its own renderer of about 210 lines in `chat/markdown/`. It draws bold (`**` and `__`), italic (`*` and `_`), code, headings as bold lines, lists with `-`, `*`, `+`, or numbers, and line breaks, and it builds React elements only. `marked` 18.2.1 (MIT) is 52 KB, 15.7 KB with gzip, and gives an HTML string. `snarkdown` (MIT) is small, but it also gives an HTML string and had no release after 2022. This replaces item 2 of "Details of the chat panel" in document 13.
9. A `request` entry gets the optional `details`: the lines that yumekit adds for the AI. `POST /api/chat/requests` takes `details`, and the AI gets the text, a line break, and the details. The home server sends the typed words as `text`, and the lines of platforms, format, length, transitions, and the plan as `details`. "Try again" sends both again. For a first request of an older project with no `details`, the chat hides the lines from `Platforms: ` on.
10. The session token goes to `sessionStorage` under `yumekit-session-token` when the editor takes it from the address. A load with no token in the address reads it there. So a reload keeps the page, and a new tab with no link shows the page that asks for the link. A token that the engine rejects still shows its own page. This replaces item 20 of "Details of the chat panel" in document 13.
11. The editor closes its event socket only after it opened. A socket that closed while it connected made the browser print its address, with the token, in the console.
12. The development socket on port 24678: the preview page imported its scene modules with `import()`, so Vite added its client to the page, and the client tried to reach its socket. The preview page now imports through `window.yumekitImport` of the page, as the render page does. So no page of the editor loads `/@vite/client`. This replaces item 16 of "Details of the engine" in document 11.
13. At 820 pixels and less, the editor is one column. The chat and the Scene tab are a sheet over the page with "Close". "Ask for a change", "Edit text", "Change" on a sound row, and each fixed request open it. Escape closes it. The page has room under its last row for the fixed button.
14. The preview box has the shape of the output, up to the height of the window less 400 pixels (230 pixels on a phone). So a 16:9 video at 1440 by 900 is about 850 by 480 pixels, and a 9:16 video is as tall as the box. The `.stage` and `.preview` grids have one column of `minmax(0, 1fr)`, so the picture can never make the page wider. Before, a window that went from 1440 to 390 pixels kept a page of 628 to 676 pixels.
15. The scene cards fade at an edge that has more cards behind it. Below 640 pixels, a sound row puts its switch and its button on a second line.
16. A sheet has a bar at the top with "Close". The bar has the color of the page, so no text shows under the button.
17. "Make a real video clip": the picture of the scene comes from `preview_scenes` at scale 1, in the size of the current output. It is the first choice of "Start on this picture", in the row of pictures. "Make the clip" turns it into an asset: the editor hashes the PNG and reuses an asset with the same `contentHash`, or uploads it as "<scene name>.png". The control sits under the prompt, and "End on this picture" under it. Below 640 pixels, "Make the clip" sits in a bar at the bottom with the price, and the reason when it is off.
18. The prompt from a scene starts with the title, then the texts in their order. A text whose words are all in a longer text goes. Then each later word that an earlier part said goes, except short words such as "a" and "the".
19. The length in the clip sheet says "Length, 1 second" or "Length, 4 seconds". The export sheet has "Size" with Full, Half, and Quarter (`scale` of `render_video`), and the rows show the size in pixels. One file gives "Your video is ready".
20. The sticky bar of the start screen has the color of the page across the full width and a fade of 40 pixels above it, so a choice that passes under it fades out.
21. Check 3 has three browser tests: `shell/phoneLayout.browser.test.ts` (the editor, the chat, each sheet, a window that narrows from 1440, and the clip sheet), `home/startPhone.browser.test.ts` (the start screen, the Making screen, and the first entry of the chat), and `engine/sessionToken.browser.test.ts`. A part counts as wider than the window when its box passes an edge and no ancestor that clips or scrolls holds it. `names/namesInViews.browser.test.ts` reads the text, the `aria-label`, and the `title` of each view of a project whose ids differ from each title and label.
22. A click on a text while the video plays stops on the frame that the person clicked. The preview page keeps the frame of its last finished draw, and `text-editing` carries it as `frame`. The editor pauses and moves the playhead to that frame. The play loop also checks the live run before each step, so a step that the browser started before the pause cannot move the playhead after it. Before, the test "stops the play when the person clicks a text" failed at random in CI with "expected 38 to be 36": the playhead moved 2 frames after the pause. It did not fail in 22 local runs under CPU load. The cause in this item is an inference from the code, and the new test checks the clicked frame itself.
23. The export sheet shows the folder as "<project folder name>/renders". The full path is the title of that text.
