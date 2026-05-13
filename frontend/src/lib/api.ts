import type { Team, Task, Section, TeamRow, SectionRow } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

export const api = {
  teams: {
    list(): Promise<Team[]> {
      return request('/teams');
    },
    get(id: string): Promise<Team> {
      return request(`/teams/${id}`);
    },
    create(name: string): Promise<TeamRow> {
      return request('/teams', { method: 'POST', body: JSON.stringify({ name }) });
    },
    update(id: string, name: string): Promise<TeamRow> {
      return request(`/teams/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
    },
    delete(id: string): Promise<null> {
      return request(`/teams/${id}`, { method: 'DELETE' });
    },
  },

  sections: {
    create(teamId: string, name: string): Promise<SectionRow> {
      return request(`/teams/${teamId}/sections`, { method: 'POST', body: JSON.stringify({ name }) });
    },
    update(id: string, name: string): Promise<SectionRow> {
      return request(`/sections/${id}`, { method: 'PUT', body: JSON.stringify({ name }) });
    },
    delete(id: string): Promise<null> {
      return request(`/sections/${id}`, { method: 'DELETE' });
    },
  },

  tasks: {
    toggle(id: string): Promise<Task> {
      return request(`/tasks/${id}/toggle`, { method: 'PATCH' });
    },
    create(sectionId: string, title: string, slug?: string): Promise<Task> {
      return request(`/sections/${sectionId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title, slug: slug ?? null }),
      });
    },
    update(id: string, data: { title?: string; slug?: string | null }): Promise<Task> {
      return request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    delete(id: string): Promise<null> {
      return request(`/tasks/${id}`, { method: 'DELETE' });
    },
  },

  auth: {
    login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
      return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    },
  },
};
