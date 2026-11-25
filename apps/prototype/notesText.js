export const changes = [
  [
    "A smaller file on Export",
    "Each file has a File size choice: Best quality, or Smaller file under 10 MB, under 25 MB, or your own size. The sheet shows the expected size first and keeps the picture size. When the size is too small for the length, one line offers a smaller picture size. A done file shows its real size. You can export the whole film or one chapter.",
  ],
  [
    "Start from a template",
    'A trailer, a movie, a video, or something else. A template puts a short guide in the prompt, such as "The story:" and "The main characters:". You fill it in. One line tells you to give the lead as much detail as you can.',
  ],
  [
    "Files in the prompt and in the chat",
    "Drag, drop, or paste pictures, character sheets, places, clips, music, or a story. Each file shows as a chip with a small picture and Remove. Add files does the same with a click.",
  ],
  [
    "The story comes first",
    "The lead asks its questions first, with answer buttons and room for your own words. Then it writes the whole story and the script. You comment on a paragraph, send your notes, or approve the story.",
  ],
  [
    "Chapters",
    "A long film is split into chapters, and the lead says so in the chat. Chapters are the top row of the timeline. You drag a scene into another chapter, drag a chapter to move it, and drag the line between two chapters. Rename, split, and join are there too.",
  ],
  [
    "The detailed timeline moves by hand",
    "Drag a chapter, a scene, or the music. Drag an edge to change a length. Drag a picture or a clip from Takes onto a scene.",
  ],
  [
    "Takes",
    "Each round of the lead's work is a take: Take 1, Take 2. You approve, decline, pin a point on a picture, mark a moment in a clip, or write a note. Send my notes starts the next take, and the new items show with New. Make the clips opens only when every shot picture is approved.",
  ],
  [
    "Limits for every project",
    "Settings sets the money and the seconds of real video once, for every project. When the lead reaches a limit, the chat asks: Raise this project, or Keep the limit.",
  ],
];

export const proposed = [
  [
    "Progress and a ready signal",
    'The top bar and the Making screen show the step and a count, such as "making 6 of 18 pictures". When a take is ready, a sound, a browser notice, and a line in the corner say so. Why: in the last run you asked for the progress six times.',
  ],
  [
    "The lead's honest note",
    "Each item has a note from the lead: what it is, and what the lead sees wrong in it. Why: the lead's own list of faults told you where to look.",
  ],
  [
    "A price before each paid step",
    '"Clips for chapter 2: about $2.52. Make them?" Each take shows its cost and the money that went to declined items.',
  ],
  [
    "The design check as a badge",
    "Each picture and clip shows the result of the design check. Why: in the last run the lead placed clips with no check of its own.",
  ],
  [
    "What to check",
    "Each clip and music item has one line that tells you what to watch or hear, because the lead cannot watch motion or hear sound.",
  ],
  [
    "Approve pictures before clips",
    "On by default, with a switch in Settings for a quick draft. Why: you found faults in three rounds of pictures before any money went to clips.",
  ],
];

export const screens = [
  ["Start", "Templates, the prompt with files, where it goes, and how long."],
  [
    "Making",
    "The lead's questions, the story, the chapters, then the pictures of chapter 1, with a stop at each step.",
  ],
  [
    "Editor",
    "The film, the chat, and the chapters above the scene cards. Turn on Detailed timeline to drag.",
  ],
  [
    "Story",
    "The whole story and the script by chapter, with a comment on each paragraph.",
  ],
  [
    "Takes",
    "Every picture, clip, and music of a chapter, round by round. Click Large view, or press Enter on an item.",
  ],
  [
    "Settings",
    "Limits for every project, and two switches of how the lead works.",
  ],
];

export const limits = [
  "This is a mock. The lead's answers are fixed, and the pictures are simple drawings.",
  "A clip plays as a slow camera move on its picture. Music plays no sound.",
  "The Making screen starts a new film. The editor opens on the same film, later, with chapter 2 in review.",
];

export const questions = [
  {
    text: "When you approve a take, what happens next?",
    words: [
      [
        "ask",
        "The lead shows the price and waits for your yes, as in this mock.",
      ],
      ["go", "The lead starts the next step at once, inside your limits."],
    ],
  },
  {
    text: "How does the lead split a long film?",
    words: [
      ["chapters", "By story chapters of 1 to 3 minutes, as in this mock."],
      ["equal", "Into equal parts, for example 2 minutes each."],
    ],
  },
  {
    text: "Where does Takes live?",
    words: [
      ["sheet", "A full page over the editor, as in this mock."],
      ["tab", "A tab next to the chat."],
    ],
  },
  {
    text: "Keep the six proposed ideas?",
    words: [
      ["all", "Keep all six."],
      ["list", "Tell me the ones to drop."],
    ],
  },
];
