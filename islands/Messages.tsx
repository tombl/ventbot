import Markdown from "@/client/components/Markdown.tsx";
import { LOADING, usePromise } from "@/client/utils/promise.ts";
import { useWebsocket } from "@/client/utils/websocket.ts";
import type { Message, Packet } from "@/routes/channels/[channel].tsx";
import { memo } from "@/utils/memo.ts";
import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";

function useMessages(channelId: string): Message[] {
  const [messages, setMessages] = useState<Message[]>([]);

  useWebsocket<Packet>(
    `/channels/${channelId}`,
    useCallback((packet) => {
      switch (packet.type) {
        case "create":
          setMessages((m) => [...m, packet.message].slice(-50));
          break;
        case "update":
          setMessages((m) => {
            const index = m.findIndex(({ id }) => id === packet.message.id);
            if (index === -1) return m;
            return [
              ...m.slice(0, index),
              packet.message,
              ...m.slice(index + 1),
            ];
          });
          break;
        case "delete":
          setMessages((m) => m.filter(({ id }) => id !== packet.id));
          break;
        case "bulkDelete":
          setMessages((m) => m.filter(({ id }) => !packet.ids.includes(id)));
          break;
        default: {
          const _: never = packet;
          console.error("Unknown packet type", packet);
        }
      }
    }, []),
  );

  return messages;
}

const getAvatar = memo(async (user: string) => {
  const res = await fetch(`/api/avatar?user=${user}`);
  if (res.status !== 200) {
    throw new Error(`Failed to fetch avatar: ${await res.text()}`);
  }
  const id = await res.text();
  if (id === "") return undefined;
  return id;
});
function Avatar({ user }: { user: string }) {
  const avatar = usePromise(getAvatar(user));
  return (
    <img
      class={`rounded-full self-center w-[40px] h-[40px] ${
        avatar === LOADING ? "invisible" : ""
      }`}
      src={avatar === LOADING
        ? ""
        : avatar === undefined
        ? `https://cdn.discordapp.com/embed/avatars/${BigInt(user) % 5n}.png`
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
        ? <span class="ml-1 text-sm text-neutral-11">(edited)</span>
        : null}
    </div>
  );

  const sent = new Date(message.sent);
  const now = new Date();
  const wasToday = sent.getDate() === now.getDate() &&
    sent.getMonth() === now.getMonth() &&
    sent.getFullYear() === now.getFullYear();
  const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  const wasYesterday = sent.getDate() === yesterday.getDate() &&
    sent.getMonth() === yesterday.getMonth() &&
    sent.getFullYear() === yesterday.getFullYear();

  return (
    <li class={`flex flex-row space-x-4 ${hasHeading ? "mt-4" : ""}`}>
      {hasHeading
        ? (
          <>
            <Avatar user={message.author} />
            <div class="flex-auto">
              <div class="space-x-1">
                <span class="font-bold">{message.tag}</span>
                <span class="space-x-1 text-sm text-neutral-11">
                  {message.isBot
                    ? <span class="font-bold text-brand-11">bot</span>
                    : null}
                  <span
                    title={longTime.format(message.sent)}
                  >
                    {(wasToday
                      ? `today at ${shortTime.format(message.sent)}`
                      : wasYesterday
                      ? `yesterday at ${shortTime.format(message.sent)}`
                      : longTime.format(message.sent)).toLowerCase()}
                  </span>
                  {/* TODO: edit */}
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
  const botName = JSON.parse(sessionStorage.getItem("name") ?? `"vent"`);

  return (
    <main class="flex flex-col h-screen text-neutral-12">
      <header class="px-4 pt-4">
        <span>{botName} in</span>
        <h1 class="text-2xl font-bold md:text-4xl">#{props.name}</h1>
      </header>
      <MessageStream channelId={props.channel} />
      <MessageBox
        channelName={props.name}
        onSend={async (msg) => {
          const res = await fetch(`/channels/${props.channel}`, {
            method: "POST",
            body: JSON.stringify({ name: botName, content: msg }),
          });
          if (res.status !== 200) {
            throw new Error(`Failed to send message: ${await res.text()}`);
          }
        }}
      />
    </main>
  );
}

function MessageStream({ channelId }: { channelId: string }) {
  const messages = useMessages(channelId);
  const container = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);

  useLayoutEffect(() => {
    if (isAtBottom.current) {
      container.current!.scrollTop = container.current!.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      class="flex-1 max-w-full p-4 overflow-auto"
      ref={container}
      onScroll={(e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        isAtBottom.current = scrollTop + clientHeight >= scrollHeight;
      }}
    >
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
  );
}

function MessageBox(
  { channelName, onSend }: {
    channelName: string;
    onSend: (message: string) => void;
  },
) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const send = useCallback(() => {
    onSend(textarea.current!.value);
    textarea.current!.value = "";
    textarea.current!.rows = 1;
  }, [onSend]);

  return (
    <footer class="flex bg-neutral-3">
      {/* TODO: swap to preview on blur */}
      <textarea 
        class="flex-1 px-3 py-2 bg-transparent resize-none"
        rows={1}
        ref={textarea}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        onInput={(e) => {
          e.currentTarget.rows = Math.max(
            1,
            e.currentTarget.value.split("\n").length,
          );
        }}
        placeholder={`message #${channelName}`}
      />
      <button class="p-2 text-sm font-bold" onClick={send}>send</button>
    </footer>
  );
}
