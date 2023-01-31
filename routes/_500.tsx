import { ErrorPageProps } from "$fresh/server.ts";
import { Layout } from "@/components/Layout.tsx";

export default function ({ error }: ErrorPageProps) {
  return (
    <Layout title="server error">
      <p class="mb-2 text-xl font-medium">
        {(error as Error).message ?? String(error)}
      </p>
      <a href="/" class="underline">
        go home?
      </a>
    </Layout>
  );
}
