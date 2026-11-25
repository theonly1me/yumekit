import type {
  CriticRequest,
  CriticTurn,
  HelperOutcome,
  HarnessResult,
  HelperRequest,
} from "@yumekit/harness-mcp";
import type { Outcome } from "../engineTypes.js";
import type {
  ChangeEntry,
  ChatFailure,
  ChatView,
  RequestEntry,
  SteeringEntry,
} from "./chatTypes.js";
import type { HelperCall } from "./helpers/helperDesk.js";
import type { CallNote } from "./stepNotes.js";
import type { ToolCaller } from "./trackedStore.js";

export interface Chat {
  view: () => Promise<ChatView>;
  startRequest: (options: {
    text: string;
    details?: string | undefined;
    aboutClipId: string | undefined;
  }) => Promise<Outcome<RequestEntry | SteeringEntry, ChatFailure>>;
  stop: () => boolean;
  undoChange: (changeId: string) => Promise<Outcome<ChangeEntry, ChatFailure>>;
  noteAiCall: (tool: string) => CallNote;
  runToolCall: <Value>(options: {
    caller: ToolCaller;
    call: () => Promise<Value>;
  }) => Promise<Value>;
  leadCall: (options: {
    tool: string;
    call: () => Promise<HarnessResult>;
  }) => Promise<HarnessResult>;
  askHelper: (request: HelperRequest) => Promise<HelperOutcome>;
  askCritic: (request: CriticRequest) => Promise<CriticTurn>;
  helperCallOf: (token: string | undefined) => HelperCall;
  close: () => Promise<void>;
}
