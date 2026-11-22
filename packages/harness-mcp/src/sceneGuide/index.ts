import { sceneGuideExamples } from "./examples.js";
import { motionDesignSection } from "./motionDesign.js";
import { contractSection, rulesSection } from "./reference.js";

function exampleSection(options: {
  number: number;
  example: (typeof sceneGuideExamples)[number];
}): string {
  const { number, example } = options;
  return [
    `## Example ${String(number)}: ${example.title}`,
    "",
    "Props for put_scene:",
    "",
    "```json",
    JSON.stringify(example.props),
    "```",
    "",
    "Code:",
    "",
    "```tsx",
    example.code.trimEnd(),
    "```",
    "",
  ].join("\n");
}

export const sceneGuide = [
  contractSection,
  rulesSection,
  motionDesignSection,
  ...[...sceneGuideExamples.entries()].map(([index, example]) =>
    exampleSection({ number: index + 1, example }),
  ),
].join("\n");

export { sceneGuideExamples };
