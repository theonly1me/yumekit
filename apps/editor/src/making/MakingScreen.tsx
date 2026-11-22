import type { Snapshot } from "../engine/snapshot.js";
import type { EngineClient } from "../engine/engineClient.js";
import type { StartFailure } from "./firstRequestFailure.js";
import type { FirstChat } from "./firstChat.js";
import { MakingCards } from "./MakingCards.js";
import { makingStepsOf } from "./makingSteps.js";

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

export function MakingScreen(props: {
  client: EngineClient;
  snapshot: Snapshot;
  chat: FirstChat & { answer: NonNullable<FirstChat["answer"]> };
  onStop: () => void;
  onOpenEditor: () => void;
}) {
  const { chat, snapshot } = props;
  const steps = makingStepsOf({ answer: chat.answer, snapshot });
  const isRunning = chat.answer.state === "running";
  const isFailed = chat.answer.state === "failed";
  const title = isRunning
    ? "Making your video"
    : isFailed
      ? "The video is not finished"
      : "Your video is ready";
  return (
    <main className="making" data-state={chat.answer.state}>
      <div className="making-body">
        <p className="fact">{requestLinesOf(chat.requestText)}</p>
        <h1 className="making-title" aria-live="polite">
          {title}
        </h1>
        {isFailed ? (
          <p className="fact lead making-failure">
            {chat.lastNotice ?? "The AI stopped with a problem."}
          </p>
        ) : undefined}
        <ol className="making-steps">
          {steps.map((step) => (
            <li key={step.id} data-status={step.state}>
              <span className="step-mark" aria-hidden="true" />
              <span>{step.label}</span>
              <em>{step.fact}</em>
            </li>
          ))}
        </ol>
        <MakingCards client={props.client} snapshot={snapshot} />
        <div className="making-action">
          {isRunning ? (
            <button type="button" onClick={props.onStop}>
              Stop
            </button>
          ) : undefined}
          {snapshot.scenes.length > 0 || !isRunning ? (
            <button
              type="button"
              className={isRunning ? undefined : "primary"}
              onClick={props.onOpenEditor}
            >
              Open the editor
            </button>
          ) : undefined}
          {isRunning ? (
            <p className="fact">
              You can stop at any time. What is made stays in the project.
            </p>
          ) : undefined}
        </div>
      </div>
    </main>
  );
}
