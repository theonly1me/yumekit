import type { CastMember, Shot, StoryPlan } from "@yumekit/project";

export function planNoteLinesOf(options: {
  plan: StoryPlan | undefined;
  shot: Shot;
  members: CastMember[];
}): string[] {
  const { shot } = options;
  return [
    ...(options.plan?.planNotes ?? []).map((note) => `- The plan: ${note}`),
    ...(shot.planNotes ?? []).map((note) => `- Shot "${shot.id}": ${note}`),
    ...options.members.flatMap((member) =>
      (member.planNotes ?? []).map((note) => `- "${member.id}": ${note}`),
    ),
  ];
}

export function planNoteSectionOf(lines: string[]): string[] {
  if (lines.length === 0) return [];
  return [
    "",
    "Faults that the plan check left open. Look for each one: a fault that shows in the frame is judged by the usual rules, and one that does not show is fine.",
    ...lines,
  ];
}
