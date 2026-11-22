export const agents = [
  { id: "claude-code", name: "Claude Code", found: true },
  { id: "codex", name: "Codex", found: true },
  { id: "cursor", name: "Cursor", found: false },
];

export const mediaTools = [
  {
    id: "gemini",
    name: "Google Gemini",
    makes: "Video",
    keyName: "Gemini API key",
    site: "Google AI Studio",
    steps: [
      "Open Google AI Studio and sign in.",
      "On the API keys page, create a key.",
      "Set up billing. Video has no free plan.",
      "Copy the key and paste it here.",
    ],
  },
  {
    id: "fal",
    name: "fal",
    makes: "Video",
    keyName: "fal key",
    site: "the fal dashboard",
    steps: [
      "Open the fal dashboard and sign in.",
      "On the Keys page, add a key.",
      "Add credit to the account.",
      "Copy the key and paste it here.",
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    makes: "Pictures and voice",
    keyName: "OpenAI API key",
    site: "the OpenAI platform",
    steps: [
      "Open the OpenAI platform and sign in.",
      "Create a key.",
      "Copy the key and paste it here.",
    ],
  },
  {
    id: "sample",
    name: "Sample library",
    makes: "Test pictures, voice, music, and video",
  },
];

export const videoModels = [
  {
    id: "omni",
    name: "Omni 1.2 Flash",
    tool: "gemini",
    note: "Fast, with sound. The lowest price.",
    dollarsPerSecond: 0.07,
  },
  {
    id: "seedance",
    name: "Seedance 2.5",
    tool: "fal",
    note: "The most real people and motion.",
    dollarsPerSecond: 0.47,
  },
  {
    id: "sample",
    name: "Sample clip",
    tool: "sample",
    note: "A test clip. Use it to try the steps.",
    dollarsPerSecond: 0,
  },
];

export const clipLengths = [4, 5, 8, 10];

export function toolOf(toolId) {
  return mediaTools.find((tool) => tool.id === toolId);
}

export function priceText({ model, seconds }) {
  const amount = model.dollarsPerSecond * seconds;
  return amount === 0 ? "Free" : `About $${amount.toFixed(2)}`;
}
