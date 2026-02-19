import { create } from "zustand";
import {
  Project,
  Task,
  WikiPage,
  MemoState,
  Issue,
  Memo,
  Reminder,
  DailyLog,
  IssueComment,
} from "@/types/workspace";
import {
  IssueRecord,
  IssueCommentRecord,
  MemoRecord,
  ProjectRecord,
  DailyLogRecord,
  ReminderRecord,
  Result,
  TaskRecord,
  WikiPageRecord,
} from "@/types/ipc";

interface WorkspaceState extends MemoState {
  projects: Project[];
  selectedProjectId: string | null;
  tasks: Task[];
  issues: Issue[];
  issueCommentsByIssueId: Record<string, IssueComment[]>;
  wikiPages: WikiPage[];
  reminders: Reminder[];
  dailyLogs: DailyLog[];
  activeTab: "kanban" | "wiki" | "memo" | "issues" | "calendar";
  isHydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  setSelectedProject: (id: string | null) => Promise<void>;
  setActiveTab: (
    tab: "kanban" | "wiki" | "memo" | "issues" | "calendar",
  ) => void;
  addProject: (project: Project) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
  addTask: (task: Task) => Promise<Task | null>;
  updateTask: (
    taskId: string,
    updates: Partial<Pick<Task, "title" | "details" | "priority" | "dueDate">>,
  ) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task["status"]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addIssue: (issue: Issue) => Promise<Issue | null>;
  updateIssue: (
    issueId: string,
    updates: Partial<
      Pick<Issue, "title" | "status" | "priority" | "dueDate">
    >,
  ) => Promise<void>;
  updateIssueStatus: (
    issueId: string,
    status: Issue["status"],
  ) => Promise<void>;
  deleteIssue: (issueId: string) => Promise<boolean>;
  listIssueComments: (issueId: string) => Promise<IssueComment[]>;
  addIssueComment: (input: {
    issueId: string;
    body: string;
  }) => Promise<IssueComment | null>;
  deleteIssueComment: (input: {
    issueId: string;
    commentId: string;
  }) => Promise<void>;
  addWikiPage: (page: WikiPage) => Promise<WikiPage | null>;
  updateWikiPage: (
    pageId: string,
    updates: Partial<
      Pick<WikiPage, "title" | "content" | "parentId" | "position">
    >,
  ) => Promise<void>;
  updateWikiDraft: (
    pageId: string,
    updates: Partial<Pick<WikiPage, "title" | "content">>,
  ) => void;
  saveWikiPage: (
    pageId: string,
    updates: Pick<WikiPage, "title" | "content">,
  ) => Promise<void>;
  moveWikiPage: (
    pageId: string,
    parentId: string | null,
    position: number,
  ) => Promise<void>;
  deleteWikiPage: (pageId: string) => Promise<boolean>;
  setSelectedMemoId: (id: string | null) => void;
  addMemo: (memo: Memo) => Promise<Memo | null>;
  updateMemoDraft: (memoId: string, content: string) => void;
  saveMemo: (memoId: string, content: string) => Promise<void>;
  revertMemo: (
    memoId: string,
    snapshot: Pick<Memo, "content" | "updatedAt" | "status">,
  ) => void;
  deleteMemo: (memoId: string) => Promise<boolean>;
  addDailyLog: (log: DailyLog) => Promise<DailyLog | null>;
  updateDailyLog: (
    logId: string,
    updates: Pick<DailyLog, "content">,
  ) => Promise<boolean>;
  deleteDailyLog: (logId: string) => Promise<boolean>;
  addReminder: (reminder: Reminder) => Promise<Reminder | null>;
  updateReminder: (
    reminderId: string,
    updates: Partial<Pick<Reminder, "text" | "status" | "remindAt">>,
  ) => Promise<boolean>;
  deleteReminder: (reminderId: string) => Promise<boolean>;
}

const mapProject = (record: ProjectRecord): Project => ({
  id: record.id,
  name: record.name,
  description: null,
  createdAt: new Date(record.createdAt),
});

const mapTask = (record: TaskRecord): Task => ({
  id: record.id,
  projectId: record.projectId,
  title: record.title,
  details: record.details ?? null,
  status: record.status,
  priority: record.priority,
  createdAt: new Date(record.createdAt),
  updatedAt: record.updatedAt ? new Date(record.updatedAt) : null,
  position: record.position,
  dueDate: record.dueDate ? new Date(record.dueDate) : null,
});

const mapIssue = (record: IssueRecord): Issue => ({
  id: record.id,
  projectId: record.projectId,
  title: record.title,
  status: record.status,
  priority: record.priority,
  createdAt: new Date(record.createdAt),
  updatedAt: new Date(record.updatedAt),
  dueDate: record.dueDate ? new Date(record.dueDate) : null,
});

const mapIssueComment = (record: IssueCommentRecord): IssueComment => ({
  id: record.id,
  issueId: record.issueId,
  body: record.body,
  createdAt: new Date(record.createdAt),
});

const mapWikiPage = (record: WikiPageRecord): WikiPage => ({
  id: record.id,
  projectId: record.projectId,
  title: record.title,
  content: record.content,
  parentId: record.parentId,
  children: [],
  createdAt: new Date(record.createdAt),
  updatedAt: new Date(record.updatedAt),
  position: record.position,
  status: "saved",
});

const mapMemo = (record: MemoRecord): Memo => ({
  id: record.id,
  projectId: record.projectId,
  title: record.title,
  content: record.content,
  createdAt: new Date(record.createdAt),
  updatedAt: record.updatedAt ? new Date(record.updatedAt) : null,
  status: "saved",
});

const mapDailyLog = (record: DailyLogRecord): DailyLog => ({
  id: record.id,
  projectId: record.projectId,
  date: record.date,
  content: record.content,
  createdAt: new Date(record.createdAt),
  updatedAt: record.updatedAt ? new Date(record.updatedAt) : null,
});

const mapReminder = (record: ReminderRecord): Reminder => ({
  id: record.id,
  projectId: record.projectId,
  text: record.text,
  status: record.status,
  createdAt: new Date(record.createdAt),
  updatedAt: record.updatedAt ? new Date(record.updatedAt) : null,
  remindAt: record.remindAt ? new Date(record.remindAt) : null,
});

const getMemoTitleFromContent = (content: string) => {
  const firstLine = content.split(/\r?\n/)[0]?.trim() ?? "";
  return firstLine.length > 0 ? firstLine : "Untitled Memo";
};

const reportError = (result: Result<unknown>, context: string) => {
  if (result.ok === false) {
    console.error(`[workspaceApi] ${context}:`, result.error);
  }
};

const ensureApi = () => {
  if (!window.workspaceApi) {
    console.warn("[workspaceApi] preload bridge unavailable");
    return null;
  }
  return window.workspaceApi;
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  tasks: [],
  issues: [],
  issueCommentsByIssueId: {},
  wikiPages: [],
  reminders: [],
  dailyLogs: [],
  memos: [],
  selectedMemoId: null,
  activeTab: "kanban",
  isHydrated: false,

  hydrate: async () => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.projects.list();
    if (!result.ok) {
      reportError(result, "projects:list");
      return;
    }
    const projects = result.data.map(mapProject);
    const nextProjectId = projects[0]?.id ?? null;
    set({ projects, selectedProjectId: nextProjectId, isHydrated: true });
    if (nextProjectId) {
      await get().setSelectedProject(nextProjectId);
    }
  },

  setSelectedProject: async (id) => {
    const api = ensureApi();
    if (!api) {
      set({
        selectedProjectId: id,
        tasks: [],
        issues: [],
        issueCommentsByIssueId: {},
        wikiPages: [],
        reminders: [],
        dailyLogs: [],
        memos: [],
        selectedMemoId: null,
      });
      return;
    }
    if (!id) {
      set({
        selectedProjectId: null,
        tasks: [],
        issues: [],
        issueCommentsByIssueId: {},
        wikiPages: [],
        reminders: [],
        dailyLogs: [],
        memos: [],
        selectedMemoId: null,
      });
      return;
    }

    const [
      tasksResult,
      issuesResult,
      wikiResult,
      memoResult,
      reminderResult,
      dailyLogResult,
    ] = await Promise.all([
      api.tasks.list({ projectId: id }),
      api.issues.list({ projectId: id }),
      api.wiki.list({ projectId: id }),
      api.memos.list({ projectId: id }),
      api.reminders.list({ projectId: id }),
      api.dailyLogs.list({ projectId: id }),
    ]);

    if (!tasksResult.ok) {
      reportError(tasksResult, "tasks:list");
    }
    if (!issuesResult.ok) {
      reportError(issuesResult, "issues:list");
    }
    if (!wikiResult.ok) {
      reportError(wikiResult, "wiki:list");
    }
    if (!memoResult.ok) {
      reportError(memoResult, "memos:list");
    }
    if (!reminderResult.ok) {
      reportError(reminderResult, "reminders:list");
    }
    if (!dailyLogResult.ok) {
      reportError(dailyLogResult, "dailyLogs:list");
    }

    const tasks = tasksResult.ok ? tasksResult.data.map(mapTask) : [];
    const issues = issuesResult.ok ? issuesResult.data.map(mapIssue) : [];
    const wikiPages = wikiResult.ok ? wikiResult.data.map(mapWikiPage) : [];
    const memos = memoResult.ok ? memoResult.data.map(mapMemo) : [];
    const reminders = reminderResult.ok
      ? reminderResult.data.map(mapReminder)
      : [];
    const dailyLogs = dailyLogResult.ok
      ? dailyLogResult.data.map(mapDailyLog)
      : [];
    const nextMemoId = memos[0]?.id ?? null;

    set({
      selectedProjectId: id,
      tasks,
      issues,
      issueCommentsByIssueId: {},
      wikiPages,
      reminders,
      dailyLogs,
      memos,
      selectedMemoId: nextMemoId,
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  addProject: async (project) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const hadSelection = get().selectedProjectId;
    const payload: ProjectRecord = {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt.getTime(),
    };
    const result = await api.projects.create(payload);
    if (!result.ok) {
      reportError(result, "projects:create");
      return null;
    }
    const created = mapProject(result.data);
    set((state) => ({
      projects: [...state.projects, created],
      selectedProjectId: state.selectedProjectId ?? created.id,
    }));
    const seedTaskResult = await api.tasks.create({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: created.id,
      title: "Test task",
      status: "backlog",
      priority: "medium",
      createdAt: Date.now(),
    });
    if (!seedTaskResult.ok) {
      reportError(seedTaskResult, "tasks:create");
    }
    if (!hadSelection) {
      await get().setSelectedProject(created.id);
    }
    return created;
  },

  deleteProject: async (projectId) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.projects.delete({ id: projectId });
    if (!result.ok) {
      reportError(result, "projects:delete");
      return;
    }
    const listResult = await api.projects.list();
    if (!listResult.ok) {
      reportError(listResult, "projects:list");
      return;
    }
    const previousProjects = get().projects;
    const projects = listResult.data.map(mapProject);
    const currentSelectedId = get().selectedProjectId;
    const hasSelected = projects.some(
      (project) => project.id === currentSelectedId,
    );
    let nextSelectedId = currentSelectedId;

    if (currentSelectedId === projectId || !hasSelected) {
      const deletedIndex = previousProjects.findIndex(
        (project) => project.id === projectId,
      );
      nextSelectedId =
        deletedIndex >= 0
          ? (projects[deletedIndex]?.id ??
            projects[deletedIndex - 1]?.id ??
            null)
          : (projects[0]?.id ?? null);
    }

    set({ projects, selectedProjectId: nextSelectedId });
    await get().setSelectedProject(nextSelectedId);
  },

  addTask: async (task) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload = {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      details: task.details ?? null,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt.getTime(),
      position: task.position ?? null,
      dueDate: task.dueDate ? task.dueDate.getTime() : null,
    };
    const result = await api.tasks.create(payload);
    if (!result.ok) {
      reportError(result, "tasks:create");
      return null;
    }
    const created = mapTask(result.data);
    set((state) => ({ tasks: [...state.tasks, created] }));
    return created;
  },

  updateTask: async (taskId, updates) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const apiUpdates = {
      ...updates,
      details:
        updates.details !== undefined
          ? updates.details?.trim()
            ? updates.details.trim()
            : null
          : undefined,
      dueDate:
        updates.dueDate !== undefined
          ? updates.dueDate
            ? updates.dueDate.getTime()
            : null
          : undefined,
    };
    const result = await api.tasks.update({ id: taskId, updates: apiUpdates });
    if (!result.ok) {
      reportError(result, "tasks:update");
      return;
    }
    const updated = mapTask(result.data);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },

  updateTaskStatus: async (taskId, status) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.tasks.update({ id: taskId, updates: { status } });
    if (!result.ok) {
      reportError(result, "tasks:update");
      return;
    }
    const updated = mapTask(result.data);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? updated : task)),
    }));
  },

  deleteTask: async (taskId) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.tasks.delete({ id: taskId });
    if (!result.ok) {
      reportError(result, "tasks:delete");
      return;
    }
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));
  },

  addIssue: async (issue) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload: IssueRecord = {
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.createdAt.getTime(),
      updatedAt: issue.updatedAt.getTime(),
      dueDate: issue.dueDate ? issue.dueDate.getTime() : null,
    };
    const result = await api.issues.create(payload);
    if (!result.ok) {
      reportError(result, "issues:create");
      return null;
    }
    const created = mapIssue(result.data);
    set((state) => ({ issues: [...state.issues, created] }));
    return created;
  },

  updateIssue: async (issueId, updates) => {
    const api = ensureApi();
    if (!api) {
      return;
    }

    const result = await api.issues.update({
      id: issueId,
      updates: {
        title: updates.title,
        status: updates.status,
        priority: updates.priority,
        dueDate:
          updates.dueDate !== undefined
            ? updates.dueDate
              ? updates.dueDate.getTime()
              : null
            : undefined,
      },
    });
    if (!result.ok) {
      reportError(result, "issues:update");
      return;
    }
    const updated = mapIssue(result.data);
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === issueId ? updated : issue,
      ),
    }));
  },

  updateIssueStatus: async (issueId, status) => {
    await get().updateIssue(issueId, { status });
  },

  deleteIssue: async (issueId) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const result = await api.issues.delete({ id: issueId });
    if (!result.ok) {
      reportError(result, "issues:delete");
      return false;
    }
    set((state) => ({
      issues: state.issues.filter((issue) => issue.id !== issueId),
    }));
    return true;
  },

  listIssueComments: async (issueId) => {
    const api = ensureApi();
    if (!api) {
      return [];
    }
    const result = await api.issueComments.list({ issueId });
    if (!result.ok) {
      reportError(result, "issueComments:list");
      return [];
    }
    const comments = result.data.map(mapIssueComment);
    set((state) => ({
      issueCommentsByIssueId: {
        ...state.issueCommentsByIssueId,
        [issueId]: comments,
      },
    }));
    return comments;
  },

  addIssueComment: async ({ issueId, body }) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload: IssueCommentRecord = {
      id: crypto.randomUUID(),
      issueId,
      body,
      createdAt: Date.now(),
    };
    const result = await api.issueComments.create(payload);
    if (!result.ok) {
      reportError(result, "issueComments:create");
      return null;
    }
    const created = mapIssueComment(result.data);
    set((state) => {
      const existing = state.issueCommentsByIssueId[issueId] ?? [];
      return {
        issueCommentsByIssueId: {
          ...state.issueCommentsByIssueId,
          [issueId]: [...existing, created],
        },
      };
    });
    return created;
  },

  deleteIssueComment: async ({ issueId, commentId }) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.issueComments.delete({ id: commentId });
    if (!result.ok) {
      reportError(result, "issueComments:delete");
      return;
    }
    set((state) => ({
      issueCommentsByIssueId: {
        ...state.issueCommentsByIssueId,
        [issueId]: (state.issueCommentsByIssueId[issueId] ?? []).filter(
          (comment) => comment.id !== commentId,
        ),
      },
    }));
  },

  addWikiPage: async (page) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload = {
      id: page.id,
      projectId: page.projectId,
      title: page.title,
      content: page.content,
      parentId: page.parentId,
      createdAt: page.createdAt.getTime(),
      updatedAt: page.updatedAt.getTime(),
      position: page.position ?? null,
    };
    const result = await api.wiki.create(payload);
    if (!result.ok) {
      reportError(result, "wiki:create");
      return null;
    }
    const created = mapWikiPage(result.data);
    set((state) => ({ wikiPages: [...state.wikiPages, created] }));
    return created;
  },

  updateWikiPage: async (pageId, updates) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.wiki.update({ id: pageId, updates });
    if (!result.ok) {
      reportError(result, "wiki:update");
      return;
    }
    const updated = mapWikiPage(result.data);
    set((state) => ({
      wikiPages: state.wikiPages.map((page) =>
        page.id === pageId ? updated : page,
      ),
    }));
  },

  updateWikiDraft: (pageId, updates) =>
    set((state) => ({
      wikiPages: state.wikiPages.map((page) => {
        if (page.id !== pageId) {
          return page;
        }
        const nextTitle = updates.title ?? page.title;
        const nextContent = updates.content ?? page.content;
        if (nextTitle === page.title && nextContent === page.content) {
          return page;
        }
        return {
          ...page,
          title: nextTitle,
          content: nextContent,
          status: "unsaved",
        };
      }),
    })),

  saveWikiPage: async (pageId, updates) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const title = updates.title.trim();
    const content = updates.content;
    set((state) => ({
      wikiPages: state.wikiPages.map((page) =>
        page.id === pageId ? { ...page, status: "saving" } : page,
      ),
    }));

    const result = await api.wiki.update({
      id: pageId,
      updates: { title, content },
    });

    if (!result.ok) {
      reportError(result, "wiki:update");
      set((state) => ({
        wikiPages: state.wikiPages.map((page) =>
          page.id === pageId ? { ...page, status: "unsaved" } : page,
        ),
      }));
      return;
    }

    const updated = mapWikiPage(result.data);
    set((state) => ({
      wikiPages: state.wikiPages.map((page) => {
        if (page.id !== pageId) {
          return page;
        }
        // Keep it dirty if edits changed while this save request was in flight.
        const titleMatches = page.title.trim() === title;
        const contentMatches = page.content === content;
        if (!titleMatches || !contentMatches) {
          return { ...page, status: "unsaved" };
        }
        return {
          ...page,
          title: updated.title,
          content: updated.content,
          updatedAt: updated.updatedAt,
          status: "saved",
        };
      }),
    }));
  },

  moveWikiPage: async (pageId, parentId, position) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const result = await api.wiki.update({
      id: pageId,
      updates: { parentId, position },
    });
    if (!result.ok) {
      reportError(result, "wiki:move");
      return;
    }
    const updated = mapWikiPage(result.data);
    set((state) => ({
      wikiPages: state.wikiPages.map((page) => {
        if (page.id !== pageId) {
          return page;
        }
        if (page.status !== "saved") {
          return {
            ...page,
            parentId: updated.parentId,
            position: updated.position,
            updatedAt: updated.updatedAt,
          };
        }
        return updated;
      }),
    }));
  },

  deleteWikiPage: async (pageId) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const result = await api.wiki.delete({ id: pageId });
    if (!result.ok) {
      reportError(result, "wiki:delete");
      return false;
    }
    set((state) => ({
      wikiPages: state.wikiPages.filter((page) => page.id !== pageId),
    }));
    return true;
  },

  setSelectedMemoId: (id) => set({ selectedMemoId: id }),

  addMemo: async (memo) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload: MemoRecord = {
      id: memo.id,
      projectId: memo.projectId,
      title: memo.title,
      content: memo.content,
      createdAt: memo.createdAt.getTime(),
      updatedAt: memo.updatedAt ? memo.updatedAt.getTime() : null,
    };
    const result = await api.memos.create(payload);
    if (!result.ok) {
      reportError(result, "memos:create");
      return null;
    }
    const created = mapMemo(result.data);
    set((state) => ({
      memos: [...state.memos, { ...created, status: memo.status }],
      selectedMemoId: created.id,
    }));
    return created;
  },

  updateMemoDraft: (memoId, content) =>
    set((state) => ({
      memos: state.memos.map((memo) => {
        if (memo.id !== memoId) {
          return memo;
        }
        if (memo.content === content) {
          return memo;
        }
        return {
          ...memo,
          content,
          title: getMemoTitleFromContent(content),
          status: "unsaved",
        };
      }),
    })),

  saveMemo: async (memoId, content) => {
    const api = ensureApi();
    if (!api) {
      return;
    }
    const title = getMemoTitleFromContent(content);
    const savingAt = new Date();
    set((state) => ({
      memos: state.memos.map((memo) =>
        memo.id === memoId ? { ...memo, status: "saving" } : memo,
      ),
    }));

    const result = await api.memos.update({
      id: memoId,
      updates: { title, content, updatedAt: savingAt.getTime() },
    });

    if (!result.ok) {
      reportError(result, "memos:update");
      set((state) => ({
        memos: state.memos.map((memo) =>
          memo.id === memoId ? { ...memo, status: "unsaved" } : memo,
        ),
      }));
      return;
    }

    const updated = mapMemo(result.data);
    set((state) => ({
      memos: state.memos.map((memo) => {
        if (memo.id !== memoId) {
          return memo;
        }
        if (memo.content !== content) {
          return { ...memo, status: "unsaved" };
        }
        return {
          ...memo,
          title,
          updatedAt: updated.updatedAt,
          status: "saved",
        };
      }),
    }));
  },

  revertMemo: (memoId, snapshot) =>
    set((state) => ({
      memos: state.memos.map((memo) =>
        memo.id === memoId
          ? {
            ...memo,
            content: snapshot.content,
            title: getMemoTitleFromContent(snapshot.content),
            updatedAt: snapshot.updatedAt,
            status: snapshot.status,
          }
          : memo,
      ),
    })),

  deleteMemo: async (memoId) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const state = get();
    const memoToDelete = state.memos.find((memo) => memo.id === memoId);
    const projectId = memoToDelete?.projectId ?? state.selectedProjectId;
    const projectMemos = state.memos.filter(
      (memo) => memo.projectId === projectId,
    );
    const memoIndex = projectMemos.findIndex((memo) => memo.id === memoId);
    let nextSelectedMemoId = state.selectedMemoId;
    if (memoIndex !== -1) {
      if (projectMemos.length === 1) {
        nextSelectedMemoId = null;
      } else if (memoIndex > 0) {
        nextSelectedMemoId = projectMemos[memoIndex - 1].id;
      } else {
        nextSelectedMemoId = projectMemos[1]?.id ?? null;
      }
    }

    const result = await api.memos.delete({ id: memoId });
    if (!result.ok) {
      reportError(result, "memos:delete");
      return false;
    }

    set((current) => ({
      memos: current.memos.filter((memo) => memo.id !== memoId),
      selectedMemoId:
        current.selectedMemoId === memoId
          ? nextSelectedMemoId
          : current.selectedMemoId,
    }));
    return true;
  },

  addDailyLog: async (log) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload: DailyLogRecord = {
      id: log.id,
      projectId: log.projectId,
      date: log.date,
      content: log.content,
      createdAt: log.createdAt.getTime(),
      updatedAt: log.updatedAt ? log.updatedAt.getTime() : null,
    };
    const result = await api.dailyLogs.create(payload);
    if (!result.ok) {
      reportError(result, "dailyLogs:create");
      return null;
    }
    const created = mapDailyLog(result.data);
    set((state) => ({ dailyLogs: [...state.dailyLogs, created] }));
    return created;
  },

  updateDailyLog: async (logId, updates) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const result = await api.dailyLogs.update({
      id: logId,
      updates: {
        content: updates.content,
        updatedAt: Date.now(),
      },
    });
    if (!result.ok) {
      reportError(result, "dailyLogs:update");
      return false;
    }
    const updated = mapDailyLog(result.data);
    set((state) => ({
      dailyLogs: state.dailyLogs.map((log) =>
        log.id === logId ? updated : log,
      ),
    }));
    return true;
  },

  deleteDailyLog: async (logId) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const result = await api.dailyLogs.delete({ id: logId });
    if (!result.ok) {
      reportError(result, "dailyLogs:delete");
      return false;
    }
    set((state) => ({
      dailyLogs: state.dailyLogs.filter((log) => log.id !== logId),
    }));
    return true;
  },

  addReminder: async (reminder) => {
    const api = ensureApi();
    if (!api) {
      return null;
    }
    const payload: ReminderRecord = {
      id: reminder.id,
      projectId: reminder.projectId,
      text: reminder.text,
      status: reminder.status,
      createdAt: reminder.createdAt.getTime(),
      updatedAt: reminder.updatedAt ? reminder.updatedAt.getTime() : null,
      remindAt: reminder.remindAt ? reminder.remindAt.getTime() : null,
      notified: 0,
    };
    const result = await api.reminders.create(payload);
    if (!result.ok) {
      reportError(result, "reminders:create");
      return null;
    }
    const created = mapReminder(result.data);
    set((state) => ({ reminders: [...state.reminders, created] }));
    return created;
  },

  updateReminder: async (reminderId, updates) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const result = await api.reminders.update({
      id: reminderId,
      updates: {
        text: updates.text,
        status: updates.status,
        remindAt: updates.remindAt
          ? updates.remindAt.getTime()
          : updates.remindAt === null
            ? null
            : undefined,
        updatedAt: Date.now(),
      },
    });
    if (!result.ok) {
      reportError(result, "reminders:update");
      return false;
    }
    const updated = mapReminder(result.data);
    set((state) => ({
      reminders: state.reminders.map((reminder) =>
        reminder.id === reminderId ? updated : reminder,
      ),
    }));
    return true;
  },

  deleteReminder: async (reminderId) => {
    const api = ensureApi();
    if (!api) {
      return false;
    }
    const result = await api.reminders.delete({ id: reminderId });
    if (!result.ok) {
      reportError(result, "reminders:delete");
      return false;
    }
    set((state) => ({
      reminders: state.reminders.filter(
        (reminder) => reminder.id !== reminderId,
      ),
    }));
    return true;
  },
}));
