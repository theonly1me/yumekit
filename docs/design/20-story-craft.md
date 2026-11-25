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
| C4  | The style of the bible is the art direction. The lead writes it into each picture and video prompt (since WP73, C40; before, the harness added it)           | Two shots cannot drift when the same words go into each prompt                                        |
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
- With `shot_id`, the harness adds the place and the cast of the shot to `cast_ids`, so their sheets go with a picture as reference pictures. Since WP73 (C40), it no longer adds the camera move of the shot: the lead writes the camera in the prompt. The source record of the asset keeps `shot_id`, so the editor finds the start picture and the clip of each shot.

## Sheets for characters, places, and props (C3)

- `castKinds` gets `prop`: `person`, `place`, `product`, and `prop`. A product sells; a prop is an object of a story, such as a lantern or a sword.
- A cast entry gets the optional `facts`: a list of fixed facts in words, at most 24, each at most 200 characters. `put_cast_member` takes `facts`, and an entry that exists keeps its facts when the call gives none.
- Since WP73 (C40), yumekit adds no sentence of an entry to a prompt. The lead writes the facts that a picture needs in its own words, and `get_shot_brief` gives them.
- A person: age, build, hair, each garment and its colors, marks and their side, five fingers on each hand, which hand holds which prop and how. Its first reference picture is a sheet: front, side, back, and a close up of the face, in the style of the film. Its second picture shows the hands with the prop.
- A place: a wide establishing picture, and a floor plan in words: where the door is, which side its hinges and its knob are on, which way it opens, where the window and the light are, and what is on each wall.
- A prop: a picture from two sides, and its facts: size, material, colors, and how a hand holds it.
- A call with `shot_id` needs a sheet for the place and for each entry of the shot: at least one reference picture and at least one fact. Otherwise it fails with `cast-sheet-missing`, which names each entry and what it lacks. A call that makes a sheet names no shot, so it passes.

## One style for the film (C4)

- The style of the bible (`set_bible` `style`) is the art direction: the medium, the line, the color, the light, the lens, and what never appears. The description of `set_bible` says so.
- Since WP73 (C40), the harness adds no art direction to a prompt. The lead writes it into each prompt, and `get_shot_brief` gives it.
- The look of the project stays the look of the scenes drawn by code. The art direction is for the media models. Step 5 of the server instructions no longer asks the lead to copy the style by hand.

## Continuity between shots (C5)

- `set_story_plan` warns when a shot in the same place as the shot before starts in another state (warning 1).
- A kept review saves the picture at the end of the kept part of the clip as an image asset `<clip id>-end` (C6). The shot keeps its id as `endPictureAssetId` of the review.
- A call with `shot_id` for the next shot in the same place, when the shot before has an end picture, must use it: as `first_frame_asset_id`, in `reference_asset_ids`, or through a first picture that was made with it as a reference. Otherwise the failure is `continuity-picture-missing` with the id of the end picture. A cut to another angle of the same place makes a start picture with the end picture as a reference.
- Since WP72 (C38), this rule applies only to a shot with `continues_shot`. A cut is free, and gets a note.

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

## What went wrong in the third film

On 2026-11-24 the lead agent made a 30 second anime trailer with the tools of WP66: a plan of 12 shots, 7 cast entries (the hero, the sword, two demons, the demon lord, a night street, the hall of the lord), and the critic for each sheet and each clip. The builder of WP68 read the final record of the run (the chat, the plan, the cast with its facts, each sheet review and clip review in the undo history, each prompt in the source record of its asset, and the record of paid calls) and looked at the pictures and at each start picture next to the frames of its clip. The run ended at the owner's word after 94 minutes, 66 paid calls, and 4.40 US dollars, with no film: 0 of 12 shots accepted, and the critic gave each of the 5 clips a redo.

The owner's goal, in his words: "in the first cut itself provide enough instructions so the agent does well enough so it is the final cut, without many re-dos".

### Tries for each sheet and shot

A try is one picture or clip that a paid call made. A review is one turn of the critic. The money is the price of the catalog.

| Entry           | Pictures made             | Reviews | Verdicts                                     | Money (USD) | Made from the refused version                   |
| --------------- | ------------------------- | ------- | -------------------------------------------- | ----------- | ----------------------------------------------- |
| hero (sheet)    | 10                        | 7       | 6 fail, then pass                            | 0.34        | Only tries 9 and 10, as edits                   |
| hero (hands)    | 8                         | (same)  | 5 of the 6 fails name the hands picture      | 0.27        | Only tries 7 and 8                              |
| sword           | 3                         | 6       | 5 fail, then pass                            | 0.10        | Tries 2 and 3                                   |
| roof crawler    | 12                        | 9       | 9 fail, never passed                         | 0.70        | Tries 2 and 7 to 9; tries 10 to 12 from nothing |
| wall demon      | 9                         | 9       | 9 fail, never passed                         | 0.60        | Try 2 only                                      |
| demon lord      | 10                        | 10      | 9 fail, then pass after the facts changed    | 0.64        | Try 2 only                                      |
| night street    | 3                         | 4       | fail, fail, pass (try 3), pass (try 1 again) | 0.10        | Try 2                                           |
| hall            | 2                         | 2       | fail, pass                                   | 0.07        | Try 2                                           |
| shot 1, `step`  | 3 start pictures, 3 clips | 3       | redo, redo, redo                             | 1.03        | No: each clip had a new start picture           |
| shot 10, `land` | 1 start picture, 2 clips  | 2       | redo, redo                                   | 0.55        | The second clip reused the start picture        |

The sword reviews include the hands picture of the hero, so one bad hands picture failed two entries. The street and the wall each got a second review of the same picture after the lead changed the facts.

### The cause of each refusal

Each refusal is sorted by the part that permitted it.

| Cause                        | What happened                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The brief                    | The brief said only "a deep indigo haori ... over a black jacket and dark grey hakama ... white leg wraps". The picture model filled the gap with the black buttoned uniform, the badge, and the cloud haori of the characters of an existing anime series. The owner said: "the hero character needs to be redone to be more different". The brief also gave scale as numbers: "twice the hero's width", "a head and a half taller".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| The plan                     | Facts that no picture can match: "twice the hero's width and a head taller" (the critic measured "about 5 to 6 times the hero silhouette's width"), "a little taller than the hero", "the hero's head reaches only his shoulder". The lead changed these numbers between tries (a head taller, then 1.5 times, then twice), so the target moved. Shot 1 planned "his left thumb rests on the guard" in a low shot from behind, where the thumb cannot show; the critic then counted "1 visible hands, not 2".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| The prompt                   | The video prompt of the first clip said "the swordsman walking toward the camera", against its own start picture (a low shot from behind) and the plan (he faces away). The second prompt ended on "[2-3s] he stands still", and the critic failed the freeze. The second start picture showed his right fist at the top of the frame, and no prompt described it: it became a "lumpy mitten". The wall prompt said "a rounded weathered head like an old stone lantern", and the model drew the knob of a stone lantern on top. The first sword prompt asked for lightning along the blade while the fact said the lightning shows only on a strike. Most remakes started from nothing, so each try changed the whole picture: the street went from scattered puddles to two channels of water, with other lanterns and signs.                                                                                                                                                                                                      |
| The limits of the model      | The cheap picture model drew hands whose fingers merge or cannot be counted in 29 of the 41 failed sheet reviews, mirrored the hands picture (`hero-hands-3`: the scabbard on his right hip, his left hand on the grip, and arms that cross in a way no body can), drew a six limbed crawl pose, and could not hold an exact height against a grey silhouette in 8 tries of the lord. The video model missed a small target (the sandal landed between the puddles), drew a splash far too large, slid the coat pattern, and left the background still.                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| The lead under pressure      | To pass the sheet of the demon lord, the lead changed his fact from the brief's "a head and a half taller than the hero" to "about the hero's height". The 10th review then passed. Nothing protected a fact that came from the person.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| The strictness of the critic | "A doubt is a fault" made each small difference a refusal: the grip cord "beige, not off-white", "a white blob" on the pommel, "only a quarter of the blade is out, not a third", barrels "that the facts don't name", puddle reflections that "don't line up", the eyes "pale grey, not gold" at the size of a full body view, a hem "at thigh height". 19 of the 41 failed reviews name a height or a width against the hero. The critic named the mirror of `hero-hands-3` and the hem, but not the impossible arms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| The call to the model        | With `shot_id`, the harness added the sheet pictures of the place and the cast to each clip call (5 or 6 pictures), and the Gemini server sent them with the start picture as 6 or 7 pictures with no role and no `task`. The official page of the model says "By default, the model infers the generation mode and media roles directly from your natural-language prompt" and "Setting `task` adds strict constraints, such as limiting input images or locking how multiple media inputs combine." The prompts were 4,800 to 5,200 characters, because each cast fact and the whole art direction were appended. On the frames, 2 of the 5 clips started near their start picture; the worst copied the layout of a sheet (the hero full size from the front, where the start picture showed him tiny in the hall). The first trailer had "does not start on the start picture" on 8 of 9 clips. This is very likely a fault of how yumekit calls the model, not a limit of the model (an inference: no paid test proved it yet). |
| A rule of the product        | Nothing limited the tries, and the default model of each sheet was the cheapest. A start picture or a clip of a shot needed a passed review of every sheet of the shot, so three failing sheets blocked the whole street sequence. A shot in the same place needed the kept clip of the shot before, so one refused first shot blocked eleven others. No check looked at the plan before the money.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

The cause in one sentence: the lead spent money first and learned later; the facts asked for what a picture cannot show, the critic refused what a viewer would not see, and the harness let the lead try the same thing again and again, while one refusal blocked the rest of the film.

## Decisions of WP68

| Id  | Decision                                                                                                                                                                                                                                             | Why                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| C22 | The critic checks the whole plan before the first paid picture or clip of a story film: the story, the facts of each sheet, and the text of each sheet, start picture, and video prompt. Paid calls wait for a pass                                  | A refusal of the plan costs no media money. The faults of this run were visible in its text                                    |
| C23 | The story guide has a list of known limits of the picture and video models, with the form that works and its evidence. It is data in one place, and a run can add a limit                                                                            | The lead and the plan check use the same list, and a limit is learned once                                                     |
| C24 | Each fault of the critic is `blocking` or a `note`. Only a blocking fault refuses. A sheet or a clip with notes passes                                                                                                                               | The critic refused what a viewer would not see                                                                                 |
| C25 | At most two tries with the same approach for a sheet and for a shot. The second try starts from the refused version, on the strongest model. Then one simplified try. Then keep the best version, plan around it, or ask the person                  | A loop of remakes from nothing cost most of the money and changed the parts that were right                                    |
| C26 | A failed sheet or shot does not block the film: a sheet can be used with a recorded restriction, and a refused shot does not block the next shot in the same place                                                                                   | Three sheets blocked the street, and one shot blocked eleven                                                                   |
| C27 | Sheets and start pictures use the strongest picture model of the service unless the person picked a model. Facts are visual statements. A person's description covers each garment, the hair, the face, and what it must not resemble                | Every later picture copies the sheet. A thin description borrowed a known design                                               |
| C28 | After the plan passes, the lead makes the easiest and the hardest shot first. The causes of their refusals become lessons for the lead (since WP73, C39: never in a prompt)                                                                          | The first two shots teach the rest, before the money of ten more                                                               |
| C29 | The sheet review asks if the design looks like a known character or uniform of an existing work. That is a blocking fault with the parts named                                                                                                       | The first hero looked like the characters of an existing series                                                                |
| C31 | A clip of a shot starts on its start picture by construction: the start picture is the only picture of the call, in the strict first frame mode of the model, with a short prompt about motion. The critic reviews the start picture before the clip | The sheets did their work in the start picture. More pictures and 5,000 characters of facts let the model compose another shot |
| C32 | A fact from the person's brief is protected: the lead cannot remove or change it to pass a review, and the critic judges each fact against it                                                                                                        | The lead turned a tall lord into one of the hero's height to pass a review                                                     |
| C30 | The final answer and the Story view give the shots accepted on the first try, the tries of each sheet and shot, and the money spent on refused pictures and clips. The target is at least 10 of 12 on the first try                                  | What is measured improves, and the person sees the cost of each redo                                                           |

## The plan check (C22)

- `set_story_plan` takes two more texts for each shot: `start_picture_prompt` and `video_prompt`, the prompts that the lead will send, before the harness adds the art direction, the cast, and the lessons. `put_cast_member` takes `sheet_prompts`: the prompt of each sheet picture of the entry (the sheet, and the hands with the prop). So the lead writes each prompt of the first cut before any money.
- The new tool `review_plan` starts the critic on the whole plan: the story, each shot with its states, strikes, camera, and prompts, each cast entry with its description, facts, sheet prompts, and restrictions, the art direction, and the known limits (C23). It runs only when the plan and the cast are complete: each shot has its prompts, and each entry of the plan exists with its facts and its sheet prompts.
- Before the critic looks, the harness finds what a word test can find, and the critic answers each finding as a fault or a harmless case: a fact with a bare number or a ratio ("twice the hero's width", "1.5 times", "a little taller"), and a person whose description and facts name fewer than four parts (garments, hair, face, and what it must not resemble).
- The critic answers with `give_plan_review`: each item of the plan list, each finding, and for each shot its difficulty from 1 (easy for the models) to 5 (likely to fail), the known limits it touches, and its blocking faults and notes; for each cast entry its blocking faults and notes; the verdict `pass` or `fail`; and the easiest and the hardest shot (C28).
- The plan list: a fact that no picture can show, or that is a bare number; a pose or a shot on the list of known limits; a shot with more than one action or too much in the frame; a prompt that leaves a visible part undescribed (a garment, a hand, the ground, the background motion); a prompt that contradicts its plan, its start state, or a fact; a person whose description is thin enough that the model will borrow a known design; a place fact that a later shot contradicts; a shot that breaks a restriction of a sheet (C26).
- The review is stored in the plan with a fingerprint of what the critic saw. A change of the plan, the art direction, a fact, a description, a sheet prompt, or a restriction makes it stale. Lessons and reviews of clips do not.
- A picture or a video call of a project with a story plan fails with `plan-not-reviewed` while no current review exists, and with `plan-failed-review` (with the faults) after a fail. Music, voice, and sound do not wait.
- On the first try of a sheet picture or a shot, the prompt is the reviewed prompt. A call can leave `input.prompt` out, and the harness uses the prompt of the plan. A call with another prompt fails with `prompt-not-reviewed`. After a refusal, the lead writes the prompt of the next try.
- The cost: one critic turn and no media money. "Details of WP68" has the time and the tokens on the plan of this run.

## Known limits (C23)

- The list is the constant `knownLimits` of the harness: an id, what the models do badly, the form that works, and the evidence from the three films. `get_story_guide` prints it, and the plan check gets it.
- The first entries: two hands on a prop close up (show one hand from one clear angle); a crowd or more than two opponents; a spin or any move where the view of the camera would change; an effect with no named source; exact scale between two characters (a visual comparison, not a number); a contact on a small target (frame it so the target is large and the contact is the only motion); long thin fingers and claws; legible writing; a character that enters in the middle of a clip; a simile that the model draws literally ("like an old stone lantern"); a part of a body at the edge of the frame that no prompt describes.
- A run adds a limit with `record_lesson` and `is_limit` true, when a sheet or a clip is refused twice for the same cause. The limit is stored in the plan, the story guide of the project prints it after the built-in list, and the next plan check uses it. A builder moves a limit that repeats across films into `knownLimits`.

## Severity (C24)

- Each fault of a sheet review and a clip review is `blocking` (in `faults`) or a `note` (in `notes`). Only a blocking fault refuses.
- Blocking: the film cannot use it. A doubled object, a wrong side, a wrong count of what is in the frame, a missing planned action, a broken body or impossible anatomy, a hand with merged or extra fingers that a viewer sees, a contact that misses, an effect with no source, a first frame that is another picture, a likeness to a known design (C29), and writing that a person cannot read.
- A note: a viewer would not see it, or the next step can absorb it. A height that differs a little from the facts, a shade of a color, a detail of a hem, a small artifact on a plain surface, a part of the place that the facts do not name, a mark that is too small to see at the size of the shot.
- The bar of the owner does not drop for clips: hands, bodies, objects, contact, the source of an effect, and continuity stay blocking.
- The critic counts only what is in the frame. A hand that the camera does not show is not a missing hand.
- The sheet list and the clip list get an item for plain anatomy: each arm joins its own shoulder, the hand at its end is the hand of that side, the elbows and the wrists bend the way a body bends, and arms do not cross through each other. This is the fault of `hero-hands-3` that the critic missed.

## Tries (C25)

- The harness counts the tries of a sheet by the reviews of its entry, and the tries of a shot by the reviews of its clips. A try is refused by a review with a blocking fault.
- After one refusal, the second try must start from the refused version. For a sheet, the call gives a refused picture in `reference_asset_ids`, and the prompt asks to change only the named faults and keep the rest. For a shot, the clip starts from the start picture of the refused clip, or from a new start picture made with it as a reference. Else the call fails with `start-from-refused`. The second try uses the strongest suitable model of the service (C27), unless the person picked a model.
- After two refusals, a third try fails with `simplify-first`, which names the simpler forms of the known limits. A call with `simpler_form` (what is simpler now) is the one simplified try.
- After three refusals, each call fails with `tries-used-up`: keep the best version (the review with the fewest blocking faults), plan around its fault (C26), restage the shot as a new shot of the plan, or ask the person. `person_asked_for_another_try` true permits one more try, only when the person asked for it in this request.
- `put_cast_member` applies the same rule to a picture that becomes a sheet, so a picture made without `sheet_of` cannot dodge it.

## Nothing blocks the film (C26)

- A sheet with only notes passes.
- A sheet whose best version still has a blocking fault can be used with `restrictions` on its cast entry, for example "never show both hands close up" or "never show his back". The plan check then refuses each shot that breaks a restriction. Since WP70, a new restriction does not make the stored plan check outdated; the next plan check sees it.
- A refused shot does not block the next shot in the same place. When the shot before has a kept clip, the next shot starts from its end picture (C5). When it has none, the next shot starts from the start state of the plan, with a start picture made from the sheets. The view marks the shot before as missing, and the lead restages or drops it.
- Why by consequence: a block stops all work for one fault, and the person then pays for a loop or gets no film. A start from the planned state can give a small jump at one cut. The critic sees the cut when the missing shot is made, and the person sees the missing shot in the view. A small jump at one cut is the smaller harm.

## Strong defaults (C27)

- A sheet picture (`sheet_of`), a start picture (`shot_id`), and the second try of a clip use the strongest suitable model of the service, unless the call names a model or the person picked a model in Settings. The strongest is the model with the highest price for one picture (or one second) that accepts the inputs of the call. The result states the model and the price difference to the default.
- Facts are visual statements: "the top of the hero's head reaches the lord's shoulder in a side by side picture", not "a head and a half taller".
- A person's description and facts cover each garment with its color and cut, the hair, the face, and what the design must NOT resemble: "no buttons, no standing collar, no uniform".
- The story guide gets the weak and the strong hero of this run as a worked example.

## Calibrate (C28)

- The plan review names the easiest and the hardest shot. After the plan passes, a start picture or a clip of any other shot fails with `calibrate-first` until both have a reviewed clip.
- When the critic refuses a calibration clip, the lead records the cause and the form that works with `record_lesson`. The plan keeps the list. Since WP73 (C39), no lesson goes into a prompt: the lead reads the lessons in the answer of `record_lesson`, in `get_work`, in `get_shot_brief`, and in the answer of each picture or clip call of a shot, and writes what applies into its own prompt. Another shot waits with `lessons-missing` until each refused calibration shot has a lesson.
- A lesson whose cause repeats becomes a known limit (`is_limit`).

## Likeness (C29)

- The sheet list gets an item: does the design look like a known character, uniform, or costume of an existing work? A likeness is blocking, with the parts named (the buttoned black jacket, the badge, the cloud pattern).

## The measure (C30)

- `get_work` and the Story view give: the shots accepted on the first try out of all shots, the tries of each sheet and shot, and the money spent on refused pictures and clips (each picture of a refused sheet try that the entry does not use now, each refused clip, and each start picture that only refused clips used).
- Rule 36 of the instructions of the AI: the final answer gives the same three numbers.
- The owner's target is at least 10 of 12 shots on the first try.

## The start picture decides the clip (C31)

- A video call with a first frame sends that picture as its only picture. The harness adds no sheet pictures to it, and refuses a call that gives `reference_asset_ids` with `first_frame_asset_id` (`first-frame-only`). The Gemini server refuses the same pair, and sends the first frame (and a last frame when given) with `task: image_to_video`. The fal server already sends a first frame to the image to video endpoint of each model and refuses references with it. "Details of WP68" records each model.
- The prompt of such a call is short and about motion: what moves in time order, the camera, and what stays still. The picture carries the look. Since WP73 (C40), the harness adds nothing to it: no lesson and no sentence about the first frame. A video prompt over 900 characters gets a note in the result and a warning in `set_story_plan`.
- `review_start` has the critic check a start picture before its clip: the start state of the plan (each person and prop, its screen side, its facing, its hand), the framing of the shot (size, angle), each sheet, plain anatomy and hands, the known limits (a small target framed large, hands large or out of the frame), and every visible part. Blocking faults and notes, as in C24. A clip call fails with `start-not-reviewed` or `start-failed-review` until its first frame passed. A refused start picture is a refused try of the shot (C25).
- The measured `does-not-start-on-the-start-picture` (a whole difference over 10, WP66) refuses a keep and a cut of a clip with a first frame: a correct call starts on it.
- A model with a first and a last frame could take a reviewed end picture made from the end state of the plan. That is a follow-up, not this package.

## Protected facts from the brief (C32)

- `put_cast_member` takes `brief_facts`: the person's own words about the entry ("a head and a half taller than the hero"). They are stored on the entry. A later call cannot remove or change one (`brief-fact-protected`) unless `person_asked_to_change_brief` is true, only when the person asked in this request.
- The lead's `facts` are the visual statements that the models get. The plan check and the sheet review see the brief facts, and a fact or a picture that contradicts one is blocking.

## Work package WP68

| Id   | Scope                                                                                                                                                                                                                    | Needs |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| WP68 | The plan check, the known limits, severity, the rule of tries, restrictions, strong defaults, calibration and lessons, likeness, the measure, the start picture as the only picture of a clip, and protected brief facts | WP66  |

### Checks of WP68

1. With the fake agent as the critic: a paid call waits for a passed plan review; a sheet and a clip with only notes pass; the third try fails with `simplify-first` and the fourth with `tries-used-up`; a second try that does not start from the refused version fails; a sheet with a restriction can be used; a refused shot does not block the next shot; a lesson goes into each later prompt; a sheet picture uses the strongest model; the measure is in `get_work`.
2. The real critic on the plan of this run before its first paid call, and on at least 6 of its refused sheets, with the verdicts, the time, and the tokens.
3. With fake HTTP servers: a Gemini clip with a first frame sends one picture and the task, a call with references and a first frame is refused, and the harness sends a short prompt with no sheets. The end picture of a clip whose sound runs past its picture is the last frame.
4. Screenshots of the Story view with the plan review, the notes, a restriction, and the measure.

## Details of WP68

These facts and choices came from the build of WP68 on 2026-11-24.

### The parts

1. The harness of the engine has 71 tools, and the lead sees 66. New for the lead: `review_plan`, `review_start`, and `record_lesson`. New for the critic only: `give_plan_review` and `give_start_review`. The project has no new edit kind: the plan check, the lessons, the start reviews, and the tries go through `setBible`.
2. `set_story_plan` needs `start_picture_prompt` and `video_prompt` for each shot. A plan of WP66 still loads and shows, and `review_plan` answers `plan-incomplete` until the plan is written again with its prompts.
3. The plan check is stored with a key: the first 16 hex characters of a SHA-256 of the art direction, the story, each shot without its reviews, and each cast entry of the plan (its kind, name, description, facts, brief facts, sheet prompts, and restrictions). The pictures, the reviews, the lessons, and the music checks are not in the key, so a sheet picture or a lesson does not ask for a new plan check.
4. The plan gate applies to each picture and video call of a project with a story plan. Music, voice, and sound do not wait. Structural failures come first: `shot-not-named`, `shot-not-found`, and `first-frame-only` are answered before `plan-not-reviewed`.
5. The word test of the plan: a bare number or ratio is "twice", "three times", "half as", a number with x, times, percent, or a unit, "a head (and a half) taller" and its forms, and "a little (bit, lot) taller" and its forms. A person is thin when its description and facts name no garment, no hair, no face, or nothing it must not resemble. `put_cast_member` returns the same findings as warnings when the project has a plan. These are word tests, so the critic answers each one as a fault or harmless.
6. `give_plan_review` refuses an answer that misses an item of the list or a finding, that has not exactly one entry for each shot and one for each cast entry of the plan, a pass with a blocking fault or a finding answered as a fault, a fail with no blocking fault, an easiest shot that is not the lowest difficulty, a hardest that is not the highest, or the same shot for both.
7. The first try of a sheet or a shot sends the reviewed prompt. Equal means equal after trimming. With no `input.prompt`, the harness fills it; for an entry with two sheet prompts, it takes the first one that no picture of the entry has sent yet.
8. Tries are counted from the reviews: the failed sheet reviews of an entry (`sheetTries`, or the one `sheetReview` of WP66), and for a shot the clips refused by the critic plus the start pictures that the critic failed. A new try waits with `review-first` while a picture of the entry that no review saw exists (as many as its sheet prompts), or while a clip or a start picture of the shot has no review.
9. The second try of a sheet gives a picture of the last refused try in `reference_asset_ids`. The second try of a shot uses the start picture of the refused clip as the first frame, or makes a start picture with it as a reference; after a refused start picture, the new start picture names it as a reference. The best version after three refusals is the refused try with the fewest blocking faults, the latest on a tie. The harness picks it from the counts of the critic, so it costs no extra critic turn.
10. `put_cast_member` refuses a picture that a tool made without `sheet_of` for an entry that has a refused try (`sheet-try-not-counted`). A picture that the person imported passes: it is the person's decision.
11. A failed sheet with `restrictions` passes the sheet gate. The restrictions are in the key of the plan check, so the critic sees them before the next paid call.
12. Continuity: when the shot before in the same place has a kept clip, the next shot starts from its end picture (C5). When it has none, the next shot can start from the plan if the shot before has a refused try or the next shot is a calibration shot; else the failure is `previous-shot-not-kept`. The Story view shows a refused shot with its tries.
13. Calibration: until as many shots as there are calibration shots (two, or one in a plan of one shot) have a reviewed try, a start picture or a clip of another shot fails with `calibrate-first`. A calibration shot with a refused try needs a lesson with its `shot_id` before another shot (`lessons-missing`).
14. The strongest model: among the models of the service in use for the capability that accept the inputs of the call (reference pictures, a first frame), the one with the highest lowest price for one picture or one second. Price stands for strength; this is an inference, and it holds for the Gemini, fal, and OpenAI catalogs of today. A person who picked a model that is not the default keeps it. It applies to a sheet picture (`sheet_of`), a start picture (`shot_id`), and a clip of a shot that has a refused try. With Gemini, a sheet is made with Gemini 3 Pro Image at 0.134 US dollars, against 0.0336 for Nano Banana 2.1.
15. The lessons follow the art direction as "Lessons of this film: <lesson>; <lesson>." in each later picture and video prompt.
16. Severity: `faults` holds the blocking faults and `notes` the notes, in the answers and in the stored reviews. A count that differs stays blocking, and the critic counts only what is in the frame. A keep or a cut of a clip with a start picture is refused when the measure fires `does-not-start-on-the-start-picture` (a whole difference over 10).
17. `review_start` stores its verdict in `startReviews` of the shot. A second review of the same picture is refused (`already-reviewed`); a picture that did not change keeps its verdict. An end picture of a kept clip needs no start review: the critic saw it as the end of that clip.
18. A video call with a first frame: the harness adds no reference pictures and no sentences of the cast, and refuses `reference_asset_ids` with `first-frame-only`. The art direction is left out. With `shot_id`, the harness adds the sentence of C31 and the lessons. The video prompts that the third film sent were 4,787 to 5,240 characters, of which the lead wrote 727 to 992; the warning fires over 1,500, in the result of `generate_asset` and in `set_story_plan`.
19. A repeated `review_clip` of a clip that the critic reviewed returns the stored verdict with `stored: true` and starts no critic. `saveVideoFrame` falls back to the last picture of the video when a time past the picture but inside the sound gives no picture (the clip of the third film had 3.000 seconds of picture and 3.029 of sound).
20. Brief facts: `put_cast_member` refuses a call that drops or changes a fact of `brief_facts` (`brief-fact-protected`) unless `person_asked_to_change_brief` is true. The plan check, the sheet review, and the start review show them, and a contradiction is blocking.
21. The measure: a shot is accepted on the first try when it has exactly one try and the critic kept or cut it. The money on refusals is the price of each picture of a failed sheet try that the entry does not use now and that no passed try holds, each clip that the critic refused and never kept, each start picture that only refused clips used, and each start picture that the critic failed. `@yumekit/project/film-measure` computes it for `get_work` and for the Story view.
22. The Story view has a part "Before the money": three numbers (right on the first try, tries so far, money on what failed), the plan check in plain words with its faults, the easiest and the hardest shot, and the lessons. Each shot shows its difficulty, its tries, the start picture check, and the notes. Each sheet shows its notes, its restrictions ("Used with a limit"), its brief facts ("From your brief, kept as is"), and its tries.
23. The critic instructions: rule 5 sorts blocking faults from notes, rule 6 keeps the bar for clips and counts only what is in the frame, rule 7 gives the examples of the third film, rule 9 is the plan check. "A doubt is a fault" is gone. After the real run below, one more blocking example was added: a trait that the description names as the core of the design and that the picture lacks, and a part that reads as another object.
24. The test server `pricedMediaServer` of `@yumekit/tools` has a second picture model, `priced-image-pro`, so the strongest model can be tested.

### The video models and a first frame

25. Read on 2026-11-24. Gemini Omni Flash 1.2 (`aistudio.google.com/docs/omni`, no date on the page): a first frame is an image part before the text, with no role; "By default, the model infers the generation mode and media roles directly from your natural-language prompt"; "Setting `task` adds strict constraints, such as limiting input images or locking how multiple media inputs combine"; first and last frame are two images in `input`. The page does not say if references combine with a first frame. The Gemini server now refuses that pair and sends `task: image_to_video` with a first frame.
26. The fal endpoints (each `fal.ai/models/<endpoint>/api`, no date on the pages; read by a helper agent, quoted by its summary): no image to video endpoint takes reference pictures with its first frame. Seedance 2.5 `image_url`, `end_image_url`. Kling 4 `start_image_url`, `end_image_url`, `middle_image_urls` (keyframes, not references). Gemini Omni Flash 1.2 `image_url`, `end_image_url` (10 seconds at most with it); references only on `reference-to-video` (`image_urls`), which takes no first frame. MiniMax H3 `image_url`, `end_image_url`; references only on `reference-to-video`. Wan 3 `start_image_url`, `end_image_url`. LTX 2.5 Pro `image_url`, `end_image_url`. PixVerse 6 `image_url`, no last frame. FLUX 3 `image_url`, and a separate `first-last-frame-to-video` with `start_image_url` and `end_image_url`. Grok Imagine Video 1.5 `image_url`, `end_image_url`, `keyframes`. The fal server already calls the image to video endpoint for a first frame and refuses references with it, so it needs no change. The OpenAI server has no video model.

### The plan check on the plan of the third film

27. The run: a copy of the project as it was before its first paid call (the plan of 12 shots and the 7 cast entries with the facts of that moment, from the undo history), the engine of this branch, a temporary configuration folder, no media key, Claude Code 2.1.331 with `ANTHROPIC_MODEL=sonnet`, and `review_plan` called as the person. The lead of the run wrote no prompts before its first call, so the builder filled them: each sheet prompt is the first prompt that the run sent for that sheet, shot 1 has the prompts of its first start picture and first clip, and shots 2 to 12 have a short prompt made from the action and the states. One turn: 109 seconds, 0.34 US dollars reported by Claude Code, 160,000 input tokens (most from the cache), and 32,000 output tokens. The critic answered three times; the first answer missed the entries of the shots.
28. Verdict `fail` before any money, with 30 blocking faults. What it refused that this run then paid for: the three bare number facts ("a little taller", "twice the hero's width and a head taller", "a head and a half taller"); the four persons with no "must not resemble" line, and for the hero, in its words, "the indigo haori, scarred face and lightning blade invite a known ... protagonist" (the likeness the owner found after 10 pictures); the second hero sheet prompt as two hands on one prop close up; shot 1 as a small contact target, with "the framing does not make the puddle fill the frame and does not make the step the only motion"; the video prompt of shot 1 that has him "walking toward the camera" against the plan; and four shots with several actions (draw, thrust, blocked, iai). It rated the shots 3 to 5, named `lord-wakes` the easiest and `iai` the hardest.
29. What it did not catch, or could not: the simile of the wall's head was not in the first prompts (it came in a later try), so the check could not see it; the hands that merge on long thin claws were named as a known limit for the crawler, but the check cannot know how often the picture model fails; it also faulted the filled prompts of shots 2 to 12 as templates, which is a fault of this reconstruction, not of the run. Some faults compare the start prompt of shot 1, written for the second hero design, with the facts of the first design.

### The real critic on the refused sheets

30. The run: a copy of the final project with the sheet reviews removed, the same engine and program, and for each case `put_cast_member` with the facts of the moment of the old review and then `review_sheet` as the person. 10 sheet turns of 19 to 35 seconds, 71,000 to 169,000 input tokens (most from the cache) and 1,500 to 8,500 output tokens each. The first try of the second hero case reviewed the old pictures, because `put_cast_member` refused the new ones (`sheet-try-not-counted`, the rule of item 10 doing its work), so the case ran again after `remove_cast_member`.

| Sheet                               | Old review (blocking for all)                                               | New verdict     | Blocking now                                                                       | Notes now                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| First hero, `sheet-hero`            | fail, 7 faults, no likeness                                                 | fail            | The likeness to an existing series, with the parts named (jacket, badge, haori)    | Lightning at rest, a mark on the cheek, the blade drawn twice as two views |
| `hero-new-sheet-4` + `hero-hands-3` | fail: the mirror, the hem, the rest grip                                    | fail            | The hands picture is mirrored, with the wrong hand on the grip; the rest grip      | The sleeve color, the faint scar, the guard                                |
| `sheet-street`                      | fail twice: signboards, reflections, open doors, barrels                    | pass            | None                                                                               | Signboards, curtain colors, buckets, lanterns                              |
| `sheet-lord-7`                      | fail: scale, threat, eye color                                              | fail            | The lord is a few percent taller than the hero, so the threat of the brief is lost | The hero on the sheet, the sleeves, the brow                               |
| `sheet-wall-pro`                    | fail: the knob on the head, scale, fused fingers, weak design               | pass, then fail | First turn: none. Second turn: the bead rope mirrored in the back view, the knob   | First turn: the height, the knob as a "bottle cap", the fists              |
| `sheet-crawler-pro`                 | fail, 7 faults: arms too short, upright, eyes, toes, a hand, generic design | pass            | None                                                                               | The upright front view, the flower shade, the height, no all-fours pose    |
| `sheet-sword-2` + `hero-hands-4`    | fail: the grip at the pommel, four fingers, cord color, a white blob        | pass            | None                                                                               | The cord color, the hidden thumb, the pommel                               |
| `sheet-hall`                        | fail: walkways, lanterns on the galleries                                   | pass            | None                                                                               | The walkways ("can stay as a restriction"), cropped screens, the tiny lord |

31. What moved from blocking to notes: shades of a color, unnamed objects of a place, a small artifact, a thumb that the pose hides, a height that differs a little. What stayed blocking: the likeness, the mirrored hands, the scale that loses the brief, the mirrored bead rope.
32. Where the critic is now too lenient, in the builder's judgment: the crawler's arms that are not too long and its generic design, and the knob on the wall's head in the first turn, were notes. These are the traits that make the design. The same sheet and the same instructions gave pass and then fail for the wall, so one turn is not a stable judge of a borderline design. Rule 5 now names a missing core trait and a part that reads as another object as blocking. This change came after the run and is not measured. With the rule of tries, a blocking design fault now costs at most three tries, then a restriction or the person's word, and no loop.
33. The anatomy item: on `hero-hands-3` the critic reasoned about which arm is which and called the picture mirrored with the wrong hand on the grip (blocking). It did not call the arms impossible. The builder sees a mirrored body, not an impossible one, so the claim of impossible arms is not confirmed.

### The start picture check

34. `review_start` on `start-step-2` of shot 1, the picture whose undescribed right fist became the "lumpy mitten" of its clip: `fail` in 35 seconds, blocking the leg wear that differs from the sheet of the moment, with notes that the framing is wider than the planned close up, that "the lifted sandal is over the puddle's rim, so the landing could miss onto dirt", and that "the right fist is small and undescribed ... Watch it in the clip for lumpiness". So the check names, before the clip, two of the faults that the clip then had. It named the fist as a note, not as blocking.

### Follow-ups

35. One paid check of a Gemini clip with only its start picture and `task: image_to_video`, to confirm that the clip now starts on it. The fault of the third film is an inference until then.
36. A model with a first and a last frame could take a reviewed end picture made from the end state of the plan (C31). Not in this package.
37. A second turn of the critic for a borderline sheet, when one turn passes it with notes about a core trait (item 32).

## What went wrong in the fourth run

On 2026-11-24 the lead agent started a 30 second anime trailer on `main` at `024bb12`, with the plan check of WP68. The plan check took the first 30 minutes and made no picture, also no free one: `review_plan` failed 5 times, with 14, 14, 5, 7, and 4 blocking faults. A sheet waited for the plan check, so even the pictures that the check does not change waited. The owner saw nothing for 30 minutes. The 14 shots summed to 31 seconds, the video limit of the project was 30 seconds, and nothing warned about it before the money.

"Details of WP70" sorts each fault of the 5 checks. In short: 14 of the 44 stored faults were the same fault twice (once in free text for the whole plan, once with its shot id), 11 were fine points that the film does not need, and only 5 named a fact of the brief.

## Decisions of WP70

| Id  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Why                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| C33 | The plan check has a limit, like sheets and shots. After the second failed `review_plan`, the gate opens: the open blocking faults are stored on their shot or cast entry as `planNotes`, the critic of each start picture and clip of the shot gets them, and the lead is told which shots carry them. A third check fails with `plan-checks-used-up` unless the person asked. A fault that changes or drops a protected brief fact still blocks, and the answer names the exact fact and the exact text to restore | Five checks spent 30 minutes and made nothing. Each later check found new fine points, not fewer faults |
| C34 | A sheet picture does not wait for the plan check. It can start when its cast entry has facts and `sheet_prompts`. Only start pictures and clips of shots wait. The plan check still reviews the sheet prompts when it runs, and a sheet made before keeps its tries                                                                                                                                                                                                                                                  | The person sees the first picture in minutes, and the sheets are the slowest part of a film             |
| C35 | A blocking fault of the plan check is only (a) a contradiction with a brief fact, (b) a prompt that contradicts itself, (c) a known limit with no working form used, or (d) a strike or effect with no contact or source. Everything else is a note. At most 3 blocking faults for one shot                                                                                                                                                                                                                          | The critic refused fine points that the film does not need                                              |
| C36 | `set_story_plan` and `review_plan` warn before the money when the planned seconds with one retry of the two longest shots pass the video limit, or the cost estimate passes the spending limit. Only the person can raise a limit, in Settings. The Story view shows the same line in "Before the money"                                                                                                                                                                                                             | The plan of the fourth run could not fit the limit, and nobody knew                                     |
| C37 | The person can set the Codex chat model and the reasoning effort of the picture turn: `YUMEKIT_CODEX_MODEL` and `YUMEKIT_CODEX_EFFORT` of the `codex` server, passed as `-m` and `-c model_reasoning_effort`. With no value, Codex uses its own default. A refused value is a failure that names the setting                                                                                                                                                                                                         | The person picks the model of their own plan                                                            |

## The limit of the plan check (C33)

- `storyPlan.failedPlanChecks` counts each failed `review_plan`. A pass does not count. `set_story_plan` keeps the count.
- After the second fail, the gate of start pictures and clips is open, also when the plan changes later. The stored review stays as it was, and no new review is needed.
- The open faults go where they belong: the blocking faults of a shot to `planNotes` of the shot, of a cast entry (and each finding of the word test that the critic called a fault) to `planNotes` of the entry, and the faults of the whole plan to `planNotes` of the plan. `review_start` and `review_clip` add them to the brief: "Faults that the plan check left open. Look for each one: a fault that shows in the frame is judged by the usual rules, and one that does not show is fine."
- The answer of `review_plan` names each shot with open faults and their count (`shots_with_open_plan_faults`), and `get_work` and the Story view say the same.
- `review_plan` fails with `plan-checks-used-up` after two fails, unless `person_asked_for_another_check` is true. A third check that passes clears the notes; a third check that fails replaces them.
- The critic gives a break of a brief fact in `brief_faults`: the cast entry, the shot when a prompt breaks it, the exact brief fact, the exact text to restore, and what breaks it. After the gate opens, such a fault still blocks each shot that it touches (`plan-breaks-brief`) until the restore text is in the facts of the entry, or in a prompt of the shot.

## Sheets do not wait (C34)

- A picture call with `sheet_of`, with no `shot_id`, for a cast entry with facts and `sheet_prompts`, skips the plan gate. Each other picture and each clip of a project with a story plan waits, as in C22.
- The first try still sends a prompt of `sheet_prompts`, and the rule of tries (C25) counts from the reviews, so a sheet made before the plan check keeps its tries.

## A strict plan check (C35)

- Rule 9 of the critic instructions and the brief of the plan check give the four kinds. The plan list now says, for each item, what is blocking and what is a note.
- `give_plan_review` refuses an answer with more than 3 blocking faults for one shot, a brief fault whose fact is not a fact of the brief of the entry, and a fault of the whole plan that names a shot with no fault of its own. It removes a fault of the whole plan that names a shot whose entry already has a blocking fault, and a fault that repeats word for word, before it checks the answer.

## Before the money (C36)

- The allowance is one retry of the two longest shots. The cost estimate is each sheet prompt of the cast of the plan and one start picture for each shot, at the strongest picture model (C27), plus each planned second and the retry at the video model that applies. A model with no known price counts at the cautious price of WP64.
- `set_story_plan` and `review_plan` store the estimate in `storyPlan.costEstimateUsd`. `@yumekit/project/plan-budget` writes the line from the plan and the limits, so the harness and the Story view say the same words with the limits of now.

## The Codex chat model (C37)

- The two variables are optional settings of the server, not secrets, and follow `YUMEKIT_CODEX_PATH`: the environment, or `yumekit keys set`. The server passes `-m <model>` and `-c model_reasoning_effort="<effort>"` after its own settings and before the prompt. An empty value is no value.
- The product names no model as a default. With no value, the turn is as before.

## Work package WP70

| Id   | Scope                                                                                                                                          | Needs      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| WP70 | The limit of the plan check, sheets before the check, the strict plan check, the warning before the money, and the Codex chat model and effort | WP68, WP67 |

## Details of WP70

These facts and choices came from the build of WP70 on 2026-11-24.

### The faults of the fourth run

1. The 5 stored reviews of the run (`review-1.json` to `review-5.json`), sorted by the builder. A repeat is the same fault twice in one review: once as a fault of the whole plan in free text, once with its shot id. The kinds (a) to (d) are those of C35.

   | Check | Stored | Repeats | (a) Brief fact | (c) Known limit | (b) Contradicts itself | (d) No contact or source | Fine point |
   | ----- | ------ | ------- | -------------- | --------------- | ---------------------- | ------------------------ | ---------- |
   | 1     | 14     | 2       | 4              | 3               | 2                      | 1                        | 2          |
   | 2     | 14     | 6       | 1              | 3               | 1                      | 0                        | 3          |
   | 3     | 5      | 2       | 0              | 0               | 0                      | 1                        | 2          |
   | 4     | 7      | 3       | 0              | 0               | 1                      | 0                        | 3          |
   | 5     | 4      | 2       | 0              | 0               | 1                      | 0                        | 1          |

2. The brief facts: lightning outside the blade (on the scabbard, in the air, on the ground), the calm face before the draw, both puddles in every shot, and the lightning that travels along the cut. The known limits: two hands on one prop close up, a clawed hand pressed to the body, a small contact target in a wide shot. The fine points: the scale of the crawler on its sheet, a heap of stone not named in a prompt, a likeness of the castle hall, of the quick draw, and of the drop into the castle, three actions in 2.5 seconds, a cut that a side view cannot show, a start that does not follow from the shot before, and a hero who hides the far lord.
3. With C35 the blocking faults of the checks would have been 10, 5, 1, 1, and 1 (an inference: the same critic does not answer the same way twice). With C33 the second check opens the gate in any case, about 13 minutes after the first.

### The parts

4. No tool is new, so the tool counts do not change. `review_plan` takes `person_asked_for_another_check`. `give_plan_review` takes `brief_faults`. The project has no new edit kind: the count, the notes, and the estimate go through `setBible`.
5. New fields: `storyPlan.failedPlanChecks`, `storyPlan.planNotes`, `storyPlan.costEstimateUsd`, `planNotes` of a shot and of a cast entry, and `review.briefFaults` (`castId`, `shotId`, `briefFact`, `restore`, `seen`). None of them is in the key of the plan check, so a note or an estimate does not ask for a new check. `set_story_plan` keeps the count and the notes of each shot id that stays, and `put_cast_member` keeps the notes of the entry.
6. A brief fault counts as restored when its `restore` text is in the facts of the entry, or, for a fault with a shot, in its start picture prompt or video prompt. The test ignores case, extra spaces, and a final period. A brief fault with no shot blocks each shot whose place or cast is the entry. A picture with no shot is not blocked by it.
7. A brief fault in the answer must copy a fact of the brief of the entry (the same test of words), name a cast entry of the plan, and name a shot of the plan when it names one. It counts as blocking and toward the 3 of its shot.
8. The cost estimate uses the strongest picture model of the service in use (C27), or the picked one, and the video model that applies. With no service, the sample server, or Codex, the estimate is 0. A model with no price for its unit counts at the cautious price of WP64.
9. The Story view reads the limits from `/api/media-servers` and writes the line with `planBudgetOf` of `@yumekit/project/plan-budget`, a new entry point that the editor may import (document 01). It shows each shot's open plan faults ("Plan check: ..."), and a plan check that is used up in plain words.
10. A restriction of a sheet counts as kind (c): it is a known limit of that sheet. So C26 still holds: the plan check refuses a shot that breaks a restriction.
11. A likeness to a known work is a note of the plan check, and stays blocking in the sheet review (C29). The sheet review judges the picture, and the plan check only the words.

### More findings of the live run

12. The key of the plan check no longer holds the sheet prompts and the restrictions of a cast entry. It holds the art direction, the story, each shot with its prompts and states, and the kind, name, description, facts, and brief facts of each cast entry. The pictures, the reviews, and the tries were never in it. So a new sheet try, its prompts, or a restriction does not lock the gate again. In the live run, the lead ran checks 8 and 9 (about 5 minutes each) only for that. This changes item 3 and item 11 of "Details of WP68".
13. `put_cast_member` states its limits in its description and in each field: 200 characters for one fact, brief fact, or restriction, 24 of each, and 4,000 characters for one sheet prompt. The live run failed three times on the limit of 200, with no hint.
14. The start screen takes a request of up to 20,000 characters, as the chat does, and says so at the limit: "The request is at its limit of 20,000 characters, so yumekit keeps no more. Shorten it, or send the rest in the chat after the start." `POST /api/home/projects` takes the same length (document 13). Before, the box cut a long brief at 4,000 characters with no message.
15. The answer of a first failed `review_plan` and the first-cut line of `get_work` say what C33 and C34 permit: sheet pictures now, and start pictures and clips after a pass or after the second fail.

### The real plan check on the plan of the fourth run

16. The run: a copy of `bible.json` of the fourth run as it was at its fifth check (14 shots, 31.5 seconds, 7 cast entries), with the stored review removed, the engine of this branch, a temporary configuration folder, no media key, Claude Code with `ANTHROPIC_MODEL=opus` (as in the fourth run), and `review_plan` called as the person three times.
17. Check 1: `fail` in 218 seconds (0.89 US dollars reported by Claude Code), with 3 blocking faults and 32 notes: two brief faults ("an Edo period town" dropped from the street, "slow, heavy blows" dropped from the wall) and one known limit (the small contact target of `through`, kind c). The fifth check of the fourth run, on the same plan with the old rule, had 4 blocking faults, of which 2 were repeats and 1 a fine point. The first check of the fourth run had 14.
18. Check 2: `fail` in 227 seconds (0.71 US dollars), with 3 blocking faults, all brief faults ("slow, heavy blows" of the wall, "fast, attacks from above" of the crawler, "the room moves for him" of the lord), and 29 notes. The gate opened: `failed_plan_checks` 2, no shot with open plan faults, because each blocking fault was a brief fault. Check 3 failed at once with `plan-checks-used-up`, with no critic turn.
19. After the gate opened, a start picture of `lord-eyes` failed with `plan-breaks-brief`, named the fact, and gave the text to restore in the facts of `lord`. After `put_cast_member` with that text, the same call passed the plan gate and stopped at the sheets (`cast-sheet-missing`). A start picture of `through` stayed blocked by the brief fact of the wall. A start picture of `walk` passed the plan gate and stopped at `calibrate-first`.
20. A sheet picture of the hero (`sheet_of` `hero`) ran at once after the second check, with the free Codex service. With C34 it could have run before the first check.
21. The two checks named different brief faults: the street in check 1 only, the crawler and the lord in check 2 only. One turn of the critic is not a stable judge of the brief either. C33 stops the loop that this caused; the brief faults that the critic did not name in the stored check do not block.

### The Codex chat model

22. Read on 2026-11-24: `codex exec --help` of Codex CLI 0.163.0 gives `-m, --model <MODEL>` ("Model the agent should use") and `-c, --config <key=value>` (a value parsed as TOML). The configuration reference (https://learn.chatgpt.com/docs/config-file/config-reference, no date) gives `model_reasoning_effort`: "Reasoning effort advertised by the selected model, such as `low`, `medium`, `high`, `xhigh`, `max`, or `ultra`. Available levels depend on the model and client." So yumekit checks no list of efforts and lets Codex judge.
23. A refused model ends the turn with `turn.failed` and the message "The '<model>' model is not supported when using Codex with a ChatGPT account." (code `model_not_found`). A refused effort ends it with "Invalid value: '<effort>'. Supported values are: 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', and 'max'." The server turns each into a failure that names the setting. The fake Codex of the tests prints both texts as the real program did.
24. The real check, through the built server: with `YUMEKIT_CODEX_MODEL` set to a Codex chat model that the account has and effort `high`, one picture of 1536 by 1024 pixels in 31 seconds. With a chat model that the account does not have and effort `high`, Codex refused the model in 5 seconds, and the server answered with the failure that names `YUMEKIT_CODEX_MODEL`. A direct `codex exec -m` with that model gave the same refusal, so the refusal comes from the service, not from yumekit.
25. Settings has no place for options of a server that are not keys: the key guide shows only the `keys` of a description, and the Codex server has none. The two variables are in the README of the server and in document 06. A place for such options in Settings is a follow-up.

### Follow-ups

26. A place in Settings for the options of a server that are not secrets (item 25).
27. A second turn of the critic, or a vote, for brief faults, because one turn names different ones (item 21).
28. The Story view could mark a brief fault that is restored. The harness knows it; the view shows each one that the stored check named.
29. From the owner's judgment of real clips: the clip critic rates a fault by how long it shows. A fault of a few frames at full speed is a note with a cut range, and the lead removes it with a two-part placement of the clip; it does not refuse the clip.
30. From the owner's judgment of real clips: stiffness is a fault of a clip. A clip where only one limb moves and the body does not move with the action counts against the clip.

## What went wrong in the fifth run

On 2026-11-25 the lead agent made a film of 14 shots. One accepted shot took 5 to 10 minutes: one start picture, a wait, a critic turn of 30 to 120 seconds, one clip with 60 to 120 seconds on the video service, a second critic turn, and only then the next shot. The 14 shots took hours, although the pictures, the clips, and the reviews of different shots do not depend on each other. Two more faults: the harness refused two start pictures that the person chose for a cut in the street ("starts where walk ended"), and 14 Gemini calls ended with only "status failed", while the service had answered `RESOURCE_EXHAUSTED`.

## Decisions of WP72

| Id  | Decision                                                                                                                                                                                                                                                                          | Why                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| P1  | Media calls of different shots run at the same time, with a limit for each service: 3 by default, 2 for Codex, lower with `limits.callsAtOnce`. Only the short write of the project is in a queue                                                                                 | The wait on a service is most of the time of a shot      |
| P2  | The spending limit and the video seconds limit hold the cost of a running call, so calls at the same time cannot pass a limit together                                                                                                                                            | Money stays safe                                         |
| P3  | A call waits only for what it needs. A shot with `continues_shot` waits for the kept clip of that shot, and the refusal names it                                                                                                                                                  | After the two calibration shots, each other shot is free |
| P4  | Reviews of different work run at the same time, with at most 3 critic turns. Never two reviews of the same work at once                                                                                                                                                           | A critic turn is 30 to 120 seconds                       |
| P5  | `get_work`, the story guide, and the instructions tell the lead to make all free shots in four steps                                                                                                                                                                              | The lead must know that it can                           |
| P6  | The editor shows each running call with its shot, its service, and its state                                                                                                                                                                                                      | The person sees what runs                                |
| C38 | Continuity is advice. A shot starts on the end picture of another shot only with `continues_shot` (the same camera, one unbroken action). Without it, a call in the same place as the shot before gets a note and is not refused. The plan check notes a missing `continues_shot` | A cut to a new camera position is not a continuation     |

## Details of WP72

These facts and choices came from the build of WP72 on 2026-11-25.

### The facts before the build

1. Nothing in yumekit put the calls of one lead in a line. The MCP SDK 1.32.2 starts the handler of each request with no wait (`Protocol._onrequest`). The bridge, the engine route, and `createHarness` await each call on its own. The project store writes in a queue (`createSerialQueue`), and a write takes milliseconds.
2. The lead's own program did. Claude Code 2.1.331 runs a tool of an MCP server at the same time as others only when its annotation has `readOnlyHint: true` (read in its program file: `isConcurrencySafe(){return ie.mayOverlap||(oe.annotations?.readOnlyHint??!1)}`). It runs up to 10 such tools at once (`CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`). `generate_asset` and the reviews change the project, so three of them in one step ran one after the other. Codex CLI 0.163.0 has the setting `supports_parallel_tool_calls` for each MCP server, off by default.
3. The critic was in a line twice: the critic desk of the harness and the critic desk of the engine each ran one turn at a time, and the critic tools found their review by "the one open review".
4. The spending limit already held the price of a running call (`SpendingBook.reserve`, the check and the hold with no wait between them). The video seconds limit counted only the clips in the project, so clips at the same time could pass it together.
5. The order rules: the plan check, the calibration shots, `review-first` and the rule of tries for each shot and sheet, and continuity (the next shot in the same place waited for the kept clip of the shot before). Each reads the project at the start of the call, so two tries of one shot at the same time could pass `review-first` together.
6. The services: the rate limit page of the Gemini API (aistudio.google.com/docs/rate-limits, read 2026-11-25, no date) gives Gemini Omni Flash 8 requests a minute and 40 a day on tier 1, no limit of requests at once, and "Specified rate limits are not guaranteed". The Codex server starts one `codex exec` for each picture, each in its own folder, and a test showed two at once. A critic turn is one agent program of the person.

### The parts

7. `generate_assets` takes 1 to 8 inputs of `generate_asset` and `review_several` takes 1 to 8 reviews (`review_start`, `review_clip`, `review_sheet`). Each part keeps every rule and answers on its own; the whole answer is a failure only when each part failed. The harness of the engine has 73 tools, and the lead sees 68. Why batch tools and not `readOnlyHint`: a client can run a read-only tool with no question to the person, and these calls cost money.
8. The Codex lead gets `mcp_servers.yumekit.supports_parallel_tool_calls=true`, so separate calls in one step also run at the same time there. Cursor is not checked.
9. The limit of a service: a description can give `calls_at_once`. The client runs `min(calls_at_once or 3, limits.callsAtOnce)` calls of one server at once, and the rest wait for a free place ("Waiting for a free place at <server>"). The price is held before the wait. `limits.callsAtOnce` is in `media-tools.json` only, not in Settings.
10. The work board of the harness holds each running media call and review: its id, its shot or cast entry, its service, its state (`waiting` or `running`), its start, and the video seconds it holds. It refuses a second call for the same asset id (`id-in-use`), the same shot (`shot-call-running`), or the same sheet (`sheet-call-running`), because each try needs its review first; and a second review of the same work (`review-running`). The video limit counts the clips in the project and the seconds on the board, and a call leaves the board only after its asset is in the project.
11. The critic desk of the harness runs at most 3 turns and gives each a review job id. The critic tools find their job by that id: the engine passes the job of the critic token, and a direct MCP client sends `_meta["yumekit/review-job"]`. The engine runs critic turns at the same time.
12. The write of a review reads the project and writes it in one queue of the harness (`writeLatest`), so two reviews that end together do not overwrite each other. The slow part (the end picture of a clip) runs before the queue.
13. `continues_shot` names an earlier shot of the plan (else `invalid-value`). It is in the key of the plan check, and the plan brief says how each shot starts. The refusal `waits-for-shot` has `waits_for_shot`. A shot whose continued shot was refused, a calibration shot, and a clip that the person kept (WP71) start from the plan, as in C26.
14. `get_work` gives "Free shots now" and, for each other shot, what it waits for: the plan check, the calibration shots, a lesson, the shot it continues, or a passed sheet.
15. The editor reads `GET /api/work` and the event `work-changed`, and shows "Making now" above the chat box and in the making screen: each call with its shot or entry, its service ("the critic" for a review), and "Waiting for a free place" or the time it runs.
16. The steering guard of WP71 (`person-message-waiting`) also covers `generate_assets`.

### The service quota

17. A Gemini interaction that ends with a status other than `completed` gives the code and the message of each entry of its `errors` ("... with the status failed: RESOURCE_EXHAUSTED: <message>"). An API error gives its `status` before its message. Neither gives the key or a header.
18. A message with `RESOURCE_EXHAUSTED` has `_meta: { "yumekit/failure": "service-quota" }`. The client gives the failure `service-quota` with the server and the message, and the hint says that the quota of the service for this model is used up, and that the person can wait or pick another service.
19. After the first `service-quota` of a group, `generate_assets` sends no more calls of that group to that service: each call that still waits for a place answers `service-quota` with "yumekit did not send this call". The calls that already run finish.

### The tests

20. Through the public interface, with the priced test server (a wait, and a record of when each call starts and ends) and the fake critic (a wait and a count of turns at once): three pictures in one call run 3 at once and take less than three waits; `callsAtOnce` 1 runs one at a time; four calls run 3 at once; three clips of 2 seconds with a limit of 5 seconds send 2 to the service; three pictures of 0.40 US dollars with a limit of 1 send 2; the same asset id twice is refused; a quota stops the rest of a group; four sheet reviews run 3 critic turns at once; two reviews of one sheet are refused; a shot with `continues_shot` waits and names the shot; a cut gets a note; `get_work` names the free shots. The Gemini server: a failed interaction with `RESOURCE_EXHAUSTED`, a 429 answer, and a failed interaction with no errors.

### The real check

21. The run: a project of 6 shots in one place, made with the harness of this branch and the fake critic up to the point where the plan check passed, the two sheets passed, and the two calibration shots had kept clips, so 4 shots were free. Then two copies, each opened with `yumekit open` of this branch, the free sample server as the only media server, and Claude Code 2.1.331 with `ANTHROPIC_MODEL=sonnet` as the lead and as the critic. Each copy got one chat request.
22. Together: the request asked for the four shots with no word about tools. The lead read `get_work` and called `generate_assets` with 4 start pictures, `review_several` with 4 `review_start` (3 critic turns at once, the fourth waited for a place), and `generate_assets` with the 4 clips. 46.5 seconds from the request to the answer. The editor showed "Making now: 4" with 3 reviews running and 1 waiting.
23. One by one: the request asked for one tool call in each step. The lead called `generate_asset` and `review_start` for each shot in turn. 72.3 seconds.
24. In both runs the critic failed each start picture, because the sample server draws the prompt as text on a plain color, so no clip ran (`start-failed-review`). The measured gain is the critic turns of 4 shots: 46.5 against 72.3 seconds. With a real video service each clip waits 60 to 120 seconds, and the clips of free shots now overlap too; that gain is an inference, not measured here.

## What the models got in the sixth run

On 2026-11-25 the owner asked to see what yumekit sent to the video model. He asked if the model or our instructions were bad. The builder of WP73 read the source record of each asset of the run `trailer-v3` and the lessons of its plan. A record keeps the prompt that the harness sent. Only the sentence of a camera move is missing from it, because the record keeps the move as the id `camera_move`.

| Prompt  | Calls | The lead wrote (median) | yumekit added (median, largest) | What yumekit added                                                                                  |
| ------- | ----- | ----------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Clip    | 27    | 640 characters          | 1,602, 1,893, and a camera move | The first frame sentence, all 7 lessons of the film, and the sentence of `static` (25 clips)        |
| Picture | 55    | 869 characters          | 6,232, 8,198                    | The art direction (55 pictures), a sentence with the facts of each cast entry, and all lessons (37) |

A close shot of a blade on a stone shoulder got "For the crawler on all fours, state where each of its two hands is". A lesson is advice to the lead on how to write a prompt. Most lessons name other characters and other actions than the shot. So this part of the instructions was bad, and the model got text about other shots.

The owner then set the rule for all additions, in his words: "Why can't the lead be instructed to add it? it can be a skill for the lead that tells it to provide all useful information to ensure cohesion and consistency, why do we need to have a dumb blanket rule?" He also said: "trusting the lead is what is important".

## Decisions of WP73

| Id  | Decision                                                                                                                                                                                                 | Why                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| C39 | A lesson never goes into a prompt for a picture or video model. It goes to the lead only, outside the prompt                                                                                             | A lesson is advice to the lead, and most lessons concern other shots                    |
| C40 | yumekit adds nothing to a prompt for a picture, video, or music model. The model gets the prompt of the lead byte for byte. `get_shot_brief` gives the lead what a complete prompt needs                 | Trust the lead. A model knows only its prompt and its pictures, so the lead writes both |
| C41 | The person can read every request. The view "Requests" in Files lists each media call of the project, also a failed one. `list_media_requests` gives the lead the same list                              | The owner could not see what a model got, or why a call failed                          |
| C42 | A limit that the person sets in Settings belongs to the project. The engine writes it to the `media-tools.json` of the open project                                                                      | A run lost its limits when its private configuration folder was removed                 |
| C43 | No test can reach a paid service. One guard in each test project removes the media keys, gives each test file an empty configuration folder, and fails a request to a host that is not local or declared | A test inherited `OPENAI_API_KEY` from the shell and picked the `openai` server         |

## Lessons for the lead only (C39)

- The answer of `record_lesson` lists each lesson of the film in `lessons_for_you` and as numbered lines. It says that yumekit sends no lesson to a model.
- `get_work` says the same before its list of lessons.
- `get_shot_brief` lists the lessons too.
- A picture or clip call with `shot_id` answers with the block "Lessons of this film, for you" and `lessons_for_you`. The lead decides which lesson concerns the shot.
- This replaces the lessons in prompts of C28. Calibration and `lessons-missing` stay.

## A prompt as written (C40)

- `generate_asset` sends `input.prompt` as the call gives it. For the first try, it sends the prompt of the plan (C22).
- The harness adds no art direction, no sentence of the cast, no lesson, and no sentence about the first frame. It adds no camera sentence, no restriction, and no plan note. A defect that changes the prompt throws.
- The answer gives `prompt_from_you` (the prompt for the model) and `prompt_characters`. Its line says: "The prompt for the model is exactly as you wrote it".
- A video prompt over 900 characters gets a note with its length in the answer, and a warning in `set_story_plan`. It is not a refusal.
- `get_shot_brief` takes `shot_id`, and the `server` and `model` of the clip. It gives the facts of that shot only:
  - the action, the camera, the start state, and the end state;
  - the art direction;
  - each person, place, and prop of the shot, with its description, facts, brief facts, restrictions, plan notes, and sheet pictures;
  - the plan notes of the shot, and the prompts of the plan;
  - the lessons, and the known limits that the plan check named for the shot (each known limit before a plan check);
  - the limits of the picture model and the video model in use: a first frame, a last frame, references, and the lengths.
- `get_work` points to `get_shot_brief`.
- Four texts tell the lead how to write. They are rule 41 of the AI instructions, step 6 of the server instructions, the story guide, and the skill. They say:
  - Write each prompt complete and self-contained.
  - The model knows nothing but the prompt and its pictures.
  - State the look of every character and of the place in your own words when the picture does not carry it.
  - Keep a video prompt short and about this shot only.
- The checks of a result do not change: the start picture against its sheets, and the clip against its first frame.

## The record of requests (C41)

- `@yumekit/tools` records each call of `MediaTools.run` in `<project>/.yumekit/requests.json`, next to the record of paid calls.
- The record holds a call that a service made or failed. It also holds a call that the spending limit or a missing key refused.
- The harness records a clip that its video seconds limit refused, with `MediaTools.recordRefusal`.
- A refusal of a rule of the story (a plan check, a review) is not a media call. The record does not hold it.
- `MediaTools.requests()` gives the records, the newest first. `GET /api/media/requests` gives them to the editor.
- `list_media_requests` gives the lead the newest 20, or `count` up to 50. `failed_only` gives only the failed ones.
- The view "Requests" is a tab of the Files view. Files lists what each call made. Requests lists the calls that made it and the calls that failed, so the two belong together. The Story view shows only the shots of a story film, and most requests (voice, music, sheets) are not shots.

## Limits of the project (C42)

- `MediaTools.setLimits` writes `limits` of `<project>/media-tools.json`, and keeps each other field of the file.
- Before, it wrote the user file. A limit of a project file wins over the user file, so the field of Settings could do nothing.
- The user file still gives the limit of a new project, and the person edits it by hand. Settings names each limit "in this project".

## The test guard (C43)

- The guard is in `packages/tools/src/testing/guard`.
- `globalSetup.ts` runs once for a test project:
  1. It points `YUMEKIT_CONFIG_DIRECTORY` at an empty temporary folder.
  2. It starts each server of `tools/` from its source, and reads the `keys` of its description.
  3. It removes each of those variables from the environment.
- `nodeTestGuard.ts` runs before each test file. It removes the keys again, and gives the file its own empty configuration folder. A test that sets the folder itself wins. It also replaces `fetch`.
- `browserTestGuard.ts` replaces `fetch` in the browser projects.
- The guarded `fetch` lets through 127.0.0.1, `localhost`, `::1`, the page of a browser test, and each host that a test declares with `allowTestHosts`.
- Any other request fails with "A test asked for <address>. No test may reach a real service". The test then fails, also when the code under test caught the failure.
- A media server runs as its own process, where the guarded `fetch` does not reach. That server gets no key: the keys are gone from the environment, and the configuration folder has no key file. A hosted server checks its key before a request.

## Work package WP73

| Id   | Scope                                                                                                                                       | Needs      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| WP73 | Lessons and every other addition out of prompts, the shot brief, the record and the view of requests, limits of the project, the test guard | WP72, WP64 |

## Details of WP73

These facts and choices came from the build of WP73 on 2026-11-25.

### What yumekit no longer adds

1. Each addition that WP73 removed, and where it was:

   | Addition                                                                                   | Where it was                                                           | For                                                                           |
   | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
   | "Lessons of this film: ..."                                                                | `withPromptAdditions` in `storyPlan/promptAdditions.ts` of the harness | Each picture and clip of a project with a lesson                              |
   | "Art direction: <style>."                                                                  | The same function                                                      | Each picture, and each clip with no first frame                               |
   | "The first picture is the exact first frame of one continuous shot with no cut; ..." (C31) | The same function                                                      | Each clip of a shot with a first frame                                        |
   | "<name>: <description>. Fixed: <fact>; <fact>." for each cast entry (C3)                   | `withCast` in `cast/castRequest.ts`                                    | Each picture, and each clip with no first frame, with `cast_ids` or `shot_id` |
   | The sentence of the camera move (document 16, N2)                                          | `inputWithCameraMove` in `media/videoChoices.ts`                       | Each clip with `camera_move`                                                  |
   | The camera move of the plan as `camera_move` of the call, and so its sentence              | `shotRequestOf` in `storyPlan/shotRequest.ts`                          | Each clip of a shot whose call gave no `camera_move`                          |

2. Restrictions and plan notes were never in a prompt. They go to the critic and to the plan check, and now to `get_shot_brief`.
3. Some parts of a call stay, because they are not text in the prompt:
   - the sheet pictures of `cast_ids` and of the cast of a shot, as reference pictures of a picture call. The pictures of the call go first, up to the maximum of the model;
   - the refusal `first-frame-only`;
   - the strongest model for a sheet and a start picture (C27);
   - `camera_move`, as a record of the move.
4. The editor writes the sentence of a camera move into its own prompt when the person picks a move in "Make a real video clip". The person picked the move, so the sentence is part of the prompt of the person. When the sheet opens on a clip again, it shows the prompt without that sentence and picks the move.
5. Two servers of yumekit still wrap a prompt, because their service needs it:
   - The Codex picture server gives the Codex program an order around the prompt. The order says: make one picture and run no other tool. It gives the shape and the references, and then "Picture: <prompt>".
   - The Gemini music server adds the length and the instrumental sentence from its settings, because Lyria takes the length only in the prompt.

   Neither adds a fact, a lesson, or a style. They are not in `prompt_from_you`, because the harness does not see them.

### The parts

6. The harness of the engine has 75 tools, and the lead sees 70. `get_shot_brief` and `list_media_requests` are new, and both are read-only.
7. The record file is `{ "requests": [...] }`, with sorted keys, 2 spaces, and a final newline (document 03). Each record has these fields:

   | Field                    | Meaning                                                             |
   | ------------------------ | ------------------------------------------------------------------- |
   | `at`, `seconds`          | When the call started, and how long it ran                          |
   | `capability`, `asset_id` | What the call made, and the asset id of the call                    |
   | `shot_id`                | The shot of the call, when it names one                             |
   | `server`, `model`        | The service and the model                                           |
   | `prompt_from_you`        | The `prompt` of the call, or the `text` of a voice                  |
   | `pictures`               | Each picture sent, with `role` and `file` (the path in the project) |
   | `settings`               | Each other input with a plain value, such as `duration_seconds`     |
   | `usd`, `basis`           | The cost of a charged call                                          |
   | `files` or `failure`     | The files made, or the `kind` and the text of the failure           |

8. The role of a picture is `first-frame`, `last-frame`, `reference`, or `media`. The record never holds a header.
9. A server can echo its key in a failure. So the tools write `[<VARIABLE>]` in place of the value of each key that a server declares, in the prompt and in the failure text.
10. The record keeps the newest 500 requests.
11. When the record file is not valid, `MediaTools.requests()` fails with `request-log-not-valid`. yumekit then adds nothing to it until the person removes the file. Media calls still run: the record is for the person, and no money depends on it.
12. A call to a service that does not exist (`server-not-found`) keeps the name that the call gave. When the usage limit of a plan refuses a call and yumekit sends it to another service, the record holds two requests.
13. The view shows each request as a card:
    - "Made" or "Failed", the kind in words, the asset id, the shot, and the time;
    - the service and the model, the cost ("Free", "Not charged", or "About $0.40"), how long it ran, and the settings in words;
    - each picture sent, with its role ("Start picture", "Reference");
    - the prompt with its length, in four lines with "Show the whole prompt";
    - the file made, or the failure text with its kind.
14. "Only the failed ones" filters the list. The view reloads when the work of the AI changes.

### Follow-ups

15. A paid check that a start picture prompt from `get_shot_brief` holds the sheets as well as the old additions did. The critic of the start picture catches a weak prompt before its clip.
16. A choice in Settings to keep more than 500 requests.

## What went wrong in the sixth run

On 2026-11-25 a real run of 13 hours made a 35 second anime trailer. The plan of that run was a list of 14 shots with no story behind them. The owner rejected the film. His words:

- "the words like the night is not empty, some doors don't hold etc. are such generic bullshit words that make no sense there is no story or context. We first need to define the overarching story not just the scenes, what is the full story of the anime, hero's background, villain's background etc. Then, try to make a trailer, it should be clear that we're making a trailer"
- "we didn't need to show the hero killing crawler and stone guy, this is just the trailer, not the full movie"
- "All scenes are not happening right one after the other ... two fights happen back to back in the street and then final encounter underground ... that's not a movie or a movie trailer, that's just all of it in a 34 second clip it makes no sense"
- "between the scenes I'd like a black screen ... with text that gives a brief message like a trailer does, it should look professional like a real cinematic trailer"

The cause in one sentence: yumekit had a place for shots but none for the story behind them, no idea of the form of the film, and no scene for a card between shots, so the lead planned every event in order and wrote words that fit any film.

## Decisions of WP74

The product principle of the owner for this package: trust the lead, give it full information and good guidance, and check results. Do not add blanket rules that block.

| Id  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Why                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| C44 | A story comes before shots. `bible.json` gets `story`: the premise in one sentence; the world and its rule; each main character with background, want, fear, and what they do not know; the opposing force and why it acts; the arc in 3 to 6 steps; what stays unknown at the end. The tool `set_story` writes it. `get_work` and the Story view show it first, above the shots. A plan with shots and no story gets a note from `set_story_plan`, not a refusal. A cast entry links to a character of the story | A list of shots with no story gives generic words and scenes                  |
| C45 | The film has a form: `form` of the story plan is `trailer`, `short`, `explainer`, `music-video`, or `other`. The story guide gives the craft of each as advice with reasons, and the usual parts of a trailer                                                                                                                                                                                                                                                                                                     | A trailer that shows every fight to its end reads as the whole film           |
| C46 | Every word on screen and every spoken line comes from the story. A shot and a card can carry `story_fact`, the id of a part of the story. A card or a line with no story fact gets a note. The guide gives the test: a line is good when it could belong to this story only                                                                                                                                                                                                                                       | "the night is not empty" could belong to any film                             |
| C47 | A trailer card is a kit scene, `trailer-card`, with `variant: "title"` for the title. It costs nothing and uses the fonts and the look of the project. A card lands on a measured hit of the music when `check_music` measured one, else on the beat grid, and the answer says which                                                                                                                                                                                                                              | "a black screen ... with text ... like a real cinematic trailer"              |
| C48 | The person approves the story before money, as a free step: after `set_story`, the lead shows the story in plain words and asks for a yes or changes, unless the request said to go ahead without asking. An instruction and a `get_work` line, not a gate                                                                                                                                                                                                                                                        | A wrong story wastes every paid shot after it, and the question costs nothing |
| C49 | The story guide and `skills/yumekit/SKILL.md` get "Story first", with the reasons of the sixth run and one worked trailer built from an invented story                                                                                                                                                                                                                                                                                                                                                            | A lead follows a reason better than a rule                                    |

## The story (C44)

- `story` has `premise`, `world`, `worldRule`, `characters` (each with `id`, `name`, `background`, `want`, `fear`, `doesNotKnow`), `opposingForce` (`id`, `name`, `what`, `why`), `arc` (3 to 6 steps, each with `id` and `text`), `unknownAtEnd`, and `approval?`.
- The parts of the story have ids for `story_fact`: the fixed ids `premise`, `world`, and `unknown`, and the id of each character, of the opposing force, and of each step of the arc.
- `set_story` replaces the whole story as one undo step, through `setBible`. It refuses an id that two parts share, or a fixed id, with `id-in-use`. Its answer lists the ids and says what to ask the person.
- `put_cast_member` takes `story_character_id`, the character or the opposing force that the entry plays.
- `get_work` gives "### The story" in the story part, after the voice and before the cast and the plan, with the id of each part in brackets.
- The Story view shows the story first: the premise, the answer of the person in plain words, the world and its rule, each character with what they want, fear, and do not know and the sheet that draws them, the opposing force with its reason, the arc, and what stays unknown.

## The form (C45)

- The story guide has "The form decides the structure": the craft of each form with its reason, and the usual parts of a trailer (the world as it was, the break, the stakes, the rise, the title), with what to leave out.
- `set_story_plan` notes a plan with no form, and gives the craft of a trailer in its answer for a trailer. The Story view shows the form above the logline.

## Words from the story (C46)

- A shot has `story_fact`. A card has the prop `storyFact`. The Story view shows "From the story: ..." in each shot row.
- Notes, never refusals: a card with no story behind it, with no `storyFact`, or with a `storyFact` that the story does not have; a shot whose `story_fact` is not a part of the story; a shot with words in quotes in its prompts and no story fact.

## The trailer card (C47)

- `trailer-card`: black, or the background of the look, or a still frame behind; one or two short lines in the display or body font of the look, with wide tracking; a fast fade in, a slow push, a hard cut out, and an optional flash of one frame on the beat where the words land. `variant: "title"` draws the name of the film larger.
- `check_music` measures the hits of a track. The answer of `put_scene`, `put_work`, and `set_timeline` says where each card lands: on a measured hit, on a beat of the grid, or between beats, with the nearest hits.

## The person approves the story (C48)

- Rule 42 of the instructions of the AI and step 6 of the server instructions: after `set_story`, end the turn, show the story in plain words, and ask for a yes or changes. A request to make a film is not a yes to its story. Skip the question only when the request says in words to go ahead without asking.
- `get_work`, the answer of `set_story`, and a note of `set_story_plan` say when the person has not said yes yet. No tool refuses for it.

## Story first in the guide and the skill (C49)

- The story guide starts with "Story first" (the faults of the sixth run and the order of work), then the form, the words, the cards, and later "A worked example: a trailer built from its story". `skills/yumekit/SKILL.md` has the same section in short.

## Work package WP74

| Id   | Scope                                                                                                                      | Needs |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----- |
| WP74 | The story and its tool, the form, story facts, the trailer card and the measured hits, the answer of the person, the guide | WP72  |

### Checks of WP74

1. `set_story` stores and returns the story; `set_story_plan` notes a plan with no story and saves it; the guide gives the forms and the parts of a trailer; the notes of a story fact fire for a card and a shot made to trigger them.
2. A real render of `trailer-card` with its settings: black before its beat, the flash on it, the words, and black after the hold. A card on a measured hit and a card on the grid, each stated in the answer.
3. The Story view shows the story first, in a browser test.
4. A free real check with Claude Code as the lead on an empty project with sample media: a 20 second trailer of an original story.

## Details of WP74

These facts and choices came from the build of WP74 on 2026-11-25.

### The parts

1. The harness of the engine has 76 tools, and the lead sees 71: `set_story` is new. The project has no new edit kind: the story, the form, the story facts, and the hits go through `setBible`.
2. The kit already had `title-card`: an opening title with an accent circle that grows in and left aligned words that rise in. It does not fit a cinematic card, and a mode that changes all of its drawing would be two scenes in one. So the new scene is `trailer-card`, and `variant: "title"` is its larger form. The kit has 27 scenes.
3. The props of `trailer-card`: `lines` (1 or 2, at most 60 characters each), `variant` (`card` or `title`), `face` (`display` or `body`), `scale` (0.5 to 2), `tracking` (0 to 0.6 em; 0.28 for a card and 0.14 for a title by default), `capitals` (true by default), `color`, `background` (`black` or `look`), `backgroundAssetId` (a picture or a video, shown from its start and darkened by 62 percent), `landsOnBeat` (0 to 16), `holdSeconds`, `flash`, and `storyFact`, which does not draw.
4. The motion: the words fade in over 0.12 seconds from their beat. They push from 1 to 1.05 times their size until the end of the hold, and a still behind them pushes from 1.04 to 1.10 times over the clip. At the end of the hold the words cut to black with no fade. The flash is one frame of warm white (#f2eee6) on the frame where the words land. A calm look has no push and no flash. A clip too short for its beat brings the words in sooner, as each kit scene does, so a clip of one frame shows them.
5. The colors: black (#000000) by default. `look` takes the background of the look, also the own colors of `set_look`. The words take `color`, else the text color of the look when its contrast on the background is 4.5 or more, else warm white.
6. Two text roles join the type scale: `filmCard` (5.6, 6, and 6.2 units in wide, square, and tall) and `filmTitle` (12, 11, and 11). The words sit between the side margins of the film grid, in the true middle of the picture, and out of the caption area.
7. The hits: `measureMusicCurve` of `@yumekit/render` gives `hits`. It reads the level in windows of 20 milliseconds. A hit is a window at least 9 dB over the mean of the 10 windows before it, and at most 14 dB under the loud level of the track (the 95th percentile of all windows). Two hits are at least 0.3 seconds apart, and a track gives at most the 48 strongest. `check_music` stores them in seconds of the track as `hits` of the music check, and lists them in film seconds from the best start. A test track with two bursts at 1.0 and 2.5 seconds gives exactly those two hits.
8. The landing: the words land at the start of the clip plus `landsOnBeat` beats (half a second for a beat with no tempo, as in the film kit), minus the scene start of the clip. The hits are those of each audio clip in the video whose asset has a music check with hits, moved by the start and the asset start of the clip. On a hit means within 2 frames. On the grid means within 1 frame of a whole or a half beat. `put_scene` (for that card), `put_work`, and `set_timeline` add one line for each card clip and `card_landings` with `lands_on`: `hit`, `beat`, or `off`. `get_work` lists the cards with their lines, their story fact, and their landing.
9. The harness never moves a card. "Cards land on measured music hits" is reached by the measured hits, the guide, and an answer that says where each card landed. A snap of the start could move a cut that the lead chose, or make a card overlap a shot. This is the principle of the package: full information, no blanket rule.
10. The answer of the person: `story.approval` is `person-said-yes` or `request-said-go-ahead`, or it is absent. `set_story` keeps an approval only when the story stays the same word for word, so a changed story is asked again. The person answers in the chat, and the lead records the yes with a second `set_story` call. No tool refuses for a missing yes. The first real run (item 16) showed why the words "end the turn" are needed: with "before any money", the lead of a free graphics film did not ask, and it stored `request-said-go-ahead` for a request that did not say it.
11. A spoken line has no field of its own. The story fact of its shot covers it. A shot whose start picture prompt or video prompt has words in quotes and no story fact gets a note. This is a word test, so it is a note.
12. `put_cast_member` notes a person with no `story_character_id` when the project has a story, and a link to an id that is not a character or the opposing force of the story.
13. The key of the plan check does not hold `form` or `story_fact`, because they do not change a picture. The critic of the plan does not see the story yet.
14. The instructions of the AI get rule 42 (rule 41 is the one of WP73). The server instructions name `trailer-card` in step 3, and `set_story`, the question to the person, the form, the story fact, and the cards on the hits in step 6. `list_kit_scenes` names `trailer-card` for a trailer.

### The real check

15. The setup: a temporary configuration folder, the sample server as the only media server, an empty project, and Claude Code 2.1.332 with `ANTHROPIC_MODEL=sonnet` as the lead. The request: "Make a 20 second trailer for an original story about a lighthouse keeper."
16. The first run, in a `graphics` project, with the first words of C48 ("before any money"): the lead read `get_work`, `list_kit_scenes`, `list_media_tools`, `get_project`, `get_story_guide`, and `get_scene_guide`, then called `set_story` before any scene. It drew the lighthouse with custom scenes and made 3 cards and a title, each with a `storyFact`: "One hundred years. / The lamp has never gone dark." (`world`), "Tonight, something / signalled back." (`the-answer`), "If the light dies, / the drowned come home." (`the-tide`), and "The Last Light" (`premise`, with the flash). 114 seconds. It did not ask about the story, and it stored `request-said-go-ahead`, which the request did not say. So the instructions now say "end the turn", and that a request to make a film is not a yes to its story.
17. The second run, in an `ai-video` project, after that change: in 22 seconds the lead called `get_work`, `get_story_guide`, and `set_story`, and ended its turn with the story in plain words and "Do you want me to go ahead with this story?". After "Yes, go ahead with this story." it stored `person-said-yes` and made the film in 94 seconds: the look, tempo 96, `put_work` with 4 custom scenes and 3 cards, `set_transitions`, `preview_scenes`, and `contact_sheet`. The cards: "The light must / never go dark" (`world`), "It is calling her / in her mother's voice" (`the-call`), and the title "The Keeper's Light" (`premise`, with the flash). Each card lands on a beat of the grid (beats 7, 19, and 28), because the film has no music: the lead does not use the test service for music. No moment shows whether Maren relights the lamp, which the story keeps unknown.
18. The render of the second run: 20 seconds, 600 frames. The cards are black with the words in the middle, and the frame where the title lands is one frame of warm white.
19. A gap that the runs found: neither run wrote a story plan, because the lead drew each moment by code. The only media service was the test server, and the lead does not use its clips of plain color in a film. With no plan, the film has no `form`, because C45 puts the form on the plan, and a film with no AI video has no plan ("Not in this version"). The lead still followed the craft of a trailer from the guide. A form on the story itself, or a plan for a film with no AI video, is a decision for the owner.

### Follow-ups

20. The form of a film with no story plan (item 19).
21. The critic of the plan sees the story and the form, and judges whether a trailer shows how a conflict ends.
22. A field for a spoken line of a shot, with its speaker and its story fact.
23. A button in the Story view for the yes of the person, so the person does not need the chat.
24. A tool that places a card on a hit by itself, if real runs show that the lead often misses the hits.
