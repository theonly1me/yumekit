import type { StepViewProps } from "../frame/stepViewProps.js";
import { ShotPictures } from "./ShotPictures.js";
import { shotFactsOf, type ShotFacts } from "./storyFacts.js";
import "./story.css";

export const noPlanText =
  "This video has no story plan yet. Before the AI makes a real video clip, it writes the story: what the main character wants, what stands in the way, what changes, and each shot with one action. The plan shows here.";

function ShotRow(props: { client: StepViewProps["client"]; facts: ShotFacts }) {
  const { facts } = props;
  const { shot } = facts;
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
          {[facts.placeName, facts.cameraText, facts.lengthText].join(" · ")}
        </span>
        <span className="shot-purpose">{shot.purpose}</span>
        <dl className="shot-states">
          <dt>Starts</dt>
          <dd>{shot.startState}</dd>
          <dt>Ends</dt>
          <dd>{shot.endState}</dd>
        </dl>
        <span className="shot-verdict" data-verdict={facts.verdict}>
          {facts.verdictText}
        </span>
        {facts.faults.length === 0 ? undefined : (
          <ul
            className="shot-faults"
            aria-label={`What the check found in shot ${String(facts.number)}`}
          >
            {facts.faults.map((fault) => (
              <li key={fault}>{fault}</li>
            ))}
          </ul>
        )}
        {facts.warnings.length === 0 ? undefined : (
          <span className="fact">Measured: {facts.warnings.join(". ")}.</span>
        )}
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
      <section className="part-group" aria-labelledby="story-shots">
        <h4 id="story-shots">
          Shots<span className="fact">{String(shots.length)}</span>
        </h4>
        <ol className="file-rows">
          {shots.map((facts) => (
            <ShotRow key={facts.shot.id} client={props.client} facts={facts} />
          ))}
        </ol>
      </section>
    </div>
  );
}
