import type { PricedRequest } from "@yumekit/tools";
import type { HarnessContext } from "../context.js";
import type { HarnessFailure } from "../results.js";
import { withChosenPictures } from "../storyPlan/designChoice.js";
import { assetFilesFolder } from "./assetFiles.js";
import type { GenerateAssetInput } from "./generateAssetInput.js";
import { prepareCall } from "./preparedCall.js";
import { talkingVoiceOf } from "./talkingVoice.js";

export const overMoneyLeftKind = "over-money-left";

type Capability = GenerateAssetInput["capability"];

export const pluralByCapability: Record<Capability, string> = {
  image: "pictures",
  speech: "voices",
  music: "pieces of music",
  video: "clips",
  "sound-effect": "sounds",
  "talking-clip": "talking clips",
  sharper: "sharper copies",
};

export type OverMoneyLeft = HarnessFailure & {
  estimate_usd: number;
  left_usd: number;
  limit_usd: number;
  spent_usd: number;
  what: string;
  paid_calls: number;
  calls_that_fit: number;
};

interface PricedCall {
  call: GenerateAssetInput;
  request: PricedRequest;
}

async function pricedCallOf(options: {
  context: HarnessContext;
  call: GenerateAssetInput;
}): Promise<PricedCall | undefined> {
  const { context, call } = options;
  const { snapshot } = withChosenPictures({
    snapshot: context.store.read(),
    request: call,
  });
  const prepared = await prepareCall({ context, snapshot, request: call });
  if (!prepared.ok) return undefined;
  const { request, sentInput } = prepared.value;
  const voice = talkingVoiceOf({
    snapshot,
    projectFolder: context.store.folder,
    request,
  });
  const expectedSeconds = voice.ok ? voice.value?.seconds : undefined;
  return {
    call,
    request: {
      capability: request.capability,
      input: sentInput,
      ...(request.server === undefined ? {} : { server: request.server }),
      ...(request.model === undefined ? {} : { model: request.model }),
      ...(expectedSeconds === undefined ? {} : { expectedSeconds }),
    },
  };
}

function newCallsOf(options: {
  context: HarnessContext;
  calls: GenerateAssetInput[];
}): GenerateAssetInput[] {
  const usedIds = new Set(
    options.context.store.read().assets.map((asset) => asset.id),
  );
  return options.calls.filter((call) => {
    if (usedIds.has(call.asset_id)) return false;
    usedIds.add(call.asset_id);
    return true;
  });
}

function mainWordOf(paid: { capability: Capability; usd: number }[]): string {
  const shares = new Map<Capability, number>();
  for (const { capability, usd } of paid) {
    shares.set(capability, (shares.get(capability) ?? 0) + usd);
  }
  const [main] = [...shares].toSorted(
    (...[first, second]) => second[1] - first[1],
  );
  return main === undefined ? "calls" : pluralByCapability[main[0]];
}

function callsThatFitOf(options: { pricesUsd: number[]; leftUsd: number }) {
  let total = 0;
  return options.pricesUsd
    .toSorted((...[first, second]) => first - second)
    .filter((usd) => {
      total += usd;
      return total <= options.leftUsd;
    }).length;
}

function dollarsOf(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export async function batchMoneyFailureOf(options: {
  context: HarnessContext;
  calls: GenerateAssetInput[];
}): Promise<OverMoneyLeft | undefined> {
  const { context } = options;
  const priced = (
    await Promise.all(
      newCallsOf(options).map((call) => pricedCallOf({ context, call })),
    )
  ).flatMap((entry) => (entry === undefined ? [] : [entry]));
  const estimate = await context.mediaTools.estimate(
    priced.map((entry) => entry.request),
  );
  if (!estimate.ok || estimate.value.usd <= estimate.value.leftUsd) {
    return undefined;
  }
  const { usd, leftUsd, limitUsd, spentUsd, pricesUsd } = estimate.value;
  const paid = priced.flatMap((...[entry, index]) => {
    const price = pricesUsd[index] ?? 0;
    return price > 0 ? [{ ...entry, usd: price }] : [];
  });
  const what = mainWordOf(
    paid.map((entry) => ({
      capability: entry.call.capability,
      usd: entry.usd,
    })),
  );
  const failure: OverMoneyLeft = {
    kind: overMoneyLeftKind,
    message: `The ${what} of this batch cost about ${dollarsOf(usd)}, and ${dollarsOf(leftUsd)} is left of the ${dollarsOf(limitUsd)} of this project. yumekit made no call.`,
    hint: "Make no paid call now, and do not send the batch again. Tell the person in one short sentence, and end your turn. The editor asks the person to raise the money of this project, to make fewer, or to stop. Only the person can raise a limit.",
    estimate_usd: usd,
    left_usd: leftUsd,
    limit_usd: limitUsd,
    spent_usd: spentUsd,
    what,
    paid_calls: paid.length,
    calls_that_fit: callsThatFitOf({
      pricesUsd: paid.map((entry) => entry.usd),
      leftUsd,
    }),
  };
  await Promise.all(
    paid.map((entry) =>
      context.mediaTools.recordRefusal({
        request: {
          ...entry.request,
          outputDirectory: assetFilesFolder(context.store.folder),
          fileStem: entry.call.asset_id,
        },
        failure: { kind: failure.kind, message: failure.message },
      }),
    ),
  );
  return failure;
}
