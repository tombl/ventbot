import { Handlers } from "$fresh/server.ts";
import { pack } from "@/utils/msgpack.ts";
import * as discord from "discordeno";
import * as bot from "@/server/bot.ts";

export type Packet =
  | { type: "create"; message: Message }
  | { type: "update"; message: Message }
  | { type: "delete"; id: bigint }
  | { type: "bulkDelete"; ids: bigint[] };

export interface Message {
  id: bigint;
  author: bigint;
  tag: string;
  content: string;
  isBot: boolean;
  isEdited: boolean;
  sent: Date;
  reactions: Array<{
    id: bigint | undefined;
    name: string | undefined;
    count: number;
  }>;
}

export function convertMessage(message: discord.Message): Message {
  return {
    id: message.id,
    author: message.authorId,
    tag: message.tag,
    content: message.content,
    isBot: message.isFromBot,
    isEdited: message.editedTimestamp !== undefined,
    sent: new Date(message.timestamp),
    reactions: message.reactions?.map((r) => ({
      id: r.emoji.id,
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

  const packed = pack(packet);
  for (const socket of sockets) {
    socket.send(packed);
  }
}

export const handler: Handlers = {
  GET(req, ctx) {
    if (!req.headers.get("upgrade")?.toLowerCase().includes("websocket")) {
      return ctx.renderNotFound();
    }

    const channel = BigInt(ctx.params.channel);

    const { response, socket } = Deno.upgradeWebSocket(req);

    new Promise<void>((resolve) => {
      socket.addEventListener("open", () => resolve(), { once: true });
    }).then(() => bot.getLastMessages(channel))
      .then(async (messages) => {
        for (const id of messages) {
          const message = await bot.getMessage(id, channel);
          const packet: Packet = {
            type: "create",
            message: convertMessage(message),
          };
          socket.send(pack(packet));
        }
      });

    let sockets = socketMap.get(channel);
    if (!sockets) {
      sockets = new Set();
      socketMap.set(channel, sockets);
    }
    sockets.add(socket);

    socket.onerror = socket.onclose = () => {
      sockets!.delete(socket);
      if (sockets!.size === 0) {
        socketMap.delete(channel);
      }
    };

    return response;
  },
};
