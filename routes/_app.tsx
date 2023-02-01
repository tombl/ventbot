import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

export default function ({ Component }: AppProps) {
  return (
    <>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        {/* @ts-ignore */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#05a2c2" />
        <meta name="msapplication-TileColor" content="#05a2c2" />
        <meta name="theme-color" content="#05a2c2" />
        <link rel="stylesheet" href="/global.css" />
      </Head>
      <Component />
    </>
  );
}
