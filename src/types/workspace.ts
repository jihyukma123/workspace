export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in-progress' | 'waiting-approval' | 'verified';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface WikiPage {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  children: WikiPage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Memo {
  id: string;
  content: string;
  updatedAt: Date;
}

export type KanbanColumn = {
  id: Task['status'];
  title: string;
  color: 'primary' | 'secondary' | 'warning' | 'success';
};
