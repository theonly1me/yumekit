import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ClipReview } from "@yumekit/project";
import { successResult } from "../results.js";

export function storedReviewResult(review: ClipReview): CallToolResult {
  return successResult({
    line: `The critic already reviewed "${review.assetId}": ${review.verdict}${review.faults.length === 0 ? "" : `: ${review.faults.join("; ")}`}. A clip that did not change keeps its verdict. Make a new clip to get a new review.`,
    data: {
      verdict: review.verdict,
      faults: review.faults,
      notes: review.notes ?? [],
      stored: true,
      ...(review.endPictureAssetId === undefined
        ? {}
        : { end_picture_asset_id: review.endPictureAssetId }),
    },
  });
}
