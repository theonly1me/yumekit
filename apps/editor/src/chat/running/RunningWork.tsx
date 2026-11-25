import { useEffect, useState } from "react";
import { clockOf, workLinesOf } from "./workLines.js";
import type { WorkItem } from "./workSchema.js";
import "./runningWork.css";

function useNow(isTicking: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isTicking) return undefined;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [isTicking]);
  return now;
}

export function RunningWork(props: { items: WorkItem[] }) {
  const now = useNow(props.items.length > 0);
  if (props.items.length === 0) return undefined;
  const lines = workLinesOf({ items: props.items, now });
  return (
    <section className="running-work" aria-label="Making now">
      <h3>Making now: {String(lines.length)}</h3>
      <ul>
        {lines.map((line) => (
          <li key={line.key} data-state={line.state}>
            <span className="running-what">{line.text}</span>
            <span className="running-service">{line.service ?? ""}</span>
            <span className="running-state">
              {line.state === "waiting" ? "Waiting" : clockOf(line.seconds)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
