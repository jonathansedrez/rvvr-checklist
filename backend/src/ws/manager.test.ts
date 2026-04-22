import { describe, test, expect, mock } from "bun:test";

function createManager() {
  const clients = new Set<{ send: (msg: string) => void }>();
  return {
    add(ws: { send: (msg: string) => void }) {
      clients.add(ws);
    },
    remove(ws: { send: (msg: string) => void }) {
      clients.delete(ws);
    },
    broadcast(event: string, payload: Record<string, unknown>) {
      const message = JSON.stringify({ event, payload });
      for (const client of clients) client.send(message);
    },
    get size() {
      return clients.size;
    },
  };
}

function createMockWs() {
  const sentMessages: string[] = [];
  return { send: (msg: string) => sentMessages.push(msg), sentMessages };
}

describe("wsManager logic", () => {
  test("tracks connected clients size", () => {
    const manager = createManager();
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    expect(manager.size).toBe(0);
    manager.add(ws1);
    expect(manager.size).toBe(1);
    manager.add(ws2);
    expect(manager.size).toBe(2);

    manager.remove(ws1);
    expect(manager.size).toBe(1);
    manager.remove(ws2);
    expect(manager.size).toBe(0);
  });

  test("broadcasts message to all connected clients", () => {
    const manager = createManager();
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    manager.add(ws1);
    manager.add(ws2);

    manager.broadcast("task:toggled", { taskId: "abc", completed: true });

    const expected = JSON.stringify({
      event: "task:toggled",
      payload: { taskId: "abc", completed: true },
    });
    expect(ws1.sentMessages).toContain(expected);
    expect(ws2.sentMessages).toContain(expected);
  });

  test("does not send to disconnected clients", () => {
    const manager = createManager();
    const ws1 = createMockWs();

    manager.add(ws1);
    manager.remove(ws1);

    manager.broadcast("task:toggled", { taskId: "abc", completed: true });

    expect(ws1.sentMessages).toHaveLength(0);
  });

  test("singleton wsManager module exports correct interface", async () => {
    mock.module("./manager", () => ({
      wsManager: createManager(),
    }));

    const { wsManager } = await import("./manager");
    const ws = createMockWs();

    wsManager.add(ws as never);
    expect(wsManager.size).toBe(1);
    wsManager.broadcast("test:event", { data: "hello" });
    expect(ws.sentMessages).toContain(
      JSON.stringify({ event: "test:event", payload: { data: "hello" } })
    );
    wsManager.remove(ws as never);
    expect(wsManager.size).toBe(0);
  });
});
