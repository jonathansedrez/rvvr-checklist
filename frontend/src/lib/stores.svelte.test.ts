import { describe, it, expect, beforeEach } from 'vitest';

describe('teamsStore', () => {
  it('starts with empty teams', async () => {
    const { teamsStore } = await import('./stores.svelte');
    expect(teamsStore.teams).toEqual([]);
    expect(teamsStore.loading).toBe(false);
    expect(teamsStore.error).toBeNull();
  });

  it('setTeams replaces the list', async () => {
    const { teamsStore } = await import('./stores.svelte');
    const fakeTeam = {
      id: '1',
      name: 'Worship',
      sections: [],
      createdAt: '',
      updatedAt: '',
    };
    teamsStore.setTeams([fakeTeam]);
    expect(teamsStore.teams).toHaveLength(1);
    expect(teamsStore.teams[0].name).toBe('Worship');
  });

  it('toggleTask updates the correct task', async () => {
    const { teamsStore } = await import('./stores.svelte');
    teamsStore.setTeams([
      {
        id: 'team-1',
        name: 'Team',
        sections: [
          {
            id: 'sec-1',
            name: 'Sec',
            teamId: 'team-1',
            tasks: [
              { id: 'task-1', title: 'Task', slug: null, completed: false, sectionId: 'sec-1', createdAt: '', updatedAt: '' },
            ],
            createdAt: '',
            updatedAt: '',
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
    ]);

    teamsStore.toggleTask('task-1', true);
    expect(teamsStore.teams[0].sections[0].tasks[0].completed).toBe(true);
  });
});

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts unauthenticated when localStorage is empty', async () => {
    const { authStore } = await import('./stores.svelte');
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.token).toBeNull();
    expect(authStore.user).toBeNull();
  });

  it('login sets token and user', async () => {
    const { authStore } = await import('./stores.svelte');
    authStore.login('my-token', { id: 'u1', email: 'admin@test.com' });
    expect(authStore.isAuthenticated).toBe(true);
    expect(authStore.token).toBe('my-token');
    expect(authStore.user?.email).toBe('admin@test.com');
  });

  it('logout clears the state', async () => {
    const { authStore } = await import('./stores.svelte');
    authStore.login('tok', { id: 'u1', email: 'a@a.com' });
    authStore.logout();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.token).toBeNull();
  });
});
