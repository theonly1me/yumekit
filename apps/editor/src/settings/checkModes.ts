export const checkModeIds = ["draft", "critic"] as const;

export type CheckModeId = (typeof checkModeIds)[number];

export const checkChoices: { id: CheckModeId; name: string; line: string }[] = [
  {
    id: "draft",
    name: "Fast draft",
    line: "The AI checks that each character keeps its design. Ask for a second look at any shot.",
  },
  {
    id: "critic",
    name: "Careful",
    line: "A second AI checks every picture and clip. Slower, and it uses more of your AI plan.",
  },
];
