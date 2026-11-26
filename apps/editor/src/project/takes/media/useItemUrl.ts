import { useEffect, useState } from "react";
import type { EngineClient } from "../../../engine/engineClient.js";
import { useAssetUrl } from "../../../makeClip/useAssetUrl.js";
import type { TakeItem } from "../takeSchema.js";

const rendersPrefix = "renders/";

function useRenderUrl(options: {
  client: EngineClient;
  file: string | undefined;
  version: string;
}): string | undefined {
  const { client, file, version } = options;
  const [loaded, setLoaded] = useState<{ file: string; url: string }>();

  useEffect(() => {
    if (file === undefined) return;
    let isCurrent = true;
    let url: string | undefined;
    const name = file.startsWith(rendersPrefix)
      ? file.slice(rendersPrefix.length)
      : file;
    client
      .renderFile(name)
      .then(async (reply) => {
        if (!reply.ok) return;
        const blob = await reply.value.blob();
        if (!isCurrent) return;
        url = URL.createObjectURL(blob);
        setLoaded({ file, url });
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [client, file, version]);

  return loaded !== undefined && loaded.file === file ? loaded.url : undefined;
}

export function useItemUrl(options: {
  client: EngineClient;
  item: TakeItem;
  takeId: string;
}): string | undefined {
  const { client, item } = options;
  const assetUrl = useAssetUrl({
    client,
    assetId: item.kind === "asset" ? item.id : undefined,
  });
  const renderUrl = useRenderUrl({
    client,
    file: item.kind === "cut" ? item.file : undefined,
    version: options.takeId,
  });
  return item.kind === "asset" ? assetUrl : renderUrl;
}
