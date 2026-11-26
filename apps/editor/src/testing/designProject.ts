import { z } from "zod";
import type { RunningEngine } from "./runEngine.js";

const resultSchema = z.object({ text: z.string() });

function textOf(result: unknown): string {
  return resultSchema.parse(result).text;
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

export async function checkDesign(options: {
  engine: RunningEngine;
  assetId: string;
  shotId: string;
  breakFrom?: number;
}): Promise<void> {
  const { engine, assetId, shotId, breakFrom } = options;
  const brief = textOf(
    await engine.callTool({
      name: "check_design",
      input: { asset_id: assetId, shot_id: shotId },
    }),
  );
  const count = Number(/ with (\d+) questions/.exec(brief)?.[1] ?? "0");
  const required = framesOf(brief);
  const extra: { assetId?: string; seconds?: number }[] =
    breakFrom === undefined ||
    required.some((frame) => frame.assetId !== undefined)
      ? []
      : [{ seconds: breakFrom }, { seconds: breakFrom - 0.25 }].filter(
          (wanted) =>
            !required.some((frame) => frame.seconds === wanted.seconds),
        );
  const design = [...required, ...extra].map((frame) => {
    const broken = breakFrom !== undefined && (frame.seconds ?? 0) >= breakFrom;
    return {
      cast_id: "smith",
      ...(frame.assetId === undefined ? {} : { asset_id: frame.assetId }),
      ...(frame.seconds === undefined ? {} : { seconds: frame.seconds }),
      answers: Array.from({ length: count }, (...[, index]) => ({
        question: index + 1,
        answer: broken && index === 1 ? "no" : "yes",
        seen:
          broken && index === 1
            ? "The apron now has long sleeves"
            : "As the turnaround",
      })),
    };
  });
  for (const frame of design) {
    await engine.callTool({
      name: "check_design",
      input: {
        asset_id: assetId,
        shot_id: shotId,
        cast_id: frame.cast_id,
        ...(frame.asset_id === undefined ? {} : { asset_id: frame.asset_id }),
        ...(frame.seconds === undefined ? {} : { seconds: frame.seconds }),
      },
    });
  }
  await engine.callTool({
    name: "check_design",
    input: { asset_id: assetId, shot_id: shotId, design },
  });
}

export async function dressStoryProject(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "put_cast_member",
    input: {
      cast_id: "smith",
      kind: "person",
      name: "Aiko",
      description: "Aiko",
      looks: [
        {
          look_id: "default",
          name: "Forge apron",
          clothes: ["A long leather apron over a sleeveless grey tunic"],
          props: [{ name: "hammer", count: 1, side: "in her right hand" }],
        },
      ],
    },
  });
  await checkDesign({ engine, assetId: "strike-clip", shotId: "strike" });
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "quench-start",
      capability: "image",
      shot_id: "quench",
      input: { width_pixels: 64, height_pixels: 36 },
    },
  });
  await checkDesign({
    engine,
    assetId: "quench-start",
    shotId: "quench",
    breakFrom: 0,
  });
}

export async function cutQuenchClip(engine: RunningEngine): Promise<void> {
  await engine.callTool({
    name: "generate_asset",
    input: {
      asset_id: "quench-clip",
      capability: "video",
      shot_id: "quench",
      input: { duration_seconds: 4 },
    },
  });
  await checkDesign({
    engine,
    assetId: "quench-clip",
    shotId: "quench",
    breakFrom: 2,
  });
}
