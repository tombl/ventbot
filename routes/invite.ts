import { Handlers } from "$fresh/server.ts";
import { DISCORD_CLIENT_ID } from "@/server/env.ts";
import * as discord from "discordeno";

const url = new URL("https://discord.com/oauth2/authorize");
url.searchParams.set("client_id", DISCORD_CLIENT_ID);
url.searchParams.set("scope", "bot");
url.searchParams.set(
  "permissions",
  discord.calculateBits([
    "MANAGE_WEBHOOKS",
    "READ_MESSAGE_HISTORY",
    "VIEW_CHANNEL",
  ]),
);

export const handler: Handlers = {
  GET() {
    return new Response(null, {
      status: 302,
      headers: {
        location: url.href,
      },
    });
  },
};
