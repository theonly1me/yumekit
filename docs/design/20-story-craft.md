# 20. Story craft: a film, not a row of pretty shots

On 2026-11-24 the lead agent made the first film with AI video: a girl with a lantern leaves her room, walks through a neon city, and then stands in a glowing forest. Each picture looked good. The owner called the film slop:

- "door knob is on the left side" then "but door opens from right and a new knob magically appears"
- "why is the girl walking into cyberpunk world? ... you made a kids story into a cyberpunk thing"
- "now suddenly she's in the forest - even here the scene / fireflies etc are just staticc not moving"
- "AI slop is always a character walking in some world, it is never a character doing actual meaningful things"
- "their fingers hands, movements etc everything should look NATURAL human like, we need to avoid the door knob bullshit again"

This document gives the lead agent the craft of a director: a story plan before any paid call, sheets that fix each person, place, and prop, one art direction for each picture and clip, continuity from shot to shot, a review of each clip with numbers, and a guide for video prompts. The bar of the owner: a film is a chain of meaningful actions with cause and effect, in a world that stays the same. A character that only walks through places is a failure. Hands, fingers, and motion look natural and human. An object never moves, doubles, or changes sides.

## What went wrong in the first film

The record of the run has the request, the chat with each tool call, the project with each prompt in the source record of its asset, and the three clips. The builder looked at each clip frame by frame with FFmpeg.

| Fault that the owner saw                                                                      | What the frames show                                                                                                                                                                                                                       | What in the prompt or the process permitted it                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The door knob is on the left, the door opens from the right, and a new knob appears           | The room clip, 1.5 to 2.5 seconds: the dark door with its knob on the left edge opens with a gap on the right edge. A light wooden door with a second knob takes its place. Behind it is a lit bedroom with a teddy bear, not the outside. | The prompt said "reaches for the half-open door and pulls it open; warm light spills in". It named no hinge side, no knob side, no material, and no space behind the door. The start picture showed the door half open, and the prompt asked to open it again. Nothing said which hand holds the lantern, so it moves from one hand to the other at 3.3 seconds |
| The clip does not start on its start picture                                                  | The first frame of each clip differs from its start picture: another framing, a lamp that was not there, the girl larger in the city and facing the camera in the forest                                                                   | Each call gave `first_frame_asset_id` and the same character sheet in `reference_asset_ids`. No one compared the first frame with the start picture, so the lead did not see it                                                                                                                                                                                 |
| A kids story turned into a cyberpunk city                                                     | Rain, neon, flying cars, and signs with fake letters                                                                                                                                                                                       | The request of the test asked for "a rain-soaked cyberpunk city". The lead copied it. It had no story question to ask: what does the girl want, why is she in this city, what changes. The city prompt also asked for "neon signs" and only "No readable text on signs" for the picture, so the clip drew unreadable letters                                    |
| She is suddenly in the forest, and the fireflies and the fog do not move                      | The forest clip moves only in its middle: the girl turns. The rest of the frame changes by 0.2 to 0.6 percent between frames (see "Details of WP65"). The orbit of the camera does not happen                                              | The prompt asked for "hundreds of tiny golden lights drift ... mist moves" as a list of things, not as motion in time with a cause (wind, her steps). It asked for an orbit, a walk, a look up, and drifting lights in 5 seconds. No shot before it explained how she got there                                                                                 |
| Each shot is a character walking in a world                                                   | Room: she opens a door. City: she walks away. Forest: she walks and looks up                                                                                                                                                               | The script was a list of places with a slogan for each: "the quiet room", "the rain-soaked cyberpunk city", "the glowing magical forest". No shot had a goal, an obstacle, or a result. No shot ended in a state that the next shot needed                                                                                                                      |
| The hands and the motion do not look natural                                                  | The lantern changes hands twice in 4 seconds in the room and in the forest. The hand that holds the stick changes its grip between frames                                                                                                  | The cast said "holding her round white paper lantern". It named no hand, no grip, and no rule that the lantern stays in that hand                                                                                                                                                                                                                               |
| The lead said "All three clips look right, and the girl and lantern hold from world to world" | Each fault above is visible on a sheet of 12 frames                                                                                                                                                                                        | The lead looked at one `preview_assets` sheet for each clip and had no list of what to check. It checked the face and the coat. No tool gave a number for motion, and no rule asked for a closer look at the hands, the door, or the first frame                                                                                                                |

The cause in one sentence: yumekit gave the lead tools for pictures and a cast of looks, but no place for a story, no fixed facts about the world, and no review that could fail a clip. So the lead made the default of a video model: a character that walks through pretty places.

## Decisions

| Id  | Decision                                                                                                                                                     | Why                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| C1  | A project can hold a story plan: a logline, what the main character wants, what stands against it, what changes, and a shot list                             | A paid clip of a shot with no purpose is lost money and slop                                          |
| C2  | A video clip of an `ai-video` or `mix` project, or of a project with a plan, names its shot, or the harness makes no call                                    | A rule in a text is not a guard. One free call to write the plan is cheap next to one paid clip       |
| C3  | A cast entry has fixed facts in words, and a kind `prop`. Each shot names its cast, and a call for a shot needs their sheets                                 | The model reads words and pictures. "Knob on the right, hinges on the left" must be in both           |
| C4  | The style of the bible is the art direction. The harness adds it to each picture and video prompt                                                            | Two shots cannot drift when the same words go into each prompt, and the lead cannot forget them       |
| C5  | A shot in the same place as the shot before starts from the end picture of that shot. The plan warns when a start state differs from the end state before it | The world stays the same across a cut                                                                 |
| C6  | Each clip of a shot gets a review: frames, measured motion, and a fixed list. A clip with no passed review cannot be placed                                  | An agent sees a pretty picture and says "looks right". Numbers and a list make it look for the faults |
| C7  | The lead reads a story guide with one tool call: the plan, the sheets, how to write a video prompt, and the review list                                      | The scene guide teaches code. A film needs a director's guide                                         |
| C8  | The person sees the plan: the logline and each shot with its start picture, its clip, and its review                                                         | The person judges the story before the money, and sees why a clip was made again                      |

The brief of this work package names these parts S1 to S8. C1 and C2 are S1, C3 is S2, C4 is S3, C5 is S4, C6 is S5, C7 is S6 and S7, and C8 is S8.

## The story plan (C1, C2)

- `bible.json` gets the optional `storyPlan`: `logline`, `want`, `obstacle`, `change`, and `shots`. The plan is part of the story, as the cast is, so it uses the edit `setBible` and is one undo step. A project with no plan does not change.
- A shot has:

| Field        | Meaning                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | The id of the shot, for example `strike`                                                                                                                     |
| `purpose`    | Why the film needs this shot                                                                                                                                 |
| `action`     | One action: a verb with its object, and what is different after it. "She strikes the red steel and the blade bends"                                          |
| `placeId`    | The cast entry of kind `place` where the shot happens                                                                                                        |
| `castIds`    | The persons and props in the shot                                                                                                                            |
| `camera`     | `size` (`wide`, `full`, `medium`, `close-up`, `extreme-close-up`), `angle` (`eye-level`, `low`, `high`, `overhead`), and `move` (a camera move id, optional) |
| `seconds`    | The length, 2 to 10                                                                                                                                          |
| `startState` | Where each person and each object is at the start: which hand holds what, which doors are open                                                               |
| `endState`   | The same facts at the end                                                                                                                                    |
| `inherits`   | What the next shot takes from this one                                                                                                                       |
| `reviews`    | The reviews of its clips (C6). The harness writes them                                                                                                       |

- The tool `set_story_plan` writes the whole plan. It keeps the reviews of each shot whose id stays. It refuses a shot id twice and a camera move that is not in the catalog. It gives warnings, and it never refuses a plan for a warning:
  1. A shot in the same place as the shot before has a start state that differs from the end state before it (C5).
  2. A shot has the same start state and end state: nothing changes.
  3. An action uses a verb of passage or of looking (walks, wanders, strolls, stands, looks around, gazes, explores, arrives) and no second verb joined by "and", "then", or "until".
  4. A shot before the last has an empty `inherits`.
  5. The plan has more than two places. One place and one unbroken idea read better than many worlds.
  6. A cast id or a place id of a shot that the cast does not have yet. The sheets come after the plan, so this is a warning.
- `get_work` gives the plan in the story part, and `put_work` does not change it.
- C2: `generate_asset` takes `shot_id`. A call with the capability `video` needs it when the video style is `ai-video` or `mix`, or when the project has a plan. Without a plan the failure is `story-plan-missing`; without `shot_id` it is `shot-not-named`; an unknown id is `shot-not-found`. Each hint names `set_story_plan` or the shot ids. A picture call can give `shot_id` too, for the start picture of a shot.
- Why this strict: a refused call costs one free tool call, and the hint says what to write. A clip with no shot costs money and gives the default of the model, which is the slop of the first film. In a `graphics` project with no plan, a clip that the person asks for still works with no plan, because the person decided it.
- With `shot_id`, the harness adds the place and the cast of the shot to `cast_ids`, and the camera move of the shot when the call gives none. The source record of the asset keeps `shot_id`, so the editor finds the start picture and the clip of each shot.

## Sheets for characters, places, and props (C3)

- `castKinds` gets `prop`: `person`, `place`, `product`, and `prop`. A product sells; a prop is an object of a story, such as a lantern or a sword.
- A cast entry gets the optional `facts`: a list of fixed facts in words, at most 24, each at most 200 characters. `put_cast_member` takes `facts`, and an entry that exists keeps its facts when the call gives none.
- The sentence of an entry in a prompt becomes `<name>: <description>. Fixed: <fact>; <fact>.` So each prompt repeats the facts in words.
- A person: age, build, hair, each garment and its colors, marks and their side, five fingers on each hand, which hand holds which prop and how. Its first reference picture is a sheet: front, side, back, and a close up of the face, in the style of the film. Its second picture shows the hands with the prop.
- A place: a wide establishing picture, and a floor plan in words: where the door is, which side its hinges and its knob are on, which way it opens, where the window and the light are, and what is on each wall.
- A prop: a picture from two sides, and its facts: size, material, colors, and how a hand holds it.
- A call with `shot_id` needs a sheet for the place and for each entry of the shot: at least one reference picture and at least one fact. Otherwise it fails with `cast-sheet-missing`, which names each entry and what it lacks. A call that makes a sheet names no shot, so it passes.

## One style for the film (C4)

- The style of the bible (`set_bible` `style`) is the art direction: the medium, the line, the color, the light, the lens, and what never appears. The description of `set_bible` says so.
- The harness adds `Art direction: <style>` after the prompt of each picture and video call, before the sentences of the cast and the camera move. The source record keeps the prompt with it, so a change of the style makes a new file. A project with an empty style gets nothing.
- The look of the project stays the look of the scenes drawn by code. The art direction is for the media models. Step 5 of the server instructions no longer asks the lead to copy the style by hand.

## Continuity between shots (C5)

- `set_story_plan` warns when a shot in the same place as the shot before starts in another state (warning 1).
- A kept review saves the picture at the end of the kept part of the clip as an image asset `<clip id>-end` (C6). The shot keeps its id as `endPictureAssetId` of the review.
- A call with `shot_id` for the next shot in the same place, when the shot before has an end picture, must use it: as `first_frame_asset_id`, in `reference_asset_ids`, or through a first picture that was made with it as a reference. Otherwise the failure is `continuity-picture-missing` with the id of the end picture. A cut to another angle of the same place makes a start picture with the end picture as a reference.

## The review of a clip (C6)

- The tool `review_clip` takes `asset_id`, `shot_id`, and `count?` (frames on the sheet, 12 by default). It gives the frame sheet of `preview_assets`, the measures of motion, the warnings, and the fixed list of checks with the action and the end state of the shot. It changes nothing.
- With `verdict`, the same call stores the review in the shot: `keep`, `cut` (with `keep_from_seconds` and `keep_to_seconds`), or `redo`, with `faults`, the list of what failed. `keep` and `cut` save the end picture (C5). `keep` and `cut` need a call with no verdict for the same clip and shot first, in the same session, or the failure is `clip-not-shown`.
- The measures come from FFmpeg: the clip at 8 frames a second, at 160 by 90 pixels in gray. For each step from one frame to the next, the measure finds the camera shift and zoom that fit best, and what still differs after it is the motion in the world. It gives:
  - `motion`: the mean change of the whole frame in percent, with the camera.
  - `world_motion`: the mean change after the camera move, in percent.
  - `camera_motion`: the mean shift of the camera in percent of the width each second.
  - `regions`: the world motion of each part of a 3 by 3 grid.
  - `start_difference`: the mean difference of the first frame and the start picture of the call, and the largest difference of a part.
- The warnings: `almost-still` (the world hardly moves), `only-camera-moves` (the frame moves, the world does not), `still-background` (5 or more of the 9 parts hardly move), `hard-jump` (one step changes far more than the rest of the clip), `sudden-change` (one part changes far more in one step than in the rest of the clip: a limb or an object that morphs, a door, or a light), and `does-not-start-on-the-start-picture`. "Details of WP65" gives the limits and the values on the first film.
- The fixed list:
  1. Story: the planned action happened and completed. The end state equals the plan.
  2. Objects: each object keeps its place, its side, and its count: doors, knobs, hinges, windows, props. Nothing appears from nothing or leaves for no reason.
  3. Body and motion, on the frames and on a closer look at each hand and each face at three or more times (`preview_assets` with a region): five fingers on each hand with a natural shape, no merged or extra limbs, the grip on the prop stays in the same hand and does not pass through it, joints bend as a body bends, feet touch the ground and do not slide, weight and balance are believable, cloth and hair follow the move, the face keeps its features, and an action has a start, a contact, and a follow-through.
  4. The character matches the sheet: face, hair, each garment, the side of each mark.
  5. The world is alive: something moves in the background (wind, rain, sparks, cloth, hair, dust), unless the plan asks for stillness.
  6. No writing that a person cannot read, unless the plan gives exact text.
- A clip that fails is cut to its good part, or made again with a prompt that names the fault, inside the limits. `place_video` refuses a clip of a shot with no `keep` or `cut` review, with `clip-not-reviewed`, and a clip whose review says `redo`, with `clip-failed-review`.

## How to write a video prompt (C7)

- The tool `get_story_guide` gives the guide as text, as `get_scene_guide` does for code. Its parts: the plan, the sheets, the order of work, how to write a picture prompt and a video prompt, natural motion, the review, and the faults of the first film as worked examples with the corrected prompt.
- A video prompt has: the action in time order with its beats in seconds; the body mechanics of the action in order, with the hand and the grip; the physics that must hold (weight, contact, follow-through); the things that must not change, by name and side; the camera of the shot; what moves in the background, with its cause; and no writing, unless the plan gives exact text. One action in one clip. A medium shot with one clear action beats a busy wide shot with many small hands. Keep hands large in the frame or out of it.
- A fast fight is the hardest case: plan it as short shots, each with one strike and one result, and let the cut carry the speed.
- "Details of WP65" lists the official guides that the builder read, with their links, and what each model takes: a first picture, a last picture, reference pictures, and a negative prompt.

## The instructions (C7)

- The instructions of the AI get rules for a story or a video with AI video: write the plan first, then the sheets, then the start pictures, then the clips; review each clip; place only a passed clip. They state the bar of the owner in plain words.
- The server instructions get the same order in step 6, and name `set_story_plan`, `get_story_guide`, and `review_clip`.

## The person sees the plan (C8)

- The editor has the view "The story", from the top bar ("Story") and from the Making screen. The Making screen shows the step "Plan the story" first when the project has a plan, so the plan first of document 16 shows the plan with the script and the pictures.
- The view shows the logline, the three lines (what the character wants, what stands against it, what changes), and one row for each shot: its number, its purpose, its action, its place, the camera in words, its length, the start state and the end state, the start picture, "Play" for the clip, and the review in plain words ("Kept", "Kept from 0.5 to 3.0 seconds", "Made again: the door changes sides"), with the warnings of the measures.
- With no plan, the view says what a plan is and that the AI writes one before a video clip.
- The view uses the patterns of the Files view and the Cast view. It has no new visual design.

## Work package

| Id   | Scope                                                                                                                   | Needs      |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| WP65 | The plan and its tool, the sheets, the art direction, continuity, the review, the guide, the instructions, and the view | WP62, WP63 |

### Checks

1. `set_story_plan` stores a plan as one undo step and gives each warning of C1 and C5 for a plan made to trigger it. A video call with no plan, with no shot, and with an unknown shot fails with its kind, in an `ai-video` project, and calls no media tool.
2. A shot call with a cast entry that has no facts or no picture fails with `cast-sheet-missing`. A picture call sends the art direction and the facts of the cast and the place to the media server.
3. The measure on clips made with FFmpeg: a still gives `almost-still`, a pan of a still gives `only-camera-moves`, a moving square in one part gives motion in that part only, and a cut in the middle gives `hard-jump`.
4. A clip of a shot with no review cannot be placed. A `keep` review saves the end picture, and the next shot in the same place fails until it uses it.
5. The review on the three clips of the first film flags the still forest and the start pictures, and the document says what it cannot catch.
6. A cheap real check with the cheap model: the room clip, a place sheet of the room in words, and at most 2 requests. The answer is recorded.
7. Screenshots of the view in dark and in light, at 1440 pixels and at the width of a phone.

## Not in this version

- A check of the plan by a second agent.
- A measure of hands and faces by a model. The measure counts change, not fingers.
- A story plan for a video with no AI video. Graphics films keep their own path.

## Details of WP65

These facts and choices came from the build of WP65 on 2026-11-24.

### The parts

1. The harness has 61 tools: `get_story_guide`, `set_story_plan`, and `review_clip` are new. The project has no new edit kind: the plan, the reviews, and the facts go through `setBible`, and the end picture through `addAsset`.
2. `set_story_plan` takes the shots in snake case (`shot_id`, `place_id`, `cast_ids`, `camera_size`, `camera_angle`, `camera_move?`, `seconds`, `start_state`, `end_state`, `inherits`). `camera_move` is an id of the catalog of document 16. A shot is 2 to 10 seconds. A plan has 1 to 40 shots.
3. Two states are equal when they are equal in lower case with no punctuation and single spaces. The warning of a walk needs no second verb, so "she walks to the anvil and strikes the steel" passes and "she walks through the neon city" warns. This is a word test, not a reading of the sentence, so it is a warning and not a failure.
4. `set_bible` keeps the plan. It now also keeps the cast when the call gives no `cast`, and an entry with the same id keeps its facts. Before, a `set_bible` with no cast removed the whole cast, so a change of the art direction after the sheets lost them.
5. The art direction is `Art direction: <style>.` after an empty line at the end of the prompt, before the sentences of the cast. The sentence of a cast entry is `<name>: <description>. Fixed: <fact>; <fact>.`
6. A call with `shot_id` puts the place first in `cast_ids`, then the cast of the shot, then the ids of the call, with no repeats. So the place sheet is the first reference picture.
7. The end picture is a PNG at the end of the kept part, or the last picture of the clip for `keep`, with the id `<clip id>-end` (then `-end-2` and so on). Its source is the tool record `{ server: "yumekit", tool: "save_end_picture", input: { video_asset_id, seconds? } }`, so the Files view says "Made with yumekit". Its label is "End of <label of the clip>".
8. A review is stored for each clip of a shot. A new review of the same clip replaces the old one. The measures stored with it are the mean motion, the world motion, the camera motion, the start difference, and the kinds of the warnings, so the editor shows plain words and never the text for the AI.
9. `place_video` reads `shot_id` from the source record of the clip. A clip with no `shot_id`, or a shot that is not in the plan any more, is not checked. `put_scene` and `put_work` with a `video-clip` scene are not checked: the instructions send each clip through `place_video`.
10. A cast id of the plan that a removed cast entry leaves behind, and a review of a removed clip, stay in the plan. The rules of the store do not check them, so the removal of an asset or an entry never fails because of the plan. The view shows the place as "A place that is not in the cast yet", and a missing clip as "No clip yet".
11. `get_work` gives the facts of each cast entry, and the plan in the story part: each shot with its place, cast, camera, states, what it gives the next shot, and its reviews.
12. The helpers of K10 do not get the three new tools. A helper makes one picture or one scene from the brief of the lead, and the lead keeps the plan and the review.
13. The instructions of the AI get rules 34 and 35, after the rules 32 and 33 of the spending limit (WP64). Document 12 lists all four.
14. The editor loads the Story view as its own file, as the Script view, so the main file of the build stays under 500 kB (498 kB with this change).
15. The Making screen shows "Plan the story" first, done, with the count of the shots, when the project has a plan. It opens the Story view.
16. The start picture of a shot is the first picture of its clip, or else the last picture made with its `shot_id`. With neither, the view shows the end picture of the kept part. "Play" loads the clip only on a click, as in the Files view.

### The measure

17. The measure reads the clip with FFmpeg at 8 frames each second, scaled to 160 by 90 pixels in gray, and softens each picture with a 3 by 3 box. For each step, it tries each shift of up to 4 pixels with no zoom, then the zooms 0.97 to 1.03 around the best shift. Motion is the mean absolute change in percent of full scale. The world motion is the change after the best shift and zoom. A zoom that is not in the list and a rotation stay in the world motion.
18. The limits, in percent of full scale in a step of 1/8 second: `almost-still` when the motion is under 0.3 and no part moves 0.6 or more; `only-camera-moves` when the camera moves 0.5 percent of the width each second or more and the world motion is under 0.3 or under a quarter of the motion; `still-background` when 5 or more of the 9 parts move under 0.6; `hard-jump` when a step changes more than 6 and more than 4 times the median step; `sudden-change` when a part changes more than 4 and more than 3 times its own median in one step, and more than twice the step before, outside a hard jump; `does-not-start-on-the-start-picture` when the first frame differs from the start picture by more than 3 on the whole, or by more than 6 in one part.
19. The tests make each case with FFmpeg from a detailed picture: a still gives `almost-still`, a pan of a still gives `only-camera-moves` with a camera motion of 6.3 (the pan moves 20 pixels a second in a 320 pixel picture, 6.25 percent), a moving square gives motion only in the top left part and `still-background`, a cut gives `hard-jump` between 1.5 and 1.75 seconds, and a clip that starts on its picture differs by less than 1.
20. The three clips of the first film, in a temporary project, with `review_clip` (0.5 to 0.7 seconds each on a MacBook with an M3 Max):

| Clip   | Motion | World | Camera, percent of width a second | Parts (top left to bottom right)                     | Warnings                                                                     |
| ------ | ------ | ----- | --------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Room   | 2.08   | 2.01  | 3.71                              | 1.28, 2.87, 1.93, 1.18, 3.72, 1.70, 0.62, 2.97, 1.23 | `sudden-change` top at 2.75 s, top right and right at 2.13 s                 |
| City   | 1.67   | 1.23  | 2.66                              | 1.08, 1.10, 0.99, 1.12, 1.87, 1.09, 1.10, 1.49, 1.05 | None                                                                         |
| Forest | 0.42   | 0.42  | 0                                 | 0.19, 0.32, 0.20, 0.22, 1.29, 0.24, 0.21, 0.73, 0.13 | `still-background`: 7 of 9 parts hardly move, only the middle and the bottom |

21. The start difference of the same clips against their start pictures, measured with the same function before the import (an import has no `first_frame_asset_id`): room 9.44 on the whole and 15.52 in one part, city 5.86 and 17.89, forest 2.84 and 6.75. All three warn, and a look confirms each: the room clip starts on another framing with a lamp that the picture does not have, the girl is larger in the city, and she faces the camera in the forest.
22. What the measure catches on the first film: the still forest (the fault that the owner named), the three clips that do not start on their pictures, and the two moments of the room where the door and the girl change (2.13 and 2.75 seconds). The sudden change does not fire on the city with its rain, on the forest, or on the synthetic clips with smooth motion. It is a sign to look closer, not a proof: a door that opens and a light that turns on fire it too.
23. What the measure cannot catch: the side of a knob, a count of fingers, a hand that changes the prop, a face that changes, fake writing, and a story that does not happen. These need eyes. The check list, the facts of the sheets, and a closer look with `preview_assets` and a region are for them.
24. A sudden change of shape is reported as a change of a part, not as a shape. A real shape measure needs the outline of each object, which a picture of 160 by 90 pixels does not give. On the three clips the part measure was stable, so the warning ships.

### The cheap real check

25. One request to Claude Code 2.1.331 with `ANTHROPIC_MODEL=haiku` (the model `claude-haiku-5-5`), no media key, a temporary configuration folder, and the yumekit server of this branch over `yumekit mcp`: "Check the video clip of the room shot (the clip room-clip, shot room) against the place sheet of the bedroom. Make nothing new. Tell me each fault you find, with its time, and record your verdict." The project held the three clips and stills of the first film, the place sheet "The bedroom" with three facts (the door on the right wall with its hinges on the right edge and its knob on the left edge, the dark hallway behind it, the window), and a plan with the shot "She opens the door with her right hand and steps into the hallway". The run took 27 seconds and cost 0.017 US dollars.
26. The AI called `get_work`, `get_project`, `list_assets`, `get_work` with the story, `preview_assets` with the clip and the still, and `preview_assets` again with two regions (the door from 2.2 to 2.9 seconds, and the right side from 3.4 to 4 seconds). It then gave `redo` with three faults:
    - "From 2.3 seconds to the end, behind the opened door there is a lit room with a teddy bear on a small stool and a wooden floor. The place sheet says the dark hallway is behind the door, not another room."
    - "From 2.2 to 2.7 seconds, the hinge side and the brass knob of the door look swapped or unclear. The place sheet says the hinges are on the right edge and the knob on the left edge."
    - "The girl's face and hair look different between the start (0 to 1.7 seconds) and the end (3.0 to 4.0 seconds), so she does not look like the same character."
27. So the cheap model found the knob fault with the floor plan in words and a closer look, said that it was less sure of it, and found two more faults. It went to the verdict without the call with no verdict. That is why `keep` and `cut` now need that call first (`clip-not-shown`). A `redo` stays possible at once, because it spends nothing.

### Primary sources

28. The builder had these pages read on 2026-11-24. Each fact of the guide in the tool comes from them. Where a page has no date, the table says so.

| Model                         | Page                                                                                                   | Date on the page  | First, last, reference pictures; negative prompt                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------- |
| Gemini Omni Flash 1.2         | `aistudio.google.com/docs/omni`                                                                        | None              | First and last as two input images (3 to 10 s), up to 6 reference images; no field |
| Gemini Omni Flash 1.2 and Veo | `docs.cloud.google.com/vertex-ai/generative-ai/docs/video/video-gen-prompt-guide`                      | 2026-11-20        | Negative prompt as plain nouns, not "no" or "don't"                                |
| Kling 4                       | `fal.ai/learn/devs/kling-4-prompting-guide` and `fal.ai/learn/devs/kling-4-0-vs-kling-3-0`             | 2026-10-21, 11-03 | Start and end frame, up to 10 keyframes; no negative field                         |
| Seedance 2.0 and 2.5          | `fal.ai/learn/tools/seedance-2-0-prompting-guide` and `fal.ai/learn/devs/seedance-2-5-prompting-guide` | 2026-06-18, 08-07 | Start and end image, up to 30 reference images in 2.5                              |
| Wan 3                         | `fal.ai/learn/tools/how-to-use-wan-3`                                                                  | 2026-08-25        | Start and end image, up to 10 reference images; prompt expansion on by default     |
| LTX 2.5                       | `ltx.io/blog/ltx-2-5-prompt-guide`                                                                     | 2026-08-10        | First frame; exact text not certain                                                |
| MiniMax H3                    | `huggingface.co/MiniMaxAI/MiniMax-H3`, `docs/VIDEO_PROMPT_WRITING_GUIDE_base_en.md`                    | 2026-11-24        | First, last, or both; 9 reference images in the reference mode                     |
| Nano Banana 2.1               | `aistudio.google.com/docs/image-generation`                                                            | None              | Up to 14 reference images; negatives as positive words ("an empty street")         |
| Seedream 5.5                  | `ai.byteplus.com/lumina/en/image/how-to-use-seedream-5-5`                                              | 2026-11-09        | Up to 10 reference images; exact text in quotes                                    |

29. The facts that shaped the guide:
    - Omni makes several shots by default. One shot needs "In a single continuous shot" or "No scene cuts". The guide starts each video prompt with "A single continuous shot, no scene cuts." This is an inference for the first film: its prompts did not say it, and each clip started on another framing than its picture.
    - Timed beats such as "[0-5s] ... [5-10s] ..." guide Omni, Kling, and Seedance, but the times are not exact.
    - Seedance 2.5 asks for cause and effect as separate actions (contact, the movement that follows, then the reaction), for approach, contact, transfer of force, and recovery in sports and fights, and for the direction of a force on cloth, hair, smoke, and particles.
    - Seedance 2.5 says that one small movement over a long clip turns into waiting, repetition, or slow motion, and Kling 4 says to remove an event when a scene feels rushed.
    - Kling 4 lists hands that pass through objects, the shape of a product that drifts, and a face that drifts when the head turns as risks, and asks for one simple action in a shot. It uses "Keep the finger movements deliberate and readable" and "prevent objects from multiplying" in its examples.
    - Omni writes readable text when the prompt gives the words. Kling 4 and Seedream 5.5 ask for the exact words in quotes with their place. LTX says that exact text is not certain.
    - No page names a known failure of hands or of morphing in general. The motion rules of the guide come from the owner's list and from the body mechanics above.

## What went wrong in the second film

On 2026-11-24 the lead agent made a 30 second anime trailer with the story work of WP65: a plan of 8 shots, 6 sheets, 9 clips, and a review of each clip. A second agent then looked at the frames and found what the reviews of the lead missed. The owner watched the film and judged it. The builder of WP66 read the record (the chat, the plan, the reviews, each prompt, the 9 clips) and looked at each clip at 8 frames each second.

| Fault                                                       | What the frames show (clip time)                                                                                                                                                                                                              | What the lead stored                               | What permitted it                                                                                                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two swords in the key shot                                  | `first-wave`, 0.75 s to the end: the bare sword is in his right hand, and a sheathed sword with its own hilt stays at his waist                                                                                                               | `keep`, no faults, with `hard-jump` x8             | The sword sheet drew the sword twice: sheathed on top, bare below. The model then drew both. The lead reviewed its own clip and wrote no answer to the warnings |
| The hero fuses with the giant                               | `split`, 1.0 to 1.4 s: his body and the body of the giant are one shape, with shared legs                                                                                                                                                     | `keep`, no faults                                  | The lead judged its own work, and the list had no count of bodies                                                                                               |
| The mask doubles                                            | `split`, 1.75 to 2.25 s: two whole masks side by side, not two halves                                                                                                                                                                         | `keep`, no faults                                  | The same                                                                                                                                                        |
| The giant is not a giant, and the lair never shows          | `split`: the first frame shows a demon of his own size (the start picture showed one three times his height). At the end there is forest, no arched lair                                                                                      | `keep`                                             | No one compared the first frame with the start picture, and no one checked the end state                                                                        |
| The ring "rushes" but stands frozen                         | `whirlpool`, 0 to 1.6 s: eight demons do not move                                                                                                                                                                                             | `keep`, no faults                                  | The lead read "the ring rushes" in its own prompt and saw it                                                                                                    |
| The view melts                                              | `whirlpool`, 1.9 to 2.4 s: the overhead view turns into an eye level view with no cut                                                                                                                                                         | `keep`; the answer called it "a fast camera swoop" | The list had no rule for one camera in one clip                                                                                                                 |
| The throne vanishes, and the lord gains feet and grows      | `lord-rises`, 2.5 to 2.9 s: the throne is gone when he stands, his robe gets feet, and he is larger                                                                                                                                           | `keep`, no faults                                  | No count of objects, no fact for scale or feet                                                                                                                  |
| Six planned end states never happen                         | `wake`: no steel shows. `leap-2`: the demons never reach him. `split`: no lair. `lord-rises`: he never steps in. `guard`: the sword is upright before his face, not a high guard. `lord-answers`: he lifts his left hand, the plan says right | `keep` or `cut` for each                           | The list asked "did the action happen", and the maker answered yes                                                                                              |
| "does not start on the start picture" fired on 8 of 9 clips | See "Details of WP66": the pixel difference of a matching first frame and of a different shot of the same forest are in the same range                                                                                                        | Ignored on each clip                               | A warning that fires on almost every clip teaches the reader to ignore warnings                                                                                 |
| The scar side                                               | The hero sheet draws the scar on his right cheek. The facts say left                                                                                                                                                                          | The sheet was used                                 | No one checked a sheet against its facts                                                                                                                        |
| The end card                                                | The kit `command` scene in the default look, with "$ " before the command                                                                                                                                                                     | "No other text on screen"                          | The film had no own colors or font for the kit, and the scene always drew a prompt sign                                                                         |
| The final answer                                            | "The full check shows no warnings", "every shot passes"                                                                                                                                                                                       |                                                    | The instructions did not ask for the clips that were cut, made again, or kept with faults                                                                       |

The owner's verdict on the same film, in his words: "the music is very very meh", "the musiic needs to start normal and needs to scale as the fhights are happening", "scene cut from this to this isn't cohesive" (a medium shot of the hero, then a wide shot with three demons high in the trees), "then in the next scene they are here", "he attacked one demon and all died, wave isn't coming from his sword, it is just coming on the ground", "then more demons came, but from where?", "why do all demons look the same?", "his attacks don't connect to the demons, he's just waving sword n the air and they're dying", "scene and background changed which make no sense", "bad guy hgas no feet ... then when he stands he magically gets feet and also scales up", "ensure they [the effects] come from HIM and his sword, not at random places", "the vllian doesn't look strong ... his antlers and the forest setting makes them look like a joke", and "he doesn't need to fight 10 demons at once, he can fitght just one or two, point is to make those fights look epic".

The cause in one sentence: the maker judged its own clips, so the review confirmed the prompt and not the frames; and the plan held text that no tool could check, so space, cause, scale, and music had no guard.

## Decisions of WP66

| Id  | Decision                                                                                                                                                                                                  | Why                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| C9  | The verdict of a clip comes from an independent critic: one fresh turn of the agent program that sees only the frames, the measures, the shot, the sheets, and the fixed list. The lead stores no verdict | A maker who reads its own prompt sees the prompt in the frames                     |
| C10 | Each measured warning gets an answer from the critic: a fault, or a named harmless cause, with its time. A keep with an unanswered warning is refused                                                     | `hard-jump` x8 stood next to a keep with no faults                                 |
| C11 | The start difference is a number. It warns only for another picture. The critic compares the first frame with the start picture side by side                                                              | On these clips the pixel measure cannot tell a redrawn line from a changed scene   |
| C12 | A sheet gets the same independent look before a shot uses it: `review_sheet`                                                                                                                              | The sword sheet drew two swords, and the film had two swords                       |
| C13 | The states of a shot are a list with one entry for each person and prop: where, the side of the screen, which way it faces, who holds it in which hand, its state, and where it enters from               | One text for two characters dodged the checks, and space broke across the cuts     |
| C14 | A shot in the same place as the shot before can be made only after the shot before is kept, from its end picture                                                                                          | Every start picture was made before any clip, so the guard checked nothing         |
| C15 | Each shot has a size, an angle, a lens, and a move. The plan warns about repeated framing, a first shot that does not start inside an action, and a fight with no close strike                            | Most shots were centered wide shots of a man who faces the camera                  |
| C16 | A strike names its target, the point of contact, the reaction, and the source and path of its effect. The plan warns about a fight shot with more than two opponents                                      | "he's just waving sword n the air and they're dying"                               |
| C17 | Each opponent is a designed cast member. Height against the hero and feet are facts, checked on each clip                                                                                                 | "why do all demons look the same?", "bad guy has no feet"                          |
| C18 | One clip has one camera: a new viewpoint or background with no planned cut is a fault                                                                                                                     | "scene and background changed which make no sense"                                 |
| C19 | The plan has a music map, the music prompt follows it, and `check_music` measures each candidate against it and picks the part of the track that fits                                                     | "The musiic needs to start normal and needs to scale as the fhights are happening" |
| C20 | The final answer about a story video counts the clips kept, cut, and made again, and names each fault that the critic left in the film and each planned thing that did not happen                         | "every shot passes" was false                                                      |
| C21 | The end card of a story film uses the colors and the font of the film, and the `command` scene draws no prompt sign unless the person asks                                                                | The card added "$ " and the default look                                           |

## The critic (C9, C10, C11)

- `review_clip` takes `asset_id` and `shot_id`, and no verdict. It measures the clip, opens a job, and asks the critic. The critic is one turn of the agent program of the person, the mechanism of `ask_helper`: its own short session, no memory of the making, and the server command of the lead with `--helper <token>`. The engine knows the token as a critic token.
- The critic gets only: the shot (its action, the start and end entries, the strikes, the camera), the facts of each cast entry of the shot, the measured warnings with their times, and the fixed list. It never sees the prompt of the clip or an opinion of the lead.
- The critic has two tools and no others. `view_for_review` with no input shows the clip at 8 frames each second as sheets of 12 frames (1.5 seconds each), the start picture next to the first frame, the end picture of the shot before (for the match across the cut), and each sheet picture of the cast. With `region`, `from_seconds`, and `to_seconds`, it shows a closer look. `give_clip_review` stores the answer of the critic in the job.
- The answer has: an entry for each item of the list with what the critic saw and when; a count for each object that the facts count (swords, hands, fingers, masks, eyes, bodies), with the expected and the seen number; for the action and for each end entry, happened or not, with the time; the match of the first frame with the start picture, and with the end picture of the shot before; an answer for each measured warning (a fault, or a named harmless cause such as a drawn flash or a planned cut); the verdict `keep`, `cut` with the clean range, or `redo`; and the faults.
- `give_clip_review` refuses an answer that is not whole: an item of the list with no answer, a warning with no answer, a keep with a fault, a warning answered as a fault, a count that differs, an action or an end entry that did not happen, or a first frame that does not match. A cut must hold the action and the end, and each warning inside the cut must be harmless. The critic then corrects its answer in the same turn.
- `review_clip` stores the review of the critic with `by: "critic"`. The lead cannot overrule a redo: `place_video` accepts only a keep or a cut by the critic, and refuses a redo with `clip-failed-review`. For a cut, the clean range of the critic is stored, and the lead places that part (see "Details of WP66" for what is not enforced yet).
- With no agent program, or outside the engine, the review fails closed with `no-critic`. Outside a chat request, only a call of the person (from the editor) starts a critic; a call of an agent with no chat request gets `no-critic`. A critic turn that fails, stops, or gives no answer fails with `critic-failed`. One critic runs at a time. A second review waits for the first.
- The critic instructions make it a strict viewer who hates AI slop, with the owner's bar in his words, and say that its job is to find faults.
- C11: the start difference stays a measured number. `does-not-start-on-the-start-picture` fires only when the first frame is another picture (a whole difference over 10). The critic answers the match on the side by side picture.

## The fixed list of WP66

1. Story: the planned action happens and completes, with its time. Each end entry holds: happened, or not, with the time.
2. Objects: each object keeps its place, its side, and its count. Count what the facts count. Nothing appears from nothing or leaves for no reason.
3. Bodies: count the bodies, the heads, the arms, the hands, the fingers. No two bodies fuse. Each figure keeps its height against the hero and its feet for the whole clip.
4. Hands and grip: five fingers with a natural shape. The grip stays in the planned hand and does not pass through the prop.
5. Motion: joints bend as a body bends, feet touch the ground, weight and balance hold, cloth and hair follow, and a motion that the plan asks for happens (a group that "rushes" moves).
6. Contact and cause: each strike reaches its target at the planned point, and that target reacts. An effect starts at its source (the blade, the hand) and travels on its path to the target. An effect that appears on the ground or at a random place is a fault. Nothing falls that nothing touched.
7. One camera: the viewpoint, the place, and the background stay one shot. An overhead view that turns into an eye level view with no cut is a fault, not a camera swoop.
8. The cut: the first frame matches the start picture, and the screen side and facing of each character match the end of the shot before.
9. The sheets: face, hair, each garment, the side of each mark, as the facts say.
10. A living world and no unreadable writing.

## Sheets reviewed (C12, C17)

- `review_sheet` takes `cast_id`. The critic sees each reference picture of the entry and its facts, and answers with `give_sheet_review`: `pass` or `fail`, the counts, and the faults. The review is stored on the cast entry with the ids of the pictures it saw.
- The sheet list: a prop shows ONE object (two states of a prop are two entries, or one picture that the facts name as two views of one object, with a rule for where the scabbard is when the blade is out); a person agrees with each fact (the side of a scar, the hand, the fingers); the full body shows the feet and the height against the hero that the facts give; an opponent has its own design and personality (build, face, clothes, weapon, the way it moves and fights), not a copy of another entry; a villain shows the threat that its facts name (scale, stillness, what he does to the space around him), and a design that reads as weak or silly is a fault.
- A call with `shot_id` needs a passed sheet review of the place and of each entry of the shot, on its current pictures: `sheet-not-reviewed`, or `sheet-failed-review` with the faults. A person who holds a prop in a state of the plan needs a second picture, the hands with the prop: `cast-sheet-missing` names it.

## States you can check (C13, C14)

- `start_state` and `end_state` of `set_story_plan` are lists. Each entry: `cast_id`, `count` (1 by default; more is a uniform group), `where` (the place in the world, in words), `screen` (`left`, `center`, `right`, or `off`), `facing` (`camera`, `away`, `left`, `right`), `held_by` (a person and a hand: `left`, `right`, or `both`), `state` (in words), and `enters_from` (where it waited, or how it enters).
- The plan refuses a shot whose states do not have one entry for each person and prop of the shot, and an entry for an id that the shot does not name.
- Warnings: an entry that changes its `where`, `screen`, `facing`, holder, or hand between the end of a shot and the start of the next shot in the same place; a character that first shows after the first shot with no `enters_from`; a group whose count rises with no `enters_from`.
- C14: a call with `shot_id` for a shot in the same place as the shot before fails with `previous-shot-not-kept` until the shot before has a kept or cut review by the critic. With it, the continuity rule of C5 applies. A start picture made early, without `shot_id`, cannot dodge it: the clip call checks that its first picture was made with the end picture.
- A plan written by WP65 keeps its states as text. It loads, shows, and works as before, and the next `set_story_plan` writes lists.

## Direction (C15, C16, C18)

- The camera of a shot: `camera_size` (`extreme-close-up` to `wide`), `camera_angle` (`eye-level`, `low`, `high`, `overhead`, `over-the-shoulder`), `camera_lens` (`wide`, `normal`, `long`), and `camera_move`.
- A shot can have `strikes`: each with `by`, `target`, `contact` (where the blow lands), `reaction` (what that target does), and an optional `effect` with `kind`, `source`, and `path`.
- Warnings: more than two shots in a row with the same size and angle; a first shot whose action walks, stands, or looks; an action with a verb of a strike and no `strikes`; a fight with no close up or extreme close up of a strike; a fight shot with more than two opponents (the count of the entries of the targets); a strike whose effect has no source.
- The story guide gets "Staging a fight for a trailer": start late in the action, cut on the strike, close on the eyes and the blade, a low angle for power, let the cut carry the speed, one or two opponents, each with its own design, place, attack, and reaction, and the rule of S6 that each clip holds one action.

## Music that follows the film (C19)

- Each shot of the plan has `music_intensity` (1 quiet to 5 the peak) and `music_hits`, the seconds inside the shot that the music marks (a strike, a cut). The plan can have `music_end_intensity` for the end card.
- `set_story_plan` returns the music map as a cue sheet in film seconds. The story guide has "Writing a music prompt": the instruments, the key and the mode, the tempo in beats each minute, the structure by seconds, how it starts, where it rises and peaks, the hits with their times, silence before a hit, how it ends, and "Instrumental only". It cites the official guides (see "Details of WP66").
- `check_music` takes `asset_id`. It measures the loudness and the energy over 2 kHz of the track each half second, finds the start in the track whose curve fits the map best, and gives the fit, the best start, and warnings: the start is at full level, the curve does not rise where the map rises, the peak is not near the planned peak, or the loudest part falls under the end card. It stores the check in the plan.
- `replace_music` takes `start_seconds`, the part of the track to start from.
- Taste is not a measure. When a candidate is cheap, the lead makes two or three, checks each, and places the best fit. The Music view lists the checked candidates with their fit, and the person picks by ear with "Use this".
- What the check can judge: where the music is loud and bright against where the plan wants intensity. What it cannot judge: if the music is good, if a hit lands on the frame, the instruments, and the mood. The agent cannot hear. The owner judges by ear.

## Honest final answers (C20) and the end card (C21)

- Rule 36 of the instructions of the AI: a final answer about a story video gives the count of clips kept, cut, and made again, each fault that the critic recorded and that stays in the film, and each planned thing that did not happen. It never says that every shot passes when a fault stays.
- Rule 37: the end card of a story film uses the colors of the art direction (`set_look` with `colors`) and a fitting font, and shows only the words that the person asked for.
- The kit scene `command` takes `prompt`, the sign before the command. With no `prompt`, it draws none.

## The person sees the critic

- The Story view shows, for each shot, the review of the critic in plain words with each fault and its time, the counts that differ, and what did not happen. A review by the maker (from WP65) shows as "Not checked by the critic".
- Each cast entry shows its sheet review: "Checked" or the faults.
- The Music view shows the checked candidates with their fit, best first.

## Work package WP66

| Id   | Scope                                                                                                                                   | Needs |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP66 | The critic of clips and sheets, the states with space, direction, strikes, the order of shots, the music map and its check, the answers | WP65  |

### Checks of WP66

1. With the fake agent as the critic: a keep that the critic refused cannot be placed; the lead cannot store a verdict; an unanswered warning refuses a keep; a prop sheet with a failed review cannot be used; the order of C14 holds; each warning of C13, C15, and C16 fires on a plan made to trigger it.
2. With no agent program, `review_clip` fails with `no-critic`.
3. `check_music` on made test tracks: a track that rises fits a rising map, a track that is loud at the start warns, and the best start is found.
4. The real critic on the 9 clips of the trailer and on the sword sheet, with the hit rate against the faults above, the time, and the tokens of one turn.

## Details of WP66

These facts and choices came from the build of WP66 on 2026-11-24.

### The parts

1. The harness of the engine has 66 tools: `review_sheet` and `check_music` are new for the lead, and `view_for_review`, `give_clip_review`, and `give_sheet_review` are for the critic only. The lead and a standalone `yumekit mcp` see 63. The project has no new edit kind: the reviews, the sheet reviews, and the music checks go through `setBible`.
2. The critic uses the token mechanism of `ask_helper`: the engine starts one more turn of the agent program with `--helper <token>`, the critic instructions of `@yumekit/brain` (`criticInstructionsOf`), and the working folder `<project>/.yumekit/critic`. The engine knows the token as a critic token. Its tool list holds only the three critic tools. Any other call fails with `critic-not-permitted`, and a critic tool from any other caller fails with `critic-only`.
3. A critic runs inside the chat request of the lead with the program of the lead. Outside a chat request, only a call of the person starts one, with the agent program of the settings. A call of an agent with no chat request (a terminal agent, the bridge) gets `no-critic`, so a tool call never starts an agent program that the person did not start.
4. The cost and the time of a critic turn: a turn may take at most 360 seconds, then the engine stops it and the review fails with `critic-failed`. One critic runs at a time; a second review waits. On the 9 clips a turn took 31 to 47 seconds (see below), so the limit leaves room for a slower program.
5. The frames of a review: `view_for_review` with no input shows the clip at 8 frames each second, as sheets of 12 frames (1.5 seconds each) in 4 columns of 400 pixels, so a 4 second clip is 3 sheets and 32 frames. Then the start picture and the first frame as two pictures, the end picture of the kept shot before in the same place, and each sheet picture of the cast of the shot. A closer look takes a region and a time range and shows up to 24 frames.
6. `give_clip_review` refuses an answer that is not whole, with `review-not-valid` and each issue: an item of the list or a warning with no answer, an end entry with no judgment, no `cut_match` when there is an end picture before, and a differing count with no time. A keep is refused with a fault, a warning answered as a fault, a differing count, an action or an end entry that did not happen, or a first frame that does not match. A cut needs its range inside the clip, at least one fault, the action and each end entry inside the range, and no fault warning or differing count inside the range. A redo needs a fault. A sheet pass is refused with a fault or a differing count.
7. The stored review has `by: "critic"`, the faults of the critic plus one line for each differing count ("2 swords, not 1 at 3.5s"), and `critic`: the answers, the counts, what did not happen (`missed`), the answers to the warnings, and the seconds of the turn. `place_video` accepts only a review by the critic. A review of WP65 (no `by`) counts as not reviewed, and the Story view shows it as "Not checked by the critic".
8. Not enforced yet: `place_video` places a cut clip from its start, as before, so the lead must still trim it with `duration_frames` and `update_clip` to the clean range of the critic. The redo is enforced. A placement that follows the cut range is a follow-up.
9. Sheets: a call with `shot_id` needs a sheet review of the place and of each entry of the shot, `pass`, on the same pictures (`sheet-not-reviewed`, `sheet-failed-review`). A person who holds a prop in an entry of the plan (`held_by`) needs two or more pictures (`cast-sheet-missing`: "no picture of the hands holding ..."). `put_cast_member` keeps the sheet review only when the facts and the pictures stay the same.
10. States: each entry of `start_state` and `end_state` is compared across a cut by its `where` and `state` in words (lower case, no punctuation), its screen side, its facing, and its holder. The words are a word test: "on the path" and "in the middle of the path" differ. The warning names each part that changed, so the lead can copy the end entry into the next start.
11. A fight shot has `strikes`, or an action with a verb of a strike (strikes, slashes, cuts through, hits, punches, kicks, stabs, swings the, parries, blocks, clashes, smashes, splits). The count of opponents adds the `count` of each target of `strikes`. A fight shot with no `strikes` gets the warning to name them, and gets no count of opponents. "He spins ... and throws them back" is not a strike verb, so that shot of the trailer is not a fight for the plan tool. These are word tests, so they are warnings.
12. The music map: each shot has `music_intensity` and `music_hits`. When the clips of the shots are placed, the map uses their times on the first timeline; else the plan seconds in order. The part after the last shot is the end card, with `music_end_intensity` (1 by default).
13. The music measure: FFmpeg decodes the file to mono at 16 kHz, once as it is and once through a 2 kHz high pass. Each half second gives the RMS level in dB of both. The level of the music is the mean of the two curves after each is scaled to mean 0 and spread 1. The fit is the Pearson correlation of that level with the intensity of the map, at each start in the file in steps of half a second, and the best start wins. The peak is the loudest 2 seconds of the loudness alone.
14. The warnings of `check_music`: the first 2 seconds are within 3 dB of the loudest while the first shot has intensity 2 or less; the fit is under 0.3; the peak is more than 2 seconds away from the first shot with the highest intensity; the mean level under the end card is within 3 dB of the loudest while the end card has a lower intensity; the music is shorter than the film. The checks are stored in the plan, best fit first, and the Music view lists them as "Music made for the story", each with Play from its best start, "Follows the story N of 100", the warnings, and "Use this" (`replace_music` with `asset_id` and `start_seconds`).
15. What the music check can judge: where the music is loud and bright against where the story wants intensity, and the part of a longer file that fits. What it cannot judge: if the music is good, the instruments, the mood, and if a hit lands on its frame. The agent cannot hear. The owner judges by ear.
16. The Lyria guides that the builder had read on 2026-11-24: `aistudio.google.com/docs/music-generation` (no date; the API header names revision 2026-05-20) and `aistudio.google.com/docs/lyria-prompt-guide` (no date). Facts used in the guide: name the genre, the mood, and the instruments; give the tempo in BPM and the key ("in D minor"); give the structure by timestamps ("[0:00 - 0:10] Intro: ..."); describe the start, the build, and the climax; place a hit at a second ("a beat drop at 12 seconds"), with silence before a big entrance; say "Instrumental only". Neither page names a negative prompt.
17. C21: the kit scene `command` takes `prompt` (1 to 3 characters) and draws no sign without it. Rule 37 and the guide tell the lead to use the colors of the art direction. The harness does not check the colors of an end card.
18. Engine: the `Chat` interface moved to `chatInterface.ts`, so `chat.ts` stays under 200 lines.
19. Defect found while building: the first version let an agent call outside a chat request start the critic. The CLI test `serveBridge.sameResults` then ran the real `claude` of the computer of the owner three times as a critic of a test sheet (about 20 seconds each, with the default model of the owner). Item 3 removed that path, and `chat.critic.test.ts` checks that such a call starts no program.

### The start difference (C11)

20. The plain measure of WP65 on the 9 clips (first frame against its start picture, whole picture, percent): wake 4.27, leap 3.38, leap-2 2.30, first-wave 6.97, whirlpool 5.31, split 4.38, lord-rises 3.52, guard 5.83, lord-answers 4.37. With the limits of WP65 (3 on the whole or 6 in one part) it fired on 8 of 9.
21. The first frame of a different shot of the same forest against a start picture measures the same: the clip of `leap` against the start picture of `wake` 4.71, `first-wave` against `leap` 5.00, `guard` against `lord-answers` 7.52, `lord-rises` against `guard` 7.42. Another place measures 11.96 (`split` against `whirlpool`) and 13.80 (`whirlpool` against `split`).
22. The builder tried a best camera shift and zoom, a match of brightness and contrast, and blocks of 5, 10, and 15 pixels. None separated the pairs: a redrawn ink line and fog in a hand-drawn film change as many pixels as a changed figure. A look at the pairs showed real changes in wake (the camera pulls back to the full body), first-wave (two demons missing), split (the giant is the size of the hero), guard (the sword is missing), and leap (other demon poses), and near matches in whirlpool and lord-answers.
23. So the measure stays a number, and the warning fires only above 10, for another picture. No clip of the trailer warns now. The critic answers the match on the start picture and the first frame side by side. It reported a mismatch for 7 clips and none for whirlpool and leap-2.

### The real critic on the trailer

24. The run: a copy of the trailer project, the engine of this branch, a temporary configuration folder, no media key, Claude Code 2.1.331 with `ANTHROPIC_MODEL=sonnet` (the model `claude-sonnet-5-5`), and `review_clip` called as the person through the engine. 10 critic turns: 9 clips and the sword sheet. No turn was repeated, and the frames and the instructions were not changed after the first two turns.

| Clip         | Seconds | Cost reported by Claude Code (USD) | Verdict | Faults of the owner's list that it found                                                                                       |
| ------------ | ------- | ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| wake         | 33      | 0.14                               | redo    | "no steel ever shows"; the start does not match                                                                                |
| leap         | 35      | 0.15                               | redo    | two demons fuse at 0.9 to 1.4 s (the fault the lead found too)                                                                 |
| leap-2       | 36      | 0.15                               | redo    | the demons hang behind him and never reach him; a push in with no cut against a static plan                                    |
| first-wave   | 38      | 0.17                               | redo    | "a second hilted sword is across his waist ... two swords"; the wave does not follow the blade; the demons die with no contact |
| whirlpool    | 32      | 0.14                               | redo    | "demons stay almost still, so there is no rush"; "the camera turns from overhead to eye level with no cut"                     |
| split        | 47      | 0.17                               | redo    | "the hero's body fuses into the demon's lower body"; "2 masks, not 1"; the giant is not a giant; the lair is not revealed      |
| lord-rises   | 32      | 0.14                               | redo    | "the root throne disappears"; the lord grows; the swordsman never steps in                                                     |
| guard        | 34      | 0.14                               | redo    | not a high guard over the right shoulder; water from nothing                                                                   |
| lord-answers | 32      | 0.13                               | redo    | "it is his left hand, but the plan says right"; the claws do not grow; no smile                                                |

25. Hit rate: each named fault was found: the doubled sword, the fused bodies, the doubled mask, the vanishing throne, the frozen ring, the melted view, and the six missed ends (no steel, no leap at him, no lair, no step in, no high guard, the wrong hand). 12 of 12. The times are close but not exact: the critic put the second sword at 3.0 to 4.0 s, and the frames show it from 0.75 s.
26. The sword sheet: `fail` in 19 seconds: "Two full swords with two hilts and two guards appear on one sheet (sheathed and bare), against the fact 'exactly one sword, never two'". It also failed the guard shape and called the design "a stock katana".
27. One clip turn read 127,000 to 190,000 input tokens, of which 84,000 to 123,000 came from the cache, and wrote 3,600 to 8,800 output tokens. It looked 6 times in 8 turns (the whole view and closer looks) and 2 times in one, and it answered 2 times in most turns, because `give_clip_review` refused the first answer (usually a warning or an item with no answer). The sheet turn read 66,000 input tokens and wrote 3,000.
28. The critic gave `redo` to all 9 clips. Many faults are real; some are strict ("the fingers are small and unclear", "the design is generic"). This follows the bar of the owner. It also means that a clip of the current video models rarely passes, so a film needs more attempts or cut clips. The owner decides if the bar is right.

### The owner's 13 points

29. On the frames, by the critic: point 2 and 3 (the first frame of leap does not match, and the demons are in other places), 4 (the wave does not come from the sword, the demons die with no contact), 5 (in whirlpool the count drops and the demons do not rush; where they came from is a plan fault), 7 (no contact), 8 (the overhead view turns to eye level), 9 (the throne vanishes and the lord grows; "no feet" was not named), and 10 (the water appears from nothing beside the blade in guard, the swoosh starts on the ground in leap).
30. By the plan checks, on the plan of the trailer rewritten in the form of WP66 (the same shots and states, as the lead wrote them in words): point 2 ("forest-demons" moves from behind him to the roots at the sides across the cut from wake to leap), 3 (the demons move across the cut from first-wave to whirlpool), 5 ("More forest-demons show in shot whirlpool (8, before 3)"), the first shot that opens with standing, the strikes with no target in first-wave and split, and no close shot of a strike. The opponent count did not fire, because the plan has no `strikes` (item 11).
31. By the music check: point 13. The trailer used the first 30 seconds of a 60 second Lyria piece from its start. `check_music` on it gives a fit of 0.46, the peak at 24.5 s (the map peaks in split, 14 to 18 s), and "The music under the end card (-13 dB) is as loud as its peak (-10 dB)". The prompt of the lead asked for "26-30 s the hit rings out and fades to near silence"; the measured level from 24 to 30 s stays at -10 to -11 dB. So Lyria did not follow the timestamps of that prompt. This is one piece, so it is an inference about the model. Point 1 ("very very meh") is taste: no measure judges it.
32. By the sheet critic, not run on these sheets in this proof: point 6 (all demons look the same) and point 11 (the villain does not look strong). The sheet list asks for both. The sheet of the hero would fail its scar: the picture draws it on his right cheek, the facts say left.
