import { useEffect, useState } from "react";
import type { EngineClient } from "../../engine/engineClient.js";
import { useEngineEvents } from "../../engine/useEngineEvents.js";
import {
  clockAnswerSchema,
  clockFactsOf,
  type ClockFacts,
} from "./filmClockFacts.js";
import "./clock.css";

function useClockFacts(client: EngineClient): ClockFacts | undefined {
  const [facts, setFacts] = useState<ClockFacts>();
  const load = () => {
    client.readJson({ path: "/api/clock", schema: clockAnswerSchema }).then(
      (answer) => {
        if (answer.ok) setFacts(clockFactsOf(answer.value));
      },
      () => undefined,
    );
  };
  useEffect(load, [client]);
  useEngineEvents({
    client,
    onEvent: (event) => {
      if (
        event.type === "project-changed" ||
        event.type === "work-changed" ||
        event.type === "connection-opened"
      ) {
        load();
      }
    },
  });
  return facts;
}

export function FilmClock(props: { client: EngineClient }) {
  const facts = useClockFacts(props.client);
  if (facts === undefined) return null;
  return (
    <section className="part-group film-clock" aria-labelledby="story-clock">
      <h4 id="story-clock">
        Time
        <span className="fact">
          {facts.usedText} of {facts.targetText}
        </span>
      </h4>
      <div
        className="clock-meter"
        data-over={facts.isOver}
        role="img"
        aria-label={`${facts.usedText} used of a target of ${facts.targetText}`}
      >
        <span style={{ width: `${String(facts.usedShare * 100)}%` }} />
      </div>
      <p className="fact clock-left" data-over={facts.isOver}>
        {facts.isOver
          ? `${facts.leftText} over the target. Nothing stops: the time is only a guide.`
          : `${facts.leftText} left of the target.`}
      </p>
      <ol className="clock-stages" aria-label="Time of each stage">
        {facts.stages.map((stage) => (
          <li key={stage.name}>
            <span>{stage.name}</span>
            <span className="clock-stage-time">{stage.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
