const changes = [
  [
    "Each step opens",
    "On the Making screen, a step that is done is a button. It opens the script, the pictures, the voice, or the music next to the steps.",
  ],
  [
    "You can change the script",
    "The script is a page that you type in, with Bold, Italic, Heading, and List. After a change, yumekit asks if the AI must update the video to match.",
  ],
  [
    "You see the real pictures",
    "Each scene shows its picture in the shape of the platform. Click a picture to see it large, change its text, ask the AI for a change, or use your own picture.",
  ],
  [
    "You can listen, change, and bring your own sound",
    "The music and the voice have Play. You can try another music, describe the music, use your own sound file, download it, or remove it.",
  ],
  [
    "The video does not open the editor by itself",
    "When the video is ready, the screen stays. You check what you want, then you click Open the editor.",
  ],
  [
    "The same views are in the editor",
    "The editor has the buttons Script and Pictures at the top. The rows Voice and Music have Open.",
  ],
];

const screens = [
  ["Start", "One prompt, where the video goes, and how long. One button."],
  ["Making", "Steps that fill in. Each done step opens to see and change."],
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
  "This is a mock. The AI answers are fixed, and the pictures are color fills.",
  "Play shows a moving line with no sound. A sound file of your own does play.",
  "Download the script saves a real file. The other downloads only show a note.",
];

const questions = [
  {
    text: "When can you change a step?",
    words: [
      [
        "wait",
        "You can look at any time. You can change it when the AI finishes, or after Stop, as in this mock.",
      ],
      [
        "live",
        "You can change it while the AI still works. The AI then reads your change before its next step.",
      ],
    ],
  },
  {
    text: "What happens when the video is ready?",
    words: [
      [
        "stay",
        "The screen stays until you click Open the editor, as in this mock.",
      ],
      ["jump", "The editor opens by itself, as before."],
    ],
  },
  {
    text: "What happens after you change the script?",
    words: [
      ["ask", "yumekit asks, and you click Update the video, as in this mock."],
      ["auto", "The AI updates the video at once."],
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
      <h2>Fifth pass: you can open each step</h2>
      <p>You said that the Making screen needs more control. You want to read and change the script, to see the pictures in place of black boxes, to open the music and change it, and to use and download your own music. This pass makes each step a place that you can open.</p>
    </div>
    <div><h2>What changed since the fourth pass, and why</h2>${rowsMarkup(changes)}</div>
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
