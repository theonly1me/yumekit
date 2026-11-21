export function shellQuoted(text: string): string {
  return /^[\w./-]+$/.test(text) ? text : `'${text.replaceAll("'", "'\\''")}'`;
}

export function startLineOf(options: {
  projectFolder: string;
  startCommand: string;
}): string {
  return `cd ${shellQuoted(options.projectFolder)} && ${options.startCommand}`;
}
