import { filterIds, filterNames, type FilterId } from "./reviewFilters.js";

export function TakeFilters(props: {
  counts: Record<FilterId, number>;
  picked: FilterId;
  reviewedCount: number;
  onPick: (id: FilterId) => void;
}) {
  return (
    <div className="take-filters">
      <p className="review-progress" aria-live="polite">
        <strong>{props.reviewedCount}</strong> of {props.counts.all} reviewed
      </p>
      <div className="filter-chips" role="group" aria-label="Show">
        {filterIds.map((id) => (
          <button
            key={id}
            type="button"
            className="filter-chip"
            aria-pressed={id === props.picked}
            onClick={() => {
              props.onPick(id);
            }}
          >
            {filterNames[id]}{" "}
            <span className="filter-count">{props.counts[id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
