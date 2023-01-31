export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function fail(message?: string): never {
  throw new Error(message);
}