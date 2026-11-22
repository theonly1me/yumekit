import { useEffect, useState } from "react";
import type { ClientFailure, EngineClient } from "../engine/engineClient.js";
import {
  makeProject,
  openRecent,
  readHome,
  type HomeFacts,
  type ProjectLength,
} from "./homeApi.js";

export type Busy = "idle" | "making" | "opening";

function messageOf(failure: ClientFailure): string {
  switch (failure.kind) {
    case "token-rejected":
      return "yumekit did not accept this page. Run yumekit again and open the new link.";
    case "engine-unreachable":
      return "yumekit is not running. Run yumekit again.";
    case "request-failed":
      return failure.message;
  }
}

export function useStartChoices(client: EngineClient) {
  const [home, setHome] = useState<HomeFacts>();
  const [loadFailure, setLoadFailure] = useState<string>();
  const [request, setRequest] = useState("");
  const [platformIds, setPlatformIds] = useState<string[]>([
    "youtube",
    "tiktok",
  ]);
  const [length, setLength] = useState<ProjectLength>(30);
  const [busy, setBusy] = useState<Busy>("idle");
  const [makeFailure, setMakeFailure] = useState<string>();
  const [openFailure, setOpenFailure] = useState<string>();

  useEffect(() => {
    let isCurrent = true;
    readHome(client)
      .then((reply) => {
        if (!isCurrent) return;
        if (reply.ok) setHome(reply.value);
        else setLoadFailure(messageOf(reply.failure));
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [client]);

  const make = async () => {
    setBusy("making");
    setMakeFailure(undefined);
    const reply = await makeProject({ client, request, platformIds, length });
    if (reply.ok) {
      window.location.assign(reply.value.url);
      return;
    }
    setMakeFailure(messageOf(reply.failure));
    setBusy("idle");
  };

  const open = async (folder: string) => {
    setBusy("opening");
    setOpenFailure(undefined);
    const reply = await openRecent({ client, folder });
    if (reply.ok) {
      window.location.assign(reply.value.url);
      return;
    }
    setOpenFailure(messageOf(reply.failure));
    setBusy("idle");
  };

  return {
    home,
    loadFailure,
    request,
    setRequest,
    platformIds,
    togglePlatform: (platformId: string) => {
      setPlatformIds((current) =>
        current.includes(platformId)
          ? current.filter((id) => id !== platformId)
          : [...current, platformId],
      );
    },
    length,
    setLength,
    busy,
    makeFailure,
    openFailure,
    make,
    open,
  };
}
