import { useEffect, useRef } from "react";
import type { EngineClient } from "./engineClient.js";
import type { EngineEvent } from "./engineEvents.js";

export function useEngineEvents(options: {
  client: EngineClient;
  onEvent: (event: EngineEvent) => void;
}) {
  const { client } = options;
  const onEvent = useRef(options.onEvent);

  useEffect(() => {
    onEvent.current = options.onEvent;
  });

  useEffect(
    () =>
      client.events.listen((event) => {
        onEvent.current(event);
      }),
    [client],
  );
}
