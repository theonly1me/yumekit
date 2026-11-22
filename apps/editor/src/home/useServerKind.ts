import { useEffect, useState } from "react";
import { z } from "zod";
import type { EngineClient } from "../engine/engineClient.js";

export type ServerKind = "loading" | "home" | "engine";

const healthSchema = z.object({ server: z.string().optional() });

export function useServerKind(client: EngineClient): ServerKind {
  const [kind, setKind] = useState<ServerKind>("loading");

  useEffect(() => {
    let isCurrent = true;
    client
      .readJson({ path: "/api/health", schema: healthSchema })
      .then((reply) => {
        if (!isCurrent) return;
        setKind(reply.ok && reply.value.server === "home" ? "home" : "engine");
      })
      .catch(() => {
        if (isCurrent) setKind("engine");
      });
    return () => {
      isCurrent = false;
    };
  }, [client]);

  return kind;
}
