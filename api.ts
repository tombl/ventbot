import { IS_BROWSER } from "$fresh/runtime.ts";
import { pack, unpack } from "@/utils/msgpack.ts";

async function call(method: string[], args: unknown[]) {
  const res = await fetch(
    `/api/${method.map(encodeURIComponent).join("/")}`,
    {
      method: "POST",
      body: pack(args),
    },
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return unpack(new Uint8Array(await res.arrayBuffer()));
}

type DeepAsyncify<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => Promise<R>
  : { [K in keyof T]: DeepAsyncify<T[K]> };

type RealAPI = typeof import("@/server/api/mod.ts");
type WrappedAPI = DeepAsyncify<RealAPI>;

function getProxy(method: string[]): unknown {
  const fn = () => {};
  Object.defineProperty(fn, "name", { value: method.join(".") });
  return new Proxy(fn, {
    get(_, prop: string) {
      return getProxy([...method, prop]);
    },
    apply(_target, _this, args) {
      return call(method, args);
    },
  });
}

const blackbox = (s: string) => s;

export const api = IS_BROWSER
  ? getProxy([]) as WrappedAPI
  : await import(blackbox("@/server/api/mod.ts")) as RealAPI;
