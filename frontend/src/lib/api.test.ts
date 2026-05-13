import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the api wrapper in isolation by mocking globalThis.fetch.

describe('api wrapper', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  function mockFetch(body: unknown, status = 200) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response);
  }

  it('sends the Authorization header when a token is in localStorage', async () => {
    localStorage.setItem('auth_token', 'my-secret-token');
    mockFetch({ data: [] });

    const { api } = await import('./api');
    await api.teams.list();

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer my-secret-token');
  });

  it('omits the Authorization header when no token is stored', async () => {
    mockFetch({ data: [] });

    const { api } = await import('./api');
    await api.teams.list();

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
  });

  it('returns the data field from a successful response', async () => {
    const fakeTeam = { id: '1', name: 'Worship', sections: [], createdAt: '', updatedAt: '' };
    mockFetch({ data: [fakeTeam] });

    const { api } = await import('./api');
    const teams = await api.teams.list();

    expect(teams).toEqual([fakeTeam]);
  });

  it('throws an Error with the server error message on non-ok response', async () => {
    mockFetch({ error: 'Team not found' }, 404);

    const { api } = await import('./api');
    await expect(api.teams.get('bad-id')).rejects.toThrow('Team not found');
  });

  it('throws a generic message when the error body cannot be parsed', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response);

    const { api } = await import('./api');
    await expect(api.teams.list()).rejects.toThrow('HTTP 500');
  });

  it('sends POST with JSON body for team creation', async () => {
    mockFetch({ data: { id: '2', name: 'Tech', sections: [], createdAt: '', updatedAt: '' } }, 201);

    const { api } = await import('./api');
    await api.teams.create('Tech');

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/teams');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Tech' });
  });
});
