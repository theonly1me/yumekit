export interface HelperRequest {
  brief: string;
  sceneIds: string[];
  assetIds: string[];
}

export interface HelperChange {
  kind: "scene" | "asset";
  id: string;
}

export type HelperOutcome =
  | { ok: true; text: string; changed: HelperChange[] }
  | { ok: false; failure: { kind: string; message: string; hint: string } };

export type AskHelper = (request: HelperRequest) => Promise<HelperOutcome>;
