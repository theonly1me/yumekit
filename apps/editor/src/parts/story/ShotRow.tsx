import type { StepViewProps } from "../frame/stepViewProps.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { shotChecksOf } from "./firstCutFacts.js";
import { ShotDesign } from "./DesignMark.js";
import { SecondLook } from "./SecondLook.js";
import { ShotPictures } from "./ShotPictures.js";
import { intensityText, stateLinesOf } from "./shotWords.js";
import type { ShotFacts } from "./storyFacts.js";
import { storyPartNameOf } from "./wholeStorySchema.js";

function StateList(props: { lines: string[] }) {
  return (
    <dd>
      {props.lines.map((line) => (
        <span key={line} className="shot-state-line">
          {line}
        </span>
      ))}
    </dd>
  );
}

function TextList(props: { label: string; lines: string[] }) {
  if (props.lines.length === 0) return null;
  return (
    <ul className="shot-faults" aria-label={props.label}>
      {props.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function ShotRow(props: {
  client: StepViewProps["client"];
  ask: StepViewProps["ask"];
  facts: ShotFacts;
  snapshot: Snapshot;
  nameOf: (castId: string) => string;
}) {
  const { facts, nameOf } = props;
  const { shot } = facts;
  const checks = shotChecksOf({ snapshot: props.snapshot, shot });
  const storyPart =
    shot.storyFact === undefined
      ? undefined
      : storyPartNameOf({
          story: props.snapshot.bible.story,
          partId: shot.storyFact,
        });
  return (
    <li className="shot-row">
      <ShotPictures
        client={props.client}
        number={facts.number}
        startPicture={facts.startPicture}
        endPicture={facts.endPicture}
        clip={facts.clip}
      />
      <div className="shot-text">
        <span className="file-name">
          {String(facts.number)}. {shot.action}
        </span>
        <span className="fact">
          {[
            facts.placeName,
            facts.cameraText,
            facts.lengthText,
            intensityText(shot.musicIntensity),
            checks.difficultyText,
            checks.triesText,
          ]
            .filter((part) => part !== undefined)
            .join(" · ")}
        </span>
        <span className="shot-purpose">{shot.purpose}</span>
        {storyPart === undefined ? null : (
          <span className="fact">From the story: {storyPart}</span>
        )}
        <dl className="shot-states">
          <dt>Starts</dt>
          <StateList lines={stateLinesOf({ state: shot.startState, nameOf })} />
          <dt>Ends</dt>
          <StateList lines={stateLinesOf({ state: shot.endState, nameOf })} />
        </dl>
        {checks.startText === undefined ? null : (
          <span className="fact">{checks.startText}</span>
        )}
        <TextList
          label={`Notes of the plan check in shot ${String(facts.number)}`}
          lines={(shot.planNotes ?? []).map((note) => `Plan check: ${note}`)}
        />
        <TextList
          label={`What the critic found in the start picture of shot ${String(facts.number)}`}
          lines={checks.startFaults}
        />
        <ShotDesign
          shot={shot}
          snapshot={props.snapshot}
          number={facts.number}
        />
        <span className="shot-verdict" data-verdict={facts.verdict}>
          {facts.verdictText}
        </span>
        {facts.faults.length === 0 ? undefined : (
          <ul
            className="shot-faults"
            aria-label={`What the critic found in shot ${String(facts.number)}`}
          >
            {facts.faults.map((fault) => (
              <li key={fault}>{fault}</li>
            ))}
          </ul>
        )}
        {facts.missed.length === 0 ? undefined : (
          <ul
            className="shot-faults"
            aria-label={`What did not happen in shot ${String(facts.number)}`}
          >
            {facts.missed.map((missed) => (
              <li key={missed}>{missed}</li>
            ))}
          </ul>
        )}
        {facts.warnings.length === 0 ? undefined : (
          <span className="fact">Measured: {facts.warnings.join(". ")}.</span>
        )}
        <TextList
          label={`Small things the critic noted in shot ${String(facts.number)}, which do not fail it`}
          lines={checks.notes.map((note) => `Note: ${note}`)}
        />
        {facts.startPicture === undefined && facts.clip === undefined ? null : (
          <SecondLook
            ask={props.ask}
            shotId={shot.id}
            number={facts.number}
            hasClip={facts.clip !== undefined}
          />
        )}
      </div>
    </li>
  );
}
