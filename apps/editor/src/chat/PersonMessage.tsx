import type { RequestEntry, SteeringEntry } from "./chatSchemas.js";
import { FoldedText } from "./FoldedText.js";
import { AnsweredRound } from "./questions/AnsweredRound.js";
import type { QuestionsEntry } from "./questions/questionSchemas.js";
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

function filesText(files: NonNullable<RequestEntry["files"]>): string {
  const count = files.length === 1 ? "1 file" : `${String(files.length)} files`;
  return `${count}: ${files.map((file) => file.name).join(", ")}`;
}

export function PersonMessage(props: {
  entry: RequestEntry | SteeringEntry;
  round: QuestionsEntry | undefined;
  sceneNumberOf: (clipId: string) => number | undefined;
}) {
  const { entry } = props;
  const text = shownRequestTextOf(entry);
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
        {entry.files === undefined ? undefined : (
          <em>{filesText(entry.files)}</em>
        )}
        {text === "" ? undefined : (
          <FoldedText className="request-text" text={text} />
        )}
        {props.round === undefined ? undefined : (
          <AnsweredRound round={props.round} />
        )}
        {entry.kind === "steering" ? (
          <span className="steering-state" role="status">
            {steeringStateTexts[entry.state]}
          </span>
        ) : undefined}
      </div>
    </li>
  );
}
