import type { JsonObject } from "@yumekit/tools";
import type { CriticScript } from "./criticFixture.js";
import type { Harness, ToolCall } from "./harnessFixture.js";
import {
  makeForgeSheets,
  passPlan,
  setPlan,
  shotCall,
  startStoryHarness,
} from "./storyFixture.js";

export interface DesignBreak {
  question: number;
  assetId?: string;
  fromSeconds?: number;
}

export const smithLook = {
  look_id: "default",
  name: "Forge apron",
  clothes: ["A long leather apron over a sleeveless grey tunic"],
  props: [{ name: "hammer", count: 1, side: "in her right hand" }],
  sheets: [{ asset_id: "smith-sheet", kind: "turnaround" }],
};

export function dressSmith(options: {
  harness: Harness;
  looks?: object[];
  extra?: Record<string, unknown>;
}): Promise<ToolCall> {
  return options.harness.call({
    name: "put_cast_member",
    arguments: {
      cast_id: "smith",
      kind: "person",
      name: "SMITH",
      description: "The smith",
      looks: options.looks ?? [smithLook],
      ...options.extra,
    },
  });
}

function framesOf(brief: string): { assetId?: string; seconds?: number }[] {
  const line =
    brief.split("\n").find((entry) => entry.startsWith("Design frames: ")) ??
    "";
  return line
    .replace("Design frames: ", "")
    .split("; ")
    .flatMap((part): { assetId?: string; seconds?: number }[] => {
      const picture = /^picture "([^"]+)"/.exec(part);
      if (picture?.[1] !== undefined) return [{ assetId: picture[1] }];
      const time = /^([\d.]+)s/.exec(part);
      return time?.[1] === undefined ? [] : [{ seconds: Number(time[1]) }];
    });
}

function isBrokenAt(options: {
  designBreak: DesignBreak | undefined;
  frame: { assetId?: string; seconds?: number };
}): boolean {
  const { designBreak, frame } = options;
  if (designBreak === undefined) return false;
  if (designBreak.assetId !== undefined) {
    return frame.assetId === designBreak.assetId;
  }
  return (frame.seconds ?? 0) >= (designBreak.fromSeconds ?? 0);
}

export function designAnswersOf(options: {
  brief: string;
  designBreak?: DesignBreak;
}): JsonObject[] {
  const { brief, designBreak } = options;
  const people = [
    ...brief.matchAll(/^Design person "([^"]+)" look "[^"]+" with (\d+) /gm),
  ];
  const frames = framesOf(brief);
  const from = designBreak?.fromSeconds;
  const extra: { assetId?: string; seconds?: number }[] =
    from === undefined || frames.every((frame) => frame.assetId !== undefined)
      ? []
      : [{ seconds: from }, { seconds: Math.max(0, from - 0.25) }].filter(
          (wanted) => !frames.some((frame) => frame.seconds === wanted.seconds),
        );
  return people.flatMap(([, castId = "", count]) =>
    [...frames, ...extra].map((frame) => ({
      cast_id: castId,
      ...(frame.assetId === undefined ? {} : { asset_id: frame.assetId }),
      ...(frame.seconds === undefined ? {} : { seconds: frame.seconds }),
      answers: Array.from({ length: Number(count) }, (...[, index]) => {
        const broken =
          isBrokenAt({ designBreak, frame }) &&
          designBreak?.question === index + 1;
        return {
          question: index + 1,
          answer: broken ? "no" : "yes",
          seen: broken
            ? "The apron has long sleeves now."
            : "As the turnaround.",
        };
      }),
    })),
  );
}

export async function startDesignStory(critic: CriticScript): Promise<Harness> {
  const harness = await startStoryHarness({ videoStyle: "ai-video", critic });
  await makeForgeSheets(harness);
  await dressSmith({ harness });
  await setPlan({ harness, shots: [{ shot_id: "strike" }] });
  await passPlan(harness);
  return harness;
}

export async function reviewedStart(options: {
  harness: Harness;
  endPicture?: boolean;
}): Promise<ToolCall> {
  const { harness } = options;
  await shotCall({
    harness,
    assetId: "strike-start",
    capability: "image",
    shotId: "strike",
  });
  if (options.endPicture === true) {
    await shotCall({
      harness,
      assetId: "strike-end",
      capability: "image",
      shotId: "strike",
      prompt: "The blade is bent",
      extra: { key_picture: "end" },
    });
  }
  return harness.call({
    name: "review_start",
    arguments: {
      asset_id: "strike-start",
      shot_id: "strike",
      ...(options.endPicture === true
        ? { end_picture_asset_id: "strike-end" }
        : {}),
    },
  });
}
