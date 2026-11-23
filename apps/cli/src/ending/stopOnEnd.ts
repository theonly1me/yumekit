const endSignals = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
const stopDeadlineMilliseconds = 20_000;

export function stopOnEnd(options: {
  close: () => Promise<void>;
  stoppedLine?: string;
  endsWithInput?: boolean;
}): void {
  let isStopping = false;
  const stop = (exitCode: number) => {
    if (isStopping) return;
    isStopping = true;
    setTimeout(() => {
      process.stderr.write("yumekit: the stop took too long.\n");
      process.exit(1);
    }, stopDeadlineMilliseconds).unref();
    options
      .close()
      .then(() => {
        if (options.stoppedLine !== undefined) {
          process.stdout.write(`${options.stoppedLine}\n`);
        }
        process.exit(exitCode);
      })
      .catch((error: unknown) => {
        process.stderr.write(`yumekit: ${String(error)}\n`);
        process.exit(1);
      });
  };
  const stopAfterFailure = (error: unknown) => {
    process.stderr.write(`yumekit: ${String(error)}\n`);
    stop(1);
  };
  for (const signal of endSignals) {
    process.on(signal, () => {
      stop(0);
    });
  }
  process.on("uncaughtException", stopAfterFailure);
  process.on("unhandledRejection", stopAfterFailure);
  if (options.endsWithInput === true) {
    process.stdin.on("end", () => {
      stop(0);
    });
    process.stdin.on("close", () => {
      stop(0);
    });
  }
}
