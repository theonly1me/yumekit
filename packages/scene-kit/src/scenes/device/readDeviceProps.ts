import type { JsonObject } from "@yumekit/scene";
import { readField, shortenText } from "../../props/readField.js";
import { deviceLimits, deviceSchema } from "../../schemas/device.js";

export function readDeviceProps(props: JsonObject) {
  const { shape } = deviceSchema.props;
  return {
    assetId: readField({
      field: shape.assetId,
      value: props["assetId"],
      fallback: "",
    }),
    frame: readField({
      field: shape.frame,
      value: props["frame"],
      fallback: undefined,
    }),
    caption: readField({
      field: shape.caption,
      value: props["caption"],
      fallback: undefined,
      repair: shortenText(deviceLimits.caption),
    }),
  };
}
