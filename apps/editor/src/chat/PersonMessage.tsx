import type { RequestEntry, SteeringEntry } from "./chatSchemas.js";
import { FoldedText } from "./FoldedText.js";
import { shownRequestTextOf } from "./requestEntryText.js";

const steeringStateTexts: Record<SteeringEntry["state"], string> = {
  waiting: "Waiting for the AI's next step",
  read: "Read by the AI",
};

function aboutText(options: {
  about: NonNullable<RequestEntry["about"]>;
  sceneNumberOf: (clipId: string) => number | undefined;
}): string {
  const number = options.sceneNumberOf(options.about.clipId);
  return number === undefined
    ? `About ${options.about.title}`
    : `About scene ${String(number)}: ${options.about.title}`;
}

export function PersonMessage(props: {
  entry: RequestEntry | SteeringEntry;
  sceneNumberOf: (clipId: string) => number | undefined;
}) {
  const { entry } = props;
  return (
    <li
      className={entry.kind === "steering" ? "entry you steering" : "entry you"}
      data-state={entry.kind === "steering" ? entry.state : undefined}
    >
      <span className="who">You</span>
      <div className="request-body">
        {entry.about === null ? undefined : (
          <em>
            {aboutText({
              about: entry.about,
              sceneNumberOf: props.sceneNumberOf,
            })}
          </em>
        )}
        <FoldedText className="request-text" text={shownRequestTextOf(entry)} />
        {entry.kind === "steering" ? (
          <span className="steering-state" role="status">
            {steeringStateTexts[entry.state]}
          </span>
        ) : undefined}
      </div>
    </li>
  );
}
