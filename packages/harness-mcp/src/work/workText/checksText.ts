import { checkModeOf, type ProjectSnapshot } from "@yumekit/project";

export function checksLine(snapshot: ProjectSnapshot): string {
  return checkModeOf(snapshot.project) === "draft"
    ? 'Checks: draft. You check the design of each batch of pictures and clips with check_design. No tool waits for the critic: call it only when the person asks for a second look. Only a break of the design blocks; every other fault is a note. The person picks "critic" in Settings.'
    : "Checks: critic. The critic checks each batch with review_several (review_start, then review_clip), and its design check counts. Only a break of the design blocks; every other fault of its verdict is a note.";
}
