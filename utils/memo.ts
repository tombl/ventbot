import QuickLRU from "https://esm.sh/quick-lru@6.1.1";

function defaultKey(...args: unknown[]): string {
  return args.join();
}

export function memo<Args extends unknown[], Ret>(
  fn: (...args: Args) => Ret,
  key: (...args: Args) => string = defaultKey,
) {
  const cache = new QuickLRU<string, Ret>({ maxSize: 100 });
  function inner(...args: Args) {
    const input = key(...args);
    const cached = cache.get(input);
    if (cached !== undefined) return cached;

    const result = fn(...args);
    cache.set(input, result);
    return result;
  }

  inner.read = (...args: Args) => {
    return cache.get(key(...args));
  };

  inner.insert = (args: Args, value: Ret) => {
    cache.set(key(...args), value);
  };

  inner.invalidate = (...args: Args) => {
    cache.delete(key(...args));
  };

  return inner;
}
