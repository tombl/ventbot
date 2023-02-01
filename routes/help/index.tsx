import { Layout } from "@/components/Layout.tsx";
import { topics } from "./[topic].tsx";

export default function () {
  return (
    <Layout title="help">
      <article>
        <ul>
          {[...topics].map(([name, { title }]) => (
            <li>
              <a href={`/help/${name}`} class="underline">{title}</a>
            </li>
          ))}
        </ul>
      </article>
    </Layout>
  );
}
