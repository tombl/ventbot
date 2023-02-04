import { MiddlewareHandler } from "$fresh/server.ts";
import { IP_HEADER } from "@/server/env.ts";
import { fail } from "@/utils/assert.ts";
import {
  BurstyRateLimiter,
  RateLimiterMemory,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { CookieMap } from "std/http/cookie_map.ts";
import * as log from "std/log/mod.ts";
import { HttpSource, Registry } from "@/server/metrics.ts";

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

export interface MethodContext {
  cookies: CookieMap;
}

const metrics = new HttpSource();

Registry.sources.push(metrics);

export const handler: MiddlewareHandler[] = [
  async (req, ctx) => {
    const ip = IP_HEADER === null
      ? (ctx.remoteAddr as Deno.NetAddr).hostname
      : (req.headers.get(IP_HEADER) ?? fail(`${IP_HEADER} is not set`));
    try {
      await limiter.consume(ip);
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        log.info("rate limited", ip);
        return new Response("rate limited", {
          status: 429,
          headers: { "Retry-After": (error.msBeforeNext / 1000).toString() },
        });
      }
      throw error;
    }
    return await ctx.next();
  },
  async (req, ctx) => {
    const done = metrics.feed(req);
    const resp = await ctx.next();
    done(resp);
    return resp;
  },
];
