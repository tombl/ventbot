import { UnknownPageProps } from "$fresh/server.ts";
import { Layout } from "@/components/Layout.tsx";

export default function (_props: UnknownPageProps) {
  return (
    <Layout title="not found">
      <p class="mb-2 text-xl font-medium">
        the page you are looking for does not exist
      </p>
      <a href="/" class="underline">
        go home?
      </a>
    </Layout>
  );
}
