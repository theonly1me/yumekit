# 15. Open steps, own files, and the choice of services

The owner used the Making screen with a real project. The person could only watch. The script, the pictures, the voice, and the music were not visible, and the person could not change them. The person could not pick the service that makes a picture or a voice. The person could not say if the video is drawn by code, made by a video model, or both.

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

Document 06 says that a call with no server uses `defaults`, then the first server that started with the capability. That gave the sample server for each kind. The new rule: with no default for a capability, the call uses the first server that has the capability and is ready, in the order `openai`, `gemini`, `fal`, each other server of the file, `local-voice` (document 18), `local-music` (document 19), and `sample` last. A server is ready when it started and each key that it needs is there. If no server is ready, the call fails with `media-key-missing` for the first of them, as before.

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
