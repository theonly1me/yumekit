import type { MadeClip } from "./makeClip.js";
import type { ModelChoice } from "./modelChoices.js";
import { priceOf, priceText } from "./price.js";
import { secondsOf, type SettingValues } from "./settingValues.js";
import type { ToolFailure } from "./toolCalls.js";
import "./clipAction.css";

export interface CallProgress {
  done: number;
  total?: number | undefined;
  message?: string | undefined;
}

export type Phase =
  | { kind: "editing" }
  | { kind: "making"; progress: CallProgress | undefined }
  | { kind: "failed"; failure: ToolFailure }
  | { kind: "made"; made: MadeClip };

export interface VideoLimit {
  usedSeconds: number;
  limitSeconds: number;
}

const limitKind = "generated-video-limit-reached";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function readOnText(readOn: string): string {
  const date = new Date(`${readOn}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? readOn : dateFormat.format(date);
}

function summaryOf(values: SettingValues): string {
  const seconds = secondsOf(values);
  const resolution = values["resolution"];
  const parts = [
    seconds === undefined ? "" : `${String(seconds)} seconds`,
    typeof resolution === "string" ? `at ${resolution}` : "",
  ];
  return parts.filter((part) => part !== "").join(" ");
}

function LimitReached(props: { limit: VideoLimit }) {
  const { usedSeconds, limitSeconds } = props.limit;
  return (
    <>
      <p className="clip-price">Over the limit of this project</p>
      <p className="fact">
        This project has used {usedSeconds} of {limitSeconds} seconds of
        generated video. Use a shorter clip, or raise{" "}
        <strong>limits.generatedVideoSeconds</strong> in{" "}
        <strong>media-tools.json</strong>.
      </p>
    </>
  );
}

function Progress(props: {
  progress: CallProgress | undefined;
  server: string;
}) {
  const { progress } = props;
  const share =
    progress?.total === undefined || progress.total === 0
      ? undefined
      : Math.min(1, progress.done / progress.total);
  return (
    <div className="clip-progress" role="status">
      <span className="clip-progress-track" data-known={share !== undefined}>
        <span
          style={
            share === undefined ? {} : { width: `${String(share * 100)}%` }
          }
        />
      </span>
      <p className="fact">
        {progress?.message ?? `Waiting for ${props.server}.`}
      </p>
    </div>
  );
}

export function ClipAction(props: {
  choice: ModelChoice;
  values: SettingValues;
  limit: VideoLimit;
  phase: Phase;
  canMake: boolean;
  onAddKey: (serverId: string) => void;
}) {
  const { choice, values, limit, phase } = props;
  if (!choice.isReady) {
    return (
      <div className="clip-action">
        <p className="clip-price">{choice.serverLabel} needs a key</p>
        <p className="fact">Add the key once. It takes about two minutes.</p>
        <button
          type="button"
          className="primary"
          onClick={() => {
            props.onAddKey(choice.server.server);
          }}
        >
          Add the {choice.missingKey?.label ?? "key"}
        </button>
      </div>
    );
  }
  const failure = phase.kind === "failed" ? phase.failure : undefined;
  if (failure?.kind === limitKind) {
    return (
      <div className="clip-action" role="alert">
        <LimitReached
          limit={{
            usedSeconds: failure.used_seconds ?? limit.usedSeconds,
            limitSeconds: failure.limit_seconds ?? limit.limitSeconds,
          }}
        />
      </div>
    );
  }
  const seconds = secondsOf(values) ?? 0;
  const isOverLimit =
    limit.limitSeconds === 0 ||
    limit.usedSeconds + seconds > limit.limitSeconds;
  if (isOverLimit) {
    return (
      <div className="clip-action">
        <LimitReached limit={limit} />
      </div>
    );
  }
  const isMaking = phase.kind === "making";
  const summary = summaryOf(values);
  const price = priceOf({ model: choice.model, values });
  return (
    <div className="clip-action">
      <p className="clip-price">{priceText(price)}</p>
      <p className="fact">
        {summary === "" ? "" : `${summary}. `}This project has used{" "}
        {limit.usedSeconds} of {limit.limitSeconds} seconds.
        {price.kind === "about"
          ? ` The price is from ${readOnText(choice.model.read_on)}.`
          : ""}
      </p>
      <button
        type="submit"
        className="primary"
        disabled={!props.canMake || isMaking}
      >
        {isMaking ? "Making the clip" : "Make the clip"}
      </button>
      {props.canMake ? undefined : (
        <p className="fact">
          Write what happens in the clip, and pick a first frame.
        </p>
      )}
      {isMaking ? (
        <Progress progress={phase.progress} server={choice.serverLabel} />
      ) : undefined}
      {failure === undefined ? undefined : (
        <p className="failure" role="alert">
          {failure.message}{" "}
          {failure.hint === undefined ? undefined : (
            <strong>{failure.hint}</strong>
          )}
        </p>
      )}
    </div>
  );
}
