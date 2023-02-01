import { Handlers } from "$fresh/server.ts";
import { getUser } from "@/server/bot.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const id = BigInt(url.searchParams.get("id")!);
    const user = await getUser(id);
    return new Response(user.username, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "max-age=604800",
      },
    });
  },
};
