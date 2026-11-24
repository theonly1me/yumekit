import type { Snapshot } from "../../engine/snapshot.js";

function checkTextOf(options: {
  verdict: "pass" | "fail" | undefined;
  isCurrent: boolean;
  isRestricted: boolean;
}): string {
  if (options.verdict === undefined) return "Not checked by the critic yet.";
  if (!options.isCurrent)
    return "The pictures changed. The critic checks again.";
  if (options.verdict === "pass") return "The critic passed it.";
  return options.isRestricted
    ? "The critic failed it. The film uses it with a limit."
    : "The critic failed it.";
}

function SheetLines(props: { label: string; lines: string[] }) {
  if (props.lines.length === 0) return null;
  return (
    <ul className="shot-faults" aria-label={props.label}>
      {props.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

export function SheetChecks(props: { snapshot: Snapshot }) {
  const plan = props.snapshot.bible.storyPlan;
  const used = new Set(
    (plan?.shots ?? []).flatMap((shot) => [shot.placeId, ...shot.castIds]),
  );
  const members = props.snapshot.bible.cast.filter((member) =>
    used.has(member.id),
  );
  if (members.length === 0) return null;
  return (
    <section className="part-group" aria-labelledby="story-sheets">
      <h4 id="story-sheets">
        Sheets<span className="fact">{String(members.length)}</span>
      </h4>
      <ul className="sheet-checks">
        {members.map((member) => {
          const review = member.sheetReview;
          const isCurrent =
            review?.assetIds.join(" ") === member.referenceAssetIds.join(" ");
          return (
            <li key={member.id} data-verdict={review?.verdict ?? "none"}>
              <span className="file-name">{member.name}</span>
              <span
                className="shot-verdict"
                data-verdict={
                  review?.verdict === "pass"
                    ? "keep"
                    : review === undefined
                      ? "none"
                      : "redo"
                }
              >
                {checkTextOf({
                  verdict: review?.verdict,
                  isCurrent,
                  isRestricted: (member.restrictions ?? []).length > 0,
                })}
              </span>
              <SheetLines
                label={`What the critic found in the sheet of ${member.name}`}
                lines={[
                  ...(review?.faults ?? []),
                  ...(review?.notes ?? []).map((note) => `Note: ${note}`),
                  ...(member.restrictions ?? []).map(
                    (restriction) => `Used with a limit: ${restriction}`,
                  ),
                  ...(member.briefFacts ?? []).map(
                    (fact) => `From your brief, kept as is: ${fact}`,
                  ),
                ]}
              />
              {(member.sheetTries ?? []).length < 2 ? null : (
                <span className="fact">
                  {String((member.sheetTries ?? []).length)} tries
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
