import type { StepViewProps } from "../frame/stepViewProps.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { shotChecksOf } from "./firstCutFacts.js";
import { PlanCheck } from "./PlanCheck.js";
import { ShotPictures } from "./ShotPictures.js";
import { SheetChecks } from "./SheetChecks.js";
import { intensityText, stateLinesOf } from "./shotWords.js";
import { shotFactsOf, type ShotFacts } from "./storyFacts.js";
import "./story.css";

export const noPlanText =
  "This video has no story plan yet. Before the AI makes a real video clip, it writes the story: what the main character wants, what stands in the way, what changes, and each shot with one action. The plan shows here.";

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

function ShotRow(props: {
  client: StepViewProps["client"];
  facts: ShotFacts;
  snapshot: Snapshot;
  nameOf: (castId: string) => string;
}) {
  const { facts, nameOf } = props;
  const { shot } = facts;
  const checks = shotChecksOf({ snapshot: props.snapshot, shot });
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
          label={`Open faults of the plan check in shot ${String(facts.number)}, which the critic looks for`}
          lines={(shot.planNotes ?? []).map((note) => `Plan check: ${note}`)}
        />
        <TextList
          label={`What the critic found in the start picture of shot ${String(facts.number)}`}
          lines={checks.startFaults}
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
      </div>
    </li>
  );
}

export function StoryView(props: StepViewProps) {
  const plan = props.snapshot.bible.storyPlan;
  if (plan === undefined) {
    return (
      <div className="files-part story-part">
        <p className="fact lead">{noPlanText}</p>
      </div>
    );
  }
  const shots = shotFactsOf(props.snapshot);
  const { cast } = props.snapshot.bible;
  const nameOf = (castId: string) =>
    cast.find((member) => member.id === castId)?.name ?? castId;
  return (
    <div className="files-part story-part">
      <p className="story-logline">{plan.logline}</p>
      <dl className="story-arc">
        <dt>Wants</dt>
        <dd>{plan.want}</dd>
        <dt>In the way</dt>
        <dd>{plan.obstacle}</dd>
        <dt>By the end</dt>
        <dd>{plan.change}</dd>
      </dl>
      <PlanCheck client={props.client} snapshot={props.snapshot} />
      <section className="part-group" aria-labelledby="story-shots">
        <h4 id="story-shots">
          Shots<span className="fact">{String(shots.length)}</span>
        </h4>
        <ol className="file-rows">
          {shots.map((facts) => (
            <ShotRow
              key={facts.shot.id}
              client={props.client}
              facts={facts}
              snapshot={props.snapshot}
              nameOf={nameOf}
            />
          ))}
        </ol>
      </section>
      <SheetChecks snapshot={props.snapshot} />
    </div>
  );
}
