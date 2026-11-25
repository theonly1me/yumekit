import type { EngineClient } from "../../engine/engineClient.js";
import type { Snapshot } from "../../engine/snapshot.js";
import { BudgetLines } from "./BudgetLines.js";
import { measureOf, moneyText } from "./firstCutFacts.js";

function verdictTextOf(snapshot: Snapshot): string {
  const review = snapshot.bible.storyPlan?.review;
  if (review === undefined) {
    return "Nobody checked the plan, and nothing waits for it. Ask for a second look at the plan in the chat when you want one.";
  }
  return review.verdict === "pass"
    ? "The critic read the plan and every prompt before any money was spent, and found nothing to change."
    : "The critic read the plan and found faults. They are notes: the AI decides what to change, and nothing waits.";
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
      {measure === undefined || snapshot.project.checks !== "critic" ? null : (
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
