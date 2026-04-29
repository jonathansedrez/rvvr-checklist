import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Capture the last WebSocket instance created so tests can drive it.
let lastSocket: MockWebSocket | null = null;

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;

  readyState = MockWebSocket.CONNECTING;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn(() => { this.readyState = 3; /* CLOSED */ });
  send = vi.fn();

  constructor() {
    lastSocket = this;
  }

  // Helper: simulate a server message arriving
  receive(event: string, payload: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify({ event, payload }) });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('ws', () => {
  beforeEach(async () => {
    lastSocket = null;
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('connect() creates a WebSocket', async () => {
    const { ws } = await import('./websocket');
    ws.connect();
    expect(lastSocket).not.toBeNull();
  });

  it('does not open a second socket when already connecting', async () => {
    const { ws } = await import('./websocket');
    ws.connect();
    const first = lastSocket;
    ws.connect();
    expect(lastSocket).toBe(first);
  });

  it('dispatches a server message to registered handlers', async () => {
    const { ws } = await import('./websocket');
    const handler = vi.fn();

    ws.on('task:toggled', handler);
    ws.connect();

    lastSocket!.readyState = MockWebSocket.OPEN;
    lastSocket!.receive('task:toggled', { taskId: 'abc', completed: true });

    expect(handler).toHaveBeenCalledWith({ taskId: 'abc', completed: true });
  });

  it('does not call a handler after off()', async () => {
    const { ws } = await import('./websocket');
    const handler = vi.fn();

    ws.on('task:toggled', handler);
    ws.off('task:toggled', handler);
    ws.connect();

    lastSocket!.receive('task:toggled', { taskId: 'x', completed: false });

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores unknown events', async () => {
    const { ws } = await import('./websocket');
    const handler = vi.fn();
    ws.on('task:toggled', handler);
    ws.connect();

    lastSocket!.receive('unknown:event', {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('reconnects after the socket closes', async () => {
    const { ws } = await import('./websocket');
    ws.connect();
    const first = lastSocket;

    // Simulate the server closing the connection (readyState goes to CLOSED=3)
    first!.readyState = 3;
    first!.onclose?.();

    // Advance past the 3 s reconnect delay
    vi.advanceTimersByTime(3100);

    expect(lastSocket).not.toBe(first);
  });
});
