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

// Shapes returned by create endpoints (no nested relations)
export type TeamRow = Omit<Team, 'sections'>;
export type SectionRow = Omit<Section, 'tasks'>;

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
