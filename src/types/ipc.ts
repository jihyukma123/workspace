export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export type ProjectRecord = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
};

export type TaskRecord = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number | null;
  position: number | null;
};

export type IssueRecord = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  updatedAt: number;
};

export type WikiPageRecord = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  parentId: string | null;
  children: [];
  createdAt: number;
  updatedAt: number;
  position: number | null;
};

export type MemoRecord = {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number | null;
};

export type FeedbackRecord = {
  id: string;
  body: string;
  createdAt: number;
};
