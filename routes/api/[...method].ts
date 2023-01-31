import { Handlers } from "$fresh/server.ts";
import { pack, unpack } from "@/utils/msgpack.ts";
import * as api from "@/server/api/mod.ts";
import {
  BurstyRateLimiter,
  RateLimiterMemory,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { CookieMap, mergeHeaders } from "std/http/cookie_map.ts";

type API = ((...args: unknown[]) => unknown) | { [method: string]: API };

const limiter = new BurstyRateLimiter(
  new RateLimiterMemory({
    points: 10,
    duration: 1,
  }),
  new RateLimiterMemory({
    points: 60,
    duration: 60,
    blockDuration: 60,
  }),
);

export interface HandlerContext {
  cookies: CookieMap;
}

export const handler: Handlers = {
  async POST(req, ctx) {
    const ip = (ctx.remoteAddr as Deno.NetAddr).hostname;
    try {
      await limiter.consume(ip);
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        return new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": (error.msBeforeNext / 1000).toString() },
        });
      }
      throw error;
    }

    const { method } = ctx.params;
    const args = unpack(new Uint8Array(await req.arrayBuffer()));

    let handler = api as API;
    for (const part of method.split("/")) {
      if (typeof handler !== "function") {
        handler = handler[part];
      }
    }

    const context: HandlerContext = {
      cookies: new CookieMap(req.headers),
    };
    if (typeof handler === "function") {
      const body = pack(await handler.apply(context, args));
      return new Response(body, { headers: mergeHeaders(context.cookies) });
    } else {
      return new Response("no such method", { status: 404 });
    }
  },
};
