import { designBracketSeconds, framesOf, type DesignJob } from "./designJob.js";

export const designSheetsItem =
  "The sheets: each place and prop against its facts and its sheet pictures. Each person with a look is judged in the design check below, question by question, and not here.";

function frameLineOf(job: DesignJob): string {
  const { target } = job;
  if (target.kind === "pictures") {
    return `Design frames: ${framesOf(job)
      .map((frame) => frame.label)
      .join("; ")}`;
  }
  return `Design frames: ${target.seconds
    .map((entry) => `${String(entry.seconds)}s (${entry.why})`)
    .join("; ")}`;
}

export function designBriefLinesOf(options: {
  job: DesignJob | undefined;
  viewTool: "view_for_review" | "check_design";
  answerIn: string;
}): string[] {
  const { job } = options;
  if (job === undefined) return [];
  const isClip = job.target.kind === "clip";
  return [
    "",
    `The design check (answer it in ${options.answerIn}). One design, every frame: each person must look exactly as the turnaround of the look of this shot shows, with the same hair, each garment with the same construction, and each prop with the same count and side.`,
    ...job.members.flatMap((entry) => [
      `Design person "${entry.member.id}" look "${entry.look.id}" with ${String(entry.questions.length)} questions; turnaround "${entry.turnaround?.id ?? "none"}". ${entry.member.name}, ${entry.look.name}:`,
      ...entry.questions.map(
        (...[question, index]) =>
          `  ${String(index + 1)}. ${question.kind === "base" ? "Person" : question.kind === "garment" ? "Garment" : "Prop"}: ${question.text}`,
      ),
    ]),
    frameLineOf(job),
    `For each person and each frame, look at the enlarged crop next to the turnaround: call ${options.viewTool} with cast_id, the region of the whole person from the top of the hair to the feet (shares from 0 to 1), and asset_id for a picture or seconds for a frame of the clip. Then answer each question with yes, no, or cannot-see, and what you saw in that crop. A frame with no crop is not answered.`,
    'Answer no when the frame breaks the design: another garment, a sleeveless garment with sleeves, another hair style or length, a prop that doubles, vanishes, or changes side, a costume that changes. A small difference of shade or line is yes. A part that the frame does not show is cannot-see. A "no" marks a break of the design, whatever the verdict.',
    ...(isClip
      ? [
          `When a frame of the clip has a no, check frames before it until the last clean frame and the first broken frame are at most ${String(designBracketSeconds)} seconds apart. The clean part of the clip ends at the last clean frame.`,
        ]
      : []),
  ];
}
