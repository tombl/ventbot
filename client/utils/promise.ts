import { useEffect, useState } from "preact/hooks";

export const LOADING = Symbol("loading");

export function usePromise<T>(promise: Promise<T>): T | typeof LOADING {
  const [state, setState] = useState<
    { type: "loading" } | { type: "resolved"; value: T } | {
      type: "rejected";
      error: Error;
    }
  >({ type: "loading" });

  useEffect(() => {
    let cancelled = false;
    promise.then(
      (value) => !cancelled && setState({ type: "resolved", value }),
      (error) => !cancelled && setState({ type: "rejected", error }),
    );

    return () => {
      cancelled = true;
    };
  }, [promise]);

  switch (state.type) {
    case "loading":
      return LOADING;
    case "resolved":
      return state.value;
    case "rejected":
      throw state.error;
  }
}
