import { Handlers } from "$fresh/server.ts";
import { iconBigintToHash } from "discordeno";
import { getUser } from "@/server/bot.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const id = BigInt(url.searchParams.get("user")!);
    try {
      const user = await getUser(id);
      const avatarId = user.avatar === undefined
        ? undefined
        : iconBigintToHash(user.avatar);
      return new Response(avatarId ?? "", {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "max-age=604800",
        },
      });
    } catch {
      return new Response("", {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "max-age=604800",
        },
      });
    }
  },
};
