import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { BudgetLines } from "./BudgetLines.js";
import { measureOf, moneyText } from "./firstCutFacts.js";

const usedUpAfter = 2;

function verdictTextOf(snapshot: Snapshot): string {
  const plan = snapshot.bible.storyPlan;
  const review = plan?.review;
  if (review === undefined) {
    return "The critic has not checked the plan yet. Sheet pictures can start, but no shot picture or clip is made before it does.";
  }
  if ((plan?.failedPlanChecks ?? 0) >= usedUpAfter) {
    return `The critic failed the plan ${String(plan?.failedPlanChecks ?? 0)} times, so the plan check is used up. The AI makes the film, and the critic looks for each open fault in the start picture and the clip of its shot.`;
  }
  return review.verdict === "pass"
    ? "The critic checked the plan and every prompt before any money was spent, and passed it."
    : "The critic failed the plan. The AI corrects it before any money is spent.";
}

function numberOf(options: { snapshot: Snapshot; shotId: string }): string {
  const index = (options.snapshot.bible.storyPlan?.shots ?? []).findIndex(
    (shot) => shot.id === options.shotId,
  );
  return index < 0 ? options.shotId : String(index + 1);
}

export function PlanCheck(props: { client: EngineClient; snapshot: Snapshot }) {
  const { snapshot } = props;
  const plan = snapshot.bible.storyPlan;
  const review = plan?.review;
  const measure = measureOf(snapshot);
  const lessons = plan?.lessons ?? [];
  const tries = (measure?.shots ?? []).reduce(
    (...[total, shot]) => total + shot.tries,
    0,
  );
  return (
    <section className="part-group plan-check" aria-labelledby="story-check">
      <h4 id="story-check">Before the money</h4>
      {measure === undefined ? null : (
        <dl className="story-measure">
          <div>
            <dt>Right on the first try</dt>
            <dd>
              {String(measure.acceptedFirstCount)} of{" "}
              {String(measure.shotCount)} shots
            </dd>
          </div>
          <div>
            <dt>Tries so far</dt>
            <dd>{String(tries)}</dd>
          </div>
          <div>
            <dt>Spent on pictures and clips that failed</dt>
            <dd>{moneyText(measure.refusedUsd)}</dd>
          </div>
        </dl>
      )}
      <span
        className="shot-verdict"
        data-verdict={
          review?.verdict === "fail"
            ? "redo"
            : review === undefined
              ? "none"
              : "keep"
        }
      >
        {verdictTextOf(snapshot)}
      </span>
      <BudgetLines client={props.client} snapshot={snapshot} />
      {review === undefined || review.faults.length === 0 ? null : (
        <ul
          className="shot-faults"
          aria-label="What the critic found in the plan"
        >
          {review.faults.map((fault) => (
            <li key={fault}>{fault}</li>
          ))}
        </ul>
      )}
      {review === undefined ? null : (
        <span className="fact">
          First the easiest shot (
          {numberOf({ snapshot, shotId: review.easiestShotId })}) and the
          hardest ({numberOf({ snapshot, shotId: review.hardestShotId })}), so
          their faults teach the rest.
        </span>
      )}
      {lessons.length === 0 ? null : (
        <ul className="story-lessons" aria-label="What the first shots taught">
          {lessons.map((lesson) => (
            <li key={lesson.text}>
              {lesson.text}
              <span className="fact"> Because: {lesson.cause}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
