export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "backlog" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt?: Date | null;
  position?: number | null;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
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
}

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
}

export type KanbanColumn = {
  id: Task["status"];
  title: string;
  color: "primary" | "secondary" | "warning" | "success";
};
