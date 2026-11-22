const changes = [
  [
    "The prompt comes first",
    "Pass 3 had no place to type a request. Now the start screen is one prompt, and the editor keeps a chat with the AI on the right at all times.",
  ],
  [
    "You can change things yourself",
    "Pass 3 showed a timeline that you could not change. Now you click the text in the video to change it, drag a scene to move it, and use the buttons of a scene to change its length, duplicate it, or delete it.",
  ],
  [
    "Scenes are cards, not tracks",
    "The lower area starts as a row of large scene cards with three plain rows: Voice, Music, and Captions. The track view is behind the switch Detailed timeline.",
  ],
  [
    "Platforms replace Wide and Tall",
    "You pick where the video goes: YouTube, YouTube Shorts, TikTok, Instagram Reel, Instagram post, X, LinkedIn, Square, or a custom size. Each place is a tab above the video and a file in Export.",
  ],
  [
    "A real video clip is one click from a scene",
    "Make a real video clip is a button on each picked scene and in the Scene tab. The chat can open it too. The price shows before the button.",
  ],
  [
    "A key shows only when it is needed",
    "Tools and keys moved to Settings. If a model needs a key, the steps show inside Make a real video clip, and the clip continues after you save the key.",
  ],
  [
    "Each change has Undo",
    "The chat lists each change in plain words, from you or from the AI, with Undo next to it.",
  ],
  [
    "Plain words",
    "Export replaces Render. The interface does not say track, frame, asset, or MCP.",
  ],
];

const screens = [
  ["Start", "One prompt, where the video goes, and how long. One button."],
  ["Making", "Plain steps that fill in, scenes that appear, and Stop."],
  [
    "Editor",
    "The video in the centre, platform tabs above, the chat on the right, scene cards below.",
  ],
  [
    "Make a real video clip",
    "Model, price, length, and the key steps in place when a key is missing.",
  ],
  ["Export", "One file for each place, with progress and Show the file."],
  ["Settings", "Which AI to use, media tools and keys, and limits."],
];

const limits = [
  "This is a mock. The AI answers are fixed. Try the four suggestions, or type a request with the word shorter, voice, add, music, or video.",
  "The pictures are color fills. The real editor shows the real video.",
  "Play moves through the scenes with no sound.",
];

const questions = [
  {
    text: "Where is the chat?",
    words: [
      ["visible", "The chat is always on the right, as in this mock."],
      [
        "tab",
        "The chat is one tab of the side panel, so the Scene tab can replace it.",
      ],
    ],
  },
  {
    text: "What is below the video?",
    words: [
      [
        "cards",
        "Scene cards, with the detailed timeline behind a switch, as in this mock.",
      ],
      ["timeline", "The detailed timeline is always visible."],
    ],
  },
  {
    text: "Does the AI stop for approval before it makes pictures?",
    words: [
      [
        "approve",
        "The AI shows the script and rough scenes first, and waits for your approval.",
      ],
      ["nostop", "The AI makes the full video with no stop, as in this mock."],
    ],
  },
  {
    text: "Which places are on at the start?",
    words: [
      ["both", "YouTube and TikTok are on, as in this mock."],
      ["youtube", "Only YouTube is on."],
      ["none", "Nothing is on. The person must pick."],
    ],
  },
];

function rowsMarkup(rows) {
  return rows
    .map(
      ([title, text]) =>
        `<div class="note-row"><h3>${title}</h3><p>${text}</p></div>`,
    )
    .join("");
}

function questionMarkup(question) {
  const words = question.words
    .map(
      ([word, meaning]) =>
        `<li><code>${word}</code><span>${meaning}</span></li>`,
    )
    .join("");
  return `<li><p>${question.text}</p><ul class="reply-words">${words}</ul></li>`;
}

export function renderNotes({ element }) {
  element.innerHTML = `
    <div class="notes-intro">
      <h2>Fourth pass: the prompt comes first</h2>
      <p>You said the editor was hard to use, that you could not see where to talk to the AI, that nothing looked editable, and that Wide and Tall were not enough. This pass starts again from one rule: you type what you want, and you can also change each simple thing yourself.</p>
    </div>
    <div><h2>What changed since the third pass, and why</h2>${rowsMarkup(changes)}</div>
    <div>
      <h2>The screens</h2>${rowsMarkup(screens)}
      <h2 class="notes-gap">Limits of this mock</h2>
      <ul class="plain-list">${limits.map((limit) => `<li>${limit}</li>`).join("")}</ul>
    </div>
    <div class="questions">
      <h2>Questions for you. Reply with one word for each.</h2>
      <ol>${questions.map(questionMarkup).join("")}</ol>
    </div>`;
}
