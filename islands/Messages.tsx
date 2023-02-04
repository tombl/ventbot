import Markdown, { Emoji } from "@/client/components/Markdown.tsx";
import { LOADING, usePromise } from "@/client/utils/promise.ts";
import { useWebsocket } from "@/client/utils/websocket.ts";
import type { Message, Packet } from "@/routes/channels/[channel].tsx";
import { memo } from "@/utils/memo.ts";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

function useMessages(channelId: string): Message[] {
  const [messages, setMessages] = useState<Message[]>([]);

  useWebsocket<Packet<Message>>(
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
      class={`rounded-full my-[4px] w-[40px] h-[40px] ${
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

function messageIsContiguous(a: Message, b: Message) {
  return a.author === b.author &&
    a.tag === b.tag &&
    Math.abs(new Date(a.sent).getTime() - new Date(b.sent).getTime()) <
      1000 * 60 * 10;
}

function Message(
  { message, prev, next, onEdit }: {
    message: Message;
    prev: Message | undefined;
    next: Message | undefined;
    onEdit(content: string): void;
  },
) {
  const isFirst = prev === undefined || !messageIsContiguous(message, prev);
  const isLast = next === undefined || !messageIsContiguous(message, next);

  const sent = new Date(message.sent);
  const now = new Date();
  const wasToday = sent.getDate() === now.getDate() &&
    sent.getMonth() === now.getMonth() &&
    sent.getFullYear() === now.getFullYear();
  const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);
  const wasYesterday = sent.getDate() === yesterday.getDate() &&
    sent.getMonth() === yesterday.getMonth() &&
    sent.getFullYear() === yesterday.getFullYear();

  const [editContent, setEditContent] = useState<string | null>(null);
  const shouldFocusEdit = useRef(false);

  const content = (
    <>
      {message.canEdit
        ? (
          <div
            class={`absolute top-0 ${
              editContent === null ? "invisible group-hover:visible" : ""
            } space-x-1 right-4 bg-neutral-3 px-1 text-sm ${
              isFirst ? "" : "-translate-y-full"
            }`}
          >
            {editContent === null
              ? (
                <button
                  class="p-1"
                  onClick={() => {
                    shouldFocusEdit.current = true;
                    setEditContent(message.content);
                  }}
                >
                  edit
                </button>
              )
              : null}
          </div>
        )
        : null}
      {editContent === null
        ? (
          <div class="[overflow-wrap:anywhere]">
            <Markdown source={message.content} />
            {message.isEdited
              ? <span class="ml-1 text-sm text-neutral-11">(edited)</span>
              : null}
          </div>
        )
        : (
          <>
            <MessageEntry
              value={editContent}
              onInput={setEditContent}
              placeholder="edit message"
              onSubmit={() => {
                onEdit(editContent);
                setEditContent(null);
              }}
              onCancel={() => setEditContent(null)}
            />
            <span class="text-sm">
              <span>
                escape to{" "}
                <button
                  class="text-brand-11 hover:underline"
                  onClick={() => setEditContent(null)}
                >
                  cancel
                </button>
              </span>
              {" | "}
              <span>
                enter to{" "}
                <button
                  class="text-brand-11 hover:underline"
                  onClick={() => {
                    onEdit(editContent);
                    setEditContent(null);
                  }}
                >
                  save
                </button>
              </span>
            </span>
          </>
        )}
      {message.reactions.length === 0 ? null : (
        <div class="my-2 space-x-1">
          {message.reactions.map(({ name, id, count }) => (
            <span class="p-2 text-sm bg-neutral-2 border-1 border-neutral-6">
              {id === undefined
                ? name
                : <Emoji name={name ?? "unknown-emoji"} id={id} />} {count}
            </span>
          ))}
        </div>
      )}
    </>
  );

  return (
    <li
      class={`group relative px-4 flex flex-row space-x-4 hover:bg-neutral-2 ${
        isFirst ? "mt-4" : ""
      } ${isLast ? "mb-4" : ""}`}
    >
      {isFirst
        ? (
          <>
            <Avatar user={message.author} />
            <div class="flex-auto">
              <div class="space-x-1">
                <span class="font-bold" title={message.tag}>
                  {message.tag.split("#")[0]}
                </span>
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
                </span>
              </div>
              {content}
            </div>
          </>
        )
        : (
          <>
            <span
              class="w-[40px] text-[0.6rem] [-webkit-line-clamp:1] text-neutral-11 text-center self-center invisible group-hover:visible text-clip"
              title={longTime.format(message.sent)}
            >
              {shortTime.format(message.sent).toLowerCase()}
            </span>
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
          if (msg === "") return;
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
      class="flex-1 max-w-full overflow-auto"
      ref={container}
      onScroll={(e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        isAtBottom.current = scrollTop + clientHeight >= scrollHeight;
      }}
    >
      <ul>
        {messages.map((message, i) => (
          <Message
            message={message}
            prev={messages[i - 1]}
            next={messages[i + 1]}
            key={message.id}
            onEdit={(content) => {
              fetch(`/channels/${channelId}`, {
                method: "PATCH",
                body: JSON.stringify({ id: message.id, content }),
              });
            }}
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
  const [content, setContent] = useState("");
  const send = () => {
    // TODO: speculative/dimmed message
    onSend(content);
    setContent("");
  };

  return (
    <footer class="flex bg-neutral-3">
      <MessageEntry
        class="flex-1"
        placeholder={`message #${channelName}`}
        onSubmit={send}
        value={content}
        onInput={(content) => {
          // TODO: preprocess emoji/mentions
          setContent(content);
        }}
      />
      <button
        class="p-2 text-sm font-bold bg-neutral-3 hover:bg-neutral-4 active:bg-neutral-5"
        onClick={send}
      >
        send
      </button>
    </footer>
  );
}

function MessageEntry(
  {
    class: className,
    value,
    onInput,
    placeholder,
    onSubmit,
    onCancel,
  }: {
    class?: string;
    value: string;
    onInput(content: string): void;
    placeholder: string;
    onSubmit(): void;
    onCancel?(): void;
  },
) {
  const [focused, setFocused] = useState(false);
  const [rows, setRows] = useState(1);

  useEffect(() => {
    setRows(Math.max(1, value.split("\n").length));
  }, [value]);

  return (
    <div className={`${className ?? ""} flex relative`}>
      {focused || value === ""
        ? null
        : (
          <div class="absolute w-full h-full px-3 py-2 pointer-events-none bg-neutral-3">
            <Markdown source={value} />
          </div>
        )}
      <textarea
        class="flex-1 px-3 py-2 bg-transparent resize-none placeholder:text-neutral-11"
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyPress={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && onCancel !== undefined) {
            e.preventDefault();
            onCancel();
          }
        }}
        onInput={(e) => {
          const { value } = e.currentTarget;
          e.currentTarget.rows = Math.max(1, value.split("\n").length);
          onInput(value);
        }}
        value={value}
        placeholder={placeholder}
      />
    </div>
  );
}
