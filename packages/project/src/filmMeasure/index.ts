export interface MeasureReview {
  assetId: string;
  verdict: "keep" | "cut" | "redo";
  by?: "maker" | "critic" | undefined;
}

export interface MeasureShot {
  id: string;
  reviews?: MeasureReview[] | undefined;
  startReviews?: MeasureStartReview[] | undefined;
}

export interface MeasureStartReview {
  assetId: string;
  verdict: "pass" | "fail";
}

export interface MeasureSheetTry {
  assetIds: string[];
  verdict: "pass" | "fail";
}

export interface MeasureCastMember {
  id: string;
  referenceAssetIds: string[];
  sheetTries?: MeasureSheetTry[] | undefined;
  sheetReview?: MeasureSheetTry | undefined;
  restrictions?: string[] | undefined;
}

export interface MeasureAsset {
  id: string;
  costUsd: number | undefined;
  firstFrameAssetId: string | undefined;
}

export interface ShotTries {
  shotId: string;
  tries: number;
  accepted: boolean;
  acceptedFirst: boolean;
}

export interface SheetTries {
  castId: string;
  tries: number;
  passed: boolean;
  restricted: boolean;
}

export interface FilmMeasure {
  shotCount: number;
  acceptedFirstCount: number;
  shots: ShotTries[];
  sheets: SheetTries[];
  refusedUsd: number;
}

function isAccepted(review: MeasureReview): boolean {
  return review.verdict === "keep" || review.verdict === "cut";
}

function criticReviewsOf(shot: MeasureShot): MeasureReview[] {
  return (shot.reviews ?? []).filter((review) => review.by === "critic");
}

export function sheetTriesOf(member: MeasureCastMember): MeasureSheetTry[] {
  if (member.sheetTries !== undefined) return member.sheetTries;
  return member.sheetReview === undefined ? [] : [member.sheetReview];
}

function shotTriesOf(shot: MeasureShot): ShotTries {
  const reviews = criticReviewsOf(shot);
  const refusedStarts = new Set(
    (shot.startReviews ?? [])
      .filter((review) => review.verdict === "fail")
      .map((review) => review.assetId),
  );
  const tries =
    new Set(reviews.map((review) => review.assetId)).size + refusedStarts.size;
  const accepted = reviews.some(isAccepted);
  return {
    shotId: shot.id,
    tries,
    accepted,
    acceptedFirst: accepted && tries === 1,
  };
}

function sameIds(options: { first: string[]; second: string[] }): boolean {
  const { first, second } = options;
  return (
    first.length === second.length && first.every((id) => second.includes(id))
  );
}

function sheetOf(member: MeasureCastMember): SheetTries {
  const tries = sheetTriesOf(member);
  const current = tries.findLast((entry) =>
    sameIds({ first: entry.assetIds, second: member.referenceAssetIds }),
  );
  const passed = current?.verdict === "pass";
  return {
    castId: member.id,
    tries: tries.length,
    passed,
    restricted:
      !passed &&
      current !== undefined &&
      (member.restrictions ?? []).length > 0,
  };
}

function refusedSheetPictures(cast: MeasureCastMember[]): string[] {
  return cast.flatMap((member) => {
    const tries = sheetTriesOf(member);
    const kept = new Set([
      ...member.referenceAssetIds,
      ...tries
        .filter((entry) => entry.verdict === "pass")
        .flatMap((entry) => entry.assetIds),
    ]);
    return tries
      .filter((entry) => entry.verdict === "fail")
      .flatMap((entry) => entry.assetIds)
      .filter((id) => !kept.has(id));
  });
}

function refusedShotAssets(options: {
  shots: MeasureShot[];
  assets: MeasureAsset[];
}): string[] {
  const reviews = options.shots.flatMap(criticReviewsOf);
  const accepted = new Set(
    reviews.filter(isAccepted).map((review) => review.assetId),
  );
  const refused = [
    ...new Set(
      reviews
        .filter((review) => review.verdict === "redo")
        .map((review) => review.assetId),
    ),
  ].filter((id) => !accepted.has(id));
  const startOf = (clipId: string) =>
    options.assets.find((asset) => asset.id === clipId)?.firstFrameAssetId;
  const keptStarts = new Set([...accepted].map(startOf));
  const failedStarts = options.shots.flatMap((shot) =>
    (shot.startReviews ?? [])
      .filter((review) => review.verdict === "fail")
      .map((review) => review.assetId),
  );
  const refusedStarts = [...refused.map(startOf), ...failedStarts].filter(
    (id): id is string => id !== undefined && !keptStarts.has(id),
  );
  return [...refused, ...refusedStarts];
}

export function filmMeasureOf(options: {
  shots: MeasureShot[];
  cast: MeasureCastMember[];
  assets: MeasureAsset[];
}): FilmMeasure {
  const shots = options.shots.map(shotTriesOf);
  const refused = new Set([
    ...refusedSheetPictures(options.cast),
    ...refusedShotAssets(options),
  ]);
  const refusedUsd = options.assets
    .filter((asset) => refused.has(asset.id))
    .reduce((...[total, asset]) => total + (asset.costUsd ?? 0), 0);
  return {
    shotCount: shots.length,
    acceptedFirstCount: shots.filter((shot) => shot.acceptedFirst).length,
    shots,
    sheets: options.cast.map(sheetOf),
    refusedUsd: Math.round(refusedUsd * 10000) / 10000,
  };
}
