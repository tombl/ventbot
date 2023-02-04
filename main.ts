/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import freshwind from "freshwind/plugin.ts";
import { PORT } from "./server/env.ts";
import * as twind from "./twind.config.ts";

await start(manifest, {
  port: PORT,
  plugins: [
    freshwind(twind.default, twind.configURL),
  ],
});
