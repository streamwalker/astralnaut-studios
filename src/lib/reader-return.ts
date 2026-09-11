export function safeReaderReturn(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^\/reader\/[a-z0-9-]+\/[0-9]+(?:\?page=[0-9]+)?$/.test(value) ? value : undefined;
}
