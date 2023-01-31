// @deno-types="https://unpkg.com/msgpackr@1.8.3/index.d.ts"
import { Packr } from "https://unpkg.com/msgpackr@1.8.3/index.js";

const packr = new Packr({
  moreTypes: true,
  bundleStrings: true,
  useRecords: true,
  structuredClone: true,
});

export function pack(data: unknown) {
  return packr.pack(data);
}

export function unpack(data: Uint8Array) {
    return packr.unpack(data);
}
