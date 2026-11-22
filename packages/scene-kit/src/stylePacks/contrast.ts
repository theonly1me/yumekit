interface Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

function parseColor(text: string): Color {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(text);
  if (hex !== null) {
    const [, red = "0", green = "0", blue = "0"] = hex;
    return {
      red: parseInt(red, 16),
      green: parseInt(green, 16),
      blue: parseInt(blue, 16),
      alpha: 1,
    };
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(text);
  if (rgb === null) throw new Error(`Not a pack color: ${text}`);
  const [, red = "0", green = "0", blue = "0", alpha = "1"] = rgb;
  return {
    red: Number(red),
    green: Number(green),
    blue: Number(blue),
    alpha: Number(alpha),
  };
}

function over(options: { top: Color; bottom: Color }): Color {
  const { top, bottom } = options;
  const mix = (channel: "red" | "green" | "blue") =>
    top[channel] * top.alpha + bottom[channel] * (1 - top.alpha);
  return {
    red: mix("red"),
    green: mix("green"),
    blue: mix("blue"),
    alpha: 1,
  };
}

function channelLuminance(channel: number): number {
  const share = channel / 255;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Color): number {
  return (
    0.2126 * channelLuminance(color.red) +
    0.7152 * channelLuminance(color.green) +
    0.0722 * channelLuminance(color.blue)
  );
}

export function contrastRatio(options: {
  text: string;
  background: string;
  under?: string;
}): number {
  const base = parseColor(options.under ?? "#000000");
  const background = over({
    top: parseColor(options.background),
    bottom: base,
  });
  const text = over({ top: parseColor(options.text), bottom: background });
  const luminances = [luminance(text), luminance(background)];
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
}
