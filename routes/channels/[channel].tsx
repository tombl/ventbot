import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Messages from "@/islands/Messages.tsx";
import * as bot from "@/server/bot.ts";
import { channelInfo, getChannel, sendMessage } from "@/server/internal.ts";
import { assert } from "@/utils/assert.ts";
import * as discord from "discordeno";
import * as base64 from "std/encoding/base64url.ts";
import { CookieMap } from "std/http/cookie_map.ts";

export type Packet =
  | { type: "create"; message: Message }
  | { type: "update"; message: Message }
  | { type: "delete"; id: string }
  | { type: "bulkDelete"; ids: string[] };

export interface Message {
  id: string;
  author: string;
  tag: string;
  content: string;
  isBot: boolean;
  isEdited: boolean;
  sent: number;
  reactions: Array<{
    id: string | undefined;
    name: string | undefined;
    count: number;
  }>;
}

export function convertMessage(message: discord.Message): Message {
  return {
    id: message.id.toString(),
    author: message.authorId.toString(),
    tag: message.tag,
    content: message.content,
    isBot: message.isFromBot,
    isEdited: message.editedTimestamp !== undefined,
    sent: message.timestamp,
    reactions: message.reactions?.map((r) => ({
      id: r.emoji.id?.toString(),
      name: r.emoji.name,
      count: r.count,
    })) ?? [],
  };
}

const socketMap = new Map<bigint, Set<WebSocket>>();

export function hasListeners(channelId: bigint) {
  return socketMap.has(channelId);
}

export function notifySubscribers(packet: Packet, channelId: bigint) {
  const sockets = socketMap.get(channelId);
  if (!sockets) return;

  const packed = JSON.stringify(packet);
  for (const socket of sockets) {
    socket.send(packed);
  }
}
interface Data {
  info: {
    name: string | undefined;
    guild: string;
    topic: string | undefined;
  };
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const { channel } = ctx.params;
    if (!/^\d+$/.test(channel)) {
      return ctx.renderNotFound();
    }
    const channelId = BigInt(channel);

    const cookies = new CookieMap(req);
    const cookie = cookies.get(`channel_${channel}`);
    if (cookie === undefined) {
      return ctx.renderNotFound();
    }

    const token = base64.decode(cookie);

    const info = await channelInfo(token, channelId);
    assert(info !== null, "invalid token");

    if (req.headers.get("upgrade")?.toLowerCase().includes("websocket")) {
      const { response, socket } = Deno.upgradeWebSocket(req);

      new Promise<void>((resolve) => {
        socket.addEventListener("open", () => resolve(), { once: true });
      }).then(() => bot.getLastMessages(channelId))
        .then(async (messages) => {
          for (const id of messages) {
            const message = await bot.getMessage(id, channelId);
            const packet: Packet = {
              type: "create",
              message: convertMessage(message),
            };
            socket.send(JSON.stringify(packet));
          }
        });

      let sockets = socketMap.get(channelId);
      if (!sockets) {
        sockets = new Set();
        socketMap.set(channelId, sockets);
      }
      sockets.add(socket);

      socket.onerror = socket.onclose = () => {
        sockets!.delete(socket);
        if (sockets!.size === 0) {
          socketMap.delete(channelId);
        }
      };

      return response;
    }

    return ctx.render({ info });
  },
  async POST(req, ctx) {
    const { channel } = ctx.params;
    if (!/^\d+$/.test(channel)) {
      return ctx.renderNotFound();
    }

    const cookies = new CookieMap(req);
    const cookie = cookies.get(`channel_${channel}`);
    if (cookie === undefined) {
      return ctx.renderNotFound();
    }

    const token = base64.decode(cookie);
    assert(getChannel(token).toString() === channel, "invalid token");

    const { name, content } = await req.json();
    await sendMessage(token, name, content);
    return new Response(null, { status: 200 });
  },
};

export default function (props: PageProps<Data>) {
  const { channel } = props.params;
  const { info } = props.data;
  const name = info.name ?? "unknown-guild";

  return (
    <>
      <Head>
        <title>ventbot | #{name}</title>
      </Head>
      <Messages channel={channel} name={name} />
    </>
  );
}
