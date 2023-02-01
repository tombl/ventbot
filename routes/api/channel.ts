import { Handlers } from "$fresh/server.ts";
import { getChannel } from "@/server/bot.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const id = BigInt(url.searchParams.get("id")!);
    const channel = await getChannel(id);
    return new Response(channel.name ?? "invalid-channel", {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "max-age=604800",
      },
    });
  },
};
