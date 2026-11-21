import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { EngineFailure, Outcome } from "../engineTypes.js";

function isAddressInfo(address: unknown): address is AddressInfo {
  return typeof address === "object" && address !== null && "port" in address;
}

function codeOf(error: unknown): unknown {
  return error instanceof Error ? Reflect.get(error, "code") : undefined;
}

export async function listenOnLoopback(options: {
  server: Server;
  port: number;
}): Promise<Outcome<number, EngineFailure>> {
  const { server, port } = options;
  const listened = Promise.withResolvers<Outcome<number, EngineFailure>>();
  const onError = (error: unknown) => {
    const code = codeOf(error);
    if (code === "EADDRINUSE" || code === "EACCES") {
      listened.resolve({ ok: false, failure: { kind: "port-not-free", port } });
      return;
    }
    listened.reject(error);
  };
  server.once("error", onError);
  server.listen({ host: "127.0.0.1", port, exclusive: true }, () => {
    server.off("error", onError);
    const address = server.address();
    if (!isAddressInfo(address)) {
      listened.reject(new Error("The engine server has no port"));
      return;
    }
    listened.resolve({ ok: true, value: address.port });
  });
  return listened.promise;
}
