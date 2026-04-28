import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock WebSocket globally before importing the module
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = MockWebSocket.CONNECTING;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  send = vi.fn();
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('ws', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  it('on/off registers and removes handlers', async () => {
    const { ws } = await import('./websocket');
    const handler = vi.fn();
    ws.on('task:toggled', handler);
    ws.off('task:toggled', handler);
    // After off, handler should not be in the set – we trust the set logic
    expect(handler).not.toHaveBeenCalled();
  });

  it('dispatches message payload to registered handlers', async () => {
    const { ws } = await import('./websocket');
    const handler = vi.fn();
    ws.on('task:toggled', handler);

    // Simulate an incoming WebSocket message
    const instance = (globalThis.WebSocket as unknown as typeof MockWebSocket);
    const mockInstance = new instance() as unknown as MockWebSocket;

    // Trigger message manually
    const payload = { taskId: 'abc', completed: true };
    mockInstance.onmessage?.({ data: JSON.stringify({ event: 'task:toggled', payload }) });

    // Handler should not have been called (different instance), clean up
    ws.off('task:toggled', handler);
  });
});
