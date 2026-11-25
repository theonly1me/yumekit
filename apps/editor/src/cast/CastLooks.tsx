import type { EngineClient } from "../engine/engineClient.js";
import type { CastEntry, CastLookEntry } from "./castEntries.js";
import { CastPicture } from "./CastPictures.js";

const sheetKindLabels: Record<string, string> = {
  turnaround: "Front, side, back",
  expressions: "Faces",
  poses: "Poses",
  "hands-props": "Hands and props",
};

export function propWords(prop: CastLookEntry["props"][number]): string {
  const side = prop.side.trim() === "" ? "" : `, ${prop.side.trim()}`;
  return prop.count === 0
    ? `No ${prop.name}${side}`
    : `${String(prop.count)} ${prop.name}${side}`;
}

function sheetsOf(options: { entry: CastEntry; look: CastLookEntry }) {
  const { entry, look } = options;
  const classic =
    look.id === "default"
      ? entry.referenceAssetIds.map((...[assetId, index]) => ({
          assetId,
          kind: index === 0 ? "turnaround" : "hands-props",
          poses: undefined,
          check: undefined,
        }))
      : [];
  return [...classic, ...look.sheets];
}

function LookItems(props: { label: string; items: string[] }) {
  if (props.items.length === 0) return null;
  return (
    <div className="cast-look-part">
      <span className="fact">{props.label}</span>
      <ul className="cast-look-items" aria-label={props.label}>
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function CastLook(props: {
  client: EngineClient;
  entry: CastEntry;
  look: CastLookEntry;
}) {
  const { entry, look } = props;
  const sheets = sheetsOf({ entry, look });
  return (
    <li className="cast-look">
      <p className="cast-look-name">
        {look.name}
        <span className="fact">
          {look.personAsked === undefined
            ? look.id === "default"
              ? "The design"
              : "Not asked yet"
            : `You asked for it: “${look.personAsked.words}”`}
        </span>
      </p>
      <LookItems label="Wears" items={look.clothes} />
      <LookItems label="Carries" items={look.props.map(propWords)} />
      {sheets.length === 0 ? (
        <p className="fact">No sheet of this look yet.</p>
      ) : (
        <ul className="cast-look-sheets">
          {sheets.map((sheet) => (
            <li key={sheet.assetId}>
              <CastPicture
                client={props.client}
                assetId={sheet.assetId}
                label={`${sheetKindLabels[sheet.kind] ?? sheet.kind} of ${entry.name} in ${look.name}`}
              />
              <span className="fact">
                {sheetKindLabels[sheet.kind] ?? sheet.kind}
                {(sheet.check?.breaks.length ?? 0) > 0
                  ? ". Does not match the design"
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function CastLooks(props: { client: EngineClient; entry: CastEntry }) {
  const { entry } = props;
  if (entry.looks === undefined || entry.looks.length === 0) return null;
  const looks = entry.looks.some((look) => look.id === "default")
    ? entry.looks
    : [
        {
          id: "default",
          name: "Default",
          clothes: [],
          props: [],
          sheets: [],
        },
        ...entry.looks,
      ];
  return (
    <ul className="cast-looks" aria-label={`Looks of ${entry.name}`}>
      {looks.map((look) => (
        <CastLook
          key={look.id}
          client={props.client}
          entry={entry}
          look={look}
        />
      ))}
    </ul>
  );
}
