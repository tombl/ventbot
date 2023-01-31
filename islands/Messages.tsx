import { api } from "@/api.ts";
import Markdown from "@/client/components/Markdown.tsx";
import { LOADING, usePromise } from "@/client/utils/promise.ts";
import { useWebsocket } from "@/client/utils/websocket.ts";
import type { Message, Packet } from "@/routes/ws/messages/[channel].ts";
import { memo } from "@/utils/memo.ts";
import { useCallback, useMemo, useState } from "preact/hooks";

function useMessages(channelId: bigint): Message[] {
  const [order, setOrder] = useState<bigint[]>([]);
  const cache = useMemo(() => new Map<bigint, Message>(), [channelId]);

  useWebsocket<Packet>(
    `/ws/messages/${channelId}`,
    useCallback((packet) => {
      switch (packet.type) {
        case "create":
          cache.set(packet.message.id, packet.message);
          setOrder((o) => [...o, packet.message.id]);
          break;
        case "update":
          cache.set(packet.message.id, packet.message);
          setOrder((o) => [...o]);
          break;
        case "delete":
          cache.delete(packet.id);
          setOrder((order) => order.filter((id) => id !== packet.id));
          break;
        case "bulkDelete":
          for (const id of packet.ids) {
            cache.delete(id);
          }
          setOrder((order) => order.filter((id) => !packet.ids.includes(id)));
          break;
        default: {
          const _: never = packet;
          console.error("Unknown packet type", packet);
        }
      }
    }, []),
  );

  return order.map((id) => cache.get(id)!);
}

const getAvatar = memo(async (user: bigint) => await api.ui.getAvatarId(user));
function Avatar({ user }: { user: bigint }) {
  const avatar = usePromise(getAvatar(user));
  return (
    <img
      class={`rounded-full w-[40px] h-[40px] ${
        avatar === LOADING ? "invisible" : ""
      }`}
      src={avatar === LOADING
        ? ""
        : avatar === undefined
        ? `https://cdn.discordapp.com/embed/avatars/${user % 5n}.png`
        : `https://cdn.discordapp.com/avatars/${user}/${avatar}.webp?size=80`}
      width={40}
      height={40}
    />
  );
}

const shortTime = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const longTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});
function Message(
  { message, prev }: { message: Message; prev: Message | undefined },
) {
  const hasHeading = prev === undefined ||
    prev.author !== message.author ||
    new Date(message.sent).getTime() - new Date(prev.sent).getTime() >
      1000 * 60 * 20;

  const content = (
    <div class="[overflow-wrap:anywhere]">
      <Markdown source={message.content} />
      {message.isEdited
        ? <span class="text-sm italic text-neutral-500">(edited)</span>
        : null}
    </div>
  );

  const now = new Date();
  const wasToday = message.sent.getDate() === now.getDate() &&
    message.sent.getMonth() === now.getMonth() &&
    message.sent.getFullYear() === now.getFullYear();

  return (
    <li class={`flex flex-row space-x-4 ${hasHeading ? "mt-4" : ""}`}>
      {hasHeading
        ? (
          <>
            <Avatar user={message.author} />
            <div class="flex-auto">
              <div class="space-x-1">
                <span class="font-bold">{message.tag}</span>
                {message.isBot
                  ? <span class="font-bold text-brand-500">bot</span>
                  : null}
                <span
                  class="text-neutral-500"
                  title={longTime.format(message.sent)}
                >
                  {(wasToday ? shortTime : longTime).format(message.sent)}
                </span>
              </div>
              {content}
            </div>
          </>
        )
        : (
          <>
            <span class="w-[40px]"></span>
            <div class="flex-auto">{content}</div>
          </>
        )}
    </li>
  );
}

export default function Messages(props: { channel: string; name: string }) {
  const channelId = BigInt(props.channel);
  const messages = useMessages(channelId);
  const botName = JSON.parse(sessionStorage.getItem("name") ?? `"vent"`);

  return (
    <main class="flex flex-col h-screen text-white">
      <header class="px-4 pt-4">
        <span>{botName} in</span>
        <h1 class="text-2xl font-bold md:text-4xl">#{props.name}</h1>
      </header>

      <div class="flex-1 max-w-full p-4 overflow-auto">
        <ul class="-mt-4">
          {messages.map((message, i) => (
            <Message
              message={message}
              prev={messages[i - 1]}
              key={message.id}
            />
          ))}
        </ul>
      </div>

      <footer class="flex bg-neutral-2">
        <textarea
          class="flex-1 px-3 py-2 bg-transparent resize-none"
          rows={1}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.ctrlKey) {
              e.preventDefault();
              console.log(e.currentTarget.value);
              e.currentTarget.value = "";
              e.currentTarget.rows = 1;
            }
          }}
          onInput={(e) => {
            e.currentTarget.rows = Math.max(
              1,
              e.currentTarget.value.split("\n").length,
            );
          }}
          placeholder={`message #${props.name}`}
        />
        <button class="p-2 text-sm font-bold">send</button>
      </footer>
    </main>
  );
}
