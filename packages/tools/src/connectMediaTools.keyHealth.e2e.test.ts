import { describe, expect, it, vi } from "vitest";
import { pricedFixture } from "./testing/pricedFixture.js";
import type { MediaTools } from "./types.js";

function picture(options: { tools: MediaTools; outputDirectory: string }) {
  return options.tools.run({
    capability: "image",
    input: { prompt: "a lantern" },
    outputDirectory: options.outputDirectory,
    fileStem: "lantern",
  });
}

describe("connectMediaTools key health", () => {
  it("shows the key as not working after a 401, and the order with no pick skips the service", async () => {
    const { tools, outputDirectory } = await pricedFixture({
      key: "expired-key",
    });

    const first = await picture({ tools, outputDirectory });
    const second = await picture({ tools, outputDirectory });
    const choices = await tools.choices();

    expect(first.ok ? first.value.server : first.failure).toMatchObject({
      kind: "media-tool-failed",
      message: "The Priced API answered 401: Your API key has expired.",
    });
    expect(second.ok && second.value.server).toBe("sample");
    expect(
      tools.list().find((entry) => entry.server === "priced")?.keyProblem,
    ).toBe("The Priced API answered 401: Your API key has expired.");
    const image = choices.choices.find((each) => each.capability === "image");
    expect(
      image?.services.find((service) => service.server === "priced"),
    ).toMatchObject({
      state: "key-not-working",
      keyProblem: "The Priced API answered 401: Your API key has expired.",
    });
  });

  it("fails a picked service whose key does not work with no call, until the key changes", async () => {
    const fixture = await pricedFixture({ key: "expired-key" });
    const { tools, outputDirectory } = fixture;
    const named = () =>
      tools.run({
        capability: "image",
        server: "priced",
        input: { prompt: "a lantern" },
        outputDirectory,
        fileStem: "named",
      });
    await named();

    const blocked = await named();
    vi.stubEnv("YUMEKIT_PRICED_KEY", "made-up-new-key");
    await tools.checkKeys();
    const afterNewKey = await named();

    expect(blocked.ok ? "ran" : blocked.failure).toMatchObject({
      kind: "media-key-not-working",
      server: "priced",
      getKeyUrl: "https://example.com/priced-keys",
    });
    expect(afterNewKey.ok && afterNewKey.value.server).toBe("priced");
  });

  it("checks a key with the free check, never with a paid call, and keeps the answer for some minutes", async () => {
    const fixture = await pricedFixture({ key: "expired-key" });

    await fixture.tools.checkKeys();
    await fixture.tools.checkKeys();

    expect(await fixture.callsOfServer()).toEqual(["check_key"]);
    expect(
      fixture.tools.list().find((entry) => entry.server === "priced")
        ?.keyProblem,
    ).toBe("The Priced API rejected the key.");
  });
});
