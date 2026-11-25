import {
  designQuestionsOf,
  hasDesign,
  castLookOf,
  shotLookIdOf,
  turnaroundOf,
  type Asset,
  type CastMember,
  type DesignQuestion,
  type ProjectSnapshot,
  type ResolvedLook,
} from "@yumekit/project";

export const designFrameSeconds = 0.125;

export const designBracketSeconds = 0.25;

export interface DesignMember {
  member: CastMember;
  look: ResolvedLook;
  turnaround: Asset | undefined;
  questions: DesignQuestion[];
}

export type DesignTarget =
  | { kind: "pictures"; pictures: Asset[] }
  | {
      kind: "clip";
      clip: Asset;
      lengthSeconds: number;
      seconds: { seconds: number; why: string }[];
    };

export interface DesignCropSeen {
  castId: string;
  assetId: string | undefined;
  seconds: number | undefined;
}

export interface DesignJob {
  members: DesignMember[];
  target: DesignTarget;
  seen: DesignCropSeen[];
}

function onGrid(seconds: number): number {
  return Math.round(seconds / designFrameSeconds) * designFrameSeconds;
}

export function requiredSecondsOf(options: {
  lengthSeconds: number;
  flagged: { seconds?: number | undefined; kind: string }[];
}): { seconds: number; why: string }[] {
  const { lengthSeconds } = options;
  const last = Math.max(0, onGrid(lengthSeconds - designFrameSeconds));
  const wanted = [
    { seconds: 0, why: "the start" },
    { seconds: onGrid(lengthSeconds / 2), why: "the middle" },
    { seconds: last, why: "the end" },
    ...options.flagged.flatMap((warning) =>
      warning.seconds === undefined
        ? []
        : [
            {
              seconds: Math.min(last, onGrid(warning.seconds)),
              why: `the measure flags ${warning.kind}`,
            },
          ],
    ),
  ];
  return wanted
    .filter(
      (...[entry, index]) =>
        wanted.findIndex((other) => other.seconds === entry.seconds) === index,
    )
    .sort((...[first, second]) => first.seconds - second.seconds);
}

export function designMemberOf(options: {
  snapshot: ProjectSnapshot;
  member: CastMember;
  lookId: string;
}): DesignMember | undefined {
  const { snapshot, member } = options;
  if (!hasDesign(member)) return undefined;
  const look = castLookOf({ member, lookId: options.lookId });
  if (look === undefined) return undefined;
  const turnaroundId = turnaroundOf(look);
  return {
    member,
    look,
    turnaround: snapshot.assets.find((asset) => asset.id === turnaroundId),
    questions: designQuestionsOf({ member, look }),
  };
}

export function shotDesignJobOf(options: {
  snapshot: ProjectSnapshot;
  castIds: string[];
  castLooks: Record<string, string> | undefined;
  target: DesignTarget;
}): DesignJob | undefined {
  const { snapshot } = options;
  const members = snapshot.bible.cast.flatMap((member) => {
    if (!options.castIds.includes(member.id)) return [];
    const designed = designMemberOf({
      snapshot,
      member,
      lookId: shotLookIdOf({
        castLooks: options.castLooks,
        castId: member.id,
      }),
    });
    return designed === undefined || designed.questions.length === 0
      ? []
      : [designed];
  });
  return members.length === 0
    ? undefined
    : { members, target: options.target, seen: [] };
}

export function framesOf(job: DesignJob): {
  assetId: string | undefined;
  seconds: number | undefined;
  label: string;
}[] {
  const { target } = job;
  return target.kind === "pictures"
    ? target.pictures.map((picture) => ({
        assetId: picture.id,
        seconds: undefined,
        label: `picture "${picture.id}"`,
      }))
    : target.seconds.map((entry) => ({
        assetId: undefined,
        seconds: entry.seconds,
        label: `${String(entry.seconds)}s`,
      }));
}
