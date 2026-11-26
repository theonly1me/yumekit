import type {
  AskPerson,
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
import type { ExportDesk } from "../exports/exportDesk.js";
import type { HelperCall } from "./helpers/helperDesk.js";
import type { PersonRequestInput } from "./questions/personRequest.js";
import type { MoneyDesk } from "./money/moneyDesk.js";
import type { ProgramToolCall } from "./permissions/permissionAsk.js";
import type { PermissionDesk } from "./permissions/permissionDesk.js";
import type { CallNote } from "./stepNotes.js";
import type { ToolCaller } from "./trackedStore.js";

export interface Chat {
  view: () => Promise<ChatView>;
  startRequest: (
    request: PersonRequestInput,
  ) => Promise<Outcome<RequestEntry | SteeringEntry, ChatFailure>>;
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
  askPerson: AskPerson;
  askHelper: (request: HelperRequest) => Promise<HelperOutcome>;
  askCritic: (request: CriticRequest) => Promise<CriticTurn>;
  helperCallOf: (token: string | undefined) => HelperCall;
  money: MoneyDesk;
  permissions: ChatPermissions;
  exports: ExportDesk;
  close: () => Promise<void>;
}

export interface ChatPermissions {
  ask: (options: { call: ProgramToolCall; isLead: boolean }) => Promise<string>;
  isRequestOn: () => boolean;
  checkFile: PermissionDesk["checkFile"];
  answer: PermissionDesk["answer"];
}
