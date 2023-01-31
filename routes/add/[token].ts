import { Handlers } from "$fresh/server.ts";
import { claimToken, getChannel, verifyUserAgent } from "@/server/internal.ts";
import * as base64 from "std/encoding/base64url.ts";
import { CookieMap, mergeHeaders } from "std/http/cookie_map.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const { token } = ctx.params;
    const decoded = base64.decode(token);

    try {
      claimToken(decoded);
    } catch {
      throw new Error("this link has expired");
    }
    verifyUserAgent(decoded, req.headers.get("user-agent") ?? "");
    const channel = getChannel(decoded);

    const cookies = new CookieMap(req);
    cookies.set(`channel_${channel}`, token, {
      httpOnly: true,
      sameSite: "lax",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

    return new Response(null, {
      status: 302,
      headers: mergeHeaders(cookies, { location: "/" }),
    });
  },
};
