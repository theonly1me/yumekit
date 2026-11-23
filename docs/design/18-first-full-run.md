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

- A bundled media server, `tools/local-voice`, with the capability `speech` and the tool `generate_speech` of document 06. It needs no key. It uses the network only for its one download.
- On 2026-11-23 the owner listened to the samples of WP54 and decided: "the only voice i liked here is haeart one, all other are robotic and ugly", and "I don't thiink we should keep robotic voices, we should only keep realistic ones. with key user can choose what they want."
- So the server ships one model, the natural voice: Kokoro 82M through `sherpa-onnx-node`, with one voice, Heart. It has no voice of the operating system (`say`, the speech interface of Windows, `espeak-ng`), and no setting brings one back.
- The list of voices is data in the server, with the field `approved`. Only an approved voice shows in the picker, and the tool refuses each other voice. Today only Heart is approved. The owner approves another voice by name after a listen to its sample.
- The picker shows the service as "Natural voice", with the line "Free. It runs on your computer. One download of 148 MB." until the files are there, and "Free. It runs on your computer." after. The line has "Get it now", which starts the download with its progress.
- The download starts by itself at the first voice call with no key, and it is never silent. The Making screen and the steps of the chat show "Getting the natural voice, one time, 148 MB" with its percent while it runs.
- With no network at that moment, the voice step fails with "The voice needs one download. Connect to the internet and try again." and the action "Try again". The video has no voice. yumekit never falls back to another local voice, and never to the test tone.
- The order with no pick of document 15 is: `openai`, `gemini`, `fal`, each other server of the file, `local-voice`, and `sample` last. So with no key, a video has a real voice.
- The natural voice gives no word times. The harness spreads the words over the real length of the speech (see "Details of WP55"), so captions work with no paid service.
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
- The rule of the AI about a missing key (document 12, rule 9) stays. A new rule 16 says: "Never use the free test service for a voice or for music in a video. With no other voice ready, use the natural voice of this computer."

## What a timeline tool keeps (F3)

- `set_timeline` and `copy_timeline` keep the `transition` of a scene clip when the new timeline has a clip with the same id and gives no `transition` for it. To remove a transition, a call gives the kind `cut`.
- The same rule holds for each other field that only a person sets through the editor. Today that is the transition. A later field of that kind joins this rule in its own design.
- The result of the tool says how many transitions it kept, so the AI knows.

## Captions and an old voice (F4, F5)

- `place_narration` makes the caption clip only when the voice asset comes from a server that is not `sample`.
- The harness refuses a narration that is shorter than two thirds of the video with the failure `narration-too-short`, with the two lengths, unless the call says `partial: true` (see "Details of WP55"). The instructions of the AI say that the voice covers the whole video, one line for each scene.
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

## The second full run

On 2026-11-23 the verifier ran the same journey on commit cab2fbe. Nine of the ten findings of the first run were corrected or mostly corrected. One new finding stops a release: after "Record the voice again", the AI wrote the timeline again, and the music file of the person, a video clip that the person made, and each transition were gone, with no word about it. An undo brought them back.

| Id  | Decision                                                                                     | Why                                                                       |
| --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| F11 | The project knows what a person made, and a tool call of an AI cannot remove it by accident  | A rule in a text for the AI is not a protection. The harness is           |
| F12 | Each common change has its own small tool, so the AI does not write the whole timeline again | A whole timeline in one call loses what the caller did not know           |
| F13 | The script is the source of the voice                                                        | A person changes the script in the plan, and the voice must say that text |
| F14 | Each row of the editor always shows, with its state                                          | A row that is absent looks like a missing feature                         |

### What a person made (F11)

- A clip, a track, and a transition get `madeBy: "person"` when a person makes or changes them through the editor: a music or a voice file of the person, a clip from "Make a real video clip", a transition, a sound that the person placed, and a scene that the person added. A call with the header of an agent sets `madeBy: "ai"`. A project with no value counts as `ai`.
- `set_timeline`, `copy_timeline`, `remove_clip`, and `place_video` compare the timeline before and after. If the call of an agent removes or replaces a thing with `madeBy: "person"`, it fails with `would-remove-the-work-of-the-person`. The failure lists each thing in plain words ("the music Calm pad.wav", "the video clip of scene 4", "6 transitions"), and it says how to keep them and that `remove_person_work: true` permits the removal.
- The instructions of the AI say: give `remove_person_work: true` only when the person asked for that removal in this request.
- A call by a person is never refused by this rule.
- `place_video` keeps the transition and the place of the clip that it replaces. A timeline file keeps its clips in the order of their start.

### Small tools (F12)

- `replace_narration`: it records the voice again for the script of now, or for the scenes that the call names, and puts the new voice and its captions in the place of the old ones. It changes no other track, no scene, and no transition. "Record the voice again" and a change of the voice use it.
- `replace_music`: the same for the music, from a prompt or from an asset.
- The instructions of the AI get one rule: "Change only what the request asks for, with the smallest tool. Write the whole timeline only for a new video, or when the person asks to build the video again."

### The script and the voice (F13)

- Before a voice call, the harness gives the script of now to the AI in the result of `get_project`, and `place_narration` and `replace_narration` refuse a text that is not in the script with `text-not-in-the-script`, with the lines of the script. The AI then uses the script, or changes the script first with `set_script`.
- "Continue" after the plan says: "The plan is good. Use the script and the scenes as they are now, and make the rest of the video."
- When the text of a scene and its line of the script differ, the Pictures view and the Voice view say so on that scene, with "Use the script line" and "Keep the text of the scene".

### Rows and states (F14)

- The editor always shows the rows Voice, Music, Sounds, and Captions. A row with nothing says so and offers its action: "No sounds yet." with "Add a sound", and "No captions." with "Add captions".
- With a voice from a real voice service or from the natural voice, a new video gets captions, off or on by the pick of the person in the row. The rule of F4 about a second sentence stays.
- A step of the Making screen that is done has its mark and the word "ready", also when the AI wrote a sentence about it.
- The Voice view and the narration row show for each scene only the words of that scene, and Play plays that part.

### Small points

- A pick of a scene shows that scene at its settled frame, not the first frame of its transition.
- A suggestion chip of the chat is about the whole video, also when a scene is picked.
- The name of a project comes from the AI, as a short title, with the tool `set_project_name`. Until then it is the first words of the idea, cut at a word and at 40 letters.
- A change by the person names its file: "You added the music Calm pad.wav." One upload with its placement is one entry.
- The first sentence of an answer ends at a period that is outside quotation marks.
- A scene drawn by code shows no "Made with" line. A file of the person shows its real name with no scene title in front.
- Settings says "AI video in each project", and it tells a person nothing about a file to edit.
- At 390 pixels no control sits under the button "Ask for a change".

Work package WP57 holds F11 to F14 and the small points.

### Checks of WP57

1. A project with a music file of the person, a clip of the person, and a `slide` on each scene: a `set_timeline` call of an agent that leaves them out fails and lists the three kinds. The same call with `remove_person_work: true` works. The same call by a person works.
2. `replace_narration` changes the voice and the captions and no other byte of each timeline.
3. A voice text that is not in the script fails with the lines of the script.
4. One real run with the cheap model: after a music upload, a clip, and a `slide` for the whole video, "Record the voice again" keeps all three.

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

1. WP54 shipped both ways, with `system-voice` as the default. After the owner listened, WP55 removed `system-voice` and its code. The server now has one model, `natural-voice`, as the section "The local voice (F1)" says.
2. The builder could not hear the files. The owner listened to them and kept only Heart. He found the voice of the operating system and the other candidates robotic.
3. Kitten TTS also meets the license rule and is smaller. The server ships one model in this version. Kokoro has the larger model and the graded voice list.
4. Not permitted by the license rule: Supertonic (OpenRAIL weights) and Pocket TTS (CC-BY-4.0 weights). `kokoro-js` uses `phonemizer`, a build of `espeak-ng`, which is GPL-3.0. `sherpa-onnx` before 2.0.0 built `espeak-ng` into its library. Version 2.0.0 removed it (pull request 4055 of `k2-fsa/sherpa-onnx`), so the package needs 2.0.0 or later.
5. `sherpa-onnx-node` has no install script. npm installs one prebuilt package for the platform (`sherpa-onnx-darwin-arm64` and six others), from 23 MB to 35 MB. The server loads it at the first voice call. On a platform with no prebuilt package, the voice call fails with the reason, and the person can add a key for another voice.
6. The version is 2.0.1, because the policy of pnpm rejects a version younger than one day, and the rules ask for a version of two weeks or more where one exists.
7. The download takes five files from `huggingface.co/csukuangfj/kokoro-int8-multi-lang-v1_0` at the fixed commit `57adb37f`: the model, the voices, the American English word list, the tokens, and the license. It leaves out the `espeak-ng-data` folder of the archive. The server checks the size and the SHA-256 of each file, writes to a `.part` file, and renames it.
8. The files go to `<configuration folder>/voices/kokoro-int8-multi-lang-v1_0`. The bundled entry passes `YUMEKIT_CONFIG_DIRECTORY` to the server for this.
9. Since WP55 the download starts by itself at the first voice call with no key, or with "Get it now" in the picker. It is never silent (see "Details of WP55"). The download and the first line took 18 seconds on the network of the owner.
10. Kokoro with a word list skips each word that the list does not have, with no sound. So the server says numbers, prices, percents, years, and ordinals as words, and it refuses a text with another unknown word. WP55 added the input `pronunciations` for a name (see "Details of WP55").
11. The server levels the natural voice to a peak of -1 dBFS. Heart then measures about -17 LUFS.
12. `generate_speech` returns no word times. WP55 read the forced aligner of `sherpa-onnx` 2.0.2 and chose the spread of the harness (see "Details of WP55").
13. WP55 removed the failure for a Linux computer with no `espeak-ng`, because the server no longer uses it.
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

## Details of WP55

These facts and choices came from the build of WP55 on 2026-11-23, after the decision of the owner in "The local voice (F1)".

1. The voices are data in `tools/local-voice/src/naturalVoice/voices.ts`: the 54 voices of the model, each with its name, its code (for example `af_heart`), its speaker id, and `approved`. Only Heart has `approved: true`. To approve a voice, the owner names it, and a pull request sets `approved` to true. A voice name that two languages share gets its language: "Dora, Spanish" and "Dora, Portuguese".
2. The owner hears the other 53 voices in the folder `wp55-voices` next to the worktrees, with the script of the WP54 samples, each leveled to -17 LUFS with a true peak of -1 dBFS. The voices for Spanish, French, Hindi, Italian, Japanese, Portuguese, and Chinese read the American English word list, so they speak English with an accent.
3. A server description model can have `download: { bytes, ready }`. The engine passes it in `GET /api/media/choices`. The editor shows the line of the picker from it.
4. A server with a download has the tool `prepare_model`. `MediaTools.prepare({ server, model, onProgress })` calls it, and `POST /api/media/prepare` with `server`, `model`, and `callId` runs it with `call-progress` events. After `prepare` and after a call to a server that waits for a download, the pool reads the description again and the engine sends `media-servers-changed`.
5. The download sends MCP progress with the message "Getting the natural voice, one time, 148 MB". The engine puts the progress of a running call of the AI on its step in the chat file. The chat steps and the Making screen show the message with its percent. The engine writes the step again only when the percent or the message changes, so 148 MB gives about 100 writes.
6. A fetch that throws, or a body that stops, gives "The voice needs one download. Connect to the internet and try again." A file with another size or SHA-256 keeps its own message.
7. A brand name: Kokoro in `sherpa-onnx` takes a list of word lists, separated by commas, and a later list adds words. `generate_speech` takes `pronunciations`, for example `{"Hoshi": "hoe she"}`. The server joins the phonemes of the sounding words from the word list into one entry for the name, keeps the first main stress, and makes each later main stress a second stress. It writes the entries to a small word list in the temporary folder and loads the voice with both lists. So the voice says the name as one word, and the text and the captions keep "Hoshi". A sounding word that the list does not have gives a failure that names it. A name with no entry fails as before, and the message shows the input that fixes it. Rule 19 of the instructions tells the AI to give it. A real run said "Meet Hoshi tea." in 1.02 seconds with the entry and 0.89 seconds with "Hoshi" left out.
8. Not used for a name: `GenerationConfig.phonemeCodepoints` of `sherpa-onnx` 2.0.2 needs a phonemizer, and the one of its example (`piper-phonemize-node`) is GPL-3.0-or-later.
9. Word times: the forced aligner of `sherpa-onnx` 2.0.2 needs an acoustic model of the Montreal Forced Aligner, a download of about 48 MB. Its English models state CC BY 4.0 (`scripts/mfa/README.md` of `k2-fsa/sherpa-onnx`), which the license rule does not permit. So `generate_asset` spreads the words of a speech asset over its real length when the server gives no word times and has no `align` tool. Each word gets a share by its letters plus one, and a comma or a sentence end adds a pause of two or four letters. The limit: a caption can be up to a few hundred milliseconds early or late inside a sentence. A server with `align` (OpenAI) keeps the flow of `align_words`.
10. Check 2 says that a narration of 8 seconds for a video of 15 seconds fails. That is more than half, so the harness refuses a voice that is shorter than two thirds of the video. The message gives both lengths in seconds, with one decimal.
11. `place_narration` with `with_captions` and a voice of the server `sample` places the voice with no caption clip, and its line says why.
12. `voice_matches_script` comes from `voiceMatchesScript` of `@yumekit/project` (the editor reads it from `@yumekit/project/voice-script`). The voice matches when the words of each placed speech asset, in lower case and with no punctuation, appear in a row in the script. So an undo of the script change clears it with no stored state. Rule 17 asks the AI for the lines of the script word for word.
13. A step of the chat keeps `capability` (from the input of the call), `reason` (the plain message of a failed call), and `progress`. The reason of a failed media call is the message of the server, as `reason` of the failure of the harness.
14. The step reasons apply to the steps Voice and Music. "Add a key" and "Use my own music" open the Music view, which has "Change" for a service with a key and the file drop. "Make the rest" and "Try again" are fixed requests, and the Making screen then opens the editor, where the chat shows the work. A sound row for a missing part, and the old voice line on the Voice row, show the same texts and actions.
15. Tests use a stand-in for the voice server, `packages/tools/src/testing/voiceMediaServer.ts`, which writes silence and gives no word times, so no test downloads the model.
16. When the editor opens a video and nothing plays, the preview shows the first scene at its settled frame (three quarters into the clip, as the scene cards do). The position stays at 0:00, and Play starts there. A move of the position, a click on a card, or a play ends this, so the preview then follows the position.
17. At 820 pixels and less, the page has 120 pixels of space at its end, so the button "Ask for a change" covers no control of the sound rows when the person scrolls to the end.
18. The sources, read on 2026-11-23: `k2-fsa/sherpa-onnx` (`nodejs-addon-examples` for Kokoro with a word list, with phonemes, and for forced alignment; release `fa-models`; `scripts/mfa/README.md`), the package `sherpa-onnx-node` 2.0.3 (`types.js`, `forced-alignment.js`), the speaker map of `kokoro-multi-lang-v1_0` in the documents of sherpa, and the npm registry entry of `piper-phonemize-node`.
