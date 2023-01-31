import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import NameInput from "@/islands/NameInput.tsx";
import { channelInfo, verifyUserAgent } from "@/server/internal.ts";
import * as base64 from "std/encoding/base64url.ts";
import { CookieMap, cookieMapHeadersInitSymbol } from "std/http/cookie_map.ts";
import Markdown from "@/islands/Markdown.tsx";

interface Info {
  name: string | undefined;
  guild: string;
  topic: string | undefined;
  channel: bigint;
}

interface Data {
  channels: Info[];
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const cookies = new CookieMap(req);

    const channels = (await Promise.all(
      [...cookies]
        .filter(([key]) => key.startsWith("channel_"))
        .map(async ([key, value]) => {
          const channel = BigInt(key.replace("channel_", ""));
          const token = base64.decode(value);
          const info = await channelInfo(token, channel);
          if (
            info === null ||
            !verifyUserAgent(token, req.headers.get("user-agent") ?? "")
          ) {
            cookies.delete(key);
            return null;
          }

          return { channel, ...info };
        }),
    )).filter((info): info is Info => info !== null);

    const response = await ctx.render({ channels });
    for (const [name, value] of cookies[cookieMapHeadersInitSymbol]()) {
      response.headers.append(name, value);
    }
    return response;
  },
};

export default function ({ data }: PageProps<Data>) {
  const { channels } = data;

  const guilds: Record<string, Info[]> = {};
  for (const channel of channels) {
    guilds[channel.guild] ??= [];
    guilds[channel.guild].push(channel);
  }

  return (
    <>
      <Head>
        <title>ventbot</title>
      </Head>

      <div class="flex flex-col max-w-screen-md min-h-screen px-8 py-6 mx-auto text-white bg-slate-3">
        <main class="flex-1">
          <h1 class="mb-6 text-3xl font-bold md:text-4xl">ventbot</h1>

          <div class="absolute left-0 w-screen bg-neutral-2">
            <div class="flex w-full max-w-screen-md px-8 mx-auto">
              <span class="py-2 font-bold">name:</span>
              <NameInput
                class="flex-1 block p-2 bg-transparent"
                defaultValue="vent"
              />
            </div>
          </div>

          {/* px-8 + p-2 = h-10 */}
          <div class="h-10"></div>

          <div class="mt-4 space-y-4">
            {Object.entries(guilds).map(([guild, channels]) => (
              <section>
                <h2 class="mb-2 text-xl font-bold truncate">{guild}</h2>
                {channels.map(({ channel, name, topic }) => (
                  <>
                    <p>
                      <a
                        href={`/channels/${channel}`}
                        class="text-xl font-bold underline truncate"
                      >
                        #{name ?? "unknown-channel"}
                      </a>
                    </p>
                    {topic
                      ? (
                        <p class="truncate text-neutral-400">
                          <Markdown source={topic} />
                        </p>
                      )
                      : null}
                  </>
                ))}
              </section>
            ))}
          </div>
        </main>

        <footer class="space-x-1 font-medium text-neutral-500">
          <a href="/help" class="underline">
            help
          </a>
          <span>|</span>
          <a href={Deno.env.get("DISCORD_BOT_INVITE")} class="underline">
            invite bot
          </a>
        </footer>
      </div>
    </>
  );
}
