import type { JsonObject, JsonValue } from "@yumekit/tools";

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function designLooksOf(answer: JsonObject): JsonObject[] {
  const design = answer["design"];
  if (!Array.isArray(design)) return [];
  const looks = design.flatMap((frame) =>
    isObject(frame)
      ? [
          {
            cast_id: frame["cast_id"] ?? "",
            ...(frame["asset_id"] === undefined
              ? {}
              : { asset_id: frame["asset_id"] }),
            ...(frame["seconds"] === undefined
              ? {}
              : { seconds: frame["seconds"] }),
          },
        ]
      : [],
  );
  return looks.filter(
    (...[look, index]) =>
      looks.findIndex(
        (other) => JSON.stringify(other) === JSON.stringify(look),
      ) === index,
  );
}
