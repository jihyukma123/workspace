import { create } from 'zustand';
import { Project, Task, WikiPage, MemoState, Issue, Memo } from '@/types/workspace';

interface WorkspaceState extends MemoState {
  projects: Project[];
  selectedProjectId: string | null;
  tasks: Task[];
  issues: Issue[];
  wikiPages: WikiPage[];
  activeTab: 'kanban' | 'wiki' | 'memo' | 'issues';
  
  // Actions
  setSelectedProject: (id: string | null) => void;
  setActiveTab: (tab: 'kanban' | 'wiki' | 'memo' | 'issues') => void;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  deleteTask: (taskId: string) => void;
  addIssue: (issue: Issue) => void;
  updateIssueStatus: (issueId: string, status: Issue['status']) => void;
  deleteIssue: (issueId: string) => void;
  addWikiPage: (page: WikiPage) => void;
  updateWikiPage: (
    pageId: string,
    updates: Pick<WikiPage, 'title' | 'content'>
  ) => void;
  deleteWikiPage: (pageId: string) => void;
  setSelectedMemoId: (id: string | null) => void;
  addMemo: (memo: Memo) => void;
  updateMemoDraft: (memoId: string, content: string) => void;
  saveMemo: (memoId: string, content: string) => void;
  revertMemo: (
    memoId: string,
    snapshot: Pick<Memo, 'content' | 'updatedAt' | 'status'>
  ) => void;
}

// Initial demo data
const initialProjects: Project[] = [
  { id: '1', name: 'Project Alpha', description: 'Main development project', createdAt: new Date() },
  { id: '2', name: 'Project Beta', description: 'Research and development', createdAt: new Date() },
  { id: '3', name: 'Project Gamma', description: 'Client deliverables', createdAt: new Date() },
];

const initialTasks: Task[] = [
  { id: '1', title: 'Setup development environment', description: 'Configure all tools and dependencies', status: 'done', priority: 'high', createdAt: new Date() },
  { id: '2', title: 'Design system architecture', description: 'Create the overall system design', status: 'in-progress', priority: 'high', createdAt: new Date() },
  { id: '3', title: 'Implement authentication', description: 'Add user login and registration', status: 'done', priority: 'medium', createdAt: new Date() },
  { id: '4', title: 'Create API endpoints', description: 'Build REST API for the application', status: 'backlog', priority: 'medium', createdAt: new Date() },
  { id: '5', title: 'Write unit tests', description: 'Add comprehensive test coverage', status: 'backlog', priority: 'low', createdAt: new Date() },
  { id: '6', title: 'Database optimization', description: 'Improve query performance', status: 'in-progress', priority: 'medium', createdAt: new Date() },
];

const initialIssues: Issue[] = [
  {
    id: '101',
    projectId: '1',
    title: 'Login form validation missing',
    description: 'The login form accepts empty fields without showing errors.',
    status: 'todo',
    priority: 'high',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '102',
    projectId: '1',
    title: 'Slow dashboard load',
    description: 'Dashboard takes too long to render after initial fetch.',
    status: 'in-progress',
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '103',
    projectId: '2',
    title: 'Update typography scale',
    description: 'Adjust headings to match the updated design system.',
    status: 'done',
    priority: 'low',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialWikiPages: WikiPage[] = [
  {
    id: '1',
    projectId: '1',
    title: 'Getting Started',
    content: '# Getting Started\n\nWelcome to the project wiki. This is your central knowledge base.\n\n## Quick Links\n- Setup Guide\n- Architecture Overview\n- API Documentation',
    parentId: null,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    projectId: '1',
    title: 'Architecture',
    content: '# Architecture Overview\n\n## System Components\n\n- **Frontend**: React + TypeScript\n- **Backend**: Node.js\n- **Database**: PostgreSQL\n\n## Data Flow\n\nDescribe how data flows through your system...',
    parentId: null,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const initialMemos: Memo[] = [
  {
    id: 'm1',
    projectId: '1',
    title: 'Quick Notes',
    content: '# Quick Notes\n\nUse this space for quick thoughts and ideas...\n\n- [ ] Review PR #42\n- [ ] Schedule team sync\n- [ ] Update documentation',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'saved',
  },
];

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  projects: initialProjects,
  selectedProjectId: '1',
  tasks: initialTasks,
  issues: initialIssues,
  wikiPages: initialWikiPages,
  memos: initialMemos,
  selectedMemoId: initialMemos[0]?.id ?? null,
  activeTab: 'kanban',

  setSelectedProject: (id) => set((state) => {
    const nextMemo = state.memos.find((memo) => memo.projectId === id);
    return { selectedProjectId: id, selectedMemoId: nextMemo?.id ?? null };
  }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  
  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map((task) => 
      task.id === taskId ? { ...task, status } : task
    ),
  })),
  
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== taskId),
  })),

  addIssue: (issue) => set((state) => ({ issues: [...state.issues, issue] })),

  updateIssueStatus: (issueId, status) => set((state) => ({
    issues: state.issues.map((issue) =>
      issue.id === issueId ? { ...issue, status, updatedAt: new Date() } : issue
    ),
  })),

  deleteIssue: (issueId) => set((state) => ({
    issues: state.issues.filter((issue) => issue.id !== issueId),
  })),
  
  addWikiPage: (page) => set((state) => ({ wikiPages: [...state.wikiPages, page] })),
  
  updateWikiPage: (pageId, updates) => set((state) => ({
    wikiPages: state.wikiPages.map((page) =>
      page.id === pageId
        ? { ...page, ...updates, updatedAt: new Date() }
        : page
    ),
  })),

  deleteWikiPage: (pageId) => set((state) => ({
    wikiPages: state.wikiPages.filter((page) => page.id !== pageId),
  })),

  setSelectedMemoId: (id) => set({ selectedMemoId: id }),

  addMemo: (memo) => set((state) => ({
    memos: [...state.memos, memo],
    selectedMemoId: memo.id,
  })),

  updateMemoDraft: (memoId, content) => set((state) => ({
    memos: state.memos.map((memo) => {
      if (memo.id !== memoId) {
        return memo;
      }
      if (memo.content === content) {
        return memo;
      }
      return { ...memo, content, status: 'unsaved' };
    }),
  })),

  saveMemo: (memoId, content) => {
    const savedAt = new Date();
    set((state) => ({
      memos: state.memos.map((memo) =>
        memo.id === memoId ? { ...memo, status: 'saving' } : memo
      ),
    }));
    setTimeout(() => {
      set((state) => ({
        memos: state.memos.map((memo) => {
          if (memo.id !== memoId) {
            return memo;
          }
          if (memo.status !== 'saving') {
            return memo;
          }
          if (memo.content !== content) {
            return { ...memo, status: 'unsaved' };
          }
          return { ...memo, updatedAt: savedAt, status: 'saved' };
        }),
      }));
    }, 300);
  },
  revertMemo: (memoId, snapshot) => set((state) => ({
    memos: state.memos.map((memo) =>
      memo.id === memoId
        ? {
            ...memo,
            content: snapshot.content,
            updatedAt: snapshot.updatedAt,
            status: snapshot.status,
          }
        : memo
    ),
  })),
}));
