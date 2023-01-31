import { useEffect } from "preact/hooks";

export function useTimeout(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  }, [callback, delay]);
}

export function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

function setAsyncInterval(callback: () => Promise<void>, delay: number) {
  let cancelled = false;

  let timeout: number;
  async function inner() {
    const start = Date.now();
    await callback();
    const elapsed = Date.now() - start;
    if (!cancelled) {
      timeout = setTimeout(inner, delay - elapsed);
    }
  }

  inner();

  return () => {
    cancelled = true;
    clearTimeout(timeout);
  };
}

export function useAsyncInterval(
  callback: () => Promise<void>,
  minDelay: number,
) {
  useEffect(() => {
    return setAsyncInterval(callback, minDelay);
  }, [callback, minDelay]);
}
