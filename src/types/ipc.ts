import type { WorkspaceDocument } from "@/types/document";

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
  details: string | null;
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
  document: WorkspaceDocument;
  contentText: string;
  parentId: string | null;
  children: [];
  createdAt: number;
  updatedAt: number;
  position: number | null;
  contentSchemaVersion: number;
};

export type MemoRecord = {
  id: string;
  projectId: string;
  title: string;
  document: WorkspaceDocument;
  contentText: string;
  createdAt: number;
  updatedAt: number | null;
  contentSchemaVersion: number;
};

export type DailyLogRecord = {
  id: string;
  projectId: string;
  date: string;
  document: WorkspaceDocument;
  contentText: string;
  createdAt: number;
  updatedAt: number | null;
  contentSchemaVersion: number;
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

export type FeedbackListInput = {
  limit?: number;
};

export type FeedbackGithubIssueCreateInput = {
  body: string;
  feedbackId?: string;
  createdAt?: number;
};

export type FeedbackGithubIssueRecord = {
  number: number;
  url: string;
  title: string;
  repository: string;
};

export type AssistantWeeklySummaryInput = {
  projectId: string;
  prompt: string;
  threadId?: string;
};

export type AssistantWeeklySummaryRecord = {
  threadId: string | null;
  response: string;
  weekStart: string;
  weekEnd: string;
  logCount: number;
  projectName: string | null;
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
