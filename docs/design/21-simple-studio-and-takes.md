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
| T8  | The review is on the page, in the row of each item: a verdict, tags, a note, pins, moments, and "Use this". It saves as a draft in the project while the person types. "Looks right" or no review is approved | The owner chose "mark", and then: no Add button, and no click into each clip to review it                 |
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
- A note has the item, the text, and at most one of `pin` (x and y as parts of the picture), `seconds` (a moment of a clip, music, or the cut), or `quote` (a paragraph of the story). It can have `tags`. It has at most one verdict: `dropped` ("Don't use this one"), `question` ("Not sure"), or `approved` ("Looks right" with words). A note with none of them asks for a change ("Has mistakes"). `use: true` ("Use this") goes only with `approved`.
- A place is what one version fills in the film: the start picture of a shot, the clip of a shot, a sheet of a look of a character, the music, or else the chain of versions that `replaces` links. "Use this" picks the version for its place and approves it. One version is in use for each place: the newest pick of the person, else what the film uses now, else the newest approved start picture of the shot. The other versions stay, and nothing is dropped.
- The lead opens a take with `open_take` (`chapter_id`, `step`). While a take is open, each asset that the lead makes joins it. The lead finishes with `ready_take`: the items, the note of each, what to check, and the estimate of the next step. A take must be ready before the person can send it.
- The take view shows every item of the chapter's step as a list of rows: the items of the take, and the approved items of earlier takes of the step. Filters sit above the rows: All, Not reviewed, Has mistakes, In use, and New in this take, each with its count, and "3 of 6 reviewed".
- Each row has the item at a size to judge, and its review next to it (below it at the width of a phone). Nothing opens to review an item. The review has "Use this", the verdicts "Looks right", "Has mistakes", "Not sure", and "Don't use this one", a few tags for the kind of item, the pins or the moments with their own words, and one note box. A pin, a moment, a tag, or a note sets "Has mistakes" when no verdict is set yet. The row shows the lead's note, what to check, a failed design check, and the badges "New in take N", "Made before this take", "Approved in take N", "Replaces take N", and "In use".
- A click on a picture drops a numbered pin. "Full size" shows the picture large with the same pins, and Escape or a click outside closes it. A clip or music plays in the row with the speeds (0.25, 0.5, 1), frame step, and "Mark this moment", and a click on the time of a moment goes there. An item that replaces an earlier one has "Compare with take N", with "Use this" on both versions.
- The review saves while the person types, after a short pause, as a draft of the take in `.yumekit/take-drafts/` through the engine. A reload or another browser keeps it. Only the send gives it to the lead.
- The take number shows large, as a slate. Earlier takes open from a menu next to it.
- The footer counts the review, for example "2 to change, 1 to leave out, and 1 question. Everything else counts as approved.", and has one button: "Send the review to the lead", or "All good." and the next step with its price.
- On send, "Has mistakes" with its words is a change, "Don't use this one" is a drop, "Not sure" is a question that the lead answers in its next take, and "Looks right" or no review is approved. The engine stores the notes and the approvals, removes the draft, and starts the lead's turn with a request that gives each item with its verdict, tags, note, pins, and moments, each "Use this" pick with its place, and the approved items. A screenshot of the person is never needed.
- When no item asks for a change, a drop, or an answer, the request tells the lead to go on to the next step (T11).
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

## Details of WP81

These decisions came from the build of WP81.

### Questions in rounds

1. Each question of `ask_person` has an `id` (lowercase letters, digits, and hyphens), `text` (1 to 240 characters), `options` (2 to 6 labels of 1 to 80 characters), and `multiple`. A repeated id gives `question-id-repeated`, and a repeated option gives `option-repeated`. Neither stores a round.
2. `ask_person` works only for the lead, inside a request of the chat of the editor, as `ask_helper` does. Each other session gets `no-chat-request` with the hint to ask in the answer text. A helper and the critic cannot call it.
3. The result has `round_id`, `question_count`, and `next`. Its line tells the lead to end its turn with one short sentence and to ask nothing in its text.
4. While a round is open in a request that runs, the engine refuses each later call of the lead with `questions-waiting` and runs nothing. So the turn ends also when the lead does not follow the result, and nothing is spent before the person answers.
5. The chat entry `questions` has `id` (the round id), `questions` (each with `multiple`), `state` (`open` or `closed`), and `answers` (`questionId`, `choices`, `ownWords`). The `request` or `steering` entry that closed a round has its `roundId`. A round stays open after a restart of the engine.
6. `POST /api/chat/answers` takes `round_id`, `answers` (`question_id`, `choices`, `own_words`), and the optional `text`, `files`, `about_clip_id`, and `details`. It answers 202 with the `request` entry, or a `steering` entry while a request runs. A round id that is not the open round gives `questions-closed` (409). An answer to a question of another round, a choice that is not an option, or two choices for a question with `multiple` false give `answers-not-valid` (400).
7. The round closes only when its request starts. A start that fails keeps the round open, and the card stays.
8. The answers go to the lead in `details` of the request: "The person answered your 3 questions:", then each question with "Answer: ..." or "No answer.". Choices are joined with "; ", and own words follow "In their own words:". A round with some answers says how many, and that a question with no answer is still open.
9. A message in the box while a round is open goes through `POST /api/chat/answers`, with the answers so far. A request of `POST /api/chat/requests`, for example from a button of a step view, closes the open round with no answers, and its text names each question as open. So no round stays open past a new request.
10. The card turns on "Send my answers" when each question has an answer. On the last question, a line says how to send with some answers: "Answer each question to send them. Or write in the box below: your message goes with the answers you gave."
11. A question with `multiple` adds ". Pick one or more." to its count line. For a question with one choice, an option replaces the own words, and own words replace the option. Enter in the line of own words goes to the next question. The suggestion chips hide while a round is open.
12. The folded line says "You answered 5 questions", "You answered 2 of 5 questions", or "You did not answer the questions". It sits on the message of the person that closed the round, and opens to each question and its answer.
13. The Making screen opens the editor when a round is open, so the person sees the card. WP83 replaces the Making screen.
14. "Try again" after a failed request that only answered a round sends "Here are my answers again." with the same answers.

### Files in the chat

15. The editor uploads each file with `POST /api/uploads` when the person sends, as one act. So a removed chip leaves nothing in the project. The upload already adds the asset (document 15), so the upload id of this document is the asset id.
16. The request body gets `files`: `asset_id` and `name` of each file, 20 at most. Before the turn, the engine checks that each id is an asset of the project. An id that is not gives `file-not-found` (404), and no turn starts. A request with files may have no words.
17. The text for the lead adds "The person added 2 files to this message. Each file is an asset of the project now. Look at each picture and video with preview_assets before you use it.", and one line for each file with its name, its kind (a picture, a sound, a video, or a font), and its asset id. A steering message names its files the same way.
18. A file that is not a picture, a video, a sound, a font, or a text file shows "yumekit cannot read this kind of file. Add a picture, a video, a sound, a font, or a text file." on its chip. While such a chip stays, Send uploads nothing and sends nothing. A failed upload shows the message of the engine on its chip, and the next Send tries that file again. A file that was added keeps its asset, so a second Send does not add it twice.
19. A project has no text asset. So the words of a text file (`.txt`, `.md`) go into the box after "From the file <name>:", where the person reads and changes them. A text that makes the box longer than 20,000 characters shows a chip that says the text is too long.
20. The whole chat pane takes a drop, and the hint "Drop the files for the AI" covers the box. A drop of files in another part of the editor does nothing, so the browser never leaves the editor to show the file.
21. The chips, "Add files", the drop zone, and the list of files that wait are in `apps/editor/src/chat/files/index.ts`, for the start box of WP83.

### The resizable chat

22. The chat is 320 to 720 pixels wide, and 400 by default. The browser keeps the width in its local storage as `yumekit-chat-width`. The chat is at most half the window, and at most 45% of a window under 1100 pixels.
23. The edge is a separator with the arrow keys: Left makes the chat 24 pixels wider, and Right makes it narrower. A double click sets 400. The edge is hidden at phone width, where the chat opens over the work as before.

### The real check

24. On 2026-11-26, the engine of the worktree build ran one request with Claude Code 2.1.332 in a new temporary project and configuration folder, with no media key. The request asked for a 30 second film and for a few questions with choices first. The lead called `get_work`, `get_story_guide`, and `ask_person` with 6 questions of 4 options each. It then ended its turn with one sentence: "I've put a few questions about the story and the look on the card above the chat box." The turn took about 10 seconds, and the card showed the round. The lead's guide does not name `ask_person` yet (WP77), so the tool description alone led the lead to it.

## Details of WP80

These facts and choices came from the build of WP80 on 2026-11-26.

### The format and the store

1. `takes.json` holds `{ "takes": [...] }`, with sorted keys like the other files. The store writes it only when the project has a take, so a project with no take has no file and loads as before. Each take edit is one undo step.
2. The id of a take is `take-<n>`, one higher than the highest id. Its number counts the takes of its chapter, or the takes of the story. The id of an item is the asset id, `story`, or `cut`.
3. A plan with no chapters, and a project with no plan, has one chapter with the id `film` and the title "The whole film". `open_take` takes the only chapter when the call gives no `chapter_id`.
4. A chapter has at least one shot. The three refusals of T6 are rules of the store, so a new plan through `setBible` is checked too. Each has its own failure kind: `chapter-misses-shot`, `shot-in-two-chapters`, and `chapters-break-order`. Two chapters with one id fail with `id-in-use`, and a shot that the plan does not have fails with `not-found`.
5. `set_story_plan` with no `chapters` keeps the chapters: each shot keeps its chapter, a new shot joins the chapter of the shot before it (or the first chapter), and a chapter with no shot left goes. A plan that moves a shot to another chapter needs `chapters` in the call.
6. One take is open at a time. An open take with no item gives way to a new `openTake`. An open take with items refuses it, and `open_take` says `take-already-open`. `open_take` for the chapter and the step of the open take returns that take.
7. `approvePicturesFirst` is a field of `project.json`. No value means true, and the store writes only `false`. The tool is `set_approve_pictures_first`, and its description says to call it only when the person asks.

### The round of the lead

8. Each asset that `generate_asset` or `generate_assets` makes, or reuses under a new id, joins the open take in the same change. A voice does not join, because takes for the voice are not in this version. A picture that `check_design` saves at the end of a clip does not join. A picture that the person makes in the editor while a take is open joins it.
9. `ready_take` refuses a take with an item that has no note, or a clip, a sound, or a cut with no `what_to_check` (`take-not-ready`). `leave_out` removes an asset that the person does not need to see. An item can name an earlier asset, which then joins the take. `replaces_asset_id` keeps `replaces` on the item, for "Compare with take N".
10. The cost of a take is the sum of `costUsd` of its assets. The estimate of the next step uses the prices of the estimate of `set_story_plan`: after the story, the pictures of the first chapter (the sheets of its cast with no reference picture, and one start picture for each shot); after the pictures, the seconds of the shots of the chapter at the video price; after the clips, nothing, because a render is free; after the cut, the pictures of the next chapter, or nothing for the last chapter. With no plan, it is the `next_step_estimate_usd` of the lead.
11. `render_video` with `chapter_id` renders from the first clip of the chapter on the scenes row to the end of its last clip, to `renders/chapters/<chapter id>-<output id>.mp4`. A scene clip belongs to the chapter of its shot when it shows a clip with `shot_id`. Another scene clip belongs to the chapter of the clip before it, or to the first chapter. The render joins an open take of the cut of that chapter as its `cut` item. `chapter_id` with `first_frame` or `frame_count` is refused.

### The send and the approval

12. The send is the function `sendTake` of `createHarness`, not a tool, so the lead cannot approve its own work. The engine route `POST /api/takes/<take id>/send` takes `notes`: each with `item_id`, `text`, and one of `pin`, `seconds`, `quote`, or `dropped`. It runs the send as a change of the person, which the chat can undo, and then starts the lead's turn. An AI caller gets 403. `GET /api/takes` gives the takes, the chapters, and `approvePicturesFirst`.
13. A note names an item of the take, or an asset of an earlier sent take of the same chapter and step, because the take view shows the earlier approved items too.
14. On send, each item with no note gets `approved: true`. The newest sent take decides: a later note on an approved asset takes the approval back, and a later approval gives it again.
15. The request entry has a text for the person ("Take 2: 3 notes for the lead." or "Take 2: all good. Go on.") and details for the lead: each note with its item, its pin in percent from the left and the top, its moment in seconds, or its quote; then the approved items; then what to do next. With no notes, the details name the next step and its estimate. If the turn cannot start, the notes stay saved, and the route answers 409 with "Your notes are saved."
16. T9: for each approved picture or clip of a shot, the send stores a design check `by` `person` with the words "Approved in take N", in the same change. A check that passed stays as it is. A check with a break keeps its frames and gets the words as `personKept`. An approved story item sets the approval of the story to `person-said-yes`.
17. T10: `picture-not-approved` names the pictures, and its hint follows the state: a ready take waits for the person, an open take needs `ready_take`, a note asks for a new picture, a dropped picture needs another one, and a picture in no take needs a take of pictures. A picture that `check_design` saved at the end of a clip needs no approval. A picture that was in no sent take passes with the words of the person (`person_chose_this_picture`, in the call or stored before).
18. `get_work` has "### Chapters and takes": the chapters, the setting of T10, the take that is open or ready, and the last take that the person sent with its notes and its approvals. Its next batch says that a shot waits for the person to approve its start picture. `get_project` gives `approve_pictures_first`.
19. `@yumekit/project/takes` exports the chapters, the verdicts of the assets, and the time of a chapter, with no Node code, for the editor of WP83 and WP84.
20. The tests of other parts of a clip turn "Approve pictures before clips" off (`approvePicturesFirst: false` in the test fixtures), so they keep testing what they tested before.
21. A verdict of the person in a take wins over words in a call. When the newest sent take asks for a change of a picture or a clip, or drops it, `person_chose_this_picture` and `person_chose_this_clip` open neither `picture-not-approved` nor the design gate, and store no check. The refusal names the take and the verdict, for example "The person dropped "x" in take 2". With no verdict in a take, the words work as before.

### The run

The engine of the branch ran a small film with the free sample server and the fake agent of the tests, and no key in the environment.

1. The person asked: "Make a short film: a ferry crosses a strait in fog. Start with the pictures." The lead opened take 1, made three pictures in one `generate_assets` call, and gave each a note with `ready_take`.
2. The person sent take 1 with a pin on the harbor ("Make the wall taller, like a cliff.", at 62% from the left and 35% from the top) and "Don't use this one" on the lantern. The chat got the change "You sent take 1 with 2 notes." and the request "Take 1: 2 notes for the lead.", whose details gave each note with its pin and the approved ferry.
3. The lead made the harbor again in take 2 with `replaces_asset_id`. The person sent take 2 with no notes, and the request told the lead to go on to the clips.
4. The lead made a clip from the approved ferry. A clip from the dropped lantern failed with `picture-not-approved` and the hint "The person dropped "lantern": use another picture."

### Follow-ups

1. The description of `set_story_plan` still says that no start picture or clip runs before the critic passes the plan. WP76 removed that gate. WP77 rewrites the guide and can correct it.
2. Until WP77, the guide of the lead does not name takes. The descriptions of `open_take` and `ready_take` and the hints of `picture-not-approved` teach the flow.

## Details of WP82

These facts and choices came from the build of WP82 on 2026-11-26.

### Limits for every project

1. The limits for every project are `limits.spendingUsd` and `limits.generatedVideoSeconds` of `media-tools.json` in the yumekit configuration folder. This replaces C42 of document 20: Settings no longer writes a limit to the project by default.
2. "Use other limits for this project" writes both limits to the project file, with the values in use. So the own limits of a project never mix the two files. Turning it off removes only these two fields, and keeps `callsAtOnce` and every other field of the file.
3. `GET /api/media/limits` gives the limits in use, `every_project`, and `this_project` (`null` when the project has no own limits). `PUT /api/media/limits` takes `applies_to` (`every-project` or `this-project`) and one or both limits. `DELETE /api/media/limits/this-project` removes the own limits. Each answers with the same body as the GET. Each change refuses the header `x-yumekit-client: agent` with `limit-not-for-the-ai` (403), as before.
4. An engine reads both files again before each limit check. Calls at the same time share one read, so the first call of a batch still starts first. So a change in the Settings of one project applies at once to the other open projects. When a file stops being valid, the last valid limits stay in use.
5. Settings shows each limit with "-" and "+" (5 dollars and 10 seconds) and a field to type the amount. A press of Enter or a move out of the field saves it.
6. "Who makes the film" keeps the AI apps and the model of the lead. The model of the AI that checks the work moves under "More settings", next to "How the AI checks the film".
7. The switch "Approve pictures before clips" sits under "More settings", before "How the AI checks the film". It calls `set_approve_pictures_first` of WP80, and a project with no value shows it on.

### The batch over the money left

8. `MediaTools.estimate` adds the price of each call with the rule of the spending check: the catalog price, else the cautious price of document 15. It makes no call.
9. A call counts as 0 when it cannot spend: a free server, a service with no key or a key that does not work, an asset id that the project has, the second call for one asset id, and a call that a rule of the story refuses before the media call, for example a clip of a picture that is not approved (`picture-not-approved`).
10. The money left is the limit less the money spent and less the price of the calls that still run.
11. `over-money-left` gives `estimate_usd`, `left_usd`, `limit_usd`, `spent_usd`, `what`, `paid_calls`, and `calls_that_fit`. `what` is the plural word of the kind with the largest share of the price, for example "clips". `calls_that_fit` is the largest number of calls that fit, the cheapest first. The record of requests keeps each refused call.
12. The spending check rounds the sum to 0.0001 dollars before it compares it with the limit. Before, three pictures of $0.40 did not fit in $1.20, because the sum was 1.2000000000000002.

### The warning and its three choices

13. The warning is a chat entry of the kind `money`, with `what`, `estimateUsd`, `leftUsd`, `raiseToUsd`, `paidCalls`, `callsThatFit`, and `choice`. The engine adds it when a harness call returns `over-money-left`, and gives an earlier open warning the choice `replaced`. So only one warning has the buttons. WP83 shows the same entry in the next action area.
14. `POST /api/chat/money/<id>` takes `choice` (`raise`, `fewer`, or `stop`). It refuses the AI (403) and a warning that already has a choice (409).
15. X of "Raise this project to $X" is the money spent plus the estimate, rounded up to the next 5 dollars. Raise writes the own spending limit of the project, and asks the lead: "I raised the money of this project to $X. Go on with the clips." When the limit of the project is already X or more, it writes nothing.
16. "Make fewer clips (N)" shows the number of calls that fit, and asks the lead: "Make fewer clips. The clips cost about $3.60, and $3.00 is left. Make at most N, the ones that matter most for the film, and tell me which ones you leave out." It does not show when nothing fits. "Stop here" asks nothing.

### The smaller file

17. The rule is in `@yumekit/project`. The editor imports it from the new path `@yumekit/project/file-size` (document 01). So the renderer and the Export sheet use the same rule.
18. 1 MB is 1,000,000 bytes, so a file under 10 MB is also under 10 MiB.
19. The renderer makes the best file first, in a temporary folder, and then two passes of H.264 (`-preset slow`) from it, with AAC at 128 kbps and `+faststart`. It removes the temporary folder.
20. The video bitrate is 94 percent of the size, in bits, divided by the length, less 128 kbps when the video has sound. On the samples, a two-pass file was 95 to 108 percent of its target. So the renderer reads the real size, and encodes once more at a lower rate when the file is over the size. When it is still over, the result is `file-size-not-reached` with the smallest size, and no file stays.
21. `render_video` takes `largest_megabytes` and `short_side_pixels`, and gives `bytes`. The file name ends with `-under-<size>mb`, for example `film-youtube-under-10mb.mp4`, so a smaller file never replaces the best file.
22. Export has one file size for the whole export, under the places. "More" holds the picture size (the render scale) and the sharper copy. The real size shows next to "Show the file".

### When a size is too small for the length

23. Measured on 2026-11-26 on the computer of the owner, with FFmpeg 4.4 and libx264. Each value is the SSIM of the smaller file against the best file, at 1080p for the comparison. The samples:
    - AI footage: a real clip of a video model, looped to 12 seconds at 1080p. The best file is 6.5 Mbps.
    - The explainer example project, a 30 second render with screen recordings. The best file is 3.2 Mbps.
    - The demo project, an 18 second render of kit scenes with a voice and music. The best file is 0.7 Mbps.

    | Video kbps | Footage at 1080p | Footage at 720p | Footage at 480p | Explainer at 1080p | Demo at 1080p |
    | ---------- | ---------------- | --------------- | --------------- | ------------------ | ------------- |
    | 1500       | 0.978            | 0.979           |                 | 0.995              |               |
    | 1000       | 0.970            | 0.972           |                 | 0.993              |               |
    | 700        | 0.960            | 0.963           |                 | 0.990              |               |
    | 500        | 0.947            | 0.952           | 0.929           | 0.987              | 1.000         |
    | 350        | 0.925            | 0.936           | 0.916           | 0.983              |               |
    | 250        | 0.891            | 0.913           | 0.900           | 0.977              | 0.999         |
    | 150        | 0.792            |                 | 0.865           |                    | 0.997         |

24. AI footage is the hard case, so the rule follows it. A look at frames of the footage showed little loss at 700 kbps at 1080p, soft hair and wood grain at 500, and smeared detail at 350. At 720p, 500 kbps looked like 1080p at 700.
25. The rule: a picture looks sharp when the video has at least 700 × (short side / 1080)^1.5 kbps. That is 700 at 1080, 381 at 720, and 207 at 480. Under that, Export says "This video looks soft under 10 MB." and offers "Make it 720p", or 480p when 720p is not enough. When 480p is not enough either, it says "This video is too long to look good under 10 MB. Pick a larger size." Under 100 kbps of video, it says "A file under 10 MB cannot hold this video. Pick at least N MB.", and Export is off.
26. The expected size of "Best quality" is an upper bound, "Up to about N MB": the rate of the footage sample, 6.5 Mbps at 1080p and 30 frames a second, scaled by the pixels in a second. Drawn scenes make a much smaller file.

## Details of WP84

These choices came from the build of "Edit by hand" on 2026-11-26.

### The change of the chapters

1. The harness gets the tool `set_chapters`. It takes every chapter in film order, each with `chapter_id`, `title`, and `shot_ids`. The lead sees it too, because the person and the lead use the same commands.
2. When the shots keep the order of the plan, the call is one `setChapters` edit. A move of a chapter, or of a scene into a chapter that is not next to it, also changes the order of the film, and the store keeps the chapters in the order of the shots. So the same call first puts the shots of the plan in the new order (`setBible`), then sends `setChapters`, then `setTimeline` for each output whose scenes row changes. It is still one undo step.
3. The scenes row follows in runs. A run is the clip of a shot and the clips with no shot after it. The clips before the first clip of a shot stay first. The runs take the new order of their shots, and the clips play end to end from the first start frame, as with `move_scene_clip`.
4. The sound of a video moves with its scene clip, to the start of the clip and no longer than the clip, when the video has one scene clip and one sound clip on the row.
5. The editor builds the order of each chapter from the plan, with the shots that have a scene in the order of the scenes row. So a move of a chapter keeps an earlier change of the order inside a chapter.
6. The chat names each change of the person: "You renamed chapter 1 to "The fog bank".", "You moved the line between chapter 1 and chapter 2.", "You split chapter 2.", "You joined chapter 2 and chapter 3.", "You moved the chapter "The island".", and "You moved a scene to another chapter."

### Chapters in Edit by hand

7. A film with more than one chapter shows the chapter row above the scene cards. Each block has the number and the title, the length and the count of scenes ("0:12, 3 scenes"), or "Not made yet, 3 shots" for a chapter with no scene, and the step.
8. The step of a chapter comes from its newest take. A take that the person sent with no note means the next step. An approved cut is "Done". A chapter with no take is at "Story".
9. A click on a block picks the chapter and shows "Rename", "Split at" the picked scene, and "Join with chapter N". A split needs a picked scene of the chapter with a shot that is not its first scene. The new chapter is "From" and the title of the scene, with the id `chapter-<n>`. "Open its takes" of the prototype waits for the take view of WP83.
10. The scene cards sit in one group for each chapter, with the title above, and a line between two groups. A chapter with no scene shows "Not made yet" and takes a dropped scene.
11. A scene dropped on a scene of another chapter goes before that scene. A scene dropped on a chapter block goes to the end of that chapter. A drop inside the same chapter works as before with `move_scene_clip`. A chapter dropped on another chapter takes its place. The line dropped on a scene makes that scene the first scene of the next chapter. A chapter that loses its last shot goes.
12. A scene with no shot, for example a title card, stays with the scene before it, as the section "Chapters" says. Its move is a `move_scene_clip` call, and its chapter follows its place. A drop of such a scene into a chapter with no scene says: "This scene has no shot of the story, so it stays with the scene before it."

### The keys

13. Alt with Left or Right moves a picked chapter block by one place. Alt with Left or Right moves a picked scene by one place. At a line, the first press takes the scene across the line, so only the chapters change, and the next press moves it inside its new chapter.
14. The line between two chapters is a separator in the cards and a slider in the detailed timeline. Left and Right move it by one scene.
15. In the detailed timeline, Alt with Left or Right moves a scene clip by one place and the music by one second. Left and Right on the right edge of a scene or of the music change its length by one second.

### The detailed timeline

16. The rows are "From Takes", the ruler, "Chapters" (only with more than one chapter), and then each track as before. The scenes row and each music track change by drag. The voice, the captions, the sound of the videos, and the sounds stay as they were.
17. A scene clip moves when the person drags its name onto another scene, with the rules of the cards. Its right edge changes its length in whole seconds with `resize_scene_clip`, to one second at least.
18. The music moves and its right edge trims it in whole seconds with `update_clip`. It never starts before frame 0, never plays past the end of its file, and never ends after the last scene, unless it already did.
19. The chapter row of the timeline has a block from the first to the last scene of each chapter. A block dropped on another block takes its place. The edge between two blocks moves to the nearest start of a scene, and a thin line shows the place while the person drags.
20. While a drag or a key waits for the engine, the lane shows the new place. So two quick key presses add up.

### The tray

21. "From Takes" shows each picture and clip that the newest sent take approves, in the order of the takes. The person drags one onto a scene card or a scene clip. With the keyboard, the person picks a scene and presses the tile. With no picked scene, the line says: "Pick a scene first, then press the picture or the clip again."
22. A clip goes in with `place_video` and `replace_clip_id`. A picture goes in with the new tool `place_picture`: an `image-pan` scene `picture-<asset id>` with the start, the length, and the transition of the replaced clip. Both calls give `remove_person_work`, because the person makes the change. Only the shown shape changes, as `place_video` works on one output.
23. `place_picture` refuses a picture that the person dropped or asked to change in a take (`picture-not-approved`), and applies the design check of document 20 to a picture of a shot (`design-not-checked`, `design-break-in-range`).
24. A clip of a shot goes only onto a scene of the chapter of its shot, so each chapter stays in one piece: "This clip belongs to chapter 1, "The harbor". Drop it on a scene of that chapter." A picture has no shot on the row, so it goes onto any scene.
25. A refusal shows in plain words under the timeline or the cards, for example for `design-break-in-range`: "A person in it stops looking as designed, so it cannot fill this scene. Make the scene shorter, or ask the lead to make it again."

### Hint lines

26. "Edit by hand" lost the line "Pick a scene to change it. Drag a scene to move it." and the line under the preview ("Click the text in the video to change it", the platform, and the size). The scene actions show only for a picked scene. The empty states stay.
27. `@yumekit/project/takes` also exports `takeSchema` and `chapterSchema`, so the editor reads the takes and the chapters of the snapshot.

### Quick changes

28. While a change of the chapters or of the order of the scenes waits for the engine, a further drop or key on the scenes and the chapters does nothing. So a quick second press never acts on the old order. The press after the new order shows works again.

### The run

The editor of the branch ran a film of three chapters, with nine shots made by the free sample server, the fake agent, and no key in the environment. The person approved the pictures and the clips of chapter 1 in three takes. Then, in "Edit by hand":

1. A scene of chapter 1 dropped on a scene of chapter 2 moved into chapter 2 before it. The chat said "You moved a scene to another chapter."
2. Chapter 3 dropped on chapter 1 went to the front, and its three scenes moved with it: "You moved the chapter "Snow on Hollin"." Two presses of Cmd+Z brought back the first order.
3. The line between chapter 1 and chapter 2 dropped on the third scene made that scene the first scene of chapter 2, and no scene moved.
4. "Split at" the fifth scene, "Rename", and "Join with chapter 3" each made one change with its own chat line.
5. A drag of the right edge of scene 1 showed "6 seconds" in the clip while it moved, and made the scene 6 seconds long. The clips after it moved with it.
6. The approved clip "bell-alt-clip" from the tray took the place of the scene of the bell. A clip of chapter 1 dropped on a scene of chapter 2 showed the refusal in plain words, and nothing changed.

## Details of WP83

These decisions came from the build of WP83 on 2026-11-26.

### The project screen and the editor

1. Each project opens on the project screen. "Edit by hand" adds `#edit` to the address, so a reload and the Back button of the browser keep the screen. "Back to the project" in the top bar of the editor removes it. The editor loads only when the person opens it.
2. The top bar of the editor gets "Back to the project" and "Takes", with the count of the ready takes. "Takes" opens the same take view in a sheet: the ready take, else the open take, else the newest take.
3. The chapter shown first is the chapter of the open take, else of a ready take, else of the newest take, else the first chapter.
4. The work area picks its state in this order: a first request that did not start (only while the chat has no request); the open take of the chapter (the lead at work); a ready take (the story, the film for a cut, else the take); the lead at work with no take ("The lead reads your request" while the film has no story and no take, else "The lead is at work"); an open round of questions; a story with no approval; the newest take of the chapter; the story; "Nothing made yet". A choice of the person (the step rail, the chapter menu, an earlier take, "Open take N") stays until a send, a new chapter, or "Open the latest take".
5. The step rail shows Story and Cut for the video style Graphics, and the four steps for the other styles. The step now is Story until the story has an approval. Then it is the step of the newest take of the chapter, or the step after it when the person sent that take with no notes, or Done after an approved cut. A past step opens its last take. Story opens the story, and Cut opens the film.
6. "Making N of M pictures": N is the items of the open take, and M is N and the media requests that wait or run (`GET /api/work`). While no request runs, the line says how many are made so far.

### Takes and notes

7. The take view shows the items of the take. With "Only new and waiting" off, it also shows each approved asset of an earlier sent take of the same chapter and step that no item of the take replaces. "New" shows on the items of the take from take 2 on. The sections are The cut, Clips, Music, Characters and their looks (the assets of a cast sheet), Shots (pictures with a `shot_id`), and Pictures.
8. Notes stay in the browser until the send, for each take, while the page is open. They also stay when the person goes to "Edit by hand" and back. A pin or a moment with no words is not sent and not counted. "Don't use this one" sends a note with `dropped` and no words. A pin is in parts of the picture, to 0.001. A moment is in seconds, to 0.1.
9. The large view moves with the arrow keys when the focus is not in a field. Escape closes the comparison first, then the large view. The frame step uses the frames per second of the project. A sent take shows its items with no marking.
10. The story is a reading view: the premise, the world and its rule, each character, the opposing force, each step of the arc, what stays unknown, then the script in paragraphs. A comment is a note with `quote`, the words of the paragraph. When a ready take of the story exists, "Approve the story" and "Send N notes" use `POST /api/takes/<id>/send`. When the lead made no take of the story, "Approve the story" asks in the chat: "I approve the story. Save my yes to it, then go on to the next step." Notes go as one request with each quote. The lead then saves the yes with `set_story`, as its guide says.
11. The film is the player of the cut of the newest take of the cut. "Approve the cut" sends that take with no notes. After an approved cut, "Next chapter" shows the next chapter, because the lead starts it after the send (T11), and "Export" stays next to it. The last chapter shows "Export" only.
12. The money warning of WP82 replaces the next action while it is open, and the chat of the project screen does not show it. "Edit by hand" keeps it in the chat. Item 24 adds the warning before a send.

### The ready signal

13. When a take turns ready while the page is open, the editor plays two tones made with Web Audio (660 and 880 Hz), shows the notice with the name of item 27, for example "Take 1 of the pictures is ready for you", and puts "(N)" before the name of the project in the title of the tab, for each ready take. A take that was ready before the page opened counts only in the title.
14. The chat shows one line for each ready take at its end, for example "Take 1 of the pictures is ready for you: 3 to check.", with "Open take N" ("Read the story" for the story), until the take is sent.
15. Each project runs on its own port, so its page has another origin than Start, and a browser keeps the notice permission for each origin. So the project screen asks for the permission at the first click of the person in it, and Start asks nothing.

### Start

16. "A trailer" gives the form `trailer` and the video style AI video. "A movie" gives `short` and AI video. "A video" gives `explainer` and Mix. With no chip, the video style is Mix. The look is the default of the engine. The start formats and "Show me the plan first" are removed from Start.
17. A chip puts its guide in the box only when the box is empty or holds a guide, and puts the caret after the first label. A second click takes the chip back. "Change" opens the places and the length under the line. A line about the AI program shows only when no program is ready.
18. `POST /api/home/uploads?name=<name>` keeps each file of the start box in a temporary folder of the home server, with the upload limit of document 15, and answers with an upload id. `POST /api/home/projects` takes `files` (`upload_id` and `name`, 20 at most) and `form`. After the engine of the project starts, the home server adds each file through `POST /api/uploads` of the engine, and then sends the first request with the files. A file that does not reach the project stops the first request, and the project screen says that a file did not reach the project. The temporary folder goes when the home server stops.
19. The first request gets the line "Form: trailer. Give this form to set_story."
20. When the first line of a request has no colon, the name of the project comes from the first filled line of the form "label: words". So two trailers from the guide get two names, for example "A bell for the island". A name that the word limit cuts does not end on a small word, such as "the", "a", or "of".
21. `GET /api/renders/chapters/<file>` serves the cut of a chapter, one folder below `renders`.

### Removed

22. The Making screen and its step list are removed. The words of the step actions move to `making/stepReasons.ts`, for the sound rows.
23. The suggestion chips are removed from the chat. The chat of the project screen shows no list of running work, because the work area shows the progress.

### After the review of the pull request

24. The next action compares `nextStepEstimateUsd` of a ready take with the money left (`spending` of `GET /api/media/servers`) before the send. When the estimate is more and the take has no note, the next action shows the line of WP82, for example "The clips cost about $3.20 and $1.10 is left. Nothing is spent until you pick.", with "Raise this project to $X", "Make fewer clips", and "Stop here". X follows the rule of WP82 item 15. The work of the next step is pictures after the story and after the cut of a chapter, and clips after the pictures.
25. "Raise" writes the own money limit of the project through `PUT /api/media/limits`, the route of the person, and then sends the take with no notes. `POST /api/takes/<id>/send` takes `next`: `go` (the default), `fewer`, or `stop`. With `fewer`, the request says "Take 1 of the pictures: all good. Make fewer clips.", and its details add the estimate and the money left, and ask the lead to make only what fits. With `stop`, the send approves the items and starts no turn, and the change line says "You approved take 1 of the pictures, and stopped there.".
26. A turn of the lead that calls `open_take` or `ready_take` keeps its change entry with `quiet: true`. The chat shows no change line for it, so a take shows as the words of the lead and the card of item 14. The edits stay in the history of the project.
27. A take has one name in the chat, the requests, and the notice: "The story" for the story, and "Take N of the pictures", "of the clips", or "of the cut" for the other steps, with "in chapter K" when the film has more than one chapter. The function `takeTitleOf` of `@yumekit/project/takes` makes it. So the send says "You approved the story." and "The story: all good. Go on.", and then "Take 1 of the pictures is ready".
28. `ready_take` keeps the items in the order in which the lead names them. The contact sheet orders each section by the shot of the plan, then by the cast, then by that order, so the order does not change with the time at which each file finished.
29. The ask box says "Ask the lead, or drop files here". The state "This project has no video shape yet" of the editor has "Back to the project".
30. "Open its takes" of a picked chapter block in "Edit by hand" opens the take view in a sheet: the ready take of the chapter, else its open take, else its newest take. A chapter with no take says so. The editor reads the takes and the chapters with `takeSchema` and `chapterSchema` of `@yumekit/project/takes` (item 27 of WP84).

## Details of WP77

These decisions came from the build of the skill and the guide on 2026-11-26.

### Where each text lives

1. Each principle has one home, and the other texts point to it. `skills/yumekit/SKILL.md` has the whole picture: the work with the person in six steps, "Story first", "Craft from the trailer runs", and the batches. `get_story_guide` has what the lead needs at each step. A tool description and a tool answer have what that tool needs.
2. The guide starts with "Work with the person, one take at a time", before "Story first". It replaces "The order of work". The batches and the checks of each batch are now inside the steps of the pictures and the clips.
3. The rules of the lead get rule 43 (questions in rounds) and rule 44 (takes, the price of the next step, and a new take of only the marked items). Rules 35, 36, 40, and 42 are shorter and send the detail to the guide. Step 6 of the server instructions names the steps and the takes in short, and points to the guide.
4. Rule 7 changes: the lead renders the whole video only when the person asks for the file. The take of a cut renders one chapter with `render_video` and `chapter_id`.
5. Rule 36 moves the faults into the note of each item and `what_to_check`. The time of each stage now goes in the line of the cut of the last chapter, because each turn of the take flow ends with one short line.

### The flow

6. A round of questions has 3 to 6 questions, each with 2 to 6 options in the words of the request where it can. The lead adds no "Other" option, because the card always has a line for the person's own words. It asks another round only when a choice that changes the story is still open.
7. The story is a take: `open_take` with step `story`, `set_story`, then `ready_take` with the item `story`. The note gives the core of the story and the choice that the lead is least sure of. The line of `get_work` and of `set_story` for a story with no yes, the note of `set_story_plan`, and the input `approval` of `set_story` now say the take. A yes in the chat still works with `approval` `person-said-yes` (WP83, item 10).
8. A trailer of up to a minute is one chapter. A longer film gets chapters of about 1 to 3 minutes in `set_story_plan`, and the lead says the split in one short message and goes on.
9. The music is part of the take of the clips (WP80). So the guide puts the music before the cut: `set_tempo` with the tempo of the chosen music, cuts on its beats, and cards on its hits. The music candidates go into that take with a note on how each differs, and the person drops the others.
10. `ready_take` reads the money left of the project and compares it with the estimate of the next step. When the estimate is more, its line tells the lead to say so before any work and to offer fewer items, the ones that matter most for the film. Its answer gives `money_left_usd`. When the estimate is more than 0, the line asks the lead to give the price of the next step. The hint of `over-money-left` (WP82) already covers a refused batch, so the guide does not repeat it.
11. The description of `set_story_plan` says that `review_plan` is a second look of the critic when the person asks for one, and that no picture or clip waits for it. WP76 removed the gate (WP80, follow-up 1).

### The craft

12. Each lesson of the trailer runs sits in the section of its step, with its reason: the stakes in the first part of a trailer and in a fight; a wide shot before the close ones in the plan and in a fight; moments from other parts of the film in the trailer form; a place that people built and use in the sheets; one voice for each character in the video prompt; no jump of place inside one moment in "Space across a cut"; and the music before the cut. "Words on screen and spoken lines" stays as it was.
13. "Fight one or two opponents, not ten" was a blanket rule, and the last film asked for one fight against many warriors. The guide now says that each opponent on screen needs its own design, place, attack, and reaction, and that a fight against many works as a run of short shots. The warning of `set_story_plan` for more than two opponents stays a note.
14. The craft lines name no film and no character. They describe each fault, for example a pond in the middle of a road, or an enemy on a roof and then next to the hero.
15. The easy way of the skill names the Start screen of WP83: a template, the box, and "Start". The questions come on a card, and each step comes back as a take.

### The real check

16. On 2026-11-26 the home server of the branch ran in a new temporary configuration folder and projects folder. The only media server was the sample server, and no media key was in the environment. Claude Code 2.1.332 was the lead, with its default model (Opus 5.5) and effort. The request was the trailer template: "A trailer, about 30 seconds." with a story of two lines about a girl who mends clocks in a mountain town, and empty lines for the characters, the look, what it must show, and the words on screen.
17. Within 31 seconds of the start, the lead called `get_work`, `get_story_guide`, and `ask_person` with 6 questions of 3 or 4 options, for example "Keep it a mystery" and "You choose". It added no "Other" option and ended its turn with one sentence.
18. The answers went through `POST /api/chat/answers`, one of them in the person's own words. In 41 seconds the lead opened a take of the story, wrote the story (one `set_story` failed on an id that two parts shared, and the second call worked), and called `ready_take`. Its note named the twist and the title as the choices that it was least sure of. The own words of the person (16, alone above the shop of her late grandfather) are in the story.
19. After the yes, the lead wrote a plan of 7 shots and 4 cards, the cast, and the look in 164 seconds. The cards come from the story, for example "Every clock remembers who mended it". Then it stopped and said that the test service makes only placeholders, and offered a key or a film drawn by code. After "Make the pictures with the free test service anyway", it made the take of the pictures in 52 seconds: the sheets in one batch, the start pictures in one batch, one `check_design`, and `ready_take`. Each note names a risk, for example the hands of the baker, a name written in a picture, and a reflection that fades.
20. The person sent that take with one note and a pin on the first shot: open wider on the village, with people who wave, to show that the town knows her. In 93 seconds the lead added a wide shot of the village stairs before the close shot at the workbench, with two people who wave. It kept the crowd to two and said why ("crowds tend to come out frozen or all looking alike"), and it kept the workbench shot in the take with a note to mark it if the person wants it gone.
21. What the lead still does wrong: its first plan had no wide shot of the village and did not show the town that knows her, although the guide asks for both. It did not say what it took from the answers before the story. With no estimate from `ready_take`, it guessed "about $1 to 2" (with an en dash) and said that the sheets cost nothing. In the take after the note, it ran no `check_design` for the new picture, and said so.
22. The evidence (the chat, the questions, the takes with the notes, the story and the plan, and a screenshot of take 2 of the pictures) is in the pull request.

## Details of WP85

These decisions came from the cleanup of the follow-ups of WP80 to WP84 on 2026-11-26.

### Test engines and agent programs

1. Each engine that the editor test helper `runEngine` starts gets a `PATH` of its own: one folder with links to `node`, `ffmpeg`, and `ffprobe`, and the empty agent programs that the test names, then `/usr/bin` and `/bin`. The fake agent keeps its own `PATH`. So a test engine never finds the `claude`, `codex`, or `cursor-agent` of the computer, and a request or a sign-in check never starts one.
2. The folder of the running `node` is no longer on that `PATH`, because a global npm install of an agent program puts the program there.

### The sound of a video in a move

3. `move_scene_clip` moves the sound of each video with its clip, by the rule of item 4 of WP84: only when the video has one scene clip and one sound clip, to the start of the clip, and no longer than the clip. The tool description says so.
4. `resize_scene_clip`, `remove_scene_clip`, and `duplicate_scene_clip` still leave the sound of each later video in place. A resize needs the full length of the sound to grow it again, so that change waits for its own design.

### The ruler

5. The labels of the ruler are at least 64 pixels apart. The step is the smallest of 1, 2, 5, 10, 15, 30, 60, 120, 300, and 600 seconds that keeps that space at the width of the ruler. A label shows only when 40 pixels are left before the end of the ruler, and a label never wraps.
6. A film of 40 seconds now shows "0 s", "10 s", "20 s", and "30 s" at the width of a phone, and a label every 5 seconds at 1440 pixels, as before.

### Lines of the changes of the person

7. Each tool that changes the project has its own line in the chat, for example "You changed the music.", "You changed the fonts of the video.", "You changed the beat of the video.", and "You changed how the AI checks the film.". "You changed the project." stays only for a change that no tool names.
8. Two lines name the value: "You turned off "Approve pictures before clips"." (or "on"), and "You renamed the project to "The ferry".".
9. One act of the person that only adds files says how many: "You added 3 files to the project.". One file keeps "You added a file to the project.". An act that adds a file and then changes something else keeps the line of its last change.

### Test folders and a test that raced

10. `temporaryFolder` of the render tests removes its folder when the test ends. A test file that makes its project in `beforeAll` uses `folderOfTheFile` and removes the folder in `afterAll`. A full run of the render tests now leaves no `yumekit-render-test-*` folder.
11. The cause of the steering in `chat.changes.browser.test.ts`: the words of an answer show in the chat before the request ends, and the engine turns a message into steering while a request runs. Under load, the second message came in that gap. The test now holds the end of the first answer, checks that Stop shows, lets the answer end, and sends the second message only after Stop goes.

### Found in the run of WP77

12. "New" in a take means new in this take: the lead made it while the take was open, or it is a remake with `replaces_asset_id`. `ready_take` stores `earlier: true` on an item that names an asset that the take did not hold yet. The take view shows no "New" on it, and the large view says "Made before this take". A take that was ready before this change has no `earlier`, so it shows as before.
13. The editor follows the theme that the person picks, as document 11 and the prototype say: dark by default, and light from the button of the top bar, kept in `localStorage` as `yumekit-theme`. Neither the editor nor the prototype follows the color scheme of the browser. So a light screenshot sets `yumekit-theme` to `light` before the page loads, or presses "Use the light theme". The color scheme of Playwright alone gives the dark editor twice. No code changed for this.

### Follow-ups

1. Other tests also leave folders in the temporary folder of the system, for example `yumekit-project-*`, `yumekit-gemini-media-*`, `yumekit-fal-media-*`, `yumekit-openai-media-*`, and `yumekit-local-music-*`.
2. A rename of a scene in the Scene tab shows "You changed the text of scene N.".
