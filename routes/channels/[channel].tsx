import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import Messages from "@/islands/Messages.tsx";
import * as base64 from "std/encoding/base64url.ts";
import { CookieMap } from "std/http/cookie_map.ts";
import { channelInfo } from "@/server/internal.ts";

interface Data {
  name: string;
}

export const handler: Handlers<Data> = {
  async GET(req, ctx) {
    const { channel } = ctx.params;
    if (!/^\d+$/.test(channel)) {
      return ctx.renderNotFound();
    }

    const cookies = new CookieMap(req);
    const cookie = cookies.get(`channel_${channel}`);

    if (cookie === undefined) {
      return ctx.renderNotFound();
    }

    const token = base64.decode(cookie);

    const info = await channelInfo(token, BigInt(channel));

    return ctx.render({ name: info?.name ?? "unknown-channel" });
  },
};

export default function (props: PageProps<Data>) {
  const { channel } = props.params;
  const { name } = props.data;

  return (
    <>
      <Head>
        <title>ventbot | #{name}</title>
      </Head>
      <Messages channel={channel} name={name} />
    </>
  );
}
