import type { Output } from "../engine/snapshot.js";
import type { DirectChanges } from "../scenes/useDirectChanges.js";
import type { PlatformTab } from "./platformTabFacts.js";
import { PlatformTabs } from "./PlatformTabs.js";

export function ProjectPlatformTabs(props: {
  tabs: PlatformTab[];
  activeKey: string;
  outputs: Output[];
  changes: DirectChanges;
  onTab: (key: string) => void;
}) {
  const { changes } = props;
  const changePlatform = (change: {
    name: "add_platform" | "remove_platform";
    platformId: string;
  }) => {
    changes
      .run({
        area: "platforms",
        name: change.name,
        input: { platform_id: change.platformId },
      })
      .catch(() => undefined);
  };
  return (
    <PlatformTabs
      tabs={props.tabs}
      activeKey={props.activeKey}
      outputs={props.outputs}
      failure={changes.failureOf("platforms")}
      onTab={props.onTab}
      onAdd={(platformId) => {
        props.onTab(`platform:${platformId}`);
        changePlatform({ name: "add_platform", platformId });
      }}
      onRemove={(platformId) => {
        changePlatform({ name: "remove_platform", platformId });
      }}
    />
  );
}
