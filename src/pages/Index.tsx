import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { KanbanBoard } from "@/components/KanbanBoard";
import { WikiEditor } from "@/components/WikiEditor";
import { MemoEditor } from "@/components/MemoEditor";
import { IssuesView } from "@/components/IssuesView";
import { DailyLogView } from "@/components/DailyLogView";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { Plus } from "lucide-react";
import { Issue, Task } from "@/types/workspace";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppInput } from "@/components/ui/app-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Index = () => {
  const {
    activeTab,
    selectedProjectId,
    projects,
    addTask,
    addIssue,
    setActiveTab,
    hydrate,
    isHydrated,
    issues,
  } = useWorkspaceStore();
  const location = useLocation();
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
  });
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const taskSubmitLock = useRef(false);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "medium" as Issue["priority"],
    status: "todo" as Issue["status"],
  });
  const [isIssueSubmitting, setIsIssueSubmitting] = useState(false);
  const issueSubmitLock = useRef(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Keyboard shortcut handlers
  const handleNewItem = useCallback(() => {
    if (!selectedProjectId) return;
    switch (activeTab) {
      case "kanban":
        setIsTaskDialogOpen(true);
        break;
      case "issues":
        setIsIssueDialogOpen(true);
        break;
      case "wiki":
        window.dispatchEvent(new CustomEvent("shortcut:new-wiki-page"));
        break;
      case "memo":
        window.dispatchEvent(new CustomEvent("shortcut:new-memo"));
        break;
      default:
        break;
    }
  }, [activeTab, selectedProjectId]);

  useKeyboardShortcuts({
    onNewItem: handleNewItem,
    onTabChange: setActiveTab,
    onShowHelp: () => setIsHelpModalOpen(true),
    enabled: !!selectedProjectId,
  });

  const handleAddTask = async () => {
    if (!selectedProjectId || !newTask.title.trim()) {
      return;
    }
    if (taskSubmitLock.current) {
      return;
    }
    taskSubmitLock.current = true;
    setIsTaskSubmitting(true);
    try {
      const created = await addTask({
        id: Date.now().toString(),
        projectId: selectedProjectId,
        title: newTask.title,
        description: newTask.description,
        status: "backlog",
        priority: newTask.priority,
        createdAt: new Date(),
      });
      if (created) {
        setNewTask({ title: "", description: "", priority: "medium" });
        setIsTaskDialogOpen(false);
      }
    } finally {
      setIsTaskSubmitting(false);
      taskSubmitLock.current = false;
    }
  };

  const handleAddIssue = async () => {
    if (!selectedProjectId || !newIssue.title.trim()) {
      return;
    }
    if (issueSubmitLock.current) {
      return;
    }
    issueSubmitLock.current = true;

    setIsIssueSubmitting(true);
    try {
      // Calculate next issue number (incremental)
      const existingNumbers = issues
        .map((issue) => parseInt(issue.id, 10))
        .filter((num) => !isNaN(num));
      const nextNumber =
        existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

      const created = await addIssue({
        id: nextNumber.toString(),
        projectId: selectedProjectId,
        title: newIssue.title,
        description: newIssue.description,
        status: newIssue.status,
        priority: newIssue.priority,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (created) {
        setNewIssue({
          title: "",
          description: "",
          priority: "medium",
          status: "todo",
        });
        setIsIssueDialogOpen(false);
      }
    } finally {
      setIsIssueSubmitting(false);
      issueSubmitLock.current = false;
    }
  };

  const renderContent = () => {
    if (!selectedProjectId) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome to Workspace
            </h2>
            <p className="text-muted-foreground max-w-md">
              Select a project from the sidebar to view its Kanban board, Wiki,
              and Memo.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "kanban":
        return <KanbanBoard />;
      case "wiki":
        return <WikiEditor />;
      case "memo":
        return <MemoEditor />;
      case "issues":
        return <IssuesView onAddIssue={() => setIsIssueDialogOpen(true)} />;
      case "calendar":
        return <DailyLogView />;
      default:
        return <KanbanBoard />;
    }
  };

  useEffect(() => {
    switch (location.pathname) {
      case "/wiki":
        setActiveTab("wiki");
        break;
      case "/memo":
        setActiveTab("memo");
        break;
      case "/issues":
        setActiveTab("issues");
        break;
      case "/calendar":
        setActiveTab("calendar");
        break;
      default:
        setActiveTab("kanban");
        break;
    }
  }, [location.pathname, setActiveTab]);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [hydrate, isHydrated]);

  return (
    <MainLayout>
      <div className={cn("flex flex-1 min-h-0 flex-col")}>
        {/* Header */}
        {selectedProjectId && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {selectedProject?.name || "Workspace"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedProject?.description || "Select a project"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Task */}
              {activeTab === "kanban" && (
                <>
                  <Button
                    onClick={() => setIsTaskDialogOpen(true)}
                    size="sm"
                    className="px-4"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Task</span>
                  </Button>
                  <Dialog
                    open={isTaskDialogOpen}
                    onOpenChange={setIsTaskDialogOpen}
                  >
                    <DialogContent
                      className="bg-popover border-border"
                      onKeyDown={(e) => {
                        if (e.defaultPrevented) {
                          return;
                        }
                        if (e.key === "Enter" && !e.shiftKey) {
                          if (isTaskSubmitting) {
                            return;
                          }
                          e.preventDefault();
                          handleAddTask();
                        }
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <AppInput
                          placeholder="Task title"
                          value={newTask.title}
                          onChange={(e) =>
                            setNewTask({ ...newTask, title: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              if (isTaskSubmitting) {
                                return;
                              }
                              e.preventDefault();
                              handleAddTask();
                            }
                          }}
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newTask.description}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              description: e.target.value,
                            })
                          }
                          className={cn("bg-input border-border")}
                        />
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: Task["priority"]) =>
                            setNewTask({ ...newTask, priority: value })
                          }
                        >
                          <SelectTrigger
                            className={cn("bg-input border-border")}
                          >
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">
                              Medium Priority
                            </SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAddTask}
                          className="w-full"
                          disabled={isTaskSubmitting}
                        >
                          Create Task
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}

              {/* Add Issue */}
              {activeTab === "issues" && (
                <>
                  <Button
                    onClick={() => setIsIssueDialogOpen(true)}
                    size="sm"
                    className="px-4"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Issue</span>
                  </Button>
                  <Dialog
                    open={isIssueDialogOpen}
                    onOpenChange={setIsIssueDialogOpen}
                  >
                    <DialogContent
                      className="bg-popover border-border"
                      onKeyDown={(e) => {
                        if (e.defaultPrevented) {
                          return;
                        }
                        if (e.key === "Enter" && !e.shiftKey) {
                          if (isIssueSubmitting) {
                            return;
                          }
                          e.preventDefault();
                          handleAddIssue();
                        }
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>New Issue</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <AppInput
                          placeholder="Issue title"
                          value={newIssue.title}
                          onChange={(e) =>
                            setNewIssue({ ...newIssue, title: e.target.value })
                          }
                        />
                        <Textarea
                          placeholder="Description (optional)"
                          value={newIssue.description}
                          onChange={(e) =>
                            setNewIssue({
                              ...newIssue,
                              description: e.target.value,
                            })
                          }
                          className={cn("bg-input border-border")}
                        />
                        <Select
                          value={newIssue.status}
                          onValueChange={(value: Issue["status"]) =>
                            setNewIssue({ ...newIssue, status: value })
                          }
                        >
                          <SelectTrigger
                            className={cn("bg-input border-border")}
                          >
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in-progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={newIssue.priority}
                          onValueChange={(value: Issue["priority"]) =>
                            setNewIssue({ ...newIssue, priority: value })
                          }
                        >
                          <SelectTrigger
                            className={cn("bg-input border-border")}
                          >
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">
                              Medium Priority
                            </SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAddIssue}
                          className="w-full"
                          disabled={isIssueSubmitting}
                        >
                          Create Issue
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </header>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">{renderContent()}</div>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsModal
        open={isHelpModalOpen}
        onOpenChange={setIsHelpModalOpen}
      />
    </MainLayout>
  );
};

export default Index;
