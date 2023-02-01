import { LOADING, usePromise } from "@/client/utils/promise.ts";
import { differenceFromNow } from "@/utils/date.ts";
import { parse, RuleTypesExtended } from "discord-markdown-parser";
import { ComponentChildren } from "preact";
import { useMemo, useState } from "preact/hooks";

function Mention(
  { type, id }: { type: "user" | "channel" | "plain"; id: string },
) {
  const name = usePromise(useMemo(async () => {
    if (type === "plain") return id;
    const res = await fetch(`/api/${type}?id=${id}`);
    if (res.status !== 200) {
      throw new Error(`Failed to fetch ${type} name: ${await res.text()}`);
    }
    return res.text();
  }, [type, id]));

  return (
    <span class={"px-0.5 text-brand-11 bg-brand-3"}>
      {type === "channel" ? "#" : "@"}
      {name === LOADING ? "" : name}
    </span>
  );
}
export function Emoji({ name, id }: { name: string; id: string }) {
  return (
    <img
      src={`https://cdn.discordapp.com/emojis/${id}.webp?size=44&quality=lossless`}
      alt={`:${name}:`}
      title={`:${name}:`}
      class="inline max-h-[22px] max-w-[22px]"
    />
  );
}
function Spoiler({ children }: { children: ComponentChildren }) {
  const [show, setShow] = useState(false);

  return (
    <span
      class={`py-0.5 bg-neutral-3 transition-colors ${
        show ? "bg-opacity-25" : "text-transparent select-none"
      }`}
      onClick={(e) => {
        setShow(!show);
        e.preventDefault();
      }}
    >
      {children}
    </span>
  );
}

type Content =
  | string
  | {
    type: RuleTypesExtended;
    content?: string | Content[];
    id?: string;
    animated?: boolean;
    name?: string;
    target?: string;
    timestamp?: string;
    format: string;
  }
  | Content[];

function Node({ content }: { content: Content }) {
  if (typeof content === "string") {
    return <>{content}</>;
  }
  if (Array.isArray(content)) {
    return (
      <>
        {content.map((c) => <Node content={c} />)}
      </>
    );
  }
  switch (content.type) {
    case "br":
      return <br />;
    case "text":
      return <Node content={content.content!} />;
    case "em":
      return (
        <em>
          <Node content={content.content!} />
        </em>
      );
    case "underline":
      return (
        <u>
          <Node content={content.content!} />
        </u>
      );
    case "strong":
      return (
        <strong>
          <Node content={content.content!} />
        </strong>
      );
    case "strikethrough":
      return (
        <del>
          <Node content={content.content!} />
        </del>
      );
    case "inlineCode":
      return (
        <code class="p-0.5 text-sm bg-neutral-3">
          <Node content={content.content!} />
        </code>
      );
    case "user":
      return <Mention type="user" id={content.id!} />;
    case "channel":
      return <Mention type="channel" id={content.id!} />;
    case "everyone":
    case "here":
      return <Mention type="plain" id={content.type} />;
    case "emoji":
      return <Emoji name={content.name!} id={content.id!} />;
    case "url":
    case "autolink":
    case "link":
      return (
        <a href={content.target!} class="underline text-brand-11">
          <Node content={content.content!} />
        </a>
      );
    case "blockQuote":
      return (
        <blockquote class="pl-2 border-l-2 border-neutral-6">
          <Node content={content.content!} />
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre class="p-2 bg-neutral-3 border-1 border-neutral-6">
          <code class="text-sm">{content.content}</code>
        </pre>
      );
    case "twemoji":
      return <>{content.name}</>;
    case "spoiler":
      return (
        <Spoiler>
          <Node content={content.content!} />
        </Spoiler>
      );
    case "timestamp": {
      const date = new Date(parseInt(content.timestamp!) * 1000);
      if (content.format === "R") {
        const format = new Intl.RelativeTimeFormat(undefined, {
          style: "long",
          numeric: "auto",
        });
        const { duration, unit } = differenceFromNow(date);
        return <>{format.format(duration, unit)}</>;
      }
      const options: Record<string, Intl.DateTimeFormatOptions> = {
        t: { timeStyle: "short" },
        T: { timeStyle: "medium" },
        d: { dateStyle: "short" },
        D: { dateStyle: "long" },
        f: { dateStyle: "long", timeStyle: "short" },
        F: { dateStyle: "full", timeStyle: "short" },
      };
      const format = new Intl.DateTimeFormat(
        undefined,
        options[content.format! ?? "f"],
      );
      return <>{format.format(date)}</>;
    }
    default:
      console.warn("Unhandled markdown node", content);
      return (
        <span class="text-error-11">
          {"content" in content ? <Node content={content.content!} /> : (
            content.type
          )}
        </span>
      );
  }
}

export default function Markdown({
  source,
  extended = false,
}: {
  source: string;
  extended?: boolean;
}) {
  const elements = useMemo(
    () => parse(source.trim(), extended ? "extended" : "normal"),
    [source, extended],
  );

  return <Node content={elements as Content[]} />;
}
