import { useEffect } from "preact/hooks";

export function useWebsocket<T>(path: string, handler: (message: T) => void) {
  useEffect(() => {
    const url = new URL(path, location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url.href);
    socket.onmessage = (e) => {
      handler(JSON.parse(e.data));
    };
    return () => {
      socket.close();
    };
  }, [path, handler]);
}
