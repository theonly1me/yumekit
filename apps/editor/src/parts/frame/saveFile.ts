const revokeDelayMilliseconds = 1_000;

export function saveFile(options: { blob: Blob; fileName: string }): void {
  const url = URL.createObjectURL(options.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = options.fileName;
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, revokeDelayMilliseconds);
}
