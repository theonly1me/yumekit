import { claudeLines } from "./chatTesting.js";

const checks = (count: number) =>
  Array.from({ length: count }, (...[, index]) => ({
    item: index + 1,
    seen: "Seen on the frames.",
  }));

export const criticSteps = [
  { print: claudeLines.init },
  {
    callTool: {
      name: "give_sheet_review",
      input: {
        checks: checks(8),
        counts: [],
        verdict: "pass",
        faults: [],
        notes: ["The apron is a shade lighter than the facts"],
      },
    },
  },
  {
    callTool: {
      name: "give_plan_review",
      input: {
        checks: checks(8),
        findings: [
          { index: 1, cause: "harmless", seen: "Her look is in the sheet." },
        ],
        shots: [
          {
            shot_id: "strike",
            difficulty: 2,
            limits: [],
            faults: [],
            notes: [],
          },
          {
            shot_id: "quench",
            difficulty: 4,
            limits: ["small-contact-target"],
            faults: [],
            notes: ["Frame the barrel large, so the blade meets the water"],
          },
        ],
        cast: [
          { cast_id: "forge", faults: [], notes: [] },
          { cast_id: "smith", faults: [], notes: [] },
        ],
        faults: [],
        notes: [],
        verdict: "pass",
        easiest_shot_id: "strike",
        hardest_shot_id: "quench",
      },
    },
  },
  {
    callTool: {
      name: "give_start_review",
      input: { checks: checks(8), counts: [], verdict: "pass", faults: [] },
    },
  },
  {
    callTool: {
      name: "give_clip_review",
      input: {
        checks: checks(11),
        counts: [{ object: "hammers", expected: 1, seen: 2, seconds: 0.8 }],
        action: { happened: true, seconds: 0.3, seen: "The hammer lands." },
        end_entries: [
          { entry: "smith", happened: true, seconds: 0.4, seen: "Bent." },
        ],
        start_match: { matches: true, seen: "The same anvil." },
        warnings: [1, 2, 3, 4, 5, 6].map((index) => ({
          index,
          cause: "harmless",
          seen: "A spark.",
        })),
        verdict: "cut",
        keep_from_seconds: 0,
        keep_to_seconds: 0.5,
        faults: ["The hammer changes hands at 0.8 seconds"],
        notes: ["0.3s: the sparks are a little orange"],
      },
    },
  },
  { print: claudeLines.result("completed") },
];
