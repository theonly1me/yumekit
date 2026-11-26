import type { NewerTake } from "./newerTake.js";
import type { Take } from "./takeTypes.js";
import "./olderTake.css";

export function OlderTakeLine(props: {
  take: Take;
  newer: NewerTake | undefined;
  onGo: (takeId: string) => void;
}) {
  const { take, newer } = props;
  if (newer === undefined) return undefined;
  const isReplaced = take.state !== "sent";
  return (
    <p className="older-take" role="status">
      <span>
        You are looking at take {take.number}.
        {isReplaced
          ? ` Take ${String(newer.replacedBy.number)} replaced it, so it is only to look at.`
          : ""}
      </span>
      <button
        type="button"
        className="link"
        onClick={() => {
          props.onGo(newer.newest.id);
        }}
      >
        Go to take {newer.newest.number}
      </button>
    </p>
  );
}
