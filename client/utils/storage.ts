import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useState } from "preact/hooks";

const createStorageHook =
  (storage: Storage) => <T>(name: string, fallback: T) => {
    if (!IS_BROWSER) {
      return [fallback, () => {}] as const;
    }
    const [value, setValue] = useState<T>(() => {
      const item = storage.getItem(name);
      return item ? JSON.parse(item) : fallback;
    });

    useEffect(() => {
      storage.setItem(name, JSON.stringify(value));
    }, [name, value]);

    return [value, setValue] as const;
  };

export const useLocalStorage = createStorageHook(localStorage);
export const useSessionStorage = createStorageHook(sessionStorage);
