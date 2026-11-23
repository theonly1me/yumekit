import {
  platformOf,
  type Edit,
  type Output,
  type PlatformId,
  type ProjectSnapshot,
} from "@yumekit/project";

export interface PlatformEdits {
  edits: Edit[];
  line: string;
}

export type PlatformPlan =
  | { kind: "already-added"; outputId: string }
  | ({ kind: "edits" } & PlatformEdits);

function ratioOf(size: { widthPixels: number; heightPixels: number }): number {
  return size.widthPixels / size.heightPixels;
}

export function nearestOutputOf(options: {
  outputs: readonly Output[];
  widthPixels: number;
  heightPixels: number;
}): Output | undefined {
  const target = ratioOf(options);
  const distanceOf = (output: Output) => Math.abs(ratioOf(output) - target);
  return options.outputs.reduce<Output | undefined>(
    (...[nearest, output]) =>
      nearest === undefined || distanceOf(output) < distanceOf(nearest)
        ? output
        : nearest,
    undefined,
  );
}

function holderOf(options: {
  outputs: readonly Output[];
  platformId: PlatformId;
}): Output | undefined {
  return options.outputs.find((output) =>
    (output.platforms ?? []).includes(options.platformId),
  );
}

export function addPlatformPlan(options: {
  snapshot: ProjectSnapshot;
  platformId: PlatformId;
}): PlatformPlan {
  const { outputs } = options.snapshot.project;
  const platform = platformOf(options.platformId);
  const holder = holderOf({ outputs, platformId: platform.id });
  if (holder !== undefined) {
    return { kind: "already-added", outputId: holder.id };
  }
  const sameSize = outputs.find(
    (output) =>
      output.widthPixels === platform.widthPixels &&
      output.heightPixels === platform.heightPixels,
  );
  if (sameSize !== undefined) {
    return {
      kind: "edits",
      edits: [
        {
          kind: "setOutputPlatforms",
          outputId: sameSize.id,
          platforms: [...(sameSize.platforms ?? []), platform.id],
        },
      ],
      line: `${platform.name} added to the output "${sameSize.id}". No new output.`,
    };
  }
  const nearest = nearestOutputOf({ outputs, ...platform });
  const addOutput: Edit = {
    kind: "addOutput",
    output: {
      id: platform.outputId,
      label: platform.outputLabel,
      widthPixels: platform.widthPixels,
      heightPixels: platform.heightPixels,
      platforms: [platform.id],
    },
  };
  if (nearest === undefined) {
    return {
      kind: "edits",
      edits: [addOutput],
      line: `${platform.name} added with the new output "${platform.outputId}". Its timeline is empty.`,
    };
  }
  return {
    kind: "edits",
    edits: [
      addOutput,
      {
        kind: "copyTimeline",
        fromOutputId: nearest.id,
        toOutputId: platform.outputId,
      },
    ],
    line: `${platform.name} added with the new output "${platform.outputId}", a copy of the timeline of "${nearest.id}". Check it with contact_sheet.`,
  };
}

export function removePlatformPlan(options: {
  snapshot: ProjectSnapshot;
  platformId: PlatformId;
}): PlatformEdits | undefined {
  const { outputs } = options.snapshot.project;
  const platform = platformOf(options.platformId);
  const holder = holderOf({ outputs, platformId: platform.id });
  if (holder === undefined) return undefined;
  const remaining = (holder.platforms ?? []).filter(
    (platformId) => platformId !== platform.id,
  );
  if (remaining.length === 0 && outputs.length > 1) {
    return {
      edits: [{ kind: "removeOutput", outputId: holder.id }],
      line: `${platform.name} removed with the output "${holder.id}", because no other platform used it. undo brings it back.`,
    };
  }
  return {
    edits: [
      { kind: "setOutputPlatforms", outputId: holder.id, platforms: remaining },
    ],
    line: `${platform.name} removed from the output "${holder.id}". The output stays.`,
  };
}
