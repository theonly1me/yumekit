import type { JsonObject } from "@yumekit/tools";
import {
  designAnswersOf,
  dressSmith,
  type DesignBreak,
} from "./designFixture.js";
import { designLooksOf } from "./designLooks.js";
import type { Harness, ToolCall } from "./harnessFixture.js";
import { makeSheet, setPlan, startStoryHarness } from "./storyFixture.js";

export interface LeadTarget {
  asset_id: string;
  shot_id: string;
}

export async function startDraftStory(shotIds: string[]): Promise<Harness> {
  const harness = await startStoryHarness({ videoStyle: "ai-video" });
  await makeSheet({ harness, castId: "forge", kind: "place", facts: [] });
  await harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: "forge",
      kind: "place",
      name: "FORGE",
      description: "The forge",
      facts: ["The door is on the right wall"],
      reference_asset_ids: ["forge-sheet"],
    },
  });
  await harness.call({
    name: "generate_asset",
    arguments: {
      asset_id: "smith-sheet",
      capability: "image",
      input: { prompt: "smith sheet", width_pixels: 32, height_pixels: 18 },
    },
  });
  await dressSmith({
    harness,
    extra: {
      facts: ["Short red hair"],
      reference_asset_ids: ["smith-sheet"],
    },
  });
  await setPlan({
    harness,
    shots: shotIds.map((shotId) => ({ shot_id: shotId })),
  });
  return harness;
}

function sectionsOf(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  for (const part of text.split(/^## /m).slice(1)) {
    const id = /^"([^"]+)"/.exec(part)?.[1];
    if (id !== undefined) sections.set(id, part);
  }
  return sections;
}

export async function checkedByLead(options: {
  harness: Harness;
  targets: LeadTarget[];
  designBreak?: DesignBreak;
}): Promise<ToolCall> {
  const { harness, targets } = options;
  const brief = await harness.call({
    name: "check_design",
    arguments: { assets: targets },
  });
  const sections = sectionsOf(brief.text);
  const design: JsonObject[] = [];
  for (const target of targets) {
    const answers = designAnswersOf({
      brief: sections.get(target.asset_id) ?? "",
      ...(options.designBreak === undefined
        ? {}
        : { designBreak: options.designBreak }),
    }).map((answer) => ({ ...answer, asset_id: target.asset_id }));
    for (const look of designLooksOf({ design: answers })) {
      await harness.call({
        name: "check_design",
        arguments: { ...target, ...look },
      });
    }
    design.push(...answers);
  }
  return harness.call({
    name: "check_design",
    arguments: { assets: targets, design },
  });
}
