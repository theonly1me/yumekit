import { describe, expect, it } from "vitest";
import { englishEspeakVoicesOf } from "./linuxVoice.ts";
import { englishVoicesOf } from "./macVoice.ts";
import { englishWindowsVoicesOf, rateOf } from "./windowsVoice.ts";

describe("the voices of each system", () => {
  it("puts a premium macOS voice first, then an enhanced one, and leaves out the novelty voices", () => {
    const listing = [
      "Bubbles             en_US    # Hello! My name is Bubbles.",
      "Daniel              en_GB    # Hello! My name is Daniel.",
      "Samantha (English (US)) en_US    # Hello! My name is Samantha.",
      "Samantha (English (US)) en_US    # Hello! My name is Samantha.",
      "Ava (Enhanced)      en_US    # Hello! My name is Ava.",
      "Zoe (Premium)       en_US    # Hello! My name is Zoe.",
      "Reed (English (US)) en_US    # Hello! My name is Reed.",
      "Amélie              fr_CA    # Bonjour! Je m’appelle Amélie.",
    ].join("\n");

    expect(englishVoicesOf(listing)).toEqual([
      "Zoe (Premium)",
      "Ava (Enhanced)",
      "Samantha (English (US))",
      "Daniel",
      "Reed (English (US))",
    ]);
  });

  it("lists the English voices of espeak-ng with American English first", () => {
    const listing = [
      "Pty Language       Age/Gender VoiceName          File                 Other Languages",
      " 2  en-gb           --/M      English_(Great_Britain) gmw/en             (en 2)",
      " 5  en-us           --/M      English_(America)  gmw/en-US            (en 3)",
      " 5  de              --/M      German             gmw/de",
    ].join("\n");

    expect(englishEspeakVoicesOf(listing)).toEqual(["en-us", "en-gb"]);
  });

  it("lists the English voices of Windows and maps a speed to the rate from -10 to 10", () => {
    expect(
      englishWindowsVoicesOf(
        "en-US|Microsoft Zira Desktop\r\nde-DE|Microsoft Hedda Desktop\r\n",
      ),
    ).toEqual(["Microsoft Zira Desktop"]);
    expect([rateOf(0.5), rateOf(1), rateOf(2), rateOf(3)]).toEqual([
      -5, 0, 10, 10,
    ]);
  });
});
