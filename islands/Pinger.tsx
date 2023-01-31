import { api } from "@/api.ts";
import { useAsyncInterval } from "@/client/utils/timeout.ts";
import { useSignal } from "@preact/signals";
import { useRef } from "preact/hooks";

function ping(el: HTMLElement) {
  el.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(2)", opacity: 0 },
    ],
    { duration: 500, easing: "cubic-bezier(0, 0, 0.2, 1)" },
  );
}

export default function Pinger() {
  const send = useSignal("...");
  const recv = useSignal("...");

  const sendRef = useRef<HTMLSpanElement>(null);
  const recvRef = useRef<HTMLSpanElement>(null);

  useAsyncInterval(async () => {
    const start = Date.now();
    ping(sendRef.current!);
    const server = await api.time();
    ping(recvRef.current!);
    send.value = `${server - start}ms`;
    recv.value = `${Date.now() - server}ms`;
  }, 1000);

  return (
    <span class="text-xl tabular-nums">
      <span ref={sendRef} class="absolute opacity-0">↑</span>↑ {send}
      <span class="px-2">/</span>
      <span ref={recvRef} class="absolute opacity-0">↓</span>↓ {recv}
    </span>
  );
}
