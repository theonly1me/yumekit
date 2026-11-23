import type { AnswerEntry } from "./chatTypes.js";

export type AnswerStep = AnswerEntry["steps"][number];

export interface StepProgress {
  done: number;
  total?: number | undefined;
  message?: string | undefined;
}

export interface CallNote {
  onProgress: (progress: StepProgress) => void;
  finish: (reason: string | undefined) => void;
}

export const noCallNote: CallNote = {
  onProgress: () => undefined,
  finish: () => undefined,
};

export function capabilityOf(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const capability: unknown = Reflect.get(input, "capability");
  return typeof capability === "string" ? capability : undefined;
}

function percentOf(progress: StepProgress | undefined): number | undefined {
  if (progress?.total === undefined || progress.total <= 0) return undefined;
  return Math.floor((progress.done / progress.total) * 100);
}

function isSameShown(options: {
  before: StepProgress | undefined;
  after: StepProgress;
}): boolean {
  const { before, after } = options;
  return (
    before?.message === after.message &&
    percentOf(before) === percentOf(after) &&
    (percentOf(after) !== undefined || before?.done === after.done)
  );
}

export function createCallNotes(options: {
  steps: () => AnswerStep[];
  putSteps: (steps: AnswerStep[]) => void;
}) {
  const bound = new Set<string>();
  const waitingReasons: { tool: string; reason: string }[] = [];
  return {
    withWaitingReason: (step: AnswerStep): AnswerStep => {
      const index = waitingReasons.findIndex(
        (waiting) => waiting.tool === step.tool,
      );
      const [waiting] = waitingReasons.splice(index, index < 0 ? 0 : 1);
      if (waiting === undefined) return step;
      bound.add(step.callId);
      return { ...step, reason: waiting.reason };
    },
    noteCall: (tool: string): CallNote => {
      let callId: string | undefined;
      const boundCallId = () => {
        if (callId !== undefined) return callId;
        const step = options
          .steps()
          .find(
            (candidate) =>
              candidate.tool === tool &&
              candidate.state === "running" &&
              !bound.has(candidate.callId),
          );
        if (step === undefined) return undefined;
        callId = step.callId;
        bound.add(step.callId);
        return callId;
      };
      const change = (update: (step: AnswerStep) => AnswerStep | undefined) => {
        const id = boundCallId();
        if (id === undefined) return false;
        const steps = options.steps();
        const current = steps.find((step) => step.callId === id);
        const next = current === undefined ? undefined : update(current);
        if (next !== undefined) {
          options.putSteps(
            steps.map((step) => (step.callId === id ? next : step)),
          );
        }
        return true;
      };
      return {
        onProgress: (progress) => {
          change((step) =>
            isSameShown({ before: step.progress, after: progress })
              ? undefined
              : { ...step, progress },
          );
        },
        finish: (reason) => {
          const isBound = change((step) => {
            const { progress, ...rest } = step;
            if (reason === undefined && progress === undefined)
              return undefined;
            return reason === undefined ? rest : { ...rest, reason };
          });
          if (!isBound && reason !== undefined)
            waitingReasons.push({ tool, reason });
        },
      };
    },
  };
}
