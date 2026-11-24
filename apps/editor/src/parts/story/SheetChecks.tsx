import type { Snapshot } from "../../engine/snapshot.js";

function checkTextOf(options: {
  verdict: "pass" | "fail" | undefined;
  isCurrent: boolean;
}): string {
  if (options.verdict === undefined) return "Not checked by the critic yet.";
  if (!options.isCurrent)
    return "The pictures changed. The critic checks again.";
  return options.verdict === "pass"
    ? "The critic passed it."
    : "The critic failed it.";
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
                {checkTextOf({ verdict: review?.verdict, isCurrent })}
              </span>
              {review === undefined || review.faults.length === 0 ? null : (
                <ul
                  className="shot-faults"
                  aria-label={`What the critic found in the sheet of ${member.name}`}
                >
                  {review.faults.map((fault) => (
                    <li key={fault}>{fault}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
