import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function({ Component }: AppProps) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="/global.css" />
      </Head>
      <Component />
    </>
  );
}
