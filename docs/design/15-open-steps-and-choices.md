# 15. Open steps, own files, and the choice of services

The owner used the Making screen with a real project. The person could only watch. The script, the pictures, the voice, and the music were not visible, and the person could not change them. The person could not pick the service that makes a picture or a voice. The person could not say if the video is drawn by code, made by a video model, or both.

Document 21 replaces the Making screen with the project screen. The step views stay in "Edit by hand".

This document gives the person that control. The prototype in `apps/prototype` is the visual reference for the step views: the screens "Making", "Script", "Pictures", and "Music".

## Decisions

| Id  | Decision                                                                                                                                          | Why                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| S1  | Each step of the Making screen opens a view: Script, Pictures, Voice, Music                                                                       | The person sees what the AI made, at the moment it exists                                                       |
| S2  | The editor opens the same four views                                                                                                              | One place to learn. The views do not depend on the first request                                                |
| S3  | A person can look at any time. A change waits until the request ends, or until "Stop"                                                             | One writer at a time (document 12, B6). "Stop" gives the control back in one click                              |
| S4  | When the video is ready, the Making screen stays. "Open the editor" is the main button                                                            | The person checks the steps first. This replaces the rule of 1.2 seconds, document 13                           |
| S5  | A view changes the project in two ways: a direct tool call for an exact change, and a fixed request to the AI for a thing that must be made again | An exact change is fast and free. A thing that must be made needs the AI and a tool                             |
| S6  | A person can bring a picture, a sound, or a video file, and can save each made file                                                               | The work belongs to the person                                                                                  |
| S7  | A person picks the service and the model for each kind: pictures, voice, music, and video clips                                                   | yumekit is a harness. No service is the only one (document 10, P1)                                              |
| S8  | With no pick, yumekit uses a service that is ready. The sample service is the last choice                                                         | A test tone in a real video is a defect                                                                         |
| S9  | A project has a video style: `graphics`, `ai-video`, or `mix`                                                                                     | Scenes drawn by code are exact and free. Video clips from a model look real and cost money. A person wants both |
| S10 | The video style is the consent for paid video clips, inside the limit of Settings                                                                 | The AI must not stop for each clip when the person asked for clips                                              |
| S11 | A project has a spending limit in US dollars. Each paid call checks its price against it before it runs. Only the person changes it               | One run can spend real money. Seconds of video do not cover pictures, voice, and music                          |
| S12 | A service whose key the service rejected is not ready                                                                                             | An expired key looked ready, and the first paid call failed                                                     |

## The step views

A view has two states. It is `locked` while a chat request runs: each control that changes the project is off, and one line says "The AI still works on the video. You can look now. You can change this when the AI finishes, or after you stop it." Play, the large picture, and each download stay on.

The views are components in `apps/editor/src/parts/`. Each view takes the engine client, the snapshot, and `locked`. The Making screen shows a view next to the steps. The editor shows a view in a sheet.

| Where              | How a view opens                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| Making screen      | A step that is done is a button with the line "See and change". The first done step opens by itself, one time |
| Editor, top bar    | The buttons "Script" and "Pictures"                                                                           |
| Editor, sound rows | "Open" on the rows Voice and Music. The row Captions keeps "Change"                                           |

The Making screen has two columns from 900 pixels: the steps with "Stop" or "Open the editor" on the left, and the open view on the right. Below 900 pixels it has one column. The scene cards of document 13 move into the Pictures view.

### A fixed request

A fixed request is a chat request (document 12) with a text that the editor builds. The person sees it in the chat as their own request. The table of the texts is in the editor, in one file.

| Action                                     | Request text                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| "Update the video" after a script change   | "I changed the script. Update the video to match the script."                                    |
| "Change the picture" of a scene            | "Change the picture of this scene: `<the words of the person>`", about that scene                |
| "Use my own picture" for a scene           | "Use my picture `<file name>` as the picture of this scene.", about that scene, after the upload |
| A changed voice line                       | "Record the voice again for the lines that I changed in the script."                             |
| Another voice                              | "Record the voice again with the voice `<name>`."                                                |
| "Make this music"                          | "Change the music to: `<the words of the person>`"                                               |
| "Make the rest" of a stopped step (doc 18) | "Make the rest of the video."                                                                    |
| "Try again" of a failed voice step         | "Record the voice of the video again."                                                           |
| "Try again" of a failed music step         | "Make the music of the video again."                                                             |

### Script

- A page that the person types in, with the buttons Bold, Italic, Heading, and List. It shows the script as formatted text, never as marks of Markdown.
- The page reads `script` of the snapshot and saves with `set_script` as Markdown, 1 second after the last key and when the view closes. One save is one undo step.
- The library is Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, and the official Markdown extension), with the MIT license. The builder checks the current documents first. If the Markdown extension does not keep a heading, bold, italic, and a list through a save and a load, the builder uses Milkdown (MIT) and records it.
- After a save that changed the script, the line under the page says "You changed the script. The video still follows the old script." with "Update the video" (a fixed request) and "Undo my changes" (an undo of the saves of this view).
- "Download the script" saves `script.md`.

### Pictures

- One card for each scene, in the shape of the picked platform, from the pictures of document 13 (details 24 to 30). With two or more outputs, a control picks the platform.
- A click on a card opens it large, with a picture at scale 0.5.
- The text fields of the scene are the fields of the scene form (document 11). A change is a direct `put_scene`.
- "Change the picture" and "Use my own picture" are fixed requests.
- "Download the picture" saves a PNG file of the scene at full size, from `render_still`.

### Voice

- One row for each voice clip, in the order of the video: "Play", the scene it belongs to, and the words it says.
- The names of the voices come from the settings of the picked voice model (document 10). Another voice is a fixed request.
- "Use my own recording" uploads a sound file and puts it on the voice track in place of the voice clips, with direct tool calls. The captions then have no word times. The view says so, and offers the fixed request "Make the captions match my recording."
- "Download the voice" saves the sound file of each voice clip. "Remove the voice" and "Put the voice back" call `set_track_off`.

### Music

- "In your video now": "Play" on the music file, its name, and its length.
- "How loud the music is under the voice" changes the gain of the music clip with a direct tool call.
- "Or describe the music" is a fixed request.
- "Use my own music" takes a file by a click or by a drop. The editor uploads it, and replaces the music clip with a clip of the new file, cut or repeated to the length of the video, with direct tool calls.
- "Download the music" saves the sound file. "Remove the music" and "Put the music back" call `set_track_off`.

### Files of the person

| Request                                  | Result                                                                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/uploads?name=<file name>`     | The body is the bytes of the file. The engine saves it in a temporary folder, calls `import_asset`, and removes the temporary file. It returns the asset. One undo step |
| `GET` of an asset file with `download=1` | The same bytes with a header that makes the browser save the file under its name                                                                                        |

- The limit of an upload is 500 megabytes. A larger file gives `upload-too-large` (413). A file that is not a picture, a sound, or a video gives the failure of `import_asset`.
- The name of the file never becomes a path. The engine keeps only its last part and its letters, digits, dots, dashes, and underscores.
- An upload needs the session token, as each other request.

## The choice of services

### The order with no pick

Document 06 says that a call with no server uses `defaults`, then the first server that started with the capability. That gave the sample server for each kind. The new rule: with no default for a capability, the call uses the first server that has the capability and is ready, in the order `codex` ("Details of WP67"), `openai`, `gemini`, `fal`, each other server of the file, `local-voice` (document 18), `local-music` (document 19), and `sample` last. A server is ready when it started and each key that it needs is there. If no server is ready, the call fails with `media-key-missing` for the first of them, as before.

### The picker

| Request                   | Result                                                                                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/media/choices`  | For `image`, `speech`, `music`, and `video`: each model of each server with its label, the state of the server (ready, needs a key, failed), and the pick that applies now with its source (`picked` or `first-ready`) |
| `PUT /api/media/defaults` | Takes `{ capability, server, model }`, or `{ capability }` to remove the pick. Writes `defaults` of the user file `media-tools.json` with a temporary file and a rename. The next call uses it, with no restart        |

- Settings gets the group "Services", above the keys: one row for each kind, with the names "Pictures", "Voice", "Music", and "Video clips". A row shows the service and the model that apply now, and "Change" opens the list of models, grouped by service.
- A model of a service that needs a key is in the list. A pick of it opens the key guide in place. The pick saves after the key saves.
- The Pictures, Voice, and Music views show one line, for example "Made with OpenAI, gpt-image-1." with "Change", which opens the same list.
- The instructions of the AI get one rule: "Give no server and no model in a call that makes a picture, a voice, music, or a video clip, unless the person names one. The picks of the person apply."
- The pick is the start, not a wall. Each place that makes one thing lets the person use another model for that one thing: "Change the picture", "Make this music", another voice, and "Make a real video clip" each show the model that applies, with "Change". A model that the person picks there goes into the fixed request as one more sentence: "Use the model `<label>` of `<service>`." It does not change the pick of Settings.
- The lists show each model that each service describes (document 10). yumekit hides no model, and it prefers no service.
- `align` has no row. It follows `speech` when the same server has both, and the order with no pick in each other case.

## The video style

| Style      | Name for the person | Meaning                                                                                                              |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `graphics` | "Graphics"          | Each scene is drawn by code. The result is exact, it is the same each time, and it costs nothing                     |
| `ai-video` | "AI video"          | Each scene is a video clip from a video model. Text over it is still drawn by code                                   |
| `mix`      | "Mix"               | The AI picks for each scene: graphics for words, numbers, and screens, and a video clip for a shot of the real world |

- The start screen has the choice "How the video is made", below the platforms, with the three names and one line for each. The first pick is "Graphics".
- `POST /api/home/projects` takes `video_style`. The project keeps it as `videoStyle` in `project.json`. A project with no value has `graphics`.
- `get_project` gives `video_style`. The new tool `set_video_style` changes it, as one undo step. Settings of the editor shows the choice in the group "This video".
- The instructions of the AI replace rule 4: "Read the video style of the project. With `graphics`, make no video clip from a paid model, unless the person asks for one. With `ai-video` and `mix`, make the clips with no question. If a clip fails because of the limit or a missing key, say so in one sentence, and draw that scene by code."
- The limit `generatedVideoSeconds` of document 09 still holds. With "AI video" or "Mix", the start screen shows the limit and the place to change it: "yumekit makes at most 30 seconds of AI video for this project. You can change this in Settings."
- A scene card of the editor says "Graphics" or "Video clip". "Make a real video clip" (WP32) changes one scene to a clip. "Back to graphics" on a scene with a clip is the fixed request "Draw this scene by code, with no video clip.", about that scene.

## Work packages

| Id   | Scope                                                                                                                       | Needs |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP37 | The frame of the step views, the Making screen with two columns, the Script view, the Pictures view, and the editor buttons | WP36  |
| WP38 | The order with no pick, the two media routes, the group "Services", and the rule of the instructions                        |       |
| WP39 | The video style: the project field, the tool, the start screen, the instructions, and the scene label                       |       |
| WP40 | The upload and the download, the Voice view, the Music view, and "Open" on the sound rows                                   |       |

WP37 and WP40 share the folder `apps/editor/src/parts/`. WP37 owns the frame (`parts/frame/`), Script, and Pictures. WP40 owns `parts/voice/`, `parts/music/`, and the fixed request table (`parts/fixedRequests.ts`), which WP37 also uses. The package that merges second adds its views to the other places.

### Checks

1. WP37: a done step opens its view on the Making screen. A view is locked while a request runs, and open after "Stop". A change of the script saves as Markdown and keeps a heading, bold, italic, and a list. "Update the video" sends the fixed request. The Making screen stays when the answer is done.
2. WP38: with no pick and an OpenAI key, a picture call uses `openai`, and with no key it uses `sample`. A pick in Settings changes the next call with no restart. A pick of a service with no key opens the key guide.
3. WP39: each style reaches the first request. `set_video_style` is one undo step. A project file with no `videoStyle` loads as `graphics`.
4. WP40: an upload of a sound file becomes the music of the video, and "Download the music" gives the same bytes. A file name with `../` writes nothing outside the project. A file past the limit gives `upload-too-large`.
5. Each work package shows screenshots next to the prototype, in dark and in light, at 1440 pixels and at the width of a phone.

## Not in this version

- A change by the person while a request runs.
- More than one music clip, and a fade that the person sets.
- A voice that the person records in the browser.
- A picker for the model of the AI in the chat.

## Details of WP38

1. `MediaTools` of document 06 gets `choices()` and `pick()`. The two media routes call them. `pick` checks the server and the model, writes the user file, and then reads both files again. So the next call uses the merged `defaults` with no restart. The project file still wins for a kind that it names.
2. A server is ready when it started and no key of its description is missing. A server with no valid description is ready, because yumekit knows no key of it.
3. yumekit does not know the capabilities of a server that failed to start. So `GET /api/media/choices` gives each failed server once in `failed_servers`, and the state of a service in a list is `ready` or `needs-key`.
4. The answer of `GET /api/media/choices` is `{ choices, failed_servers }`. Each item of `choices` has `capability`, `current`, and `services`. `current` is `null` when no server makes the kind. Otherwise it has `server`, `server_label`, `model`, `model_label`, `source`, and `state` (`ready`, `needs-key`, or `not-available` for a pick of a server that is not there now). Each service has `server`, `label`, `state`, `keys` (as in `/api/media-servers`), and `models` with `id`, `label`, and `is_default`.
5. `PUT /api/media/defaults` gives the same shape as the `GET`, and the engine sends `media-servers-changed`. Its failures: `body-not-valid` (400, also for `align`), `server-not-found` (404), `no-server-for-capability` (400), `model-not-found` (400), `invalid-configuration-file` (409, and the engine does not write over the file), and `configuration-not-written` (500).
6. The entry is the server name alone for a pick with no model, and `{ "server", "model" }` for a pick with a model. The write keeps each other field of the file. yumekit makes a missing configuration folder with mode `0700`, as for the key file.
7. A service that describes no model of the kind shows one choice, "The model of this service". The sentence for a one-time pick of it is "Use the service `<label>`."
8. The list shows the services in the order with no pick. It shows each model that a service describes for the kind.
9. A pick of a model of a service that needs a key opens the key guide under that service. The pick saves after the key saves. "Let yumekit pick the first service that is ready" removes a pick.
10. When the free test service applies, the row says that it makes test pictures or a test tone, and that another service gives a real video.
11. `apps/editor/src/settings/services/index.ts` exports the parts for the step views and for "Make a real video clip":
    - `MadeWith({ client, kind })` shows "Made with `<service>`, `<model>`." with "Change". A pick there changes the pick of Settings.
    - `MadeWith({ client, kind, once: { chosen, onChoose } })` is the one-time pick. A pick calls `onChoose` with the model and saves nothing. The line then shows the chosen model.
    - `oneTimeModelSentence(target)` gives the sentence "Use the model `<label>` of `<service>`." for the fixed request.
    - `useMediaChoices(client)` and `currentModelOf({ state, kind })` give the model that applies now, with `server` and `model`. "Make a real video clip" can start its list on that model.
12. The rule of the instructions is rule 10, at the end of the list, so the numbers of the other rules do not change.

## Details of WP39

1. `videoStyle` is optional in `project.json`. `videoStyleOf(project)` from `@yumekit/project` gives `graphics` when the field is absent. `createProject` takes an optional `videoStyle`, and the home server always gives one.
2. `POST /api/home/projects` takes `video_style` as optional, with `graphics` as the default. A value that is not in the list gives status 400.
3. The style reaches the AI only through `get_project`. The first request text keeps its lines. Rule 2 of the instructions makes `get_project` the first call, and rule 4 tells the AI to read the style.
4. The descriptions of `get_project` and `set_video_style` say what each style means. The description of `set_video_style` tells the agent to change the style only when the person asks. The server instructions do not change.
5. `GET /api/home` gives `generated_video_limit_seconds`: the limit of the user file `media-tools.json`, 30 with no value, and `null` when the file is not valid. A new project has no project file, so this is the limit that applies to it.
6. The limit line of the start screen has two more forms. With `null`: "yumekit has a limit of AI video for each project. You can change this in Settings." With 0: "AI video is turned off in Settings, so yumekit draws each scene by code. You can change this in Settings."
7. The lines of the three choices: "Each scene is drawn by code. It is exact, and it costs nothing.", "Each scene is a video clip from a video model. It looks real, and it costs money.", and "The AI picks for each scene: graphics for words and numbers, a video clip for a real shot."
8. The group "This video" is the first group of Settings. A pick calls `set_video_style` at once. The group stays on while a request runs, because the AI reads the style at the start of its next request.
9. A scene card shows "Graphics" or "Video clip" after its length. A scene is a video clip when it shows the kit scene `video-clip`.
10. "Back to graphics" shows next to "Make a real video clip", only on a picked scene with a clip. It is off while a request runs. Its text is in `apps/editor/src/videoStyle/videoStyles.ts` until the table of fixed requests (WP40) exists.

## Details of WP40

These rules came from the build of WP40.

1. The upload keeps the part of the name after the last `/` or `\`. It keeps letters, digits, dots, dashes, and underscores, removes the dots at the start, and keeps at most 200 characters. An empty result gives `upload-name-not-valid` (400). So `../../song.mp3` and `/tmp/song.mp3` both become `song.mp3` in a new temporary folder.
2. The asset id is the name without its extension, in lower case, with each other run of characters as one hyphen. An id in use gets `-2`, `-3`, and so on.
3. The engine reads the kind of the file with `probeMedia`. An SVG file is a picture. A file that it cannot read gives `file-type-not-supported` (400) and calls no tool. Each failure of `import_asset` gives status 400 with its `kind` and `message`. A success returns `{ "asset": <the asset record> }`.
4. A `Content-Length` past 500 MB gives 413 before the engine reads the body, with `Connection: close`. A body that grows past the limit is read to its end and not kept, then gives 413. The engine removes the temporary folder in each case.
5. With `download=1`, the header is `Content-Disposition: attachment`. The name is `originalName` for an imported asset, and the asset id with the extension of its file for each other asset. `filename` holds only letters, digits, dots, dashes, and underscores. `filename*` holds the full name.
6. A view takes `ask`, the `send` of the chat, next to the client, the snapshot, and `locked`, because a fixed request goes through the chat. `parts/fixedRequests.ts` gives `fixedRequestTextOf(request)` and `sendFixedRequest({ ask, request })`.
7. "Use my own music" and "Use my own recording" call `set_timeline`, one time for each output. No clip tool adds an audio track, and a repeat needs more than one clip. So the change is one undo step for each output. The tracks keep their ids. A new music track is `music`, and a new voice track is `narration`.
8. The music clips play the whole file from frame 0, one after another, until the length of the video without the music. The last clip is cut. The new clips keep the gain of the old music clip, or -12 decibels.
9. The own recording is one clip from frame 0, cut to the length of the video without the voice. The captions stay as they are. The view says "Your recording has no word times, so the captions do not follow it yet." with "Make the captions match my recording".
10. The voice row is the track with a voice clip, or else an audio track with the id `narration` or `voice`, also with `-<number>`. So the row stays Voice after an own recording.
11. "How loud the music is under the voice" goes from -30 to 0 decibels. It saves 0.4 seconds after the last move, with `update_clip` for each music clip of each output.
12. Each change of a view applies to each output. The Voice view lists the voice clips of the first output that has a voice track.
13. The names of the voices come from the `voice` setting of the model in the asset record of the first voice clip. The pressed name is the `voice` of its input, or the default. With no such setting, the view hides "Who speaks". The picks of WP38 can replace this source.
14. A second music row keeps "Change", because this version has one music clip.
15. The Voice view and the Music view show the line `MadeWith` of WP38 for the pick of Settings, under "What the voice says" and "In your video now". A second line in one-time mode sits under "Who speaks" and under "Or describe the music". Its pick adds the sentence of the model to the fixed request.
16. The text of "Back to graphics" of WP39 moves into the table of fixed requests, as the kind `back-to-graphics`.
17. Until the frame of WP37 is on `main`, the editor opens a view in a sheet with its title, the locked line, and "Stop".

## Details of WP37

WP37 made these choices where this document and the prototype give no rule.

1. The Script view uses Tiptap 3.35.0: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/markdown`, `@tiptap/pm`, and `@tiptap/core`, each with the MIT license. The documents of `@tiptap/markdown` call it an early release. A test keeps a heading, bold, italic, and a list through a save and a load, so Milkdown is not needed.
2. "Heading" makes a heading of level 2, as in the prototype. A heading of level 1 from the AI stays.
3. The editor reads `script` from `GET /api/project`. The engine already sends it.
4. A view takes `ask` (item 6 of "Details of WP40"). On the Making screen, a sent request opens the editor, so the person sees it in the chat. In the editor, the sheet stays open and locks, and the side panel shows the Chat tab. A request that does not start shows "The request did not start. Try again in a moment."
5. The line under the script page is empty before a change, because the editor cannot know if the video matches the script. "Update the video" saves the text that waits first.
6. "Undo my changes" calls `undo` one time for each save of the view, when the last change of the project is the last save of the view. Otherwise it calls `set_script` with the script from before the first save, so it never undoes a change of another writer.
7. With two or more outputs, the Pictures view shows one button for each output, with the names of its platforms and its shape.
8. The fields of a scene are the kit form of the Scene tab, inside a `fieldset` that is off while the view is locked. A scene with its own code shows one line in place of the fields.
9. A scene with no clip has no `about_clip_id`, so the view shows no "Change the picture" and no "Use my own picture" for it. One line says "This scene is not in the video yet. Ask the AI in the chat to change its picture."
10. "Download the picture" saves `<scene id>.png`. A scene with a clip uses `render_still` at the frame of item 27 of document 13. A scene with no clip uses `preview_scenes` at scale 1, because `render_still` needs a frame of the output.
11. "Use my own picture" sends the file to `POST /api/uploads?name=<file name>` with `upload` of the engine client. The request names the `originalName` of the new asset. A failed upload shows its message and sends no request. `upload-too-large` says "This file is larger than 500 megabytes. Pick a smaller picture." The prototype has "Remove my picture". This document has no rule for it, so the view leaves it out.
12. The step "Put it together" opens the view "The video", with "Open the editor". The steps Voice and Music open the Voice view and the Music view of WP40 in the frame.
13. A view is locked on the Making screen while the first answer runs, and in the editor while a chat request runs.
14. The scene cards of the Making screen move into the Pictures view. The hook that reads their pictures is now `parts/pictures/useScenePictures.ts`.
15. The editor has one sheet for the four views, with the frame of WP37. It replaces the sheet of item 17 of "Details of WP40". While a request runs, the frame shows the locked line with "Stop". On the Making screen, the frame has no "Stop", because "Stop" is next to the steps.
16. The Pictures view shows `MadeWith` of WP38 for the pick of Settings above the cards. A second line in one-time mode sits under "Change the picture". The kind `change-the-picture` of the fixed requests takes `model`, as `another-voice` and `make-this-music` do.

## Details of WP64

The first film with paid media found these defects: no limit in money, no record of most paid calls, an expired key that showed as ready, music longer than the cut, and silent changes of a picture size. WP64 made these choices.

### The spending limit

1. A project has a spending limit in US dollars, `limits.spendingUsd` of `media-tools.json`. The user file gives the default of each project, and a project file wins, as for `generatedVideoSeconds`. With no value, the limit is 5 US dollars. A limit of 0 turns each paid call off.
2. The default is a limit, not "no limit", because an agent in a loop can spend without end. A refused call fails loudly and says where the person changes the limit.
3. `MediaTools.run` in `@yumekit/tools` checks the limit before each call, so each caller (`generate_asset`, `align_words`, `make_sharper_copy`, and each later caller) gets the check. The check uses the price estimate of the call. A call where the amount spent, the calls that still run, and the price together pass the limit fails with `spending-limit-reached`, with `server`, `limitUsd`, `spentUsd`, `priceUsd`, and `priceBasis`. The call never reaches the media server.
4. The harness text of the failure names the limit, the amount spent, and the price: "This call costs about 0.40 US dollars. The project has spent 0.80 US dollars of its limit of 1.00 US dollars, so the call would pass the limit. yumekit did not make it." The hint tells the AI that only the person can raise the limit, and to make the rest with free tools.
5. The price estimate comes from `prices` of the model in the description of the server. The price whose `when` matches the most setting values applies. A setting with no value in the input uses its default. The unit `image` and the new unit `call` count once. `second` and `minute` use `duration_seconds`, or the expected length that the harness gives (the voice of a talking clip), or the words of `text` at 2.5 words for each second. `thousand-characters` uses the length of `text`.
6. A server that runs on this computer is free, and a price of 0 is free. A free call needs no check and makes no record, also with a limit of 0.
7. A model with no known price counts at a cautious price of its kind. The choice was between a cautious price and a consent of the person for each call. A consent needs a person in the loop at each paid call, and the AI cannot give it for the person. A cautious price keeps the AI working and keeps the limit safe, because each cautious price is higher than each known price of its kind on 2026-11-24:

   | Kind           | Cautious price         |
   | -------------- | ---------------------- |
   | `image`        | 0.25 US dollars a call |
   | `speech`       | 0.10 a call            |
   | `align`        | 0.05 a call            |
   | `music`        | 0.50 a call            |
   | `sound-effect` | 0.25 a call            |
   | `video`        | 2.00 a second          |
   | `talking-clip` | 1.00 a second          |
   | `sharper`      | 1.00 a call            |

   A length that is not known counts as 10 seconds.

8. `PUT /api/media/limits` takes `generated_video_seconds`, `spending_usd`, or both, and answers with both values that apply. Since WP73 (document 20, C42), it writes them to the `media-tools.json` of the open project. `spending_usd` is from 0 to 10,000 and keeps cents. A request with the header `x-yumekit-client: agent` fails with `limit-not-for-the-ai` (403) and changes no file. No harness tool changes a limit. So the AI can read the limits, and only the person can change them.
9. Settings, group "Limits", shows "Money for paid services in this project" above the video seconds: a field in US dollars, a bar of the money spent, and the line "About $0.84 of $5.00 spent in this project. $4.16 left."

### The record of paid calls

10. Each paid call that runs adds one entry to `<project>/.yumekit/spending.json`: `at`, `server`, `model`, `capability`, `file_stem`, `usd`, and `basis`. The basis is `reported` (an amount from the service that is not an estimate), `catalog` (an estimate from the catalog), or `cautious` (the cautious price of item 7). A call that runs past its time counts its estimate with `timed_out: true`, because the service can charge it. A call that fails in each other way adds nothing.
11. The record is separate from the assets. A replaced or removed asset, an asset id that is used again, and undo keep each entry. A record that is not valid fails each paid call with `spending-record-not-valid`, because a wrong total could pass the limit.
12. The record is in `.yumekit/`, so it is not in git. A copy of a project starts at 0.
13. `MediaTools.spending()` gives `limitUsd`, `spentUsd`, `remainingUsd`, and `paidCalls`. `list_media_tools` and `get_work` give them as `spending` and in one line. The editor reads them from `/api/media-servers`.
14. `run` returns `cost` for a paid call: the amount of the server when it gives one, or else the estimate. `generate_asset` saves it in `costUsd` and `costIsEstimate` of the asset, and gives `cost_usd`, `cost_is_estimate`, and `price_not_known` in its result.

### A key that does not work

15. A key that is there can still fail: the first call with an expired OpenAI key failed with "The OpenAI API answered 401: Your API key has expired." A paid call is not a check. So yumekit checks each key with the free `check_key` tool of its server when the picker opens (`GET /api/media/choices`) and when the AI calls `list_media_tools`. The answer stays for 5 minutes. No check makes a paid call, and no log holds a key.
16. A failed call whose text says that the service answered 401 or 403 marks the key as not working, with the text of the service. This mark stays until the key changes. A new key starts the server again, and the next check reads the new key.
17. A service with a key that does not work has the state `key-not-working` and `key_problem` in the picker, and `key_problem` in `list_media_tools`. The order with no pick skips it. A call that names it fails with `media-key-not-working` and calls no tool. The picker shows "The key does not work", the message of the service, and the key guide for a new key.

### Music that is longer than asked

18. Lyria takes the length only as a wish in the prompt. After each music or sound effect call with `duration_seconds`, the harness reads the real length. When the file is more than 0.25 seconds longer, the harness cuts it to the asked length with a fade at the end of a tenth of the length (at most 1 second), as a WAV file `<asset id>-fitted.wav`. The asset uses the cut file. Its source gets `fit` with `originalFile`, `seconds`, and `fadeOutSeconds`, and the original file stays.
19. The result gives `real_seconds`, and for a cut file `original_seconds` and `fitted`. A shorter file is not changed, and the result says so.
20. `accepts` gets the value `length` for a model that makes the asked `duration_seconds`: the sample music and sound models, the music of this computer, and each fal sound model. A Lyria model has no `length`. The descriptions of `list_media_tools` and of the Gemini music tool say what that means.

### Sizes and sound

21. The OpenAI size failure names the nearest valid size, for example "The nearest valid size is width_pixels 1008 and height_pixels 1024."
22. When a picture has another size than the asked one, the result says the real size and the next value of the `resolution` setting of the model, for example 'For a larger picture, ask again with input.resolution "2K".'
23. Rule 32 of the instructions of the AI: a video model that always makes sound takes no `with_audio` false; the AI places its clip with `sound_gain_decibels` "off" when the film needs no sound from it. Rule 33 tells the AI about the spending limit.

## Details of WP67

The owner asked why yumekit did not use the Codex program that the person already has. Codex CLI can make a picture with the ChatGPT plan of the person and no key. WP67 adds the bundled server `codex` (`tools/codex-images`, document 06) and made these choices.

### What the sources say

Read on 2026-11-24. The installed program is Codex CLI 0.163.0. The newest release on that day is 0.172.0.

1. Codex has a built-in picture tool, `image_gen.imagegen`. The feature `image_generation` is stable and on by default (`codex features list`, and `codex-rs/features/src/lib.rs` at the tag `rust-v0.163.0`). The tool is there only with an OpenAI sign-in or provider (`codex-rs/ext/image-generation/src/extension.rs`).
2. The tool uses the model `gpt-image-2` with the size `auto` and the quality `auto` (`codex-rs/ext/image-generation/src/tool.rs`). The only option of the model is a transparent background. An edit takes up to 5 pictures.
3. The tool saves each picture as `$CODEX_HOME/generated_images/<session id>/<call id>.png` (`artifact.rs`, and `app-server/src/extensions.rs` for the root).
4. `codex exec --json` gives no event for a picture (`codex-rs/exec/src/event_processor_with_jsonl_output.rs`). The session id is the `thread_id` of `thread.started`, so the folder of the picture is known.
5. `codex exec --image <file>` attaches a picture to the request (`codex exec --help`).
6. The pricing page (https://developers.openai.com/codex/pricing, which now opens https://learn.chatgpt.com/docs/pricing) says: "Image generation counts toward the same general usage limits as local messages and cloud chats." A turn with a picture uses the limits 3 to 5 times faster. The Free plan has no picture generation. With an API key sign-in, API prices apply.
7. The same page lists "Codex SDK, codex exec, and scriptable workflows" for the Plus, Pro, Business, and Enterprise plans. The non-interactive page (https://learn.chatgpt.com/docs/non-interactive-mode) says that `codex exec` reuses the saved sign-in. The terms of use (https://openai.com/policies/terms-of-use/, in effect from 2026-01-01) forbid making an account available to others and extracting output programmatically. yumekit runs the program of the person, on the computer of the person, for that person, as a documented `codex exec` workflow. That this use is inside the terms is an inference. The owner can ask OpenAI to confirm it.
8. The text of a usage limit starts with "You’ve hit your usage limit" (`codex-rs/protocol/src/error.rs`). A limit of the picture tool reaches the model as "image generation failed: <message>".
9. Claude Code has no built-in way to make a picture, a sound, or a video (https://support.claude.com/en/articles/9002504-can-claude-produce-images, 2026-03-16). Cursor 2.4 can make a picture with Nano Banana Pro inside the editor (https://cursor.com/changelog/2-4, 2026-01-22). That page says nothing about the use of a plan or a key, and it describes no command line use. WP67 builds nothing for Claude Code or Cursor.

### How the server runs Codex

10. Each picture is one `codex exec --json --ephemeral` turn in a new temporary folder, with `--skip-git-repo-check`, `--ignore-user-config`, `--ignore-rules`, `--sandbox read-only`, `approval_policy="never"`, and `web_search="disabled"`. It turns off these features: `apps`, `plugins`, `shell_tool`, `unified_exec`, `computer_use`, `browser_use`, `browser_use_external`, `in_app_browser`, `hooks`, `multi_agent`, and `goals`. It turns on `image_generation`.
11. The real check found the limit of this: with `code_mode_host` off, the picture tool was not there, and Codex answered "The image generation tool is unavailable in this session". So `code_mode_host` stays on. The sandbox is read-only, the folder is empty, and no shell tool is there.
12. The project folder is never the working folder, and the request names no file of the project. A reference picture goes to Codex with `--image`.
13. The server reads the PNG of the thread, checks the PNG header and the size, and removes `generated_images/<thread id>` after each call. It never touches another folder of `CODEX_HOME`.
14. The time limit of a turn is 300 seconds. Then the server sends `SIGINT`, and `SIGKILL` 5 seconds later.

### Codex as the lead and as a picture service

15. A picture call during a chat request with Codex as the lead is a second Codex process. It has its own thread, keeps no session (`--ephemeral`), loads no `config.toml` (`--ignore-user-config`), and has its own temporary working folder. The brain uses `<project>/.yumekit/agent` and `resume` with its own thread id. The picture turn never resumes a thread.
16. The two processes share `CODEX_HOME` only for the sign-in. A copy of `auth.json` in another folder was rejected: a token refresh in the copy can end the sign-in of the original. Codex locks `auth.json` for this (`auth.json.lock`).
17. Both processes use the same plan. A picture uses the limits 3 to 5 times faster than a chat turn (item 6), so many pictures can stop the chat of the lead at a usage limit. The picker says that a picture uses the plan.

### Ready or not

18. The server has no key. It is ready when `check_key` passes: Codex is found, `codex login status` exits with 0 and says ChatGPT, and `codex features list` has `image_generation`. Each check is a local command of less than a second, and it makes no picture and no network request of yumekit.
19. A sign-in with an API key is not ready, with its own message. With an API key, each picture costs money on that key, and the spending limit of yumekit cannot see it.
20. The key health of WP64 now also checks a server with a description and no key that lists `check_key`. `MediaTools.run` runs this check before each call, with the 5 minute cache of WP64, so the order with no pick skips Codex when it is not installed or signed out.
21. Such a server has the new state `not-ready`. Its reason is `keyProblem` (`key_problem` on the wire), for example "Codex is not signed in. Open a terminal and run: codex login. Pick "Sign in with ChatGPT".". The picker shows "Not ready" and the reason. A pick of it still saves, because the person can fix the sign-in later.
22. A call that names a server that is not ready fails with `media-service-not-ready` and calls no tool, as `media-key-not-working` does for a key.

### The price and the order

23. The model has the price 0 for each picture. So the spending limit does not count it and the record of paid calls has no entry (WP64, item 6). The picker line says: "No key. Each picture uses your ChatGPT plan through the Codex program on this computer, so yumekit counts it as $0."
24. The order with no pick puts `codex` first, before `openai`. The choice was between first and after the services with a key. A person with Codex and a key pays nothing extra for a picture from Codex, and a person who wants another service picks it. A pick and a server in the call still win. The cost of this choice is item 17.
25. A usage limit is the failure `media-usage-limit-reached`. The server marks it with `_meta`, and the key health marks `codex` as not ready for 5 minutes with the message.
26. After a usage limit, a call with no pick and no server tries the order once more, so it reaches the next ready service. It does so only when the spending limit is above 0, because that next service can cost money. Its price passes the spending check of WP64. When the spending limit refuses it, the call returns the usage limit failure. A call with a pick or a named server does not try another service.

### Proof

27. The tests run a fake Codex program, as the tests of the brain adapters do: ready, not installed, signed out, an API key sign-in, no picture feature, a picture, a turn with no file, a file that is not a PNG, a picture of the wrong shape, a usage limit, a time limit, and two calls at the same time with their own threads and folders. The tests of `@yumekit/tools` use a fake server with no key for the order, the state `not-ready`, and the usage limit.
28. No test starts the real Codex. The test configuration sets `YUMEKIT_CODEX_PATH` to a path that does not exist, so the bundled server is never ready in a test.
29. The real check ran on 2026-11-24 on the computer of the owner, with Codex CLI 0.163.0 by its real path (`/opt/homebrew/Caskroom/codex/0.163.0/bin/codex`, not the shim of the terminal app), signed in with ChatGPT. It made 3 pictures:

    | Picture                                           | Seconds | File    | Size        |
    | ------------------------------------------------- | ------- | ------- | ----------- |
    | A red mug, landscape                              | 22      | 1.90 MB | 1672 x 941  |
    | The character sheet of the brief, landscape       | 47      | 1.76 MB | 1536 x 1024 |
    | His hand on the grip, with picture 2 as reference | 35      | 1.54 MB | 1536 x 1024 |

    The mug ran through a direct command with the same settings. Pictures 2 and 3 ran through the built server. The sheet has the same face, hair streak, coat, sash, and sandals in each view, with clean hands. The scar is on his right side in the front and side views and on his left side in the close up. The side view shows his right side with the sword in front of it, so the side of the sword is not clear. Picture 3 kept the colors, the grip wrap, the sash knot, and the line style of the sheet, with a hand of five clean fingers. Its arm comes from his left side, so it is likely his left hand, not the right hand of the request.
