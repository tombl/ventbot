import QuickLRU from "https://esm.sh/quick-lru@6.1.1";

function defaultKey(...args: unknown[]): string {
  return args.join();
}

export function memo<Args extends unknown[], Ret>(
  fn: (...args: Args) => Ret,
  key: (...args: Args) => string = defaultKey,
) {
  let hits = 0;
  let misses = 0;
  let invalidations = 0;
  let insertions = 0;
  let evictions = 0;
  const cache = new QuickLRU<string, Ret>({
    maxSize: 100,
    onEviction() {
      evictions++;
    },
  });

  function inner(...args: Args) {
    const input = key(...args);
    const cached = cache.get(input);
    if (cached !== undefined) {
      hits++;
      return cached;
    }

    misses++;
    const result = fn(...args);
    cache.set(input, result);
    return result;
  }

  inner.read = (...args: Args) => {
    return cache.get(key(...args));
  };

  inner.insert = (args: Args, value: Ret) => {
    insertions++;
    cache.set(key(...args), value);
  };

  inner.invalidate = (...args: Args) => {
    invalidations++;
    cache.delete(key(...args));
  };

  inner.metrics = () => {
    return {
      size: cache.size,
      hits,
      misses,
      invalidations,
      insertions,
      evictions,
    };
  };

  return inner;
}
