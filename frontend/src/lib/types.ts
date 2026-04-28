export interface Task {
  id: string;
  title: string;
  slug: string | null;
  completed: boolean;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  name: string;
  teamId: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

export interface WsMessage {
  event: string;
  payload: Record<string, unknown>;
}
