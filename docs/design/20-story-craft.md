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
