export interface Project {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  details?: string | null;
  status: "backlog" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt?: Date | null;
  position?: number | null;
  dueDate?: Date | null;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
}

export interface IssueComment {
  id: string;
  issueId: string;
  body: string;
  createdAt: Date;
}

export interface WikiPage {
  id: string;
  projectId: string;
  title: string;
  content: string;
  parentId: string | null;
  children: WikiPage[];
  createdAt: Date;
  updatedAt: Date;
  position?: number | null;
  status: WikiPageStatus;
}

export type WikiPageStatus = "saved" | "unsaved" | "saving";

export type MemoStatus = "saved" | "unsaved" | "saving";

export interface Memo {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  status: MemoStatus;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface MemoState {
  memos: Memo[];
  selectedMemoId: string | null;
}

export type ReminderStatus = "todo" | "progress" | "done";

export interface Reminder {
  id: string;
  projectId: string;
  text: string;
  status: ReminderStatus;
  createdAt: Date;
  updatedAt: Date | null;
  remindAt: Date | null;
}

export type KanbanColumn = {
  id: Task["status"];
  title: string;
  color: "primary" | "secondary" | "warning" | "success";
};
