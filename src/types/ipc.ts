export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export type ProjectRecord = {
  id: string;
  name: string;
  createdAt: number;
};

export type TaskRecord = {
  id: string;
  projectId: string;
  title: string;
  status: "backlog" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: number;
  updatedAt: number | null;
  position: number | null;
  dueDate: number | null;
};

export type IssueRecord = {
  id: string;
  projectId: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: number;
  updatedAt: number;
  dueDate: number | null;
};

export type IssueCommentRecord = {
  id: string;
  issueId: string;
  body: string;
  createdAt: number;
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

export type DailyLogRecord = {
  id: string;
  projectId: string;
  date: string;
  content: string;
  createdAt: number;
  updatedAt: number | null;
};

export type ReminderRecord = {
  id: string;
  projectId: string;
  text: string;
  status: "todo" | "progress" | "done";
  createdAt: number;
  updatedAt: number | null;
  remindAt: number | null;
  notified: number;
};

export type FeedbackRecord = {
  id: string;
  body: string;
  createdAt: number;
};

export type TrashItemType = "wiki" | "memo" | "issue";

export type TrashListInput = {
  projectId: string;
  type?: TrashItemType;
  query?: string;
};

export type TrashItemRecord = {
  type: TrashItemType;
  id: string;
  title: string;
  deletedAt: number;
  meta: { descendantCount: number } | null;
};

export type TrashActionInput = {
  type: TrashItemType;
  id: string;
};

export type TrashPurgeResult = {
  memoDeleted: number;
  issueDeleted: number;
  wikiDeleted: number;
};
