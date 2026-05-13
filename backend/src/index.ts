import { app } from "./app.ts";
import { wsManager } from "./ws/manager.ts";

const port = Number(process.env.PORT) || 3000;

console.log(`Server starting on port ${port}...`);

export default {
  port,
  fetch(req: Request, server: ReturnType<typeof Bun.serve>) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      const success = server.upgrade(req, { data: {} });
      if (success) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    return app.fetch(req);
  },
  websocket: {
    open(ws: Parameters<typeof wsManager.add>[0]) {
      wsManager.add(ws);
      console.log(`WebSocket client connected. Total: ${wsManager.size}`);
    },
    message(_ws: Parameters<typeof wsManager.add>[0], _message: string | Buffer) {},
    close(ws: Parameters<typeof wsManager.add>[0]) {
      wsManager.remove(ws);
      console.log(`WebSocket client disconnected. Total: ${wsManager.size}`);
    },
  },
};
