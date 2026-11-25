export const intro = {
  title: "Sixth pass: simple by default",
  text: "You said there are too many controls, and that the lead does most of the work. This pass keeps the look and puts one thing on the screen at a time: the lead at work, the story, a take, or the film. You talk to the lead in the chat, and you say yes or what to change. Everything else is still there, behind Edit by hand and More settings.",
};

export const changes = [
  [
    "Start is one box",
    "Three chips (A trailer, A movie, A video), one prompt box with Add files and Start inside, and one line on how to use the lead. Something else went: an empty prompt is something else. The places and the length moved behind Change. YouTube is the default, and the lead asks about the length.",
  ],
  [
    "The project screen replaces Making",
    "After Start, the lead asks its questions in the chat, with answer buttons. Then the story shows on the left with Approve the story. Then the chapters, then the pictures arrive as they finish. The step rail (Story, Pictures, Clips, Cut) shows where the chapter is. A past step opens its last take.",
  ],
  [
    "Mark only what is wrong",
    "A take is a contact sheet of pictures with no boxes and no buttons. Click a picture to see it large, pin a note, or say Don't use this one. A picture with no note counts as approved when you press the one button: Send 2 notes to the lead, or All good. Make the clips, about $2.52.",
  ],
  [
    "The take number is the slate",
    "Each take starts with its number set large. Earlier takes are a menu next to it. The six filters became one switch: Only new and waiting.",
  ],
  [
    "Where the advanced parts went",
    "Edit by hand opens the editor: the chapters by drag, the detailed timeline, and the full Takes page with its filters and Approve and Decline on each item. Compare, speeds, frame step, and What to check are in the large view. The editor lost its hint lines and its suggestion chips.",
  ],
  [
    "Settings and Export show the basics first",
    "Settings shows Who makes the film and Limits for every project. Media services, the checker, and Approve pictures before clips are under More settings. Export shows YouTube and the file size. The chapter choice and more places are under More.",
  ],
  [
    "A smaller file on Export",
    "Best quality, or Smaller file under 10 MB, under 25 MB, or your own size. The sheet shows the expected size first and keeps the picture size. When the size is too small for the length, one line offers a smaller picture size. A done file shows its real size.",
  ],
];

export const proposed = [
  [
    "Progress and a ready signal",
    'The project screen shows "making 6 of 18 pictures" with a thin line. When a take is ready, a sound, a browser notice, and a line in the corner say so.',
  ],
  [
    "The lead's honest note",
    "In the large view, the lead says what each item is and what it sees wrong in it.",
  ],
  [
    "A price on the next action",
    'The one button says what it costs: "All good. Make the clips, about $2.52".',
  ],
  [
    "The design check",
    "A failed design check shows as one plain line under the picture. A passed check shows only in the large view.",
  ],
  [
    "What to check",
    "Clips and music tell you what to watch or hear, because the lead cannot.",
  ],
  [
    "Approve pictures before clips",
    "On by default, under More settings, for a quick draft.",
  ],
];

export const screens = [
  [
    "Start",
    "1 primary (Start). Other: Settings, Add files, Change. The three chips belong to the prompt.",
  ],
  [
    "The project",
    "1 primary (the next action). Other: Edit by hand, Export, Settings. The step rail and the chapter menu are the place you are in.",
  ],
  [
    "A take",
    "In the project: the switch and the earlier takes menu, nothing on each picture.",
  ],
  ["The large view", "Don't use this one, a note, Previous, Next, Close."],
  ["Settings", "Who makes the film, Limits, then More settings."],
  ["Export", "The file size and Export, then More."],
];

export const limits = [
  "This is a mock. The lead's answers are fixed, and the pictures are simple drawings.",
  "A clip plays as a slow camera move on its picture. Music plays no sound.",
  "A new project starts at the questions. The project tab opens the same film later, with chapter 2 in review.",
];

export const questions = [
  {
    text: 'You said "select or decline". Is "mark only what is wrong" right?',
    words: [
      ["mark", "A picture with no note counts as approved, as in this mock."],
      [
        "each",
        "You approve or decline each picture, as in the full Takes page.",
      ],
    ],
  },
  {
    text: "Where do the lead's questions go?",
    words: [
      ["chat", "In the chat, as in this mock."],
      ["page", "On the left, in place of the work."],
    ],
  },
  {
    text: "When you approve a take, what happens next?",
    words: [
      [
        "ask",
        "The button shows the price, and the lead waits for your click, as in this mock.",
      ],
      ["go", "The lead starts the next step at once, inside your limits."],
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
