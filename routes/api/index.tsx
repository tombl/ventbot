import { Handlers } from "$fresh/server.ts";
import Pinger from "@/islands/Pinger.tsx";
import { Layout } from "@/components/Layout.tsx";

export default function () {
  return (
    <Layout title="api">
      <Pinger />
    </Layout>
  );
}
