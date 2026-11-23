import type { EngineClient } from "../engine/engineClient.js";
import type { Snapshot } from "../engine/snapshot.js";
import type { AskTheAi } from "../parts/fixedRequests.js";
import { StepView } from "../parts/frame/StepView.js";
import type { StartFailure } from "./firstRequestFailure.js";
import type { AnswerEntry, FirstChat } from "./firstChat.js";
import { StepList } from "./StepList.js";
import { isPlanReady, makingStepsOf, type MakingStep } from "./makingSteps.js";
import { MakingActions } from "./MakingActions.js";
import { TogetherView } from "./TogetherView.js";
import { useOpenStep } from "./useOpenStep.js";
import { runStepAction } from "./stepActions.js";
import {
  hasReadyService,
  useMediaChoices,
} from "../settings/services/index.js";

const waitLine =
  "When a step is done, you can open it here. You can read the script, see each picture, and listen to the voice and the music. You can change each of them.";

function requestLinesOf(text: string): string {
  const lines = text.split("\n");
  const end = lines.findIndex((line) => line.startsWith("Platforms: "));
  return (end < 0 ? lines : lines.slice(0, end)).join(" ");
}

export function MakingFailure(props: {
  failure: StartFailure;
  onOpenEditor: () => void;
}) {
  return (
    <main className="making" data-state="failed">
      <div className="making-body">
        <p className="wordmark">yumekit</p>
        <h1 className="making-title">{props.failure.title}</h1>
        {props.failure.lines.map((line) => (
          <p className="fact lead" key={line}>
            {line}
          </p>
        ))}
        <div className="making-action">
          <button
            type="button"
            className="primary"
            onClick={props.onOpenEditor}
          >
            Open the editor
          </button>
        </div>
      </div>
    </main>
  );
}

function OpenPart(props: {
  client: EngineClient;
  snapshot: Snapshot;
  stepId: MakingStep["id"] | undefined;
  locked: boolean;
  ask: AskTheAi;
  onOpenEditor: () => void;
}) {
  const { stepId, ...view } = props;
  if (stepId === undefined) {
    return <p className="fact lead making-wait">{waitLine}</p>;
  }
  if (stepId === "together") {
    return (
      <TogetherView locked={props.locked} onOpenEditor={props.onOpenEditor} />
    );
  }
  return <StepView {...view} key={stepId} stepId={stepId} />;
}

function titleOf(options: {
  answer: AnswerEntry;
  isPlanReady: boolean;
}): string {
  const { answer } = options;
  if (options.isPlanReady) return "The plan is ready";
  if (answer.state === "running") return "Making your video";
  return answer.state === "failed"
    ? "The video is not finished"
    : "Your video is ready";
}

export function MakingScreen(props: {
  client: EngineClient;
  snapshot: Snapshot;
  chat: FirstChat & { answer: NonNullable<FirstChat["answer"]> };
  onStop: () => void;
  onOpenEditor: () => void;
  onContinue: () => Promise<boolean>;
  ask: AskTheAi;
}) {
  const { chat, snapshot } = props;
  const choices = useMediaChoices(props.client);
  const steps = makingStepsOf({
    answer: chat.answer,
    snapshot,
    phase: chat.phase,
    musicIsReady:
      choices.state.kind !== "ready" ||
      hasReadyService({ choices: choices.state.choices, kind: "music" }),
  });
  const planReady = isPlanReady({ answer: chat.answer, phase: chat.phase });
  const open = useOpenStep(steps);
  const isRunning = chat.answer.state === "running";
  const isFailed = chat.answer.state === "failed";
  return (
    <main className="making" data-state={chat.answer.state}>
      <div className="making-body">
        <p className="fact">{requestLinesOf(chat.requestText)}</p>
        <h1 className="making-title" aria-live="polite">
          {titleOf({ answer: chat.answer, isPlanReady: planReady })}
        </h1>
        {planReady ? (
          <p className="fact lead">
            Check the script and the pictures, and change what you want. Then
            press Continue, and the AI makes the voice, the music, and the rest
            of the video.
          </p>
        ) : undefined}
        {isFailed ? (
          <p className="fact lead making-failure">
            {chat.lastNotice ?? "The AI stopped with a problem."}
          </p>
        ) : undefined}
        <div className="making-desk">
          <div className="making-side">
            <StepList
              steps={steps}
              openStepId={open.stepId}
              onOpen={open.openStep}
              onAction={({ stepId, action }) => {
                runStepAction({
                  action,
                  stepId,
                  openStep: open.openStep,
                  ask: props.ask,
                  onOpenEditor: props.onOpenEditor,
                });
              }}
            />
            <MakingActions
              isRunning={isRunning}
              isPlanReady={planReady}
              hasScene={snapshot.scenes.length > 0}
              onStop={props.onStop}
              onOpenEditor={props.onOpenEditor}
              onContinue={props.onContinue}
            />
          </div>
          <div className="making-part">
            <OpenPart
              client={props.client}
              snapshot={snapshot}
              stepId={open.stepId}
              locked={isRunning}
              ask={props.ask}
              onOpenEditor={props.onOpenEditor}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
