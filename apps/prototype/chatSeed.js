export const questionRounds = [
  [
    {
      text: "Who carries the bell across?",
      options: ["A young ferry hand", "An old bell ringer", "Two strangers"],
    },
    {
      text: "How does it end?",
      options: [
        "The fog lifts and the boats come home",
        "The bell rings, but too late",
        "Leave it open",
      ],
    },
    {
      text: "Does anyone help her on the way?",
      options: ["No, she is alone", "A stranger she saves", "Her grandfather"],
    },
  ],
  [
    {
      text: "How long should the film be?",
      options: ["About 8 minutes", "About 3 minutes", "A 60 second trailer"],
    },
    {
      text: "Which look fits best?",
      options: ["Painted, cold light", "Like a live film", "Paper cut-out"],
    },
  ],
];

export const roundTalk =
  "Thanks. That gives the story a goal, an obstacle, and an ending. Two more questions, about the length and the look.";

const seededAnswers = [
  [
    "A young ferry hand",
    "The fog lifts and the boats come home",
    "A young fisher she pulls out of the fog. Call him Pell.",
  ],
  ["About 8 minutes", "Painted, cold light"],
];

export function answersEntry({ round, answers }) {
  return {
    kind: "answers",
    pairs: [...questionRounds[round].entries()].map(([index, question]) => [
      question.text,
      answers[index],
    ]),
  };
}

export const firstRequest =
  "A movie, about 8 minutes, for YouTube.\nThe story: before the winter fog closes the sea, a girl must carry a new bell to the island, so the boats can find home.\nThe main characters: Wren, 16, a ferry hand. Her grandfather Odo, the bell ringer.\nThe look: painted, cold northern light, warm lamps.\nWhat it must show: the fog wall, snow on the island, the bell ringing at the end.";

export function firstChat() {
  return [
    { kind: "you", text: firstRequest },
    answersEntry({ round: 0, answers: seededAnswers[0] }),
    { kind: "ai", text: roundTalk },
    answersEntry({ round: 1, answers: seededAnswers[1] }),
    {
      kind: "ai",
      text: "I wrote the whole story and the script. Read it, comment on any paragraph, and approve it when it is right.",
      action: { label: "Read the story", go: "story" },
    },
    {
      kind: "ai",
      text: "The film is 8 minutes, too long to make at once. I split it into 4 chapters, and I make one chapter at a time:",
      split: [
        "1. The last crossing, 1:50",
        "2. Into the fog, 2:10",
        "3. Snow on Hollin, 2:20",
        "4. The ninth bell, 1:40",
      ],
      after:
        "You can move a scene to another chapter, or move the line between two chapters, in the timeline.",
      action: { label: "Open the chapters in the timeline", go: "chapters" },
    },
    {
      kind: "ai",
      text: "Chapter 1 is done. You approved its cut.",
      action: { label: "Open take 3", go: "takes", chapterId: "c1", number: 3 },
    },
    {
      kind: "take",
      text: "Take 2 of chapter 2 is ready for you: 2 pictures made again from your notes.",
      action: { label: "Open take 2", go: "takes", chapterId: "c2", number: 2 },
    },
  ];
}
