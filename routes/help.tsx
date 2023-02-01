import { Layout } from "@/components/Layout.tsx";
import Markdown from "@/islands/Markdown.tsx";

const markdown = `
TODO: write docs
`;

export default function () {
  return (
    <Layout title="help">
      <article>
        <Markdown extended source={markdown} />
      </article>
    </Layout>
  );
}
