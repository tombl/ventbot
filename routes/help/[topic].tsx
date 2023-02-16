import { Layout } from "@/components/Layout.tsx";
import Markdown from "@/islands/Markdown.tsx";
import { PageProps } from "$fresh/server.ts";
import { extract } from "std/encoding/front_matter/yaml.ts";
import { Handlers } from "$fresh/server.ts";

interface Topic {
  title: string;
  body: string;
}

const dir = new URL("../../help/", import.meta.url);
export const topics = new Map<string, Topic>();
for await (const file of Deno.readDir(dir)) {
  if (file.isFile && file.name.endsWith(".md")) {
    const source = await Deno.readTextFile(new URL(file.name, dir));
    const name = file.name.slice(0, -3);
    const { body, attrs } = extract(source);
    topics.set(name, { title: attrs.title as string, body });
  }
}

export const handler: Handlers<Topic> = {
  GET(_req, ctx) {
    const { topic } = ctx.params;

    const data = topics.get(topic);
    if (!data) {
      return ctx.renderNotFound();
    }
    return ctx.render(data);
  },
};

export default function (props: PageProps<Topic>) {
  const { title, body } = props.data;

  return (
    <Layout title={title}>
      <article>
        <Markdown allowHtml extended source={body} />
      </article>
    </Layout>
  );
}
