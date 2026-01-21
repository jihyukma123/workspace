import { create } from 'zustand';
import { Project, Task, WikiPage, Memo } from '@/types/workspace';

interface WorkspaceState {
  projects: Project[];
  selectedProjectId: string | null;
  tasks: Task[];
  wikiPages: WikiPage[];
  memo: Memo;
  activeTab: 'kanban' | 'wiki' | 'memo';
  
  // Actions
  setSelectedProject: (id: string | null) => void;
  setActiveTab: (tab: 'kanban' | 'wiki' | 'memo') => void;
  addProject: (project: Project) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  deleteTask: (taskId: string) => void;
  addWikiPage: (page: WikiPage) => void;
  updateWikiPage: (pageId: string, content: string) => void;
  updateMemo: (content: string) => void;
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

const initialWikiPages: WikiPage[] = [
  {
    id: '1',
    title: 'Getting Started',
    content: '# Getting Started\n\nWelcome to the project wiki. This is your central knowledge base.\n\n## Quick Links\n- Setup Guide\n- Architecture Overview\n- API Documentation',
    parentId: null,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Architecture',
    content: '# Architecture Overview\n\n## System Components\n\n- **Frontend**: React + TypeScript\n- **Backend**: Node.js\n- **Database**: PostgreSQL\n\n## Data Flow\n\nDescribe how data flows through your system...',
    parentId: null,
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  projects: initialProjects,
  selectedProjectId: '1',
  tasks: initialTasks,
  wikiPages: initialWikiPages,
  memo: { id: '1', content: '# Quick Notes\n\nUse this space for quick thoughts and ideas...\n\n- [ ] Review PR #42\n- [ ] Schedule team sync\n- [ ] Update documentation', updatedAt: new Date() },
  activeTab: 'kanban',

  setSelectedProject: (id) => set({ selectedProjectId: id }),
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
  
  addWikiPage: (page) => set((state) => ({ wikiPages: [...state.wikiPages, page] })),
  
  updateWikiPage: (pageId, content) => set((state) => ({
    wikiPages: state.wikiPages.map((page) =>
      page.id === pageId ? { ...page, content, updatedAt: new Date() } : page
    ),
  })),
  
  updateMemo: (content) => set((state) => ({
    memo: { ...state.memo, content, updatedAt: new Date() },
  })),
}));
