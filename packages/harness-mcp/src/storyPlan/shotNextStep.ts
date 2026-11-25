export function shotNextStepOf(shotId: string): string {
  return `The faults are notes: only a break of the design blocks. Decide what serves the film: use it, or make shot "${shotId}" again from the refused version (its start picture as first_frame_asset_id, or a new start picture made with it in reference_asset_ids) and change only each fault. If its cause will hit other shots, record it with record_lesson.`;
}
