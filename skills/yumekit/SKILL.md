---
name: yumekit
description: Set up yumekit on this computer and make a video with it. Use when a person asks to install yumekit, to make or change a video with yumekit, or to connect an agent to a yumekit project.
---

# yumekit

yumekit makes short videos on the computer of the person. It has no server and no account. This file tells an agent how to set it up and how to make a video with it.

## Rules

- Never ask the person to paste a key or a token into the chat. A key goes in through `yumekit keys set <VARIABLE>`, which reads it from a hidden prompt that the person types into.
- Never export a video unless the person asks. An export takes minutes.
- Never pick a paid model unless the person asks for it or the project has the style `ai-video` or `mix`.
- Tell the person each command that you run, in one plain sentence.

## Set up

1. Check Node.js: `node --version` must be 22 or later. If it is older or missing, tell the person to install Node.js 22 from https://nodejs.org, and stop.
2. Install yumekit: `npm install -g yumekit`.
3. Check the computer: `yumekit doctor`. It prints one line for each need, with "ok" or what to do.
4. If the line for the browser is not "ok", run `yumekit setup`. It downloads the browser that draws the video.
5. If the line for FFmpeg is not "ok", run the install command that `yumekit doctor` printed for this system.
6. Run `yumekit doctor` again. Continue when it exits with 0.

## The easy way: the person uses the screen

1. Run `yumekit`. It prints an address and opens the start screen in the browser. It runs until the person stops it, so start it in the background or in its own terminal.
2. Tell the person to pick a template ("A trailer", "A movie", or "A video"), to write the idea in the box, and to click "Start". yumekit then asks the AI program of the person (Claude Code, Codex, or Cursor) to make the video. The AI asks its questions on a card in the chat, and each step of the work comes back as a take to review.
3. The projects are folders in `~/Documents/yumekit`.

## The agent way: you make the video with the yumekit tools

1. Make a project folder: `yumekit init <folder> --name "<name>"`.
2. Connect your agent program to it: `yumekit agent connect --agent claude-code --project <folder>`. Use `codex` or `cursor` for those programs. For another MCP client, the server command is `npx -y yumekit mcp --project <folder>`.
3. Start a new session of the agent program in that folder, so it loads the yumekit tools.
4. Follow the instructions that the yumekit server gives with its tools. The usual order:
   1. `get_project` first.
   2. `set_script` with one line for each scene.
   3. `list_kit_scenes`, then `put_scene` for each scene. Prefer a kit scene. Before custom scene code, read `get_scene_guide`.
   4. `preview_scenes` to look at each scene during its entry and after it settled.
   5. `generate_asset` for a voice, then `place_narration`.
   6. `set_timeline`, then `set_transitions` once for the whole video.
   7. For a later change, use the smallest tool: `replace_narration` records the voice again, `replace_music` changes the music. Write the whole timeline only for a new video.
5. To let the person watch and change the video, run `yumekit open <folder>`.
6. Export only on request: the person clicks "Export" in the editor, or you call `render_video`.

## Make a film with the person

The person shapes the film in steps, and each step is a take that the person reviews in the editor. In the run behind this flow, the person found faults in three rounds of pictures before any money went to clips. The project screen shows your work only in a take.

1. Ask first. When the request leaves open a choice that changes the film, ask 3 to 6 short questions in a round with `ask_person`, each with a few short options. The person can always answer in their own words. Then end the turn. When the answers come, say what you take from them, and ask again only when a choice is still open. `ask_person` works in the chat of the editor. In your own session, ask the same questions in your answer.
2. Write the whole story, and give it to the person in a take of the story. Spend no money before the yes.
3. Write the plan. When the film is too long to make at once, split it into chapters of about 1 to 3 minutes, and say the split in one message.
4. For each chapter, make a take of the pictures, then a take of the clips and the music, then a take of the cut. Start each with `open_take`, and end each with `ready_take`. Give each item an honest note: what it is, and what you see wrong in it. Give each clip, music, and cut `what_to_check`, because you cannot watch motion or hear sound. Then end the turn.
5. Read the notes of the person. Make again only what the person marked. An item with no note is approved, and a take with no note means: go on.
6. When a take is ready, give the price of the next step. When the money left does not cover it, say so before the work, and offer fewer items. Only the person raises a limit.

`get_story_guide` gives each step in detail, with its craft.

## Story first

For a story film (a trailer, a short, an anime), write the story before any shot. A run once made a trailer from a list of 14 shots with no story behind them. The words on screen were generic ("the night is not empty"), the hero won each fight on screen, and two fights and the final encounter came one right after the other. The person rejected it: a trailer shows moments of a longer story, and it was the whole film pressed into 34 seconds.

1. Write the whole story with `set_story`: the premise in one sentence, the world and its rule, each main character (background, want, fear, and what they do not know), the opposing force and why it acts, the arc in 3 to 6 steps, what stays unknown, and the `form` of the film.
2. A request to make a film is not a yes to its story. Skip the take of the story only when the person said in words to go ahead without asking.
3. Write the plan with `set_story_plan`, with the `story_fact` of each shot. A trailer raises a question and never shows how a conflict ends.
4. Put a `trailer-card` between the moments of a trailer, with its `storyFact`, on a hit that `check_music` measured, and end on a `trailer-card` with `variant: "title"`.
5. Test each line on screen: it is good when it could belong to this story only.

An example. The story: in a village where a bell under the frozen lake rings once before each death, a girl who hears it ring for her grandfather goes under the ice to silence it; the keeper of the bell rings it so that nobody dies without a goodbye. The trailer: the girl and her grandfather pull a net from the ice (the world as it was); the card "Every winter, the lake keeps one sound"; frost spreads from under her boot (the break); the card "Tonight it rang for him"; she takes the ice saw from the wall (the stakes); three short moments under the ice (the rise); the title on the biggest hit. It never shows the face of the keeper or how the story ends.

## Craft from the trailer runs

Each line is a principle with its reason. Break one when the film needs it, and know why.

- Show the stakes. Show what the hero loves before the loss, because a viewer feels a loss only after seeing what was lost. In a fight, the enemies fight back and the hero is in danger, or nothing is at stake.
- Put a wide shot before the close ones. A close shot means something only when the viewer knows the place and who is near.
- A trailer is moments from different times and places of a longer story. It never shows how a fight ends, because the viewer must want to see the film.
- Every place makes sense as a place that people built and use. A pond in the middle of a road reads as fake, and the viewer stops trusting the film.
- A character keeps one voice. A video model gives each clip a new voice unless each prompt names the same voice.
- No character jumps place between two shots of one moment. Show the move, or the viewer reads it as a mistake.
- Every word on screen comes from the story. A line is good when it could belong to this story only.
- The music comes before the cut. Cut the shots and land the cards on the beats and the hits of the music that the person chose.

## A film in batches

A 30 second film should take about 10 minutes of work, not hours. Make the work of each take in batches, each in one `generate_assets` call: all sheets, all start (and end) pictures, all clips, then the music. `get_work` names the next batch, what is ready for it, and the time of each stage against the target.

1. The checks of the project decide who checks a batch. In `draft` (the default), check the design of all pictures, then of all clips, with one `check_design` call each. In `critic`, the critic checks each batch with `review_several`.
2. Only a break of the design blocks: a picture with a break cannot start a clip, and a clip shows only its clean part. Every other fault is a note, and you decide.
3. In `draft`, call the critic (`review_plan`, `review_start`, `review_clip`) only when the person asks for a second look.
4. While "Approve pictures before clips" is on, a clip starts only from a picture that the person approved in a take.

## Prompts for a picture, video, or music model

yumekit sends each prompt exactly as you write it, and adds nothing. The model knows nothing but your prompt and the pictures it gets.

- Write each prompt complete and self-contained.
- State the look of every character and of the place in your own words when the picture does not already carry it.
- Keep a video prompt short (under 900 characters) and about this shot only.
- For a shot of a story plan, read `get_shot_brief` first. It gives the art direction, the facts of the cast and the place, the sheets to pass as references, the plan notes, the lessons, the known limits, and the limits of the model.
- Each answer of `generate_asset` gives the prompt as sent. `list_media_requests` lists every request, also the failed ones.

## One design, every frame

The only character that a film animates is the one that you designed: the same face, the same hair, the same costume, and the same props in every picture and clip. In one run a clip kept the hero for 1.5 seconds and then gave him long tied hair, a sleeved kimono with clouds all over it, and a second sword. A start picture gave his sleeveless coat sleeves, and in a third clip a character's hair changed halfway.

1. Give each person base facts in `put_cast_member` `facts`: the face, the eyes, the hair, each mark and its side, the build. No look changes them.
2. Give each person looks in `put_cast_member` `looks`. The look `default` is the design. A look names each garment with its construction ("a long sleeveless indigo coat worn open over a sleeved kimono") and each prop with its count and side ("exactly one sword, on the left hip").
3. A new look of a person who exists is the decision of the person. If the request does not describe it, propose it and ask. Give the words of the person in `person_asked_for_it`.
4. Name the look of each person in each shot with `cast_looks` of `set_story_plan`. A look never changes inside a shot.
5. Make the kit of each look: the turnaround, then the poses that the shots need (`get_work` proposes them), the faces, and the hands with the props. A shot can still start with only the turnaround.
6. For a move with a clear end pose, make an end picture with `key_picture` `end`, check it with the start pictures of the batch, and give it as `last_frame_asset_id`.
7. Keep hands small or out of the frame unless the shot is about them.

The design check compares each picture and clip with the turnaround of its look. A picture that breaks the design cannot start or end a clip, and only the clean part of a clip can be placed (`clean_until_seconds`), unless the person chooses it.

## Keys

- The AI needs no key. yumekit uses the sign-in of the agent program.
- A voice needs no key. yumekit has a natural voice that runs on the computer after one download of 148 MB.
- Music, pictures from a model, and video clips need the key of a service: `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `FAL_KEY`. `yumekit keys` lists each service with the state of its key. The person adds a key in Settings of the editor, or with `yumekit keys set <VARIABLE>`.

## When something fails

- Each failure of a tool has a `kind`, a message, and often a hint. Read the hint first.
- `browser-not-installed`: run `yumekit setup`.
- `would-remove-the-work-of-the-person`: the call would remove a file, a clip, or a transition that the person made. Keep each thing that the failure lists. Give `remove_person_work: true` only when the person asked for that removal.
- `media-key-missing`: say which key is missing and that the person can add it in Settings. Then make the rest of the video.
- For anything else, run `yumekit doctor` and report its lines to the person.
