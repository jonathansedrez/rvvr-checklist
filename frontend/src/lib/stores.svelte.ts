import type { Team, AuthState } from './types';

// Teams store
let teamsValue = $state<Team[]>([]);
let teamsLoading = $state(false);
let teamsError = $state<string | null>(null);

export const teamsStore = {
  get teams() { return teamsValue; },
  get loading() { return teamsLoading; },
  get error() { return teamsError; },

  setTeams(teams: Team[]) { teamsValue = teams; },
  setLoading(loading: boolean) { teamsLoading = loading; },
  setError(error: string | null) { teamsError = error; },

  toggleTask(taskId: string, completed: boolean) {
    teamsValue = teamsValue.map(team => ({
      ...team,
      sections: team.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(task =>
          task.id === taskId ? { ...task, completed } : task
        ),
      })),
    }));
  },
};

// Auth store
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function loadAuth(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  const user = userJson ? JSON.parse(userJson) : null;
  return { token, user };
}

let authValue = $state<AuthState>(loadAuth());

export const authStore = {
  get token() { return authValue.token; },
  get user() { return authValue.user; },
  get isAuthenticated() { return !!authValue.token; },

  login(token: string, user: { id: string; email: string }) {
    authValue = { token, user };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout() {
    authValue = { token: null, user: null };
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
