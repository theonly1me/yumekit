# 21. A simple studio: questions, chapters, and takes

This document turns the way the owner made the trailer "Unwritten" into the product. The prototype in `apps/prototype` (sixth pass, "simple by default") is the reference for each screen. Where this document and an older one disagree, this one wins. It replaces P8 of document 13 and the Making screen of document 15.

## What the trailer run taught

The owner made a 56 second trailer in steps, with a review at each step. The owner said: "I think this turned out really well". The steps were the story, the plan, the pictures, the clips, and the cut. The assistant ran the review outside yumekit, on a web page with pins on pictures and moments in clips. The owner's words on the result: "If this approach works, we can bake it into the product."

| What happened                                                                          | What it shows                                                   |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| The lead wrote the whole story and script from a rough idea, then the owner changed it | The story comes first, and the person shapes it                 |
| The owner found faults in three rounds of pictures before any money went to clips      | Approved pictures save the money of clips                       |
| The owner asked for the progress three times                                           | The person needs to see what the lead does, and when it is done |
| The lead listed its own faults in each report                                          | The lead's honest note tells the person where to look           |
| The owner's screenshots had to be described to the lead in words                       | A note must sit on the picture or the moment itself             |
| 8 of 21 clips and 2 of 3 music tracks were not used: $1.90 of $4.83                    | The person needs the price before each step                     |
| The owner raised the limits of the project by hand                                     | Limits belong to the person, once, for every project            |

The owner's product feedback, in the owner's words, is in the brief of WP79. In short: templates and a guide at the start, files dropped into the chat, chapters for a long film that the person changes by drag, a review page in yumekit called Takes, the same for clips, and limits that the person does not raise for each project. After the first prototype the owner added: "the UX needs to be simple and intuitive as AI is doing most of the heavy lifting anyway ... they should still have advanced options when needed".

## Decisions

| Id  | Decision                                                                                                                                                                      | Why                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| T1  | Simple by default. After Start, the project screen shows one thing at a time, one next action, and the chat. The editor is "Edit by hand"                                     | The lead does the work. The person says yes or what to change                                             |
| T2  | Each screen shows at most one primary button and three other controls outside its content                                                                                     | The owner: "there's too many controls"                                                                    |
| T3  | Start has three templates, one box for the idea and files, and one line on how to use the lead. YouTube is the default platform, and the lead asks about the length           | A rough idea is enough. The lead fills in the rest by asking                                              |
| T4  | The lead asks the person multiple-choice questions in rounds with the tool `ask_person`. The editor shows a round as one card with Back and Next                              | The owner: "give claude code or whatever agent a multiple choice tool"                                    |
| T5  | Files go into the chat and the start box by drop, paste, or "Add files". Each file becomes an asset, and the request names it                                                 | The person often has pictures, sheets, or a story already                                                 |
| T6  | A long film has chapters. The lead splits the film and says so. The story plan keeps them, and the person changes them by drag                                                | A 10 minute film cannot be made at once                                                                   |
| T7  | A take is one round of the lead's work for one chapter and one step, with the person's notes. `takes.json` keeps every take                                                   | The owner's review page, inside yumekit                                                                   |
| T8  | Mark only what is wrong. When the person sends a take, each item with no note is approved                                                                                     | The owner chose "mark"                                                                                    |
| T9  | An approval in a take is the person's word. It opens the design gate (document 20, C55 and C61) like `person_chose_this_*`                                                    | One place for the person's decisions                                                                      |
| T10 | "Approve pictures before clips" is on by default. While it is on, a clip needs an approved start picture                                                                      | The run's evidence. The person can turn it off for a quick draft                                          |
| T11 | Go: after an approved take, the lead starts the next step at once. A batch that costs more than the money left is refused whole before the first call, and the person chooses | The owner chose "go", and "if lead thinks costs will be exceeded then it should let user know beforehand" |
| T12 | Limits are set once for every project. A project has its own limits only when the person asks for them                                                                        | The owner: "User shouldn't have to go and extend the pricing and limits for each project"                 |
| T13 | The work area shows the progress of the open take, and the person gets a sound, a browser notice, and a chat line when a take is ready                                        | The progress question of the run                                                                          |
| T14 | Each item of a take has the lead's note and, for clips and music, what to check. A failed design check shows under the item                                                   | The lead's own list of faults helped. The lead cannot watch or listen                                     |
| T15 | Export offers "Smaller file": under 10 MB, under 25 MB, or the person's size                                                                                                  | The trailer needed a copy under 10 MB to share                                                            |
| T16 | "Edit by hand" keeps the editor, with chapters and the detailed timeline changed by drag                                                                                      | The owner: the timeline "is not modifiable by user easily via drag and drop"                              |

## The project screen (T1, T2)

- After Start, yumekit opens the project screen. The Making screen and its step list are removed.
- The top bar shows the name, the step rail, "Edit by hand", "Export", and "Settings".
- The step rail shows the steps of the picked chapter: Story, Pictures, Clips, Cut. It shows only the steps that the film has. A film with no AI video has Story and Cut. A past step opens its last take.
- The chapter menu sits above the work area. A film with one chapter shows no menu.
- The work area has four states:
  1. The lead at work: the items of the open take arrive as they finish, with "Making 6 of 18 pictures" and a thin progress line. The next action is "Stop".
  2. The story: the reading view of the story and the script. The person selects a paragraph to comment. The next action is "Approve the story", or "Send 3 notes" when notes exist.
  3. A take: the review of T7 and T8.
  4. The film: the player of the chapter cut. The next action is "Approve the cut". After it: "Next chapter", or "Export" for the last chapter.
- The chat is on the right, with the ask box and the files, and nothing else. The person drags its left edge to make it wider. It has a minimum and a maximum width, remembers the width, and a double click resets it. The phone layout keeps the chat below the work.
- T2 applies to each screen. A review of a pull request counts the controls of each screen in its screenshots.

## Start (T3)

- Three template chips: "A trailer", "A movie", "A video". A chip puts a short guide into the box as plain text that the person completes, for example "The story:", "The main characters:", "The look:", "What it must show:". The guide is not a form.
- The request carries the form of the template (`trailer`, `short`, `explainer`, as in C59 of document 20). The lead uses it in `set_story`.
- The box takes files (T5). "Add files" sits inside it.
- One line: tell the lead as much as you can; it asks questions, then writes the whole story for you to approve.
- "For YouTube. The lead asks about the length. Change". "Change" opens the platforms and the length. The agent program moves to Settings.

## Questions in rounds (T4)

- The harness gets the tool `ask_person`. Its input is `questions`: 1 to 20 questions. Each question has `id`, `text`, `options` (2 to 6 short labels), and `multiple` (false by default). The person can always give their own words.
- The tool stores the round as a chat entry of the kind `questions` and returns at once. Its result tells the lead to end its turn: the answers come as the next request.
- The editor shows the open round as one card above the ask box: "Question 2 of 5", the question, the options as small chips in one wrapped row, a line for the person's own words, Back, and Next. An answer stays when the person moves. The last question has "Send my answers".
- `POST /api/chat/answers` takes the round id and the answers. The engine adds a request entry whose text gives each question and its answer, and starts the lead's turn.
- After the answers go, the chat keeps one folded line, "You answered 5 questions". It opens to show the questions and the answers.
- If the person sends a message in the ask box while a round is open, the message goes with the answers given so far, and the round closes. The request names the questions with no answer.
- The lead may ask again after it discusses the answers. The guide of the lead (WP77) asks for rounds of 3 to 6 questions.

## Files in the chat (T5)

- The ask box and the start box take files by drop, by paste (a screenshot), and by "Add files". Each file shows as a chip with a small picture and Remove.
- The editor sends each file with `POST /api/uploads` (document 15). The request body gets `files`: the upload ids and names.
- Before the turn starts, the engine adds each file as an asset. The request text names each one: its name, its asset id, and its kind. The lead looks at a picture with `preview_assets`.
- A file that fails to upload shows its message on its chip, and the request does not go.

## Chapters (T6)

- The story plan gets `chapters`: a list of `id`, `title`, and `shotIds`. Each shot is in exactly one chapter, and the chapters keep the order of the shots. A plan with no chapters is one chapter.
- `set_story_plan` takes `chapters`. The new edit `setChapters` replaces them. The store refuses a list that leaves a shot out, names a shot twice, or breaks the order.
- The lead splits a film into chapters when it is too long to make at once. The guide (WP77) says about 1 to 3 minutes for each chapter. The lead says the split in the chat in one message with a button that opens the chapters.
- The scene of a shot belongs to the chapter of the shot. A scene with no shot (a title card) belongs to the chapter of the shot before it on the timeline.
- The step of a chapter comes from its takes: the step of its newest take that is not approved, or Done when its cut is approved.
- `render_video` takes `chapter_id` and renders only the time of that chapter. That file is the cut of the chapter.
- In "Edit by hand", chapters are the top row above the scene cards and the detailed timeline. The person drags a scene into another chapter, drags a chapter to reorder it, and moves the line between two chapters. Rename, split at a scene, and join are there too. Each change is one `setChapters` edit, and undo works.

## Takes (T7, T8, T9)

- `takes.json` at the root of the project keeps every take. It is in git, because it holds the person's decisions.
- A take has: `id`; `chapterId` (none for the story); `step` (`story`, `pictures`, `clips`, `cut`); `number` (counted for each chapter across its steps); `state` (`open`, `ready`, `sent`); the times it opened, was ready, and was sent; `items`; `notes`; `costUsd`; and `nextStepEstimateUsd`.
- An item has `kind` (`asset`, `story`, `cut`), its id, the lead's note, and for a clip or music `whatToCheck`.
- A note has the item, the text, and one of `pin` (x and y as parts of the picture), `seconds` (a moment of a clip, music, or the cut), or `quote` (a paragraph of the story). A note can also be `dropped`: "Don't use this one".
- The lead opens a take with `open_take` (`chapter_id`, `step`). While a take is open, each asset that the lead makes joins it. The lead finishes with `ready_take`: the items, the note of each, what to check, and the estimate of the next step. A take must be ready before the person can send it.
- The take view shows every item of the chapter's step: the new ones with "New", the earlier approved ones without it. A switch "Only new and waiting" is on by default.
- The items show as a contact sheet: pictures on the ground, no card boxes, one short caption each. A marked item gets an outline in the accent color and its note count. A failed design check shows as one plain line under the item.
- A click opens the large view: the item large, the lead's note, what to check, "Don't use this one", the note box, a pin by a click on the picture, and for a clip or music the speeds (0.25, 0.5, 1), frame step, and "Mark this moment". An item that replaces an earlier one has "Compare with take N". Arrow keys move to the next item.
- The take number shows large, as a slate. Earlier takes open from a menu next to it.
- The footer says "Mark only what needs a change. Everything else counts as approved." and has one button: "Send 2 notes to the lead", or "All good." and the next step with its price.
- On send, the engine stores the notes and the approvals, and starts the lead's turn with a request that gives each note with its item, its pin, moment, or quote, and the approved items. A screenshot of the person is never needed.
- When no item has a note, the request tells the lead to go on to the next step (T11).
- An approved item is the person's word for the design gate (T9). The engine records it as a design check `by` `person` with the words "Approved in take N", unless a check of the lead already passed.

## Pictures before clips (T10)

- A project setting `approvePicturesFirst`, true by default. It sits under "More settings".
- While it is true, `generate_asset` and `generate_assets` refuse a clip whose start picture (and end picture) is not approved in a take: `picture-not-approved`. The refusal names the pictures.
- While it is false, nothing waits for the person, as in draft mode.

## Money (T11, T12)

- Limits for every project live in the `media-tools.json` of the yumekit configuration folder. Settings shows "Limits for every project" and writes that file.
- A project uses them unless the person turns on "Use other limits for this project", which writes the project's `media-tools.json` as today. A project that already has its own limits keeps them, and Settings says so.
- The defaults stay: 5 US dollars and 60 seconds of video (document 20, C65).
- Before the first call of a batch, `generate_assets` adds the catalog price of all its requests. If the sum is more than the money left, it refuses the whole batch with `over-money-left`, the estimate, and the money left. No call is made.
- `ready_take` stores the estimate of the next step. The harness computes it from the catalog and the shots of the chapter where it can, and the next action shows it.
- When the estimate of the next step or a refused batch is more than the money left, the next action area shows one line, for example "The clips cost about $3.20 and $1.10 is left.", and three choices: "Raise this project to $X", "Make fewer clips", "Stop here". "Raise" writes the project's own limit through the editor; the AI still cannot change a limit. "Make fewer clips" sends a request to the lead. Nothing is spent until the person picks.

## Progress and the ready signal (T13)

- While a take is open, the work area shows each item as it finishes, and "Making N of M" from the requests of the open batch.
- When a take becomes ready, the editor plays a short sound, shows a browser notice "Take 2 is ready for you", puts the count in the tab title, and adds a chat line with "Open take 2". The editor asks for the notice permission on the first click of Start. A refusal only removes the notice.

## Smaller files (T15)

- Export shows the places with YouTube ticked, and "File size": "Best quality" (the default) or "Smaller file". Everything else is under "More".
- "Smaller file" offers under 10 MB, under 25 MB, and the person's own size in MB. The sheet shows the expected size before the export, and the real size after it.
- The renderer makes the smaller file with two passes of H.264 at a bitrate from the size and the length, AAC at 128 kbps, and `+faststart`. It keeps the picture size.
- When the size is too small for the length, one line says so and offers 720p. WP82 measures the limit on real renders and records it.

## Settings

- Settings shows "Who makes the film" (the agent program and its model, document 20, C57) and "Limits for every project" first. Everything else sits under "More settings": the media services and models, the checker, "Approve pictures before clips", the look, and the motion.

## Work packages

| Id   | Scope                                                                                                                                                                                                                                       | Needs            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| WP80 | Takes and chapters: `takes.json`, `chapters` and `setChapters`, `open_take` and `ready_take`, the send route and its request, the approval as the person's word, `approvePicturesFirst`, the chapter cut, and the estimate of the next step | WP76             |
| WP81 | Questions in rounds and files in the chat: `ask_person`, the question card, the answers route, files on requests, and the resizable chat                                                                                                    | WP78             |
| WP82 | Money and export: limits for every project, `over-money-left`, the warning with its three choices, Settings and Export basics first, and the smaller file                                                                                   | WP76             |
| WP83 | The project screen: Start, the four states of the work area, the take view and the large view, the step rail and the chapter menu, the next action, progress and the ready signal. The Making screen goes                                   | WP80, WP81       |
| WP84 | Edit by hand: chapters by drag above the scene cards and in the detailed timeline; the detailed timeline moves, trims, and takes drops from a take; no hint lines and no suggestion chips                                                   | WP80             |
| WP77 | The skill and the guide of the lead for this flow: questions in rounds, chapters, takes with notes and what to check, estimates, the cut on the beats of the music, and the craft lessons of the trailer run                                | WP80, WP81, WP82 |

WP80, WP81, and WP82 run at the same time. WP83 and WP84 follow. WP77 is last.

### Checks of the work packages

1. WP80, through the harness with the sample media server and the fake agent: a take collects the assets made while it is open; a send with notes gives a request with each note and its pin or moment; a send with no notes approves each item; an approved start picture opens the design gate; `approvePicturesFirst` refuses a clip of a picture that is not approved, and false lets it go; `setChapters` refuses a lost shot, a shot twice, and a broken order; `render_video` with a chapter renders only its time.
2. WP81: `ask_person` stores a round and the lead's turn ends; the answers route starts a turn with each answer; a message in the box closes a round with the answers so far; a dropped picture becomes an asset that the request names. A browser test moves Back and Next and keeps an answer.
3. WP82: a batch over the money left is refused with no call made; the limits for every project apply to a project with no own limits and not to one with its own; the smaller file of a sample render is under its size. A browser test of the warning and its three choices.
4. WP83 and WP84: browser tests of each state of the work area, the large view with a pin and a moment, the send of a take, chapters by drag, and a trim in the detailed timeline. Screenshots next to the prototype, dark and light, wide and phone, with the control count of each screen.
5. Each work package uses its change as a person would, with the sample media server and no paid call.

## Not in this version

- More than one person in a project.
- Takes for the voice. A voice is still changed in "Edit by hand".
- A take of the whole film across chapters. The last chapter's cut and Export cover it.
