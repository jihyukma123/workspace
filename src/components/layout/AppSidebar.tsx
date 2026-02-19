import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  BookOpen,
  StickyNote,
  AlertCircle,
  CalendarDays,
  Trash2,
  ChevronDown,
  FolderKanban,
  Check,
  Plus,
  MessageSquare,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppInput } from "@/components/ui/app-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const menuItems = [
  { id: "board", label: "Kanban Board", icon: LayoutGrid, path: "/" },
  { id: "wiki", label: "Wiki", icon: BookOpen, path: "/wiki" },
  { id: "memo", label: "Memo", icon: StickyNote, path: "/memo" },
  { id: "issues", label: "Issues", icon: AlertCircle, path: "/issues" },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    path: "/calendar",
  },
  { id: "trash", label: "Trash", icon: Trash2, path: "/trash" },
] as const;

const getProjectColor = (index: number) => {
  const colors = ["bg-primary", "bg-status-progress", "bg-status-done"];
  return colors[index % colors.length];
};

export function AppSidebar() {
  const { projects, selectedProjectId, setSelectedProject, addProject } =
    useWorkspaceStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isProjectSubmitting, setIsProjectSubmitting] = useState(false);
  const projectSubmitLock = useRef(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  const feedbackLimit = 1000;

  const getFeedbackId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || projects[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }

      const shortcutIndex = Number.parseInt(event.key, 10) - 1;
      if (!Number.isInteger(shortcutIndex)) {
        return;
      }

      const targetMenu = menuItems[shortcutIndex];
      if (!targetMenu) {
        return;
      }

      if (location.pathname === targetMenu.path) {
        return;
      }

      event.preventDefault();
      navigate(targetMenu.path);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location.pathname, navigate]);

  const handleAddProject = async () => {
    if (newProjectName.trim()) {
      if (projectSubmitLock.current) {
        return;
      }
      projectSubmitLock.current = true;
      setIsProjectSubmitting(true);
      try {
        const created = await addProject({
          id: Date.now().toString(),
          name: newProjectName,
          description: newProjectDesc,
          createdAt: new Date(),
        });
        if (created) {
          setNewProjectName("");
          setNewProjectDesc("");
          setIsOpen(false);
        }
      } finally {
        setIsProjectSubmitting(false);
        projectSubmitLock.current = false;
      }
    }
  };

  const handleSubmitFeedback = async () => {
    if (isFeedbackSubmitting) {
      return;
    }
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setFeedbackError("Please enter your feedback.");
      return;
    }
    if (!window.workspaceApi?.feedback?.create) {
      setFeedbackError("Feedback service is unavailable.");
      return;
    }
    setFeedbackError("");
    setIsFeedbackSubmitting(true);
    try {
      const result = await window.workspaceApi.feedback.create({
        id: getFeedbackId(),
        body: trimmed,
        createdAt: Date.now(),
      });
      if (result.ok === false) {
        setFeedbackError(result.error.message || "Failed to save feedback.");
        return;
      }
      setFeedbackText("");
      setIsFeedbackOpen(false);
      toast({
        title: "Thanks for the feedback.",
        description: "Your note was saved locally.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save feedback.";
      setFeedbackError(message);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const handleFeedbackOpenChange = (nextOpen: boolean) => {
    setIsFeedbackOpen(nextOpen);
    if (!nextOpen) {
      setFeedbackError("");
      setIsFeedbackSubmitting(false);
    }
  };

  return (
    <header className={cn("border-b border-sidebar-border bg-sidebar")}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 px-4 py-3",
          "md:flex-nowrap"
        )}
      >
        <div className={cn("flex items-center gap-2 shrink-0")}>
          <div
            className={cn(
              "w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
            )}
          >
            <FolderKanban className={cn("w-4 h-4 text-primary-foreground")} />
          </div>
          <div className={cn("leading-tight")}>
            <p className={cn("text-sm font-semibold text-sidebar-accent-foreground")}>
              Workspace
            </p>
            <p className={cn("text-[11px] text-sidebar-muted")}>
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className={cn("min-w-[240px] flex-1")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="sidebar"
                className={cn(
                  "w-full h-9 justify-between px-3 rounded-lg group",
                  "text-sm"
                )}
              >
                <div className={cn("flex items-center gap-2 min-w-0")}>
                  {selectedProject ? (
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full flex-shrink-0",
                        getProjectColor(projects.indexOf(selectedProject))
                      )}
                    />
                  ) : (
                    <div className={cn("w-2.5 h-2.5 rounded-full bg-muted")} />
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium text-sidebar-accent-foreground truncate"
                    )}
                  >
                    {selectedProject?.name || "No Project"}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-sidebar-muted",
                    "group-hover:text-sidebar-foreground transition-colors flex-shrink-0"
                  )}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn("w-56 bg-popover border border-border shadow-lg")}
              align="start"
              sideOffset={4}
            >
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => void setSelectedProject(project.id)}
                  className={cn(
                    "flex items-center justify-between cursor-pointer"
                  )}
                >
                  <div className={cn("flex items-center gap-3")}>
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        getProjectColor(projects.indexOf(project))
                      )}
                    />
                    <span className={cn("text-sm")}>{project.name}</span>
                  </div>
                  {selectedProjectId === project.id && (
                    <Check className={cn("w-4 h-4 text-primary")} />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={cn("ml-auto flex items-center gap-1 shrink-0")}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-sidebar-muted transition-all duration-200",
              "hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
            onClick={() => navigate("/settings")}
          >
            <Settings className={cn("h-4 w-4")} />
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 text-sidebar-muted transition-all duration-200",
                  "hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Plus className={cn("h-4 w-4")} />
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn("bg-popover border-border")}
              onKeyDown={(event) => {
                if (event.defaultPrevented) {
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  if (isProjectSubmitting) {
                    return;
                  }
                  event.preventDefault();
                  void handleAddProject();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>New Project</DialogTitle>
              </DialogHeader>
              <div className={cn("space-y-4 pt-4")}>
                <AppInput
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newProjectDesc}
                  onChange={(event) => setNewProjectDesc(event.target.value)}
                  className={cn("bg-input border-border")}
                />
                <Button
                  onClick={handleAddProject}
                  className={cn(
                    "w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  disabled={isProjectSubmitting}
                >
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isFeedbackOpen} onOpenChange={handleFeedbackOpenChange}>
            <DialogTrigger asChild>
              <Button
                variant="sidebar"
                size="sm"
                className={cn("h-8 gap-2 px-3 whitespace-nowrap")}
              >
                <MessageSquare className={cn("h-4 w-4")} />
                <span className={cn("hidden sm:inline")}>Feedback</span>
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn("bg-popover border-border")}
              onKeyDown={(event) => {
                if (event.defaultPrevented) {
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSubmitFeedback();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle
                  className={cn("font-mono text-lg font-bold text-primary")}
                >
                  Service Feedback
                </DialogTitle>
              </DialogHeader>
              <div className={cn("space-y-4 pt-4")}>
                <Textarea
                  placeholder="Share a bug, missing feature, or improvement idea..."
                  value={feedbackText}
                  maxLength={feedbackLimit}
                  className={cn(feedbackError ? "border-destructive" : "")}
                  onChange={(event) => {
                    setFeedbackText(event.target.value);
                    if (feedbackError) {
                      setFeedbackError("");
                    }
                  }}
                />
                <div
                  className={cn(
                    "flex items-center justify-between text-xs text-muted-foreground"
                  )}
                >
                  <span>
                    {feedbackText.length} / {feedbackLimit}
                  </span>
                  {feedbackError ? (
                    <span className={cn("text-destructive")}>{feedbackError}</span>
                  ) : (
                    <span>Stored locally in your database.</span>
                  )}
                </div>
                <Button
                  onClick={handleSubmitFeedback}
                  className={cn("w-full")}
                  disabled={!feedbackText.trim() || isFeedbackSubmitting}
                >
                  {isFeedbackSubmitting ? "Saving..." : "Submit Feedback"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className={cn("border-t border-sidebar-border/70 px-4 py-2")}>
        <nav className={cn("w-full")}>
          <div
            className={cn(
              "flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1"
            )}
          >
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "h-9 shrink-0 rounded-lg px-3 gap-2",
                    isActive
                      ? "bg-sidebar-primary/10 text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  variant="sidebarNav"
                  size="sm"
                >
                  <item.icon className={cn("w-4 h-4")} />
                  <span>{item.label}</span>
                  <kbd
                    className={cn(
                      "hidden sm:inline-flex items-center justify-center",
                      "h-6 min-w-[34px] rounded-md border border-sidebar-border",
                      "bg-sidebar-accent/70 px-2 font-semibold",
                      "text-sidebar-accent-foreground"
                    )}
                  >
                    <span className={cn("text-sm leading-none")}>⌘</span>
                    <span className={cn("text-xs leading-none")}>{index + 1}</span>
                  </kbd>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
