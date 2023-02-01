import { MiddlewareHandlerContext } from "$fresh/server.ts";
import {
  BurstyRateLimiter,
  RateLimiterMemory,
  RateLimiterRes,
} from "rate-limiter-flexible";
import { CookieMap } from "std/http/cookie_map.ts";
import * as log from "std/log/mod.ts";

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

export async function handler(_req: Request, ctx: MiddlewareHandlerContext) {
  // TODO: X-Forwarded-For
  const ip = (ctx.remoteAddr as Deno.NetAddr).hostname;
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
}
