import type { StepViewProps } from "../frame/stepViewProps.js";
import { FilmClock } from "./FilmClock.js";
import { PlanCheck } from "./PlanCheck.js";
import { SheetChecks } from "./SheetChecks.js";
import { ShotRow } from "./ShotRow.js";
import { shotFactsOf } from "./storyFacts.js";
import { WholeStory } from "./WholeStory.js";
import { filmFormLabelOf } from "./wholeStorySchema.js";
import { noPlanText, shotsNextText } from "./storyViewTexts.js";
import "./story.css";

export function StoryView(props: StepViewProps) {
  const { story, storyPlan: plan } = props.snapshot.bible;
  const wholeStory =
    story === undefined ? null : (
      <WholeStory
        story={story}
        form={story.form ?? plan?.form}
        snapshot={props.snapshot}
      />
    );
  if (plan === undefined) {
    return (
      <div className="files-part story-part">
        {wholeStory}
        <p className="fact lead">
          {story === undefined ? noPlanText : shotsNextText}
        </p>
      </div>
    );
  }
  const shots = shotFactsOf(props.snapshot);
  const { cast } = props.snapshot.bible;
  const nameOf = (castId: string) =>
    cast.find((member) => member.id === castId)?.name ?? castId;
  return (
    <div className="files-part story-part">
      {wholeStory}
      {story !== undefined || plan.form === undefined ? null : (
        <p className="story-form">{filmFormLabelOf(plan.form)}</p>
      )}
      <p className="story-logline">{plan.logline}</p>
      <dl className="story-arc">
        <dt>Wants</dt>
        <dd>{plan.want}</dd>
        <dt>In the way</dt>
        <dd>{plan.obstacle}</dd>
        <dt>By the end</dt>
        <dd>{plan.change}</dd>
      </dl>
      <FilmClock client={props.client} />
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
              ask={props.ask}
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
