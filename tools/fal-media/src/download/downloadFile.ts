import { requestBytes, type SendRequest } from "../falApi.ts";
import type { Outcome } from "../toolResults.ts";

export async function downloadFile(options: {
  sendRequest: SendRequest;
  url: string;
  what: string;
}): Promise<Outcome<Buffer, string>> {
  const bytes = await requestBytes({
    sendRequest: options.sendRequest,
    request: new Request(options.url),
  });
  if (!bytes.ok) {
    return {
      ok: false,
      failure: `Cannot download the ${options.what} from ${options.url}: ${bytes.failure.message}`,
    };
  }
  return bytes;
}

const soundExtensions = ["mp3", "wav", "aac", "m4a", "flac", "ogg"] as const;

export function soundExtensionOf(url: string): string {
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  return soundExtensions.find((each) => each === extension) ?? "mp3";
}
