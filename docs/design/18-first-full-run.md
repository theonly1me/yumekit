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
