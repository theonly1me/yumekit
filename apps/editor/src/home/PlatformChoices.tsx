import { platformCatalog, type Platform } from "@yumekit/project/platforms";

const shapeBoxPixels = 26;

function Shape(props: { platform: Platform }) {
  const { widthPixels, heightPixels } = props.platform;
  const longest = Math.max(widthPixels, heightPixels);
  return (
    <span className="shape" aria-hidden="true">
      <i
        style={{
          width: Math.round((widthPixels / longest) * shapeBoxPixels),
          height: Math.round((heightPixels / longest) * shapeBoxPixels),
        }}
      />
    </span>
  );
}

export function PlatformChoices(props: {
  chosen: readonly string[];
  onToggle: (platformId: string) => void;
}) {
  return (
    <div className="choices">
      {platformCatalog.map((platform) => (
        <button
          type="button"
          className="choice"
          key={platform.id}
          data-platform={platform.id}
          aria-pressed={props.chosen.includes(platform.id)}
          onClick={() => {
            props.onToggle(platform.id);
          }}
        >
          <Shape platform={platform} />
          <span className="choice-name">
            {platform.name}
            <em>
              {platform.shape}, {platform.widthPixels} x {platform.heightPixels}
            </em>
          </span>
        </button>
      ))}
    </div>
  );
}
