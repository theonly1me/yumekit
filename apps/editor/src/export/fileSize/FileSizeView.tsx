import { smallerFileTargetsMegabytes } from "@yumekit/project/file-size";
import { useState } from "react";
import {
  expectedText,
  megabytesText,
  planOf,
  type FileSizeChoice,
  type SizedVideo,
} from "./fileSizeChoice.js";
import "./fileSize.css";

type SmallerChoice = Extract<FileSizeChoice, { kind: "smaller" }>;

const largestOwnMegabytes = 10_000;
const firstTarget = smallerFileTargetsMegabytes[0];

function SizeWarning(props: {
  choice: SmallerChoice;
  video: SizedVideo;
  onChoose: (choice: FileSizeChoice) => void;
}) {
  const { choice } = props;
  const plan = planOf({ choice, video: props.video });
  const under = `under ${megabytesText(choice.largestMegabytes)}`;
  const { offeredShortSide } = plan;
  if (plan.look === "too-small") {
    return (
      <p className="size-warning" role="alert">
        A file {under} cannot hold this video. Pick at least{" "}
        {megabytesText(plan.smallestMegabytes)}.
      </p>
    );
  }
  if (plan.look === "too-long") {
    return (
      <p className="size-warning">
        This video is too long to look good {under}. Pick a larger size.
      </p>
    );
  }
  if (offeredShortSide === undefined) return undefined;
  return (
    <p className="size-warning">
      This video looks soft {under}.{" "}
      <button
        type="button"
        className="link"
        onClick={() => {
          props.onChoose({ ...choice, shortSidePixels: offeredShortSide });
        }}
      >
        Make it {String(offeredShortSide)}p
      </button>
    </p>
  );
}

export function FileSizeView(props: {
  choice: FileSizeChoice;
  video: SizedVideo | undefined;
  isLocked: boolean;
  onChoose: (choice: FileSizeChoice) => void;
}) {
  const { choice, video } = props;
  const [ownFailure, setOwnFailure] = useState<string>();
  const smaller = choice.kind === "smaller" ? choice : undefined;
  const chooseOwn = (text: string) => {
    const megabytes = Number(text);
    const isValid =
      text.trim() !== "" &&
      Number.isFinite(megabytes) &&
      megabytes > 0 &&
      megabytes <= largestOwnMegabytes;
    setOwnFailure(
      isValid || text.trim() === ""
        ? undefined
        : "Write a size in MB, for example 8.",
    );
    props.onChoose({
      kind: "smaller",
      largestMegabytes: isValid ? megabytes : (smaller?.largestMegabytes ?? 10),
      ownText: text,
      shortSidePixels: smaller?.shortSidePixels,
    });
  };
  return (
    <div className="size-choice">
      <span className="segments" role="group" aria-label="File size">
        {(["best", "smaller"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={choice.kind === kind}
            disabled={props.isLocked}
            onClick={() => {
              props.onChoose(
                kind === "best"
                  ? { kind }
                  : {
                      kind,
                      largestMegabytes: firstTarget,
                      ownText: "",
                      shortSidePixels: undefined,
                    },
              );
            }}
          >
            {kind === "best" ? "Best quality" : "Smaller file"}
          </button>
        ))}
      </span>
      {smaller === undefined ? undefined : (
        <>
          <span className="segments" role="group" aria-label="Largest file">
            {smallerFileTargetsMegabytes.map((target) => (
              <button
                key={target}
                type="button"
                aria-pressed={
                  smaller.ownText === "" && smaller.largestMegabytes === target
                }
                disabled={props.isLocked}
                onClick={() => {
                  setOwnFailure(undefined);
                  props.onChoose({
                    ...smaller,
                    largestMegabytes: target,
                    ownText: "",
                  });
                }}
              >
                Under {String(target)} MB
              </button>
            ))}
          </span>
          <label className="own-size">
            Or under
            <input
              type="text"
              inputMode="decimal"
              aria-label="Your own largest size in MB"
              aria-invalid={ownFailure !== undefined}
              value={smaller.ownText}
              disabled={props.isLocked}
              onChange={(event) => {
                chooseOwn(event.currentTarget.value);
              }}
            />
            MB
          </label>
        </>
      )}
      {video === undefined ? undefined : (
        <p className="fact size-fact">{expectedText({ choice, video })}</p>
      )}
      {ownFailure === undefined ? undefined : (
        <p className="size-warning" role="alert">
          {ownFailure}
        </p>
      )}
      {smaller === undefined || video === undefined ? undefined : (
        <SizeWarning choice={smaller} video={video} onChoose={props.onChoose} />
      )}
    </div>
  );
}
