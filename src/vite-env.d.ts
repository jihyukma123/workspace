/// <reference types="vite/client" />

import type {
  Result,
  ProjectRecord,
  TaskRecord,
  IssueRecord,
  WikiPageRecord,
  MemoRecord,
} from '@/types/ipc';

declare global {
  interface Window {
    workspaceApi: {
      projects: {
        list: () => Promise<Result<ProjectRecord[]>>;
        create: (input: ProjectRecord) => Promise<Result<ProjectRecord>>;
        update: (input: {
          id: string;
          updates: Partial<Pick<ProjectRecord, 'name' | 'description'>>;
        }) => Promise<Result<ProjectRecord>>;
        delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
      };
      tasks: {
        list: (input: { projectId: string }) => Promise<Result<TaskRecord[]>>;
        create: (input: {
          id: string;
          projectId: string;
          title: string;
          description: string;
          status: TaskRecord['status'];
          priority: TaskRecord['priority'];
          createdAt: number;
          position?: number | null;
        }) => Promise<Result<TaskRecord>>;
        update: (input: {
          id: string;
          updates: Partial<Pick<TaskRecord, 'title' | 'description' | 'status' | 'priority' | 'position'>>;
        }) => Promise<Result<TaskRecord>>;
        delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
      };
      issues: {
        list: (input: { projectId: string }) => Promise<Result<IssueRecord[]>>;
        create: (input: IssueRecord) => Promise<Result<IssueRecord>>;
        update: (input: {
          id: string;
          updates: Partial<Pick<IssueRecord, 'title' | 'description' | 'status' | 'priority'>>;
        }) => Promise<Result<IssueRecord>>;
        delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
      };
      wiki: {
        list: (input: { projectId: string }) => Promise<Result<WikiPageRecord[]>>;
        create: (input: {
          id: string;
          projectId: string;
          title: string;
          content: string;
          parentId: string | null;
          createdAt: number;
          updatedAt: number;
          position?: number | null;
        }) => Promise<Result<WikiPageRecord>>;
        update: (input: {
          id: string;
          updates: Partial<Pick<WikiPageRecord, 'title' | 'content' | 'parentId' | 'position'>>;
        }) => Promise<Result<WikiPageRecord>>;
        delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
      };
      memos: {
        list: (input: { projectId: string }) => Promise<Result<MemoRecord[]>>;
        create: (input: MemoRecord) => Promise<Result<MemoRecord>>;
        update: (input: {
          id: string;
          updates: Partial<Pick<MemoRecord, 'title' | 'content' | 'updatedAt'>>;
        }) => Promise<Result<MemoRecord>>;
        delete: (input: { id: string }) => Promise<Result<{ id: string }>>;
      };
    };
  }
}
