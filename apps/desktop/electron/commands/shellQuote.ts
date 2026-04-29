export function shellSingleQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function sanitizeShellIdentifier(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}
