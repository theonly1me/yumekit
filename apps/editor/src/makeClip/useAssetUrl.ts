import { useEffect, useState } from "react";
import type { EngineClient } from "../engine/engineClient.js";

export function useAssetUrl(options: {
  client: EngineClient;
  assetId: string | undefined;
}): string | undefined {
  const { client, assetId } = options;
  const [loaded, setLoaded] = useState<{ assetId: string; url: string }>();

  useEffect(() => {
    if (assetId === undefined) return;
    let isCurrent = true;
    let url: string | undefined;
    client
      .assetFile(assetId)
      .then((reply) => {
        if (!isCurrent || !reply.ok) return;
        url = URL.createObjectURL(reply.value);
        setLoaded({ assetId, url });
      })
      .catch(() => {
        setLoaded(undefined);
      });
    return () => {
      isCurrent = false;
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [client, assetId]);

  if (loaded === undefined || loaded.assetId !== assetId) return undefined;
  return loaded.url;
}
