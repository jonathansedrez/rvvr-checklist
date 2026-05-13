import type { WsMessage } from './types';

type Handler = (payload: Record<string, unknown>) => void;

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/ws';

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const handlers = new Map<string, Set<Handler>>();

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  socket = new WebSocket(WS_URL);

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data as string) as WsMessage;
      const listeners = handlers.get(msg.event);
      if (listeners) {
        for (const handler of listeners) {
          handler(msg.payload);
        }
      }
    } catch {
      // Ignore malformed messages
    }
  };

  socket.onclose = () => {
    reconnectTimer = setTimeout(() => {
      connect();
    }, 3000);
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}

function on(event: string, handler: Handler) {
  if (!handlers.has(event)) {
    handlers.set(event, new Set());
  }
  handlers.get(event)!.add(handler);
}

function off(event: string, handler: Handler) {
  handlers.get(event)?.delete(handler);
}

export const ws = { connect, disconnect, on, off };
