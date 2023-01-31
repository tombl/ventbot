import { unpack } from "@/utils/msgpack.ts";
import { useEffect } from "preact/hooks";

export function useWebsocket<T>(path: string, handler: (message: T) => void) {
  useEffect(() => {
    const url = new URL(path, location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url.href);
    socket.binaryType = "arraybuffer";
    socket.onmessage = (e) => {
      const buffer = e.data as ArrayBuffer;
      handler(unpack(new Uint8Array(buffer)));
    };
    return () => {
      socket.close();
    };
  }, [path, handler]);
}
