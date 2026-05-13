import type { ServerWebSocket } from "bun";

type WsData = Record<string, unknown>;

const clients = new Set<ServerWebSocket<WsData>>();

export const wsManager = {
  add(ws: ServerWebSocket<WsData>) {
    clients.add(ws);
  },

  remove(ws: ServerWebSocket<WsData>) {
    clients.delete(ws);
  },

  broadcast(event: string, payload: Record<string, unknown>) {
    const message = JSON.stringify({ event, payload });
    for (const client of clients) {
      client.send(message);
    }
  },

  get size() {
    return clients.size;
  },
};
